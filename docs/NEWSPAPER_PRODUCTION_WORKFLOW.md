# MAMEKA MAHODAYAM — NEWSPAPER PRODUCTION WORKFLOW & DESIGNER SOFTWARE INTEGRATION CONTRACT

**Document Version:** 1.0.0  
**Effective Date:** 2026-09-14  
**Publication:** Mameka Mahodhayam (మమేక మహోదయం Telugu Daily)  
**Scope:** Print Newspaper Workflow, Editorial Handoff, DTP Integration, and E-Paper Archival Contract  

---

## 1. EXECUTIVE SUMMARY & SYSTEM BOUNDARIES

This document establishes the official production workflow contract and technical integration guidelines for **Mameka Mahodhayam (మమేక మహోదయం)**.

### Core Architecture & Boundaries
```
┌───────────────────────────┐
│     ORIGINAL ARTICLES     │
│       & MEDIA ASSETS      │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│    ADMIN EDITORIAL CMS    │
│   (Database = Source)     │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ DESIGNER PACKAGE GENERATOR│  ◄── [STEP 7 CONTRACT]
│ (.docx, images, manifest) │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│    NEWSPAPER DESIGNER     │  ◄── [STEP 8 HANDOFF WORKFLOW]
│ (InDesign / CorelDRAW DTP)│
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│   FINAL PRINT PRESS PDF   │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│     PUBLIC E-PAPER CMS    │  ◄── [STEP 4 CONTRACT]
│  (Reader Archival Viewer) │
└─────────────┬─────────────┘
```

> [!IMPORTANT]
> **Strict System Boundaries:**
> 1. The **Admin CMS Database** is the sole **Source of Truth** for all news content, headlines, categories, districts, and original high-resolution media.
> 2. Digital news flows from `Admin CMS -> SQLite -> Public Website`.
> 3. Print newspaper flows from `Admin CMS -> Designer Package Generator -> Newspaper Designer (DTP) -> Press PDF -> E-Paper`.
> 4. **No Reverse Flow:** PDF-to-article extraction is strictly prohibited to prevent data loss, font corruption, or OCR errors.

---

## 2. PRODUCTION CONTRACT

| Stage | Responsible Role | Input | Output / Deliverable | Target System |
| :--- | :--- | :--- | :--- | :--- |
| **1. Digital Editorial** | News Editor / Desk | Raw News, Reporter Stories, Photos | Published / Approved DB Articles | Admin CMS (`/admin`) |
| **2. Package Handoff** | Chief Editor / DTP Incharge | Date Selection in Admin CMS | `MAMEKA_MAHODAYAM_YYYY-MM-DD_DESIGNER_PACKAGE.zip` | Local Workstation |
| **3. Desktop Publishing** | Newspaper Layout Designer | Designer ZIP Package | Fully Assembled Newspaper Pages | InDesign / CorelDRAW |
| **4. Press Proofing** | Proof Reader / Chief Editor | Printed / Digital Page Proofs | Verified Page Master | DTP Software |
| **5. PDF Generation** | Newspaper Layout Designer | Page Layouts | High-Res Press PDF (CMYK, 300 DPI) | Local Disk |
| **6. Press Production** | Printing Press | Press PDF | Physical Newspaper | Printing Press |
| **7. E-Paper Archival** | Digital Admin | Press PDF | Published Digital E-Paper Edition | Public E-Paper System |

---

## 3. EDITOR PRE-PRODUCTION CHECKLIST

Before triggering the Designer Package generation, the News Desk / Chief Editor must complete the following steps in the Admin Panel:

- [ ] **1. Article Verification:** All articles intended for the print edition must have `Status = Published` or `Pending Review`.
- [ ] **2. Telugu Unicode Integrity Check:** Ensure headlines (`headline`), subheadlines (`subheadline`), and body text (`content_te`) are rendered correctly in standard Unicode Telugu text (Mandali / Noto Sans Telugu).
- [ ] **3. Image Association:** Confirm that every article requiring a photo has its high-resolution original image attached via the Media Library or Article Editor.
- [ ] **4. Metadata Verification:** Check that `Category` (e.g., ఆంధ్రప్రదేశ్, జాతీయాలు, రాజకీయం) and `AP District` (e.g., కృష్ణా, గుంటూరు, ఎన్టీఆర్) are accurately assigned.
- [ ] **5. Article Sequence / Priority Order:** Set the numerical display order (`order`) in the Designer Package generator view to reflect article priority (e.g., Lead Story = 1, Second Lead = 2).
- [ ] **6. Date Alignment:** Ensure the selected publication date in the CMS matches the intended print edition date (e.g., `2026-09-14`).

---

## 4. DESIGNER HANDOFF CHECKLIST

Upon receiving the `MAMEKA_MAHODAYAM_YYYY-MM-DD_DESIGNER_PACKAGE.zip`, the Newspaper Layout Designer must follow this handoff protocol:

### Step A: Extraction & Inspection
1. Unzip `MAMEKA_MAHODAYAM_YYYY-MM-DD_DESIGNER_PACKAGE.zip` to a dedicated working folder.
2. Confirm the presence of four mandatory components:
   - `DAILY_NEWS.docx` — Formatted Telugu text document containing all selected articles.
   - `MANIFEST.json` — Machine-readable structured manifest of articles, categories, and image mappings.
   - `README.txt` — Human-readable summary of package contents and date.
   - `ORIGINAL_IMAGES/` — Directory containing original, uncompressed, high-resolution JPEG files named `MM-YYYY-MM-DD-XXX-YY.jpg`.

### Step B: Text Import in DTP Software
1. Open the primary layout application (Adobe InDesign 2024 / CorelDRAW 2023).
2. Ensure the World-Ready Paragraph Composer (for Adobe InDesign) or Complex Script Engine (for CorelDRAW) is enabled.
3. Import text from `DAILY_NEWS.docx`. Paragraph styles (`MM_Headline`, `MM_Subheadline`, `MM_Category`, `MM_Byline`, `MM_BodyText`) will automatically map to DTP stylesheet presets.

### Step C: Image Linking
1. Refer to `MANIFEST.json` or `README.txt` for image filename associations.
2. Place photos from `ORIGINAL_IMAGES/` into designated layout frames.
3. Verify that image resolution is 300 DPI at 100% placement scale and color mode is converted to CMYK for offset printing.

### Step D: Page Proofing & Press PDF Export
1. Print page proofs for proofreading.
2. Export final pages using the **Press Quality PDF/X-1a:2001** preset.
3. Upload the final compiled PDF to the Admin CMS under **E-Paper & Editions** (`/admin/#/editions`) for public reader viewing.

---

## 5. FILE NAMING & IMAGE LINKAGE CONTRACT

### Image Naming Scheme
All original images packaged by the system follow a standardized, non-colliding naming convention:
$$\text{MM}-\text{YYYY}-\text{MM}-\text{DD}-\text{ARTICLE\_ID\_PAD3}-\text{INDEX\_PAD2}.\text{ext}$$

Example: `MM-2026-09-13-001-01.jpg`
- `MM`: Brand prefix (Mameka Mahodhayam)
- `2026-09-13`: Publication date
- `001`: Article ID (padded to 3 digits)
- `01`: Image index for the article (padded to 2 digits)

### Image Linkage Rules
1. **Zero Compression:** Image files stored in `/uploads/media/` and packaged into `ORIGINAL_IMAGES/` are never recompressed, resized, or downsampled during package generation.
2. **Explicit Mapping:** `MANIFEST.json` contains explicit image path mapping:
   ```json
   "images": [
     {
       "original_path": "/uploads/media/1789369706063-photo.jpg",
       "image_filename": "MM-2026-09-13-001-01.jpg",
       "caption": "కలెక్టర్ కార్యాలయం వద్ద నిరసన"
     }
   ]
   ```

---

## 6. MANIFEST MACHINE CONTRACT

The `MANIFEST.json` file inside each designer package serves as the machine-readable schema for automated DTP scripts (InDesign ExtendScript / CorelDRAW VBA).

### JSON Schema Specification
```json
{
  "generated_at": "ISO-8601 Timestamp",
  "publication_date": "YYYY-MM-DD",
  "total_articles": "Integer",
  "total_images": "Integer",
  "articles": [
    {
      "sequence_order": "Integer (1-based)",
      "id": "Integer",
      "headline": "String (Telugu UTF-8)",
      "subheadline": "String (Telugu UTF-8)",
      "category": "String",
      "district": "String or null",
      "author": "String",
      "summary": "String",
      "content_te": "String (Telugu UTF-8)",
      "status": "published | pending_review | draft",
      "images": [
        {
          "original_path": "String",
          "image_filename": "String",
          "caption": "String"
        }
      ]
    }
  ]
}
```

---

## 7. REVISION WORKFLOW & LATE NEWS INSERTIONS

If news is updated or late-breaking stories are added after the initial package has been delivered to the designer:

1. **Minor Text Edits:** The News Desk can notify the DTP designer with specific line edits via telephone/chat without re-generating the package.
2. **Major Story Revisions / New Articles:**
   - Editor updates/adds the article in the Admin CMS.
   - Editor selects the date in the Designer Package Generator and checks only the modified/new articles.
   - Editor generates a revised package. The system appends a revision timestamp to the filename (e.g., `MAMEKA_MAHODAYAM_2026-09-13_DESIGNER_PACKAGE_v2.zip`).
   - Designer replaces the relevant story frame content using the updated `DAILY_NEWS.docx` or `MANIFEST.json`.

---

## 8. FUTURE AUTOMATION & SOFTWARE INTEGRATION ROADMAP

While current layout placement is handled manually by the newspaper designer using the structured package, the architecture is fully prepared for future software-specific automation:

### Future Automation Modules (Post-Step 8 Roadmap):
1. **Adobe InDesign ExtendScript (JSX) Plugin:**
   - Auto-reads `MANIFEST.json`.
   - Populates template text boxes matching tags `MM_Headline`, `MM_BodyText`.
   - Auto-places image files from `ORIGINAL_IMAGES/` into linked graphics frames.
2. **CorelDRAW VBA Automation Macro:**
   - Reads `DAILY_NEWS.docx` and `MANIFEST.json`.
   - Places Telugu text into pre-configured CorelDRAW broadsheet page templates.
3. **Automated E-Paper Ingestion Pipeline:**
   - Auto-generates single-page PDF splits and thumbnail previews upon uploading the final Press PDF to `/admin/#/editions`.

---

## 9. VERIFICATION & PRESERVATION CONFIRMATION

- **Data Preservation:** 147 published articles, 204 original media assets, 3 print editions, 8 categories, and 26 AP districts preserved with 100% data fidelity.
- **Telugu Script Compatibility:** Tested and verified across Windows 11 Unicode engines, Microsoft Word (.docx), and Adobe/Corel text import engines.
- **Security:** Package generation and download endpoints are strictly protected by Admin Bearer JWT Token authentication.
