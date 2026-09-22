/**
 * MAMEKA MAHODAYAM - Centralized Category Configuration
 * Authoritative single source of truth for all news categories.
 * Shared across Navigation Active State, Category Pages, Admin Panel & API.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MAMEKA_CATEGORIES = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  const CATEGORIES = [
    {
      id: 'state',
      slug: 'state',
      name_en: 'State News',
      name_te: 'రాష్ట్ర వార్తలు',
      navLabel_te: 'రాష్ట్రం',
      navLabel_en: 'State',
      aliases: ['ap-ts', 'andhra-pradesh', 'telangana'],
      order: 1
    },
    {
      id: 'district',
      slug: 'district',
      name_en: 'District News',
      name_te: 'జిల్లా వార్తలు',
      navLabel_te: 'జిల్లా',
      navLabel_en: 'District',
      aliases: ['districts', 'jilla'],
      order: 2
    },
    {
      id: 'politics',
      slug: 'politics',
      name_en: 'Politics & Analysis',
      name_te: 'రాజకీయాలు & విశ్లేషణలు',
      navLabel_te: 'రాజకీయాలు',
      navLabel_en: 'Politics',
      aliases: ['political'],
      order: 3
    },
    {
      id: 'national',
      slug: 'national-international',
      name_en: 'National & International News',
      name_te: 'దేశం & ప్రపంచం (జాతీయ & అంతర్జాతీయ)',
      navLabel_te: 'దేశం & ప్రపంచం',
      navLabel_en: 'National & Intl',
      aliases: ['national', 'international', 'world'],
      order: 4
    },
    {
      id: 'sports',
      slug: 'sports',
      name_en: 'Sports News',
      name_te: 'క్రీడా రంగం (క్రీడలు)',
      navLabel_te: 'క్రీడలు',
      navLabel_en: 'Sports',
      aliases: ['cricket', 'games'],
      order: 5
    },
    {
      id: 'cinema',
      slug: 'cinema',
      name_en: 'Cinema & Entertainment',
      name_te: 'సినిమా & వినోదం',
      navLabel_te: 'సినిమా',
      navLabel_en: 'Cinema',
      aliases: ['movies', 'entertainment', 'tollywood'],
      order: 6
    },
    {
      id: 'education',
      slug: 'education-jobs',
      name_en: 'Education & Jobs',
      name_te: 'విద్య & ఉద్యోగాలు',
      navLabel_te: 'విద్య & ఉద్యోగాలు',
      navLabel_en: 'Education & Jobs',
      aliases: ['edu-jobs', 'jobs', 'careers'],
      order: 7
    },
    {
      id: 'tech',
      slug: 'tech',
      name_en: 'Technical & Technology News',
      name_te: 'సాంకేతిక పరిజ్ఞానం & టెక్నాలజీ',
      navLabel_te: 'టెక్నాలజీ',
      navLabel_en: 'Tech',
      aliases: ['technology', 'technical', 'tech-news'],
      order: 8
    },
    {
      id: 'business',
      slug: 'business',
      name_en: 'Business & Economy News',
      name_te: 'వ్యాపార రంగం (బిజినెస్ & కామర్స్)',
      navLabel_te: 'బిజినెస్',
      navLabel_en: 'Business',
      aliases: ['economy', 'market', 'commerce', 'finance'],
      order: 9
    },
    {
      id: 'editorial',
      slug: 'editorial',
      name_en: 'Editorial & Opinion',
      name_te: 'సంపాదకీయం & వ్యాసాలు',
      navLabel_te: 'సంపాదకీయం',
      navLabel_en: 'Editorial',
      aliases: ['opinion'],
      order: 10
    }
  ];

  function getAllCategories() {
    return CATEGORIES;
  }

  function getCategoryByIdOrSlug(val) {
    if (!val) return null;
    const clean = String(val).toLowerCase().trim();
    return CATEGORIES.find(c =>
      c.id === clean ||
      c.slug === clean ||
      (c.aliases && c.aliases.includes(clean))
    ) || null;
  }

  return {
    categories: CATEGORIES,
    getAllCategories,
    getCategoryByIdOrSlug
  };
}));
