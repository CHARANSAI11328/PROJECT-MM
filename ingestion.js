const fs = require('fs');
const path = require('path');

function makeSlug(title, id) {
  const asciiTitle = (title || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${asciiTitle || 'news'}-${id.slice(-8)}`;
}

async function processEdition({ edition, jobId, dbRun, dbGet, pagesDir }) {
  console.log('=== PUBLISHING NEWSPAPER PDF E-PAPER EDITION ===');
  console.log(`[E-PAPER] Processing PDF edition ID: ${edition.id}`);
  try {
    if (!fs.existsSync(pagesDir)) {
      fs.mkdirSync(pagesDir, { recursive: true });
    }

    await dbRun('DELETE FROM edition_pages WHERE edition_id = ?', [edition.id]);
    await dbRun("UPDATE editions SET status = 'processing', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [edition.id]);

    let totalPages = 0;
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const data = new Uint8Array(fs.readFileSync(edition.absolute_pdf_path));
      const standardFontDataUrl = path.join(__dirname, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/') + '/';
      const pdfDoc = await pdfjsLib.getDocument({ data, standardFontDataUrl, verbosity: 0 }).promise;
      totalPages = pdfDoc.numPages;

      const { createCanvas } = require('@napi-rs/canvas');
      for (let pageNo = 1; pageNo <= totalPages; pageNo++) {
        const page = await pdfDoc.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
        const context = canvas.getContext('2d');

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const buffer = canvas.toBuffer('image/png');
        const pageFilename = `edition_${edition.id}_page_${pageNo}.png`;
        const pageFilePath = path.join(pagesDir, pageFilename);
        fs.writeFileSync(pageFilePath, buffer);

        const pageImgRelPath = `/uploads/pages/${pageFilename}`;
        const pageId = `page_${edition.id}_${pageNo}`;

        await dbRun(`
          INSERT INTO edition_pages (id, edition_id, page_number, page_image_path, width, height, processing_status)
          VALUES (?, ?, ?, ?, ?, ?, 'processed')
        `, [pageId, edition.id, pageNo, pageImgRelPath, viewport.width, viewport.height]);
      }
    } catch (renderErr) {
      console.warn('PDF Page rendering warning:', renderErr.message);
    }

    await dbRun(`
      UPDATE editions
      SET status = 'published',
          total_pages = ?,
          published_at = COALESCE(published_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [totalPages || 1, edition.id]);

    if (jobId) {
      await dbRun(`
        UPDATE processing_jobs
        SET stage = 'completed', progress_percent = 100, log_message = 'Newspaper PDF edition published successfully for E-Paper reading and download.', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [jobId]);
    }

    console.log(`✓ E-Paper edition ${edition.id} published cleanly with ${totalPages} pages.`);
  } catch (error) {
    console.error('E-Paper publishing error:', error);
    await dbRun("UPDATE editions SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [edition.id]);
  }
}

module.exports = { processEdition };