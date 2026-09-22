# MAMEKA MAHODAYAM — PRODUCTION DEPLOYMENT GUIDE

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Publication:** Mameka Mahodhayam (మమేక మహోదయం Telugu Daily Newspaper Platform)  

---

## 1. PREREQUISITES

- **Operating System:** Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL 9) or Windows Server 2022 64-bit.
- **Node.js Environment:** Node.js `>= 18.0.0` (LTS recommended, e.g. Node.js 20.x or 22.x).
- **Package Manager:** npm `>= 9.0.0`.
- **Process Manager:** PM2 (recommended for Node.js process daemonization and auto-restart).
- **Reverse Proxy:** Nginx or Caddy (for TLS/HTTPS termination and static caching).

---

## 2. SYSTEM & DEPENDENCY INSTALLATION

1. Clone or transfer project files to the target server deployment directory (e.g. `/var/www/mameka-mahodayam`).
2. Run dependency installation:
   ```bash
   npm install --production
   ```

---

## 3. ENVIRONMENT CONFIGURATION (`.env`)

Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

Configure production environment variables inside `.env`:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=replace_with_a_long_random_production_secret_key

# --- LIVE PRODUCTION DATABASE (Neon PostgreSQL / Supabase) ---
DATABASE_URL=postgres://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# --- LIVE CLOUD STORAGE (Cloudflare R2 / AWS S3) ---
R2_BUCKET_NAME=mameka-media-bucket
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_PUBLIC_URL=https://pub-your-id.r2.dev

ALLOWED_ORIGINS=https://mamekamahodayam.com
```

> [!IMPORTANT]
> **Production Fail-Fast Security:**
> In `NODE_ENV=production`, if `JWT_SECRET` is missing or unconfigured, the application will fail fast on startup and exit immediately to prevent insecure operation.

---

## 4. DATABASE & UPLOAD DIRECTORY PLACEMENT

- **Live Database:** If `DATABASE_URL` is set in `.env`, the backend connects directly to Neon / Supabase PostgreSQL. If omitted, it falls back to local `./database.sqlite`.
- **Media Uploads:** If `R2_*` credentials are set, edition PDFs and image assets stream directly to Cloudflare R2 / S3. Local fallback folder remains `./uploads/`.

---

## 5. STARTING THE APPLICATION

### Standard Node.js Command
```bash
npm start
```

### Production Process Daemonization with PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "mameka-mahodayam-cms"
pm2 save
pm2 startup
```

---

## 6. REVERSE PROXY & HTTPS ARCHITECTURE

```
┌─────────────────────────────────────────┐
│               INTERNET                  │
└────────────────────┬────────────────────┘
                     │  (HTTPS / Port 443)
                     ▼
┌─────────────────────────────────────────┐
│     REVERSE PROXY (Nginx / Caddy)       │  ◄── TLS Certificate (Let's Encrypt)
└────────────────────┬────────────────────┘
                     │  (HTTP / Port 3000)
                     ▼
┌─────────────────────────────────────────┐
│      NODE.JS SERVER (server.js)         │
└────────────────────┬────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ SQLite Database  │  │ Upload Storage   │
│ (database.sqlite)│  │ (uploads/)       │
└──────────────────┘  └──────────────────┘
```

### Sample Nginx Configuration Snippet (`/etc/nginx/sites-available/mamekamahodayam`)
```nginx
server {
    listen 80;
    server_name mamekamahodayam.com www.mamekamahodayam.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mamekamahodayam.com www.mamekamahodayam.com;

    ssl_certificate /etc/letsencrypt/live/mamekamahodayam.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mamekamahodayam.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. HEALTH CHECK & MONITORING

The application exposes a lightweight, unauthenticated health check endpoint for proxy health probes and uptime monitoring:

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

---

## 8. BACKUP & RECOVERY PROCEDURE

### Minimum Backup Set (Pre-Deployment / Daily Routine)
1. `database.sqlite` (SQLite database file)
2. `uploads/media/` (Original image storage)
3. `uploads/editions/` (PDF print edition storage)
4. `uploads/packages/` (Generated designer packages)
5. `.env` (Environment configuration and secret keys — store securely!)

### Recommended Backup Script (`backup.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mameka_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp database.sqlite "$BACKUP_DIR/"
cp -r uploads "$BACKUP_DIR/"
echo "Backup created successfully at $BACKUP_DIR"
```

---

## 9. ROLLBACK PROCEDURE

In the event a deployment must be reverted:
1. Stop the application process: `pm2 stop mameka-mahodayam-cms`.
2. Restore `database.sqlite` and `uploads/` directory from the pre-deployment backup directory.
3. Revert source code to the previous stable release commit.
4. Restart application process: `pm2 restart mameka-mahodayam-cms`.
5. Verify health check at `GET /api/health`.
