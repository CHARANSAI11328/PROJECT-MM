/**
 * MAMEKA MAHODAYAM - Official Full-Screen Accredited Press ID & Verification Engine
 * Renders standalone accredited reporter verification portfolio page without on-page QR box,
 * featuring typewriter name animation, credentials, official press seal, and authored articles grid.
 */

(function () {
  'use strict';

  // DOM Elements
  const heroContainer = document.getElementById('reporter-profile-hero');
  const articlesGrid = document.getElementById('reporter-articles-grid');
  const breadcrumbName = document.getElementById('breadcrumb-reporter-name');
  const articlesHeading = document.getElementById('authored-articles-heading');

  function getDistrictName(code) {
    if (!code) return '';
    if (typeof MAMEKA_DISTRICTS !== 'undefined' && MAMEKA_DISTRICTS.getDistrictByCodeOrSlug) {
      const d = MAMEKA_DISTRICTS.getDistrictByCodeOrSlug(code);
      if (d) {
        const lang = (window.MM_i18n ? window.MM_i18n.getLanguage() : 'te');
        return lang === 'en' ? d.name_en : d.name_te;
      }
    }
    return code;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getApiBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL.replace(/\/$/, '');
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('mm_api_base_url') : null;
    if (saved && saved.trim()) return saved.trim().replace(/\/$/, '');
    if (window.location.protocol === 'file:' || !window.location.host || window.location.origin === 'null') {
      return 'http://localhost:3000';
    }
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3000') {
      return 'http://localhost:3000';
    }
    return '';
  }

  function resolvePhotoUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = getApiBaseUrl();
    return base + (url.startsWith('/') ? '' : '/') + url;
  }

  async function initReporterProfile() {
    if (!heroContainer) return;

    // Extract reporter ID from URL params (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const reporterId = urlParams.get('id') || 'rep_1';

    try {
      const baseUrl = getApiBaseUrl();
      const targetUrl = `${baseUrl}/api/public/reporters/${encodeURIComponent(reporterId)}`;

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Reporter profile not found');
      const data = await response.json();
      
      const reporter = data.reporter;
      const articles = data.articles || [];

      if (!reporter) throw new Error('Empty reporter payload');

      renderReporterPressIDHero(reporter);
      renderAuthoredArticles(reporter, articles);
    } catch (err) {
      console.error('Failed to load reporter profile:', err);
      heroContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; background: #fff5f5; border: 1px dashed #feb2b2; border-radius: 8px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px; color: #e53e3e;">⚠️</div>
          <h2 style="color: #c53030; font-weight: 700; font-size: 1.25rem; margin-bottom: 6px;">
            పాత్రికేయుని గుర్తింపు ప్రొఫైల్ లభించలేదు (Press ID Profile Not Found)
          </h2>
          <p style="color: #742a2a; font-size: 0.95rem; margin-bottom: 20px;">
            కోరిన పాత్రికేయుని వివరాలు లభించలేదు లేదా గుర్తింపు కార్డు తొలగించబడినది.
          </p>
          <a href="/editorial-team.html" class="btn-newspaper-action" style="display: inline-block; text-decoration: none; padding: 8px 20px; background: #be185d; color: #fff; border-radius: 4px; font-weight: 700;">
            ← మా సంపాదకీయ బృందం పేజీకి వెళ్ళు
          </a>
        </div>
      `;
    }
  }

  function renderReporterPressIDHero(r) {
    const hasPhoto = Boolean(r.photo_url && r.photo_url.trim());
    const photoUrl = hasPhoto ? resolvePhotoUrl(r.photo_url) : '';
    const initialLetter = escapeHtml((r.name || 'R').trim().charAt(0).toUpperCase());
    const districtName = getDistrictName(r.district) || 'ఆంధ్రప్రదేశ్';
    const mandalText = r.mandal ? ` (${escapeHtml(r.mandal)})` : '';
    const fullLocation = [districtName, r.mandal].filter(Boolean).join(' | ');

    if (breadcrumbName) {
      breadcrumbName.textContent = r.name;
    }
    document.title = `${r.name} - ${r.designation} (అధికారిక పాత్రికేయుని గుర్తింపు ప్రొఫైల్) | మమేక మహోదయం`;

    const pressIdNumber = r.press_id || `MM-PRESS-2026-${String(r.id || '001').replace(/\D/g, '').padStart(3, '0')}`;
    const bioQuote = r.bio || 'సత్యమే ఆధారం... ప్రజాహితమే మా ధ్యేయం! మమేక మహోదయం దినపత్రిక ద్వారా సమాజంలో మంచి మార్పు కోసం నిరంతరం ప్రజా సమస్యలను వెలికితీస్తూ, స్వతంత్ర, నిష్పాక్షికమైన జర్నలిజానికి కట్టుబడి ఉన్నాం.';

    // Safe On-Screen Portrait HTML (never falls back to another reporter's photo)
    const onScreenPhotoContent = hasPhoto
      ? `<img 
          src="${escapeHtml(photoUrl)}" 
          alt="${escapeHtml(r.name)}" 
          style="width: 100%; height: 340px; display: block; object-fit: contain; background: #ffffff; padding: 4px;"
          onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:100%;height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(145deg, #fdf2f8 0%, #f1f5f9 100%);padding:20px;box-sizing:border-box;\\'><div style=\\'width:110px;height:110px;border-radius:50%;background:#be185d;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:3rem;font-weight:800;font-family:Georgia,serif;border:4px solid #ffffff;box-shadow:0 8px 24px rgba(190,24,93,0.25);\\'>${initialLetter}</div><div style=\\'font-size:0.95rem;font-weight:800;color:#be185d;margin-top:14px;text-transform:uppercase;\\'>అధికారిక పాత్రికేయుడు</div><div style=\\'font-size:0.8rem;color:#64748b;font-weight:600;margin-top:2px;\\'>Accredited Journalist</div></div>';"
        />`
      : `<div style="width: 100%; height: 340px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(145deg, #fdf2f8 0%, #f1f5f9 100%); padding: 20px; box-sizing: border-box;">
          <div style="width: 110px; height: 110px; border-radius: 50%; background: #be185d; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; font-family: Georgia, serif; border: 4px solid #ffffff; box-shadow: 0 8px 24px rgba(190,24,93,0.25); margin-bottom: 14px;">
            ${initialLetter}
          </div>
          <div style="font-size: 0.95rem; font-weight: 800; color: #be185d; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">
            అధికారిక పాత్రికేయుడు
          </div>
          <div style="font-size: 0.8rem; font-weight: 600; color: #64748b; text-align: center; margin-top: 2px;">
            (ACCREDITED JOURNALIST)
          </div>
        </div>`;

    heroContainer.innerHTML = `
      <!-- ========================================================================= -->
      <!-- 1. ON-SCREEN FULL PROFILE WEB HERO SECTION (CLEAN, IMPRESSIVE, BIGGER PHOTO) -->
      <!-- ========================================================================= -->
      <div class="on-screen-profile-hero" style="background: linear-gradient(180deg, #ffffff 0%, #faf8f5 100%); border: 1px solid #cbd5e1; border-top: 6px solid #be185d; border-radius: 16px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06); padding: 36px; margin-bottom: 36px; position: relative;">
        
        <!-- TOP VERIFICATION BADGE HEADER BANNER -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-bottom: 20px; margin-bottom: 28px; border-bottom: 2px dashed #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 2rem;">🛡️</span>
            <div>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: #be185d; margin: 0; text-transform: uppercase; letter-spacing: 0.02em;">
                మమేక మహోదయం దినపత్రిక — అధికారిక పాత్రికేయుని ధృవీకరణ ప్రొఫైల్
              </h4>
              <span style="font-size: 0.825rem; color: #64748b; font-weight: 600;">OFFICIAL ACCREDITED PRESS ID VERIFICATION PORTAL</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.88rem; font-weight: 800; padding: 6px 16px; border-radius: 20px;">
              <span>✅</span> ACCREDITED JOURNALIST (ACTIVE 2026-2027)
            </span>
          </div>
        </div>

        <!-- MAIN FLEX LAYOUT: LEFT BIGGER PORTRAIT PHOTO | RIGHT TYPEWRITER NAME & HIGHLIGHTS -->
        <div style="display: flex; flex-direction: row; gap: 36px; align-items: flex-start;" class="profile-hero-flex-wrap">
          
          <!-- LEFT COLUMN: BIGGER PORTRAIT PHOTO FRAME (NO ON-PAGE QR BOX) -->
          <div style="width: 270px; flex-shrink: 0; margin: 0 auto;" class="profile-hero-image-col">
            <div style="width: 100%; border-radius: 14px; overflow: hidden; box-shadow: 0 14px 30px rgba(0,0,0,0.12); border: 4px solid #ffffff; outline: 1px solid #cbd5e1; background: #ffffff;">
              ${onScreenPhotoContent}
            </div>
            <div style="margin-top: 14px; text-align: center;">
              <span style="display: inline-block; background: #fdfbf7; border: 1px solid #fecdd3; color: #be185d; font-size: 0.82rem; font-weight: 800; padding: 6px 16px; border-radius: 16px;">
                🏛️ అధికారిక గుర్తింపు కార్డ్ (Official Accreditation)
              </span>
            </div>
          </div>

          <!-- RIGHT COLUMN: TYPEWRITER NAME & HIGHLIGHTED CREDENTIALS -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
            
            <!-- HIGHLIGHT 1: DESIGNATION BADGE & PRESS ID NO -->
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
              <span style="background: #be185d; color: #ffffff; font-size: 0.9rem; font-weight: 800; padding: 5px 18px; border-radius: 20px; text-transform: uppercase; box-shadow: 0 2px 8px rgba(190, 24, 93, 0.25);">
                ⭐ ${escapeHtml(r.designation)}
              </span>
              <span style="background: #ffffff; color: #1e293b; border: 1.5px solid #be185d; font-size: 0.875rem; font-weight: 800; padding: 5px 16px; border-radius: 20px;">
                🆔 PRESS ID: ${escapeHtml(pressIdNumber)}
              </span>
            </div>

            <!-- HIGHLIGHT 2: TYPEWRITER FULL NAME -->
            <div style="min-height: 52px; display: flex; align-items: center; margin-bottom: 12px;">
              <h1 id="reporter-typewriter-name" style="font-size: clamp(2.2rem, 4.5vw, 3rem); font-family: Georgia, 'Times New Roman', serif; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">
                ${escapeHtml(r.name)}
              </h1>
            </div>

            <!-- HIGHLIGHT 3: LOCATION & CONTACT BADGES -->
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 18px;">
              ${fullLocation ? `
                <span style="background: #f8fafc; border: 1px solid #cbd5e1; color: #334155; font-size: 0.925rem; font-weight: 700; padding: 6px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;">
                  📍 ${escapeHtml(fullLocation)}
                </span>
              ` : ''}
              ${r.phone ? `
                <a href="tel:${escapeHtml(r.phone)}" style="background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; font-size: 0.9rem; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                  📞 ${escapeHtml(r.phone)}
                </a>
              ` : ''}
              ${r.email ? `
                <a href="mailto:${escapeHtml(r.email)}" style="background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; font-size: 0.9rem; font-weight: 700; padding: 6px 16px; border-radius: 20px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                  ✉️ ${escapeHtml(r.email)}
                </a>
              ` : ''}
            </div>

            <!-- HIGHLIGHT 4: JOURNALISTIC ETHICS & BIO QUOTE BOX -->
            <div style="background: #ffffff; border-left: 5px solid #be185d; border-radius: 0 10px 10px 0; padding: 20px 24px; margin-bottom: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.03); border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
              <h5 style="font-size: 0.85rem; font-weight: 800; color: #be185d; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.04em;">
                పాత్రికేయుని పరిచయం &amp; జర్నలిజం నిబద్ధత (Journalistic Bio &amp; Ethics)
              </h5>
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 1.08rem; line-height: 1.7; color: #334155; font-style: italic;">
                "${escapeHtml(bioQuote)}"
              </p>
            </div>

            <!-- HIGHLIGHT 5: OFFICIAL VERIFICATION SEAL STATEMENT -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; font-size: 0.88rem; color: #475569; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <strong>🏛️ జారీ చేసిన సంస్థ:</strong> మమేక మహోదయం దినపత్రిక డిజిటల్ నెట్‌వర్క్
              </div>
              <div>
                <strong>🔒 ఐడీ చెల్లుబాటు వ్యవధి:</strong> 2026 - 2027 (Active Verified)
              </div>
            </div>

            <!-- ACTION BUTTONS ROW -->
            <div class="no-print" style="display: flex; gap: 14px; flex-wrap: wrap; align-items: center;">
              <button type="button" onclick="window.print()" style="padding: 12px 26px; background: #be185d; color: #ffffff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 14px rgba(190, 24, 93, 0.3); display: inline-flex; align-items: center; gap: 8px;">
                🖨️ ID కార్డు ప్రింట్ / డౌన్‌లోడ్ (Download Press ID Card)
              </button>
              <button type="button" onclick="navigator.clipboard.writeText(window.location.href); alert('ID ప్రొఫైల్ లింక్ కాపీ చేయబడింది!');" style="padding: 12px 22px; background: #ffffff; color: #be185d; border: 1.5px solid #be185d; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                📋 లింక్ కాపీ చేయండి (Copy Link)
              </button>
              <a href="editorial-team.html" style="padding: 12px 20px; color: #64748b; text-decoration: none; font-weight: 600; font-size: 0.9rem; margin-left: auto;">
                ← రిపోర్టర్ల డైరెక్టరీకి వెళ్ళు
              </a>
            </div>

          </div>

        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 2. PRINT-ONLY COMPACT PHYSICAL PRESS ID CARD (SHOWN ONLY WHEN DOWNLOADING/PRINTING) -->
      <!-- ========================================================================= -->
      <div id="printable-press-id-card" class="print-only-card" style="background: #ffffff; border: 2px solid #be185d; border-radius: 12px; overflow: hidden;">
        
        <!-- TOP MIDDLE: NEWSPAPER NAME HEADER -->
        <div style="background: linear-gradient(135deg, #881337 0%, #be185d 100%); color: #ffffff; text-align: center; padding: 16px 20px; border-bottom: 3px solid #9f1239;">
          <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.95; margin-bottom: 2px;">
            తెలుగు దినపత్రిక | ACCREDITED PRESS IDENTIFICATION CARD
          </div>
          <h1 style="font-size: 2rem; font-weight: 900; margin: 0; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0.02em; color: #ffffff; line-height: 1.1;">
            మమేక మహోదయం
          </h1>
          <div style="font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; opacity: 0.95; margin-top: 3px; text-transform: uppercase;">
            MAMEKA MAHODAYAM DAILY
          </div>
        </div>

        <!-- BODY: PHOTO AT LEFT | NAME & DESIGNATION AT RIGHT -->
        <div style="display: flex; flex-direction: row; gap: 24px; align-items: flex-start; padding: 24px; background: #ffffff;">
          
          <!-- LEFT PHOTO FRAME -->
          <div style="width: 170px; flex-shrink: 0; text-align: center;">
            <div style="width: 160px; height: 195px; border-radius: 8px; border: 3px solid #be185d; overflow: hidden; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 0 auto; display: flex; align-items: center; justify-content: center;">
              ${hasPhoto
                ? `<img 
                    src="${escapeHtml(photoUrl)}" 
                    alt="${escapeHtml(r.name)}" 
                    style="width: 100%; height: 100%; object-fit: contain; display: block;"
                    onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fdf2f8;\\'><div style=\\'width:72px;height:72px;border-radius:50%;background:#be185d;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;font-family:Georgia,serif;\\'>${initialLetter}</div></div>';"
                  />`
                : `<div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fdf2f8;">
                    <div style="width: 72px; height: 72px; border-radius: 50%; background: #be185d; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; font-family: Georgia, serif;">
                      ${initialLetter}
                    </div>
                    <div style="font-size: 0.72rem; font-weight: 700; color: #be185d; margin-top: 6px;">
                      ACCREDITED
                    </div>
                  </div>`}
            </div>
            <div style="margin-top: 8px; font-size: 0.75rem; font-weight: 800; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 12px; display: inline-block;">
              ✓ ACTIVE ACCREDITED
            </div>
          </div>

          <!-- RIGHT DETAILS -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
            
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
              <span style="background: #fff1f2; color: #be185d; border: 1px solid #fecdd3; font-size: 0.85rem; font-weight: 800; padding: 3px 12px; border-radius: 14px; text-transform: uppercase;">
                ⭐ ${escapeHtml(r.designation)}
              </span>
              <span style="font-size: 0.825rem; font-weight: 700; color: #475569; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 10px; border-radius: 14px;">
                🆔 PRESS ID: ${escapeHtml(pressIdNumber)}
              </span>
            </div>

            <h2 style="font-size: 2rem; font-family: Georgia, 'Times New Roman', serif; font-weight: 800; color: #0f172a; margin: 4px 0 8px 0; line-height: 1.2;">
              ${escapeHtml(r.name)}
            </h2>

            <div style="background: #fdfbf7; border: 1px solid #e2e8f0; border-left: 3px solid #be185d; border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 10px; font-size: 0.85rem; color: #334155;">
              <div><strong>📍 ప్రాంతం:</strong> ${escapeHtml(fullLocation || 'ఆంధ్రప్రదేశ్')}</div>
              <div><strong>📞 ఫోన్:</strong> ${escapeHtml(r.phone || 'N/A')}</div>
              <div><strong>✉️ ఈమెయిల్:</strong> ${escapeHtml(r.email || 'N/A')}</div>
              <div><strong>📅 చెల్లుబాటు:</strong> 2026 - 2027 (Active)</div>
            </div>

            <div style="font-size: 0.825rem; color: #475569; font-style: italic; font-family: Georgia, serif; line-height: 1.4; background: #ffffff; border: 1px solid #f1f5f9; padding: 6px 10px; border-radius: 4px;">
              "${escapeHtml(bioQuote)}"
            </div>

          </div>

        </div>

        <!-- FOOTER: ISSUING AUTHORITY & AUTHORIZED SIGNATORY -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 12px 20px; background: #f8fafc; border-top: 2px dashed #cbd5e1; font-size: 0.78rem; color: #475569;">
          <div>
            <div style="font-weight: 700; color: #0f172a;">🏛️ జారీ చేసిన సంస్థ: మమేక మహోదయం దినపత్రిక</div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 1px;">Official Press Accreditation • Head Office, Vijayawada, AP</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: Georgia, serif; font-size: 1rem; font-weight: bold; color: #be185d; font-style: italic; margin-bottom: 2px;">
              Vaka Srinivasrao
            </div>
            <div style="font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 2px; font-size: 0.7rem; text-transform: uppercase;">
              అధికారిక సంతకం (Authorized Signatory)
            </div>
          </div>
        </div>

      </div>
    `;

    // Typewriter effect trigger for name
    animateNameTypewriter(r.name);
  }

  function animateNameTypewriter(fullName) {
    const el = document.getElementById('reporter-typewriter-name');
    if (!el) return;

    el.innerHTML = '';
    let i = 0;

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.style.backgroundColor = '#be185d';
    cursor.style.width = '10px';
    cursor.style.height = '1em';
    cursor.style.display = 'inline-block';
    cursor.style.marginLeft = '4px';
    cursor.style.verticalAlign = 'middle';
    cursor.style.borderRadius = '2px';
    el.appendChild(cursor);

    function typeNextChar() {
      if (i < fullName.length) {
        const char = fullName.charAt(i);
        const textNode = document.createTextNode(char);
        el.insertBefore(textNode, cursor);
        i++;
        setTimeout(typeNextChar, 60);
      } else {
        setTimeout(() => {
          cursor.remove();
        }, 300);
      }
    }

    setTimeout(typeNextChar, 120);
  }

  function renderAuthoredArticles(reporter, articles) {
    if (!articlesGrid) return;

    if (articlesHeading) {
      articlesHeading.textContent = `${reporter.name} ప్రచురించిన వార్తా కథనాలు & నివేదికలు (${articles.length})`;
    }

    if (!articles || articles.length === 0) {
      articlesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📰</div>
          <p style="font-size: 1rem; color: #64748b; font-weight: 500;">
            ఈ పాత్రికేయుడు నుండి వార్తా కథనాలు త్వరలో ప్రచురించబడతాయి. (No articles published yet)
          </p>
        </div>
      `;
      return;
    }

    articlesGrid.innerHTML = articles.map(art => {
      const title = art.headline || art.title_te || art.title_en || 'వార్తా కథనం';
      const summary = art.summary || art.summary_te || art.summary_en || '';
      const rawImg = art.image_url || art.thumbnail_url || 'https://via.placeholder.com/400x240?text=Mameka+Mahodayam';
      const imgUrl = resolvePhotoUrl(rawImg);
      const pubDate = art.publication_date || (art.created_at ? art.created_at.split('T')[0] : '');

      const artUrl = art.slug ? `/article.html?slug=${encodeURIComponent(art.slug)}` : `/article.html?id=${encodeURIComponent(art.id)}`;
      return `
        <article class="article-card" style="display: flex; flex-direction: column; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease;">
          <a href="${artUrl}" style="display: block; text-decoration: none; color: inherit;">
            <div style="width: 100%; height: 200px; overflow: hidden; background: #f8fafc; position: relative;">
              <img 
                src="${escapeHtml(imgUrl)}" 
                alt="${escapeHtml(title)}" 
                style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;"
                loading="lazy"
                onerror="this.onerror=null; this.src='https://via.placeholder.com/400x240?text=News';"
              />
              <span style="position: absolute; top: 10px; left: 10px; background: #be185d; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 2px 10px; border-radius: 10px; text-transform: uppercase;">
                ${escapeHtml(art.category || 'వార్తలు')}
              </span>
            </div>
            <div style="padding: 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h3 style="font-family: Georgia, 'Times New Roman', serif; font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; line-height: 1.4;">
                  ${escapeHtml(title)}
                </h3>
                <p style="font-size: 0.88rem; color: #475569; margin: 0 0 12px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${escapeHtml(summary)}
                </p>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 10px; margin-top: 8px;">
                <span>📅 ${escapeHtml(pubDate)}</span>
                <span style="color: #be185d; font-weight: 700;">చదవండి →</span>
              </div>
            </div>
          </a>
        </article>
      `;
    }).join('');
  }

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', initReporterProfile);
})();
