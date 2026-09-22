const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const mediaDir = path.join(uploadsDir, 'media');
const optimizedDir = path.join(mediaDir, 'optimized');
const thumbnailsDir = path.join(mediaDir, 'thumbnails');

// Ensure derivative directories exist
[optimizedDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Generates or retrieves an optimized thumbnail derivative of an original image.
 * ORIGINAL FILES ARE NEVER TOUCHED OR OVERWRITTEN.
 */
async function getOptimizedImage(imageUrl, mode = 'card') {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  if (!imageUrl.startsWith('/uploads/media/')) return imageUrl;

  const filename = path.basename(imageUrl);
  if (filename.startsWith('thumb_') || filename.startsWith('opt_')) return imageUrl;

  const originalPath = path.join(mediaDir, filename);
  if (!fs.existsSync(originalPath)) return imageUrl;

  // Mode settings
  const targetWidth = mode === 'hero' ? 1200 : mode === 'card' ? 600 : 300;
  const targetDir = mode === 'hero' ? optimizedDir : thumbnailsDir;
  const prefix = mode === 'hero' ? 'opt_' : 'thumb_';
  const targetFilename = `${prefix}${targetWidth}_${filename}`;
  const targetPath = path.join(targetDir, targetFilename);
  const webUrl = `/uploads/media/${mode === 'hero' ? 'optimized' : 'thumbnails'}/${targetFilename}`;

  // If already generated, return cached URL
  if (fs.existsSync(targetPath)) {
    return webUrl;
  }

  try {
    const img = await loadImage(originalPath);
    const origWidth = img.width;
    const origHeight = img.height;

    // Do not upscale if original is smaller
    const renderWidth = Math.min(origWidth, targetWidth);
    const renderHeight = Math.round((origHeight / origWidth) * renderWidth);

    const canvas = createCanvas(renderWidth, renderHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, renderWidth, renderHeight);

    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
    fs.writeFileSync(targetPath, buffer);

    return webUrl;
  } catch (err) {
    console.warn(`[IMAGE OPTIMIZER] Failed to create thumbnail for ${filename}:`, err.message);
    return imageUrl; // Fallback to original image
  }
}

/**
 * Pre-generate thumbnails for all uploaded media assets asynchronously
 */
async function pregenerateAllThumbnails() {
  if (!fs.existsSync(mediaDir)) return;
  const files = fs.readdirSync(mediaDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith('thumb_') && !f.startsWith('opt_'));

  console.log(`🖼️ [IMAGE OPTIMIZER] Scanning ${imageFiles.length} original media files for thumbnail generation...`);
  let generatedCount = 0;
  for (const filename of imageFiles) {
    const origUrl = `/uploads/media/${filename}`;
    await getOptimizedImage(origUrl, 'card');
    generatedCount++;
  }
  console.log(`✓ [IMAGE OPTIMIZER] Pre-generated ${generatedCount} card thumbnails non-destructively.`);
}

module.exports = {
  getOptimizedImage,
  pregenerateAllThumbnails,
  optimizedDir,
  thumbnailsDir
};
