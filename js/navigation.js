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
      window.location.href = 'index.html';
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

  document.addEventListener('DOMContentLoaded', () => {
    updateNavigationActiveState();
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
