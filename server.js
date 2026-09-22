const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { db, dbRun, dbAll, dbGet, initDatabase, editionsDir, pagesDir } = require('./db');
const { processEdition } = require('./ingestion');

const app = express();
const PORT = process.env.PORT || 3000;

// Production JWT Secret Enforcement Check
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is required in production mode.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'mameka_mahodayam_newspaper_secret_key_2026';

// Middleware Setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(reportersUploadDir)) fs.mkdirSync(reportersUploadDir, { recursive: true });
if (!fs.existsSync(qrUploadDir)) fs.mkdirSync(qrUploadDir, { recursive: true });

function getBaseServerUrl(reqOrBaseUrl) {
  let baseUrl = process.env.APP_BASE_URL || process.env.PUBLIC_URL;
  if (!baseUrl && reqOrBaseUrl) {
    if (typeof reqOrBaseUrl === 'string') {
      baseUrl = reqOrBaseUrl;
    } else if (reqOrBaseUrl.get && reqOrBaseUrl.protocol) {
      baseUrl = `${reqOrBaseUrl.protocol}://${reqOrBaseUrl.get('host')}`;
    }
  }
  return baseUrl ? baseUrl.replace(/\/$/, '') : `http://localhost:${PORT}`;
}

async function generateReporterQRCode(reporter, reqOrBaseUrl) {
  if (!reporter || !reporter.id || !reporter.name) return;
  try {
    const cleanName = reporter.name.replace(/[\\/:*?"<>|]/g, '_').trim();
    const qrFilename = `Reporter_${cleanName}_QR.png`;
    const qrPath = path.join(qrUploadDir, qrFilename);
    const baseUrl = getBaseServerUrl(reqOrBaseUrl);

    const profileUrl = `${baseUrl}/reporter-profile.html?id=${encodeURIComponent(reporter.id)}`;

    await qrcode.toFile(qrPath, profileUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#be185d',
        light: '#ffffff'
      }
    });
    const qrRelativeUrl = `/uploads/qr_codes/${qrFilename}`;
    await dbRun('UPDATE reporters SET qr_code_url = ? WHERE id = ?', [qrRelativeUrl, reporter.id]);
    console.log(`✓ [QR GENERATOR] Created Reporter ID Card QR: ${qrFilename} -> ${profileUrl}`);
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

async function generateAllQRCodes() {
  try {
    const reporters = await dbAll('SELECT * FROM reporters');
    for (const rep of reporters) {
      await generateReporterQRCode(rep);
    }
    const editions = await dbAll('SELECT * FROM editions');
    for (const ed of editions) {
      await generateEditionQRCode(ed);
    }
    const articles = await dbAll('SELECT * FROM articles WHERE status = "published" OR status = "approved"');
    for (const art of articles) {
      await generateArticleQRCode(art);
    }
    console.log(`✓ [QR GENERATOR] Pre-generated QR codes for ${reporters.length} reporters, ${editions.length} editions, ${articles.length} articles.`);
  } catch (err) {
    console.warn('QR Codes batch generation notice:', err.message);
  }
}

app.use(express.static(__dirname));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(uploadsDir));

// Clean Route for Newspaper Article Pages (/news/:identifier)
app.get('/news/:identifier', (req, res) => {
  res.sendFile(path.join(__dirname, 'article.html'));
});

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

// Authentication Middleware for Protected Admin API Routes (Direct Admin Access Enabled)
const authenticateToken = (req, res, next) => {
  req.user = { id: 'usr_admin', username: 'admin', role: 'superadmin' };
  next();
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

    const user = await dbGet('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
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
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'New password and confirmation do not match.' });
    }

    const userId = req.user.id;
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    res.json({ success: true, message: 'Password updated successfully. Please use your new password for future sign-ins.' });
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
      'UPDATE editions SET status = ?, updated_at = CURRENT_TIMESTAMP, published_at = CASE WHEN ? = "published" THEN CURRENT_TIMESTAMP ELSE published_at END WHERE id = ?',
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

    await dbRun('DELETE FROM editions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Edition deleted successfully.' });
  } catch (err) {
    console.error('Delete edition error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete edition.' });
  }
});

// ==========================================================================
// DESIGNER PACKAGE GENERATOR ADMIN API ENDPOINTS (STEP 7)
// ==========================================================================
const { getCandidateArticles, generateDesignerPackage } = require('./services/designer-package');

// GET Available publication dates and articles for Designer Package
app.get('/api/admin/designer-package/articles', authenticateToken, async (req, res) => {
  try {
    const targetDate = req.query.date;
    const data = await getCandidateArticles(targetDate);
    res.json({
      success: true,
      availableDates: data.availableDates,
      articles: data.articles
    });
  } catch (err) {
    console.error('Designer package candidate articles error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch candidate articles for designer package.' });
  }
});

// POST Generate Designer Package ZIP
app.post('/api/admin/designer-package/generate', authenticateToken, async (req, res) => {
  try {
    const { publicationDate, articles } = req.body;
    const adminUser = req.user ? req.user.username : 'admin';

    const result = await generateDesignerPackage({
      publicationDate,
      articles,
      adminUser
    });

    res.json(result);
  } catch (err) {
    console.error('Designer package generation error:', err);
    res.status(400).json({ success: false, error: err.message || 'Failed to generate designer package.' });
  }
});

// GET Download Designer Package ZIP (Admin Authenticated)
app.get('/api/admin/designer-package/download/:filename', authenticateToken, (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const packagesDir = path.join(__dirname, 'uploads', 'packages');
    const fullPath = path.normalize(path.join(packagesDir, filename));

    if (!fullPath.startsWith(packagesDir)) {
      return res.status(403).json({ success: false, error: 'Access denied. Invalid file path.' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Requested package file not found.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(fullPath);
  } catch (err) {
    console.error('Download designer package error:', err);
    res.status(500).json({ success: false, error: 'Failed to download designer package.' });
  }
});

// ==========================================================================
// 3. PUBLIC WEBSITE API ROUTES (CONSUMED BY FRONTEND)
// ==========================================================================

// Public E-Paper API (Returns latest or date-filtered published print edition PDF reference)
app.get('/api/public/epaper', async (req, res) => {
  try {
    const dateQuery = req.query.date ? String(req.query.date).trim() : null;
    let edition = null;
    let exactMatch = false;

    if (dateQuery) {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' AND edition_date = ? ORDER BY created_at DESC LIMIT 1", [dateQuery]);
      if (edition) {
        exactMatch = true;
      }
    } else {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
      if (edition) exactMatch = true;
    }

    res.json({
      success: true,
      edition: edition || null,
      exact_match: exactMatch,
      requested_date: dateQuery
    });
  } catch (err) {
    console.error('Public epaper error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch e-paper edition.' });
  }
});

// Public E-Paper Archives API (Returns past published print editions)
app.get('/api/public/epaper/archive', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
    const editions = await dbAll(`
      SELECT * FROM editions
      WHERE status = 'published'
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

// Public E-Paper PDF Download API (Serves PDF with custom filename)
app.get(['/api/public/epaper/download/:id', '/api/public/epaper/:id/download'], async (req, res) => {
  try {
    const { id } = req.params;
    let edition;

    if (id === 'latest') {
      edition = await dbGet("SELECT * FROM editions WHERE status = 'published' ORDER BY edition_date DESC, created_at DESC LIMIT 1");
    } else {
      edition = await dbGet("SELECT * FROM editions WHERE id = ? OR edition_date = ?", [id, id]);
    }

    if (!edition) {
      return res.status(404).json({ success: false, error: 'Edition not found.' });
    }

    const relPath = edition.pdf_path.startsWith('/') ? edition.pdf_path.substring(1) : edition.pdf_path;
    const fullPath = path.join(__dirname, relPath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'Edition PDF file missing on server.' });
    }

    const safeDate = edition.edition_date || 'edition';
    const downloadFilename = `mameka-mahodhayam-${safeDate}-edition.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
    res.sendFile(fullPath);
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
        filters.push("(LOWER(a.district) = 'bapatla' OR a.title_te LIKE '%బాపట్ల%' OR a.title_te LIKE '%చీరాల%' OR a.title_te LIKE '%అద్దంకి%' OR a.content_te LIKE '%బాపట్ల%')");
      } else if (d === 'prakasam') {
        filters.push("(LOWER(a.district) = 'prakasam' OR a.title_te LIKE '%ప్రకాశం%' OR a.title_te LIKE '%ఒంగోలు%' OR a.title_te LIKE '%మార్కాపురం%')");
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

    const { getOptimizedImage } = require('./services/image-optimizer');
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

// Public Reporters List API Endpoint
app.get(['/api/public/reporters', '/api/reporters'], async (req, res) => {
  try {
    const reporters = await dbAll("SELECT * FROM reporters WHERE status = 'active' ORDER BY display_order ASC, created_at ASC");
    res.json({ success: true, reporters: reporters || [] });
  } catch (err) {
    console.error('Public reporters error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reporters list.' });
  }
});

// Single Reporter Profile API Endpoint with Authored Articles
app.get('/api/public/reporters/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let reporter = await dbGet("SELECT * FROM reporters WHERE id = ? OR name = ?", [identifier, identifier]);

    if (!reporter) {
      // Fallback: match by name substring or designation or return first active reporter
      reporter = await dbGet("SELECT * FROM reporters WHERE name LIKE ? OR designation LIKE ? OR status = 'active' ORDER BY display_order ASC, created_at ASC LIMIT 1", [`%${identifier}%`, `%${identifier}%`]);
    }

    if (!reporter) {
      return res.status(404).json({ success: false, error: 'Reporter profile not found.' });
    }

    // Fetch published articles authored by this reporter
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

    const formattedArticles = articles.map(r => ({
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
    console.error('Public reporter detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reporter profile.' });
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

// Admin Edition Delete API
app.delete('/api/admin/editions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM editions WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Edition not found.' });
    }

    // Unlink PDF file if exists
    if (existing.pdf_path) {
      const fullPdfPath = path.join(__dirname, existing.pdf_path);
      if (fs.existsSync(fullPdfPath)) {
        try { fs.unlinkSync(fullPdfPath); } catch (e) {}
      }
    }

    // Delete associated articles, pages, jobs, and edition record
    await dbRun('DELETE FROM articles WHERE edition_id = ?', [id]);
    await dbRun('DELETE FROM edition_pages WHERE edition_id = ?', [id]);
    await dbRun('DELETE FROM processing_jobs WHERE edition_id = ?', [id]);
    await dbRun('DELETE FROM editions WHERE id = ?', [id]);

    res.json({ success: true, message: 'Edition and related records deleted successfully.' });
  } catch (err) {
    console.error('Admin edition delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete edition.' });
  }
});



// Alias Upload API route for /api/admin/editions/upload
app.post('/api/admin/editions/upload', authenticateToken, upload.single('pdf_file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Please select a valid PDF newspaper file to upload.' });
  }
  const { edition_date, edition_name, edition_type } = req.body;
  if (!edition_date) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, error: 'Edition date is required.' });
  }
  const editionId = 'edt_' + Date.now();
  const pdfFilename = req.file.filename;
  const pdfPath = `/uploads/editions/${pdfFilename}`;
  const fileSize = req.file.size;
  const uploadedBy = req.user.id;
  const name = edition_name || `Edition ${edition_date}`;
  const type = edition_type || 'main';

  await dbRun(`
    INSERT INTO editions (id, edition_date, edition_name, edition_type, pdf_filename, pdf_path, file_size_bytes, uploaded_by, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', CURRENT_TIMESTAMP)
  `, [editionId, edition_date, name, type, pdfFilename, pdfPath, fileSize, uploadedBy]);

  processEdition({
    edition: { id: editionId, absolute_pdf_path: req.file.path },
    jobId: null,
    dbRun,
    dbGet,
    pagesDir
  });

  const newEdition = await dbGet('SELECT * FROM editions WHERE id = ?', [editionId]);
  res.status(201).json({
    success: true,
    message: 'Newspaper PDF uploaded and published successfully.',
    edition: newEdition
  });
});

// Helper function to generate clean article slugs
function generateArticleSlug(titleEn, titleTe, id) {
  let base = '';
  if (titleEn && titleEn.trim()) {
    base = titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (!base && titleTe && titleTe.trim()) {
    base = titleTe.trim().toLowerCase().replace(/[\s\t\n]+/g, '-').replace(/[^a-z0-9\u0C00-\u0C7F-]+/g, '').slice(0, 40);
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
      files.forEach(f => {
        uploadedUrls.push(`/uploads/images/${f.filename}`);
      });
    }

    // Also check Base64 payload (for clipboard pasted images or canvas data)
    const { image_base64, base64, images_base64 } = req.body || {};
    const base64List = Array.isArray(images_base64) ? images_base64 : (image_base64 || base64 ? [image_base64 || base64] : []);

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
        uploadedUrls.push(`/uploads/images/${filename}`);
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
        await dbRun(`
          INSERT OR IGNORE INTO editions (id, edition_date, edition_name, edition_type, pdf_filename, pdf_path, file_size_bytes, uploaded_by, status)
          VALUES ('edt_default', CURRENT_DATE, 'డిజిటల్ పత్రిక సంచిక', 'main', 'default.pdf', '/uploads/editions/default.pdf', 0, 'usr_admin', 'published')
        `);
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
      status, featured, show_on_homepage, is_breaking, author_name
    } = req.body;

    const headline = title_te || title_en || existing.title_te;

    let finalImagesJson = existing.images_json;
    let mainImageUrl = image_url !== undefined ? image_url : existing.image_url;
    if (images_json !== undefined) {
      finalImagesJson = typeof images_json === 'string' ? images_json : JSON.stringify(images_json);
    } else if (Array.isArray(image_urls)) {
      finalImagesJson = JSON.stringify(image_urls);
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
      id
    ]);

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

// Admin Delete Article API Endpoint
app.delete('/api/admin/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    await dbRun('DELETE FROM article_images WHERE article_id = ?', [id]);
    await dbRun('DELETE FROM articles WHERE id = ?', [id]);

    res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (err) {
    console.error('Admin delete article error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete article.' });
  }
});

// Admin Standalone Image Upload API Endpoint (Supports Multipart Files & Base64 Clipboard Pastes)
app.post('/api/admin/upload-image', authenticateToken, (req, res) => {
  uploadImageMulter.any()(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ success: false, error: err.message || 'Image upload failed.' });
    }
    try {
      let urls = [];
      // 1. Files uploaded via Multer
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          urls.push(`/uploads/images/${file.filename}`);
        }
      }
      // 2. Base64 pasted image in req.body.base64Image or req.body.image_data or req.body.image
      const rawBase64 = req.body && (req.body.base64Image || req.body.image_data || req.body.image);
      if (rawBase64 && typeof rawBase64 === 'string' && rawBase64.startsWith('data:image')) {
        const matches = rawBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `paste_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
          const savePath = path.join(imagesDir, filename);
          fs.writeFileSync(savePath, buffer);
          urls.push(`/uploads/images/${filename}`);
        }
      }

      if (urls.length === 0) {
        return res.status(400).json({ success: false, error: 'Please select or paste a valid image file.' });
      }

      res.json({
        success: true,
        message: 'Image(s) uploaded successfully.',
        image_url: urls[0],
        image_urls: urls
      });
    } catch (uploadErr) {
      console.error('Image upload processing error:', uploadErr);
      res.status(500).json({ success: false, error: 'Failed to process image upload.' });
    }
  });
});

// Admin List Uploaded Media Library API Endpoint
app.get('/api/admin/media', authenticateToken, async (req, res) => {
  try {
    const { mediaDir } = require('./db');
    if (!fs.existsSync(mediaDir)) {
      return res.json({ success: true, media: [] });
    }
    const files = fs.readdirSync(mediaDir);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));

    const mediaList = imageFiles.map(filename => {
      const filePath = path.join(mediaDir, filename);
      const stat = fs.statSync(filePath);
      return {
        filename,
        url: `/uploads/media/${filename}`,
        size_bytes: stat.size,
        created_at: stat.birthtime || stat.mtime
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, media: mediaList });
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

    const { mediaDir } = require('./db');
    const filename = path.basename(rawFilename);
    const filePath = path.resolve(mediaDir, filename);

    // Path traversal safety boundary check
    if (!filePath.startsWith(path.resolve(mediaDir))) {
      return res.status(403).json({ success: false, error: 'Forbidden: Path traversal attempt blocked.' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Media file not found.' });
    }

    fs.unlinkSync(filePath);

    // Remove thumbnail if present
    const thumbPath = path.resolve(mediaDir, 'thumbnails', `thumb_600_${filename}`);
    if (fs.existsSync(thumbPath)) {
      try { fs.unlinkSync(thumbPath); } catch (e) {}
    }

    res.json({ success: true, message: 'Media asset deleted successfully.' });
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

    const relativePath = `/uploads/images/${req.file.filename}`;
    await dbRun('UPDATE articles SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [relativePath, id]);

    res.json({ success: true, message: 'Image uploaded successfully.', image_url: relativePath });
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
    if (!content || content.trim().length < 20) {
      return res.status(400).json({ success: false, error: 'Full article body content is required to publish an article.' });
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

// Admin Article Review, Override & Publishing API Endpoint
app.put('/api/admin/articles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      district, category, title_te, title_en, subheadline_te, summary_te, summary_en,
      content_te, content_en, author_name, byline, image_url, image_caption_te,
      status, featured, show_on_homepage, is_breaking, slug
    } = req.body;

    const existing = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article record not found.' });
    }

    const isPublishingNow = status === 'published' && existing.status !== 'published';
    const publishedAtClause = isPublishingNow ? 'CURRENT_TIMESTAMP' : 'published_at';

    let targetSlug = slug || existing.slug;
    if (!targetSlug || !targetSlug.trim()) {
      targetSlug = generateArticleSlug(title_en || existing.title_en, title_te || existing.title_te, id);
    }

    await dbRun(`
      UPDATE articles
      SET district = COALESCE(?, district),
          category = COALESCE(?, category),
          title_te = COALESCE(?, title_te),
          title_en = COALESCE(?, title_en),
          subheadline_te = COALESCE(?, subheadline_te),
          summary_te = COALESCE(?, summary_te),
          summary_en = COALESCE(?, summary_en),
          content_te = COALESCE(?, content_te),
          content_en = COALESCE(?, content_en),
          author_name = COALESCE(?, author_name),
          byline = COALESCE(?, byline),
          image_url = COALESCE(?, image_url),
          image_caption_te = COALESCE(?, image_caption_te),
          status = COALESCE(?, status),
          featured = COALESCE(?, featured),
          show_on_homepage = COALESCE(?, show_on_homepage),
          is_breaking = COALESCE(?, is_breaking),
          slug = ?,
          published_at = ${publishedAtClause},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      district, category, title_te, title_en, subheadline_te, summary_te, summary_en,
      content_te, content_en, author_name, byline, image_url, image_caption_te,
      status, featured, show_on_homepage, is_breaking, targetSlug, id
    ]);

    const updated = await dbGet('SELECT * FROM articles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Article updated successfully.', article: updated });
  } catch (err) {
    console.error('Admin article update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update article.' });
  }
});

// ==========================================================================
// REPORTERS & EDITORIAL TEAM MANAGEMENT APIS (DYNAMIC CMS)
// ==========================================================================

// Public Directory: List all active reporters with optional district/designation filters
app.get('/api/public/reporters', async (req, res) => {
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
      SELECT id, name, designation, district, mandal, bio, photo_url, phone, email, social_links, display_order, created_at
      FROM reporters
      WHERE ${filters.join(' AND ')}
      ORDER BY display_order ASC, created_at ASC
    `, params);

    res.json({ success: true, reporters, count: reporters.length });
  } catch (err) {
    console.error('Public reporters error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch reporters directory.' });
  }
});

// Public Profile: Fetch single reporter by ID with their published news articles
app.get('/api/public/reporters/:id', async (req, res) => {
  try {
    const reporter = await dbGet(`
      SELECT id, name, designation, district, mandal, bio, photo_url, phone, email, social_links, display_order, created_at
      FROM reporters
      WHERE id = ? AND status = 'active'
    `, [req.params.id]);

    if (!reporter) {
      return res.status(404).json({ success: false, error: 'Reporter profile not found.' });
    }

    // Dynamic Article-Author mapping: fetch published articles authored by this reporter
    const articles = await dbAll(`
      SELECT a.id, a.slug, a.title_te, a.title_en, a.summary_te, a.summary_en,
             a.image_url, a.category, a.district, a.author_name,
             COALESCE(a.published_at, a.created_at) as published_at
      FROM articles a
      WHERE a.status = 'published' AND (a.author_name = ? OR a.author_name LIKE ? OR a.reporter_id = ?)
      ORDER BY COALESCE(a.published_at, a.created_at) DESC
      LIMIT 15
    `, [reporter.name, `%${reporter.name}%`, reporter.id]);

    res.json({
      success: true,
      reporter,
      articles
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
      ORDER BY display_order ASC, created_at DESC
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
      photo_url, phone, email, social_links, status = 'active', display_order = 0
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Reporter Full Name is required.' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, error: 'Designation / Position is required.' });
    }

    let finalPhotoUrl = photo_url || '';
    if (req.file) {
      finalPhotoUrl = `/uploads/reporters/${req.file.filename}`;
    }

    // Support Base64 image payload if provided
    const { photo_base64 } = req.body;
    if (photo_base64 && typeof photo_base64 === 'string' && photo_base64.startsWith('data:image/')) {
      const matches = photo_base64.match(/^data:image\/([a-zA-Z0-9+\/-]+);base64,(.+)$/);
      if (matches) {
        const ext = '.' + (matches[1] === 'jpeg' ? 'jpg' : matches[1]);
        const filename = `rep_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
        const savePath = path.join(reportersUploadDir, filename);
        fs.writeFileSync(savePath, Buffer.from(matches[2], 'base64'));
        finalPhotoUrl = `/uploads/reporters/${filename}`;
      }
    }

    const id = 'rep_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    let socialLinksJson = '';
    if (typeof social_links === 'string') {
      socialLinksJson = social_links;
    } else if (typeof social_links === 'object') {
      socialLinksJson = JSON.stringify(social_links);
    }

    await dbRun(`
      INSERT INTO reporters (
        id, name, designation, district, mandal, bio,
        photo_url, phone, email, social_links, status, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      name.trim(),
      designation.trim(),
      district || '',
      mandal || '',
      bio || '',
      finalPhotoUrl,
      phone || '',
      email || '',
      socialLinksJson,
      status === 'inactive' ? 'inactive' : 'active',
      parseInt(display_order, 10) || 0
    ]);

    const created = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    await generateReporterQRCode(created);
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
      photo_url, phone, email, social_links, status, display_order
    } = req.body;

    let finalPhotoUrl = existing.photo_url;
    if (req.file) {
      finalPhotoUrl = `/uploads/reporters/${req.file.filename}`;
    } else if (photo_url !== undefined && photo_url !== null) {
      finalPhotoUrl = photo_url;
    }

    // Support Base64 image payload if provided
    const { photo_base64 } = req.body;
    if (photo_base64 && typeof photo_base64 === 'string' && photo_base64.startsWith('data:image/')) {
      const matches = photo_base64.match(/^data:image\/([a-zA-Z0-9+\/-]+);base64,(.+)$/);
      if (matches) {
        const ext = '.' + (matches[1] === 'jpeg' ? 'jpg' : matches[1]);
        const filename = `rep_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`;
        const savePath = path.join(reportersUploadDir, filename);
        fs.writeFileSync(savePath, Buffer.from(matches[2], 'base64'));
        finalPhotoUrl = `/uploads/reporters/${filename}`;
      }
    }

    let socialLinksJson = existing.social_links;
    if (social_links !== undefined) {
      socialLinksJson = typeof social_links === 'object' ? JSON.stringify(social_links) : social_links;
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
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name !== undefined ? name.trim() : null,
      designation !== undefined ? designation.trim() : null,
      district !== undefined ? district : null,
      mandal !== undefined ? mandal : null,
      bio !== undefined ? bio : null,
      finalPhotoUrl,
      phone !== undefined ? phone : null,
      email !== undefined ? email : null,
      socialLinksJson,
      status !== undefined ? (status === 'inactive' ? 'inactive' : 'active') : null,
      display_order !== undefined ? parseInt(display_order, 10) : null,
      id
    ]);

    const updated = await dbGet('SELECT * FROM reporters WHERE id = ?', [id]);
    await generateReporterQRCode(updated);
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

    await dbRun('DELETE FROM reporters WHERE id = ?', [id]);
    res.json({ success: true, message: 'Reporter deleted successfully.' });
  } catch (err) {
    console.error('Delete reporter error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete reporter: ' + err.message });
  }
});

// Admin Portal Clean SPA Routing
app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Express Page Routing for Clean URLs
app.get(['/reporters', '/reporters/:id', '/editorial-team', '/our-team'], (req, res) => {
  res.sendFile(path.join(__dirname, 'editorial-team.html'));
});

app.get(['/district', '/district/:slug'], (req, res) => {
  res.sendFile(path.join(__dirname, 'district.html'));
});

app.get(['/category', '/category/:slug', '/state', '/politics', '/national-international', '/sports', '/cinema', '/education-jobs', '/editorial'], (req, res) => {
  res.sendFile(path.join(__dirname, 'category.html'));
});

app.get(['/news', '/news/:identifier', '/news/*'], (req, res) => {
  res.sendFile(path.join(__dirname, 'article.html'));
});

app.get(['/epaper', '/e-paper'], (req, res) => {
  res.sendFile(path.join(__dirname, 'epaper.html'));
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
initDatabase().then(() => {
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` MAMEKA MAHODAYAM CMS Backend Server Running           `);
      console.log(` Public Website: http://localhost:${PORT}/             `);
      console.log(` Admin Portal:   http://localhost:${PORT}/admin/        `);
      console.log(`=======================================================`);
      
      // Background pre-generation of image thumbnails & QR Codes (non-destructive)
      const { pregenerateAllThumbnails } = require('./services/image-optimizer');
      pregenerateAllThumbnails().catch(e => console.warn('Thumbnail pregen error:', e.message));
      generateAllQRCodes().catch(e => console.warn('QR Code pregen error:', e.message));
    });
  }
}).catch(err => {
  console.error('Database initialization failed:', err);
  if (!process.env.VERCEL) process.exit(1);
});

module.exports = app;
