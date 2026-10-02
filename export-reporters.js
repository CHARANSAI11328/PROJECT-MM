const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const qrcode = require('qrcode');
const db = require('./db.js');

// Official Live Production Base URL for MAMEKA MAHODAYAM
const LIVE_BASE_URL = process.env.LIVE_SITE_URL || 'https://project-mm-1.onrender.com';

async function exportReporters() {
  try {
    const baseDir = 'D:/reporters-idcards';
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const localQrUploadDir = path.join(__dirname, 'uploads', 'qr_codes');
    if (!fs.existsSync(localQrUploadDir)) {
      fs.mkdirSync(localQrUploadDir, { recursive: true });
    }

    const reporters = await db.dbAll('SELECT id, name, designation, district, mandal, press_id, photo_url, qr_code_url FROM reporters ORDER BY id');
    console.log(`\nFound ${reporters.length} reporters in the database.`);
    console.log(`Generating LIVE Production QR Codes pointing to: ${LIVE_BASE_URL}\n`);

    const summary = [];

    for (const r of reporters) {
      const originalName = r.name.trim();
      let folderName = originalName;
      let repDir = path.join(baseDir, folderName);
      let needsDesktopIni = false;

      // Check if folder can be created directly with full original name
      try {
        if (!fs.existsSync(repDir)) {
          fs.mkdirSync(repDir, { recursive: true });
        }
      } catch (err) {
        // FAT32 file system on Lexar USB has a known limitation with non-OEM Unicode > 22 chars
        if (originalName.includes('ఉమ్మారెడ్డి')) {
          folderName = 'ఉమ్మారెడ్డి మురళికృష్ణ';
          needsDesktopIni = true;
        } else if (originalName.includes('కామరాజుగడ్డ')) {
          folderName = 'కామరాజుగడ్డ విజయకుమార్';
          needsDesktopIni = true;
        } else {
          folderName = originalName.substring(0, 21).trim();
          needsDesktopIni = true;
        }
        repDir = path.join(baseDir, folderName);
        if (!fs.existsSync(repDir)) {
          fs.mkdirSync(repDir, { recursive: true });
        }
      }

      // If shortened for FAT32 compatibility, use desktop.ini to display full name in Windows Explorer
      if (needsDesktopIni) {
        try {
          const iniPath = path.join(repDir, 'desktop.ini');
          fs.writeFileSync(iniPath, `[.ShellClassInfo]\r\nLocalizedResourceName=${originalName}\r\n`, 'utf8');
          try {
            execSync(`attrib +h +s "${iniPath}"`);
            execSync(`attrib +r "${repDir}"`);
          } catch (_) {}
        } catch (_) {}
      }

      // Reporter ID Number (Press ID)
      const pressId = (r.press_id ? r.press_id.trim() : r.id);
      const photoFileName = `${pressId}.jpeg`;
      const photoPath = path.join(repDir, photoFileName);

      // Save exact original raw image given during registration (byte-for-byte identical, unscaled)
      if (r.photo_url && r.photo_url.includes('base64,')) {
        const b64Data = r.photo_url.split('base64,')[1];
        const photoBuffer = Buffer.from(b64Data, 'base64');
        fs.writeFileSync(photoPath, photoBuffer);
      }

      // Generate the LIVE working QR Code (High-Res 1000px, Level H 30% error correction, official brand color)
      const liveProfileUrl = `${LIVE_BASE_URL}/reporter-profile.html?id=${encodeURIComponent(r.id)}`;
      const qrDestPath = path.join(repDir, 'qrcode.png');

      await qrcode.toFile(qrDestPath, liveProfileUrl, {
        width: 1000,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#be185d',
          light: '#ffffff'
        }
      });

      // Also update the local server uploads directory
      const localQrPath = path.join(localQrUploadDir, `Reporter_${r.id}_QR.png`);
      try {
        fs.copyFileSync(qrDestPath, localQrPath);
      } catch (_) {}

      const photoExists = fs.existsSync(photoPath);
      const qrExists = fs.existsSync(qrDestPath);

      summary.push({
        reporter_name: originalName,
        folder: folderName,
        press_id: pressId,
        photo_file: photoFileName,
        photo_size_bytes: photoExists ? fs.statSync(photoPath).size : 0,
        live_qr_url: liveProfileUrl,
        qr_file: 'qrcode.png',
        qr_size_bytes: qrExists ? fs.statSync(qrDestPath).size : 0,
        status: (photoExists && qrExists) ? 'LIVE READY ✓' : 'FAILED ✗'
      });
    }

    console.log('================================== REPORTERS ID CARDS EXPORT (LIVE QR) ==================================');
    console.table(summary);
    const successful = summary.filter(s => s.status.includes('LIVE READY')).length;
    console.log(`\n✓ Total updated folders: ${successful} of ${reporters.length}`);
    console.log(`✓ Target Directory: ${baseDir}`);
    console.log(`✓ All QR codes now point to LIVE URLs: ${LIVE_BASE_URL}/reporter-profile.html?id=...\n`);

  } catch (err) {
    console.error('Fatal export error:', err);
  } finally {
    process.exit(0);
  }
}

exportReporters();
