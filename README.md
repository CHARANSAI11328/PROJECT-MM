# MAMEKA MAHODAYAM (మమేక మహోదయం) - Digital Newspaper Platform & CMS

Welcome to **MAMEKA MAHODAYAM**, an advanced, accessible, high-performance independent Telugu digital newspaper platform and custom Content Management System (CMS). Designed specifically for digital news publishing, print E-Paper distribution, and journalists' directory management.

---

## 📌 Project Overview

**MAMEKA MAHODAYAM** provides a complete end-to-end digital publishing ecosystem. Hosted on **GitHub** and deployed on **Render**, it features a bilingual public newspaper website (Telugu default / English optional), an automated PDF E-Paper ingestion pipeline, interactive E-Paper viewer, reporter press ID card generator with high-resolution 300 DPI QR codes, and a full Single Page Application (SPA) administrative CMS portal.

> [!IMPORTANT]
> **Strict Content Integrity Standard**: This platform is designed for zero fabricated news content, fake statistics, or invented contact details. All pre-configured news blocks use clean, professional placeholders awaiting live CMS or REST API publishing.

---

## 🌟 Key Platform Features

### 📰 Public Web Platform
- **Official Newspaper Homepage (`index.html`)**: Features 15 structured content sections including Breaking News Ticker, Featured News Hero, Category News Grids, District Focus, E-Paper Highlights, Photo Galleries, and Editorial Sections.
- **Article Reader (`article.html`)**: Standard 70/30 main body to sidebar layout with related articles feed, image galleries, social sharing triggers, and responsive print typography.
- **Category Feeds (`category.html`)**: Dynamic category filtering supporting State (`state`), Politics (`politics`), National & International (`national`), Cinema & Entertainment (`cinema`), Sports (`sports`), Education & Jobs (`education`), and Editorials (`editorial`).
- **District News Feeds (`district.html`)**: Region-specific coverage for districts including Bapatla, Prakasam, Markapuram, Guntur, Palnadu, Krishna, and more.
- **Digital E-Paper & Archives (`epaper.html`)**: Interactive viewer for daily print editions with edition date picker, page navigator, and direct high-speed PDF download capabilities.
- **Search Engine (`search.html`)**: Full-text article search with 3 distinct visual states (Initial Search, Search Results with pagination, and Empty/No Results state).
- **Reporters & Editorial Directory (`editorial-team.html`)**: Public hierarchy listing of editorial leaders, district bureau chiefs, and mandal reporters.
- **Reporter Profile & Verification (`reporter-profile.html`)**: Public verification page displaying press ID status, jurisdiction, contact details, and articles published by the reporter.
- **Static & Legal Pages**: Complete corporate & compliance pages (`about.html`, `advertise.html`, `contact.html`, `privacy.html`, `terms.html`).

### 🌐 Bilingual i18n Internationalization (`js/i18n.js`)
- **Default Language**: Telugu (`te`) UI by default, with one-click bilingual switching to English (`en`).
- **State Management & Persistence**: Remembers user language preference across page navigations using `localStorage` (`mm_lang`) and URL parameter synchronization (`?lang=en`).
- **Dynamic Font Stacks**:
  - Telugu (`:lang(te)`): `Noto Serif Telugu` & `Noto Sans Telugu`
  - English (`:lang(en)`): `Lora` & `Inter`

### 🛠 Administrative CMS Portal (`/admin`)
- **Single Page Application (SPA)**: Secured dashboard for platform management accessible at `/admin`.
- **User Authentication**: JWT-based session tokens with password encryption using `bcryptjs`.
- **Edition PDF Ingestion**: Upload daily PDF print editions (up to 100MB). Automatically converts PDF pages into high-res web images (`@napi-rs/canvas` & `pdfjs-dist`).
- **Article Management**: Rich creation, editing, draft saving, multi-photo attachments, drag-and-drop uploads, clipboard image pasting, category tagging, and 1-click live publishing.
- **Media Library**: Centralized asset manager with automatic disk and cloud cleanup upon deletion.
- **Reporter & Press ID Management**: Create and update reporter profiles, assign press IDs and jurisdictions, and pre-generate high-resolution 300 DPI QR codes suitable for PVC ID card printing.

### 💾 Smart Persistence & Database Engine (`db.js`)
- **Dual-Database Compatibility**:
  - **Local Development**: Embedded file-based `sqlite3` database (`database.sqlite`).
  - **Production Deployment (Render)**: Cloud PostgreSQL (`pg`) with automatic support for Neon Serverless DB, SSL connections, and schema auto-migrations.
- **Persistent Asset Restore**: Uploaded files stored in database/cloud storage to prevent data loss on ephemeral container redeployments (Render).

---

## 🛠 Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js (>= 18) | JavaScript server runtime environment |
| **Web Server** | Express.js (v4) | REST API framework & static file server |
| **Databases** | SQLite3 / PostgreSQL (`pg`) | Embedded local storage or Neon Serverless Postgres |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | Token authentication & password hashing |
| **File Handling** | Multer | Multipart upload handler (50MB / 100MB limits) |
| **PDF & Canvas** | `pdfjs-dist`, `@napi-rs/canvas` | PDF parsing and high-performance server-side rendering |
| **Media & QR** | `qrcode`, `pdf-to-img`, `pdf-parse` | QR Code generation and PDF utilities |
| **Frontend UI** | HTML5, CSS3, Vanilla JS (ES6) | Responsive, framework-less, accessible UI |
| **Styling** | Design System CSS Custom Tokens | Print-inspired color system and typography |
| **Hosting & Cloud Deployment** | **GitHub** & **Render** | Source control hosted on GitHub; live production backend/frontend deployed on Render (`render.yaml`, `Procfile`) |

---

## 📁 Directory Layout

```
PROJECT-MM/
├── admin/                         -> Administrative CMS Portal (SPA)
│   ├── index.html                 -> CMS Dashboard Single Page Application HTML
│   ├── admin.css                  -> CMS Portal styles & layout rules
│   └── admin.js                   -> CMS Portal frontend controller & API client
│
├── js/                            -> Frontend JavaScript Modules
│   ├── i18n.js                    -> Bilingual translation engine & state manager
│   ├── content-api.js             -> Public REST API fetch client
│   ├── navigation.js              -> Responsive header, mobile drawer & UI controls
│   ├── config.js                  -> Site configuration & API base URLs
│   ├── categories-config.js       -> Category taxonomy definitions
│   ├── districts-config.js        -> District taxonomy definitions
│   ├── districts.js               -> District page interactive tab handler
│   ├── reporters-directory.js     -> Public reporters directory renderer
│   └── reporter-profile.js        -> Public reporter profile viewer
│
├── services/                      -> Server Helper Services
│   ├── storage.js                 -> Persistent storage manager (disk/cloud)
│   └── image-optimizer.js         -> Thumbnail generation & image optimization
│
├── styles/                        -> CSS Design System & Motion Styles
│   ├── design-system.css          -> Core design tokens, fonts, cards & a11y standards
│   └── motion.css                 -> Animations & UI transitions
│
├── uploads/                       -> Media Storage Directory (Auto-created)
│   ├── editions/                  -> Uploaded newspaper PDF files
│   ├── pages/                     -> Rendered edition page images
│   ├── images/                    -> Article photos & uploads
│   ├── reporters/                 -> Reporter profile photos
│   └── qr_codes/                  -> Generated high-res ID QR codes
│
├── about.html                     -> Publication background & mission
├── advertise.html                 -> Media kit & advertising rates
├── article.html                   -> Single article detail view template
├── category.html                  -> Category article listing template
├── contact.html                   -> Editorial contact form & office locations
├── db.js                          -> Database initialization, ORM wrapper & migrations
├── district.html                  -> District news section template
├── editorial-team.html            -> Editorial leadership & reporters directory
├── epaper.html                    -> Interactive E-Paper & archive viewer
├── index.html                     -> Official Newspaper Homepage
├── ingestion.js                   -> PDF E-Paper processing & rendering engine
├── neon.ts                        -> Neon serverless PostgreSQL connection config
├── privacy.html                   -> Privacy policy & compliance
├── reporter-profile.html          -> Reporter profile & press ID verification view
├── search.html                    -> Search results interface
├── server.js                      -> Express REST API application entry point
├── terms.html                     -> Terms of service & legal notice
│
├── .env.example                   -> Template environment variables file
├── package.json                   -> Node.js dependencies & scripts
├── Procfile                       -> Process file for Render deployment
├── render.yaml                    -> Render cloud service blueprint
└── netlify.toml                   -> Netlify static site redirect settings
```

---

## 🎨 Design System & Visual Identity

The visual identity is based on the traditional **MAMEKA MAHODAYAM** print newspaper aesthetic:

- **Brand Color Palette**:
  - `--color-brand-magenta`: `#d81b7a` (Primary Title Tone)
  - `--color-brand-red`: `#cc0000` (Section Accents & Editorial Bars)
  - `--color-brand-gold`: `#ffcc00` (Highlights & Motto Panels)
  - `--color-brand-green`: `#009944` (Tagline Motto Accent)
  - `--color-brand-purple`: `#7b1fa2` (Category Badges)
  - `--color-bg-main`: `#fdfbf7` (Warm Newsprint Surface)
- **3D Masthead Title Effect**: `.brand-logo-3d` renders authentic newspaper 3D title styling.
- **Card Components**: Flexible card classes including `.card-featured`, `.card-standard`, `.card-compact`, `.card-horizontal`, and `.card-section`.

---

## ⚡ Local Setup & Deployment Guide

Follow these steps to set up and run **MAMEKA MAHODAYAM** locally or deploy it to Render from GitHub.

### Prerequisites
- **Node.js**: Version 18.0.0 or higher.
- **npm**: Node Package Manager (comes bundled with Node.js).
- **Git**: For pushing source code to GitHub.

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/project-mm.git
cd project-mm
```

### Step 2: Install Dependencies
Install the required Node.js packages:
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
Default configuration values for local development:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=mameka_mahodayam_newspaper_secret_key_2026

# DATABASE_URL: Leave empty for local SQLite database (database.sqlite)
# For production Cloud PostgreSQL (Neon / Render Postgres), set connection string below:
# DATABASE_URL=postgresql://user:password@ep-host.neon.tech/dbname?sslmode=require
```

### Step 4: Start the Server Locally
Start the Express server with local SQLite database initialization:
```bash
npm start
```
For development with auto-reload:
```bash
npm run dev
```

### Step 5: Access the Application
Once the server starts, open your browser to access:
- **Public Website**: `http://localhost:3000/`
- **Admin Portal**: `http://localhost:3000/admin/`

### 🔑 Admin Credentials & Security
When starting with a fresh database, set `ADMIN_PASSWORD` in your `.env` file to set a secure initial Super Admin password:
- **Username**: `admin`
- **Password**: Configured via `ADMIN_PASSWORD` in `.env`

*(Note: Passwords can also be updated anytime from the Admin Portal Password Settings panel).*

### 🚀 Deploying to Render from GitHub
1. Push your repository code to **GitHub**.
2. Connect your GitHub repository to **Render** (as a Web Service).
3. Set the build command: `npm install`
4. Set the start command: `node server.js`
5. Configure environment variables (`JWT_SECRET`, `DATABASE_URL`, `NODE_ENV=production`) in the Render Dashboard.

---

## 🔗 Key API Endpoints Summary

### Public APIs
- `GET /api/public/articles` - Fetch published articles (supports `category`, `district`, `search`, `featured`, `homepage` filters).
- `GET /api/public/articles/:identifier` - Fetch single article by ID or slug.
- `GET /api/public/articles/:identifier/related` - Fetch related articles.
- `GET /api/public/epaper` - Fetch current published E-Paper edition.
- `GET /api/public/epaper/archive` - List past E-Paper editions.
- `GET /api/public/epaper/download/:id` - Download E-Paper edition PDF file.
- `GET /api/public/reporters` - List active reporters and editorial team.
- `GET /api/public/reporters/:id` - Fetch reporter details and published articles.
- `GET /api/public/reporters/:id/qr.png` - Generate dynamic high-res reporter QR code.

### Admin APIs (Protected by JWT)
- `POST /api/auth/login` - Admin authentication.
- `POST /api/auth/change-password` - Password update endpoint.
- `GET /api/admin/stats` - Dashboard overview statistics.
- `GET /api/admin/articles` - List articles (including drafts and pending review).
- `POST /api/admin/articles` - Create new news article.
- `PUT /api/admin/articles/:id` - Update article details.
- `DELETE /api/admin/articles/:id` - Delete article and its attached media.
- `POST /api/admin/editions/upload` - Upload daily PDF newspaper edition.
- `GET /api/admin/reporters` - Manage reporters directory.
- `POST /api/admin/reporters` - Create new reporter profile.
- `POST /api/admin/reporters-qr/regenerate` - Batch regenerate high-res QR codes.

---

## ♿ Accessibility (a11y) & Performance Standards

- **Keyboard Navigation**: Skip links (`<a href="#main-content" class="skip-link">`) on all pages with high-contrast `:focus-visible` indicators.
- **Landmark Roles**: Fully compliant HTML5 semantic structures (`role="banner"`, `role="navigation"`, `role="main"`, `role="contentinfo"`).
- **SEO & Social Optimization**: Dynamic `sitemap.xml` generator (`/sitemap.xml`) and `robots.txt` configuration.

---

## 📄 License & Attribution

© **MAMEKA MAHODAYAM** (మమేక మహోదయం). All rights reserved. Registered Telugu Daily Newspaper.
