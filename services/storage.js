try { require('dotenv').config(); } catch (e) {}
const fs = require('fs');
const path = require('path');

const R2_BUCKET = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.S3_PUBLIC_URL;

const isCloudStorageConfigured = Boolean(R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

let s3Client = null;

if (isCloudStorageConfigured) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
      }
    });
    console.log(`✓ Cloud Storage (Cloudflare R2 / S3) configured for bucket: ${R2_BUCKET}`);
  } catch (err) {
    console.warn('! Cloud Storage SDK (@aws-sdk/client-s3) not loaded, falling back to persistent data storage:', err.message);
  }
} else {
  console.log('Using Persistent Media Storage for media uploads (R2_* environment variables can also be used for Cloud Storage)');
}

/**
 * Uploads a file to Cloudflare R2 / S3 if configured, or converts image to persistent Data URI / relative path so it is never lost on redeployment.
 * @param {Object} options
 * @param {string} options.localFilePath - Absolute path to local file on disk
 * @param {string} options.destinationKey - Target object key in bucket (e.g., 'images/img_123.png')
 * @param {string} [options.contentType] - MIME content type
 * @returns {Promise<string>} Public URL or Data URI or relative URL
 */
async function uploadFile({ localFilePath, destinationKey, contentType }) {
  if (s3Client && isCloudStorageConfigured) {
    try {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const fileBuffer = fs.readFileSync(localFilePath);
      
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: destinationKey,
        Body: fileBuffer,
        ContentType: contentType || 'application/octet-stream'
      });

      await s3Client.send(command);
      
      if (R2_PUBLIC_URL) {
        return `${R2_PUBLIC_URL.replace(/\/$/, '')}/${destinationKey}`;
      }
      return `https://${R2_BUCKET}.${R2_ENDPOINT}/${destinationKey}`;
    } catch (err) {
      console.error(`Cloud Storage Upload Failed for ${destinationKey}, using persistent fallback:`, err.message);
    }
  }

  // Return clean, fast static URL served by Express
  const normalizedKey = (destinationKey || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const publicUrl = `/uploads/${normalizedKey}`;

  // Persist into database so ephemeral containers (Render/Railway/Vercel) never lose images on redeployment
  if (localFilePath && fs.existsSync(localFilePath)) {
    try {
      const stats = fs.statSync(localFilePath);
      const ext = path.extname(localFilePath).toLowerCase();
      const mime = contentType || (ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : ext === '.svg' ? 'image/svg+xml' : 'image/png');
      const fileBuffer = fs.readFileSync(localFilePath);
      const base64Data = fileBuffer.toString('base64');
      
      const { dbRun } = require('../db');
      await dbRun(
        `INSERT INTO persistent_uploads (file_path, mime_type, file_data, file_size)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (file_path) DO UPDATE SET file_data = EXCLUDED.file_data, file_size = EXCLUDED.file_size`,
        [publicUrl, mime, base64Data, stats.size]
      ).catch(() => {
        // Fallback for SQLite INSERT OR REPLACE
        return dbRun(
          `INSERT OR REPLACE INTO persistent_uploads (file_path, mime_type, file_data, file_size)
           VALUES (?, ?, ?, ?)`,
          [publicUrl, mime, base64Data, stats.size]
        );
      }).catch(e => console.warn('Persistent DB backup notice:', e.message));
    } catch(err) {
      console.warn('Backup upload to DB notice:', err.message);
    }
  }

  return publicUrl;
}

module.exports = {
  isCloudStorageConfigured,
  uploadFile
};
