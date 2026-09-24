/**
 * MAMEKA MAHODAYAM - Dynamic Reporters & Editorial Team Directory Engine
 * 100% Data-Driven: Loads real-time reporter profiles from SQLite backend APIs.
 * Features: Horizontal rectangle founder showcase (left image frame, right typewriter name & elevated fade details),
 * no duplicate founder card in bottom team grid, and responsive square reporter cards.
 */

(function () {
  'use strict';

  let allReporters = [];
  let currentFilters = {
    search: '',
    district: '',
    designation: ''
  };

  // Dynamic DOM getters
  function getGridContainer() { return document.getElementById('reporters-grid'); }
  function getModal() { return document.getElementById('reporter-modal'); }
  function getModalBackdrop() { return document.getElementById('reporter-modal-backdrop'); }
  function getModalCloseBtn() { return document.getElementById('reporter-modal-close'); }

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

  async function loadReporters() {
    const gridContainer = getGridContainer();
    if (!gridContainer) return;

    gridContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px;">
        <div style="font-size: 2rem; margin-bottom: 12px; animation: pulse 1.5s infinite;">👥</div>
        <p style="color: #64748b; font-size: 1rem; font-weight: 500;">
          రిపోర్టర్ల వివరాలు లోడ్ అవుతున్నాయి... (Loading Editorial Team...)
        </p>
      </div>
    `;

    try {
      const baseUrl = getApiBaseUrl();
      const targetUrl = `${baseUrl}/api/public/reporters`;

      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      allReporters = data.reporters || [];

      renderReporterCards(allReporters);

      // Check if deep link ?id=... or hash is present
      const urlParams = new URLSearchParams(window.location.search);
      const repId = urlParams.get('id') || (window.location.hash.startsWith('#rep_') ? window.location.hash.substring(1) : null);
      if (repId) {
        openReporterModal(repId);
      }
    } catch (err) {
      console.warn('Failed to load reporters from primary API:', err);
      allReporters = [];
      renderReporterCards([]);
    }
  }

  function animateTypewriterAndFadeIn(nameEl, fadeEl, nameText, speed = 55) {
    if (!nameEl) return;
    nameEl.innerHTML = '';
    let idx = 0;

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.style.backgroundColor = '#be185d';
    cursor.style.width = '8px';
    cursor.style.height = '1.1em';
    cursor.style.display = 'inline-block';
    cursor.style.marginLeft = '4px';
    cursor.style.verticalAlign = 'middle';
    cursor.style.borderRadius = '2px';
    nameEl.appendChild(cursor);

    function typeNextChar() {
      if (idx < nameText.length) {
        const char = nameText.charAt(idx);
        const textNode = document.createTextNode(char);
        nameEl.insertBefore(textNode, cursor);
        idx++;
        setTimeout(typeNextChar, speed);
      } else {
        setTimeout(() => {
          cursor.remove();
          if (fadeEl) {
            fadeEl.style.opacity = '1';
            fadeEl.style.transform = 'translateY(0)';
            fadeEl.classList.add('visible');
          }
        }, 150);
      }
    }

    setTimeout(typeNextChar, 100);
  }

  function renderReporterCards(reporters) {
    const gridContainer = getGridContainer();
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    if (!reporters || reporters.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: #64748b;">
          <p style="font-size: 1.05rem; font-weight: 500;">ప్రస్తుతం ఎలాంటి రిపోర్టర్ ప్రొఫైల్స్ అందుబాటులో లేవు.</p>
        </div>
      `;
      return;
    }

    // 1. Separate Founder & Chief Editor for Horizontal Rectangle Showcase
    const founder = reporters.find(r => 
      r.id === 'rep_1' || 
      (r.designation || '').includes('వ్యవస్థాపక') || 
      (r.designation || '').toLowerCase().includes('founder') ||
      (r.designation || '').toLowerCase().includes('editor-in-chief') ||
      (r.designation || '').includes('ప్రధాన సంపాదకులు')
    );

    // Main wrapper inside gridContainer
    const mainWrap = document.createElement('div');
    mainWrap.style.gridColumn = '1 / -1';
    mainWrap.className = 'editorial-hierarchy-container';

    // 2. Render Founder Showcase Card (Horizontal Rectangle: Left Image Frame, Right Typewriter Name + Fade Details)
    if (founder) {
      const founderCard = document.createElement('section');
      founderCard.className = 'founder-hero-horizontal';
      founderCard.style.cssText = `
        background: linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%);
        border: 1px solid #e2e8f0;
        border-left: 6px solid #be185d;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 32px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 24px;
        width: 100%;
        box-sizing: border-box;
      `;

      const distName = getDistrictName(founder.district);
      const locationText = [distName, founder.mandal].filter(Boolean).join(', ');
      const hasFounderPhoto = Boolean(founder.photo_url && founder.photo_url.trim());
      const rawPhoto = hasFounderPhoto
        ? founder.photo_url
        : (founder.name && founder.name.includes('శ్రీనివాస') ? '/uploads/reporters/vaka srinivasrao.jpeg' : '');
      const photoSrc = rawPhoto ? resolvePhotoUrl(rawPhoto) : '';
      const founderInitial = escapeHtml((founder.name || 'F').charAt(0));

      founderCard.innerHTML = `
        <!-- LEFT SIDE IMAGE FRAME (FULL IMAGE) -->
        <div class="founder-left-image-frame" style="width: 200px; height: 240px; flex-shrink: 0; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 16px rgba(0,0,0,0.08); border: 2px solid #ffffff; outline: 1px solid #cbd5e1; background: #ffffff; display: flex; align-items: center; justify-content: center;">
          ${photoSrc
            ? `<img src="${escapeHtml(photoSrc)}" alt="${escapeHtml(founder.name)}" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fdf2f8;color:#be185d;font-size:3rem;font-weight:800;\\'>${founderInitial}</div>';">`
            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fdf2f8; color: #be185d; font-size: 3rem; font-weight: 800;">${founderInitial}</div>`}
        </div>

        <!-- RIGHT SIDE CONTENT (TYPEWRITER NAME TOP + ELEVATED FADE-IN DETAILS BELOW) -->
        <div class="founder-right-content" style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; text-align: left;">
          
          <!-- TYPEWRITER NAME -->
          <div class="founder-typewriter-wrap" style="min-height: 40px; display: flex; align-items: center; margin-bottom: 6px;">
            <h1 class="founder-typewriter-title" id="founder-typewriter-target" style="font-size: clamp(1.5rem, 3.2vw, 2.1rem); font-weight: 800; color: #0f172a; margin: 0; font-family: Georgia, 'Times New Roman', serif; line-height: 1.2;"></h1>
          </div>

          <!-- ELEVATED FADE-IN DETAILS -->
          <div class="founder-fade-details" id="founder-fade-target" style="opacity: 0; transform: translateY(16px); transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
              <span class="founder-badge-tag" style="display: inline-flex; align-items: center; gap: 4px; background: #fff1f2; color: #be185d; border: 1px solid #fecdd3; font-size: 0.8rem; font-weight: 700; padding: 3px 12px; border-radius: 16px; text-transform: uppercase;">
                ⭐ FOUNDER &amp; EDITOR-IN-CHIEF / వ్యవస్థాపక ప్రధాన సంపాదకులు
              </span>
              ${locationText ? `
                <span style="font-size: 0.85rem; color: #475569; font-weight: 600;">📍 ${escapeHtml(locationText)}</span>
              ` : ''}
            </div>

            <div class="founder-bio-quote-box" style="background: #faf8f5; border-left: 3px solid #be185d; border-radius: 0 6px 6px 0; padding: 12px 16px; margin-bottom: 14px; color: #334155; font-size: 0.95rem; line-height: 1.6; font-family: Georgia, 'Times New Roman', serif; box-shadow: 0 1px 4px rgba(0,0,0,0.02);">
              "${escapeHtml(founder.bio || 'సత్యమే ఆధారం... ప్రజాహితమే మా ధ్యేయం! మమేక మహోదయం దినపత్రిక ద్వారా సమాజంలో మంచి మార్పు కోసం నిరంతరం ప్రజా సమస్యలను వెలికితీస్తూ, స్వతంత్ర, నిష్పాక్షికమైన జర్నలిజానికి కట్టుబడి ఉన్నాం.')}"
            </div>

            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <button type="button" id="btn-view-founder-modal" style="padding: 8px 18px; background: #be185d; color: #ffffff; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; box-shadow: 0 2px 8px rgba(190, 24, 93, 0.2); transition: transform 0.2s, background 0.2s;">
                పూర్తి ప్రొఫైల్ వివరాలు (Full Profile) →
              </button>
              ${founder.phone ? `<span style="padding: 6px 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; font-size: 0.825rem; font-weight: 600; color: #334155;">📞 ${escapeHtml(founder.phone)}</span>` : ''}
              ${founder.email ? `<span style="padding: 6px 14px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; font-size: 0.825rem; font-weight: 600; color: #334155;">✉️ ${escapeHtml(founder.email)}</span>` : ''}
            </div>
          </div>

        </div>
      `;

      mainWrap.appendChild(founderCard);

      // Trigger Typewriter animation then Elevated Fade-in
      setTimeout(() => {
        const nameEl = founderCard.querySelector('#founder-typewriter-target');
        const fadeEl = founderCard.querySelector('#founder-fade-target');
        const founderNameText = founder.name || 'వాకా శ్రీనివాసరావు';
        
        animateTypewriterAndFadeIn(nameEl, fadeEl, founderNameText, 55);
      }, 80);

      const founderBtn = founderCard.querySelector('#btn-view-founder-modal');
      if (founderBtn) {
        founderBtn.addEventListener('click', () => {
          openReporterModal(founder.id);
        });
      }
    }

    // 3. Render ALL REMAINING team members (excluding founder to eliminate duplicate card!)
    const remainingReporters = reporters.filter(r => r.id !== (founder ? founder.id : null));
    if (remainingReporters.length > 0) {
      const section = document.createElement('div');
      section.className = 'editorial-hierarchy-section';
      section.style.marginTop = '24px';

      section.innerHTML = `
        <div class="editorial-section-title-wrap" style="margin-bottom: 16px; border-bottom: 2px solid #be185d; padding-bottom: 8px;">
          <span class="editorial-section-badge" style="font-size: 0.75rem; font-weight: 800; color: #be185d; text-transform: uppercase;">EDITORIAL TEAM</span>
          <h3 class="editorial-section-title" style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 4px 0 0 0;">మా రిపోర్టర్లు &amp; సంపాదకీయ బృందం (Reporters &amp; Editorial Team)</h3>
        </div>
        <div class="reporters-grid-sub" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-top: 16px;"></div>
      `;

      const subGrid = section.querySelector('.reporters-grid-sub');

      remainingReporters.forEach(r => {
        const card = createStandardReporterCard(r);
        subGrid.appendChild(card);
      });

      mainWrap.appendChild(section);
    }

    gridContainer.appendChild(mainWrap);
  }

  function createStandardReporterCard(r) {
    const card = document.createElement('article');
    card.className = 'reporter-directory-card';
    card.setAttribute('data-id', r.id);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${r.name} - ${r.designation}`);

    const distName = getDistrictName(r.district);
    const locationText = [distName, r.mandal].filter(Boolean).join(' | ');

    let photoHtml = '';
    if (r.photo_url) {
      const src = resolvePhotoUrl(r.photo_url);
      const fallbackInitial = escapeHtml((r.name || 'R').charAt(0));
      photoHtml = `<img src="${escapeHtml(src)}" alt="${escapeHtml(r.name)}" class="reporter-card-photo" loading="lazy" onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'reporter-card-fallback-avatar\\'>${fallbackInitial}</div>';">`;
    } else {
      const initial = (r.name || 'R').charAt(0);
      photoHtml = `<div class="reporter-card-fallback-avatar">${escapeHtml(initial)}</div>`;
    }

    let bioExcerpt = r.bio || '';
    if (bioExcerpt.length > 110) {
      bioExcerpt = bioExcerpt.substring(0, 110) + '...';
    }

    card.innerHTML = `
      <div class="reporter-card-media-wrap">
        ${photoHtml}
      </div>
      <div class="reporter-card-content">
        <span class="reporter-badge-designation">${escapeHtml(r.designation)}</span>
        <h3 class="reporter-card-name">${escapeHtml(r.name)}</h3>
        ${locationText ? `
          <div class="reporter-card-location">
            <span class="reporter-location-icon" aria-hidden="true">📍</span>
            <span>${escapeHtml(locationText)}</span>
          </div>
        ` : ''}
        ${bioExcerpt ? `<p class="reporter-card-bio">${escapeHtml(bioExcerpt)}</p>` : ''}
        <div class="reporter-card-footer">
          <span class="reporter-view-profile-btn">
            వివరాలు చూడండి (Profile) <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      openReporterModal(r.id);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openReporterModal(r.id);
      }
    });

    return card;
  }

  function openReporterModal(reporterId) {
    window.location.href = `/reporter-profile.html?id=${encodeURIComponent(reporterId)}`;
  }

  function closeReporterModal() {
    const modal = getModal();
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Expose global controller
  window.MM_Reporters = {
    init: function () {
      loadReporters();
    },
    reload: function () {
      loadReporters();
    },
    openModal: openReporterModal,
    closeModal: closeReporterModal
  };

  // Auto initialize on DOMContentLoaded or immediate if already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.MM_Reporters.init);
  } else {
    window.MM_Reporters.init();
  }
})();
