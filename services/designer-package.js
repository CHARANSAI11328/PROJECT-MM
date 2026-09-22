const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { dbAll, dbGet } = require('../db');
const archiver = require('archiver');
let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch (e) {
  AdmZip = null;
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
const mediaDir = path.join(uploadsDir, 'media');
const packagesDir = path.join(uploadsDir, 'packages');
const tempDir = path.join(__dirname, '..', 'scratch', 'temp_packages');

// Ensure required directories exist
[uploadsDir, mediaDir, packagesDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Fetch available publication dates and candidate articles
 */
async function getCandidateArticles(targetDate) {
  // 1. Available Dates
  const dateRows = await dbAll(`
    SELECT DISTINCT e.edition_date, COUNT(a.id) as article_count
    FROM editions e
    JOIN articles a ON a.edition_id = e.id
    GROUP BY e.edition_date
    ORDER BY e.edition_date DESC
  `);

  const availableDates = dateRows.map(r => ({
    edition_date: r.edition_date,
    article_count: r.article_count
  }));

  if (!targetDate) {
    return { availableDates, articles: [] };
  }

  // 2. Fetch candidate articles for targetDate
  const rows = await dbAll(`
    SELECT a.*, e.edition_date, e.edition_name
    FROM articles a
    JOIN editions e ON e.id = a.edition_id
    WHERE e.edition_date = ? OR DATE(a.published_at) = ? OR DATE(a.created_at) = ?
    ORDER BY a.page_number ASC, a.created_at ASC
  `, [targetDate, targetDate, targetDate]);

  const articles = await Promise.all(rows.map(async r => {
    let images = [];

    // Check article_images table first
    const extraImgs = await dbAll(`
      SELECT id, image_url, caption, display_order
      FROM article_images
      WHERE article_id = ?
      ORDER BY display_order ASC
    `, [r.id]);

    if (extraImgs && extraImgs.length > 0) {
      images = extraImgs.map(img => img.image_url);
    } else if (r.image_url && r.image_url.trim()) {
      images = [r.image_url.trim()];
    }

    // Check image existence on disk
    const imageStatusList = images.map(imgUrl => {
      let relPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
      let fullPath = path.normalize(path.join(__dirname, '..', relPath));
      let exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
      return {
        url: imgUrl,
        filename: path.basename(imgUrl),
        exists: exists
      };
    });

    return {
      id: r.id,
      headline: r.title_te || r.title_en || '',
      subheadline: r.subheadline_te || '',
      summary: r.summary_te || r.summary_en || '',
      content: r.content_te || r.content_en || '',
      category: r.category || 'state',
      district: r.district || '',
      author: r.author_name || r.source_newspaper || 'మమేక మహోదయం',
      publication_date: r.edition_date || targetDate,
      status: r.status || 'published',
      image_count: images.length,
      image_details: imageStatusList,
      images: images
    };
  }));

  return { availableDates, articles };
}

/**
 * Resolve local disk path safely preventing path traversal
 */
function resolveSafeMediaPath(relativeUrl) {
  if (!relativeUrl) return null;
  const cleanedUrl = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
  const fullPath = path.normalize(path.join(__dirname, '..', cleanedUrl));

  // Security Check: Path must be strictly inside uploads directory
  if (!fullPath.startsWith(uploadsDir)) {
    throw new Error(`Security Exception: Path traversal attempt blocked: ${relativeUrl}`);
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }
  return null;
}

/**
 * Generate DOCX Document using docx library
 */
async function generateDocxFile(docxPath, publicationDate, packageArticles) {
  const docx = await import('docx');
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, ImageRun } = docx;

  const docChildren = [];

  // 1. Header / Title Block
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "మమేక మహోదయం — MAMEKA MAHODAYAM DAILY",
          bold: true,
          size: 36,
          font: "Gautami",
          color: "DC2626"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `EDITORIAL DESIGNER PACKAGE | PUBLICATION DATE: ${publicationDate}`,
          bold: true,
          size: 24,
          font: "Arial",
          color: "4B5563"
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Total Articles: ${packageArticles.length} | Generated: ${new Date().toLocaleDateString('te-IN')} ${new Date().toLocaleTimeString('en-US')}`,
          italic: true,
          size: 20,
          font: "Arial",
          color: "6B7280"
        })
      ]
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: "====================================================================================",
          color: "D1D5DB"
        })
      ]
    }),
    new Paragraph({ text: "" })
  );

  // 2. Loop Articles in Order
  for (let idx = 0; idx < packageArticles.length; idx++) {
    const art = packageArticles[idx];

    // Article ID Heading
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `ARTICLE ID: ${art.packageArticleId}`,
            bold: true,
            size: 26,
            font: "Arial",
            color: "B91C1C"
          })
        ]
      })
    );

    // Metadata Block
    const metaRows = [
      ["Headline:", art.headline],
      ["Subheadline:", art.subheadline || "N/A"],
      ["Category:", art.category],
      ["District:", art.district || "N/A"],
      ["Author / Source:", art.author],
      ["Publication Date:", art.publication_date],
      ["Status:", art.status]
    ];

    metaRows.forEach(([key, val]) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${key} `, bold: true, size: 22, font: "Arial" }),
            new TextRun({ text: val || "", size: 22, font: "Gautami", color: "1F2937" })
          ]
        })
      );
    });

    docChildren.push(new Paragraph({ text: "" }));

    // Article Content Header
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "ARTICLE CONTENT:", bold: true, size: 22, font: "Arial", color: "111827" })
        ]
      })
    );

    // Article Content Paragraphs (Preserve original Telugu Unicode formatting)
    const rawContent = (art.content || "").replace(/\r\n/g, "\n");
    const paragraphs = rawContent.split(/\n\s*\n|\n/).map(p => p.trim()).filter(Boolean);

    if (paragraphs.length > 0) {
      paragraphs.forEach(pText => {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: pText,
                size: 22,
                font: "Gautami",
                color: "1E293B"
              })
            ]
          })
        );
      });
    } else {
      docChildren.push(
        new Paragraph({
          children: [new TextRun({ text: "[No Body Content]", italic: true, size: 20, font: "Arial" })]
        })
      );
    }

    docChildren.push(new Paragraph({ text: "" }));

    // Images Section
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "ASSOCIATED IMAGES:", bold: true, size: 22, font: "Arial", color: "111827" })
        ]
      })
    );

    if (art.resolvedImages && art.resolvedImages.length > 0) {
      for (let imgIdx = 0; imgIdx < art.resolvedImages.length; imgIdx++) {
        const imgObj = art.resolvedImages[imgIdx];
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Image ${imgIdx + 1}: ${imgObj.packageFilename} (Original: ${imgObj.originalFilename})`,
                bold: true,
                size: 20,
                font: "Arial",
                color: "374151"
              })
            ]
          })
        );

        // Embed Preview Thumbnail in DOCX if image file exists
        if (imgObj.localPath && fs.existsSync(imgObj.localPath)) {
          try {
            const imgBuffer = fs.readFileSync(imgObj.localPath);
            docChildren.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imgBuffer,
                    transformation: {
                      width: 280,
                      height: 180
                    }
                  })
                ]
              })
            );
          } catch (e) {
            docChildren.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `[Preview unavailable: ${e.message}]`, italic: true, size: 18, color: "DC2626" })
                ]
              })
            );
          }
        }
      }
    } else {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Images: None", italic: true, size: 20, font: "Arial", color: "6B7280" })
          ]
        })
      );
    }

    // Article Divider
    docChildren.push(
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "------------------------------------------------------------------------------------",
            color: "E5E7EB"
          })
        ]
      }),
      new Paragraph({ text: "" })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
}

/**
 * Generate Designer Package ZIP
 */
async function generateDesignerPackage({ publicationDate, articles: requestedArticles, adminUser = 'admin' }) {
  if (!publicationDate || !/^\d{4}-\d{2}-\d{2}$/.test(publicationDate)) {
    throw new Error('Invalid publication date format. Expected YYYY-MM-DD.');
  }

  if (!requestedArticles || !Array.isArray(requestedArticles) || requestedArticles.length === 0) {
    throw new Error('At least one article must be selected to generate the designer package.');
  }

  // 1. Fetch DB Articles for publicationDate
  const dbData = await getCandidateArticles(publicationDate);
  const dbArticlesMap = new Map(dbData.articles.map(a => [a.id, a]));

  const selectedArticles = [];
  const warnings = [];

  // Order requested articles according to sequence provided
  requestedArticles.sort((a, b) => (a.order || 0) - (b.order || 0));

  let packageImageIndex = 0;

  for (let idx = 0; idx < requestedArticles.length; idx++) {
    const req = requestedArticles[idx];
    const dbArt = dbArticlesMap.get(req.articleId);

    if (!dbArt) {
      warnings.push(`Article ID ${req.articleId} not found in database for ${publicationDate}.`);
      continue;
    }

    const packageArticleId = `MM-${publicationDate}-${String(idx + 1).padStart(3, '0')}`;
    const resolvedImages = [];

    if (dbArt.images && dbArt.images.length > 0) {
      for (let imgIdx = 0; imgIdx < dbArt.images.length; imgIdx++) {
        const imgUrl = dbArt.images[imgIdx];
        const ext = path.extname(imgUrl) || '.jpg';
        const originalFilename = path.basename(imgUrl);
        const packageFilename = `${packageArticleId}-${String(imgIdx + 1).padStart(2, '0')}${ext}`;

        let localPath = null;
        try {
          localPath = resolveSafeMediaPath(imgUrl);
        } catch (e) {
          warnings.push(`Article ${packageArticleId}: ${e.message}`);
        }

        if (!localPath) {
          warnings.push(`Article ${packageArticleId} references an image that could not be found on disk (${imgUrl}).`);
        } else {
          packageImageIndex++;
        }

        resolvedImages.push({
          imageOrder: imgIdx + 1,
          packageFilename: packageFilename,
          originalFilename: originalFilename,
          sourceUrl: imgUrl,
          localPath: localPath
        });
      }
    }

    selectedArticles.push({
      ...dbArt,
      order: idx + 1,
      packageArticleId: packageArticleId,
      resolvedImages: resolvedImages
    });
  }

  if (selectedArticles.length === 0) {
    throw new Error('No valid articles found for the selected package criteria.');
  }

  // 2. Setup Working Scratch Directory
  const sessionFolder = `pkg_${publicationDate}_${Date.now()}`;
  const workDir = path.join(tempDir, sessionFolder);
  const origImagesDir = path.join(workDir, 'ORIGINAL_IMAGES');
  fs.mkdirSync(origImagesDir, { recursive: true });

  const docxPath = path.join(workDir, 'DAILY_NEWS.docx');
  const manifestPath = path.join(workDir, 'MANIFEST.json');
  const readmePath = path.join(workDir, 'README.txt');

  // 3. Generate DOCX File
  await generateDocxFile(docxPath, publicationDate, selectedArticles);

  // 4. Generate MANIFEST.json
  const totalImageCount = selectedArticles.reduce((acc, a) => acc + (a.resolvedImages ? a.resolvedImages.length : 0), 0);
  const manifestData = {
    publication: {
      name: "Mameka Mahodhayam",
      date: publicationDate
    },
    package: {
      formatVersion: "1.0",
      generatedAt: new Date().toISOString(),
      generatedBy: adminUser,
      articleCount: selectedArticles.length,
      imageCount: totalImageCount
    },
    articles: selectedArticles.map(a => ({
      articleId: a.packageArticleId,
      originalDbId: a.id,
      order: a.order,
      headline: a.headline,
      subheadline: a.subheadline,
      category: a.category,
      district: a.district,
      author: a.author,
      status: a.status,
      publicationDate: a.publication_date,
      images: a.resolvedImages.map(img => ({
        imageOrder: img.imageOrder,
        filename: img.packageFilename,
        sourceFilename: img.originalFilename,
        sourceUrl: img.sourceUrl,
        existsOnDisk: !!img.localPath
      }))
    }))
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf-8');

  // 5. Generate README.txt
  const readmeText = `==================================================
MAMEKA MAHODAYAM — NEWSPAPER DESIGNER PACKAGE
==================================================
Publication Date: ${publicationDate}
Generated At: ${new Date().toISOString()}
Generated By: ${adminUser}

PACKAGE CONTENTS:
1. DAILY_NEWS.docx   - Editable Microsoft Word document containing all selected articles in exact chosen editorial sequence.
2. ORIGINAL_IMAGES/  - High-resolution uncompressed source media files named deterministically by Article ID (e.g. MM-${publicationDate}-001-01.jpg).
3. MANIFEST.json     - Machine-readable structured index mapping article IDs, metadata, and original image files.

EDITORIAL HANDOFF RULES:
- Article IDs (MM-YYYY-MM-DD-xxx) establish an explicit link between text in DAILY_NEWS.docx and images in ORIGINAL_IMAGES/.
- Always use the high-resolution source files in ORIGINAL_IMAGES/ for print layout design.
- Image previews inside DAILY_NEWS.docx are provided for visual identification only.
- Source media files in uploads/media/ remain 100% untouched and uncompressed.
==================================================
`;
  fs.writeFileSync(readmePath, readmeText, 'utf-8');

  // 6. Copy Original Media Files into ORIGINAL_IMAGES/
  selectedArticles.forEach(a => {
    a.resolvedImages.forEach(img => {
      if (img.localPath && fs.existsSync(img.localPath)) {
        const destPath = path.join(origImagesDir, img.packageFilename);
        fs.copyFileSync(img.localPath, destPath);
      }
    });
  });

  // 7. Create ZIP Archive using AdmZip
  const zipFilename = `MAMEKA_MAHODAYAM_${publicationDate}_DESIGNER_PACKAGE.zip`;
  const zipPath = path.join(packagesDir, zipFilename);
  const folderPrefix = `MAMEKA_MAHODAYAM_${publicationDate}`;

  const zip = new AdmZip();
  zip.addLocalFile(docxPath, folderPrefix, 'DAILY_NEWS.docx');
  zip.addLocalFile(manifestPath, folderPrefix, 'MANIFEST.json');
  zip.addLocalFile(readmePath, folderPrefix, 'README.txt');

  if (fs.existsSync(origImagesDir) && fs.readdirSync(origImagesDir).length > 0) {
    zip.addLocalFolder(origImagesDir, `${folderPrefix}/ORIGINAL_IMAGES`);
  } else {
    // Empty directory placeholder
    zip.addFile(`${folderPrefix}/ORIGINAL_IMAGES/`, Buffer.alloc(0));
  }

  zip.writeZip(zipPath);

  // 8. Package Integrity Inspector
  if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
    throw new Error('Package Integrity Failure: ZIP package creation failed or generated 0 bytes.');
  }

  if (AdmZip) {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries().map(e => e.entryName);
    
    const requiredFiles = [
      `MAMEKA_MAHODAYAM_${publicationDate}/DAILY_NEWS.docx`,
      `MAMEKA_MAHODAYAM_${publicationDate}/MANIFEST.json`,
      `MAMEKA_MAHODAYAM_${publicationDate}/README.txt`
    ];

    for (const reqFile of requiredFiles) {
      if (!entries.includes(reqFile)) {
        throw new Error(`Package Integrity Failure: Required file missing in ZIP package: ${reqFile}`);
      }
    }

    // Security Check: Verify NO sensitive files are included
    const forbiddenPatterns = ['database.sqlite', '.env', 'server.js', 'db.js', 'node_modules', 'credentials'];
    for (const entry of entries) {
      for (const forbidden of forbiddenPatterns) {
        if (entry.toLowerCase().includes(forbidden)) {
          fs.unlinkSync(zipPath);
          throw new Error(`Security Violation: Forbidden sensitive file included in ZIP package: ${entry}`);
        }
      }
    }
  }

  // 9. Clean up temporary working directory
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch (e) {
    console.warn('Temporary directory cleanup notice:', e.message);
  }

  return {
    success: true,
    filename: zipFilename,
    downloadUrl: `/api/admin/designer-package/download/${zipFilename}`,
    publicationDate: publicationDate,
    articleCount: selectedArticles.length,
    imageCount: totalImageCount,
    warnings: warnings
  };
}

module.exports = {
  getCandidateArticles,
  generateDesignerPackage,
  resolveSafeMediaPath
};
