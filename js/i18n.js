/**
 * MAMEKA MAHODAYAM / మమేక మహోదయం
 * Centralized Bilingual i18n Engine & UI Language System
 *
 * UI Languages:
 *   - 'te': Telugu (Default)
 *   - 'en': English
 *
 * NOTE: Article news content (headline, body, subheadline, byline) is NEVER machine-translated.
 * Original stored content remains exactly in its original language.
 */

(function () {
  'use strict';

  const TRANSLATIONS = {
    te: {
      // Accessibility & Brand
      skip_link: "ముఖ్య పాఠ్యానికి వెళ్ళండి",
      brand_name_te: "మమేక మహోదయం",
      brand_prefix_te: "మమేక",
      brand_main_te: "మహోదయం",
      brand_name_en: "MAMEKA MAHODAYAM",
      brand_tagline: "తెలుగు దినపత్రిక",
      brand_slogan: "అక్షరంలో ఆత్మీయత - వార్తల్లో వాస్తవం",

      // Utility & Header
      top_weather_placeholder: "విజయవాడ: 31°C | తేమ: 68%",
      top_edition_placeholder: "ఆంధ్రప్రదేశ్ & తెలంగాణ ఎడిషన్",
      top_epaper_link: "ఈ-పేపర్",
      top_admin_link: "🔒 అడ్మిన్ లాగిన్",
      main_site_link: "🌐 పత్రిక వెబ్‌సైట్",

      // Navigation
      nav_home: "హోమ్",
      nav_latest: "తాజా వార్తలు",
      nav_state: "ఆంధ్రప్రదేశ్",
      nav_district: "జిల్లాల వార్తలు",
      nav_politics: "రాజకీయాలు",
      nav_national: "దేశం & ప్రపంచం",
      nav_cinema: "సినిమా",
      nav_sports: "క్రీడలు",
      nav_education: "విద్య & ఉద్యోగాలు",
      nav_tech: "టెక్నాలజీ",
      nav_business: "బిజినెస్",
      nav_editorial: "సంపాదకీయం",
      nav_team: "మా రిపోర్టర్లు",
      nav_editorial_team: "మా రిపోర్టర్లు & సంపాదకీయ బృందం",
      editorial_team_title: "మా రిపోర్టర్లు & సంపాదకీయ బృందం",
      nav_epaper: "ఈ-పేపర్",
      nav_search: "శోధన",
      nav_more: "మరిన్ని ▾",

      // Search Bar
      search_placeholder: "వార్తలను శోధించండి...",
      search_button: "శోధించండి",
      search_submit_aria: "శోధన సమర్పించండి",
      search_bar_aria: "వెబ్‌సైట్ శోధన",
      search_results_title: "శోధన ఫలితాలు",
      search_query_prefix: "శోధించిన పదం:",

      // Section Headings
      breaking_news: "ముఖ్య వార్తలు",
      top_stories: "ముఖ్యాంశాలు",
      latest_news: "తాజా వార్తలు",
      state_news: "ఆంధ్రప్రదేశ్ & తెలంగాణ వార్తలు",
      district_news: "ఆంధ్రప్రదేశ్ 26 జిల్లాల వార్తలు",
      national_news: "జాతీయ & అంతర్జాతీయ వార్తలు",
      cinema_news: "సినిమా & వినోదం",
      sports_news: "క్రీడా వార్తలు",
      education_news: "విద్య & ఉద్యోగాలు",
      tech_news: "సాంకేతిక పరిజ్ఞానం & టెక్నాలజీ",
      business_news: "వ్యాపార రంగం & బిజినెస్",
      sports_news: "క్రీడా విశేషాలు",
      education_news: "విద్య & ఉద్యోగాలు",
      editorial_opinion: "సంపాదకీయం & అభిప్రాయం",
      related_news: "సంబంధిత కథనాలు",

      // UI Actions & Buttons
      read_more: "ఇంకా చదవండి →",
      view_all: "అన్నీ చూడండి →",
      back_to_home: "← హోమ్‌పేజీకి వెళ్ళు",
      back_button: "← వెనుకకు",
      download_pdf: "⬇️ PDF డౌన్‌లోడ్ చేయండి",
      read_epaper: "📖 ఈ-పేపర్ చదవండి",
      share_article: "ఈ కథనాన్ని పంచుకోండి:",
      filter_all: "అన్నీ",

      // Empty States (Clean & Professional)
      empty_latest_news: "ప్రస్తుతం తాజా వార్తలు అందుబాటులో లేవు.",
      empty_category: "ఈ విభాగంలో వార్తలు ఇంకా అందుబాటులో లేవు.",
      empty_district: "ఈ జిల్లాకి సంబంధించి వార్తలు ఇంకా అందుబాటులో లేవు.",
      empty_search: "వార్తలు ఏవీ కనుగొనబడలేదు.",
      empty_epaper: "ఈ-పేపర్ సంచికలు ఇంకా అందుబాటులో లేవు.",
      empty_related: "సంబంధిత వార్తలు అందుబాటులో లేవు.",

      // E-Paper Specific
      epaper_title: "మమేక మహోదయం ప్రింట్ ఈ-పేపర్",
      epaper_subtitle: "ఈనాటి ప్రింట్ దినపత్రిక డిజిటల్ ఎడిషన్",
      epaper_archive_title: "గత సంచికల ఆర్కైవ్ (E-Paper Archive)",
      publication_date_label: "ప్రచురణ తేదీ:",
      edition_label: "సంచిక:",

      // Article Details
      byline_prefix: "రచయిత / డెస్క్:",
      published_on: "ప్రచురణ:",
      category_label: "విభాగం:",
      district_label: "జిల్లా:",

      // Footer
      footer_about_title: "మమేక మహోదయం",
      footer_about_desc: "సమాజ హితమే ధ్యేయంగా, నిష్పాక్షిక వార్తా కథనాలతో పాఠకులకు విశ్వసనీయ సమాచారాన్ని అందిస్తున్న తెలుగు దినపత్రిక.",
      footer_quick_links: "త్వరిత లింకులు",
      footer_epaper_desc: "రోజువారీ ప్రింట్ దినపత్రిక డిజిటల్ పిడిఎఫ్ రూపంలో అందుబాటులో ఉంటుంది.",
      footer_copyright: "సర్వ హక్కులూ ప్రత్యేకించబడ్డాయి."
    },

    en: {
      // Accessibility & Brand
      skip_link: "Skip to main content",
      brand_name_te: "MAMEKA MAHODAYAM",
      brand_prefix_te: "Mameka",
      brand_main_te: "Mahodhayam",
      brand_name_en: "MAMEKA MAHODAYAM",
      brand_tagline: "Telugu Daily Newspaper",
      brand_slogan: "Integrity in Words - Truth in News",

      // Utility & Header
      top_weather_placeholder: "Vijayawada: 31°C | Humidity: 68%",
      top_edition_placeholder: "Andhra Pradesh & Telangana Edition",
      top_epaper_link: "E-Paper",
      top_admin_link: "🔒 Admin CMS",
      main_site_link: "🌐 Main Website",

      // Navigation
      nav_home: "Home",
      nav_latest: "Latest News",
      nav_state: "Andhra Pradesh",
      nav_district: "Districts",
      nav_politics: "Politics",
      nav_national: "India & World",
      nav_cinema: "Cinema",
      nav_sports: "Sports",
      nav_education: "Education & Jobs",
      nav_tech: "Tech",
      nav_business: "Business",
      nav_editorial: "Editorial",
      nav_team: "Reporters",
      nav_editorial_team: "Editorial Team & Reporters",
      editorial_team_title: "Editorial Team & Reporters",
      nav_epaper: "E-Paper",
      nav_search: "Search",
      nav_more: "More ▾",

      // Search Bar
      search_placeholder: "Search news articles...",
      search_button: "Search",
      search_submit_aria: "Submit search query",
      search_bar_aria: "Website search",
      search_results_title: "Search Results",
      search_query_prefix: "Query:",

      // Section Headings
      breaking_news: "BREAKING NEWS",
      top_stories: "TOP STORIES",
      latest_news: "LATEST NEWS",
      state_news: "ANDHRA PRADESH & TELANGANA",
      district_news: "DISTRICT NEWS (26 AP DISTRICTS)",
      national_news: "INDIA & WORLD",
      cinema_news: "ENTERTAINMENT",
      sports_news: "SPORTS",
      education_news: "EDUCATION & CAREERS",
      tech_news: "TECHNOLOGY & INNOVATION",
      business_news: "BUSINESS & ECONOMY",
      editorial_opinion: "EDITORIAL & OPINION",
      related_news: "RELATED STORIES",

      // UI Actions & Buttons
      read_more: "Read Story →",
      view_all: "View All →",
      back_to_home: "← Back to Homepage",
      back_button: "← Back",
      download_pdf: "⬇️ Download PDF Edition",
      read_epaper: "📖 Read E-Paper",
      share_article: "Share Story:",
      filter_all: "All",

      // Empty States (Clean & Professional)
      empty_latest_news: "No news published yet.",
      empty_category: "No news available in this category yet.",
      empty_district: "No news available for this district yet.",
      empty_search: "No articles found.",
      empty_epaper: "No E-Paper editions available yet.",
      empty_related: "No related stories available.",

      // E-Paper Specific
      epaper_title: "Mameka Mahodhayam Digital Print Edition",
      epaper_subtitle: "Official Daily Newspaper Digital PDF Archive",
      epaper_archive_title: "Past Editions Archive",
      publication_date_label: "Publication Date:",
      edition_label: "Edition:",

      // Article Details
      byline_prefix: "By:",
      published_on: "Published:",
      category_label: "Category:",
      district_label: "District:",

      // Footer
      footer_about_title: "MAMEKA MAHODAYAM",
      footer_about_desc: "Independent Telugu Daily Newspaper committed to trustworthy, objective journalism.",
      footer_quick_links: "Quick Links",
      footer_epaper_desc: "Daily print edition available in digital PDF reader format.",
      footer_copyright: "All Rights Reserved."
    }
  };

  /**
   * Get active language code from URL query parameter or localStorage
   */
  function getLanguage() {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLang = searchParams.get('lang');
      if (urlLang === 'en' || urlLang === 'te') {
        localStorage.setItem('siteLanguage', urlLang);
        return urlLang;
      }
      const stored = localStorage.getItem('siteLanguage');
      if (stored === 'en' || stored === 'te') {
        return stored;
      }
    } catch (e) {}
    return 'te'; // Default: Telugu
  }

  /**
   * Set language preference and update DOM UI elements
   */
  function setLanguage(lang) {
    if (lang !== 'te' && lang !== 'en') lang = 'te';
    try {
      localStorage.setItem('siteLanguage', lang);
    } catch (e) {}

    document.documentElement.lang = lang;

    // Update active class on switcher buttons
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const targetLang = btn.getAttribute('data-lang-btn');
      if (targetLang === lang) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });

    // Translate DOM text elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
        el.textContent = TRANSLATIONS[lang][key];
      }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
        el.placeholder = TRANSLATIONS[lang][key];
      }
    });

    // Translate aria labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
        el.setAttribute('aria-label', TRANSLATIONS[lang][key]);
      }
    });

    // Dynamic header date in Asia/Kolkata timezone
    const headerDateEl = document.getElementById('header-date');
    if (headerDateEl) {
      try {
        const now = new Date();
        const opts = { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        headerDateEl.textContent = new Intl.DateTimeFormat(lang === 'en' ? 'en-IN' : 'te-IN', opts).format(now);
      } catch (e) {
        headerDateEl.textContent = new Date().toLocaleDateString();
      }
    }

    // Notify listeners if registered
    if (typeof window.onLanguageChanged === 'function') {
      window.onLanguageChanged(lang);
    }
  }

  /**
   * Return translated text for a specific key
   */
  function getText(key, fallback = '') {
    const lang = getLanguage();
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
      return TRANSLATIONS[lang][key];
    }
    if (TRANSLATIONS.te && TRANSLATIONS.te[key]) {
      return TRANSLATIONS.te[key];
    }
    return fallback || key;
  }

  /**
   * Bind click event listeners to language toggle buttons & nav dropdowns
   */
  function bindLanguageSwitchers() {
    document.addEventListener('click', function (e) {
      const langBtn = e.target.closest('[data-lang-btn]');
      if (langBtn) {
        const targetLang = langBtn.getAttribute('data-lang-btn');
        if (targetLang) {
          setLanguage(targetLang);
          if (window.MM_ContentAPI && typeof window.MM_ContentAPI.reload === 'function') {
            window.MM_ContentAPI.reload();
          }
        }
        return;
      }

      // NAV DROPDOWN CLICK TOGGLE LOGIC
      const dropdownBtn = e.target.closest('.nav-dropdown-btn');
      if (dropdownBtn) {
        e.preventDefault();
        e.stopPropagation();
        const parentDropdown = dropdownBtn.closest('.nav-dropdown');
        if (parentDropdown) {
          const isOpen = parentDropdown.classList.contains('open');
          document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
          if (!isOpen) {
            parentDropdown.classList.add('open');
            dropdownBtn.setAttribute('aria-expanded', 'true');
          } else {
            dropdownBtn.setAttribute('aria-expanded', 'false');
          }
        }
        return;
      }

      // Close dropdown when item inside menu is clicked or when clicked outside
      const dropdownItem = e.target.closest('.nav-dropdown-item');
      if (dropdownItem || !e.target.closest('.nav-dropdown-menu')) {
        document.querySelectorAll('.nav-dropdown.open').forEach(d => {
          d.classList.remove('open');
          const btn = d.querySelector('.nav-dropdown-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  function init() {
    bindLanguageSwitchers();
    const currentLang = getLanguage();
    setLanguage(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export global API
  window.MM_i18n = {
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    getText: getText,
    TRANSLATIONS: TRANSLATIONS
  };

})();
