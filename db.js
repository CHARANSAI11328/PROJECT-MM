try { require('dotenv').config(); } catch (e) {}
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const uploadsDir = path.join(__dirname, 'uploads');
const editionsDir = path.join(uploadsDir, 'editions');
const pagesDir = path.join(uploadsDir, 'pages');
const mediaDir = path.join(uploadsDir, 'media');
const reportersDir = path.join(uploadsDir, 'reporters');

// Ensure required upload directories exist
[uploadsDir, editionsDir, pagesDir, mediaDir, reportersDir].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Safe fallback for read-only serverless filesystems (e.g., Vercel Lambda)
  }
});

const rawDbUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
const databaseUrl = rawDbUrl.replace(/^["']|["']$/g, '').trim();
const isPostgres = Boolean(databaseUrl);

let db = null;
let pgPool = null;

if (isPostgres) {
  const { Pool } = require('pg');
  try {
    const parsed = new URL(databaseUrl);
    console.log(`Connecting to PostgreSQL host: ${parsed.host} | db: ${parsed.pathname}`);
  } catch (e) {}

  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
  console.log('✓ Connected to Live Production PostgreSQL database (Neon / Cloud DB)');
} else {
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to SQLite database:', err.message);
    } else {
      console.log('Connected to Local SQLite database at:', dbPath);
    }
  });
}

// Convert SQLite parameter placeholders (?) to PostgreSQL ($1, $2, $3...)
function translateSqlForPostgres(sql) {
  let paramIndex = 1;
  // Convert double-quoted string literals in WHERE clauses to single quotes for Postgres
  let sanitizedSql = sql.replace(/=\s*"([^"]+)"/g, "= '$1'").replace(/!=\s*"([^"]+)"/g, "!= '$1'");
  // Safely translate SQLite INSERT OR IGNORE INTO for PostgreSQL
  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(sanitizedSql)) {
    sanitizedSql = sanitizedSql.replace(/INSERT\s+OR\s+IGNORE\s+INTO/i, 'INSERT INTO');
    if (!/ON\s+CONFLICT/i.test(sanitizedSql)) {
      sanitizedSql = sanitizedSql.trim() + ' ON CONFLICT DO NOTHING';
    }
  }
  return sanitizedSql.replace(/\?/g, () => `$${paramIndex++}`);
}

// Normalize SQL statement DDL types for PostgreSQL compatibility
function prepareDdlSql(sql) {
  if (!isPostgres) return sql;
  return sql
    .replace(/DATETIME/gi, 'TIMESTAMP WITH TIME ZONE')
    .replace(/REAL/gi, 'DOUBLE PRECISION');
}

// Helper wrapper for async database execution queries (INSERT, UPDATE, DELETE, DDL)
const dbRun = async (sql, params = []) => {
  if (isPostgres) {
    const convertedSql = translateSqlForPostgres(prepareDdlSql(sql));
    const res = await pgPool.query(convertedSql, params);
    return {
      changes: res.rowCount,
      rowCount: res.rowCount,
      rows: res.rows
    };
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
};

// Helper wrapper for multi-row database query fetches (SELECT *)
const dbAll = async (sql, params = []) => {
  if (isPostgres) {
    const convertedSql = translateSqlForPostgres(sql);
    const res = await pgPool.query(convertedSql, params);
    return res.rows || [];
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

// Helper wrapper for single-row database query fetches (SELECT ... LIMIT 1)
const dbGet = async (sql, params = []) => {
  if (isPostgres) {
    const convertedSql = translateSqlForPostgres(sql);
    const res = await pgPool.query(convertedSql, params);
    return res.rows[0];
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// Initialize Database Schema (Compatible with both PostgreSQL and SQLite)
async function initDatabase() {
  console.log(`Initializing database schema (${isPostgres ? 'Live PostgreSQL' : 'Local SQLite'})...`);

  // 1. Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('superadmin', 'editor', 'reporter')) DEFAULT 'editor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Editions Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS editions (
      id TEXT PRIMARY KEY,
      edition_date DATE NOT NULL,
      edition_name TEXT NOT NULL DEFAULT 'Main Edition',
      edition_type TEXT CHECK(edition_type IN ('main', 'district', 'special')) DEFAULT 'main',
      pdf_filename TEXT NOT NULL,
      pdf_path TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      total_pages INTEGER DEFAULT 0,
      uploaded_by TEXT NOT NULL,
      status TEXT CHECK(status IN ('uploaded', 'processing', 'processed', 'review_pending', 'published', 'archived', 'failed')) DEFAULT 'uploaded',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);

  // 3. Edition Pages Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS edition_pages (
      id TEXT PRIMARY KEY,
      edition_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      page_image_path TEXT,
      width INTEGER,
      height INTEGER,
      text_layer_available INTEGER DEFAULT 0,
      processing_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE,
      UNIQUE(edition_id, page_number)
    )
  `);

  // 4. Processing Jobs Queue Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS processing_jobs (
      id TEXT PRIMARY KEY,
      edition_id TEXT NOT NULL,
      stage TEXT CHECK(stage IN ('validation', 'page_rendering', 'text_extraction', 'ocr_processing', 'layout_analysis', 'article_detection', 'image_extraction', 'ai_classification', 'saving_drafts', 'completed', 'failed')) DEFAULT 'validation',
      current_page INTEGER DEFAULT 0,
      total_pages INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      log_message TEXT,
      error_details TEXT,
      retry_count INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
    )
  `);

  // 5. Articles Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      edition_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      slug TEXT UNIQUE,
      title_te TEXT NOT NULL,
      title_en TEXT,
      subheadline_te TEXT,
      summary_te TEXT,
      summary_en TEXT,
      content_te TEXT NOT NULL,
      content_en TEXT,
      raw_extracted_text TEXT,
      cleaned_text TEXT,
      category TEXT CHECK(category IN ('state', 'district', 'politics', 'national', 'sports', 'cinema', 'education', 'editorial', 'business', 'international')) DEFAULT 'state',
      subcategory TEXT,
      district TEXT,
      image_url TEXT,
      image_caption_te TEXT,
      image_caption_en TEXT,
      source_coordinates TEXT,
      source_newspaper TEXT DEFAULT 'మమేక మహోదయం',
      status TEXT CHECK(status IN ('processing', 'draft', 'pending_review', 'approved', 'rejected', 'published', 'archived')) DEFAULT 'draft',
      content_type TEXT CHECK(content_type IN ('news', 'editorial', 'advertisement', 'opinion', 'announcement', 'other')) DEFAULT 'news',
      exclude_from_article_candidates INTEGER DEFAULT 0,
      needs_review INTEGER DEFAULT 0,
      featured INTEGER DEFAULT 0,
      show_on_homepage INTEGER DEFAULT 0,
      is_breaking INTEGER DEFAULT 0,
      keywords TEXT,
      ocr_confidence REAL DEFAULT 0.0,
      headline_confidence REAL DEFAULT 0.0,
      category_confidence REAL DEFAULT 0.0,
      district_confidence REAL DEFAULT 0.0,
      image_match_confidence REAL DEFAULT 0.0,
      overall_confidence REAL DEFAULT 0.0,
      confidence_score REAL DEFAULT 0.0,
      extraction_confidence REAL DEFAULT 0.0,
      classification_confidence REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
    )
  `);

  // 6. Article Images Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS article_images (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      image_type TEXT CHECK(image_type IN ('main', 'gallery', 'inline', 'thumbnail')) DEFAULT 'main',
      caption TEXT,
      display_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )
  `);

  // 7. Media Assets Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      edition_id TEXT NOT NULL,
      page_number INTEGER,
      file_path TEXT NOT NULL,
      media_type TEXT CHECK(media_type IN ('article_image', 'page_crop', 'pdf_asset')) DEFAULT 'article_image',
      caption_te TEXT,
      caption_en TEXT,
      coordinates TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE
    )
  `);

  // 8. Reporters Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS reporters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      district TEXT,
      mandal TEXT,
      bio TEXT,
      photo_url TEXT,
      phone TEXT,
      email TEXT,
      social_links TEXT,
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Parallel Column & Index Migrations
  const alterQueries = [
    "ALTER TABLE editions ADD COLUMN title TEXT",
    "ALTER TABLE editions ADD COLUMN description TEXT",
    "ALTER TABLE editions ADD COLUMN updated_at DATETIME",
    "ALTER TABLE editions ADD COLUMN published_at DATETIME",
    "ALTER TABLE edition_pages ADD COLUMN text_layer_available INTEGER DEFAULT 0",
    "ALTER TABLE edition_pages ADD COLUMN processing_status TEXT DEFAULT 'pending'",
    "ALTER TABLE processing_jobs ADD COLUMN current_page INTEGER DEFAULT 0",
    "ALTER TABLE processing_jobs ADD COLUMN total_pages INTEGER DEFAULT 0",
    "ALTER TABLE processing_jobs ADD COLUMN retry_count INTEGER DEFAULT 0",
    "ALTER TABLE articles ADD COLUMN images_json TEXT",
    "ALTER TABLE articles ADD COLUMN subheadline_te TEXT",
    "ALTER TABLE articles ADD COLUMN raw_extracted_text TEXT",
    "ALTER TABLE articles ADD COLUMN cleaned_text TEXT",
    "ALTER TABLE articles ADD COLUMN content_type TEXT DEFAULT 'news'",
    "ALTER TABLE articles ADD COLUMN exclude_from_article_candidates INTEGER DEFAULT 0",
    "ALTER TABLE articles ADD COLUMN needs_review INTEGER DEFAULT 0",
    "ALTER TABLE articles ADD COLUMN ocr_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN headline_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN category_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN district_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN image_match_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN overall_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN subcategory TEXT",
    "ALTER TABLE articles ADD COLUMN source_newspaper TEXT DEFAULT 'మమేక మహోదయం'",
    "ALTER TABLE articles ADD COLUMN featured INTEGER DEFAULT 0",
    "ALTER TABLE articles ADD COLUMN show_on_homepage INTEGER DEFAULT 0",
    "ALTER TABLE articles ADD COLUMN is_breaking INTEGER DEFAULT 0",
    "ALTER TABLE articles ADD COLUMN keywords TEXT",
    "ALTER TABLE articles ADD COLUMN extraction_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN classification_confidence REAL DEFAULT 0.0",
    "ALTER TABLE articles ADD COLUMN author_name TEXT DEFAULT 'మమేక మహోదయం డెస్క్'",
    "ALTER TABLE articles ADD COLUMN byline TEXT",
    "ALTER TABLE articles ADD COLUMN published_at DATETIME",
    "ALTER TABLE articles ADD COLUMN reporter_id TEXT",
    "ALTER TABLE articles ADD COLUMN qr_code_url TEXT",
    "ALTER TABLE editions ADD COLUMN qr_code_url TEXT",
    "ALTER TABLE reporters ADD COLUMN updated_at DATETIME",
    "ALTER TABLE reporters ADD COLUMN display_order INTEGER DEFAULT 0",
    "ALTER TABLE reporters ADD COLUMN social_links TEXT",
    "ALTER TABLE reporters ADD COLUMN qr_code_url TEXT",
    "CREATE INDEX IF NOT EXISTS idx_reporters_status ON reporters(status)",
    "CREATE INDEX IF NOT EXISTS idx_reporters_district ON reporters(district)"
  ];

  await Promise.allSettled(alterQueries.map(q => dbRun(q)));

  // Seed Initial Admin User if Users Table is Empty
  const existingUser = await dbGet('SELECT * FROM users LIMIT 1');
  if (!existingUser) {
    const adminId = 'usr_admin';
    const defaultPassword = 'admin';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    await dbRun(
      `INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [adminId, 'admin', 'editor@mamekamahodayam.com', passwordHash, 'superadmin']
    );
    console.log('✓ Initial Admin Account Seeded: username="admin", password="admin"');
  } else {
    // Ensure 'usr_admin' exists so foreign keys referencing 'usr_admin' are always satisfied
    const adminById = await dbGet('SELECT id FROM users WHERE id = ?', ['usr_admin']);
    if (!adminById) {
      await dbRun(
        `INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
        ['usr_admin', 'admin_sys', 'admin@mamekamahodayam.com', existingUser.password_hash || '$2a$10$dummy', 'superadmin']
      ).catch(() => {});
    }
  }

  // Seed Hierarchical Editorial Team / Reporters if Table is Empty
  const existingReporter = await dbGet('SELECT * FROM reporters LIMIT 1');
  if (!existingReporter) {
    const defaultReporters = [
      {
        id: 'rep_1',
        name: 'వాకా శ్రీనివాసరావు',
        designation: 'వ్యవస్థాపక ప్రధాన సంపాదకులు (Founder & Editor-in-Chief)',
        district: 'guntur',
        mandal: 'తెనాలి, సంగం జాగర్లమూడి',
        bio: 'సత్యమే ఆధారం... ప్రజాహితమే మా ధ్యేయం! మమేక మహోదయం దినపత్రిక స్థాపక ప్రధాన సంపాదకులు. ప్రజా సమస్యలపై స్వతంత్ర, నిర్భయ మరియు నిజాయితీగల జర్నలిజానికి నిరంతరం కట్టుబడి ఉన్నారు.',
        photo_url: '/uploads/reporters/vaka_srinivasa_rao.png',
        phone: '+91 866 2456789',
        email: 'editor@mamekamahodayam.com',
        social_links: JSON.stringify({ twitter: 'https://twitter.com', facebook: 'https://facebook.com' }),
        status: 'active',
        display_order: 1
      },
      {
        id: 'rep_2',
        name: 'శ్రీనివాస విజయకుమార్',
        designation: 'అసోసియేట్ ఎడిటర్ (Associate Editor)',
        district: 'krishna',
        mandal: 'విజయవాడ సెంట్రల్',
        bio: 'రాజకీయ, సామాజిక విశ్లేషణలలో నిపుణులు. దినపత్రిక ఎడిటోరియల్ డెస్క్ పర్యవేక్షణ మరియు ప్రధాన వార్తా విభాగాల రూపకర్త.',
        photo_url: '',
        phone: '+91 866 2456790',
        email: 'vijaykumar@mamekamahodayam.com',
        social_links: JSON.stringify({ twitter: 'https://twitter.com' }),
        status: 'active',
        display_order: 2
      },
      {
        id: 'rep_3',
        name: 'కె. రాఘవేంద్ర రావు',
        designation: 'జిల్లా బ్యూరో చీఫ్ (District Bureau Chief)',
        district: 'bapatla',
        mandal: 'బాపట్ల రూరల్',
        bio: 'బాపట్ల జిల్లా వ్యవసాయం, తీరప్రాంత సమస్యలు మరియు గ్రామీణ పరిపాలనపై ప్రత్యేక శ్రద్ధతో పరిశోధనాత్మక వార్తలు అందించే సీనియర్ పాత్రికేయులు.',
        photo_url: '',
        phone: '+91 98480 34567',
        email: 'bapatla.bureau@mamekamahodayam.com',
        social_links: JSON.stringify({}),
        status: 'active',
        display_order: 3
      },
      {
        id: 'rep_4',
        name: 'ఎం. రమేష్ బాబు',
        designation: 'సీనియర్ కరస్పాండెంట్ (Senior Correspondent)',
        district: 'palnadu',
        mandal: 'నరసరావుపేట',
        bio: 'పల్నాడు ప్రాంతీయ వార్తలు, ప్రాజెక్టులు మరియు క్షేత్రస్థాయి విశ్లేషణాత్మక కథనాల ప్రత్యేక ప్రతినిధి.',
        photo_url: '',
        phone: '+91 98480 45678',
        email: 'ramesh.palnadu@mamekamahodayam.com',
        social_links: JSON.stringify({}),
        status: 'active',
        display_order: 4
      },
      {
        id: 'rep_5',
        name: 'పి. సురేష్ వర్మ',
        designation: 'మండల రిపోర్టర్ (Mandal Reporter)',
        district: 'guntur',
        mandal: 'తెనాలి',
        bio: 'తెనాలి పురపాలక సంఘం మరియు పరిసర గ్రామాల ప్రజా సమస్యలు, పౌర సేవలు మరియు స్థానిక పరిణామాల క్షేత్రస్థాయి రిపోర్టర్.',
        photo_url: '',
        phone: '+91 98480 56789',
        email: 'suresh.tenali@mamekamahodayam.com',
        social_links: JSON.stringify({}),
        status: 'active',
        display_order: 5
      }
    ];

    for (const r of defaultReporters) {
      await dbRun(
        `INSERT INTO reporters (id, name, designation, district, mandal, bio, photo_url, phone, email, social_links, status, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.name, r.designation, r.district, r.mandal, r.bio, r.photo_url, r.phone, r.email, r.social_links, r.status, r.display_order]
      );
    }
    console.log('✓ Initial Editorial Team / Reporters Seeded Successfully.');
  }

  console.log(`✓ Database Schema Initialized Successfully (${isPostgres ? 'Live PostgreSQL' : 'Local SQLite'}).`);
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase,
  editionsDir,
  pagesDir,
  mediaDir,
  reportersDir,
  isPostgres
};
