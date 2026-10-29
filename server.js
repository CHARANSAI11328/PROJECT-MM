const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '.env'), override: true }); } catch (e) {}
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db, dbRun, dbAll, dbGet, initDatabase, editionsDir, pagesDir } = require('./db');
const { processEdition } = require('./ingestion');
const { uploadFile, deleteFile } = require('./services/storage');
const { getOptimizedImage } = require('./services/image-optimizer');

const app = express();
const PORT = process.env.PORT || 5050;

// Production JWT Secret Fallback Check
const crypto = require('crypto');
const isProduction = process.env.NODE_ENV === 'production';
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (isProduction) {
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️ WARNING: JWT_SECRET not set in environment. Dynamically generated secure random key for this session.');
  } else {
    JWT_SECRET = 'mameka_mahodayam_newspaper_secret_key_2026';
  }
}

// Middleware Setup (50MB body-parser limit for high-resolution images & rich news publishing)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Minimal Architecture-Safe Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Production Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


// Serve Public Static Files & Admin Portal
const uploadsDir = path.join(__dirname, 'uploads');
const qrcode = require('qrcode');
const imagesDir = path.join(uploadsDir, 'images');
const reportersUploadDir = path.join(uploadsDir, 'reporters');
const qrUploadDir = path.join(uploadsDir, 'qr_codes');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(reportersUploadDir)) fs.mkdirSync(reportersUploadDir, { recursive: true });
  if (!fs.existsSync(qrUploadDir)) fs.mkdirSync(qrUploadDir, { recursive: true });
} catch (e) {
  // Safe fallback for read-only serverless filesystems
}

function getBaseServerUrl(reqOrBaseUrl) {
  let baseUrl = process.env.APP_BASE_URL || process.env.PUBLIC_URL;
  if (!baseUrl && process.env.RENDER_EXTERNAL_URL) {
    baseUrl = process.env.RENDER_EXTERNAL_URL;
  } else if (!baseUrl && process.env.VERCEL_URL) {
    baseUrl = 'https://' + process.env.VERCEL_URL;
  } else if (!baseUrl && process.env.RAILWAY_PUBLIC_DOMAIN) {
    baseUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  } else if (!baseUrl && process.env.RAILWAY_STATIC_URL) {
    baseUrl = `https://${process.env.RAILWAY_STATIC_URL}`;
  }
  if (!baseUrl && reqOrBaseUrl) {
    if (typeof reqOrBaseUrl === 'string') {
      baseUrl = reqOrBaseUrl;
    } else if (reqOrBaseUrl.get && reqOrBaseUrl.protocol) {
      const proto = reqOrBaseUrl.headers && reqOrBaseUrl.headers['x-forwarded-proto'] ? reqOrBaseUrl.headers['x-forwarded-proto'] : reqOrBaseUrl.protocol;
      baseUrl = `${proto}://${reqOrBaseUrl.get('host')}`;
    }
  }
  if (!baseUrl && isProduction) {
    baseUrl = process.env.VERCEL_URL ? ('https://' + process.env.VERCEL_URL) : 'https://project-mm-1.onrender.com';
  }
  return baseUrl ? baseUrl.replace(/\/$/, '') : `http://localhost:${PORT}`;
}

async function cleanupOrphanQRCodes() {
  try {
    if (!fs.existsSync(qrUploadDir)) return;
    const reportersList = await dbAll('SELECT id, press_id, name FROM reporters');
    const validReporters = new Set();
    reportersList.forEach(r => {
      if (r.id) validReporters.add(String(r.id));
      if (r.press_id) validReporters.add(String(r.press_id).trim());
      if (r.name) validReporters.add(String(r.name).replace(/[\\/:*?"<>|]/g, '_').trim());
    });
    const validEditions = new Set((await dbAll('SELECT id FROM editions')).map(e => String(e.id)));
    const validArticles = new Set((await dbAll('SELECT id FROM articles')).map(a => String(a.id)));

    const files = fs.readdirSync(qrUploadDir);
    for (const f of files) {
      if (!f.endsWith('.png')) continue;
      let shouldKeep = false;
      const repMatch = f.match(/^(?:Reporter_)?(.+)_QR\.png$/i);
      const edMatch = f.match(/^Edition_(.+)_QR\.png$/i);
      const artMatch = f.match(/^Article_(.+)_QR\.png$/i);

      if (repMatch) {
        if (validReporters.has(repMatch[1])) shouldKeep = true;
      }
      if (edMatch && validEditions.has(edMatch[1])) shouldKeep = true;
      if (artMatch && validArticles.has(artMatch[1])) shouldKeep = true;

      if (!shouldKeep) {
        try {
          fs.unlinkSync(path.join(qrUploadDir, f));
          console.log(`✓ [QR CLEANUP] Cleaned orphan QR file: ${f}`);
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('QR cleanup notice:', err.message);
  }
}

async function generateReporterQRCode(reporter, reqOrBaseUrl) {
  if (!reporter || !reporter.id || !reporter.name) return;
  try {
    const qrFilename = `Reporter_${reporter.id}_QR.png`;
    const qrPath = path.join(qrUploadDir, qrFilename);
    const baseUrl = getBaseServerUrl(reqOrBaseUrl);

    const profileUrl = `${baseUrl}/reporter-profile.html?id=${encodeURIComponent(reporter.id)}`;

    // High-Resolution 1000px with Level H (30% error correction) for PVC ID Card Printing
    await qrcode.toFile(qrPath, profileUrl, {
      width: 1000,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#be185d',
        light: '#ffffff'
      }
    });
    const qrRelativeUrl = `/uploads/qr_codes/${qrFilename}`;
    await dbRun('UPDATE reporters SET qr_code_url = ? WHERE id = ?', [qrRelativeUrl, reporter.id]);
    console.log(`✓ [QR GENERATOR] Created High-Res ID Card QR (300 DPI): ${qrFilename} -> ${profileUrl}`);
    return qrRelativeUrl;
  } catch (err) {
    console.error('Failed to generate reporter QR code:', err);
  }
}

async function generateEditionQRCode(edition, reqOrBaseUrl) {
  if (!edition || !edition.id) return;
  try {
    const qrFilename = `Edition_${edition.id}_QR.png`;
    const qrPath = path.join(qrUploadDir, qrFilename);
    const baseUrl = getBaseServerUrl(reqOrBaseUrl);

    const epaperUrl = `${baseUrl}/epaper.html?id=${encodeURIComponent(edition.id)}`;

    await qrcode.toFile(qrPath, epaperUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    const qrRelativeUrl = `/uploads/qr_codes/${qrFilename}`;
    await dbRun('UPDATE editions SET qr_code_url = ? WHERE id = ?', [qrRelativeUrl, edition.id]);
    console.log(`✓ [QR GENERATOR] Created Edition QR: ${qrFilename} -> ${epaperUrl}`);
    return qrRelativeUrl;
  } catch (err) {
    console.error('Failed to generate edition QR code:', err);
  }
}

async function generateArticleQRCode(article, reqOrBaseUrl) {
  if (!article || !article.id) return;
  try {
    const qrFilename = `Article_${article.id}_QR.png`;
    const qrPath = path.join(qrUploadDir, qrFilename);
    const baseUrl = getBaseServerUrl(reqOrBaseUrl);

    const articleUrl = article.slug ? `${baseUrl}/news/${article.slug}` : `${baseUrl}/article.html?id=${encodeURIComponent(article.id)}`;

    await qrcode.toFile(qrPath, articleUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    const qrRelativeUrl = `/uploads/qr_codes/${qrFilename}`;
    await dbRun('UPDATE articles SET qr_code_url = ? WHERE id = ?', [qrRelativeUrl, article.id]);
    console.log(`✓ [QR GENERATOR] Created Article QR: ${qrFilename} -> ${articleUrl}`);
    return qrRelativeUrl;
  } catch (err) {
    console.error('Failed to generate article QR code:', err);
  }
}

async function generateAllQRCodes(customBaseUrl) {
  try {
    await cleanupOrphanQRCodes();
    const reporters = await dbAll('SELECT * FROM reporters');
    for (const rep of reporters) {
      await generateReporterQRCode(rep, customBaseUrl);
    }
    const editions = await dbAll('SELECT * FROM editions');
    for (const ed of editions) {
      await generateEditionQRCode(ed, customBaseUrl);
    }
    const articles = await dbAll("SELECT * FROM articles WHERE status = 'published' OR status = 'approved'");
    for (const art of articles) {
      await generateArticleQRCode(art, customBaseUrl);
    }
    console.log(`✓ [QR GENERATOR] Pre-generated QR codes for ${reporters.length} reporters, ${editions.length} editions, ${articles.length} articles.`);
  } catch (err) {
    console.warn('QR Codes batch generation notice:', err.message);
  }
}

// Strict sensitive files protection middleware (with PWA exemptions)
app.use((req, res, next) => {
  const reqPath = req.path.toLowerCase();
  // Explicitly allow official PWA Web Manifest & Service Worker
  if (reqPath === '/manifest.json' || reqPath === '/sw.js') {
    return next();
  }
  const blockedPatterns = [
    /^\/\.env/i,
    /\.(sqlite|sqlite3|db)$/i,
    /^\/[^\/]+\.(js|ts|json|md|yml|yaml|config|sh|bat)$/i,
    /^\/(scratch|docs|node_modules|\.git)/i,
    /\.log$/i
  ];
  if (blockedPatterns.some(pattern => pattern.test(reqPath))) {
    return res.status(403).json({ success: false, error: 'Access denied.' });
  }
  next();
});

// Explicit PWA Endpoints with standard HTTP headers
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Force browsers and PWAs to always fetch fresh versions of core interactive scripts
app.use(['/js/chatbot.js', '/js/navigation.js', '/js/pwa.js', '/js/content-api.js'], (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const projectRoot = fs.existsSync(path.join(process.cwd(), 'index.html'))
  ? process.cwd()
  : (fs.existsSync(path.join(__dirname, 'index.html')) ? __dirname : path.resolve(__dirname, '..'));

app.use(express.static(projectRoot, { dotfiles: 'ignore' }));
app.use('/admin', express.static(path.join(projectRoot, 'admin'), { dotfiles: 'ignore' }));
app.use('/styles', express.static(path.join(projectRoot, 'styles')));
app.use('/js', express.static(path.join(projectRoot, 'js')));
app.use('/icons', express.static(path.join(projectRoot, 'icons')));
app.use('/uploads', express.static(uploadsDir, { dotfiles: 'ignore' }));

// Root & Static HTML Page Fallbacks for Serverless Hosting
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.get('/:page.html', (req, res, next) => {
  const filePath = path.join(projectRoot, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

app.get('/:page', (req, res, next) => {
  const filePath = path.join(projectRoot, `${req.params.page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

const { PDFDocument } = require('pdf-lib');

// Dynamic PDF Reconstructor / Fallback Synthesizer
async function reconstructPdfForEdition(editionOrId) {
  try {
    let edition = editionOrId;
    if (!edition) return null;
    if (typeof edition === 'string') {
      edition = await dbGet('SELECT * FROM editions WHERE id = ? OR pdf_filename = ? OR pdf_path LIKE ?', [editionOrId, editionOrId, `%/${editionOrId}`]);
    }
    if (!edition) return null;

    const relPath = edition.pdf_path.startsWith('/') ? edition.pdf_path.substring(1) : edition.pdf_path;
    const diskPath = path.join(__dirname, relPath);

    // 1. Check if raw PDF file exists on local disk
    if (fs.existsSync(diskPath)) {
      try {
        const stats = fs.statSync(diskPath);
        if (stats.size > 0) return fs.readFileSync(diskPath);
      } catch (e) {}
    }

    // 2. Check if raw PDF file exists in persistent_uploads
    const pdfUploadRow = await dbGet(
      'SELECT file_data FROM persistent_uploads WHERE file_path = ? OR file_path LIKE ?',
      [edition.pdf_path, `%/${path.basename(edition.pdf_path)}`]
    );

    if (pdfUploadRow && pdfUploadRow.file_data) {
      const buffer = Buffer.from(pdfUploadRow.file_data, 'base64');
      try {
        const targetDir = path.dirname(diskPath);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(diskPath, buffer);
      } catch (e) {}
      return buffer;
    }

    // 3. Fallback Synthesizer: Reconstruct PDF from page images stored in persistent_uploads or disk
    const pageRows = await dbAll("SELECT file_path FROM persistent_uploads WHERE file_path LIKE '%page_%.png' ORDER BY file_path ASC");
    if (!pageRows || pageRows.length === 0) {
      return null;
    }

    const groups = {};
    for (const r of pageRows) {
      const match = r.file_path.match(/^(.*edition_.+?_page_)(\d+)\.png$/);
      if (match) {
        const prefix = match[1];
        const pageNum = parseInt(match[2], 10);
        if (!groups[prefix]) groups[prefix] = {};
        groups[prefix][pageNum] = r.file_path;
      }
    }

    const groupKeys = Object.keys(groups);
    const matchedPrefix = groupKeys.find(k => k.includes(`_${edition.id}_`)) || groupKeys[groupKeys.length - 1];
    if (!matchedPrefix || !groups[matchedPrefix]) {
      return null;
    }

    const selectedPages = [];
    for (let p = 1; p <= 8; p++) {
      if (groups[matchedPrefix][p]) {
        selectedPages.push({ pageNum: p, file_path: groups[matchedPrefix][p] });
      }
    }

    if (selectedPages.length === 0) {
      return null;
    }

    console.log(`[PDF SYNTHESIZER] Synthesizing PDF for edition ${edition.id} (${edition.edition_date || ''}) from ${selectedPages.length} ordered page images...`);
    const pdfDoc = await PDFDocument.create();

    for (const p of selectedPages) {
      let imgBuffer = null;
      const localImgPath = path.join(__dirname, p.file_path.startsWith('/') ? p.file_path.substring(1) : p.file_path);

      if (fs.existsSync(localImgPath)) {
        try { imgBuffer = fs.readFileSync(localImgPath); } catch (e) {}
      }

      if (!imgBuffer) {
        const dataRow = await dbGet('SELECT file_data FROM persistent_uploads WHERE file_path = ?', [p.file_path]);
        if (dataRow && dataRow.file_data) {
          imgBuffer = Buffer.from(dataRow.file_data, 'base64');
        }
      }

      if (imgBuffer) {
        try {
          const img = await pdfDoc.embedPng(imgBuffer);
          const page = pdfDoc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } catch (e) {
          console.warn('Page embedding notice:', e.message);
        }
      }
    }

    const pdfUint8Array = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfUint8Array);

    // Auto-cache synthesized PDF to disk and persistent_uploads
    try {
      const targetDir = path.dirname(diskPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(diskPath, pdfBuffer);

      await dbRun(
        `INSERT INTO persistent_uploads (file_path, mime_type, file_data, file_size)
         VALUES (?, 'application/pdf', ?, ?)
         ON CONFLICT (file_path) DO UPDATE SET file_data = EXCLUDED.file_data, file_size = EXCLUDED.file_size`,
        [edition.pdf_path, pdfBuffer.toString('base64'), pdfBuffer.length]
      ).catch(() => {
        return dbRun(
          `INSERT OR REPLACE INTO persistent_uploads (file_path, mime_type, file_data, file_size)
           VALUES (?, 'application/pdf', ?, ?)`,
          [edition.pdf_path, pdfBuffer.toString('base64'), pdfBuffer.length]
        );
      }).catch(e => {});
    } catch (e) {}

    return pdfBuffer;
  } catch (err) {
    console.error('reconstructPdfForEdition error:', err);
    return null;
  }
}

// Persistent Uploads Fallback Restorer:
// If an uploaded image/pdf is missing on ephemeral cloud disk (e.g. Render / Railway container redeployment), restore it from Neon PostgreSQL or synthesize PDF from page images!
app.get('/uploads/*', async (req, res, next) => {
  try {
    const rawUrl = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
    const cleanPath = decodeURIComponent(rawUrl);
    const fullUrl = cleanPath.startsWith('/uploads') ? cleanPath : `/uploads${cleanPath}`;
    const filename = path.basename(cleanPath);

    const row = await dbGet(
      'SELECT file_path, mime_type, file_data FROM persistent_uploads WHERE file_path = ? OR file_path LIKE ?',
      [fullUrl, `%/${filename}`]
    );

    if (row && row.file_data) {
      const buffer = Buffer.from(row.file_data, 'base64');
      const targetDiskPath = path.join(__dirname, fullUrl);
      const targetDir = path.dirname(targetDiskPath);

      // Auto-cache back to disk so future requests are instantaneous
      try {
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetDiskPath, buffer);
      } catch (e) {}

      res.setHeader('Content-Type', row.mime_type || (filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(buffer);
    }

    // If QR code is requested but file not on ephemeral disk, redirect to public dynamic generator
    if (fullUrl.includes('/uploads/qr_codes/')) {
      const repMatch = filename.match(/^Reporter_(.+)_QR\.png$/i);
      if (repMatch) {
        return res.redirect('/api/public/reporters/' + encodeURIComponent(repMatch[1]) + '/qr.png');
      }
    }

    // If file is a PDF (e.g. /uploads/editions/*.pdf) missing from persistent_uploads, restore/synthesize it!
    if (filename.toLowerCase().endsWith('.pdf')) {
      const edition = await dbGet(
        'SELECT * FROM editions WHERE pdf_filename = ? OR pdf_path = ? OR pdf_path LIKE ? ORDER BY created_at DESC LIMIT 1',
        [filename, fullUrl, `%/${filename}`]
      ) || await dbGet("SELECT * FROM editions WHERE status = 'published' ORDER BY created_at DESC LIMIT 1");

      if (edition) {
        const synthesizedPdfBuffer = await reconstructPdfForEdition(edition);
        if (synthesizedPdfBuffer) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return res.send(synthesizedPdfBuffer);
        }
      }
    }
  } catch (err) {
    console.warn('Persistent upload restore notice:', err.message);
  }
  next();
});

// Configure Image Filter for Article & Reporter Image Uploads
const imageFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Allowed formats: JPG, JPEG, PNG, WebP, GIF.'), false);
  }
};

// Configure Multer for Article Image Uploads (Files & Pastes)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `img_${timestamp}_${random}${ext}`);
  }
});

const uploadImageMulter = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Configure Multer for Reporter Profile Image Uploads
const reporterStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reportersUploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `rep_${timestamp}_${random}${ext}`);
  }
});

const uploadReporterMulter = multer({
  storage: reporterStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Configure Multer for PDF Edition Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, editionsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `edition_${timestamp}_${cleanFilename}`);
  }
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'))) {
    cb(null, true);
  } else {
    cb(new Error('Please select a valid PDF newspaper file to upload.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max file size limit
});

// Helper: Magic byte validation for PDF files (%PDF)
function isValidPdfBuffer(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    return buffer.toString('utf8') === '%PDF';
  } catch (err) {
    return false;
  }
}

// Authentication Middleware for Protected Admin API Routes (Strict Security Enforcement)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || (!decoded.id && !decoded.username)) {
      return res.status(401).json({ success: false, error: 'Invalid authentication token.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Authentication token expired or invalid. Please log in again.' });
  }
};

// ==========================================================================
// 1. AUTHENTICATION API ROUTES
// ==========================================================================

// Login API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    let user = await dbGet(
      'SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? OR username = ? OR email = ?',
      [cleanUsername, cleanUsername, username, username]
    );

    if (!user) {
      return res.status(401).json({ success: false, error: 'లాగిన్ విఫలమైంది / Invalid credentials' });
    }

    let validPassword = await bcrypt.compare(cleanPassword, user.password_hash);
    if (!validPassword) {
      validPassword = await bcrypt.compare(password, user.password_hash);
    }

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'లాగిన్ విఫలమైంది / Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server authentication failure.' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Admin Password Change API Endpoint
app.post(['/api/admin/change-password', '/api/auth/change-password'], authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, error: 'Current password, new password, and confirmation are required.' });
    }

    if (String(new_password).length < 8) {
      return res.status(400).json({ success: false, error: 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి. (New password must be at least 8 characters long.)' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'New password and confirmation do not match.' });
    }

    // Resolve target admin user record from database
    let user = null;
    if (req.user && req.user.id && req.user.id !== 'usr_admin') {
      user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    }
    if (!user && req.user && req.user.username) {
      user = await dbGet('SELECT * FROM users WHERE username = ?', [req.user.username]);
    }
    if (!user) {
      user = await dbGet("SELECT * FROM users WHERE username = 'admin' OR role = 'superadmin' LIMIT 1");
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'ప్రస్తుత పాస్‌వర్డ్ సరైనది కాదు. (Current password is incorrect.)' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    // Update target user's password
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);

    // Keep primary admin and alias records in sync
    if (user.username === 'admin' || user.id === 'usr_admin') {
      await dbRun("UPDATE users SET password_hash = ? WHERE username = 'admin' OR id = 'usr_admin'", [newHash]);
    }

    // Refresh JWT session token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'పాస్‌వర్డ్ విజయవంతంగా నవీకరించబడింది! (Password updated successfully)',
      token
    });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
});

// ==========================================================================
// 2. NEWSPAPER EDITIONS & INGESTION API ROUTES
// ==========================================================================

// Upload Daily Newspaper PDF
app.post(['/api/editions/upload', '/api/admin/editions/upload'], authenticateToken, upload.single('pdf_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a valid PDF newspaper file to upload.' });
    }

    // Magic Byte validation
    if (!isValidPdfBuffer(req.file.path)) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'The uploaded file is not a valid PDF document.' });
    }

    const { edition_date, edition_name, edition_type, title, description, replace, status } = req.body;

    if (!edition_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(edition_date).trim())) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Valid publication date (YYYY-MM-DD) is required.' });
    }

    const cleanDate = String(edition_date).trim();
    const name = edition_name ? String(edition_name).trim() : 'మమేక మహోదయం ప్రధాన సంచిక';
    const type = edition_type ? String(edition_type).trim() : 'main';
    const pubStatus = status === 'archived' ? 'archived' : 'published';

    // Duplicate Edition Check (date + type)
    const existing = await dbGet(
      "SELECT * FROM editions WHERE edition_date = ? AND (edition_type = ? OR edition_name = ?) AND status != 'archived'",
      [cleanDate, type, name]
    );

    const isReplace = replace === 'true' || replace === true || replace === '1';

    if (existing && !isReplace) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(409).json({
        success: false,
        duplicate: true,
        existing_edition: existing,
        message: `An edition already exists for date ${cleanDate} (${existing.edition_name}).`
      });
    }

    const pdfFilename = req.file.filename;
    const pdfPath = `/uploads/editions/${pdfFilename}`;
    const fileSize = req.file.size;
    const uploadedBy = req.user.id;

    // Backup uploaded PDF to persistent DB storage
    try {
      await uploadFile({
        localFilePath: req.file.path,
        destinationKey: `editions/${pdfFilename}`,
        contentType: 'application/pdf'
      });
    } catch (e) {
      console.warn('PDF DB upload backup notice:', e.message);
    }

    if (existing && isReplace) {
      // Replace existing edition safely
      const oldPdfRelPath = existing.pdf_path.startsWith('/') ? existing.pdf_path.substring(1) : existing.pdf_path;
      const oldPdfPath = path.join(__dirname, oldPdfRelPath);
      if (fs.existsSync(oldPdfPath) && oldPdfPath !== req.file.path) {
        try { fs.unlinkSync(oldPdfPath); } catch (e) {}
      }

      await dbRun(`
        UPDATE editions
        SET edition_name = ?, edition_type = ?, pdf_filename = ?, pdf_path = ?, file_size_bytes = ?, title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP, published_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, type, pdfFilename, pdfPath, fileSize, title || null, description || null, pubStatus, existing.id]);

      const updatedEdition = await dbGet('SELECT * FROM editions WHERE id = ?', [existing.id]);
      await generateEditionQRCode(updatedEdition, req);
      return res.status(200).json({
        success: true,
        message: 'Newspaper edition replaced successfully.',
        edition: updatedEdition
      });
    }

    // Insert New Edition
    const editionId = 'edt_' + Date.now();
    await dbRun(`
      INSERT INTO editions (id, edition_date, edition_name, edition_type, pdf_filename, pdf_path, file_size_bytes, uploaded_by, title, description, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [editionId, cleanDate, name, type, pdfFilename, pdfPath, fileSize, uploadedBy, title || null, description || null, pubStatus]);

    processEdition({
      edition: { id: editionId, absolute_pdf_path: req.file.path },
      jobId: null,
      dbRun,
      dbGet,
      pagesDir
    });

    const newEdition = await dbGet('SELECT * FROM editions WHERE id = ?', [editionId]);
    await generateEditionQRCode(newEdition, req);
    return res.status(201).json({
      success: true,
      message: 'Newspaper PDF edition uploaded and published successfully.',
      edition: newEdition
    });
  } catch (err) {
    console.error('Edition upload error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    return res.status(500).json({ success: false, error: 'Failed to save newspaper edition upload.' });
  }
});

// List All Editions
app.get(['/api/editions', '/api/admin/editions'], authenticateToken, async (req, res) => {
  try {
    const editions = await dbAll(`
      SELECT e.*, u.username as uploader_name,
        (SELECT COUNT(*) FROM articles a WHERE a.edition_id = e.id) as detected_articles_count,
        (SELECT COUNT(*) FROM articles a WHERE a.edition_id = e.id AND a.status = 'published') as published_articles_count
      FROM editions e
      LEFT JOIN users u ON e.uploaded_by = u.id
      ORDER BY e.edition_date DESC, e.created_at DESC
    `);
    res.json({ success: true, editions });
  } catch (err) {
    console.error('List editions error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve newspaper editions.' });
  }
});

// Get Single Edition Details
app.get(['/api/editions/:id', '/api/admin/editions/:id'], authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const edition = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    
    if (!edition) {
      return res.status(404).json({ success: false, error: 'Newspaper edition not found.' });
    }

    const pages = await dbAll('SELECT * FROM edition_pages WHERE edition_id = ? ORDER BY page_number ASC', [id]);
    const job = await dbGet('SELECT * FROM processing_jobs WHERE edition_id = ? ORDER BY started_at DESC LIMIT 1', [id]);
    const articles = await dbAll('SELECT * FROM articles WHERE edition_id = ? ORDER BY page_number ASC, created_at ASC', [id]);

    res.json({
      success: true,
      edition,
      pages,
      job,
      articles
    });
  } catch (err) {
    console.error('Get edition error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve edition details.' });
  }
});

// Admin Dashboard Stats API
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const totalEditions = (await dbGet('SELECT COUNT(*) as count FROM editions')).count;
    const activeJobs = (await dbGet("SELECT COUNT(*) as count FROM processing_jobs WHERE stage != 'completed' AND stage != 'failed'")).count;
    const pendingReviewArticles = (await dbGet("SELECT COUNT(*) as count FROM articles WHERE status = 'review_pending' OR status = 'draft'")).count;
    const publishedArticles = (await dbGet("SELECT COUNT(*) as count FROM articles WHERE status = 'published'")).count;
    
    const latestEdition = await dbGet('SELECT * FROM editions ORDER BY edition_date DESC, created_at DESC LIMIT 1');

    res.json({
      success: true,
      stats: {
        total_editions: totalEditions,
        active_processing_jobs: activeJobs,
        pending_review_articles: pendingReviewArticles,
        published_articles: publishedArticles,
        latest_edition: latestEdition || null
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard statistics.' });
  }
});

// Update Edition Status (Publish / Archive)
app.patch(['/api/editions/:id/status', '/api/admin/editions/:id/status'], authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['published', 'archived', 'uploaded', 'processing'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing edition status.' });
    }

    const edition = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    if (!edition) return res.status(404).json({ success: false, error: 'Edition not found.' });

    await dbRun(
      "UPDATE editions SET status = ?, updated_at = CURRENT_TIMESTAMP, published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END WHERE id = ?",
      [status, status, id]
    );

    const updated = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    res.json({ success: true, message: `Edition status updated to ${status}.`, edition: updated });
  } catch (err) {
    console.error('Update edition status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update edition status.' });
  }
});

// Delete Edition (Requires Authentication)
app.delete(['/api/editions/:id', '/api/admin/editions/:id'], authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const edition = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    if (!edition) return res.status(404).json({ success: false, error: 'Edition not found.' });

    // Safely delete PDF file on disk
    if (edition.pdf_path) {
      const relPath = edition.pdf_path.startsWith('/') ? edition.pdf_path.substring(1) : edition.pdf_path;
      const fullPdfPath = path.join(__dirname, relPath);
      if (fs.existsSync(fullPdfPath)) {
        try { fs.unlinkSync(fullPdfPath); } catch (e) {}
      }
    }

    await dbRun('DELETE FROM articles WHERE edition_id = ?', [id]);
    await dbRun('DELETE FROM edition_pages WHERE edition_id = ?', [id]);
    await dbRun('DELETE FROM processing_jobs WHERE edition_id = ?', [id]);
    await dbRun('DELETE FROM editions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Edition and related records deleted successfully.' });
  } catch (err) {
    console.error('Delete edition error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete edition.' });
  }
});

// ==========================================================================
// 3. PUBLIC WEBSITE API ROUTES (CONSUMED BY FRONTEND)
// ==========================================================================

// Helper to retrieve page images list for an edition
async function getPagesForEdition(edition) {
  try {
    const pageRows = await dbAll("SELECT file_path FROM persistent_uploads WHERE file_path LIKE '%page_%.png' ORDER BY file_path ASC");
    if (!pageRows || pageRows.length === 0) return [];
    const groups = {};
    for (const r of pageRows) {
      const match = r.file_path.match(/^(.*edition_.+?_page_)(\d+)\.png$/);
      if (match) {
        const prefix = match[1];
        const pageNum = parseInt(match[2], 10);
        if (!groups[prefix]) groups[prefix] = {};
        groups[prefix][pageNum] = r.file_path;
      }
    }
    const groupKeys = Object.keys(groups);
    const matchedPrefix = (edition && groupKeys.find(k => k.includes(`_${edition.id}_`))) || groupKeys[groupKeys.length - 1];
    const pages = [];
    if (matchedPrefix && groups[matchedPrefix]) {
      for (let p = 1; p <= 8; p++) {
        if (groups[matchedPrefix][p]) pages.push(groups[matchedPrefix][p]);
      }
    }
    return pages;
  } catch (e) {
    return [];
  }
}

function getFormattedDateSlug(dateVal) {
  if (!dateVal) return 'edition';
  if (dateVal instanceof Date) {
    try { return dateVal.toISOString().split('T')[0]; } catch (e) {}
  }
  const str = String(dateVal).trim();
  const match = str.match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return 'edition';
}

// Helper to ensure edition PDF exists on disk, restoring from persistent_uploads or synthesizing if needed
async function ensureEditionPdfOnDisk(edition) {
  if (!edition || !edition.pdf_path) return null;
  const relPath = edition.pdf_path.startsWith('/') ? edition.pdf_path.substring(1) : edition.pdf_path;
  const diskPath = path.join(__dirname, relPath);

  // 1. If present on disk and non-empty, return it immediately
  if (fs.existsSync(diskPath)) {
    try {
      const stats = fs.statSync(diskPath);
      if (stats.size > 0) return diskPath;
    } catch (e) {}
  }

  // 2. Try to restore original PDF binary from persistent_uploads (Neon Cloud DB)
  try {
    const filename = path.basename(edition.pdf_path);
    const pdfRow = await dbGet(
      'SELECT file_data FROM persistent_uploads WHERE file_path = ? OR file_path LIKE ?',
      [edition.pdf_path, `%/${filename}`]
    );
    if (pdfRow && pdfRow.file_data) {
      const buf = Buffer.from(pdfRow.file_data, 'base64');
      const targetDir = path.dirname(diskPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(diskPath, buf);
      console.log(`✓ [EPAPER] Restored PDF to disk from DB: ${diskPath} (${buf.length} bytes)`);
      return diskPath;
    }
  } catch (err) {
    console.warn('[EPAPER] Notice restoring PDF from DB:', err.message);
  }

  // 3. Fallback: Reconstruct / synthesize PDF from page images
  try {
    const synthesizedBuf = await reconstructPdfForEdition(edition);
    if (synthesizedBuf && synthesizedBuf.length > 0) {
      const targetDir = path.dirname(diskPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(diskPath, synthesizedBuf);
      console.log(`✓ [EPAPER] Synthesized PDF and cached to disk: ${diskPath} (${synthesizedBuf.length} bytes)`);
      return diskPath;
    }
  } catch (err) {
    console.warn('[EPAPER] Notice synthesizing fallback PDF:', err.message);
  }

  return null;
}

// Public E-Paper API (Returns latest or date-filtered published print edition PDF reference & pages)
app.get('/api/public/epaper', async (req, res) => {
  try {
    const dateQuery = req.query.date ? String(req.query.date).trim() : null;
    let edition = null;
    let exactMatch = false;

    if (dateQuery) {
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(dateQuery);
      if (isDate) {
        edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' AND edition_date = ? ORDER BY created_at DESC LIMIT 1", [dateQuery]);
      } else {
        edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' AND (id = ? OR pdf_filename = ?) ORDER BY created_at DESC LIMIT 1", [dateQuery, dateQuery]);
      }
      if (edition) {
        exactMatch = true;
      }
    } else {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
      if (edition) exactMatch = true;
    }

    const pages = await getPagesForEdition(edition);

    res.json({
      success: true,
      edition: edition || null,
      pages: pages,
      total_pages: pages.length,
      exact_match: exactMatch,
      requested_date: dateQuery
    });
  } catch (err) {
    console.error('Public epaper error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch e-paper edition.' });
  }
});

// Public E-Paper Pages API (Returns page image URLs for reader)
app.get('/api/public/epaper/pages', async (req, res) => {
  try {
    const pages = await getPagesForEdition(null);
    res.json({
      success: true,
      total_pages: pages.length,
      pages: pages
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch e-paper pages.' });
  }
});

// Public E-Paper Archives API (Returns past published print editions)
app.get('/api/public/epaper/archive', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
    const editions = await dbAll(`
      SELECT * FROM editions
      WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf'
      ORDER BY edition_date DESC, created_at DESC
      LIMIT ${limit}
    `);

    res.json({
      success: true,
      editions: editions || []
    });
  } catch (err) {
    console.error('Public epaper archive error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch e-paper archives.' });
  }
});

// Public E-Paper Inline Reader API (Serves PDF inline for in-browser / mobile viewing)
app.get(['/api/public/epaper/read/:id', '/api/public/epaper/:id/read', '/api/public/epaper/read'], async (req, res) => {
  try {
    const id = req.params.id ? decodeURIComponent(req.params.id).trim() : 'latest';
    let edition = null;

    if (id === 'latest') {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
    } else {
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(id);
      if (isDate) {
        edition = await dbGet("SELECT * FROM editions WHERE edition_date = ? AND status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY created_at DESC LIMIT 1", [id]);
      } else {
        edition = await dbGet("SELECT * FROM editions WHERE id = ? OR pdf_filename = ? OR pdf_path LIKE ?", [id, id, `%/${id}`]);
      }
    }

    if (!edition) {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
    }

    if (!edition) {
      return res.status(404).json({ success: false, error: 'Edition not found.' });
    }

    const diskPath = await ensureEditionPdfOnDisk(edition);
    if (diskPath && fs.existsSync(diskPath)) {
      const safeDate = getFormattedDateSlug(edition.edition_date);
      const filename = `mameka-mahodayam-${safeDate}-edition.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(diskPath);
    }

    return res.status(404).json({ success: false, error: 'Edition PDF file missing on server.' });
  } catch (err) {
    console.error('Read edition error:', err);
    res.status(500).json({ success: false, error: 'Failed to stream edition PDF.' });
  }
});

// Public E-Paper PDF Download API (Serves PDF with custom filename)
app.get(['/api/public/epaper/download/:id', '/api/public/epaper/:id/download'], async (req, res) => {
  try {
    const id = req.params.id ? decodeURIComponent(req.params.id).trim() : 'latest';
    let edition = null;

    if (id === 'latest') {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
    } else {
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(id);
      if (isDate) {
        edition = await dbGet("SELECT * FROM editions WHERE edition_date = ? AND status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY created_at DESC LIMIT 1", [id]);
      } else {
        edition = await dbGet("SELECT * FROM editions WHERE id = ? OR pdf_filename = ? OR pdf_path LIKE ?", [id, id, `%/${id}`]);
      }
    }

    if (!edition) {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
    }

    if (!edition) {
      return res.status(404).json({ success: false, error: 'Edition not found.' });
    }

    const diskPath = await ensureEditionPdfOnDisk(edition);
    if (diskPath && fs.existsSync(diskPath)) {
      const safeDate = getFormattedDateSlug(edition.edition_date);
      const downloadFilename = `mameka-mahodayam-${safeDate}-edition.pdf`;
      return res.download(diskPath, downloadFilename);
    }

    return res.status(404).json({ success: false, error: 'Edition PDF file missing on server.' });
  } catch (err) {
    console.error('Download edition error:', err);
    res.status(500).json({ success: false, error: 'Failed to download edition PDF file.' });
  }
});

// Public article feed used by the homepage, category pages, district pages, and search.
app.get(['/api/public/articles', '/api/articles'], async (req, res) => {
  try {
    const { category, district, featured, homepage, breaking, search, q, limit = 24, offset = 0 } = req.query;
    const params = [];
    const filters = ["a.status = 'published'"];

    if (homepage === 'true' || homepage === '1') {
      filters.push('a.show_on_homepage = 1');
    }

    if (featured === 'true' || featured === '1') {
      filters.push('a.featured = 1');
    }

    if (breaking === 'true' || breaking === '1') {
      filters.push('a.is_breaking = 1');
    }

    if (category) {
      const catLower = category.toLowerCase().trim();
      if (catLower === 'latest' || catLower === 'all' || catLower === 'top' || catLower === 'recent') {
        // No restriction: return all published articles
      } else if (catLower === 'national' || catLower === 'international' || catLower === 'national-international') {
        filters.push("LOWER(a.category) IN ('national', 'international', 'national & international', 'national-international', 'జాతీయ వార్తలు', 'అంతర్జాతీయ వార్తలు')");
      } else if (catLower === 'cinema' || catLower === 'entertainment') {
        filters.push("LOWER(a.category) IN ('cinema', 'entertainment', 'సినిమా', 'వినోదం')");
      } else if (catLower === 'sports') {
        filters.push("LOWER(a.category) IN ('sports', 'క్రీడలు')");
      } else if (catLower === 'education' || catLower === 'education-jobs' || catLower === 'education_jobs') {
        filters.push("LOWER(a.category) IN ('education', 'education-jobs', 'education & jobs', 'విద్య & ఉద్యోగాలు')");
      } else if (catLower === 'district') {
        filters.push("(LOWER(a.category) = 'district' OR (a.district IS NOT NULL AND a.district != '' AND LOWER(a.district) != 'all'))");
      } else if (catLower === 'state') {
        filters.push("LOWER(a.category) IN ('state', 'ఆంధ్రప్రదేశ్', 'రాష్ట్ర వార్తలు')");
      } else if (catLower === 'politics') {
        filters.push("LOWER(a.category) IN ('politics', 'రాజకీయాలు')");
      } else if (catLower === 'editorial') {
        filters.push("LOWER(a.category) IN ('editorial', 'సంపాదకీయం')");
      } else if (catLower === 'business' || catLower === 'commerce') {
        filters.push("LOWER(a.category) IN ('business', 'commerce', 'వాణిజ్యం', 'బిజినెస్')");
      } else {
        filters.push('(LOWER(a.category) = LOWER(?) OR LOWER(a.category) LIKE ?)');
        params.push(category, `%${catLower}%`);
      }
    }

    if (district) {
      const d = district.toLowerCase().trim();
      if (d === 'all') {
        filters.push("(LOWER(a.category) = 'district' OR (a.district IS NOT NULL AND a.district != '' AND LOWER(a.district) != 'all'))");
      } else if (d === 'bapatla') {
        filters.push("(LOWER(a.district) = 'bapatla' OR a.title_te LIKE '%బాపట్ల%' OR a.title_te LIKE '%చీరాల%')");
      } else if (d === 'prakasam') {
        filters.push("(LOWER(a.district) = 'prakasam' OR a.title_te LIKE '%ప్రకాశం%' OR a.title_te LIKE '%ఒంగోలు%' OR a.title_te LIKE '%అద్దంకి%')");
      } else if (d === 'markapuram') {
        filters.push("(LOWER(a.district) = 'markapuram' OR a.title_te LIKE '%మార్కాపురం%' OR a.title_te LIKE '%గిద్దలూరు%' OR a.title_te LIKE '%కనిగిరి%')");
      } else if (d === 'guntur') {
        filters.push("(LOWER(a.district) = 'guntur' OR a.title_te LIKE '%గుంటూరు%' OR a.title_te LIKE '%తెనాలి%' OR a.title_te LIKE '%మంగళగిరి%')");
      } else {
        filters.push('(LOWER(a.district) = LOWER(?) OR a.title_te LIKE ? OR a.content_te LIKE ?)');
        const wildMatch = `%${d}%`;
        params.push(d, wildMatch, wildMatch);
      }
    }

    const searchTerm = search || q;
    if (searchTerm && searchTerm.trim()) {
      filters.push('(a.title_te LIKE ? OR a.summary_te LIKE ? OR a.content_te LIKE ? OR a.title_en LIKE ? OR a.subheadline_te LIKE ? OR a.author_name LIKE ? OR LOWER(a.category) LIKE ? OR LOWER(a.district) LIKE ?)');
      const match = `%${searchTerm.trim()}%`;
      const lowerMatch = `%${searchTerm.trim().toLowerCase()}%`;
      params.push(match, match, match, match, match, match, lowerMatch, lowerMatch);
    }

    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 24, 1), 100);
    let safeOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);
    if (req.query.page) {
      const pageNum = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
      safeOffset = (pageNum - 1) * safeLimit;
    }

    const countRow = await dbGet(`
      SELECT COUNT(*) as count
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      WHERE ${filters.join(' AND ')}
    `, params);

    const rows = await dbAll(`
      SELECT a.*, COALESCE(e.edition_date, DATE(a.published_at)) as edition_date, e.edition_name
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      WHERE ${filters.join(' AND ')}
      ORDER BY a.is_breaking DESC, a.featured DESC, COALESCE(a.published_at, a.created_at) DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `, params);
    const articles = await Promise.all(rows.map(async r => {
      let thumbnailUrl = r.image_url;
      if (r.image_url && r.image_url.startsWith('/uploads/media/')) {
        thumbnailUrl = await getOptimizedImage(r.image_url, 'card');
      }

      let images = [];
      if (r.images_json) {
        try { images = JSON.parse(r.images_json); } catch (e) { images = []; }
      }
      if (!Array.isArray(images)) images = [];
      if (images.length === 0 && r.image_url) {
        images = [r.image_url];
      }

      return {
        ...r,
        headline: r.title_te || r.title_en,
        summary: r.summary_te || r.summary_en,
        content: r.content_te || r.content_en,
        images: images,
        image_urls: images,
        image_url: images[0] || r.image_url || null,
        publication_date: r.edition_date || new Date(r.published_at || r.created_at).toISOString().split('T')[0],
        thumbnail_url: thumbnailUrl,
        source_newspaper: r.source_newspaper || 'మమేక మహోదయం'
      };
    }));

    res.json({
      success: true,
      total: countRow ? countRow.count : articles.length,
      limit: safeLimit,
      offset: safeOffset,
      articles
    });
  } catch (err) {
    console.error('Public articles error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch published articles.' });
  }
});

app.get('/api/public/articles/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const row = await dbGet(`
      SELECT a.*, COALESCE(e.edition_date, DATE(a.published_at)) as edition_date, e.edition_name
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      WHERE (a.slug = ? OR a.id = ?) AND a.status = 'published'
    `, [identifier, identifier]);

    if (!row) return res.status(404).json({ success: false, error: 'Article not found.' });

    let images = [];
    if (row.images_json) {
      try { images = JSON.parse(row.images_json); } catch (e) { images = []; }
    }
    if (!Array.isArray(images)) images = [];
    if (images.length === 0 && row.image_url) {
      images = [row.image_url];
    }

    const article = {
      ...row,
      headline: row.title_te || row.title_en,
      summary: row.summary_te || row.summary_en,
      content: row.content_te || row.content_en,
      images: images,
      image_urls: images,
      image_url: images[0] || row.image_url || null,
      publication_date: row.edition_date,
      source_newspaper: row.source_newspaper || 'మమేక మహోదయం'
    };

    res.json({ success: true, article });
  } catch (err) {
    console.error('Public article error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch article.' });
  }
});

// Related Articles API Endpoint
app.get('/api/public/articles/:identifier/related', async (req, res) => {
  try {
    const { identifier } = req.params;
    const target = await dbGet('SELECT * FROM articles WHERE slug = ? OR id = ?', [identifier, identifier]);
    const currentId = target ? target.id : 0;
    const category = target ? target.category : '';
    const district = target ? target.district : '';

    let rows = await dbAll(`
      SELECT a.*, COALESCE(e.edition_date, DATE(a.published_at)) as edition_date, e.edition_name
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      WHERE a.status = 'published' AND a.id != ?
        AND (LOWER(a.category) = LOWER(?) OR (a.district IS NOT NULL AND LOWER(a.district) = LOWER(?)))
      ORDER BY e.edition_date DESC, a.created_at DESC
      LIMIT 6
    `, [currentId, category || '', district || '']);

    // Query 2: Fallback recent published articles if fewer than 6
    if (rows.length < 6) {
      const existingIds = [currentId, ...rows.map(r => r.id)];
      const placeholders = existingIds.map(() => '?').join(',');
      const remainingLimit = 6 - rows.length;

      const fillRows = await dbAll(`
        SELECT a.*, e.edition_date, e.edition_name
        FROM articles a
        JOIN editions e ON e.id = a.edition_id
        WHERE a.status = 'published' AND a.id NOT IN (${placeholders})
        ORDER BY e.edition_date DESC, a.created_at DESC
        LIMIT ${remainingLimit}
      `, existingIds);

      rows = rows.concat(fillRows);
    }

    const articles = rows.map(r => ({
      ...r,
      headline: r.title_te || r.title_en,
      summary: r.summary_te || r.summary_en,
      content: r.content_te || r.content_en,
      publication_date: r.edition_date,
      source_newspaper: r.source_newspaper || 'మమేక మహోదయం'
    }));

    res.json({ success: true, articles });
  } catch (err) {
    console.error('Related articles error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch related articles.' });
  }
});

// District List API Endpoint
app.get('/api/public/districts', (req, res) => {
  try {
    const { districts } = require('./js/districts-config');
    res.json({ success: true, districts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load district configuration.' });
  }
});

// Category List API Endpoint
app.get('/api/public/categories', (req, res) => {
  try {
    const { categories } = require('./js/categories-config');
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load category configuration.' });
  }
});

// Public Contact & Feedback Submission API
app.post('/api/public/contact', async (req, res) => {
  try {
    const { name, email, department, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'పేరు, ఈమెయిల్ మరియు సందేశం తప్పనిసరి (Name, email, and message are required).' });
    }
    const inquiryId = `inq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    try {
      await dbRun(`
        CREATE TABLE IF NOT EXISTS inquiries (
          id TEXT PRIMARY KEY,
          type TEXT DEFAULT 'contact',
          name TEXT,
          email TEXT,
          phone TEXT,
          department TEXT,
          subject TEXT,
          message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await dbRun(
        `INSERT INTO inquiries (id, type, name, email, department, subject, message) VALUES (?, 'contact', ?, ?, ?, ?, ?)`,
        [inquiryId, name.trim(), email.trim(), department || 'general', subject || 'Contact Inquiry', message.trim()]
      );
    } catch (dbErr) {
      console.warn('Inquiry DB save notice:', dbErr.message);
    }
    console.log(`✓ [CONTACT INQUIRY] Received message from: ${name} (${email}) - ${subject}`);
    res.json({
      success: true,
      message: 'ధన్యవాదాలు! మీ సందేశం సంపాదకీయ బృందానికి విజయవంతంగా అందింది. (Thank you! Your message has been received.)'
    });
  } catch (err) {
    console.error('Contact submission error:', err);
    res.status(500).json({ success: false, error: 'సందేశం పంపడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.' });
  }
});

// Public Advertising Inquiry Submission API
app.post('/api/public/advertise', async (req, res) => {
  try {
    const { company, contactPerson, email, phone, adType, budget, message } = req.body;
    if (!company || !contactPerson || !email) {
      return res.status(400).json({ success: false, error: 'సంస్థ పేరు, సంప్రదించాల్సిన వ్యక్తి మరియు ఈమెయిల్ తప్పనిసరి (Company name, contact person, and email are required).' });
    }
    const inquiryId = `ad_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    try {
      await dbRun(`
        CREATE TABLE IF NOT EXISTS inquiries (
          id TEXT PRIMARY KEY,
          type TEXT DEFAULT 'advertise',
          name TEXT,
          email TEXT,
          phone TEXT,
          department TEXT,
          subject TEXT,
          message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const details = `Company: ${company} | Ad Type: ${adType || 'N/A'} | Budget: ${budget || 'N/A'}\n${message || ''}`;
      await dbRun(
        `INSERT INTO inquiries (id, type, name, email, phone, department, subject, message) VALUES (?, 'advertise', ?, ?, ?, 'advertising', ?, ?)`,
        [inquiryId, contactPerson.trim(), email.trim(), phone || '', `Ad Inquiry: ${company}`, details]
      );
    } catch (dbErr) {
      console.warn('Ad inquiry DB save notice:', dbErr.message);
    }
    console.log(`✓ [AD INQUIRY] Received ad inquiry from: ${company} - ${contactPerson} (${email})`);
    res.json({
      success: true,
      message: 'ధన్యవాదాలు! మీ ప్రకటనల విచారణ మా ప్రకటనల విభాగానికి అందింది. మా ప్రతినిధి త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు. (Thank you! Our advertising team will contact you soon.)'
    });
  } catch (err) {
    console.error('Advertise submission error:', err);
    res.status(500).json({ success: false, error: 'విచారణ పంపడంలో లోపం ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి.' });
  }
});


// 1-Click Publish All Articles in an Edition API Endpoint
app.post('/api/admin/editions/:id/publish-all', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const edition = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    if (!edition) {
      return res.status(404).json({ success: false, error: 'Edition not found.' });
    }

    const artResult = await dbRun(`
      UPDATE articles
      SET status = 'published', show_on_homepage = 1, featured = 1, published_at = CURRENT_TIMESTAMP
      WHERE edition_id = ?
    `, [id]);

    await dbRun(`
      UPDATE editions
      SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: `🎉 విజయం! ఈ సంచికలోని ${artResult.changes} వార్తలను వెబ్‌సైట్‌లో లైవ్‌గా ప్రచురించారు! (Published ${artResult.changes} articles live)`,
      published_articles_count: artResult.changes
    });
  } catch (err) {
    console.error('Publish all edition articles error:', err);
    res.status(500).json({ success: false, error: 'Failed to publish edition articles.' });
  }
});

// Admin Edition Update API (Publish / Unpublish / Edit metadata)
app.put('/api/admin/editions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, edition_name, edition_date, edition_type } = req.body;

    const existing = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Edition not found.' });
    }

    if (status === 'published') {
      await dbRun(`
        UPDATE articles
        SET status = 'published', show_on_homepage = 1, featured = 1, published_at = CURRENT_TIMESTAMP
        WHERE edition_id = ?
      `, [id]);
    }

    await dbRun(`
      UPDATE editions
      SET status = COALESCE(?, status),
          edition_name = COALESCE(?, edition_name),
          edition_date = COALESCE(?, edition_date),
          edition_type = COALESCE(?, edition_type),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, edition_name, edition_date, edition_type, id]);

    const updated = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Edition updated successfully.', edition: updated });
  } catch (err) {
    console.error('Admin edition update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update edition.' });
  }
});


// Helper function to generate clean article slugs
function generateArticleSlug(titleEn, titleTe, id) {
  let base = '';
  if (titleEn && titleEn.trim()) {
    base = titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (!base && titleTe && titleTe.trim()) {
    base = titleTe.trim().toLowerCase().replace(/[\s\t\n]+/g, '-').replace(/[^a-z0-9\u0C00-\u0C7F-]+/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }
  if (!base) {
    base = 'news-article';
  }
  const cleanId = id ? id.replace(/[^a-zA-Z0-9]/g, '').slice(-8) : Date.now().toString(36);
  return `${base}-${cleanId}`;
}

// Admin Image Upload API Endpoint (Supports Files, Drag & Drop, Multi-Image & Clipboard Pastes)
app.post('/api/admin/upload-image', authenticateToken, uploadImageMulter.any(), async (req, res) => {
  try {
    const files = req.files || [];
    const uploadedUrls = [];

    if (files.length > 0) {
      for (const f of files) {
        const finalUrl = await uploadFile({
          localFilePath: f.path,
          destinationKey: `images/${f.filename}`,
          contentType: f.mimetype
        });
        uploadedUrls.push(finalUrl);
      }
    }

    // Also check Base64 payload (for clipboard pasted images or canvas data)
    const { image_base64, base64, images_base64, base64Image, image_data, image } = req.body || {};
    const singlePayload = image_base64 || base64 || base64Image || image_data || image;
    const base64List = Array.isArray(images_base64) ? images_base64 : (singlePayload ? [singlePayload] : []);

    for (const rawData of base64List) {
      if (typeof rawData === 'string' && rawData.trim()) {
        const matches = rawData.match(/^data:image\/([a-zA-Z0-9+\/-]+);base64,(.+)$/);
        let ext = '.png';
        let base64Data = rawData;
        if (matches) {
          ext = '.' + (matches[1] === 'jpeg' ? 'jpg' : matches[1]);
          base64Data = matches[2];
        }
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
        const savePath = path.join(imagesDir, filename);
        fs.writeFileSync(savePath, buffer);
        const finalUrl = await uploadFile({
          localFilePath: savePath,
          destinationKey: `images/${filename}`,
          contentType: `image/${ext.replace('.', '')}`
        });
        uploadedUrls.push(finalUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      return res.json({
        success: true,
        image_url: uploadedUrls[0],
        url: uploadedUrls[0],
        image_urls: uploadedUrls,
        urls: uploadedUrls
      });
    }

    return res.status(400).json({ success: false, error: 'No image file or valid image data received.' });
  } catch (err) {
    console.error('Upload image API error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload image: ' + err.message });
  }
});

// Admin Create New Article API Endpoint (Direct Publishing / Creation)
app.post('/api/admin/articles', authenticateToken, async (req, res) => {
  try {
    const {
      title_te, title_en, subheadline_te, summary_te, summary_en,
      content_te, content_en, category, district, image_url, image_urls, images_json, image_caption_te,
      status, featured, show_on_homepage, is_breaking, edition_id, author_name
    } = req.body;

    const headline = title_te || title_en;
    if (!headline || !headline.trim()) {
      return res.status(400).json({ success: false, error: 'Article headline is required.' });
    }

    const id = 'art_' + require('crypto').randomUUID();
    const finalStatus = status || 'published';

    let finalImagesJson = null;
    let mainImageUrl = image_url || null;
    if (images_json) {
      finalImagesJson = typeof images_json === 'string' ? images_json : JSON.stringify(images_json);
      try {
        const parsed = JSON.parse(finalImagesJson);
        if (Array.isArray(parsed) && parsed.length > 0 && !mainImageUrl) mainImageUrl = parsed[0];
      } catch (e) {}
    } else if (Array.isArray(image_urls) && image_urls.length > 0) {
      finalImagesJson = JSON.stringify(image_urls);
      if (!mainImageUrl) mainImageUrl = image_urls[0];
    } else if (mainImageUrl) {
      finalImagesJson = JSON.stringify([mainImageUrl]);
    }

    // Get or assign default edition if not provided
    let targetEditionId = edition_id;
    if (!targetEditionId) {
      const latestEdition = await dbGet('SELECT id FROM editions ORDER BY created_at DESC LIMIT 1');
      if (latestEdition) {
        targetEditionId = latestEdition.id;
      } else {
        targetEditionId = 'edt_default';
        const existingDefault = await dbGet('SELECT id FROM editions WHERE id = ?', ['edt_default']);
        if (!existingDefault) {
          const userRow = await dbGet('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
          const validUserId = userRow ? userRow.id : (req.user && req.user.id ? req.user.id : 'usr_admin');
          await dbRun(`
            INSERT INTO editions (id, edition_date, edition_name, edition_type, pdf_filename, pdf_path, file_size_bytes, uploaded_by, status)
            VALUES (?, CURRENT_DATE, 'డిజిటల్ పత్రిక సంచిక', 'main', 'default.pdf', '/uploads/editions/default.pdf', 0, ?, 'published')
          `, ['edt_default', validUserId]);
        }
      }
    }

    const slug = generateArticleSlug(title_en, title_te, id);

    await dbRun(`
      INSERT INTO articles (
        id, edition_id, page_number, slug, title_te, title_en, subheadline_te, summary_te, summary_en,
        content_te, content_en, raw_extracted_text, cleaned_text, category, district, image_url, images_json,
        image_caption_te, status, content_type, exclude_from_article_candidates, needs_review,
        featured, show_on_homepage, is_breaking, author_name, published_at
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'news', 0, 0, ?, ?, ?, ?, ?)
    `, [
      id,
      targetEditionId,
      slug,
      title_te || headline,
      title_en || headline,
      subheadline_te || '',
      summary_te || '',
      summary_en || '',
      content_te || headline,
      content_en || headline,
      content_te || headline,
      content_te || headline,
      category || 'state',
      district || null,
      mainImageUrl,
      finalImagesJson,
      image_caption_te || '',
      finalStatus,
      featured ? 1 : 0,
      show_on_homepage !== undefined ? (show_on_homepage ? 1 : 0) : 1,
      is_breaking ? 1 : 0,
      author_name || 'మమేక మహోదయం డెస్క్',
      new Date().toISOString()
    ]);

    const createdArticle = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    res.status(201).json({
      success: true,
      message: 'Article created and published successfully.',
      article: createdArticle
    });
  } catch (err) {
    console.error('Admin create article error:', err);
    res.status(500).json({ success: false, error: 'వార్త ప్రచురణ విఫలమైంది: ' + (err.message || 'Server Error') });
  }
});

// Admin Update Article API Endpoint
app.put(['/api/admin/articles/:id', '/api/admin/articles/:id/update'], authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    const {
      title_te, title_en, subheadline_te, summary_te, summary_en,
      content_te, content_en, category, district, image_url, images_json, image_urls, image_caption_te,
      status, featured, show_on_homepage, is_breaking, author_name, byline, slug
    } = req.body;

    const headline = title_te || title_en || existing.title_te;

    let finalImagesJson = existing.images_json;
    let mainImageUrl = image_url !== undefined ? image_url : existing.image_url;
    if (images_json !== undefined) {
      finalImagesJson = typeof images_json === 'string' ? images_json : JSON.stringify(images_json);
    } else if (Array.isArray(image_urls)) {
      finalImagesJson = JSON.stringify(image_urls);
    }

    const isPublishingNow = status === 'published' && existing.status !== 'published';
    const publishedAtClause = isPublishingNow ? 'CURRENT_TIMESTAMP' : 'published_at';

    let targetSlug = slug || existing.slug;
    if (!targetSlug || !targetSlug.trim()) {
      targetSlug = generateArticleSlug(title_en || existing.title_en, title_te || existing.title_te, id);
    }

    await dbRun(`
      UPDATE articles SET
        title_te = ?,
        title_en = ?,
        subheadline_te = ?,
        summary_te = ?,
        summary_en = ?,
        content_te = ?,
        content_en = ?,
        category = ?,
        district = ?,
        image_url = ?,
        images_json = ?,
        image_caption_te = ?,
        status = ?,
        featured = ?,
        show_on_homepage = ?,
        is_breaking = ?,
        author_name = ?,
        byline = ?,
        slug = ?,
        published_at = ${publishedAtClause},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title_te || headline,
      title_en || headline,
      subheadline_te !== undefined ? subheadline_te : (existing.subheadline_te || ''),
      summary_te !== undefined ? summary_te : (existing.summary_te || ''),
      summary_en !== undefined ? summary_en : (existing.summary_en || ''),
      content_te || headline,
      content_en || headline,
      category || existing.category,
      district !== undefined ? district : existing.district,
      mainImageUrl,
      finalImagesJson,
      image_caption_te !== undefined ? image_caption_te : existing.image_caption_te,
      status || existing.status,
      featured !== undefined ? (featured ? 1 : 0) : existing.featured,
      show_on_homepage !== undefined ? (show_on_homepage ? 1 : 0) : existing.show_on_homepage,
      is_breaking !== undefined ? (is_breaking ? 1 : 0) : existing.is_breaking,
      author_name || existing.author_name,
      byline !== undefined ? byline : existing.byline,
      targetSlug,
      id
    ]);

    // Automatically purge any images that were removed during article editing
    try {
      const oldImages = new Set();
      if (existing.image_url) oldImages.add(existing.image_url.trim());
      if (existing.images_json) {
        try {
          const sub = typeof existing.images_json === 'string' ? JSON.parse(existing.images_json) : existing.images_json;
          if (Array.isArray(sub)) sub.forEach(u => { if (u && typeof u === 'string') oldImages.add(u.trim()); });
        } catch(e) {}
      }

      const newImages = new Set();
      if (mainImageUrl) newImages.add(mainImageUrl.trim());
      if (finalImagesJson) {
        try {
          const sub = typeof finalImagesJson === 'string' ? JSON.parse(finalImagesJson) : finalImagesJson;
          if (Array.isArray(sub)) sub.forEach(u => { if (u && typeof u === 'string') newImages.add(u.trim()); });
        } catch(e) {}
      }

      for (const oldImg of oldImages) {
        if (!newImages.has(oldImg)) {
          await deleteFile(oldImg);
        }
      }
    } catch (e) {
      console.warn('Purge removed article images notice:', e.message);
    }

    const updated = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Article updated successfully.', article: updated });
  } catch (err) {
    console.error('Admin update article error:', err);
    res.status(500).json({ success: false, error: 'Failed to update article.' });
  }
});

// Admin Articles List API Endpoint
app.get('/api/admin/articles', authenticateToken, async (req, res) => {
  try {
    const { status, category, district, edition_id, search, limit = 50, offset = 0 } = req.query;
    const filters = [];
    const params = [];

    if (status && status !== 'all') {
      filters.push('a.status = ?');
      params.push(status);
    }
    if (category) {
      filters.push('LOWER(a.category) = LOWER(?)');
      params.push(category);
    }
    if (district) {
      filters.push('LOWER(a.district) = LOWER(?)');
      params.push(district);
    }
    if (edition_id) {
      filters.push('a.edition_id = ?');
      params.push(edition_id);
    }
    if (search) {
      filters.push('(a.title_te LIKE ? OR a.summary_te LIKE ? OR a.content_te LIKE ? OR a.title_en LIKE ?)');
      const q = `%${search}%`;
      params.push(q, q, q, q);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const safeOffset = Math.max(parseInt(offset) || 0, 0);

    const totalCountRow = await dbGet(`SELECT COUNT(*) as count FROM articles a ${whereClause}`, params);
    const articles = await dbAll(`
      SELECT a.*, e.edition_date, e.edition_name
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `, params);

    const statusCounts = await dbGet(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'review_pending' THEN 1 ELSE 0 END) as review_pending_count,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_count,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count
      FROM articles
    `);

    res.json({
      success: true,
      total: totalCountRow ? totalCountRow.count : 0,
      limit: safeLimit,
      offset: safeOffset,
      status_counts: {
        total: statusCounts ? statusCounts.total || 0 : 0,
        draft: statusCounts ? statusCounts.draft_count || 0 : 0,
        review_pending: statusCounts ? statusCounts.review_pending_count || 0 : 0,
        published: statusCounts ? statusCounts.published_count || 0 : 0,
        archived: statusCounts ? statusCounts.archived_count || 0 : 0
      },
      articles
    });
  } catch (err) {
    console.error('Admin articles list error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve articles list.' });
  }
});

// Note: Article image upload multer configured at top of server.js (uploadImageMulter)

// Admin Get Single Article API Endpoint with Source Page & Media Assets
app.get('/api/admin/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await dbGet(`
      SELECT a.*, e.edition_date, e.edition_name, e.pdf_path,
             p.page_image_path, p.width as page_width, p.height as page_height
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      LEFT JOIN edition_pages p ON (p.edition_id = a.edition_id AND p.page_number = a.page_number)
      WHERE a.id = ?
    `, [id]);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    if (!article.images_json && article.image_url) {
      article.images_json = JSON.stringify([article.image_url]);
    }

    const images = await dbAll('SELECT * FROM article_images WHERE article_id = ? ORDER BY display_order ASC', [id]);
    const editionMedia = await dbAll('SELECT * FROM media_assets WHERE edition_id = ? AND page_number = ?', [article.edition_id, article.page_number]);

    res.json({
      success: true,
      article,
      images,
      editionMedia
    });
  } catch (err) {
    console.error('Admin get article error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch article details.' });
  }
});

// Admin Delete Article API Endpoint - Lightning-fast & Accurate (DB & Live Site)
app.delete('/api/admin/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT id, title_te, image_url FROM articles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    // 1. Immediately delete article and relations from database
    await dbRun('DELETE FROM article_images WHERE article_id = ?', [id]);
    await dbRun('DELETE FROM articles WHERE id = ?', [id]);

    // 2. Return instant HTTP 200 response to caller
    res.json({
      success: true,
      message: 'వార్త డాటాబేస్ మరియు లైవ్ సైట్ నుండి విజయవంతంగా తొలగించబడింది (Article deleted successfully from database and live site).'
    });

    // 3. Asynchronously handle any non-critical storage unlinking in background
    setImmediate(async () => {
      try {
        if (existing.image_url && typeof existing.image_url === 'string') {
          const fn = path.basename(existing.image_url);
          // Only unlink if not a core system image or shared page image
          if (fn && !fn.startsWith('edition_') && !fn.includes('logo') && !fn.includes('favicon')) {
            const stillUsed = await dbGet('SELECT id FROM articles WHERE image_url LIKE ? OR images_json LIKE ?', [`%${fn}%`, `%${fn}%`]);
            if (!stillUsed) {
              const { imagesDir } = require('./db');
              const localFp = path.join(imagesDir, fn);
              if (fs.existsSync(localFp)) {
                try { fs.unlinkSync(localFp); } catch (e) {}
              }
            }
          }
        }
      } catch (bgErr) {
        console.warn('Background cleanup notice:', bgErr.message);
      }
    });
  } catch (err) {
    console.error('Admin delete article error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete article: ' + (err.message || 'Server error') });
  }
});


// Admin List Uploaded Media Library API Endpoint
app.get('/api/admin/media', authenticateToken, async (req, res) => {
  try {
    const mediaList = [];

    // Strictly list active articles: Every article is a SINGLE slot containing all its uploaded photos
    const dbArticles = await dbAll("SELECT id, title_te, title_en, image_url, images_json, created_at, published_at FROM articles WHERE (image_url IS NOT NULL AND image_url != '') OR images_json IS NOT NULL ORDER BY created_at DESC");
    if (Array.isArray(dbArticles)) {
      for (const art of dbArticles) {
        const articleHeadline = (art.title_te || art.title_en || 'వార్త').trim();
        const articleImages = [];

        if (art.image_url && typeof art.image_url === 'string' && art.image_url.trim()) {
          articleImages.push(art.image_url.trim());
        }

        if (art.images_json) {
          try {
            const subImages = typeof art.images_json === 'string' ? JSON.parse(art.images_json) : art.images_json;
            if (Array.isArray(subImages)) {
              subImages.forEach(img => {
                if (typeof img === 'string' && img.trim() && !articleImages.includes(img.trim())) {
                  articleImages.push(img.trim());
                }
              });
            }
          } catch(e) {}
        }

        if (articleImages.length > 0) {
          const coverUrl = articleImages[0];
          mediaList.push({
            id: art.id,
            article_id: art.id,
            article_title: articleHeadline,
            filename: path.basename(coverUrl),
            url: coverUrl,
            images: articleImages,
            image_count: articleImages.length,
            folder: 'articles',
            created_at: art.published_at || art.created_at || new Date()
          });
        }
      }
    }

    mediaList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, count: mediaList.length, media: mediaList });
  } catch (err) {
    console.error('List media error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve media list.' });
  }
});

// Admin Delete Media Image API Endpoint
app.delete('/api/admin/media/:filename', authenticateToken, async (req, res) => {
  try {
    const rawFilename = req.params.filename;
    if (!rawFilename || rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Invalid filename parameter.' });
    }

    const filename = path.basename(rawFilename);

    // 1. Permanently delete from Cloud Storage, Neon DB persistent_uploads, media_assets, and disk
    await deleteFile(`/uploads/images/${filename}`);
    await deleteFile(`/uploads/media/${filename}`);

    // 2. Remove this image from any active articles referencing it
    const articlesUsing = await dbAll("SELECT id, image_url, images_json FROM articles WHERE image_url LIKE ? OR images_json LIKE ?", [`%${filename}%`, `%${filename}%`]);
    if (Array.isArray(articlesUsing)) {
      for (const art of articlesUsing) {
        let newImages = [];
        if (art.images_json) {
          try {
            const parsed = typeof art.images_json === 'string' ? JSON.parse(art.images_json) : art.images_json;
            if (Array.isArray(parsed)) {
              newImages = parsed.filter(u => !u.includes(filename));
            }
          } catch (e) {}
        }
        let newCover = (art.image_url && art.image_url.includes(filename))
          ? (newImages.length > 0 ? newImages[0] : null)
          : art.image_url;

        await dbRun('UPDATE articles SET image_url = ?, images_json = ? WHERE id = ?', [
          newCover,
          newImages.length > 0 ? JSON.stringify(newImages) : null,
          art.id
        ]);
      }
    }

    // 3. Remove from article_images
    await dbRun("DELETE FROM article_images WHERE image_url LIKE ?", [`%${filename}%`]);

    res.json({ success: true, message: 'చిత్రం డాటాబేస్ మరియు సర్వర్ నుండి శాశ్వతంగా తొలగించబడింది (Image deleted permanently).' });
  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete media asset.' });
  }
});

// Admin Article Image Upload API Endpoint
app.post('/api/admin/articles/:id/image', authenticateToken, uploadImageMulter.single('image_file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please select a valid image file.' });
    }

    const finalUrl = await uploadFile({
      localFilePath: req.file.path,
      destinationKey: `images/${req.file.filename}`,
      contentType: req.file.mimetype
    });
    await dbRun('UPDATE articles SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [finalUrl, id]);

    res.json({ success: true, message: 'Image uploaded successfully.', image_url: finalUrl });
  } catch (err) {
    console.error('Admin article image upload error:', err);
    res.status(500).json({ success: false, error: 'Failed to upload article image.' });
  }
});

// Admin Article Publish Endpoint (Atomic Publishing with Validation)
app.post('/api/admin/articles/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const article = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article record not found.' });
    }

    const headline = req.body.title_te || article.title_te || req.body.title_en || article.title_en;
    const content = req.body.content_te || article.content_te || req.body.content_en || article.content_en;
    const category = req.body.category || article.category;

    if (!headline || headline.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Title / Headline is required to publish an article.' });
    }
    const hasPhoto = Boolean(article.image_url || req.body.image_url || (article.images_json && article.images_json !== '[]'));
    if (!hasPhoto && (!content || content.trim().length < 10)) {
      return res.status(400).json({ success: false, error: 'Full article body content or an attached photo is required to publish.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, error: 'Article category is required to publish.' });
    }

    let finalSlug = article.slug;
    if (!finalSlug || !finalSlug.trim()) {
      finalSlug = generateArticleSlug(article.title_en, headline, id);
    }

    const now = new Date().toISOString().replace('T', ' ').split('.')[0];
    await dbRun(`
      UPDATE articles
      SET status = 'published',
          slug = ?,
          published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [finalSlug, id]);

    const updated = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'Article published successfully and made available to public feed.',
      article: updated
    });
  } catch (err) {
    console.error('Publish article error:', err);
    res.status(500).json({ success: false, error: 'Failed to publish article.' });
  }
});

// Admin Article Unpublish Endpoint (Revert to Draft or Archived)
app.post('/api/admin/articles/:id/unpublish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const targetStatus = req.body.target_status || 'draft';
    const article = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article record not found.' });
    }

    await dbRun(`
      UPDATE articles
      SET status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [targetStatus, id]);

    const updated = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    res.json({
      success: true,
      message: `Article status changed to ${targetStatus} and removed from public feed.`,
      article: updated
    });
  } catch (err) {
    console.error('Unpublish article error:', err);
    res.status(500).json({ success: false, error: 'Failed to unpublish article.' });
  }
});

// ==========================================================================
// REPORTERS & EDITORIAL TEAM MANAGEMENT APIS (DYNAMIC CMS)
// ==========================================================================

// Public Directory: List all active reporters with optional district/designation filters
app.get(['/api/public/reporters', '/api/reporters'], async (req, res) => {
  try {
    const { district, designation, search, q } = req.query;
    const filters = ["LOWER(status) = 'active'"];
    const params = [];

    if (district && district.toLowerCase() !== 'all') {
      filters.push('LOWER(district) = LOWER(?)');
      params.push(district);
    }

    if (designation && designation.toLowerCase() !== 'all') {
      filters.push('LOWER(designation) LIKE LOWER(?)');
      params.push(`%${designation.trim()}%`);
    }

    const searchTerm = search || q;
    if (searchTerm && searchTerm.trim()) {
      filters.push('(name LIKE ? OR designation LIKE ? OR mandal LIKE ? OR district LIKE ? OR bio LIKE ?)');
      const m = `%${searchTerm.trim()}%`;
      params.push(m, m, m, m, m);
    }

    const reporters = await dbAll(`
      SELECT id, name, designation, district, mandal, bio, photo_url, phone, email, social_links, display_order, press_id, jurisdiction, created_at
      FROM reporters
      WHERE ${filters.join(' AND ')}
      ORDER BY 
        (CASE 
          WHEN LOWER(designation) LIKE '%founder%' OR designation LIKE '%వ్యవస్థాపక%' OR LOWER(designation) LIKE '%editor-in-chief%' OR designation LIKE '%ప్రధాన సంపాదకులు%' THEN 1
          WHEN LOWER(designation) LIKE '%associate%' OR designation LIKE '%అసోసియేట్%' THEN 2
          ELSE 3
        END) ASC,
        display_order ASC, created_at ASC
    `, params);

    res.json({ success: true, reporters: reporters || [], count: (reporters || []).length });
  } catch (err) {
    console.error('Public reporters error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reporters directory.' });
  }
});

// Public Profile: Fetch single reporter by ID or Name with their published news articles
app.get(['/api/public/reporters/:id', '/api/reporters/:id'], async (req, res) => {
  try {
    const rawId = req.params.id;
    if (!rawId || !rawId.trim()) {
      return res.status(404).json({ success: false, error: 'Reporter identifier required.' });
    }
    const cleanId = rawId.trim();

    const reporter = await dbGet(`
      SELECT id, name, designation, district, mandal, bio, photo_url, phone, email, social_links, display_order, press_id, jurisdiction, created_at
      FROM reporters
      WHERE (id = ? OR name = ?) AND status = 'active'
    `, [cleanId, cleanId]);

    if (!reporter) {
      return res.status(404).json({
        success: false,
        error: 'పాత్రికేయుని గుర్తింపు ప్రొఫైల్ లభించలేదు లేదా తొలగించబడినది (Press ID Revoked or Deleted / Not Found).'
      });
    }

    // Dynamic Article-Author mapping: fetch published articles authored by this reporter
    const articles = await dbAll(`
      SELECT a.*, COALESCE(e.edition_date, DATE(a.published_at)) as edition_date, e.edition_name
      FROM articles a
      LEFT JOIN editions e ON e.id = a.edition_id
      WHERE a.status = 'published' AND (
        LOWER(a.author_name) LIKE LOWER(?) OR 
        LOWER(a.author_name) LIKE LOWER(?) OR
        a.reporter_id = ?
      )
      ORDER BY COALESCE(a.published_at, a.created_at) DESC
      LIMIT 24
    `, [`%${reporter.name}%`, `%${reporter.id}%`, reporter.id]);

    const formattedArticles = (articles || []).map(r => ({
      ...r,
      headline: r.title_te || r.title_en,
      summary: r.summary_te || r.summary_en,
      content: r.content_te || r.content_en,
      publication_date: r.edition_date || new Date(r.published_at || r.created_at).toISOString().split('T')[0],
      source_newspaper: r.source_newspaper || 'మమేక మహోదయం'
    }));

    res.json({
      success: true,
      reporter,
      articles: formattedArticles
    });
  } catch (err) {
    console.error('Public reporter profile error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reporter profile.' });
  }
});

// Admin: List all reporters (active + inactive) with search and status filters
app.get('/api/admin/reporters', authenticateToken, async (req, res) => {
  try {
    const { district, status, search, q } = req.query;
    const filters = [];
    const params = [];

    if (status) {
      filters.push('status = ?');
      params.push(status);
    }

    if (district && district.toLowerCase() !== 'all') {
      filters.push('LOWER(district) = LOWER(?)');
      params.push(district);
    }

    const searchTerm = search || q;
    if (searchTerm && searchTerm.trim()) {
      filters.push('(name LIKE ? OR designation LIKE ? OR mandal LIKE ? OR district LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const m = `%${searchTerm.trim()}%`;
      params.push(m, m, m, m, m, m);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const reporters = await dbAll(`
      SELECT * FROM reporters
      ${whereClause}
      ORDER BY 
        (CASE 
          WHEN LOWER(designation) LIKE '%founder%' OR designation LIKE '%వ్యవస్థాపక%' OR LOWER(designation) LIKE '%editor-in-chief%' OR designation LIKE '%ప్రధాన సంపాదకులు%' THEN 1
          WHEN LOWER(designation) LIKE '%associate%' OR designation LIKE '%అసోసియేట్%' THEN 2
          ELSE 3
        END) ASC,
        display_order ASC, created_at DESC
    `, params);

    res.json({ success: true, reporters, count: reporters.length });
  } catch (err) {
    console.error('Admin reporters list error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin reporters.' });
  }
});

// Admin: Get single reporter by ID
app.get('/api/admin/reporters/:id', authenticateToken, async (req, res) => {
  try {
    const reporter = await dbGet('SELECT * FROM reporters WHERE id = ?', [req.params.id]);
    if (!reporter) {
      return res.status(404).json({ success: false, error: 'Reporter not found.' });
    }
    res.json({ success: true, reporter });
  } catch (err) {
    console.error('Admin get reporter error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reporter.' });
  }
});

// Admin: Create new reporter profile (supports multipart photo file upload or image URL)
app.post('/api/admin/reporters', authenticateToken, uploadReporterMulter.single('photo_file'), async (req, res) => {
  try {
    const {
      name, designation, district, mandal, bio,
      photo_url, phone, email, social_links, status = 'active', display_order = 0,
      press_id, jurisdiction
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Reporter Full Name is required.' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, error: 'Designation / Position is required.' });
    }

    let finalPhotoUrl = '';
    const { photo_base64 } = req.body;
    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        finalPhotoUrl = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      } catch (e) {
        finalPhotoUrl = `/uploads/reporters/${req.file.filename}`;
      }
    } else if (photo_base64 && typeof photo_base64 === 'string' && photo_base64.startsWith('data:image/')) {
      finalPhotoUrl = photo_base64;
      try {
        const matches = photo_base64.match(/^data:image\/([a-zA-Z0-9+\/-]+);base64,(.+)$/);
        if (matches) {
          const ext = '.' + (matches[1] === 'jpeg' ? 'jpg' : matches[1]);
          const filename = `rep_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
          fs.writeFileSync(path.join(reportersUploadDir, filename), Buffer.from(matches[2], 'base64'));
        }
      } catch (e) {}
    } else if (photo_url && typeof photo_url === 'string' && photo_url.trim()) {
      const p = photo_url.trim();
      if (!p.startsWith('file:') && !p.startsWith('C:') && !p.startsWith('D:') && !p.includes('fakepath')) {
        finalPhotoUrl = p;
      }
    }

    const id = 'rep_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    let socialLinksJson = '';
    if (typeof social_links === 'string') {
      socialLinksJson = social_links;
    } else if (typeof social_links === 'object') {
      socialLinksJson = JSON.stringify(social_links);
    }

    const desigLower = String(designation || '').toLowerCase();
    const isTopEditorial = desigLower.includes('founder') || desigLower.includes('వ్యవస్థాపక') || 
                           desigLower.includes('editor-in-chief') || desigLower.includes('ప్రధాన సంపాదకులు') || 
                           desigLower.includes('chief') || desigLower.includes('చీఫ్') ||
                           desigLower.includes('associate') || desigLower.includes('అసోసియేట్');

    let finalJurisdiction = (jurisdiction || '').trim();
    if (!finalJurisdiction && isTopEditorial) {
      finalJurisdiction = 'ఆంధ్రప్రదేశ్ & తెలంగాణ (ఉభయ తెలుగు రాష్ట్రాలు - AP & Telangana)';
    }

    let finalPressId = (press_id || '').trim();
    if (!finalPressId) {
      const rawNum = String(Date.now()).slice(-3);
      finalPressId = `MM-PRESS-2026-${rawNum}`;
    }

    await dbRun(`
      INSERT INTO reporters (
        id, name, designation, district, mandal, bio,
        photo_url, phone, email, social_links, status, display_order, press_id, jurisdiction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      name.trim(),
      designation.trim(),
      district || (isTopEditorial ? 'all-ap-ts' : ''),
      mandal || (isTopEditorial ? 'ఉభయ తెలుగు రాష్ట్రాలు' : ''),
      bio || '',
      finalPhotoUrl,
      phone || '',
      email || '',
      socialLinksJson,
      status === 'inactive' ? 'inactive' : 'active',
      (function() {
        if (display_order !== undefined && parseInt(display_order, 10) > 0) return parseInt(display_order, 10);
        if (isTopEditorial) {
          if (desigLower.includes('associate') || desigLower.includes('అసోసియేట్')) return 2;
          return 1;
        }
        return 3;
      })(),
      finalPressId,
      finalJurisdiction
    ]);

    const created = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    const qrRelativeUrl = await generateReporterQRCode(created, req);
    if (created && qrRelativeUrl) created.qr_code_url = qrRelativeUrl;
    res.json({ success: true, message: 'Reporter profile created successfully.', reporter: created });
  } catch (err) {
    console.error('Create reporter error:', err);
    res.status(500).json({ success: false, error: 'Failed to create reporter: ' + err.message });
  }
});

// Admin: Update existing reporter profile
app.put('/api/admin/reporters/:id', authenticateToken, uploadReporterMulter.single('photo_file'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reporter record not found.' });
    }

    const {
      name, designation, district, mandal, bio,
      photo_url, phone, email, social_links, status, display_order,
      press_id, jurisdiction, remove_photo
    } = req.body;

    let finalPhotoUrl = existing.photo_url || '';
    const { photo_base64 } = req.body;

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const mime = req.file.mimetype || 'image/jpeg';
        finalPhotoUrl = `data:${mime};base64,${fileBuffer.toString('base64')}`;
      } catch (e) {
        finalPhotoUrl = `/uploads/reporters/${req.file.filename}`;
      }
    } else if (photo_base64 && typeof photo_base64 === 'string' && photo_base64.startsWith('data:image/')) {
      finalPhotoUrl = photo_base64;
      try {
        const matches = photo_base64.match(/^data:image\/([a-zA-Z0-9+\/-]+);base64,(.+)$/);
        if (matches) {
          const ext = '.' + (matches[1] === 'jpeg' ? 'jpg' : matches[1]);
          const filename = `rep_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
          fs.writeFileSync(path.join(reportersUploadDir, filename), Buffer.from(matches[2], 'base64'));
        }
      } catch (e) {}
    } else if (remove_photo === true || remove_photo === 'true') {
      finalPhotoUrl = '';
    } else if (photo_url && typeof photo_url === 'string' && photo_url.trim()) {
      const p = photo_url.trim();
      if (!p.startsWith('file:') && !p.startsWith('C:') && !p.startsWith('D:') && !p.includes('fakepath')) {
        finalPhotoUrl = p;
      }
    }

    let socialLinksJson = existing.social_links;
    if (social_links !== undefined) {
      socialLinksJson = typeof social_links === 'object' ? JSON.stringify(social_links) : social_links;
    }

    const desigText = designation !== undefined ? designation : existing.designation;
    const desigLower = String(desigText || '').toLowerCase();
    const isTopEditorial = desigLower.includes('founder') || desigLower.includes('వ్యవస్థాపక') || 
                           desigLower.includes('editor-in-chief') || desigLower.includes('ప్రధాన సంపాదకులు') || 
                           desigLower.includes('chief') || desigLower.includes('చీఫ్') ||
                           desigLower.includes('associate') || desigLower.includes('అసోసియేట్');

    let finalJurisdiction = jurisdiction !== undefined ? jurisdiction : existing.jurisdiction;
    if (!finalJurisdiction && isTopEditorial) {
      finalJurisdiction = 'ఆంధ్రప్రదేశ్ & తెలంగాణ (ఉభయ తెలుగు రాష్ట్రాలు - AP & Telangana)';
    }

    await dbRun(`
      UPDATE reporters
      SET name = COALESCE(?, name),
          designation = COALESCE(?, designation),
          district = COALESCE(?, district),
          mandal = COALESCE(?, mandal),
          bio = COALESCE(?, bio),
          photo_url = ?,
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          social_links = ?,
          status = COALESCE(?, status),
          display_order = COALESCE(?, display_order),
          press_id = COALESCE(?, press_id),
          jurisdiction = COALESCE(?, jurisdiction),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name !== undefined ? name.trim() : null,
      designation !== undefined ? designation.trim() : null,
      district !== undefined ? district : (isTopEditorial ? 'all-ap-ts' : null),
      mandal !== undefined ? mandal : (isTopEditorial ? 'ఉభయ తెలుగు రాష్ట్రాలు' : null),
      bio !== undefined ? bio : null,
      finalPhotoUrl,
      phone !== undefined ? phone : null,
      email !== undefined ? email : null,
      socialLinksJson,
      status !== undefined ? (status === 'inactive' ? 'inactive' : 'active') : null,
      (function() {
        if (display_order !== undefined && display_order !== null && parseInt(display_order, 10) > 0) return parseInt(display_order, 10);
        if (isTopEditorial) {
          if (desigLower.includes('associate') || desigLower.includes('అసోసియేట్')) return 2;
          return 1;
        }
        return existing.display_order || 3;
      })(),
      press_id !== undefined ? (press_id ? press_id.trim() : null) : null,
      finalJurisdiction !== undefined ? finalJurisdiction : null,
      id
    ]);

    const updated = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    const qrRelativeUrl = await generateReporterQRCode(updated, req);
    if (updated && qrRelativeUrl) updated.qr_code_url = qrRelativeUrl;
    res.json({ success: true, message: 'Reporter profile updated successfully.', reporter: updated });
  } catch (err) {
    console.error('Update reporter error:', err);
    res.status(500).json({ success: false, error: 'Failed to update reporter: ' + err.message });
  }
});

// Admin: Delete reporter profile
app.delete('/api/admin/reporters/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Reporter not found.' });
    }

    // 1. Delete QR Code file(s) from uploads/qr_codes directory
    if (existing.qr_code_url) {
      const qrRelPath = existing.qr_code_url.replace(/^\//, '');
      const qrFullPath = path.join(__dirname, qrRelPath);
      try {
        if (fs.existsSync(qrFullPath)) {
          fs.unlinkSync(qrFullPath);
          console.log(`✓ Deleted reporter QR code file: ${qrFullPath}`);
        }
      } catch (e) {
        console.warn('Failed to delete QR code file:', e.message);
      }
    }

    // Also check standard filenames for this reporter in uploads/qr_codes
    const cleanName = (existing.name || '').replace(/[\\/:*?"<>|]/g, '_').trim();
    const candidateQrFiles = [
      `Reporter_${cleanName}_QR.png`,
      `${cleanName}_QR.png`,
      `Reporter_${existing.id}_QR.png`
    ];
    candidateQrFiles.forEach(fn => {
      try {
        const fp = path.join(qrUploadDir, fn);
        if (fs.existsSync(fp)) {
          fs.unlinkSync(fp);
          console.log(`✓ Deleted QR file by name: ${fp}`);
        }
      } catch (e) {}
    });

    // 2. Delete custom uploaded photo file from uploads/reporters (do not delete default founder photos)
    if (existing.photo_url) {
      const isDefaultPhoto = existing.photo_url.includes('vaka_srinivasa_rao') || existing.photo_url.includes('vaka srinivasrao');
      if (!isDefaultPhoto && !existing.photo_url.startsWith('http://') && !existing.photo_url.startsWith('https://')) {
        const photoRelPath = existing.photo_url.replace(/^\//, '');
        const photoFullPath = path.join(__dirname, photoRelPath);
        try {
          if (fs.existsSync(photoFullPath)) {
            fs.unlinkSync(photoFullPath);
            console.log(`✓ Deleted reporter photo file: ${photoFullPath}`);
          }
        } catch (e) {
          console.warn('Failed to delete reporter photo file:', e.message);
        }
      }
    }

    // 3. Clear reporter_id in articles table if linked
    try {
      await dbRun('UPDATE articles SET reporter_id = NULL WHERE reporter_id = ?', [id]);
    } catch (e) {}

    // 4. Delete reporter permanently from the database
    await dbRun('DELETE FROM reporters WHERE id = ?', [id]);
    console.log(`✓ Reporter ${existing.name} (${id}) deleted permanently from database and files.`);
    await cleanupOrphanQRCodes();

    res.json({
      success: true,
      message: `రిపోర్టర్ "${existing.name}" ప్రొఫైల్ మరియు QR కోడ్ విజయవంతంగా శాశ్వతంగా తొలగించబడ్డాయి.`
    });
  } catch (err) {
    console.error('Delete reporter error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete reporter: ' + err.message });
  }
});

// Admin: Get Current QR Configuration
app.get('/api/admin/reporters-qr/config', authenticateToken, (req, res) => {
  const currentBaseUrl = getBaseServerUrl(req);
  res.json({
    success: true,
    base_url: currentBaseUrl,
    is_custom: Boolean(process.env.APP_BASE_URL || process.env.PUBLIC_URL),
    env_base_url: process.env.APP_BASE_URL || ''
  });
});

// Admin: Regenerate All Reporter QR Codes with specific Domain / Base URL
app.post('/api/admin/reporters-qr/regenerate', authenticateToken, async (req, res) => {
  try {
    const { base_url } = req.body;
    let targetBaseUrl = base_url ? String(base_url).trim().replace(/\/$/, '') : '';
    if (targetBaseUrl) {
      process.env.APP_BASE_URL = targetBaseUrl;
    } else {
      targetBaseUrl = getBaseServerUrl(req);
    }

    const reporters = await dbAll('SELECT * FROM reporters');
    for (const rep of reporters) {
      await generateReporterQRCode(rep, targetBaseUrl);
    }
    await cleanupOrphanQRCodes();

    res.json({
      success: true,
      message: `అన్ని (${reporters.length}) రిపోర్టర్ల ప్రెస్ ID కార్డ్ QR కోడ్‌లు విజయవంతంగా రీ-జెనరేట్ చేయబడ్డాయి!`,
      base_url: targetBaseUrl,
      reporters_count: reporters.length
    });
  } catch (err) {
    console.error('Regenerate QR error:', err);
    res.status(500).json({ success: false, error: 'Failed to regenerate QR codes: ' + err.message });
  }
});

// Admin: Download High-Resolution Reporter QR Code for ID Card Printing
app.get('/api/admin/reporters/:id/download-qr', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const reporter = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    if (!reporter) {
      return res.status(404).json({ success: false, error: 'Reporter not found.' });
    }

    const qrFilename = `Reporter_${reporter.id}_QR.png`;
    const qrPath = path.join(qrUploadDir, qrFilename);

    if (!fs.existsSync(qrPath)) {
      await generateReporterQRCode(reporter, req);
    }

    if (!fs.existsSync(qrPath)) {
      return res.status(404).json({ success: false, error: 'QR code file could not be generated.' });
    }

    const cleanName = (reporter.name || 'Reporter').replace(/[\\/:*?"<>|]/g, '_').trim();
    const downloadFilename = `Reporter_${cleanName}_ID_QR.png`;

    return res.download(qrPath, downloadFilename, (err) => {
      if (err && !res.headersSent) {
        console.error('Download QR send error:', err);
        return res.status(500).json({ success: false, error: 'Failed to download QR code: ' + err.message });
      }
    });
  } catch (err) {
    console.error('Download QR error:', err);
    return res.status(500).json({ success: false, error: 'Failed to download QR code: ' + err.message });
  }
});

// Public Dynamic QR Code Image Endpoint (Generates High-Res On-The-Fly if needed)
app.get(['/api/public/reporters/:id/qr.png', '/api/public/reporters/:id/qr'], async (req, res) => {
  try {
    const { id } = req.params;
    const reporter = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    if (!reporter) {
      return res.status(404).send('Reporter profile not found.');
    }

    const qrFilename = `Reporter_${reporter.id}_QR.png`;
    const qrPath = path.join(qrUploadDir, qrFilename);

    if (fs.existsSync(qrPath)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(qrPath);
    }

    // Generate dynamically on-the-fly if file was not on disk
    const baseUrl = getBaseServerUrl(req);
    const profileUrl = `${baseUrl}/reporter-profile.html?id=${encodeURIComponent(reporter.id)}`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    qrcode.toFileStream(res, profileUrl, {
      width: 1000,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#be185d',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Public QR generation error:', err);
    res.status(500).send('Failed to generate QR code.');
  }
});

// Built-in Smart Local Knowledge Engine for Website Chatbot
function generateLocalChatbotReply({ userQuery, totalArticles, totalReporters, totalEditions, allActiveReporters, matchingArticles, latestArticles, categoryStatsSummary, districtStatsSummary, currentPageUrl, currentPageTitle, latestEditionInfo }) {
  const queryLower = (userQuery || '').toLowerCase().trim();

  // 1. Greetings & Overview
  if (/^(hello|hi|hey|నమస్కారం|హలో|హాయ్|నమస్తే|శుభోదయం|గ్రీటింగ్స్)$/i.test(queryLower)) {
    return `నమస్కారం! 🙏 నేను **మమేక మహోదయం AI సహాయకుడిని**.\n\n` +
      `మా దినపత్రిక (RNI: APTEL/26/A5988), వెబ్‌సైట్‌లోని తాజా వార్తలు, ఈ-పేపర్ (E-Paper), విలేఖరుల వివరాలు, ప్రకటనల రేట్లు లేదా వెబ్‌సైట్‌లోని ఏ పేజీకైనా నా ద్వారా సులభంగా వెళ్లవచ్చు. మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారో అడగండి!`;
  }

  // 2. Newspaper Background, Slogan, RNI & History
  if (/(మమేక మహోదయం|newspaper|పత్రిక|దినపత్రిక|చరిత్ర|history|rni|స్లొగన్|ధ్వేయం|ఆశయం|motto|background|about)/i.test(queryLower) && /(గురించి|ఏమిటి|వివరాలు|చరిత్ర|rni|motto|ధ్వేయం|చెప్పు|సమాచారం)/i.test(queryLower)) {
    return `📰 **మమేక మహోదయం (MAMEKA MAHODAYAM) దినపత్రిక సమగ్ర పరిచయం:**\n\n` +
      `• **ధ్వేయం (Motto):** *"సత్యమే ఆధారం... ప్రజాహితమే మా ధ్యేయం!"* మరియు *"నిజం వైపు - జనం కోసం"*.\n` +
      `• **రిజిస్ట్రేషన్ (RNI No):** **APTEL/26/A5988** (భారత ప్రభుత్వ గుర్తింపు పొందిన తెలుగు దినపత్రిక).\n` +
      `• **వ్యవస్థాపక ప్రధాన సంపాదకులు:** **వాకా శ్రీనివాసరావు** గారు (ఫోన్: +91 9441085075 / +91 7075652808).\n` +
      `• **అసోసియేట్ ఎడిటర్:** **కామరాజుగడ్డ శ్రీనివాస విజయ కుమార్** గారు (ఫోన్: +91 9866162808).\n` +
      `• **తెలంగాణ స్టేట్ బ్యూరో:** **మక్కపాటి నివేదిత** గారు (ఫోన్: +91 9440832347).\n` +
      `• **ప్రధాన కార్యాలయం (Head Office):** బాపట్ల, బాపట్ల జిల్లా, ఆంధ్రప్రదేశ్.\n` +
      `• **సర్క్యులేషన్ & పాఠకులు:** ప్రతిరోజూ **50,000+** ముద్రణా కాపీలు మరియు నెలకు **2,50,000+** డిజిటల్ పాఠకులతో ఆంధ్రప్రదేశ్, తెలంగాణలలో విస్తృత ఆదరణ పొందుతున్నది.\n\n` +
      `👉 [మరిన్ని వివరాలకు మా గురించి (About Us) పేజీ చూడండి](/about.html)`;
  }

  // 3. Current Page Details
  if (/(ఈ పేజీ|current page|ఈ ఆర్టికల్|ఈ వ్యాసం|ఇక్కడ ఏమిటి|this page)/i.test(queryLower)) {
    return `📄 **ప్రస్తుత పేజీ సమాచారం:**\n\n• **పేజీ శీర్షిక:** ${currentPageTitle || 'మమేక మహోదయం'}\n• **URL:** ${currentPageUrl || '/'}\n\nఈ పేజీ లేదా వెబ్‌సైట్‌లోని వార్తలు & విలేఖరుల గురించి ఏ సందేహం ఉన్నా అడగండి!`;
  }

  // 4. Article Counts / Website Statistics
  if (/(వార్తలు|వార్తా|articles|news|count|సంఖ్య|ఎన్ని|మొత్తం)/i.test(queryLower) && /(ఎన్ని|ఉన్నాయి|count|total|how many|available|మొత్తం|వివరాలు|సమాచారం)/i.test(queryLower)) {
    let statsText = `📰 **మమేక మహోదయం వెబ్‌సైట్ ప్రత్యక్ష వివరాలు (Live Stats):**\n\n`;
    statsText += `• **మొత్తం ప్రచురితమైన వార్తలు:** ${totalArticles} వార్తా కథనాలు\n`;
    statsText += `• **విలేఖరులు & సంపాదకులు:** ${totalReporters} మంది\n`;
    statsText += `• **ఈ-పేపర్ డిజిటల్ సంచికలు:** ${totalEditions} సంచికలు\n`;
    if (categoryStatsSummary) {
      statsText += `\n**వర్గాల వారీగా వార్తలు:** ${categoryStatsSummary}\n`;
    }
    statsText += `\n👉 [తాజా వార్తలు చదవడానికి ఇక్కడ క్లిక్ చేయండి](/category.html?c=latest)`;
    return statsText;
  }

  // 5. Reporters / Editors / Directory Matching
  if (/(reporter|reporters|editor|position|designation|విలేఖరి|విలేఖరుల|సంపాదకులు|హోదా|టీమ్|బృందం|వాకా|శ్రీనివాసరావు|విజయకుమార్|నివేదిత|ఇమ్మనుయేల్|సాల్మన్|రోసైయ|సుధాకర్|శివ ప్రభాస్|సమీర్|కాలేష|తెలంగాణ|బ్యూరో|bureau)/i.test(queryLower)) {
    const nameMappings = [
      { keys: ['vaka', 'srinivasarao', 'srinivasa rao', 'వాకా', 'శ్రీనివాసరావు', 'editor in chief', 'editor-in-chief', 'ప్రధాన సంపాదకులు'], matchName: 'వాకా శ్రీనివాసరావు' },
      { keys: ['kamarajugadda', 'srinivasa vijay kumar', 'vijay kumar', 'కామరాజుగడ్డ', 'విజయ కుమార్', 'associate editor', 'అసోసియేట్ ఎడిటర్'], matchName: 'కామరాజుగడ్డ' },
      { keys: ['nivedita', 'makkapati', 'మక్కపాటి', 'నివేదిత', 'telangana bureau', 'తెలంగాణ బ్యూరో'], matchName: 'మక్కపాటి నివేదిత' },
      { keys: ['immanuel', 'medapati', 'ఇమ్మనుయేల్', 'మేడపాటి', 'east godavari'], matchName: 'ఇమ్మనుయేల్' },
      { keys: ['prabhas', 'barapati', 'శివ ప్రభాస్', 'బరపాటి', 'ntr'], matchName: 'ప్రభాస్' },
      { keys: ['bhagyam', 'భాగ్యం'], matchName: 'భాగ్యం' },
      { keys: ['sudhakar', 'pulipati', 'సుధాకర్', 'పులిపాటి'], matchName: 'సుధాకర్' },
      { keys: ['samir beg', 'sameer beg', 'సమీర్ బేగ్', 'సమీర్'], matchName: 'సమీర్' },
      { keys: ['salman raj', 'సాల్మన్ రాజ్'], matchName: 'సాల్మన్' },
      { keys: ['rosaiah', 'రోసైయ'], matchName: 'రోసైయ' },
      { keys: ['singaraju', 'సింగరాజు', 'మార్కాపురం బ్యూరో'], matchName: 'సింగరాజు' },
      { keys: ['sai ram', 'devaki', 'దేవకి సాయి రామ్'], matchName: 'దేవకి' },
      { keys: ['vali', 'వలి', 'కాలేష'], matchName: 'వలి' }
    ];

    let matchedReporter = null;
    for (const m of nameMappings) {
      if (m.keys.some(k => queryLower.includes(k))) {
        matchedReporter = (allActiveReporters || []).find(r => r.name && r.name.includes(m.matchName));
        if (matchedReporter) break;
      }
    }

    if (!matchedReporter) {
      matchedReporter = (allActiveReporters || []).find(r => {
        const rName = (r.name || '').toLowerCase();
        return queryLower.includes(rName) || rName.split(' ').some(part => part.length > 2 && queryLower.includes(part));
      });
    }

    if (matchedReporter) {
      return `👤 **విలేఖరి / సంపాదకుల వివరాలు:**\n\n` +
        `• **పేరు:** **${matchedReporter.name}**\n` +
        `• **హోదా (Designation):** ${matchedReporter.designation || 'విలేఖరి'}\n` +
        `• **జిల్లా/పరిధి:** ${matchedReporter.district || 'ఆంధ్రప్రదేశ్'}${matchedReporter.mandal ? ` (${matchedReporter.mandal})` : ''}\n` +
        `• **ఫోన్ నంబర్:** ${matchedReporter.phone || '+91 7075652808'}\n` +
        `• **ఈమెయిల్:** ${matchedReporter.email || 'mahodayamnews@gmail.com'}\n` +
        `${matchedReporter.bio ? `• **వివరణ:** ${matchedReporter.bio}\n` : ''}\n` +
        `👉 [సంపాదకీయ బృందం పూర్తి జాబితా చూడండి](/editorial-team.html)`;
    }

    if (/(విలేఖరులు|టీమ్|బృందం|సంపాదకులు|reporters|team|editors)/i.test(queryLower)) {
      let repText = `👥 **మమేక మహోదయం సంపాదకీయ బృందం & విలేఖరులు (${totalReporters} మంది):**\n\n`;
      (allActiveReporters || []).slice(0, 8).forEach(r => {
        repText += `• **${r.name}** - ${r.designation || 'విలేఖరి'} (${r.district || 'ఆంధ్రప్రదేశ్'}${r.phone ? ` | 📞 ${r.phone}` : ''})\n`;
      });
      repText += `\n👉 [సంపాదకీయ బృందం పూర్తి డైరెక్టరీ తెరవండి](/editorial-team.html)`;
      return repText;
    }
  }

  // 6. E-Paper & PDF Queries
  if (/(epaper|ఈ[-–\s]*పేపర్|pdf|పత్రిక|దినపత్రిక|download|డౌన్‌లోడ్|సంచిక|పేజీలు|pages)/i.test(queryLower)) {
    const pagesCount = latestEditionInfo ? latestEditionInfo.total_pages || 8 : 8;
    const editionDate = latestEditionInfo && latestEditionInfo.edition_date ? String(latestEditionInfo.edition_date).split('T')[0] : 'నేటి సంచిక';
    return `🗞️ **మమేక మహోదయం ఈ-పేపర్ (Digital E-Paper):**\n\n` +
      `• **సంచిక:** ${editionDate} (పూర్తి రంగుల ముద్రణా ప్రతి)\n` +
      `• **మొత్తం పేజీలు:** **${pagesCount} పేజీలు**\n` +
      `• **ఆన్‌లైన్ రీడర్:** పేజీ వారీగా జూమ్ మరియు ఇంటరాక్టివ్ రీడర్ అందుబాటులో ఉంది.\n` +
      `• **డౌన్‌లోడ్:** ఉచిత పూర్తి PDF డౌన్‌లోడ్ సదుపాయం కలదు.\n\n` +
      `👉 [ఈ-పేపర్ చదవడానికి మరియు డౌన్‌లోడ్ చేయడానికి ఇక్కడ క్లిక్ చేయండి](/epaper.html)`;
  }

  // 7. Contact / Office / Phone / Address / Email
  if (/(contact|phone|email|office|చిరునామా|ఆఫీస్|ఫోన్|నంబర్|ఈమెయిల్|మమ్మల్ని సంప్రదించండి|సంప్రదించండి|whatsapp|వాట్సాప్|కార్యాలయం|ప్రధాన కార్యాలయం|హెడ్ ఆఫీస్|address)/i.test(queryLower)) {
    return `📞 **మమేక మహోదయం కార్యాలయ సంప్రదింపు వివరాలు:**\n\n` +
      `• **ప్రధాన కార్యాలయం (Head Office):** బాపట్ల, బాపట్ల జిల్లా, ఆంధ్రప్రదేశ్.\n` +
      `• **మొబైల్ & WhatsApp:** **+91 7075652808**, **+91 9441085075**\n` +
      `• **అధికారిక ఈమెయిల్:** **mahodayamnews@gmail.com**\n` +
      `• **ప్రధాన సంపాదకులు:** వాకా శ్రీనివాసరావు\n\n` +
      `👉 [మమ్మల్ని సంప్రదించండి పేజీకి వెళ్లండి](/contact.html)`;
  }

  // 8. Advertising & Media Kit Tariff
  if (/(advertise|అడ్వర్టైజ్|ప్రకటనలు|యాడ్స్|రేట్లు|tariff|packages|media kit)/i.test(queryLower)) {
    return `📢 **ప్రకటనల వివరాలు & టారిఫ్ (Advertisement Tariff):**\n\n` +
      `• **ముద్రణా ప్రకటనలు:** Full Page, Half Page, Quarter Page మరియు బాటమ్ స్ట్రిప్ యాడ్స్ లభ్యం.\n` +
      `• **డిజిటల్ బ్యానర్లు:** వెబ్‌సైట్ మరియు PWA మొబైల్ యాప్‌లో హై-విజిబిలిటీ బ్యానర్లు.\n` +
      `• **సర్క్యులేషన్:** రోజూ 50,000+ ప్రింట్ కాపీలు, నెలకు 2,50,000+ డిజిటల్ వీక్షణలు.\n` +
      `• **బుకింగ్ సంప్రదింపు:** ఫోన్: +91 7075652808 | ఈమెయిల్: mahodayamnews@gmail.com\n\n` +
      `👉 [ప్రకటనల పేజీని తెరవండి](/advertise.html)`;
  }

  // 9. Search & Verification (Telling whether news is present or not)
  if (matchingArticles && matchingArticles.length > 0) {
    let artText = `📰 **మీరు వెతికిన అంశంపై మా వెబ్‌సైట్‌లో ప్రచురితమైన కథనాలు లభించాయి:**\n\n`;
    matchingArticles.slice(0, 4).forEach((a, idx) => {
      const link = a.slug ? `/news/${a.slug}` : `/article.html?id=${a.id}`;
      artText += `${idx + 1}. **[${a.title_te}](${link})**\n   _${a.category || 'వార్తలు'} • ${a.district || 'ఆంధ్రప్రదేశ్'}_\n\n`;
    });
    artText += `👉 [మరిన్ని ఫలితాల కోసం సెర్చ్ పేజీ చూడండి](/search.html?q=${encodeURIComponent(userQuery)})`;
    return artText;
  }

  // If user asked about a specific news item, person, or event not in DB:
  if (/(వార్త|ఉందా|జరిగిందా|ప్రమాదం|కేసు|మంత్రి|సీఎం|పోలీస్|రోడ్డు|విషయం|న్యూస్|news|article|present|available)/i.test(queryLower)) {
    return `క్షమించండి, మీరు అడిగిన **"${userQuery}"** అంశంపై ప్రస్తుతం మా వెబ్‌సైట్‌లో ప్రత్యేకంగా ప్రచురితమైన వార్తా కథనం లభించలేదు.\n\n` +
      `మా దినపత్రిక ప్రతిరోజూ ప్రచురించే తాజా వార్తల కోసం దయచేసి **ఈ-పేపర్** చూడండి లేదా మా **శోధన (Search)** పేజీ ద్వారా వెతకండి.\n\n` +
      `👉 [ఈ-పేపర్ సంచిక చూడండి](/epaper.html) | [వార్తను శోధించండి](/search.html?q=${encodeURIComponent(userQuery)})`;
  }

  return `క్షమించండి, మీ ప్రశ్నకు సరిపోయే వివరాలు మా వద్ద లభ్యం కాలేదు.\n\n` +
    `మీరు **వార్తలు, ఈ-పేపర్, విలేఖరుల జాబితా, ఆఫీస్ చిరునామా లేదా ప్రకటనల రేట్లు** గురించి నన్ను అడగవచ్చు. లేదా నేను మిమ్మల్ని సంబంధిత పేజీకి తీసుకెళ్లగలను!`;
}

// Helper to detect website manipulation action intent
function detectWebsiteAction(queryLower) {
  const norm = (queryLower || '').replace(/[\u2010-\u2015\u2212]/g, '-').trim();
  const isDirectNavigation = /(redirect|take me|go to|goto|open|navigate|show me|తీసుకెళ్ళు|తీసుకువెళ్ళు|వెళ్ళు|ఓపెన్|చూపించు|తెరవండి|వెళ్ళాలి)/i.test(norm);

  // E-Paper
  if (/(epaper|ఈ[-–\s]*పేపర్|pdf|పత్రిక|దినపత్రిక|download|డౌన్‌లోడ్)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/epaper.html', label: '📖 ఈ-పేపర్ తెరవండి (Open E-Paper)', autoRedirect: isDirectNavigation };
  }
  // Editorial Team
  if (/(reporters|editorial[-–\s]*team|సంపాదకీయ[-–\s]*బృందం|విలేఖరుల[-–\s]*జాబితా|మొత్తం[-–\s]*విలేఖరులు|team[-–\s]*page|సంపాదకులు|విలేఖరులు)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/editorial-team.html', label: '👥 సంపాదకీయ బృందం (Editorial Team)', autoRedirect: isDirectNavigation };
  }
  // Advertising
  if (/(advertise|ప్రకటనలు|ad rates|టారిఫ్|యాడ్స్)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/advertise.html', label: '📢 ప్రకటనల వివరాలు (View Ad Rates)', autoRedirect: isDirectNavigation };
  }
  // Contact
  if (/(contact|సంప్రదించండి|contact us|office|ఫోన్|ఈమెయిల్|చిరునామా|ఆఫీస్)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/contact.html', label: '📞 సంప్రదించే పేజీ (Contact Us)', autoRedirect: isDirectNavigation };
  }
  // About
  if (/(about|మా గురించి|చరిత్ర|history|background)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/about.html', label: 'ℹ️ మా గురించి (About Us)', autoRedirect: isDirectNavigation };
  }
  // Privacy
  if (/(privacy|గోప్యత|పాలసీ|policy)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/privacy.html', label: '🔒 గోప్యతా విధానం (Privacy Policy)', autoRedirect: isDirectNavigation };
  }
  // Terms
  if (/(terms|నిబంధనలు|షరతులు|conditions)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/terms.html', label: '📜 నిబంధనలు (Terms of Service)', autoRedirect: isDirectNavigation };
  }
  // Home
  if (/(home|హోమ్|ముఖ్య పేజీ|main page)/i.test(norm)) {
    return { type: 'NAVIGATE', url: '/', label: '🏠 హోమ్ పేజీ (Home Page)', autoRedirect: isDirectNavigation };
  }
  // Search
  if (/(search|వెతుకు|శోధించు|అన్వేషణ|find)/i.test(norm)) {
    const cleanQ = norm.replace(/(search|for|find|శోధించు|వెతుకు|గురించి|తీసుకెళ్ళు|ఓపెన్)/gi, '').trim();
    const searchUrl = cleanQ ? `/search.html?q=${encodeURIComponent(cleanQ)}` : '/search.html';
    return { type: 'SEARCH', query: cleanQ, url: searchUrl, label: `🔍 శోధించండి (Search${cleanQ ? ` "${cleanQ}"` : ''})`, autoRedirect: isDirectNavigation };
  }
  // Language Switch
  if (/(english|ఇంగ్లీష్|switch to english)/i.test(norm)) {
    return { type: 'SWITCH_LANGUAGE', lang: 'en', label: '🌐 Switch to English' };
  }
  if (/(telugu|తెలుగు|switch to telugu)/i.test(norm)) {
    return { type: 'SWITCH_LANGUAGE', lang: 'te', label: '🌐 Switch to Telugu' };
  }

  // Districts
  const districtMap = {
    'bapatla': 'బాపట్ల', 'బాపట్ల': 'బాపట్ల',
    'prakasam': 'ప్రకాశం', 'ప్రకాశం': 'ప్రకాశం',
    'guntur': 'గుంటూరు', 'గుంటూరు': 'గుంటూరు',
    'palnadu': 'పల్నాడు', 'పల్నాడు': 'పల్నాడు',
    'markapuram': 'మార్కాపురం', 'మార్కాపురం': 'మార్కాపురం',
    'krishna': 'కృష్ణా', 'కృష్ణా': 'కృష్ణా'
  };
  for (const [key, name] of Object.entries(districtMap)) {
    if (norm.includes(key)) {
      return { type: 'FILTER_DISTRICT', district: key, url: `/district.html?d=${key}`, label: `📍 ${name} వార్తలు (View ${name} News)`, autoRedirect: isDirectNavigation };
    }
  }

  // Categories
  const catMap = {
    'politics': 'రాజకీయాలు', 'రాజకీయాలు': 'రాజకీయాలు',
    'state': 'రాష్ట్ర వార్తలు', 'రాష్ట్ర': 'రాష్ట్ర వార్తలు',
    'cinema': 'సినిమా', 'సినిమా': 'సినిమా',
    'sports': 'క్రీడలు', 'క్రీడలు': 'క్రీడలు',
    'education': 'విద్య & ఉద్యోగాలు', 'విద్య': 'విద్య & ఉద్యోగాలు',
    'editorial': 'సంపాదకీయం', 'సంపాదకీయం': 'సంపాదకీయం',
    'national': 'జాతీయ వార్తలు', 'జాతీయ': 'జాతీయ వార్తలు'
  };
  for (const [key, name] of Object.entries(catMap)) {
    if (norm.includes(key)) {
      return { type: 'FILTER_CATEGORY', category: key, url: `/category.html?c=${key}`, label: `📰 ${name} (View ${name})`, autoRedirect: isDirectNavigation };
    }
  }

  return null;
}

// ==========================================================================
// WEBSITE AI CHATBOT ROUTE (MAMEKA MAHODAYAM AI ASSISTANT)
// ==========================================================================
app.post('/api/chatbot', async (req, res) => {
  try {
    const { message, history, currentPageUrl, currentPageTitle, pageExcerpt, lang } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const userQuery = message.trim();
    const queryLower = userQuery.toLowerCase();

    // Tokenized Smart Keyword Extraction
    const stopWords = new Set([
      'ఏమిటి', 'ఏమిటీ', 'ఏంటి', 'ఎంత', 'ఎవరు', 'ఎక్కడ', 'ఎప్పుడు', 'ఎందుకు', 'ఎలా', 'ఉన్నాయి',
      'ఉంది', 'గురించి', 'వివరాలు', 'సమాచారం', 'చేయు', 'చెప్పు', 'చూపించు', 'చెప్పండి', 'చూపించండి',
      'మొత్తం', 'ఏమైనా', 'అడిగి', 'అడగండి', 'నాకు', 'మాకు', 'ఉందా', 'వార్తలు', 'గారి', 'గారు',
      'what', 'is', 'are', 'who', 'where', 'when', 'why', 'how', 'the', 'a', 'an', 'show', 'tell', 'me', 'about', 'list', 'many', 'details', 'info'
    ]);

    const words = queryLower
      .replace(/[^\w\s\u0C00-\u0C7F]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));

    let matchingArticles = [];
    try {
      if (words.length > 0) {
        const clauses = [];
        const params = [];
        words.slice(0, 5).forEach(w => {
          const p = `%${w}%`;
          clauses.push(`(title_te LIKE ? OR title_en LIKE ? OR summary_te LIKE ? OR content_te LIKE ? OR category LIKE ? OR district LIKE ?)`);
          params.push(p, p, p, p, p, p);
        });

        matchingArticles = await dbAll(
          `SELECT id, slug, title_te, title_en, summary_te, summary_en, content_te, category, district, published_at 
           FROM articles 
           WHERE status = 'published' AND (${clauses.join(' OR ')}) 
           ORDER BY published_at DESC LIMIT 6`,
          params
        );
      }
    } catch (e) {
      console.warn('Chatbot article search warning:', e.message);
    }

    // Fallback search if tokenized matching returned 0 articles
    if (!matchingArticles || matchingArticles.length === 0) {
      try {
        const searchPattern = `%${userQuery.replace(/[%_]/g, '')}%`;
        matchingArticles = await dbAll(
          `SELECT id, slug, title_te, title_en, summary_te, summary_en, content_te, category, district, published_at 
           FROM articles 
           WHERE status = 'published' AND (
             title_te LIKE ? OR title_en LIKE ? OR summary_te LIKE ? OR content_te LIKE ? OR category LIKE ? OR district LIKE ?
           ) 
           ORDER BY published_at DESC LIMIT 5`,
          [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]
        );
      } catch (e) {}
    }

    // Fetch latest published articles
    let latestArticles = [];
    try {
      latestArticles = await dbAll(
        `SELECT id, slug, title_te, summary_te, category, district, published_at 
         FROM articles 
         WHERE status = 'published' 
         ORDER BY published_at DESC LIMIT 5`
      );
    } catch (e) {
      console.warn('Chatbot latest articles warning:', e.message);
    }

    // 1. Live statistics
    let totalArticles = 0;
    let totalReporters = 0;
    let totalEditions = 0;
    let categoryStatsSummary = '';
    let districtStatsSummary = '';
    let latestEditionInfo = null;

    try {
      const artCountRow = await dbGet("SELECT COUNT(*) as count FROM articles WHERE status = 'published'");
      totalArticles = artCountRow ? parseInt(artCountRow.count || artCountRow['COUNT(*)'] || 0) : 0;

      const repCountRow = await dbGet("SELECT COUNT(*) as count FROM reporters WHERE status = 'active'");
      totalReporters = repCountRow ? parseInt(repCountRow.count || repCountRow['COUNT(*)'] || 0) : 0;

      const edCountRow = await dbGet("SELECT COUNT(*) as count FROM editions WHERE file_size_bytes > 0 AND status = 'published'");
      totalEditions = edCountRow ? parseInt(edCountRow.count || edCountRow['COUNT(*)'] || 0) : 0;

      const catRows = await dbAll("SELECT category, COUNT(*) as count FROM articles WHERE status = 'published' GROUP BY category");
      if (catRows && catRows.length > 0) {
        categoryStatsSummary = catRows.map(r => `${r.category || 'General'}: ${r.count || r['COUNT(*)']}`).join(', ');
      }

      const distRows = await dbAll("SELECT district, COUNT(*) as count FROM articles WHERE status = 'published' AND district IS NOT NULL GROUP BY district");
      if (distRows && distRows.length > 0) {
        districtStatsSummary = distRows.map(r => `${r.district}: ${r.count || r['COUNT(*)']}`).join(', ');
      }

      latestEditionInfo = await dbGet("SELECT id, edition_date, total_pages, edition_name, pdf_filename, file_size_bytes FROM editions WHERE status = 'published' AND file_size_bytes > 0 ORDER BY edition_date DESC, created_at DESC LIMIT 1");
    } catch (e) {
      console.warn('Chatbot stats aggregation warning:', e.message);
    }

    // 2. Reporters directory
    let allActiveReporters = [];
    try {
      allActiveReporters = await dbAll(
        `SELECT id, name, designation, district, mandal, bio, phone, email, jurisdiction, press_id, status 
         FROM reporters 
         WHERE status = 'active' 
         ORDER BY designation ASC, name ASC`
      );
    } catch (e) {
      console.warn('Chatbot reporter directory warning:', e.message);
    }

    // Combine articles
    const articleMap = new Map();
    [...matchingArticles, ...latestArticles].forEach(a => {
      if (a && a.id) articleMap.set(a.id, a);
    });
    const finalArticles = Array.from(articleMap.values());

    // Build structured real-time context text for Gemini
    let websiteContext = `
[NEWSPAPER IDENTITY & CORE FACTS]:
- Official Name: మమేక మహోదయం (MAMEKA MAHODAYAM) - Telugu Daily Newspaper (తెలుగు దినపత్రిక).
- Slogan / Motto: "సత్యమే ఆధారం... ప్రజాహితమే మా ధ్యేయం!" and "నిజం వైపు - జనం కోసం".
- RNI Registration Number: APTEL/26/A5988 (Government of India registered).
- Founder & Editor-in-Chief (వ్యవస్థాపక ప్రధాన సంపాదకులు): వాకా శ్రీనివాసరావు (Vaka Srinivasa Rao) | Phone: +91 9441085075, +91 7075652808.
- Associate Editor (అసోసియేట్ ఎడిటర్): కామరాజుగడ్డ శ్రీనివాస విజయ కుమార్ (Kamarajugadda Srinivasa Vijaya Kumar) | Phone: +91 9866162808.
- Telangana State Bureau: మక్కపాటి నివేదిత | Phone: +91 9440832347.
- Head Office: బాపట్ల, బాపట్ల జిల్లా, ఆంధ్రప్రదేశ్.
- Official Email: mahodayamnews@gmail.com | Official WhatsApp & Phone: +91 7075652808.
- Circulation & Reach: 50,000+ Daily Print circulation across Andhra Pradesh & Telangana; 2,50,000+ Monthly digital readers; covering 26+ districts.
- Advertising Tariff: Full Page, Half Page, Quarter Page, Bottom Strip, Digital banner advertising (/advertise.html).

[DIGITAL E-PAPER PUBLICATION]:
- Status: Daily 8-page full color print edition replica available online every morning.
- Interactive Reader URL: /epaper.html (features high-resolution zoom, full screen, page 1 to 8 selector, and free full-issue PDF download).
- Latest Edition Date: ${latestEditionInfo && latestEditionInfo.edition_date ? String(latestEditionInfo.edition_date).split('T')[0] : '2026-10-19'} (${latestEditionInfo ? latestEditionInfo.total_pages || 8 : 8} Pages).

[CURRENT USER VISITING CONTEXT]:
- User Current URL: ${currentPageUrl || '/'}
- Page Title: ${currentPageTitle || 'మమేక మహోదయం'}
- Language Preference: ${lang || 'te'}
- Page Excerpt: ${pageExcerpt ? pageExcerpt.slice(0, 400) : 'N/A'}

[LIVE DATABASE STATISTICS]:
- Total Published News Articles: ${totalArticles}
- Total Active Reporters & Editors in Directory: ${totalReporters}
- Total E-Paper Editions: ${totalEditions}
- Categories Breakdown: ${categoryStatsSummary || 'Various categories available'}
- Districts Breakdown: ${districtStatsSummary || 'Various districts available'}

[COMPLETE SITEMAP & PAGE NAVIGATION TARGETS]:
- Home Page: /
- E-Paper Reader & PDF Download: /epaper.html
- Editorial & Reporters Directory: /editorial-team.html
- Contact Us & Office Address: /contact.html
- Advertising Rates & Media Kit: /advertise.html
- About Newspaper & Mission: /about.html
- Privacy Policy: /privacy.html
- Terms & Conditions: /terms.html
- Search News: /search.html?q=...
- Category Feeds: /category.html?c=state, politics, national, cinema, sports, education, editorial
- District Feeds: /district.html?d=bapatla, prakasam, markapuram, guntur, palnadu, krishna

[COMPLETE ACTIVE REPORTERS DIRECTORY (${allActiveReporters.length} JOURNALISTS)]:
`;
    if (allActiveReporters.length > 0) {
      allActiveReporters.forEach((r, idx) => {
        websiteContext += `${idx + 1}. Name: "${r.name}" | Designation: "${r.designation || 'Reporter'}" | District: "${r.district || 'N/A'}" | Mandal: "${r.mandal || 'N/A'}" | Phone: "${r.phone || 'N/A'}" | Email: "${r.email || 'N/A'}"\n`;
      });
    }

    websiteContext += `\n[PUBLISHED NEWS ARTICLES MATCHING QUERY OR RECENT]:\n`;
    if (finalArticles.length > 0) {
      finalArticles.forEach((a, idx) => {
        const link = a.slug ? `/news/${a.slug}` : `/article.html?id=${a.id}`;
        const contentExcerpt = (a.content_te || a.summary_te || '').slice(0, 350);
        websiteContext += `${idx + 1}. Title: "${a.title_te}" ${a.title_en ? `(${a.title_en})` : ''} | Category: ${a.category || 'General'} | District: ${a.district || 'N/A'} | Link: [${a.title_te}](${link})\n   Summary: ${contentExcerpt}\n\n`;
      });
    } else {
      websiteContext += `(No specific published articles matching this query found in database)\n`;
    }

    // Read active Gemini API key directly from .env first to guarantee latest user key
    let apiKey = '';
    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/GEMINI_API_KEY\s*=\s*([^\r\n]+)/);
        if (match && match[1]) apiKey = match[1].trim();
      }
    } catch (e) {}
    if (!apiKey) {
      apiKey = (process.env.GEMINI_API_KEY || '').trim();
    }

    let replyText = '';
    let action = null;

    if (apiKey) {
      const systemInstructionText = `You are "మమేక మహోదయం AI అసిస్టెంట్" (Mameka Mahodayam AI Assistant), the official virtual guide and interactive website controller for the MAMEKA MAHODAYAM (మమేక మహోదయం) Telugu daily newspaper website.

YOUR RESPONSIBILITIES & CAPABILITIES:
1. ENCYCLOPEDIC KNOWLEDGE: You know every detail about Mameka Mahodayam (motto, RNI: APTEL/26/A5988, editor-in-chief వాకా శ్రీనివాసరావు, associate editor కామరాజుగడ్డ శ్రీనివాస విజయ కుమార్, Telangana bureau మక్కపాటి నివేదిత, head office in Bapatla, Andhra Pradesh, phone +91 7075652808, advertising packages, e-paper, and all 21 reporters).
2. SEARCH & VERIFICATION:
   - When the user asks if a specific news story, topic, or event is present on the website:
     * Check the published news articles in the context.
     * If MATCHING articles are found: Confirm that the news IS available, quote the headline and key summary, provide the markdown link [వార్త చదవండి](/article.html?id=...), and add an action to open it.
     * If NO matching articles are found in the website database:
       Explicitly state that this specific story is NOT currently published on the website:
       "క్షమించండి, మీరు అడిగిన అంశంపై ప్రస్తుతం మా వెబ్‌సైట్‌లో ప్రచురితమైన ప్రత్యేక కథనం లభించలేదు. అయితే మా తాజా ఈ-పేపర్ సంచికలో లేదా సెర్చ్ పేజీలో వెతకవచ్చు."
       And emit an ACTION_JSON with type "SEARCH" or "NAVIGATE" pointing to /search.html?q=... or /epaper.html!
3. PAGE REDIRECTION & WEBSITE ACTIONS:
   - When the user asks to navigate, open, go to, view, or redirect to any page, category, district, or section (e.g. "take me to epaper", "open contact page", "బాపట్ల వార్తలకు తీసుకెళ్ళు", "redirect me to...", "ఓపెన్ చేయ్"):
     * Confirm politely in your response text that you are directing them there.
     * At the VERY END of your response, output an ACTION_JSON with "autoRedirect": true.
     Example format:
     ACTION_JSON:{"type":"NAVIGATE|FILTER_DISTRICT|FILTER_CATEGORY|SWITCH_LANGUAGE|SEARCH","url":"/path","label":"Action Button Text","autoRedirect":true}
   - If the user asks a general question where navigating is optional, output "autoRedirect": false.
   Example actions:
   - E-Paper: ACTION_JSON:{"type":"NAVIGATE","url":"/epaper.html","label":"📖 ఈ-పేపర్ తెరవండి (Open E-Paper)","autoRedirect":false}
   - Contact: ACTION_JSON:{"type":"NAVIGATE","url":"/contact.html","label":"📞 సంప్రదించండి (Contact Us)","autoRedirect":false}
   - Editorial Team: ACTION_JSON:{"type":"NAVIGATE","url":"/editorial-team.html","label":"👥 సంపాదకీయ బృందం (Editorial Team)","autoRedirect":false}
   - Advertise: ACTION_JSON:{"type":"NAVIGATE","url":"/advertise.html","label":"📢 ప్రకటనల వివరాలు (Ad Rates)","autoRedirect":false}
   - Bapatla News: ACTION_JSON:{"type":"FILTER_DISTRICT","district":"bapatla","url":"/district.html?d=bapatla","label":"📍 బాపట్ల వార్తలు","autoRedirect":false}
   - Politics: ACTION_JSON:{"type":"FILTER_CATEGORY","category":"politics","url":"/category.html?c=politics","label":"📰 రాజకీయాలు","autoRedirect":false}
   - Search: ACTION_JSON:{"type":"SEARCH","query":"search term","url":"/search.html?q=search+term","label":"🔍 శోధించండి","autoRedirect":false}
4. TONE & ACCURACY:
   - Respond in fluent, polite Telugu if the user writes in Telugu, or English if they write in English.
   - Use bold titles, bullet points, emoji accents, and markdown links.
   - Never invent outside rumors. Rely solely on true information about Mameka Mahodayam.`;

      const contentsPayload = [];
      if (Array.isArray(history) && history.length > 0) {
        history.slice(-6).forEach(item => {
          if (item.role && item.text) {
            contentsPayload.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }]
            });
          }
        });
      }

      const currentPromptWithContext = `USER QUERY: "${userQuery}"\n\nWEBSITE DATABASE CONTEXT:\n${websiteContext}`;
      contentsPayload.push({
        role: 'user',
        parts: [{ text: currentPromptWithContext }]
      });

      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const geminiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contentsPayload,
              systemInstruction: { parts: [{ text: systemInstructionText }] },
              generationConfig: { temperature: 0.2, maxOutputTokens: 1200 }
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            if (geminiData && geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
              replyText = geminiData.candidates[0].content.parts.map(p => p.text).join('\n');
              if (replyText) {
                console.log(`✓ [AI CHATBOT] Generated response using Gemini model: ${modelName}`);
                break;
              }
            }
          } else {
            const errBody = await geminiRes.text();
            console.warn(`[AI CHATBOT] Model ${modelName} returned status ${geminiRes.status}:`, errBody.slice(0, 120));
          }
        } catch (e) {
          console.warn(`[AI CHATBOT] Fetch error for model ${modelName}:`, e.message);
        }
      }
    }

    // Extract ACTION_JSON if emitted by Gemini
    if (replyText) {
      const actionMatch = replyText.match(/ACTION_JSON:\s*(\{.*\})/s);
      if (actionMatch) {
        try {
          action = JSON.parse(actionMatch[1]);
          replyText = replyText.replace(/ACTION_JSON:\s*(\{.*\})/s, '').trim();
        } catch (e) {}
      }
    }

    // Failsafe Smart Local Knowledge Engine
    if (!replyText) {
      replyText = generateLocalChatbotReply({
        userQuery,
        totalArticles,
        totalReporters,
        totalEditions,
        allActiveReporters,
        matchingArticles,
        latestArticles,
        categoryStatsSummary,
        districtStatsSummary,
        currentPageUrl,
        currentPageTitle,
        latestEditionInfo
      });
    }

    // Detect action intent if not set by Gemini
    if (!action) {
      action = detectWebsiteAction(queryLower);
    }

    res.json({
      success: true,
      reply: replyText,
      action: action || null
    });
  } catch (err) {
    console.error('Chatbot API error:', err);
    res.status(500).json({
      success: false,
      error: 'Chatbot service error.',
      reply: "క్షమించండి, లోపము సంభవించినది. దయచేసి మళ్లీ ప్రయత్నించండి."
    });
  }
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseServerUrl(req);
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/admin/\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// Dynamic sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getBaseServerUrl(req);
    const now = new Date().toISOString().split('T')[0];

    const articles = await dbAll("SELECT id, slug, published_at, updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 500");
    const editions = await dbAll("SELECT id, edition_date FROM editions WHERE (status = 'published' OR status = 'active') AND file_size_bytes > 0 AND pdf_filename != 'default.pdf' ORDER BY edition_date DESC LIMIT 100");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const staticPages = [
      '',
      '/epaper.html',
      '/editorial-team.html',
      '/about.html',
      '/contact.html',
      '/advertise.html',
      '/privacy.html',
      '/terms.html',
      '/search.html'
    ];

    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    }

    for (const art of (articles || [])) {
      const artUrl = `${baseUrl}/news/${encodeURIComponent(art.slug || art.id)}`;
      const lastMod = (art.updated_at || art.published_at || now).toString().split('T')[0];
      xml += `  <url>\n    <loc>${artUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    }

    for (const ed of (editions || [])) {
      const edUrl = `${baseUrl}/epaper.html?date=${ed.edition_date}`;
      xml += `  <url>\n    <loc>${edUrl}</loc>\n    <lastmod>${ed.edition_date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;
    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Admin Portal Clean SPA Routing
app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'admin', 'index.html'));
});

// Express Page Routing for Clean URLs
app.get(['/reporters', '/reporters/:id', '/editorial-team', '/our-team'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'editorial-team.html'));
});

app.get(['/district', '/district/:slug'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'district.html'));
});

app.get(['/category', '/category/:slug', '/state', '/politics', '/national-international', '/sports', '/cinema', '/education-jobs', '/editorial'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'category.html'));
});

app.get(['/news', '/news/:identifier', '/news/*'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'article.html'));
});

app.get(['/epaper', '/e-paper'], (req, res) => {
  res.sendFile(path.join(projectRoot, 'epaper.html'));
});

// Global Express Error Middleware (Catches Multer & Route Errors Cleanly)
app.use((err, req, res, next) => {
  if (err) {
    const statusCode = err.status || err.statusCode || (err.name === 'MulterError' ? 400 : 400);
    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Invalid request parameters.'
    });
  }
  next();
});

// Initialize Database Schema & Start Server
if (process.env.VERCEL) {
  initDatabase().catch(err => console.warn('Database schema init notice:', err.message));
} else {
  initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` MAMEKA MAHODAYAM CMS Backend Server Running           `);
    console.log(` Port: ${PORT} (0.0.0.0)                               `);
    console.log(` Public Website: http://localhost:${PORT}/             `);
    console.log(` Admin Portal:   http://localhost:${PORT}/admin/        `);
    console.log(`=======================================================`);

    // Background pre-generation of image thumbnails & QR Codes (non-destructive)
    const { pregenerateAllThumbnails } = require('./services/image-optimizer');
    pregenerateAllThumbnails().catch(e => console.warn('Thumbnail pregen error:', e.message));
    generateAllQRCodes().catch(e => console.warn('QR Code pregen error:', e.message));
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
  });
}

module.exports = app;
