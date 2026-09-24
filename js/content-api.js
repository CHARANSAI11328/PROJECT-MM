/**
 * MAMEKA MAHODAYAM - Dynamic Content API & Public Rendering Engine
 * Production Ready: 100% Data-Driven with Clean Empty States & Zero Unsplash/Fake Content.
 */
(function () {
  'use strict';

  const CATEGORY_LABELS = {
    te: {
      state: 'ఆంధ్రప్రదేశ్',
      district: 'జిల్లా వార్తలు',
      politics: 'రాజకీయాలు',
      national: 'దేశం & ప్రపంచం',
      international: 'అంతర్జాతీయ వార్తలు',
      sports: 'క్రీడలు',
      cinema: 'సినిమా / వినోదం',
      education: 'విద్య & ఉద్యోగాలు',
      editorial: 'సంపాదకీయం',
      business: 'వాణిజ్యం'
    },
    en: {
      state: 'Andhra Pradesh',
      district: 'Districts',
      politics: 'Politics',
      national: 'India & World',
      international: 'World News',
      sports: 'Sports',
      cinema: 'Entertainment',
      education: 'Education & Careers',
      editorial: 'Editorial',
      business: 'Business'
    }
  };

  function getCategoryLabel(cat) {
    if (!cat) return window.MM_i18n ? window.MM_i18n.getText('nav_home') : 'వార్తలు';
    const lang = (window.MM_i18n ? window.MM_i18n.getLanguage() : 'te');
    const key = String(cat).toLowerCase().trim();
    return (CATEGORY_LABELS[lang] && CATEGORY_LABELS[lang][key]) || (CATEGORY_LABELS.te[key]) || cat;
  }

  function escapeText(val) {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const lang = window.MM_i18n ? window.MM_i18n.getLanguage() : 'te';
      const locale = lang === 'en' ? 'en-US' : 'te-IN';
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  function getArticleUrl(article) {
    if (!article) return 'article.html';
    const param = article.slug ? `slug=${encodeURIComponent(article.slug)}` : `id=${encodeURIComponent(article.id)}`;
    return `article.html?${param}`;
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

  async function fetchArticles(params = {}) {
    try {
      const query = new URLSearchParams();
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
          query.append(k, params[k]);
        }
      });
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/public/articles?${query.toString()}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.articles || [];
    } catch (err) {
      console.warn('API Fetch Notice:', err.message);
      return [];
    }
  }

  function renderSubtleEmptyState(container, defaultKey = 'empty_latest_news', customMsg = '') {
    if (!container) return;
    const msg = customMsg || (window.MM_i18n ? window.MM_i18n.getText(defaultKey) : 'ప్రస్తుతం వార్తలు అందుబాటులో లేవు.');
    container.innerHTML = `
      <div class="empty-state-editorial" style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 36px 20px; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; margin: 16px 0;">
        <div style="font-size: 1.8rem; margin-bottom: 8px; color: #94a3b8;">📰</div>
        <div style="font-size: 0.95rem; color: #64748b; font-style: italic; font-weight: 500;">${msg}</div>
      </div>
    `;
  }

  function createStandardCard(article) {
    const card = document.createElement('article');
    card.className = 'card-standard flex flex-col justify-between h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden';

    const categoryLabel = getCategoryLabel(article.category);
    const categoryCode = article.category || 'state';
    const date = article.publication_date ? formatDate(article.publication_date) : '';

    let districtCode = article.district ? escapeText(article.district) : '';
    let distName = districtCode;
    if (districtCode && typeof MAMEKA_DISTRICTS !== 'undefined') {
      const dInfo = MAMEKA_DISTRICTS.getDistrictByCodeOrSlug(districtCode);
      if (dInfo) distName = (window.MM_i18n && window.MM_i18n.getLanguage() === 'en') ? dInfo.name_en : dInfo.name_te;
    }

    const articleUrl = getArticleUrl(article);
    const categoryUrl = `category.html?c=${encodeURIComponent(categoryCode)}`;
    const displayImg = article.thumbnail_url || article.image_url;

    let mediaHtml = '';
    const imagesList = Array.isArray(article.images) && article.images.length > 0 ? article.images : (Array.isArray(article.image_urls) ? article.image_urls : []);
    const photoCount = imagesList.length > 0 ? imagesList.length : (displayImg ? 1 : 0);
    const photoBadge = photoCount > 1 ? `<span class="multi-photo-badge" style="position: absolute; bottom: 8px; right: 8px; background: rgba(15,23,42,0.85); color: #ffffff; font-size: 0.725rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; backdrop-filter: blur(4px); z-index: 10; display: flex; align-items: center; gap: 4px;">📷 ${photoCount} ఫొటోలు</span>` : '';

    if (displayImg && displayImg.trim()) {
      mediaHtml = `
        <div class="media-placeholder block w-full relative overflow-hidden bg-slate-100" style="aspect-ratio: 16/9;">
          <a href="${categoryUrl}" class="absolute top-3 left-3 bg-red-600 hover:bg-red-700 text-white text-xs px-2.5 py-1 rounded-md font-semibold z-10 shadow-sm" style="text-decoration: none;">${categoryLabel}</a>
          ${photoBadge}
          <a href="${articleUrl}" class="block w-full h-full">
            <img src="${displayImg}" alt="${escapeText(article.headline)}" loading="lazy" decoding="async" class="w-full h-full object-cover object-center" onerror="this.parentElement.parentElement.style.display='none';" />
          </a>
        </div>
      `;
    }

    const readMoreText = window.MM_i18n ? window.MM_i18n.getText('read_more', 'ఇంకా చదవండి →') : 'ఇంకా చదవండి →';

    card.innerHTML = `
      ${mediaHtml}
      <div class="card-body flex-1 p-4 flex flex-col justify-between">
        <div>
          ${!displayImg ? `<a href="${categoryUrl}" class="inline-block text-xs font-bold text-red-600 uppercase tracking-wide mb-1" style="text-decoration:none;">${categoryLabel}</a>` : ''}
          <h3 class="card-title font-bold text-gray-900 leading-snug line-clamp-2 hover:text-red-600 transition-colors" style="font-size: 1.1rem; margin-bottom: 8px;">
            <a href="${articleUrl}" style="color: inherit; text-decoration: none;">${escapeText(article.headline)}</a>
          </h3>
        </div>
        <div class="card-footer-meta flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-3">
          <span class="card-author font-medium text-gray-700">${escapeText(article.source_newspaper || article.author_name || 'మమేక మహోదయం')}</span>
          ${date ? `<span class="card-date">${date}</span>` : ''}
        </div>
      </div>
    `;

    return card;
  }

  function createHorizontalCard(article) {
    const card = document.createElement('article');
    card.className = 'card-horizontal bg-white rounded-lg border border-gray-200 p-3 flex gap-3 items-start overflow-hidden shadow-sm';

    const categoryLabel = getCategoryLabel(article.category);
    const articleUrl = getArticleUrl(article);
    const displayImg = article.thumbnail_url || article.image_url;

    card.innerHTML = `
      ${displayImg ? `
        <a href="${articleUrl}" class="media-placeholder block relative overflow-hidden rounded-md bg-slate-100 flex-shrink-0" style="width: 100px; height: 75px; aspect-ratio: 4/3;">
          <img src="${displayImg}" alt="${escapeText(article.headline)}" loading="lazy" decoding="async" class="w-full h-full object-cover object-center" onerror="this.parentElement.style.display='none';" />
        </a>
      ` : ''}
      <div class="flex-1">
        <span class="card-category text-xs font-semibold text-red-600 uppercase tracking-wide">${categoryLabel}</span>
        <h3 class="card-title font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-red-600 transition-colors mt-1">
          <a href="${articleUrl}" style="color: inherit; text-decoration: none;">${escapeText(article.headline)}</a>
        </h3>
      </div>
    `;

    return card;
  }

  function renderHeroSection(container, heroArticles) {
    if (!container || !heroArticles.length) return false;

    const lead = heroArticles[0];
    const stack = heroArticles.slice(1, 4);

    const leadUrl = getArticleUrl(lead);
    const leadImg = lead.image_url || lead.thumbnail_url;
    let leadMedia = '';
    if (leadImg && leadImg.trim()) {
      leadMedia = `
        <a href="${leadUrl}" class="media-placeholder block w-full relative overflow-hidden rounded-lg bg-slate-100" style="aspect-ratio: 16/9; max-height: 400px;">
          <img src="${leadImg}" alt="${escapeText(lead.headline)}" loading="eager" decoding="async" class="w-full h-full object-cover object-center rounded-lg" onerror="this.parentElement.style.display='none';" />
        </a>
      `;
    }

    const leadDate = lead.publication_date ? formatDate(lead.publication_date) : '';
    const topStoriesTitle = window.MM_i18n ? window.MM_i18n.getText('top_stories', 'ముఖ్యాంశాలు') : 'ముఖ్యాంశాలు';

    let stackHtml = '';
    if (stack.length > 0) {
      stackHtml = `
        <div class="hero-secondary-stack flex flex-col gap-3">
          <div class="section-header-editorial mb-2">
            <div class="section-header-left flex items-center gap-2">
              <span class="section-accent-tag"></span>
              <h3 class="tp-h3 font-bold text-gray-900">${topStoriesTitle}</h3>
            </div>
          </div>
          ${stack.map(art => {
            const artUrl = getArticleUrl(art);
            const artImg = art.thumbnail_url || art.image_url;
            return `
              <article class="card-horizontal bg-white rounded-lg border border-gray-200 p-3 flex gap-3 items-start overflow-hidden shadow-sm">
                ${artImg ? `
                  <a href="${artUrl}" class="media-placeholder block relative overflow-hidden rounded-md bg-slate-100 flex-shrink-0" style="width: 110px; height: 80px; aspect-ratio: 4/3;">
                    <img src="${artImg}" alt="${escapeText(art.headline)}" loading="lazy" decoding="async" class="w-full h-full object-cover object-center" onerror="this.parentElement.style.display='none';" />
                  </a>
                ` : ''}
                <div class="flex-1">
                  <span class="card-category text-xs font-semibold text-red-600 uppercase tracking-wide">${getCategoryLabel(art.category)}</span>
                  <h3 class="card-title font-bold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-red-600 transition-colors mt-1">
                    <a href="${artUrl}" style="color: inherit; text-decoration: none;">${escapeText(art.headline)}</a>
                  </h3>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <article class="card-featured bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-3 shadow-sm">
        <div class="card-header-meta flex items-center gap-2">
          <span class="card-category text-xs font-bold text-red-600 uppercase">${getCategoryLabel(lead.category)}</span>
        </div>
        <h2 class="card-title font-serif font-bold text-gray-900 leading-snug line-clamp-2 hover:text-red-600 transition-colors" style="font-size: clamp(1.5rem, 2.2vw, 2.1rem);">
          <a href="${getArticleUrl(lead)}" style="color: inherit; text-decoration: none;">${escapeText(lead.headline)}</a>
        </h2>
        <div class="card-header-meta flex items-center gap-2 text-xs text-gray-500">
          <span class="card-author font-medium text-gray-700">${escapeText(lead.source_newspaper || lead.author_name || 'మమేక మహోదయం')}</span>
          ${leadDate ? `<span class="tp-meta">•</span><span class="tp-meta">${leadDate}</span>` : ''}
        </div>
        ${leadMedia}
      </article>
      ${stackHtml}
    `;

    return true;
  }

  async function renderHome() {
    // 1. Set Today Date in Header
    const headerDateElem = document.getElementById('header-date');
    if (headerDateElem) {
      headerDateElem.textContent = formatDate(new Date());
    }

    // 2. Fetch Breaking News
    const breakingBar = document.getElementById('section-breaking');
    const breakingItems = document.getElementById('breaking-news-items');
    const breakingArticles = await fetchArticles({ breaking: 'true', limit: 5 });

    if (breakingArticles.length > 0 && breakingBar && breakingItems) {
      breakingBar.style.display = 'block';
      breakingItems.innerHTML = breakingArticles.map(art => `
        <div class="breaking-news-item">
          <a href="${getArticleUrl(art)}" style="color: inherit; text-decoration: none;">${escapeText(art.headline)}</a>
        </div>
      `).join(' | ');
    } else if (breakingBar) {
      breakingBar.style.display = 'none';
    }

    // 3. Fetch Featured Hero Articles
    const heroSection = document.getElementById('section-hero');
    const heroDivider = document.getElementById('divider-hero');
    const heroGrid = document.getElementById('hero-layout-grid');
    const heroArticles = await fetchArticles({ homepage: '1', featured: '1', limit: 4 });

    if (heroArticles.length > 0 && heroSection && heroGrid) {
      const rendered = renderHeroSection(heroGrid, heroArticles);
      if (rendered) {
        heroSection.style.display = 'block';
        if (heroDivider) heroDivider.style.display = 'block';
      }
    } else {
      if (heroSection) heroSection.style.display = 'none';
      if (heroDivider) heroDivider.style.display = 'none';
    }

    // 4. Fetch Latest News
    const latestGrid = document.getElementById('latest-news-grid');
    const latestArticles = await fetchArticles({ homepage: '1', limit: 8 });
    if (latestGrid) {
      if (latestArticles.length) {
        latestGrid.replaceChildren(...latestArticles.map(art => createStandardCard(art)));
      } else {
        renderSubtleEmptyState(latestGrid, 'empty_latest_news');
      }
    }

    // 5. Fetch State News
    const stateGrid = document.getElementById('state-news-grid');
    const stateArticles = await fetchArticles({ homepage: '1', category: 'state', limit: 4 });
    if (stateGrid) {
      if (stateArticles.length) {
        stateGrid.replaceChildren(...stateArticles.map(art => createStandardCard(art)));
      } else {
        renderSubtleEmptyState(stateGrid, 'empty_category');
      }
    }

    // 6. Fetch District News with Interactive Selector
    const districtGrid = document.getElementById('district-news-grid');
    async function loadDistrictNews(districtCode = 'all') {
      if (!districtGrid) return;
      const params = { homepage: '1', limit: 6 };
      if (districtCode && districtCode !== 'all') {
        params.district = districtCode;
      } else {
        params.category = 'district';
      }
      const distArticles = await fetchArticles(params);
      if (distArticles.length) {
        districtGrid.replaceChildren(...distArticles.map(art => createStandardCard(art)));
      } else {
        renderSubtleEmptyState(districtGrid, 'empty_district');
      }
    }
    loadDistrictNews('all');

    // Attach listeners for district dropdown
    const distDropdown = document.querySelector('.district-select-dropdown');
    if (distDropdown) {
      distDropdown.addEventListener('change', (e) => {
        loadDistrictNews(e.target.value);
      });
    }

    // 7. Fetch & Render Reporters Showcase on Homepage
    renderHomepageReporters();
  }

  async function renderHomepageReporters() {
    const grid = document.getElementById('homepage-reporters-grid');
    const section = document.getElementById('section-homepage-reporters');
    if (!grid) return;

    try {
      const baseUrl = getApiBaseUrl();
      const targetUrl = `${baseUrl}/api/public/reporters`;

      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error('Failed to fetch reporters');
      const data = await res.json();
      const reporters = data.reporters || [];

      if (!reporters || reporters.length === 0) {
        if (section) section.style.display = 'none';
        return;
      }

      if (section) section.style.display = 'block';
      grid.innerHTML = reporters.slice(0, 8).map(r => {
        const hasPhoto = Boolean(r.photo_url && r.photo_url.trim());
        const photoUrl = hasPhoto ? resolvePhotoUrl(r.photo_url) : '';
        const initialLetter = escapeText((r.name || 'R').trim().charAt(0).toUpperCase());
        const profileUrl = `reporter-profile.html?id=${encodeURIComponent(r.id)}`;
        const locationText = [r.district, r.mandal].filter(Boolean).join(' | ');

        const photoHtml = hasPhoto
          ? `<img src="${escapeText(photoUrl)}" alt="${escapeText(r.name || 'Reporter')}" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid #be185d; flex-shrink: 0;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\'width:56px;height:56px;border-radius:50%;background:#be185d;color:#ffffff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem;flex-shrink:0;\\'>${initialLetter}</div>';" />`
          : `<div style="width: 56px; height: 56px; border-radius: 50%; background: #be185d; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.3rem; flex-shrink: 0; box-shadow: 0 2px 6px rgba(190,24,93,0.2);">${initialLetter}</div>`;

        return `
          <div class="homepage-reporter-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.04);" onclick="window.location.href='${profileUrl}'">
            ${photoHtml}
            <div style="min-width: 0; flex: 1;">
              <span style="display: inline-block; font-size: 0.72rem; font-weight: 700; color: #be185d; background: #fff1f2; border: 1px solid #fecdd3; padding: 2px 8px; border-radius: 12px; margin-bottom: 4px; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeText(r.designation || 'జర్నలిస్ట్')}</span>
              <strong style="display: block; font-size: 0.95rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeText(r.name)}</strong>
              ${locationText ? `<span style="font-size: 0.78rem; color: #64748b; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">📍 ${escapeText(locationText)}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.warn('Homepage reporters fetch error:', err);
      if (section) section.style.display = 'none';
    }
  }

  function openImageLightbox(src, captionText = '') {
    let modal = document.getElementById('image-lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'image-lightbox-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.92); z-index: 999999; display: flex;
        flex-direction: column; align-items: center; justify-content: center;
        padding: 20px; opacity: 0; transition: opacity 0.25s ease;
        backdrop-filter: blur(8px);
      `;
      modal.innerHTML = `
        <button type="button" id="lightbox-close-btn" style="position: absolute; top: 20px; right: 24px; background: rgba(255,255,255,0.2); border: none; color: #fff; font-size: 2rem; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">✕</button>
        <div style="max-width: 90vw; max-height: 80vh; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <img id="lightbox-img" src="" alt="Full Screen Preview" style="max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 6px;" />
        </div>
        <div id="lightbox-caption" style="margin-top: 14px; color: #e2e8f0; font-size: 0.95rem; text-align: center; max-width: 700px; font-style: italic;"></div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('#lightbox-close-btn');
      closeBtn.onclick = () => closeLightbox();
      modal.onclick = (e) => {
        if (e.target === modal || e.target.id === 'lightbox-close-btn') closeLightbox();
      };
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
      });
    }

    const imgEl = modal.querySelector('#lightbox-img');
    const captionEl = modal.querySelector('#lightbox-caption');
    imgEl.src = src;
    captionEl.textContent = captionText || '';

    modal.style.display = 'flex';
    setTimeout(() => { modal.style.opacity = '1'; }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const modal = document.getElementById('image-lightbox-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 250);
    }
  }

  function makeImagesClickable(container = document.body) {
    if (!container) return;
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.dataset.lightboxAttached) {
        img.dataset.lightboxAttached = 'true';
        img.style.cursor = 'zoom-in';
        img.title = '🔍 క్లిక్ చేసి పెద్దదిగా చూడండి (Click to view full image)';
        img.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const caption = img.alt || img.title || '';
          openImageLightbox(img.src, caption !== '🔍 క్లిక్ చేసి పెద్దదిగా చూడండి (Click to view full image)' ? caption : '');
        });
      }
    });
  }

  async function renderArticlePage() {
    const urlParams = new URLSearchParams(window.location.search);
    let identifier = urlParams.get('slug') || urlParams.get('id');

    if (!identifier && window.location.pathname.includes('/news/')) {
      const parts = window.location.pathname.split('/news/');
      if (parts[1]) {
        identifier = decodeURIComponent(parts[1].split('/')[0].split('?')[0]);
      }
    }

    const loadingState = document.getElementById('article-loading-state');
    const notFoundState = document.getElementById('article-not-found-state');
    const articleContainer = document.getElementById('article-container');

    const breadcrumbCategory = document.getElementById('breadcrumb-category') || document.getElementById('article-breadcrumb-category');
    const breadcrumbDistrictWrap = document.getElementById('breadcrumb-district-wrap');
    const breadcrumbDistrict = document.getElementById('breadcrumb-district');
    const breadcrumbTitle = document.getElementById('breadcrumb-title');

    const categoryBadge = document.getElementById('article-category-badge');
    const districtBadge = document.getElementById('article-district-badge');

    const headlineElem = document.getElementById('article-headline');
    const subheadlineElem = document.getElementById('article-deck') || document.getElementById('article-subheadline');
    const authorElem = document.getElementById('article-author');
    const publishedDateElem = document.getElementById('article-date') || document.getElementById('article-published-date');
    const mainImgElem = document.getElementById('article-main-img');
    const figureElem = document.getElementById('article-figure');
    const captionElem = document.getElementById('article-img-caption');
    const mediaContainer = document.getElementById('article-media-container');
    const bodyContainer = document.getElementById('article-body') || document.getElementById('article-body-container');
    const relatedGrid = document.getElementById('related-news-grid') || document.getElementById('related-articles-grid');
    const relatedSection = document.getElementById('section-related-news');

    if (!identifier) {
      if (loadingState) loadingState.style.display = 'none';
      if (notFoundState) notFoundState.style.display = 'block';
      if (articleContainer) articleContainer.style.display = 'none';
      return;
    }

    try {
      const res = await fetch(`/api/public/articles/${encodeURIComponent(identifier)}`);
      if (!res.ok) throw new Error('Article not found');
      const data = await res.json();
      const article = data.article;

      if (!article) throw new Error('Article payload empty');

      if (loadingState) loadingState.style.display = 'none';
      if (notFoundState) notFoundState.style.display = 'none';
      if (articleContainer) articleContainer.style.display = 'block';

      // Update document title with original article headline
      document.title = `${article.headline} — ${window.MM_i18n ? window.MM_i18n.getText('brand_name_en') : 'మమేక మహోదయం'}`;

      if (breadcrumbCategory) {
        breadcrumbCategory.innerHTML = `<a href="category.html?c=${encodeURIComponent(article.category || 'state')}" style="color:inherit; text-decoration:none;">${getCategoryLabel(article.category)}</a>`;
      }

      if (article.district && breadcrumbDistrictWrap && breadcrumbDistrict) {
        breadcrumbDistrict.textContent = article.district;
        breadcrumbDistrictWrap.style.display = 'inline';
      }

      if (breadcrumbTitle) {
        breadcrumbTitle.textContent = escapeText(article.headline);
      }

      if (categoryBadge) {
        categoryBadge.textContent = getCategoryLabel(article.category);
      }

      if (districtBadge) {
        if (article.district && article.district.trim()) {
          districtBadge.textContent = article.district;
          districtBadge.style.display = 'inline-block';
        } else {
          districtBadge.style.display = 'none';
        }
      }

      if (headlineElem) headlineElem.textContent = escapeText(article.headline);

      if (subheadlineElem) {
        const deckText = article.subheadline_te || article.subheadline || article.summary || '';
        if (deckText && deckText.trim()) {
          subheadlineElem.textContent = escapeText(deckText);
          subheadlineElem.style.display = 'block';
        } else {
          subheadlineElem.style.display = 'none';
        }
      }

      if (authorElem) {
        authorElem.textContent = escapeText(article.author_name || article.source_newspaper || 'మమేక మహోదయం డెస్క్');
      }

      if (publishedDateElem) {
        publishedDateElem.textContent = article.publication_date ? formatDate(article.publication_date) : formatDate(article.created_at);
      }

      const displayImg = article.image_url || article.thumbnail_url;
      const allArticleImages = (Array.isArray(article.images) && article.images.length > 0)
        ? article.images
        : ((Array.isArray(article.image_urls) && article.image_urls.length > 0) ? article.image_urls : (displayImg ? [displayImg] : []));

      if (allArticleImages.length > 0) {
        const coverImg = allArticleImages[0];
        let galleryHtml = '';

        if (allArticleImages.length > 1) {
          galleryHtml = `
            <div class="article-photo-gallery" style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <span>📸 ఈ వార్తా ఫొటోల గ్యాలరీ (Photo Gallery - ${allArticleImages.length} ఫొటోలు)</span>
              </h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
                ${allArticleImages.map((imgUrl, i) => `
                  <div class="gallery-item-box" style="position: relative; aspect-ratio: 4/3; border-radius: 6px; overflow: hidden; background: #ffffff; border: 1px solid #cbd5e1; cursor: zoom-in; transition: transform 0.2s;" title="🔍 క్లిక్ చేసి చూడు">
                    <img src="${imgUrl}" alt="Article Photo ${i + 1}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" />
                    <span style="position: absolute; bottom: 4px; right: 4px; background: rgba(15,23,42,0.8); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">📷 ${i + 1}/${allArticleImages.length}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }

        if (mainImgElem) {
          mainImgElem.src = coverImg;
          mainImgElem.alt = escapeText(article.headline);
        }
        if (captionElem) {
          captionElem.textContent = escapeText(article.image_caption_te || '');
        }
        if (figureElem) figureElem.style.display = 'block';
        if (mediaContainer) {
          mediaContainer.innerHTML = `
            <figure class="article-hero-media" style="margin: 20px 0;">
              <img src="${coverImg}" alt="${escapeText(article.headline)}" style="width: 100%; max-height: 520px; object-fit: cover; border-radius: 8px; cursor: zoom-in;" />
              ${article.image_caption_te ? `<figcaption style="font-size: 0.85rem; color: #64748b; margin-top: 6px; text-align: center; font-style: italic;">${escapeText(article.image_caption_te)}</figcaption>` : ''}
            </figure>
            ${galleryHtml}
          `;
          mediaContainer.style.display = 'block';
        }
      } else {
        if (figureElem) figureElem.style.display = 'none';
        if (mediaContainer) mediaContainer.style.display = 'none';
      }

      if (bodyContainer) {
        const bodyContent = article.content || article.content_te || article.cleaned_text || article.raw_extracted_text || '';
        const paragraphs = bodyContent.split(/\n\n|\n/).filter(p => p.trim().length > 0);
        
        bodyContainer.innerHTML = paragraphs.map(p => `<p style="font-size: 1.15rem; line-height: 1.85; color: #0f172a; margin-bottom: 1.4rem; font-family: var(--font-body, inherit);">${escapeText(p)}</p>`).join('');
      }

      // Social Share Buttons Wiring
      const shareUrl = window.location.href;
      const shareTitle = article.headline || '';
      const btnWhatsapp = document.getElementById('share-whatsapp');
      const btnFacebook = document.getElementById('share-facebook');
      const btnTwitter = document.getElementById('share-twitter');
      const btnCopyLink = document.getElementById('share-copylink');

      if (btnWhatsapp) {
        btnWhatsapp.onclick = () => {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`, '_blank', 'noopener,noreferrer');
        };
      }
      if (btnFacebook) {
        btnFacebook.onclick = () => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        };
      }
      if (btnTwitter) {
        btnTwitter.onclick = () => {
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        };
      }
      if (btnCopyLink) {
        btnCopyLink.onclick = async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            const originalHtml = btnCopyLink.innerHTML;
            btnCopyLink.innerHTML = '<span>✓ కాపీ అయ్యింది! (Copied!)</span>';
            setTimeout(() => { btnCopyLink.innerHTML = originalHtml; }, 2000);
          } catch (e) {
            prompt('లింక్ కాపీ చేసుకోండి (Copy link):', shareUrl);
          }
        };
      }

      // Schema.org NewsArticle Structured Data
      try {
        let schemaTag = document.getElementById('schema-news-article');
        if (!schemaTag) {
          schemaTag = document.createElement('script');
          schemaTag.id = 'schema-news-article';
          schemaTag.type = 'application/ld+json';
          document.head.appendChild(schemaTag);
        }
        const schemaData = {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": article.headline,
          "description": article.summary || article.subheadline || article.headline,
          "datePublished": article.publication_date || article.created_at,
          "dateModified": article.updated_at || article.publication_date || article.created_at,
          "author": {
            "@type": "Person",
            "name": article.author_name || article.source_newspaper || "మమేక మహోదయం"
          },
          "publisher": {
            "@type": "Organization",
            "name": "మమేక మహోదయం",
            "url": window.location.origin
          },
          "mainEntityOfPage": shareUrl
        };
        if (allArticleImages.length > 0) {
          schemaData.image = allArticleImages;
        }
        schemaTag.textContent = JSON.stringify(schemaData);
      } catch (e) {}

      // Make all images inside article view zoomable into Lightbox!
      setTimeout(() => {
        if (articleContainer) makeImagesClickable(articleContainer);
      }, 100);

      // Fetch sidebar latest news & related articles
      const sidebarLatest = document.getElementById('sidebar-latest-container');
      if (sidebarLatest) {
        const latestArts = await fetchArticles({ limit: 4 });
        if (latestArts.length) {
          sidebarLatest.replaceChildren(...latestArts.map(art => createHorizontalCard(art)));
        }
      }

      if (relatedGrid) {
        const relRes = await fetch(`/api/public/articles/${encodeURIComponent(identifier)}/related`);
        if (relRes.ok) {
          const relData = await relRes.json();
          const relatedArticles = relData.articles || [];
          if (relatedArticles.length > 0) {
            if (relatedSection) relatedSection.style.display = 'block';
            relatedGrid.replaceChildren(...relatedArticles.slice(0, 3).map(art => createStandardCard(art)));
          } else {
            if (relatedSection) relatedSection.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.error('Error rendering article details:', err);
      if (loadingState) loadingState.style.display = 'none';
      if (notFoundState) notFoundState.style.display = 'block';
      if (articleContainer) articleContainer.style.display = 'none';
    }
  }

  function createFeaturedCard(article) {
    const card = document.createElement('article');
    card.className = 'card-featured bg-white rounded-lg border border-gray-200 p-5 flex flex-col md:flex-row gap-6 items-center shadow-sm';

    const categoryLabel = getCategoryLabel(article.category);
    const date = article.publication_date ? formatDate(article.publication_date) : '';
    const articleUrl = getArticleUrl(article);
    const displayImg = article.thumbnail_url || article.image_url;

    let mediaHtml = '';
    if (displayImg && displayImg.trim()) {
      mediaHtml = `
        <div class="media-placeholder block w-full md:w-1/2 relative overflow-hidden rounded-lg bg-slate-100 flex-shrink-0" style="aspect-ratio: 16/9; min-height: 220px;">
          <a href="${articleUrl}" class="block w-full h-full">
            <img src="${displayImg}" alt="${escapeText(article.headline)}" loading="lazy" decoding="async" class="w-full h-full object-cover object-center rounded-lg" onerror="this.parentElement.parentElement.style.display='none';" />
          </a>
        </div>
      `;
    }

    card.innerHTML = `
      ${mediaHtml}
      <div class="flex-1 flex flex-col justify-between" style="width: 100%;">
        <div>
          <span class="card-category text-xs font-bold text-red-600 uppercase tracking-wide inline-block mb-2">${categoryLabel}</span>
          <h2 class="card-title font-serif font-bold text-gray-900 leading-snug line-clamp-2 hover:text-red-600 transition-colors" style="font-size: clamp(1.4rem, 2vw, 1.8rem); margin-bottom: 10px;">
            <a href="${articleUrl}" style="color: inherit; text-decoration: none;">${escapeText(article.headline)}</a>
          </h2>
        </div>
        <div class="card-footer-meta flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
          <span class="card-author font-medium text-gray-700">${escapeText(article.source_newspaper || article.author_name || 'మమేక మహోదయం')}</span>
          ${date ? `<span class="card-date">${date}</span>` : ''}
        </div>
      </div>
    `;

    return card;
  }

  async function renderCategoryPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryCode = urlParams.get('c') || urlParams.get('category') || 'state';

    const titleElem = document.getElementById('pageCategoryTitle') || document.getElementById('category-title');
    const breadcrumbElem = document.getElementById('breadcrumbCategoryTitle');
    const gridTitleElem = document.getElementById('categoryGridTitle');
    const articlesGrid = document.getElementById('category-news-grid') || document.getElementById('category-articles-grid');
    const featuredSection = document.getElementById('section-category-featured');
    const featuredContainer = document.getElementById('category-featured-container');

    const catName = getCategoryLabel(categoryCode);
    if (titleElem) titleElem.textContent = catName;
    if (breadcrumbElem) breadcrumbElem.textContent = catName;
    if (gridTitleElem) gridTitleElem.textContent = `${catName} కథనాలు`;

    const articles = await fetchArticles({ category: categoryCode, limit: 24 });

    if (articles.length > 0) {
      if (featuredSection && featuredContainer && articles.length >= 1) {
        featuredSection.style.display = 'block';
        featuredContainer.replaceChildren(createFeaturedCard(articles[0]));
      } else if (featuredSection) {
        featuredSection.style.display = 'none';
      }

      const gridArticles = (featuredSection && featuredContainer && articles.length >= 1) ? articles.slice(1) : articles;
      if (articlesGrid) {
        if (gridArticles.length > 0) {
          articlesGrid.replaceChildren(...gridArticles.map(art => createStandardCard(art)));
        } else {
          renderSubtleEmptyState(articlesGrid, 'empty_category');
        }
      }
    } else {
      if (featuredSection) featuredSection.style.display = 'none';
      if (articlesGrid) renderSubtleEmptyState(articlesGrid, 'empty_category');
    }
  }

  async function renderDistrictPage() {
    const urlParams = new URLSearchParams(window.location.search);
    let districtCode = urlParams.get('d') || urlParams.get('district') || 'all';

    // Support pathname routing e.g. /district/bapatla
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if ((!districtCode || districtCode === 'all') && pathParts.length >= 2 && pathParts[0] === 'district') {
      districtCode = pathParts[1];
    }

    const titleElem = document.getElementById('pageDistrictTitle') || document.getElementById('district-title');
    const breadcrumbElem = document.getElementById('breadcrumbDistrictTitle');
    const gridTitleElem = document.getElementById('gridSectionTitle');
    const articlesGrid = document.getElementById('district-news-grid') || document.getElementById('district-articles-grid');
    const dropdown = document.querySelector('.district-select-dropdown') || document.getElementById('district-select-dropdown');
    const featuredSection = document.getElementById('section-district-featured');
    const featuredContainer = document.getElementById('district-featured-container');

    if (dropdown) {
      dropdown.value = districtCode;
      dropdown.onchange = (e) => {
        const val = e.target.value;
        window.location.href = `district.html?d=${encodeURIComponent(val)}`;
      };
    }

    // Attach click listeners to district tab buttons
    document.querySelectorAll('.district-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        const targetBtn = e.currentTarget;
        const code = targetBtn.getAttribute('data-district') || targetBtn.getAttribute('data-district-slug');
        if (code) {
          window.location.href = `district.html?d=${encodeURIComponent(code)}`;
        }
      };
    });

    let distName = 'అన్ని జిల్లాలు';
    if (districtCode && districtCode !== 'all') {
      distName = districtCode;
      if (typeof MAMEKA_DISTRICTS !== 'undefined') {
        const dObj = MAMEKA_DISTRICTS.getDistrictByCodeOrSlug(districtCode);
        if (dObj) distName = (window.MM_i18n && window.MM_i18n.getLanguage() === 'en') ? dObj.name_en : dObj.name_te;
      }
    } else {
      distName = window.MM_i18n ? window.MM_i18n.getText('nav_district') : 'జిల్లాల వార్తలు';
    }

    if (titleElem) titleElem.textContent = distName !== 'all' ? `${distName} వార్తలు` : 'జిల్లాల వార్తలు';
    if (breadcrumbElem) breadcrumbElem.textContent = distName;
    if (gridTitleElem) gridTitleElem.textContent = distName !== 'all' ? `${distName} ప్రాంతీయ విశేషాలు` : 'అన్ని జిల్లాల వార్తలు';

    const params = { limit: 24 };
    if (districtCode && districtCode !== 'all') {
      params.district = districtCode;
    } else {
      params.category = 'district';
    }

    const articles = await fetchArticles(params);

    if (articles.length > 0) {
      if (featuredSection && featuredContainer && articles.length >= 1 && districtCode !== 'all') {
        featuredSection.style.display = 'block';
        featuredContainer.replaceChildren(createFeaturedCard(articles[0]));
      } else if (featuredSection) {
        featuredSection.style.display = 'none';
      }

      const gridArticles = (featuredSection && featuredSection.style.display !== 'none' && articles.length >= 1) ? articles.slice(1) : articles;
      if (articlesGrid) {
        if (gridArticles.length > 0) {
          articlesGrid.replaceChildren(...gridArticles.map(art => createStandardCard(art)));
        } else {
          renderSubtleEmptyState(articlesGrid, 'empty_district');
        }
      }
    } else {
      if (featuredSection) featuredSection.style.display = 'none';
      if (articlesGrid) renderSubtleEmptyState(articlesGrid, 'empty_district');
    }
  }

  async function renderEpaperPage(targetDate = null) {
    const loadingEl = document.getElementById('epaper-loading');
    const emptyEl = document.getElementById('epaper-empty-state');
    const sectionLatest = document.getElementById('section-epaper-latest');
    const epaperContainer = document.getElementById('epaper-container');
    const archiveGrid = document.getElementById('epaper-archives-grid') || document.getElementById('epaper-archive-grid');
    const sectionArchives = document.getElementById('section-epaper-archives');
    const archiveDivider = document.getElementById('epaper-archive-divider');
    const dateAlertBox = document.getElementById('epaper-date-status-alert');
    const datePicker = document.getElementById('epaper-date-picker');
    const btnSearch = document.getElementById('btn-epaper-date-search');
    const btnReset = document.getElementById('btn-epaper-reset');

    // Bind event listeners only once
    if (btnSearch && !btnSearch.dataset.bound) {
      btnSearch.dataset.bound = 'true';
      btnSearch.addEventListener('click', () => {
        const val = datePicker ? datePicker.value.trim() : '';
        renderEpaperPage(val || null);
      });
    }

    if (datePicker && !datePicker.dataset.bound) {
      datePicker.dataset.bound = 'true';
      datePicker.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = datePicker.value.trim();
          renderEpaperPage(val || null);
        }
      });
    }

    if (btnReset && !btnReset.dataset.bound) {
      btnReset.dataset.bound = 'true';
      btnReset.addEventListener('click', () => {
        if (datePicker) datePicker.value = '';
        renderEpaperPage(null);
      });
    }

    try {
      const fetchUrl = targetDate ? `/api/public/epaper?date=${encodeURIComponent(targetDate)}` : '/api/public/epaper';
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Epaper fetch error');
      const data = await res.json();
      const edition = data.edition;

      if (loadingEl) loadingEl.style.display = 'none';

      // Date Search Alert Message
      if (dateAlertBox) {
        if (targetDate) {
          if (data.exact_match && edition) {
            dateAlertBox.style.display = 'block';
            dateAlertBox.style.background = '#ecfdf5';
            dateAlertBox.style.color = '#047857';
            dateAlertBox.style.border = '1px solid #a7f3d0';
            dateAlertBox.innerHTML = `📅 <strong>${formatDate(edition.edition_date)}</strong> నాటి డిజిటల్ దినపత్రిక సంచిక విజయవంతంగా చూపబడుతోంది.`;
          } else {
            dateAlertBox.style.display = 'block';
            dateAlertBox.style.background = '#fffbeb';
            dateAlertBox.style.color = '#b45309';
            dateAlertBox.style.border = '1px solid #fde68a';
            const safeDate = escapeText(targetDate);
            dateAlertBox.innerHTML = `⚠️ మీరు ఎంచుకున్న తేదీ <strong>(${safeDate})</strong> కి సంబంధించి ఎలాంటి పత్రిక ప్రచురించబడలేదు. (No edition found for ${safeDate})`;
          }
        } else {
          dateAlertBox.style.display = 'none';
        }
      }

      if (edition) {
        const dateStr = edition.edition_date ? formatDate(edition.edition_date) : '';
        const name = edition.edition_name || 'మమేక మహోదయం ప్రధాన సంచిక';

        if (sectionLatest) {
          sectionLatest.style.display = 'grid';
          if (emptyEl) emptyEl.style.display = 'none';

          const titleEl = document.getElementById('epaper-title');
          const dateEl = document.getElementById('epaper-date');
          const sizeEl = document.getElementById('epaper-size');
          const badgeEl = document.getElementById('epaper-badge');
          const readLink = document.getElementById('epaper-read-link');
          const downloadLink = document.getElementById('epaper-download-link');

          if (titleEl) titleEl.textContent = name;
          if (dateEl) dateEl.textContent = dateStr;
          if (badgeEl) badgeEl.textContent = targetDate ? 'ఎంచుకున్న సంచిక' : 'నేటి పత్రిక';
          if (sizeEl) sizeEl.textContent = edition.file_size_bytes ? `${(edition.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : 'PDF';
          
          if (readLink) {
            readLink.href = edition.pdf_path;
            readLink.target = '_blank';
          }
          if (downloadLink) {
            downloadLink.href = `/api/public/epaper/download/${edition.id}`;
            downloadLink.style.display = 'inline-flex';
          }
        }

        if (epaperContainer) {
          epaperContainer.innerHTML = `
            <div class="epaper-card bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div class="epaper-icon" style="font-size: 4rem; color: #d81b7a;">📄</div>
              <div class="epaper-details flex-1">
                <h2 class="text-xl font-bold text-gray-900 mb-2">${escapeText(name)}</h2>
                <div class="text-sm text-gray-600 mb-4">
                  <span>${window.MM_i18n ? window.MM_i18n.getText('publication_date_label') : 'ప్రచురణ తేదీ:'} <strong>${dateStr}</strong></span>
                </div>
                <div class="flex gap-3 flex-wrap">
                  <a href="${edition.pdf_path}" target="_blank" class="btn btn-primary" style="padding: 10px 20px; background-color: #d81b7a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    ${window.MM_i18n ? window.MM_i18n.getText('read_epaper') : '📖 ఈ-పేపర్ చదవండి'}
                  </a>
                  <a href="/api/public/epaper/download/${edition.id}" class="btn btn-outline" style="padding: 10px 20px; border: 1px solid #cbd5e1; color: #1e293b; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    ${window.MM_i18n ? window.MM_i18n.getText('download_pdf') : '⬇️ PDF డౌన్‌లోడ్'}
                  </a>
                </div>
              </div>
            </div>
          `;
        }
      } else {
        if (sectionLatest) sectionLatest.style.display = 'none';
        if (!targetDate && emptyEl) emptyEl.style.display = 'block';
        if (!targetDate && epaperContainer) renderSubtleEmptyState(epaperContainer, 'empty_epaper');
      }

      // Fetch Archives (List all uploaded editions)
      const archRes = await fetch(`${getApiBaseUrl()}/api/public/epaper/archive`);
      if (archRes.ok && archiveGrid) {
        const archData = await archRes.json();
        const editions = archData.editions || [];
        if (editions.length > 0) {
          if (sectionArchives) sectionArchives.style.display = 'block';
          if (archiveDivider) archiveDivider.style.display = 'block';

          archiveGrid.innerHTML = editions.map(ed => `
            <div class="card p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between" style="min-height: 140px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="font-size: 2.2rem; color: #d81b7a; flex-shrink: 0;">📄</div>
                <div>
                  <strong style="color: #0f172a; font-size: 0.95rem; display: block; line-height: 1.3;">${escapeText(ed.edition_name || 'మమేక మహోదయం')}</strong>
                  <span style="font-size: 0.825rem; color: #64748b; margin-top: 4px; display: block;">📅 ${formatDate(ed.edition_date)}</span>
                  <span style="font-size: 0.75rem; color: #94a3b8;">${ed.file_size_bytes ? (ed.file_size_bytes / (1024 * 1024)).toFixed(2) + ' MB' : 'PDF'}</span>
                </div>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; pt-2; border-top: 1px solid #f1f5f9;">
                <a href="${ed.pdf_path}" target="_blank" class="btn btn-sm" style="background-color: #d81b7a; color: #ffffff; text-decoration: none; padding: 6px 14px; border-radius: 4px; font-size: 0.825rem; font-weight: 600;">
                  📖 చదవండి
                </a>
                <a href="/api/public/epaper/download/${ed.id}" class="btn btn-sm" style="background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; text-decoration: none; padding: 6px 14px; border-radius: 4px; font-size: 0.825rem; font-weight: 600;">
                  ⬇️ డౌన్‌లోడ్
                </a>
              </div>
            </div>
          `).join('');
        } else {
          if (sectionArchives) sectionArchives.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Error rendering epaper page:', err);
      if (loadingEl) loadingEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      if (epaperContainer) renderSubtleEmptyState(epaperContainer, 'empty_epaper');
    }
  }

  async function renderSearchPage() {
    const searchInput = document.getElementById('searchInput');
    const catFilter = document.getElementById('catFilter');
    const distFilter = document.getElementById('distFilter');
    const searchForm = document.getElementById('mainSearchForm') || document.querySelector('.search-hero-box form, .search-form-wrap');
    const resultsEl = document.getElementById('searchStateResults');
    const resultsGrid = document.getElementById('searchResultsGrid');
    const resultsCountBadge = document.getElementById('resultsCountBadge');
    const initialEl = document.getElementById('searchStateInitial');
    const emptyEl = document.getElementById('searchStateEmpty');
    const btnClearSearch = document.getElementById('btnClearSearch');

    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || urlParams.get('search') || '';
    const cat = urlParams.get('c') || urlParams.get('category') || '';
    const dist = urlParams.get('d') || urlParams.get('district') || '';

    const lang = (window.MM_i18n ? window.MM_i18n.getLanguage() : 'te');

    // Populate Category Dropdown if needed
    if (catFilter && catFilter.options.length <= 1) {
      const catLabels = CATEGORY_LABELS[lang] || CATEGORY_LABELS.te;
      Object.keys(catLabels).forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = catLabels[k];
        catFilter.appendChild(opt);
      });
    }

    // Populate District Dropdown if needed
    if (distFilter && distFilter.options.length <= 1 && typeof MAMEKA_DISTRICTS !== 'undefined') {
      MAMEKA_DISTRICTS.getAllDistricts().forEach(d => {
        if (d.code === 'all') return;
        const opt = document.createElement('option');
        opt.value = d.code;
        opt.textContent = lang === 'en' ? d.name_en : d.name_te;
        distFilter.appendChild(opt);
      });
    }

    if (query && searchInput) searchInput.value = query;
    if (cat && catFilter) catFilter.value = cat;
    if (dist && distFilter) distFilter.value = dist;

    // Form submission & filter change binding
    const executeSearch = () => {
      const qVal = searchInput ? searchInput.value.trim() : '';
      const cVal = catFilter ? catFilter.value : '';
      const dVal = distFilter ? distFilter.value : '';
      const sp = new URLSearchParams();
      if (qVal) sp.append('q', qVal);
      if (cVal) sp.append('c', cVal);
      if (dVal) sp.append('d', dVal);
      window.location.href = `/search.html?${sp.toString()}`;
    };

    if (searchForm && !searchForm.dataset.bound) {
      searchForm.dataset.bound = 'true';
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        executeSearch();
      });
    }

    if (catFilter && !catFilter.dataset.bound) {
      catFilter.dataset.bound = 'true';
      catFilter.addEventListener('change', executeSearch);
    }

    if (distFilter && !distFilter.dataset.bound) {
      distFilter.dataset.bound = 'true';
      distFilter.addEventListener('change', executeSearch);
    }

    if (btnClearSearch && !btnClearSearch.dataset.bound) {
      btnClearSearch.dataset.bound = 'true';
      btnClearSearch.addEventListener('click', () => {
        window.location.href = '/search.html';
      });
    }

    const hasSearch = Boolean(query || cat || dist);

    if (!hasSearch) {
      if (initialEl) initialEl.style.display = 'block';
      if (resultsEl) resultsEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'none';
      return;
    }

    if (initialEl) initialEl.style.display = 'none';

    const apiParams = new URLSearchParams();
    if (query) apiParams.append('search', query);
    if (cat) apiParams.append('category', cat);
    if (dist) apiParams.append('district', dist);

    const articles = await fetchArticles(Object.fromEntries(apiParams));

    if (articles.length > 0) {
      if (resultsEl) resultsEl.style.display = 'block';
      if (emptyEl) emptyEl.style.display = 'none';
      if (resultsCountBadge) {
        resultsCountBadge.textContent = lang === 'en' ? `${articles.length} articles found` : `${articles.length} కథనాలు లభించాయి`;
      }
      if (resultsGrid) {
        resultsGrid.replaceChildren(...articles.map(art => createStandardCard(art)));
      }
    } else {
      if (resultsEl) resultsEl.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      if (resultsGrid) {
        resultsGrid.innerHTML = '';
      }
    }
  }

  function reloadPageContent() {
    const page = window.location.pathname.toLowerCase();
    if (page.endsWith('index.html') || page.endsWith('/') || page === '') {
      renderHome();
    } else if (page.endsWith('article.html') || page.includes('/news/')) {
      renderArticlePage();
    } else if (page.endsWith('category.html')) {
      renderCategoryPage();
    } else if (page.endsWith('district.html')) {
      renderDistrictPage();
    } else if (page.endsWith('epaper.html')) {
      renderEpaperPage();
    } else if (page.endsWith('search.html')) {
      renderSearchPage();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    reloadPageContent();
  });

  window.MM_ContentAPI = {
    reload: reloadPageContent,
    fetchArticles: fetchArticles
  };

  window.createStandardCard = createStandardCard;
  window.createHorizontalCard = createHorizontalCard;

})();