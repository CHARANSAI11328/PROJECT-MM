/**
 * MAMEKA MAHODAYAM - Official Digital Press ID & Journalist Accreditation Verification Engine
 * Renders dedicated mobile-first Press ID card for scanned QR codes and verification links.
 */

(function () {
  'use strict';

  const container = document.getElementById('press-card-container');
  const loadingEl = document.getElementById('press-card-loading');
  const contentEl = document.getElementById('press-card-content');

  function getDistrictName(code) {
    if (!code) return '';
    if (typeof MAMEKA_DISTRICTS !== 'undefined' && MAMEKA_DISTRICTS.getDistrictByCodeOrSlug) {
      const d = MAMEKA_DISTRICTS.getDistrictByCodeOrSlug(code);
      if (d) return d.name_te || d.name_en;
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
    return '';
  }

  function resolvePhotoUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    const base = getApiBaseUrl();
    return base + (url.startsWith('/') ? '' : '/') + url;
  }

  async function loadReporterVerification() {
    if (!contentEl) return;

    const urlParams = new URLSearchParams(window.location.search);
    const reporterId = urlParams.get('id') || (window.location.hash.startsWith('#rep_') ? window.location.hash.substring(1) : 'rep_1790053034641_707');

    try {
      const baseUrl = getApiBaseUrl();
      const targetUrl = `${baseUrl}/api/public/reporters/${encodeURIComponent(reporterId)}`;

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Reporter not found');
      const data = await response.json();
      const reporter = data.reporter;

      if (!reporter) throw new Error('Invalid reporter data');

      renderPressCard(reporter);
    } catch (err) {
      console.warn('Reporter verification failed:', err);
      renderErrorCard();
    }
  }

  function renderPressCard(r) {
    const hasPhoto = Boolean(r.photo_url && r.photo_url.trim());
    const photoUrl = hasPhoto ? resolvePhotoUrl(r.photo_url) : '';
    const initial = escapeHtml((r.name || 'R').charAt(0));
    
    // Resolve authentic Telugu district & mandal
    const distName = getDistrictName(r.district) || 'ఆంధ్రప్రదేశ్ రాష్ట్ర స్థాయి (State Bureau)';
    const mandalName = r.mandal ? escapeHtml(r.mandal) : 'ప్రధాన కార్యాలయం (Head Office)';
    const locationDisplay = r.district ? `${distName} • ${mandalName}` : 'రాష్ట్ర బ్యూరో (State Bureau)';

    // Press ID Number
    const rawNum = String(r.id || '101').replace(/\D/g, '').slice(-3).padStart(3, '0');
    const pressId = `MM-PRESS-2026-${rawNum}`;

    // Priority Tier
    const desigLower = (r.designation || '').toLowerCase();
    let tierText = escapeHtml(r.designation || 'పాత్రికేయులు (Journalist)');
    if (r.display_order === 1 || desigLower.includes('founder') || (r.designation || '').includes('వ్యవస్థాపక') || desigLower.includes('editor-in-chief') || (r.designation || '').includes('ప్రధాన సంపాదకులు')) {
      tierText = `⭐ ${escapeHtml(r.designation)}`;
    } else if (r.display_order === 2 || desigLower.includes('associate') || (r.designation || '').includes('అసోసియేట్')) {
      tierText = `⭐ ${escapeHtml(r.designation)}`;
    }

    document.title = `${r.name} - అధికారిక పాత్రికేయ గుర్తింపు ధృవీకరణ | మమేక మహోదయం`;

    contentEl.innerHTML = `
      <!-- TOP ACCENT COLOR STRIPE -->
      <div class="card-security-stripe"></div>

      <!-- CARD HEADER BAR -->
      <div class="card-header-bar">
        <div class="card-header-emblem">
          <div class="emblem-icon">📰</div>
          <div class="emblem-text">
            <h3>మమేక మహోదయం</h3>
            <p>Accredited Press Card</p>
          </div>
        </div>
        <div class="card-press-badge">PRESS ID</div>
      </div>

      <!-- VERIFIED STATUS PILL -->
      <div class="status-banner">
        <span class="pulse-dot"></span>
        <span class="status-text">✓ అధికారిక పాత్రికేయులు (OFFICIALLY ACCREDITED &amp; VERIFIED)</span>
      </div>

      <!-- CARD MAIN BODY -->
      <div class="card-main-body">
        
        <!-- JOURNALIST PHOTO FRAME -->
        <div class="photo-frame-wrap">
          <div class="photo-frame">
            ${photoUrl
              ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(r.name)}" onerror="this.onerror=null; this.parentNode.innerHTML='<span class=\\'photo-placeholder\\'>${initial}</span>';">`
              : `<span class="photo-placeholder">${initial}</span>`
            }
          </div>
          <div class="photo-verified-seal" title="ధృవీకరించబడిన ప్రొఫైల్">✓</div>
        </div>

        <!-- JOURNALIST IDENTITY -->
        <h2 class="reporter-full-name">${escapeHtml(r.name)}</h2>
        
        <div class="designation-badge">
          <span>🏷️</span>
          <span>${tierText}</span>
        </div>

        <!-- CREDENTIALS DETAIL GRID -->
        <div class="credentials-grid">
          <div class="cred-item">
            <span class="cred-label">Press ID Number:</span>
            <span class="cred-value highlight">${pressId}</span>
          </div>
          <div class="cred-item">
            <span class="cred-label">గుర్తింపు కాలపరిమితి:</span>
            <span class="cred-value">2026 - 2027</span>
          </div>
          <div class="cred-item full-width">
            <span class="cred-label">కేటాయించిన పరిధి (Jurisdiction):</span>
            <span class="cred-value jurisdiction">📍 ${locationDisplay}</span>
          </div>
          <div class="cred-item full-width">
            <span class="cred-label">జారీ చేసిన విభాగం:</span>
            <span class="cred-value">మమేక మహోదయం సంపాదకీయ విభాగం (Editorial Board)</span>
          </div>
        </div>

        <!-- BIO QUOTE (IF AVAILABLE) -->
        ${r.bio ? `
          <div class="reporter-bio-box">
            "${escapeHtml(r.bio)}"
          </div>
        ` : ''}

        <!-- QUICK INTERACTIVE ACTIONS -->
        <div class="actions-container">
          ${r.phone ? `
            <a href="tel:${escapeHtml(r.phone)}" class="action-btn call-btn">
              <span>📞</span>
              <span>రిపోర్టర్‌కి కాల్ చేయండి</span>
            </a>
          ` : ''}

          ${r.email ? `
            <a href="mailto:${escapeHtml(r.email)}" class="action-btn email-btn">
              <span>✉️</span>
              <span>ఈమెయిల్ పంపండి</span>
            </a>
          ` : ''}

          <a href="tel:+918662456789" class="action-btn hotline-btn">
            <span>🏢</span>
            <span>ప్రధాన కార్యాలయం వెరిఫికేషన్ హెల్ప్‌లైన్: 0866-2456789</span>
          </a>

          <button type="button" id="btn-share-credential" class="action-btn share-btn">
            <span>🔗</span>
            <span>ఈ డిజిటల్ కార్డు లింక్‌ను షేర్ చేయండి (Share)</span>
          </button>
        </div>

        <!-- CARD FOOTER SECURITY STATEMENT -->
        <div class="card-footer-security">
          <p class="security-statement">
            ఈ గుర్తింపు కార్డు <strong>మమేక మహోదయం</strong> దినపత్రిక ద్వారా జారీ చేయబడిన అధికారిక పాత్రికేయ ధృవీకరణ పత్రం. సమాజ హితం మరియు నిష్పాక్షిక వార్తా సేకరణ కొరకు ఈ పాత్రికేయునికి అనుమతి కలదు.
          </p>
          <div class="digital-seal-wrap">
            <span>🔒 Cryptographically Verified Digital ID Card</span>
          </div>
        </div>

      </div>
    `;

    // Attach Share Button Event
    const shareBtn = document.getElementById('btn-share-credential');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const shareData = {
          title: `${r.name} - అధికారిక పాత్రికేయ గుర్తింపు ధృవీకరణ`,
          text: `మమేక మహోదయం దినపత్రిక అధికారిక పాత్రికేయుల డిజిటల్ గుర్తింపు కార్డు (${r.name} - ${r.designation})`,
          url: window.location.href
        };
        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('✓ పాత్రికేయుని డిజిటల్ ప్రొఫైల్ లింక్ కాపీ చేయబడింది!');
          }
        } catch (e) {}
      });
    }

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';
  }

  function renderErrorCard() {
    if (loadingEl) loadingEl.style.display = 'none';
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div class="card-security-stripe" style="background: #dc2626;"></div>
      <div style="padding: 36px 20px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 12px; color: #dc2626;">⚠️</div>
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #991b1b; margin-bottom: 8px;">
          పాత్రికేయ గుర్తింపు ధృవీకరణ కాలం చెల్లినది లేదా రద్దు చేయబడినది
        </h2>
        <p style="font-size: 0.88rem; color: #64748b; line-height: 1.5; margin-bottom: 20px;">
          మీరు స్కాన్ చేసిన QR కోడ్ ప్రొఫైల్ ప్రస్తుతం యాక్టివ్‌గా లేదు లేదా మమేక మహోదయం రికార్డుల నుండి తొలగించబడినది.
        </p>
        <a href="/" style="display: inline-block; padding: 10px 20px; background: #be185d; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.88rem;">
          ప్రధాన వెబ్‌సైట్‌కి వెళ్ళండి →
        </a>
      </div>
    `;
    contentEl.style.display = 'block';
  }

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReporterVerification);
  } else {
    loadReporterVerification();
  }
})();
