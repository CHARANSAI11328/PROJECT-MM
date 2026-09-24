/**
 * MAMEKA MAHODAYAM - Dynamic Navigation Active State Engine
 * Authoritative single source of truth for menu item highlighting.
 * Ensures strict route-based active states across Desktop, Tablet & Mobile.
 */

(function () {
  function getTargetKeyFromURL() {
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = (searchParams.get('c') || searchParams.get('category') || '').toLowerCase();
    const districtParam = (searchParams.get('d') || searchParams.get('district') || '').toLowerCase();

    // 1. E-Paper Page
    if (pathname.includes('/epaper') || pathname.includes('/e-paper') || pathname.endsWith('epaper.html')) {
      return 'epaper';
    }

    // 2. News Search Page
    if (pathname.includes('/search') || pathname.includes('/news-search') || pathname.endsWith('search.html')) {
      return 'search';
    }

    // 3. District Pages & District Filters
    if (pathname.includes('/district') || pathname.endsWith('district.html') || districtParam || categoryParam === 'district') {
      return 'district';
    }

    // 4. Category Pages & Query Params
    if (pathname.includes('/state') || categoryParam === 'state') {
      return 'state';
    }
    if (pathname.includes('/politics') || categoryParam === 'politics') {
      return 'politics';
    }
    if (pathname.includes('/national') || pathname.includes('/international') || ['national', 'international', 'national-international'].includes(categoryParam)) {
      return 'national';
    }
    if (pathname.includes('/sports') || categoryParam === 'sports') {
      return 'sports';
    }
    if (pathname.includes('/cinema') || categoryParam === 'cinema') {
      return 'cinema';
    }
    if (pathname.includes('/tech') || ['tech', 'technology', 'technical'].includes(categoryParam)) {
      return 'tech';
    }
    if (pathname.includes('/business') || categoryParam === 'business') {
      return 'business';
    }
    if (pathname.includes('/education') || pathname.includes('/jobs') || ['education', 'edu-jobs', 'education-jobs'].includes(categoryParam)) {
      return 'education';
    }
    if (pathname.includes('/editorial') || categoryParam === 'editorial') {
      return 'editorial';
    }

    // 4b. Reporters / Editorial Team Page
    if (pathname.includes('/reporters') || pathname.includes('/editorial-team') || pathname.includes('/our-team') || pathname.endsWith('editorial-team.html')) {
      return 'reporters';
    }

    // 5. Article Detail Page Handling
    if (pathname.includes('/news/') || pathname.endsWith('article.html')) {
      // Checked dynamically by article loader if category data available, otherwise returns null
      const cachedCat = window.__CURRENT_ARTICLE_CATEGORY__;
      const cachedDist = window.__CURRENT_ARTICLE_DISTRICT__;

      if (cachedDist || cachedCat === 'district') return 'district';
      if (cachedCat === 'state') return 'state';
      if (cachedCat === 'politics') return 'politics';
      if (['national', 'international'].includes(cachedCat)) return 'national';
      if (cachedCat === 'sports') return 'sports';
      if (cachedCat === 'cinema') return 'cinema';
      if (['tech', 'technology', 'technical'].includes(cachedCat)) return 'tech';
      if (cachedCat === 'business') return 'business';
      if (['education', 'jobs', 'education-jobs'].includes(cachedCat)) return 'education';
      if (cachedCat === 'editorial') return 'editorial';

      // On article page without matched category: DO NOT highlight Home
      return null;
    }

    // 6. Homepage
    if (pathname === '/' || pathname.endsWith('/index.html') || pathname.endsWith('index.html')) {
      return 'home';
    }

    return null;
  }

  function updateNavigationActiveState(customTargetKey = null) {
    const targetKey = customTargetKey || getTargetKeyFromURL();
    const navItems = document.querySelectorAll('.main-nav .nav-item');

    navItems.forEach(item => {
      item.classList.remove('active');
      item.removeAttribute('aria-current');

      const href = (item.getAttribute('href') || '').toLowerCase();
      const i18nKey = (item.getAttribute('data-i18n') || '').toLowerCase();

      let isMatch = false;

      if (targetKey === 'home' && (href.endsWith('index.html') || href === '/' || href === 'index.html')) {
        isMatch = true;
      } else if (targetKey === 'state' && (href.includes('c=state') || href.includes('/state'))) {
        isMatch = true;
      } else if (targetKey === 'district' && (href.includes('district') || href.includes('/district'))) {
        isMatch = true;
      } else if (targetKey === 'politics' && (href.includes('c=politics') || href.includes('/politics'))) {
        isMatch = true;
      } else if (targetKey === 'national' && (href.includes('c=national') || href.includes('national'))) {
        isMatch = true;
      } else if (targetKey === 'sports' && (href.includes('c=sports') || href.includes('/sports'))) {
        isMatch = true;
      } else if (targetKey === 'cinema' && (href.includes('c=cinema') || href.includes('/cinema'))) {
        isMatch = true;
      } else if (targetKey === 'tech' && (href.includes('c=tech') || href.includes('/tech'))) {
        isMatch = true;
      } else if (targetKey === 'business' && (href.includes('c=business') || href.includes('/business'))) {
        isMatch = true;
      } else if (targetKey === 'education' && (href.includes('c=education') || href.includes('education'))) {
        isMatch = true;
      } else if (targetKey === 'editorial' && (href.includes('c=editorial') || href.includes('/editorial'))) {
        isMatch = true;
      } else if (targetKey === 'reporters' && (href.includes('editorial-team') || href.includes('reporters') || href.includes('our-team') || i18nKey === 'nav_team' || i18nKey === 'nav_editorial_team')) {
        isMatch = true;
      } else if (targetKey === 'epaper' && (href.includes('epaper') || href.includes('/e-paper'))) {
        isMatch = true;
      } else if (targetKey === 'search' && (href.includes('search') || href.includes('/news-search'))) {
        isMatch = true;
      }

      if (isMatch) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      }
    });
  }

  /**
   * Reset selected article state and return to homepage feed
   */
  function navigateToHome(e) {
    const pathname = window.location.pathname.toLowerCase();
    const isHomePath = pathname === '/' || pathname.endsWith('/index.html') || pathname.endsWith('index.html') || pathname.endsWith('/');

    // Reset selected article state
    window.__SELECTED_ARTICLE__ = null;
    window.__CURRENT_ARTICLE_CATEGORY__ = null;
    window.__CURRENT_ARTICLE_DISTRICT__ = null;

    if (!isHomePath) {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      window.location.href = '/';
      return;
    }

    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // Clean URL query parameters if present (e.g. ?id=... or ?slug=...)
    if (window.location.search.includes('id=') || window.location.search.includes('slug=')) {
      history.pushState(null, '', window.location.pathname);
    }

    // Toggle UI containers smoothly if present in DOM
    const articleContainer = document.getElementById('article-container');
    const loadingState = document.getElementById('article-loading-state');
    const notFoundState = document.getElementById('article-not-found-state');
    const mainContent = document.getElementById('main-content');

    if (articleContainer) articleContainer.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (notFoundState) notFoundState.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';

    updateNavigationActiveState('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Export to window
  window.updateNavigationActiveState = updateNavigationActiveState;
  window.navigateToHome = navigateToHome;
  window.resetArticleState = navigateToHome;

  // Single-pass IntersectionObserver for subtle section reveal animations & image load fade-in
  function initAppleMotionEngine() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if ('IntersectionObserver' in window) {
      const revealElements = document.querySelectorAll(
        '.section-header-editorial, .editorial-main-grid, .grid-cards-3, .stats-grid, .archive-date-bar, .section-epaper-archives, .tp-article-card, .card-standard, .card-hero, .card-horizontal'
      );

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '0px 0px -30px 0px',
        threshold: 0.05
      });

      revealElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
      });
    }

    // Smooth image fade-in load handler
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('smooth-image-loaded');
      } else {
        img.classList.add('smooth-image-loading');
        img.addEventListener('load', () => {
          img.classList.remove('smooth-image-loading');
          img.classList.add('smooth-image-loaded');
        }, { once: true });
        img.addEventListener('error', () => {
          img.classList.remove('smooth-image-loading');
        }, { once: true });
      }
    });
  }

  // --------------------------------------------------------------------------
  // MOBILE-FIRST NATIVE APP FRAMEWORK (APP BAR, DRAWER & BOTTOM DOCKED NAV)
  // --------------------------------------------------------------------------
  function initMobileNativeAppFramework() {
    const pathname = window.location.pathname.toLowerCase();
    // Do not inject on Admin portal or standalone Press ID verification page
    if (pathname.includes('/admin') || pathname.includes('reporter-profile.html')) {
      return;
    }

    // 1. Mobile Top App Header
    if (!document.getElementById('mobile-app-header')) {
      const topBar = document.createElement('header');
      topBar.id = 'mobile-app-header';
      topBar.className = 'mobile-app-header';
      topBar.setAttribute('role', 'banner');
      topBar.innerHTML = `
        <div class="mobile-app-left">
          <button type="button" id="mobile-drawer-toggle" class="mobile-menu-btn" aria-label="ఓపెన్ మెనూ (Open Menu)">☰</button>
          <a href="/" class="mobile-app-brand-title">
            <span>మమేక మహోదయం</span>
            <span class="mobile-live-indicator" title="లైవ్ వార్తలు"></span>
          </a>
        </div>
        <div class="mobile-app-right">
          <a href="/epaper.html" class="mobile-epaper-badge">📰 ఈ-పేపర్</a>
          <button type="button" id="mobile-search-trigger" class="mobile-search-trigger-btn" aria-label="శోధన (Search)">🔍</button>
        </div>
      `;
      document.body.insertBefore(topBar, document.body.firstChild);
    }

    // 2. Mobile Slide-Out Drawer Navigation Menu
    if (!document.getElementById('mobile-drawer-overlay')) {
      const drawerWrap = document.createElement('div');
      drawerWrap.id = 'mobile-drawer-overlay';
      drawerWrap.className = 'mobile-drawer-overlay';
      drawerWrap.setAttribute('role', 'dialog');
      drawerWrap.setAttribute('aria-modal', 'true');
      drawerWrap.innerHTML = `
        <div class="mobile-drawer">
          <div class="drawer-header">
            <div>
              <div class="drawer-brand-title">మమేక మహోదయం</div>
              <div class="drawer-brand-tagline">అక్షరంలో ఆత్మీయత - వార్తల్లో వాస్తవం</div>
              <div style="font-size: 0.68rem; color: #fbcfe8; margin-top: 4px; font-family: sans-serif;">RNI: APTEL/2026/89123 • తెలుగు దినపత్రిక</div>
            </div>
            <button type="button" id="mobile-drawer-close" class="drawer-close-btn" aria-label="మెనూ మూసివేయి">✕</button>
          </div>
          <ul class="drawer-links-list">
            <li><a href="/" class="drawer-link-item"><span>🏠</span> <span>హోమ్ (Home)</span></a></li>
            <li><a href="/category.html?c=latest" class="drawer-link-item"><span>⚡</span> <span>తాజా వార్తలు (Latest News)</span></a></li>
            <li><a href="/category.html?c=state" class="drawer-link-item"><span>🏛️</span> <span>ఆంధ్రప్రదేశ్ &amp; తెలంగాణ</span></a></li>
            <li><a href="/district.html" class="drawer-link-item"><span>📍</span> <span>26 జిల్లాల వార్తలు (Districts)</span></a></li>
            <li><a href="/category.html?c=politics" class="drawer-link-item"><span>🗳️</span> <span>రాజకీయాలు (Politics)</span></a></li>
            <li><a href="/category.html?c=national" class="drawer-link-item"><span>🌐</span> <span>దేశం &amp; ప్రపంచం (National)</span></a></li>
            <li><a href="/category.html?c=cinema" class="drawer-link-item"><span>🎬</span> <span>సినిమా &amp; వినోదం (Cinema)</span></a></li>
            <li><a href="/category.html?c=sports" class="drawer-link-item"><span>🏏</span> <span>క్రీడలు (Sports)</span></a></li>
            <li><a href="/category.html?c=education" class="drawer-link-item"><span>💼</span> <span>విద్య &amp; ఉద్యోగాలు (Jobs)</span></a></li>
            <li><a href="/category.html?c=editorial" class="drawer-link-item"><span>✍️</span> <span>సంపాదకీయం (Editorial)</span></a></li>
            <div class="drawer-divider"></div>
            <li><a href="/epaper.html" class="drawer-link-item" style="color: #0284c7; font-weight: 700;"><span>📰</span> <span>డిజిటల్ ఈ-పేపర్ (E-Paper)</span></a></li>
            <li><a href="/editorial-team.html" class="drawer-link-item" style="color: #be185d; font-weight: 700;"><span>👥</span> <span>మా సంపాదకీయ బృందం (Team)</span></a></li>
            <li><a href="/admin/index.html" class="drawer-link-item" style="color: #d97706; font-weight: 700;"><span>🔒</span> <span>అడ్మిన్ లాగిన్ (Admin Portal)</span></a></li>
          </ul>
          <div class="drawer-footer">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">మమేక మహోదయం దినపత్రిక</div>
            <div>విజయవాడ &amp; గుంటూరు, ఆంధ్రప్రదేశ్</div>
            <div style="margin-top: 6px; font-size: 0.7rem; color: #94a3b8;">&copy; 2026 All Rights Reserved.</div>
          </div>
        </div>
      `;
      document.body.appendChild(drawerWrap);
    }

    // 3. Fixed Mobile Bottom Navigation Bar (App Dock)
    if (!document.getElementById('mobile-bottom-nav')) {
      const bottomNav = document.createElement('nav');
      bottomNav.id = 'mobile-bottom-nav';
      bottomNav.className = 'mobile-bottom-nav';
      bottomNav.setAttribute('aria-label', 'Mobile App Bottom Navigation');
      bottomNav.innerHTML = `
        <a href="/" class="bottom-nav-tab" data-nav="home">
          <span class="tab-icon">🏠</span>
          <span>హోమ్</span>
        </a>
        <a href="/district.html" class="bottom-nav-tab" data-nav="district">
          <span class="tab-icon">📍</span>
          <span>జిల్లాల వార్తలు</span>
        </a>
        <a href="/epaper.html" class="bottom-nav-tab" data-nav="epaper">
          <span class="tab-icon">📰</span>
          <span>ఈ-పేపర్</span>
        </a>
        <a href="/editorial-team.html" class="bottom-nav-tab" data-nav="reporters">
          <span class="tab-icon">👥</span>
          <span>మా బృందం</span>
        </a>
        <button type="button" class="bottom-nav-tab" id="bottom-nav-search-btn" style="background: none; border: none; cursor: pointer;">
          <span class="tab-icon">🔍</span>
          <span>శోధన</span>
        </button>
      `;
      document.body.appendChild(bottomNav);
    }

    // 4. Quick Mobile Search Modal Sheet
    if (!document.getElementById('mobile-search-modal')) {
      const searchModal = document.createElement('div');
      searchModal.id = 'mobile-search-modal';
      searchModal.className = 'mobile-search-modal';
      searchModal.setAttribute('role', 'dialog');
      searchModal.setAttribute('aria-modal', 'true');
      searchModal.innerHTML = `
        <div class="mobile-search-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; font-size: 1.05rem; color: #0f172a; font-weight: 700;">🔍 వార్తల శోధన (Search News)</h4>
            <button type="button" id="mobile-search-close-btn" style="background: none; border: none; font-size: 1.4rem; color: #64748b; cursor: pointer; padding: 4px 8px;">✕</button>
          </div>
          <form action="/search.html" method="GET">
            <div style="display: flex; gap: 8px;">
              <input type="text" name="q" id="mobile-search-input" class="search-bar-input" style="flex: 1; height: 44px; border: 1.5px solid #be185d; border-radius: 8px; padding: 0 12px; font-size: 0.95rem;" placeholder="కీవర్డ్ నమోదు చేయండి..." />
              <button type="submit" style="background: #be185d; color: #fff; border: none; border-radius: 8px; padding: 0 18px; font-weight: 700; font-size: 0.9rem; cursor: pointer;">వెతుకు</button>
            </div>
          </form>
          <div style="margin-top: 14px;">
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 700;">ట్రెండింగ్ శోధనలు:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
              <a href="/search.html?q=అమరావతి" style="padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 0.78rem; color: #334155; text-decoration: none; font-weight: 500;">అమరావతి</a>
              <a href="/search.html?q=పోలవరం" style="padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 0.78rem; color: #334155; text-decoration: none; font-weight: 500;">పోలవరం</a>
              <a href="/search.html?q=రైతు" style="padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 0.78rem; color: #334155; text-decoration: none; font-weight: 500;">రైతు భరోసా</a>
              <a href="/search.html?q=విశాఖపట్నం" style="padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 0.78rem; color: #334155; text-decoration: none; font-weight: 500;">విశాఖ</a>
              <a href="/search.html?q=ఉద్యోగాలు" style="padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 0.78rem; color: #334155; text-decoration: none; font-weight: 500;">ఉద్యోగాలు</a>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(searchModal);
    }

    // 5. Wire Up Drawer Events
    const drawerToggle = document.getElementById('mobile-drawer-toggle');
    const drawerOverlay = document.getElementById('mobile-drawer-overlay');
    const drawerClose = document.getElementById('mobile-drawer-close');

    if (drawerToggle && drawerOverlay) {
      drawerToggle.onclick = () => {
        drawerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      };
    }
    if (drawerClose && drawerOverlay) {
      drawerClose.onclick = () => {
        drawerOverlay.classList.remove('active');
        document.body.style.overflow = '';
      };
    }
    if (drawerOverlay) {
      drawerOverlay.onclick = (e) => {
        if (e.target === drawerOverlay) {
          drawerOverlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      };
    }

    // 6. Wire Up Search Modal Events
    const searchModal = document.getElementById('mobile-search-modal');
    const searchTriggerTop = document.getElementById('mobile-search-trigger');
    const searchTriggerBottom = document.getElementById('bottom-nav-search-btn');
    const searchClose = document.getElementById('mobile-search-close-btn');

    const openSearch = () => {
      if (searchModal) {
        searchModal.classList.add('active');
        const input = document.getElementById('mobile-search-input');
        if (input) setTimeout(() => input.focus(), 100);
      }
    };
    const closeSearch = () => {
      if (searchModal) searchModal.classList.remove('active');
    };

    if (searchTriggerTop) searchTriggerTop.onclick = openSearch;
    if (searchTriggerBottom) searchTriggerBottom.onclick = openSearch;
    if (searchClose) searchClose.onclick = closeSearch;
    if (searchModal) {
      searchModal.onclick = (e) => {
        if (e.target === searchModal) closeSearch();
      };
    }

    // 7. Update Bottom Nav Active Indicator
    const targetKey = getTargetKeyFromURL();
    document.querySelectorAll('.bottom-nav-tab').forEach(tab => {
      tab.classList.remove('active');
      const tabTarget = tab.getAttribute('data-nav');
      if (tabTarget && tabTarget === targetKey) {
        tab.classList.add('active');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateNavigationActiveState();
    initMobileNativeAppFramework();
    initAppleMotionEngine();

    // Bind Home nav links, Brand Logo links, and Back buttons
    document.querySelectorAll('.masthead-center a, .nav-item[data-i18n="nav_home"], #btn-back-to-feed, .btn-back-home, .btn-close-article').forEach(el => {
      el.addEventListener('click', (e) => {
        const href = (el.getAttribute('href') || '').toLowerCase();
        if (href === '/' || href === 'index.html' || href.endsWith('/index.html') || el.id === 'btn-back-to-feed' || el.classList.contains('btn-close-article')) {
          navigateToHome(e);
        }
      });
    });

    // Touch & Click Dropdown Toggle for Mobile Navigation
    document.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = btn.closest('.nav-dropdown');
        if (parent) {
          const isOpen = parent.classList.toggle('open');
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      });
    });

    document.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-dropdown.open').forEach(dd => {
        if (!dd.contains(e.target)) {
          dd.classList.remove('open');
          const btn = dd.querySelector('.nav-dropdown-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Auto-scroll active nav item into view horizontally on mobile/tablet
    setTimeout(() => {
      const activeNavItem = document.querySelector('.nav-list .nav-item.active');
      if (activeNavItem && window.innerWidth <= 768) {
        activeNavItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, 150);

    // Listen for browser Back/Forward navigation (popstate)
    window.addEventListener('popstate', () => {
      const pathname = window.location.pathname.toLowerCase();
      const search = window.location.search;
      if (pathname === '/' || pathname.endsWith('index.html') || (!pathname.includes('/news/') && !search.includes('id=') && !search.includes('slug='))) {
        navigateToHome();
      }
    });
  });
})();
