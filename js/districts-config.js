/**
 * MAMEKA MAHODAYAM - Centralized District Configuration
 * Authoritative single source of truth for all 26 Andhra Pradesh Districts + Telangana.
 * Shared across Navigation, Dropdown, Ingestion, Admin, Database & Routing.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MAMEKA_DISTRICTS = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  const AP_DISTRICTS = [
    {
      code: 'all',
      name_en: 'All Districts',
      name_te: 'అన్ని జిల్లాలు',
      slug: 'all',
      keywords: []
    },
    {
      code: 'anakapalli',
      name_en: 'Anakapalli',
      name_te: 'అనకాపల్లి',
      slug: 'anakapalli',
      keywords: ['anakapalli', 'అనకాపల్లి']
    },
    {
      code: 'anantapur',
      name_en: 'Anantapur',
      name_te: 'అనంతపురం',
      slug: 'anantapur',
      keywords: ['anantapur', 'అనంతపురం']
    },
    {
      code: 'annamayya',
      name_en: 'Annamayya',
      name_te: 'అన్నమయ్య',
      slug: 'annamayya',
      keywords: ['annamayya', 'అన్నమయ్య', 'rayachoty', 'రాజంపేట', 'రాయచోటి']
    },
    {
      code: 'asr',
      name_en: 'Alluri Sita Rama Raju (ASR)',
      name_te: 'అల్లూరి సీతారామరాజు (ASR)',
      slug: 'alluri-sita-rama-raju',
      aliases: ['asr'],
      keywords: ['asr', 'alluri', 'సీతారామరాజు', 'పాడేరు', 'అరకు']
    },
    {
      code: 'bapatla',
      name_en: 'Bapatla',
      name_te: 'బాపట్ల',
      slug: 'bapatla',
      keywords: ['bapatla', 'బాపట్ల', 'చీరాల', 'అద్దంకి']
    },
    {
      code: 'chittoor',
      name_en: 'Chittoor',
      name_te: 'చిత్తూరు',
      slug: 'chittoor',
      keywords: ['chittoor', 'చిత్తూరు', 'కుప్పం']
    },
    {
      code: 'konaseema',
      name_en: 'Dr. B.R. Ambedkar Konaseema',
      name_te: 'డాక్టర్ బి.ఆర్. అంబేద్కర్ కోనసీమ',
      slug: 'dr-br-ambedkar-konaseema',
      aliases: ['konaseema'],
      keywords: ['konaseema', 'కోనసీమ', 'అమలాపురం', 'ఆత్రేయపురం']
    },
    {
      code: 'east-godavari',
      name_en: 'East Godavari',
      name_te: 'తూర్పు గోదావరి',
      slug: 'east-godavari',
      aliases: ['rajamahendravaram', 'rajahmundry'],
      keywords: ['east godavari', 'తూర్పు గోదావరి', 'రాజమహేంద్రవరం', 'రాజమండ్రి']
    },
    {
      code: 'eluru',
      name_en: 'Eluru',
      name_te: 'ఏలూరు',
      slug: 'eluru',
      keywords: ['eluru', 'ఏలూరు', 'జంగారెడ్డిగూడెం']
    },
    {
      code: 'guntur',
      name_en: 'Guntur',
      name_te: 'గుంటూరు',
      slug: 'guntur',
      keywords: ['guntur', 'గుంటూరు', 'తెనాలి', 'మంగళగిరి']
    },
    {
      code: 'kakinada',
      name_en: 'Kakinada',
      name_te: 'కాకినాడ',
      slug: 'kakinada',
      keywords: ['kakinada', 'కాకినాడ', 'తుని', 'పెద్దాపురం']
    },
    {
      code: 'krishna',
      name_en: 'Krishna / Vijayawada (NTR)',
      name_te: 'కృష్ణా / విజయవాడ (ఎన్టీఆర్)',
      slug: 'krishna',
      aliases: ['vijayawada', 'ntr'],
      keywords: ['krishna', 'కృష్ణా', 'vijayawada', 'విజయవాడ', 'ntr', 'ఎన్టీఆర్', 'మచిలీపట్నం']
    },
    {
      code: 'kurnool',
      name_en: 'Kurnool',
      name_te: 'కర్నూలు',
      slug: 'kurnool',
      keywords: ['kurnool', 'కర్నూలు', 'ఆదోని']
    },
    {
      code: 'manyam',
      name_en: 'Parvathipuram Manyam',
      name_te: 'పార్వతీపురం మన్యం',
      slug: 'parvathipuram-manyam',
      aliases: ['manyam'],
      keywords: ['manyam', 'మన్యం', 'పార్వతీపురం', 'పాలకొండ']
    },
    {
      code: 'nandyal',
      name_en: 'Nandyal',
      name_te: 'నంద్యాల',
      slug: 'nandyal',
      keywords: ['nandyal', 'నంద్యాల', 'ఆళ్లగడ్డ', 'శ్రీశైలం']
    },
    {
      code: 'nellore',
      name_en: 'Sri Potti Sriramulu Nellore',
      name_te: 'శ్రీ పొట్టి శ్రీరాములు నెల్లూరు',
      slug: 'sri-potti-sriramulu-nellore',
      aliases: ['nellore'],
      keywords: ['nellore', 'నెల్లూరు', 'కావలి', 'గూడూరు']
    },
    {
      code: 'palnadu',
      name_en: 'Palnadu',
      name_te: 'పల్నాడు',
      slug: 'palnadu',
      keywords: ['palnadu', 'పల్నాడు', 'నరసరావుపేట', 'పిడుగురాళ్ల', 'మాచర్ల']
    },
    {
      code: 'prakasam',
      name_en: 'Prakasam',
      name_te: 'ప్రకాశం',
      slug: 'prakasam',
      keywords: ['prakasam', 'ప్రకాశం', 'ఒంగోలు', 'మార్కాపురం']
    },
    {
      code: 'srikakulam',
      name_en: 'Srikakulam',
      name_te: 'శ్రీకాకుళం',
      slug: 'srikakulam',
      keywords: ['srikakulam', 'శ్రీకాకుళం', 'టెక్కలి', 'పలాస']
    },
    {
      code: 'sri-sathya-sai',
      name_en: 'Sri Sathya Sai',
      name_te: 'శ్రీ సత్యసాయి',
      slug: 'sri-sathya-sai',
      keywords: ['sri sathya sai', 'సత్యసాయి', 'పుట్టపర్తి', 'ధర్మవరం', 'హిందూపురం']
    },
    {
      code: 'tirupati',
      name_en: 'Tirupati',
      name_te: 'తిరుపతి',
      slug: 'tirupati',
      keywords: ['tirupati', 'తిరుపతి', 'శ్రీకాళహస్తి', 'సూళ్లూరుపేట']
    },
    {
      code: 'visakhapatnam',
      name_en: 'Visakhapatnam',
      name_te: 'విశాఖపట్నం',
      slug: 'visakhapatnam',
      keywords: ['visakhapatnam', 'విశాఖపట్నం', 'వైజాగ్', 'గాజువాక']
    },
    {
      code: 'vizianagaram',
      name_en: 'Vizianagaram',
      name_te: 'విజయనగరం',
      slug: 'vizianagaram',
      keywords: ['vizianagaram', 'విజయనగరం', 'బొబ్బిలి']
    },
    {
      code: 'west-godavari',
      name_en: 'West Godavari',
      name_te: 'పశ్చిమ గోదావరి',
      slug: 'west-godavari',
      aliases: ['bhimavaram'],
      keywords: ['west godavari', 'పశ్చిమ గోదావరి', 'భీమవరం', 'నరసాపురం', 'తాడేపల్లిగూడెం']
    },
    {
      code: 'kadapa',
      name_en: 'YSR Kadapa',
      name_te: 'వైఎస్సార్ కడప',
      slug: 'ysr-kadapa',
      aliases: ['kadapa'],
      keywords: ['kadapa', 'కడప', 'ప్రొద్దుటూరు', 'పులివెందుల']
    },
    {
      code: 'hyderabad',
      name_en: 'Hyderabad / Telangana',
      name_te: 'హైదరాబాద్ / తెలంగాణ',
      slug: 'hyderabad',
      keywords: ['hyderabad', 'హైదరాబాద్', 'telangana', 'తెలంగాణ', 'సికింద్రాబాద్']
    }
  ];

  function normalizeSlug(str) {
    if (!str) return '';
    return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getAllDistricts() {
    return AP_DISTRICTS;
  }

  function getDistrictByCodeOrSlug(val) {
    if (!val) return null;
    const clean = String(val).toLowerCase().trim();
    const norm = normalizeSlug(clean);
    return AP_DISTRICTS.find(d => 
      d.code === clean || 
      d.slug === clean || 
      d.slug === norm ||
      (d.aliases && d.aliases.includes(clean)) ||
      normalizeSlug(d.name_en) === norm
    ) || null;
  }

  function findDistrictByText(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const dist of AP_DISTRICTS) {
      if (dist.code === 'all') continue;
      if (dist.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return dist;
      }
    }
    return null;
  }

  return {
    districts: AP_DISTRICTS,
    getAllDistricts,
    getDistrictByCodeOrSlug,
    findDistrictByText,
    normalizeSlug
  };
}));
