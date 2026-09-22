# MAMEKA MAHODAYAM (మమేక మహోదయం) - Digital Newspaper Platform

Welcome to **MAMEKA MAHODAYAM**, a high-performance, accessible, content-ready independent Telugu digital newspaper platform.

---

## 📌 Project Overview

This codebase provides the complete architectural framework, layout grid system, news card components, accessibility foundations, mobile-first responsive design, and **bilingual Telugu / English i18n architecture** for a modern daily newspaper.

> [!IMPORTANT]
> **Strict Content Integrity Standard**: This platform currently contains **ZERO fabricated news content, fake statistics, or invented contact details**. All content blocks use clean, professional, neutral structural placeholders (`[NEWS HEADLINE PLACEHOLDER]`, `[వార్తల శీర్షిక ప్లేస్‌హోల్డర్]`) awaiting real CMS or API integration.

---

## 🌐 Bilingual i18n Architecture (Telugu Default / English Optional)

The website features a content-agnostic, centralized internationalization system (`js/i18n.js`):

- **Default Language**: Telugu (`te`). Loads completely in Telugu UI by default.
- **One-Click Switcher**: `తెలుగు | English` switcher situated in top utility header bar across all 12 pages.
- **State Management & Persistence**:
  - Remembers user choice across navigations via `localStorage` (`mm_lang`) and URL parameter sync (`?lang=en` | `?lang=te`).
  - Automatically updates `html[lang]`, `data-i18n` text nodes, `data-i18n-placeholder` inputs, and `data-i18n-aria` labels.
- **Dynamic Font Stacks**:
  - `:lang(te)` -> `Noto Serif Telugu` & `Noto Sans Telugu`
  - `:lang(en)` -> `Lora` & `Inter`
- **Bilingual Content Data Model Helper**:
  ```js
  const article = {
    title: { te: "తెలుగు శీర్షిక", en: "English Title" },
    summary: { te: "సంక్షిప్త సారాంశం", en: "Executive Summary" },
    content: { te: "వార్తా వివరాలు", en: "Full Article Content" }
  };
  const title = MM_i18n.getBilingualContent(article.title);
  ```

---

## 🏛 Architecture & File Directory

```
PROJECT-MM/
│
├── INDEX.html            -> Official Newspaper Homepage (15 structural sections)
├── article.html          -> Article Detail Template (70% main body / 30% sidebar layout)
├── category.html         -> Reusable Category Listing Template (State, Politics, Sports, etc.)
├── district.html         -> Reusable District Listing Template with tab selector
├── search.html           -> Search Interface with 3 visual states (Initial, Results, Empty)
├── epaper.html           -> Digital E-Paper & Past Archives Viewer Platform
│
├── about.html            -> Publication background & mission structural page
├── contact.html          -> Editorial contact form & office locations structural page
├── editorial-team.html   -> Leadership & journalistic ethics structural page
├── advertise.html        -> Media kit & print/digital advertising options page
├── privacy.html          -> Data privacy policy structural clauses page
├── terms.html            -> Terms of service & legal conditions structural page
│
├── js/
│   └── i18n.js           -> Centralized bilingual translation dictionary & state manager
│
├── styles/
│   └── design-system.css -> Single authoritative Design System (tokens, fonts, components, a11y)
│
└── README.md             -> Developer architecture guide & API integration sitemap
```

---

## 🎨 Master Print Visual Design System & Color Tokens

The entire platform visual identity is crafted directly from the authentic **MAMEKA MAHODAYAM** print newspaper edition (`media_1789132934497.jpg`):

- **Master Brand Color Palette**:
  - `--color-brand-magenta`: `#d81b7a` (Primary Title Pink/Magenta Print Tone)
  - `--color-brand-red`: `#cc0000` (Editorial Red Bar & Section Accents)
  - `--color-brand-gold`: `#ffcc00` (Golden Yellow Highlights & Motto Panels)
  - `--color-brand-green`: `#009944` (Tagline Motto Green)
  - `--color-brand-purple`: `#7b1fa2` (Editorial Pill Badge Purple)
  - `--color-brand-secondary`: `#1a1a1a` (Dark Utility Bar)
  - `--color-bg-main`: `#fdfbf7` (Warm Newsprint Surface)
- **Visual Typography & 3D Title Effect**:
  - `.brand-logo-3d` for authentic print 3D title text effect
  - Bilingual Typography: Telugu (`"Noto Serif Telugu"`, `"Noto Sans Telugu"`), English (`"Lora"`, `"Inter"`)
- **Standardized Master Masthead**:
  - Every page features the exact print header container with top utility bar, 3D title, Motto (`అక్షరంలో ఆత్మీయత - వార్తల్లో వాస్తవం`), Edition badge (`తెలుగు దినపత్రిక`), Editorial red metadata bar (`సంపుటి: 01 | సంచిక: 09...`), and circulation strip.
- **Reusable Card Components**:
  - `FeaturedNewsCard` (`.card-featured`) -> Large hero story card with 16:9 ratio
  - `StandardNewsCard` (`.card-standard`) -> 4-column responsive grid card
  - `CompactNewsCard` (`.card-compact`) -> 50px square thumbnail trending item
  - `HorizontalNewsCard` (`.card-horizontal`) -> Thumbnail left, headline right
  - `SectionNewsCard` (`.card-section`) -> Colored top accent bar
  - `LatestNewsItem` (`.card-latest-item`) -> Live ticker feed item

---

## 🔌 CMS & API Integration Hooks

All pages are prepared for direct integration with REST APIs, GraphQL, or headless CMS platforms (Strapi, WordPress, Contentful):

1. **Category Routing (`category.html`)**:
   - URL schema: `category.html?c=state` or `category.html?c=politics`
2. **District Routing (`district.html`)**:
   - URL schema: `district.html?d=hyderabad` or `district.html?d=vijayawada`
3. **Search State Machine (`search.html`)**:
   - Fires `switchSearchState('initial' | 'results' | 'empty')` to toggle visual search UI states.
4. **E-Paper Viewer Hook (`epaper.html`)**:
   - Fires `toggleEpaperViewer(true | false)` to display the interactive PDF.js / tiled canvas container (`#epaperViewerContainer`).

---

## ♿ Accessibility (a11y) Standards

- **Skip Link**: Every page includes `<a href="#main-content" class="skip-link">` for keyboard users.
- **Landmark Roles**: Every page implements explicit HTML5 + ARIA landmarks (`role="banner"`, `role="navigation"`, `role="main"`, `role="contentinfo"`, `role="complementary"`).
- **Keyboard Navigation**: High-contrast `:focus-visible` outline rings (`2px solid var(--color-brand-primary)`).
- **Touch-Friendly Controls**: Interactive elements maintain a minimum 44px tap target height across mobile viewports.

---

## 🛠 Developer Verification Command

To verify HTML tag balancing, CSS token definitions, skip links, and zero-fake-content compliance across all 12 project pages, run:

```bash
node C:\Users\hplap\.gemini\antigravity\brain\2252a81c-beb0-4095-a27d-5bae4b45b650\scratch\verify_project.js
```
