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

  const AP_MANDALS = {
    'anakapalli': [
      { name_te: 'అనకాపల్లి', name_en: 'Anakapalli' },
      { name_te: 'అచ్యుతాపురం', name_en: 'Achyutapuram' },
      { name_te: 'కశింకోట', name_en: 'Kasimkota' },
      { name_te: 'పరవాడ', name_en: 'Parawada' },
      { name_te: 'చోడవరం', name_en: 'Chodavaram' },
      { name_te: 'దేవరాపల్లి', name_en: 'Devarapalli' },
      { name_te: 'కె.కోటపాడు', name_en: 'K.Kotapadu' },
      { name_te: 'మాడుగుల', name_en: 'Madugula' },
      { name_te: 'చీడికాడ', name_en: 'Cheedikada' },
      { name_te: 'రావికమతం', name_en: 'Ravikamatham' },
      { name_te: 'రోలుగుంట', name_en: 'Rolugunta' },
      { name_te: 'నర్సీపట్నం', name_en: 'Narsipatnam' },
      { name_te: 'గొలుగొండ', name_en: 'Golugonda' },
      { name_te: 'కోటవురట్ల', name_en: 'Kotauratla' },
      { name_te: 'మాకవరపాలెం', name_en: 'Makavarapalem' },
      { name_te: 'నాతవరం', name_en: 'Nathavaram' },
      { name_te: 'నక్కపల్లి', name_en: 'Nakkapalli' },
      { name_te: 'పాయకరావుపేట', name_en: 'Payakaraopeta' },
      { name_te: 'ఎలమంచిలి', name_en: 'Yelamanchili' },
      { name_te: 'రాంబిల్లి', name_en: 'Rambilli' },
      { name_te: 'ఎస్.రాయవరం', name_en: 'S.Rayavaram' },
      { name_te: 'మునగపాక', name_en: 'Munagapaka' },
      { name_te: 'బుచ్చయ్యపేట', name_en: 'Butchayyapeta' }
    ],
    'anantapur': [
      { name_te: 'అనంతపురం అర్బన్', name_en: 'Anantapur Urban' },
      { name_te: 'అనంతపురం రూరల్', name_en: 'Anantapur Rural' },
      { name_te: 'ఆత్మకూరు', name_en: 'Atmakur' },
      { name_te: 'గార్లదిన్నె', name_en: 'Garladinne' },
      { name_te: 'కూడేరు', name_en: 'Kudair' },
      { name_te: 'శింగనమల', name_en: 'Singanamala' },
      { name_te: 'తాడిపత్రి', name_en: 'Tadipatri' },
      { name_te: 'పెద్దవడుగూరు', name_en: 'Peddavadugur' },
      { name_te: 'యాడికి', name_en: 'Yadiki' },
      { name_te: 'యల్లనూరు', name_en: 'Yellanur' },
      { name_te: 'పుట్లూరు', name_en: 'Putlur' },
      { name_te: 'గుంతకల్లు', name_en: 'Guntakal' },
      { name_te: 'గుత్తి', name_en: 'Gooty' },
      { name_te: 'పామిడి', name_en: 'Pamidi' },
      { name_te: 'రాయదుర్గం', name_en: 'Rayadurg' },
      { name_te: 'డి.హీరేహాళ్', name_en: 'D.Hirehal' },
      { name_te: 'కణేకల్లు', name_en: 'Kanekal' },
      { name_te: 'బొమ్మనహాళ్', name_en: 'Bommanahal' },
      { name_te: 'గుమ్మఘట్ట', name_en: 'Gummagatta' },
      { name_te: 'ఉరవకొండ', name_en: 'Uravakonda' },
      { name_te: 'బెళుగుప్ప', name_en: 'Beluguppa' },
      { name_te: 'వజ్రకరూరు', name_en: 'Vajrakarur' },
      { name_te: 'విడపనకల్లు', name_en: 'Vidapanakal' },
      { name_te: 'కళ్యాణదుర్గం', name_en: 'Kalyandurg' },
      { name_te: 'బ్రహ్మసముద్రం', name_en: 'Brahmasamudram' },
      { name_te: 'శెట్టూరు', name_en: 'Settur' },
      { name_te: 'కుందుర్పి', name_en: 'Kundurpi' },
      { name_te: 'కంబదూరు', name_en: 'Kambadur' }
    ],
    'annamayya': [
      { name_te: 'రాయచోటి', name_en: 'Rayachoti' },
      { name_te: 'గాలివీడు', name_en: 'Galiveedu' },
      { name_te: 'లక్కిరెడ్డిపల్లి', name_en: 'Lakkireddypalli' },
      { name_te: 'రామాపురం', name_en: 'Ramapuram' },
      { name_te: 'సంబేపల్లి', name_en: 'Sambepalli' },
      { name_te: 'చిన్నమండెం', name_en: 'Chinnamandem' },
      { name_te: 'పీలేరు', name_en: 'Pileru' },
      { name_te: 'గుర్రంకొండ', name_en: 'Gurramkonda' },
      { name_te: 'కలకడ', name_en: 'Kalakada' },
      { name_te: 'కంభంవారిపల్లె', name_en: 'Kambhamvaripalle' },
      { name_te: 'వాల్మీకిపురం', name_en: 'Valmikipuram' },
      { name_te: 'కే.వి.పల్లె', name_en: 'K.V.Palle' },
      { name_te: 'మదనపల్లె', name_en: 'Madanapalle' },
      { name_te: 'నిమ్మనపల్లె', name_en: 'Nimmanapalle' },
      { name_te: 'రామసముద్రం', name_en: 'Ramasamudram' },
      { name_te: 'తంబళ్లపల్లె', name_en: 'Thamballapalle' },
      { name_te: 'మొలకలచెరువు', name_en: 'Molakalacheruvu' },
      { name_te: 'పెద్దమండ్యం', name_en: 'Peddamandyam' },
      { name_te: 'కురబలకోట', name_en: 'Kurabalakota' },
      { name_te: 'బి.కొత్తకోట', name_en: 'B.Kothakota' },
      { name_te: 'పెద్దతిప్పసముద్రం', name_en: 'Peddathippasamudram' },
      { name_te: 'రాజంపేట', name_en: 'Rajampet' },
      { name_te: 'ఒంటిమిట్ట', name_en: 'Vontimitta' },
      { name_te: 'సిద్దవటం', name_en: 'Siddavatam' },
      { name_te: 'నందలూరు', name_en: 'Nandalur' },
      { name_te: 'పెనగలూరు', name_en: 'Penagalur' },
      { name_te: 'పుల్లంపేట', name_en: 'Pullampeta' },
      { name_te: 'ఓబులవారిపల్లె', name_en: 'Obulavaripalle' },
      { name_te: 'రైల్వే కోడూరు', name_en: 'Railway Koduru' }
    ],
    'asr': [
      { name_te: 'పాడేరు', name_en: 'Paderu' },
      { name_te: 'అరకు వ్యాలీ', name_en: 'Araku Valley' },
      { name_te: 'అనంతగిరి', name_en: 'Ananthagiri' },
      { name_te: 'డుంబ్రిగుడ', name_en: 'Dumbriguda' },
      { name_te: 'హుకుంపేట', name_en: 'Hukumpeta' },
      { name_te: 'పెదబయలు', name_en: 'Pedabayalu' },
      { name_te: 'ముంచంగిపుట్టు', name_en: 'Munchingi Puttu' },
      { name_te: 'జి.మాడుగుల', name_en: 'G.Madugula' },
      { name_te: 'చింతపల్లి', name_en: 'Chintapalli' },
      { name_te: 'గూడెం కొత్తవీధి', name_en: 'Gudem Kotha Veedhi' },
      { name_te: 'కొయ్యూరు', name_en: 'Koyyuru' },
      { name_te: 'రంపచోడవరం', name_en: 'Rampachodavaram' },
      { name_te: 'దేవీపట్నం', name_en: 'Devipatnam' },
      { name_te: 'వై.రామవరం', name_en: 'Y.Ramavaram' },
      { name_te: 'అడ్డతీగల', name_en: 'Addateegala' },
      { name_te: 'గంగవరం', name_en: 'Gangavaram' },
      { name_te: 'మారేడుమిల్లి', name_en: 'Maredumilli' },
      { name_te: 'రాజవొమ్మంగి', name_en: 'Rajavommangi' },
      { name_te: 'కూనవరం', name_en: 'Koonavaram' },
      { name_te: 'చింతూరు', name_en: 'Chintoor' },
      { name_te: 'వీ.ఆర్.పురం', name_en: 'V.R.Puram' },
      { name_te: 'ఎటపాక', name_en: 'Etapaka' }
    ],
    'bapatla': [
      { name_te: 'బాపట్ల', name_en: 'Bapatla' },
      { name_te: 'పిట్టలవానిపాలెం', name_en: 'Pittalavanipalem' },
      { name_te: 'కర్లపాలెం', name_en: 'Karlapalem' },
      { name_te: 'నిజాంపట్నం', name_en: 'Nizampatnam' },
      { name_te: 'నగరం', name_en: 'Nagaram' },
      { name_te: 'చెరుకుపల్లి', name_en: 'Cherukupalli' },
      { name_te: 'భట్టిప్రోలు', name_en: 'Bhattiprolu' },
      { name_te: 'వేమూరు', name_en: 'Vemuru' },
      { name_te: 'కొల్లూరు', name_en: 'Kollur' },
      { name_te: 'అమృతలూరు', name_en: 'Amruthalur' },
      { name_te: 'రేపల్లె', name_en: 'Repalle' },
      { name_te: 'చీరాల', name_en: 'Chirala' },
      { name_te: 'వేటపాలెం', name_en: 'Vetapalem' },
      { name_te: 'చినగంజాం', name_en: 'Chinaganjam' },
      { name_te: 'ఇంకొల్లు', name_en: 'Inkollu' },
      { name_te: 'కారంచేడు', name_en: 'Karamchedu' },
      { name_te: 'పర్చూరు', name_en: 'Parchur' },
      { name_te: 'యద్దనపూడి', name_en: 'Yaddanapudi' },
      { name_te: 'అద్దంకి', name_en: 'Addanki' },
      { name_te: 'జే.పంగులూరు', name_en: 'J.Panguluru' },
      { name_te: 'కొరిశపాడు', name_en: 'Korisapadu' },
      { name_te: 'సంతమాగులూరు', name_en: 'Santhamaguluru' },
      { name_te: 'బల్లికురవ', name_en: 'Ballikurava' },
      { name_te: 'మార్టూరు', name_en: 'Martur' }
    ],
    'chittoor': [
      { name_te: 'చిత్తూరు అర్బన్', name_en: 'Chittoor Urban' },
      { name_te: 'చిత్తూరు రూరల్', name_en: 'Chittoor Rural' },
      { name_te: 'గుడిపాల', name_en: 'Gudipala' },
      { name_te: 'గంగాధర నెల్లూరు', name_en: 'Gangadhara Nellore' },
      { name_te: 'వెదురుకుప్పం', name_en: 'Vedurukuppam' },
      { name_te: 'ఎస్.ఆర్.పురం', name_en: 'S.R.Puram' },
      { name_te: 'కార్వేటినగరం', name_en: 'Karvetinagar' },
      { name_te: 'పెనుమూరు', name_en: 'Penumuru' },
      { name_te: 'నగరి', name_en: 'Nagari' },
      { name_te: 'విజయపురం', name_en: 'Vijayapuram' },
      { name_te: 'నిండ్ర', name_en: 'Nindra' },
      { name_te: 'పుత్తూరు', name_en: 'Puttur' },
      { name_te: 'వడమాలపేట', name_en: 'Vadamalapeta' },
      { name_te: 'పలమనేరు', name_en: 'Palamaner' },
      { name_te: 'బైరెడ్డిపల్లె', name_en: 'Baireddipalle' },
      { name_te: 'వి.కోట', name_en: 'V.Kota' },
      { name_te: 'శాంతిపురం', name_en: 'Santhipuram' },
      { name_te: 'గుడుపల్లె', name_en: 'Gudupalle' },
      { name_te: 'కుప్పం', name_en: 'Kuppam' },
      { name_te: 'రామకుప్పం', name_en: 'Ramakuppam' },
      { name_te: 'బంగారుపాళ్యం', name_en: 'Bangarupalyam' },
      { name_te: 'తవణంపల్లె', name_en: 'Thavanampalle' },
      { name_te: 'పుంగనూరు', name_en: 'Punganur' },
      { name_te: 'సోమల', name_en: 'Somala' },
      { name_te: 'చౌడేపల్లె', name_en: 'Chowdepalle' },
      { name_te: 'సదుం', name_en: 'Sadum' },
      { name_te: 'రొంపిచర్ల', name_en: 'Rompicherla' },
      { name_te: 'పులిచెర్ల', name_en: 'Pulicherla' },
      { name_te: 'ఐరాల', name_en: 'Irala' }
    ],
    'konaseema': [
      { name_te: 'అమలాపురం', name_en: 'Amalapuram' },
      { name_te: 'అల్లవరం', name_en: 'Allavaram' },
      { name_te: 'ఉప్పలగుప్తం', name_en: 'Uppalaguptam' },
      { name_te: 'ఐ.పోలవరం', name_en: 'I.Polavaram' },
      { name_te: 'ముమ్మిడివరం', name_en: 'Mummidivaram' },
      { name_te: 'కాట్రేనికోన', name_en: 'Katrenikona' },
      { name_te: 'రావులపాలెం', name_en: 'Ravulapalem' },
      { name_te: 'కొత్తపేట', name_en: 'Kothapeta' },
      { name_te: 'ఆత్రేయపురం', name_en: 'Atreyapuram' },
      { name_te: 'ఆలమూరు', name_en: 'Alamuru' },
      { name_te: 'పి.గన్నవరం', name_en: 'P.Gannavaram' },
      { name_te: 'అంబాజీపేట', name_en: 'Ambajipeta' },
      { name_te: 'అయినవిల్లి', name_en: 'Ainavilli' },
      { name_te: 'రాజోలు', name_en: 'Razole' },
      { name_te: 'మలికిపురం', name_en: 'Malikipuram' },
      { name_te: 'సఖినేటిపల్లి', name_en: 'Sakhinetipalli' },
      { name_te: 'రామచంద్రపురం', name_en: 'Ramachandrapuram' },
      { name_te: 'కె.గంగవరం', name_en: 'K.Gangavaram' },
      { name_te: 'కపిలేశ్వరపురం', name_en: 'Kapileswarapuram' },
      { name_te: 'మండపేట', name_en: 'Mandapeta' },
      { name_te: 'రాయవరం', name_en: 'Rayavaram' }
    ],
    'east-godavari': [
      { name_te: 'రాజమహేంద్రవరం అర్బన్', name_en: 'Rajamahendravaram Urban' },
      { name_te: 'రాజమహేంద్రవరం రూరల్', name_en: 'Rajamahendravaram Rural' },
      { name_te: 'కడియం', name_en: 'Kadiam' },
      { name_te: 'రాజానగరం', name_en: 'Rajanagaram' },
      { name_te: 'సీతానగరం', name_en: 'Seethanagaram' },
      { name_te: 'కోరుకొండ', name_en: 'Korukonda' },
      { name_te: 'గోకవరం', name_en: 'Gokavaram' },
      { name_te: 'అనపర్తి', name_en: 'Anaparthi' },
      { name_te: 'బిక్కవోలు', name_en: 'Biccavolu' },
      { name_te: 'రంగంపేట', name_en: 'Rangampeta' },
      { name_te: 'కొవ్వూరు', name_en: 'Kovvur' },
      { name_te: 'చాగల్లు', name_en: 'Chagallu' },
      { name_te: 'తాళ్లపూడి', name_en: 'Tallapudi' },
      { name_te: 'నిడదవోలు', name_en: 'Nidadavole' },
      { name_te: 'పెరవలి', name_en: 'Peravali' },
      { name_te: 'ఉండ్రాజవరం', name_en: 'Undrajavaram' },
      { name_te: 'దేవరపల్లి', name_en: 'Devarapalli' },
      { name_te: 'గోపాలపురం', name_en: 'Gopalapuram' },
      { name_te: 'నల్లజర్ల', name_en: 'Nallajerla' }
    ],
    'eluru': [
      { name_te: 'ఏలూరు', name_en: 'Eluru' },
      { name_te: 'దెందులూరు', name_en: 'Denduluru' },
      { name_te: 'పెదవేగి', name_en: 'Pedavegi' },
      { name_te: 'పెదపాడు', name_en: 'Pedapadu' },
      { name_te: 'భీమడోలు', name_en: 'Bhimadole' },
      { name_te: 'నిడమర్రు', name_en: 'Nidamarru' },
      { name_te: 'ఉంగుటూరు', name_en: 'Unguturu' },
      { name_te: 'ద్వారకా తిరుమల', name_en: 'Dwaraka Tirumala' },
      { name_te: 'కామవరపుకోట', name_en: 'Kamavarapukota' },
      { name_te: 'జంగారెడ్డిగూడెం', name_en: 'Jangareddigudem' },
      { name_te: 'జీలుగుమిల్లి', name_en: 'Jeelugu Milli' },
      { name_te: 'బుట్టాయగూడెం', name_en: 'Buttayagudem' },
      { name_te: 'పోలవరం', name_en: 'Polavaram' },
      { name_te: 'కుక్కునూరు', name_en: 'Kukunoor' },
      { name_te: 'వేలేరుపాడు', name_en: 'Velairpadu' },
      { name_te: 'టి.నర్సాపురం', name_en: 'T.Narsapuram' },
      { name_te: 'చింతలపూడి', name_en: 'Chintalapudi' },
      { name_te: 'లింగపాలెం', name_en: 'Lingapalem' },
      { name_te: 'ముసునూరు', name_en: 'Musunuru' },
      { name_te: 'నూజివీడు', name_en: 'Nuzvid' },
      { name_te: 'బాపులపాడు', name_en: 'Bapulapadu' },
      { name_te: 'చాట్రాయి', name_en: 'Chatrai' },
      { name_te: 'ఆగిరిపల్లి', name_en: 'Agiripalli' },
      { name_te: 'కైకలూరు', name_en: 'Kaikalur' },
      { name_te: 'కలిదిండి', name_en: 'Kalidindi' },
      { name_te: 'మండవల్లి', name_en: 'Mandavalli' },
      { name_te: 'ముదినేపల్లి', name_en: 'Mudinepalli' }
    ],
    'guntur': [
      { name_te: 'గుంటూరు తూర్పు (East)', name_en: 'Guntur East' },
      { name_te: 'గుంటూరు పశ్చిమ (West)', name_en: 'Guntur West' },
      { name_te: 'గుంటూరు రూరల్', name_en: 'Guntur Rural' },
      { name_te: 'తెనాలి', name_en: 'Tenali' },
      { name_te: 'కొల్లిపర', name_en: 'Kollipara' },
      { name_te: 'పొన్నూరు', name_en: 'Ponnur' },
      { name_te: 'చేబ్రోలు', name_en: 'Chebrolu' },
      { name_te: 'మంగళగిరి', name_en: 'Mangalagiri' },
      { name_te: 'తాడేపల్లి', name_en: 'Tadepalli' },
      { name_te: 'తుళ్లూరు', name_en: 'Thullur' },
      { name_te: 'తాడికొండ', name_en: 'Tadikonda' },
      { name_te: 'మేడికొండూరు', name_en: 'Medikonduru' },
      { name_te: 'ఫిరంగిపురం', name_en: 'Phirangipuram' },
      { name_te: 'ప్రత్తిపాడు', name_en: 'Prathipadu' },
      { name_te: 'వట్టిచెరుకూరు', name_en: 'Vatticherukuru' },
      { name_te: 'పెదనందిపాడు', name_en: 'Pedanandipadu' },
      { name_te: 'కాకుమాను', name_en: 'Kakumanu' },
      { name_te: 'దుగ్గిరాల', name_en: 'Duggirala' }
    ],
    'kakinada': [
      { name_te: 'కాకినాడ అర్బన్', name_en: 'Kakinada Urban' },
      { name_te: 'కాకినాడ రూరల్', name_en: 'Kakinada Rural' },
      { name_te: 'సామర్లకోట', name_en: 'Samalkota' },
      { name_te: 'కరప', name_en: 'Karapa' },
      { name_te: 'కాజులూరు', name_en: 'Kajuluru' },
      { name_te: 'పెదపూడి', name_en: 'Pedapudi' },
      { name_te: 'తుని', name_en: 'Tuni' },
      { name_te: 'కోటనందూరు', name_en: 'Kotananduru' },
      { name_te: 'ప్రత్తిపాడు', name_en: 'Prathipadu' },
      { name_te: 'శంఖవరం', name_en: 'Sankhavaram' },
      { name_te: 'ఏలేశ్వరం', name_en: 'Yeleswaram' },
      { name_te: 'రౌతులపూడి', name_en: 'Rowthulapudi' },
      { name_te: 'తొండంగి', name_en: 'Thondangi' },
      { name_te: 'గొల్లప్రోలు', name_en: 'Gollaprolu' },
      { name_te: 'పిఠాపురం', name_en: 'Pithapuram' },
      { name_te: 'కొత్తపల్లి', name_en: 'Kothapalli' },
      { name_te: 'పెద్దాపురం', name_en: 'Peddapuram' },
      { name_te: 'జగ్గంపేట', name_en: 'Jaggampeta' },
      { name_te: 'కిర్లంపూడి', name_en: 'Kirlampudi' },
      { name_te: 'గండేపల్లి', name_en: 'Gandepalli' }
    ],
    'krishna': [
      { name_te: 'మచిలీపట్నం', name_en: 'Machilipatnam' },
      { name_te: 'బందరు రూరల్', name_en: 'Bandar Rural' },
      { name_te: 'గూడూరు', name_en: 'Guduru' },
      { name_te: 'పెడన', name_en: 'Pedana' },
      { name_te: 'బంటుమిల్లి', name_en: 'Bantumilli' },
      { name_te: 'కృత్తివెన్ను', name_en: 'Kruthivennu' },
      { name_te: 'నాగాయలంక', name_en: 'Nagayalanka' },
      { name_te: 'అవనిగడ్డ', name_en: 'Avanigadda' },
      { name_te: 'మోపిదేవి', name_en: 'Mopidevi' },
      { name_te: 'చల్లపల్లి', name_en: 'Challapalli' },
      { name_te: 'ఘంటసాల', name_en: 'Ghantasala' },
      { name_te: 'మోవ్వ', name_en: 'Movva' },
      { name_te: 'గుడ్లవల్లేరు', name_en: 'Gudlavalleru' },
      { name_te: 'పామర్రు', name_en: 'Pamarru' },
      { name_te: 'ఉయ్యూరు', name_en: 'Vuyyuru' },
      { name_te: 'పమిడిముక్కల', name_en: 'Pamidimukkala' },
      { name_te: 'తోట్లవల్లూరు', name_en: 'Thotlavalluru' },
      { name_te: 'విజయవాడ అర్బన్ (సెంట్రల్)', name_en: 'Vijayawada Central' },
      { name_te: 'విజయవాడ తూర్పు', name_en: 'Vijayawada East' },
      { name_te: 'విజయవాడ పశ్చిమ', name_en: 'Vijayawada West' },
      { name_te: 'విజయవాడ ఉత్తర', name_en: 'Vijayawada North' },
      { name_te: 'విజయవాడ రూరల్', name_en: 'Vijayawada Rural' },
      { name_te: 'ఇబ్రహీంపట్నం', name_en: 'Ibrahimpatnam' },
      { name_te: 'మైలవరం', name_en: 'Mylavaram' },
      { name_te: 'నందిగామ', name_en: 'Nandigama' },
      { name_te: 'జగ్గయ్యపేట', name_en: 'Jaggayyapeta' },
      { name_te: 'కంచికచర్ల', name_en: 'Kanchikacherla' },
      { name_te: 'తిరువూరు', name_en: 'Tiruvuru' },
      { name_te: 'గంపలగూడెం', name_en: 'Gampalagudem' }
    ],
    'kurnool': [
      { name_te: 'కర్నూలు అర్బన్', name_en: 'Kurnool Urban' },
      { name_te: 'కర్నూలు రూరల్', name_en: 'Kurnool Rural' },
      { name_te: 'ఓర్వకల్లు', name_en: 'Orvakal' },
      { name_te: 'కల్లూరు', name_en: 'Kallur' },
      { name_te: 'కోడుమూరు', name_en: 'Kodumur' },
      { name_te: 'గూడూరు', name_en: 'Gudur' },
      { name_te: 'సి.బెళగల్', name_en: 'C.Belagal' },
      { name_te: 'ఆదోని', name_en: 'Adoni' },
      { name_te: 'ఎమ్మిగనూరు', name_en: 'Yemmiganur' },
      { name_te: 'నందవరం', name_en: 'Nandavaram' },
      { name_te: 'హాలహర్వి', name_en: 'Halaharvi' },
      { name_te: 'హోళగుంద', name_en: 'Holagunda' },
      { name_te: 'కౌతాళం', name_en: 'Kowthalam' },
      { name_te: 'పెద్దకడుబూరు', name_en: 'Peddakadubur' },
      { name_te: 'మంత్రాలయం', name_en: 'Mantralayam' },
      { name_te: 'ఆలూరు', name_en: 'Alur' },
      { name_te: 'ఆస్పరి', name_en: 'Aspari' },
      { name_te: 'దేవనకొండ', name_en: 'Devanakonda' },
      { name_te: 'చిప్పగిరి', name_en: 'Chippagiri' },
      { name_te: 'పత్తికొండ', name_en: 'Pattikonda' },
      { name_te: 'మద్దికెర', name_en: 'Maddikera' },
      { name_te: 'తుగ్గలి', name_en: 'Tuggali' },
      { name_te: 'క్రిష్ణగిరి', name_en: 'Krishnagiri' },
      { name_te: 'వెల్దుర్తి', name_en: 'Veldurthi' }
    ],
    'manyam': [
      { name_te: 'పార్వతీపురం', name_en: 'Parvathipuram' },
      { name_te: 'సీతానగరం', name_en: 'Seethanagaram' },
      { name_te: 'బలిజిపేట', name_en: 'Balijipeta' },
      { name_te: 'సాలూరు', name_en: 'Salur' },
      { name_te: 'పాచిపెంట', name_en: 'Pachipenta' },
      { name_te: 'మక్కువ', name_en: 'Makkuva' },
      { name_te: 'కొమరాడ', name_en: 'Komarada' },
      { name_te: 'గుమ్మలక్ష్మీపురం', name_en: 'Gummalaxmipuram' },
      { name_te: 'కురుపాం', name_en: 'Kurupam' },
      { name_te: 'జియ్యమ్మవలస', name_en: 'Jiyyammavalasa' },
      { name_te: 'గరుగుబిల్లి', name_en: 'Garugubilli' },
      { name_te: 'పాలకొండ', name_en: 'Palakonda' },
      { name_te: 'సీతంపేట', name_en: 'Seethampeta' },
      { name_te: 'భామిని', name_en: 'Bhamini' },
      { name_te: 'వీరఘట్టం', name_en: 'Veeraghattam' }
    ],
    'nandyal': [
      { name_te: 'నంద్యాల', name_en: 'Nandyal' },
      { name_te: 'గోస్పాడు', name_en: 'Gospadu' },
      { name_te: 'సిరివెళ్ల', name_en: 'Sirivella' },
      { name_te: 'దొర్నిపాడు', name_en: 'Dornipadu' },
      { name_te: 'రుద్రవరం', name_en: 'Rudravaram' },
      { name_te: 'మహానంది', name_en: 'Mahanandi' },
      { name_te: 'ఆళ్లగడ్డ', name_en: 'Allagadda' },
      { name_te: 'చాగలమర్రి', name_en: 'Chagalamarri' },
      { name_te: 'ఉయ్యాలవాడ', name_en: 'Uyyalawada' },
      { name_te: 'కోవెలకుంట్ల', name_en: 'Koilkuntla' },
      { name_te: 'సంజామల', name_en: 'Sanjamala' },
      { name_te: 'కొలిమిగుండ్ల', name_en: 'Kolimigundla' },
      { name_te: 'బనగానపల్లె', name_en: 'Banaganapalle' },
      { name_te: 'అవుకు', name_en: 'Owk' },
      { name_te: 'పాణ్యం', name_en: 'Panyam' },
      { name_te: 'గడివేముల', name_en: 'Gadivemula' },
      { name_te: 'బేతంచెర్ల', name_en: 'Betamcherla' },
      { name_te: 'డోన్ (ద్రోణాచలం)', name_en: 'Dhone' },
      { name_te: 'ప్యాపిలి', name_en: 'Peapally' },
      { name_te: 'ఆత్మకూరు', name_en: 'Atmakur' },
      { name_te: 'శ్రీశైలం', name_en: 'Srisailam' },
      { name_te: 'జూపాడు బంగ్లా', name_en: 'Jupadu Bungalow' },
      { name_te: 'పగిడ్యాల', name_en: 'Pagidyala' },
      { name_te: 'కొత్తపల్లె', name_en: 'Kothapalle' },
      { name_te: 'పాములపాడు', name_en: 'Pamulapadu' },
      { name_te: 'మిడుతూరు', name_en: 'Midthur' },
      { name_te: 'బండిఆత్మకూరు', name_en: 'Bandi Atmakur' }
    ],
    'nellore': [
      { name_te: 'నెల్లూరు అర్బన్', name_en: 'Nellore Urban' },
      { name_te: 'నెల్లూరు రూరల్', name_en: 'Nellore Rural' },
      { name_te: 'కొవ్వూరు', name_en: 'Kovur' },
      { name_te: 'బుచ్చిరెడ్డిపాలెం', name_en: 'Buchireddipalem' },
      { name_te: 'ఇందుకూరుపేట', name_en: 'Indukurpet' },
      { name_te: 'తోటపల్లిగూడూరు', name_en: 'Thotapalligudur' },
      { name_te: 'ముత్తుకూరు', name_en: 'Muthukur' },
      { name_te: 'వెంకటాచలం', name_en: 'Venkatachalam' },
      { name_te: 'మానూరు', name_en: 'Manubolu' },
      { name_te: 'కావలి', name_en: 'Kavali' },
      { name_te: 'బోగోలు', name_en: 'Bogole' },
      { name_te: 'అల్లూరు', name_en: 'Allur' },
      { name_te: 'విడవలూరు', name_en: 'Vidavalur' },
      { name_te: 'దగదర్తి', name_en: 'Dagadarthi' },
      { name_te: 'జలదంకి', name_en: 'Jaladanki' },
      { name_te: 'కలువాయి', name_en: 'Kaluvoya' },
      { name_te: 'రాపూరు', name_en: 'Rapur' },
      { name_te: 'సైదాపురం', name_en: 'Sydapuram' },
      { name_te: 'పొదలకూరు', name_en: 'Podalakur' },
      { name_te: 'అనంతసాగరం', name_en: 'Ananthasagaram' },
      { name_te: 'ఆత్మకూరు', name_en: 'Atmakur' },
      { name_te: 'చేజర్ల', name_en: 'Chejerla' },
      { name_te: 'మర్రిపాడు', name_en: 'Marripadu' },
      { name_te: 'సంగం', name_en: 'Sangam' },
      { name_te: 'ఏఎస్ పేట', name_en: 'Anumasamudrampeta' },
      { name_te: 'ఉదయగిరి', name_en: 'Udayagiri' },
      { name_te: 'వరికుంటపాడు', name_en: 'Varikuntapadu' },
      { name_te: 'సీతారామపురం', name_en: 'Seetharamapuram' },
      { name_te: 'కొండాపురం', name_en: 'Kondapuram' },
      { name_te: 'వింజమూరు', name_en: 'Vinjamur' }
    ],
    'palnadu': [
      { name_te: 'నరసరావుపేట', name_en: 'Narasaraopet' },
      { name_te: 'రొంపిచర్ల', name_en: 'Rompicherla' },
      { name_te: 'వినుకొండ', name_en: 'Vinukonda' },
      { name_te: 'నూజెండ్ల', name_en: 'Nuzendla' },
      { name_te: 'శావల్యాపురం', name_en: 'Savalyapuram' },
      { name_te: 'బొల్లాపల్లి', name_en: 'Bollapalli' },
      { name_te: 'ఈపూరు', name_en: 'Ipur' },
      { name_te: 'చిలకలూరిపేట', name_en: 'Chilakaluripet' },
      { name_te: 'నాదెండ్ల', name_en: 'Nadendla' },
      { name_te: 'యడ్లపాడు', name_en: 'Yedlapadu' },
      { name_te: 'పిడుగురాళ్ల', name_en: 'Piduguralla' },
      { name_te: 'మాచర్ల', name_en: 'Macherla' },
      { name_te: 'దాచేపల్లి', name_en: 'Dachepalli' },
      { name_te: 'గురజాల', name_en: 'Gurazala' },
      { name_te: 'మాచవరం', name_en: 'Machavaram' },
      { name_te: 'రెంటచింతల', name_en: 'Rentachintala' },
      { name_te: 'దుర్గి', name_en: 'Durgi' },
      { name_te: 'వెల్దుర్తి', name_en: 'Veldurthi' },
      { name_te: 'కారంపూడి', name_en: 'Karempudi' },
      { name_te: 'సత్తెనపల్లి', name_en: 'Sattenapalle' },
      { name_te: 'రాజుపాలెం', name_en: 'Rajupalem' },
      { name_te: 'ముప్పాళ్ల', name_en: 'Muppalla' },
      { name_te: 'అచ్చంపేట', name_en: 'Atchampet' },
      { name_te: 'క్రోసూరు', name_en: 'Krosuru' },
      { name_te: 'అమరావతి', name_en: 'Amaravathi' },
      { name_te: 'పెదకూరపాడు', name_en: 'Pedakurapadu' },
      { name_te: 'బెల్లంకొండ', name_en: 'Bellamkonda' }
    ],
    'prakasam': [
      { name_te: 'ఒంగోలు అర్బన్', name_en: 'Ongole Urban' },
      { name_te: 'ఒంగోలు రూరల్', name_en: 'Ongole Rural' },
      { name_te: 'కొత్తపట్నం', name_en: 'Kothapatnam' },
      { name_te: 'సంతనూతలపాడు', name_en: 'Santhanuthalapadu' },
      { name_te: 'నాగులుప్పలపాడు', name_en: 'Naguluppalapadu' },
      { name_te: 'మద్దిపాడు', name_en: 'Maddipadu' },
      { name_te: 'చీమకుర్తి', name_en: 'Cheemakurthi' },
      { name_te: 'తాళ్లూరు', name_en: 'Thallur' },
      { name_te: 'కొండపి', name_en: 'Kondapi' },
      { name_te: 'జరుగుమల్లి', name_en: 'Zarugumalli' },
      { name_te: 'పొన్నలూరు', name_en: 'Ponnaluru' },
      { name_te: 'టంగుటూరు', name_en: 'Tangutur' },
      { name_te: 'సింగరాయకొండ', name_en: 'Singarayakonda' },
      { name_te: 'కనిగిరి', name_en: 'Kanigiri' },
      { name_te: 'పిసిపల్లి', name_en: 'PC Palli' },
      { name_te: 'పామూరు', name_en: 'Pamuru' },
      { name_te: 'సీఎస్ పురం', name_en: 'CS Puram' },
      { name_te: 'వెలిగండ్ల', name_en: 'Veligandla' },
      { name_te: 'పెదచెర్లోపల్లి', name_en: 'Pedacherlopalle' },
      { name_te: 'మార్కాపురం', name_en: 'Markapur' },
      { name_te: 'గిద్దలూరు', name_en: 'Giddalur' },
      { name_te: 'బెస్తవారిపేట', name_en: 'Bestavaripeta' },
      { name_te: 'రాచర్ల', name_en: 'Racherla' },
      { name_te: 'కొమరోలు', name_en: 'Komarolu' },
      { name_te: 'కంభం', name_en: 'Cumbum' },
      { name_te: 'అర్ధవీడు', name_en: 'Ardhaveedu' },
      { name_te: 'యర్రగొండపాలెం', name_en: 'Yerragondapalem' },
      { name_te: 'త్రిపురాంతకం', name_en: 'Tripuranthakam' },
      { name_te: 'పుల్లలచెరువు', name_en: 'Pullalacheruvu' },
      { name_te: 'పెద్దారవీడు', name_en: 'Peda Araveedu' },
      { name_te: 'దోర్నాల', name_en: 'Dornala' },
      { name_te: 'దర్శి', name_en: 'Darsi' },
      { name_te: 'కురిచేడు', name_en: 'Kurichedu' },
      { name_te: 'ముండ్లమూరు', name_en: 'Mundlamuru' },
      { name_te: 'దొనకొండ', name_en: 'Donakonda' },
      { name_te: 'పొదిలి', name_en: 'Podili' },
      { name_te: 'మర్రిపూడి', name_en: 'Marripudi' },
      { name_te: 'కొనకనమిట్ల', name_en: 'Konakanamitla' },
      { name_te: 'తర్లుపాడు', name_en: 'Tarlupadu' },
      { name_te: 'హనుమంతునిపాడు', name_en: 'Hanumanthunipadu' }
    ],
    'srikakulam': [
      { name_te: 'శ్రీకాకుళం', name_en: 'Srikakulam' },
      { name_te: 'గార', name_en: 'Gara' },
      { name_te: 'ఆమదాలవలస', name_en: 'Amadalavalasa' },
      { name_te: 'పొందూరు', name_en: 'Ponduru' },
      { name_te: 'సరుబుజ్జిలి', name_en: 'Sarubujjili' },
      { name_te: 'బూర్జ', name_en: 'Burja' },
      { name_te: 'నరసన్నపేట', name_en: 'Narasannapeta' },
      { name_te: 'పోలాకి', name_en: 'Polaki' },
      { name_te: 'జలుమూరు', name_en: 'Jalumuru' },
      { name_te: 'సారవకోట', name_en: 'Saravakota' },
      { name_te: 'టెక్కలి', name_en: 'Tekkali' },
      { name_te: 'కోటబొమ్మాళి', name_en: 'Kotabommali' },
      { name_te: 'సంతబొమ్మాళి', name_en: 'Santhabommali' },
      { name_te: 'నందిగాం', name_en: 'Nandigam' },
      { name_te: 'పలాస', name_en: 'Palasa' },
      { name_te: 'మందస', name_en: 'Mandasa' },
      { name_te: 'వజ్రపుకొత్తూరు', name_en: 'Vajrapukothuru' },
      { name_te: 'సోంపేట', name_en: 'Sompeta' },
      { name_te: 'కవిటి', name_en: 'Kaviti' },
      { name_te: 'ఇచ్ఛాపురం', name_en: 'Ichchapuram' },
      { name_te: 'కంచిలి', name_en: 'Kanchili' },
      { name_te: 'రణస్థలం', name_en: 'Ranasthalam' },
      { name_te: 'ఎచ్చెర్ల', name_en: 'Etcherla' },
      { name_te: 'జి.సిగడాం', name_en: 'G.Sigadam' },
      { name_te: 'లావేరు', name_en: 'Laveru' },
      { name_te: 'పాతపట్నం', name_en: 'Pathapatnam' },
      { name_te: 'మెళియాపుట్టి', name_en: 'Meliaputti' },
      { name_te: 'హిరమండలం', name_en: 'Hiramandalam' }
    ],
    'sri-sathya-sai': [
      { name_te: 'పుట్టపర్తి', name_en: 'Puttaparthi' },
      { name_te: 'కొత్తచెరువు', name_en: 'Kothacheruvu' },
      { name_te: 'బుక్కపట్నం', name_en: 'Bukkapatnam' },
      { name_te: 'నల్లమాడ', name_en: 'Nallamada' },
      { name_te: 'ఓబులదేవరచెరువు', name_en: 'Obuladevaracheruvu' },
      { name_te: 'గోరంట్ల', name_en: 'Gorantla' },
      { name_te: 'ధర్మవరం', name_en: 'Dharmavaram' },
      { name_te: 'బత్తలపల్లి', name_en: 'Bathalapalle' },
      { name_te: 'తాడిమర్రి', name_en: 'Tadimarri' },
      { name_te: 'ముదిగుబ్బ', name_en: 'Mudigubba' },
      { name_te: 'రామగిరి', name_en: 'Ramagiri' },
      { name_te: 'కనగానపల్లి', name_en: 'Kanaganapalle' },
      { name_te: 'హిందూపురం', name_en: 'Hindupur' },
      { name_te: 'లేపాక్షి', name_en: 'Lepakshi' },
      { name_te: 'చిలమత్తూరు', name_en: 'Chilamathur' },
      { name_te: 'పెనుకొండ', name_en: 'Penukonda' },
      { name_te: 'సోమందేపల్లి', name_en: 'Somandepalle' },
      { name_te: 'రొద్దం', name_en: 'Roddam' },
      { name_te: 'పరిగి', name_en: 'Parigi' },
      { name_te: 'మడకశిర', name_en: 'Madakasira' },
      { name_te: 'అమరాపురం', name_en: 'Amarapuram' },
      { name_te: 'గుడిబండ', name_en: 'Gudibanda' },
      { name_te: 'రొళ్ల', name_en: 'Rolla' },
      { name_te: 'అగళి', name_en: 'Agali' },
      { name_te: 'కదిరి', name_en: 'Kadiri' },
      { name_te: 'తలుపుల', name_en: 'Talupula' },
      { name_te: 'నంబులపూలకుంట', name_en: 'Nambulapulakunta' },
      { name_te: 'గాండ్లపెంట', name_en: 'Gandlapenta' },
      { name_te: 'తనకల్లు', name_en: 'Tanakallu' }
    ],
    'tirupati': [
      { name_te: 'తిరుపతి అర్బన్', name_en: 'Tirupati Urban' },
      { name_te: 'తిరుపతి రూరల్', name_en: 'Tirupati Rural' },
      { name_te: 'చంద్రగిరి', name_en: 'Chandragiri' },
      { name_te: 'రేణిగుంట', name_en: 'Renigunta' },
      { name_te: 'రామచంద్రాపురం', name_en: 'Ramachandrapuram' },
      { name_te: 'వడమాలపేట', name_en: 'Vadamalapeta' },
      { name_te: 'యెర్రావారిపాలెం', name_en: 'Yerravaripalem' },
      { name_te: 'చిన్నగొట్టిగల్లు', name_en: 'Chinnagottigallu' },
      { name_te: 'శ్రీకాళహస్తి', name_en: 'Srikalahasti' },
      { name_te: 'తొట్టంబేడు', name_en: 'Thottambedu' },
      { name_te: 'ఏర్పేడు', name_en: 'Yerpedu' },
      { name_te: 'కె.వి.బి.పురం', name_en: 'K.V.B.Puram' },
      { name_te: 'నాగలాపురం', name_en: 'Nagalapuram' },
      { name_te: 'పిచ్చాటూరు', name_en: 'Pitchatur' },
      { name_te: 'వరదయ్యపాలెం', name_en: 'Varadaiahpalem' },
      { name_te: 'సత్యవేడు', name_en: 'Satyavedu' },
      { name_te: 'సూళ్లూరుపేట', name_en: 'Sullurpeta' },
      { name_te: 'తడ', name_en: 'Tada' },
      { name_te: 'దొరవారిసత్రం', name_en: 'Doravarisatram' },
      { name_te: 'నాయుడుపేట', name_en: 'Naidupeta' },
      { name_te: 'పెళ్లకూరు', name_en: 'Pellakur' },
      { name_te: 'ఓజిలి', name_en: 'Ojili' },
      { name_te: 'వెంకటగిరి', name_en: 'Venkatagiri' },
      { name_te: 'డక్కిలి', name_en: 'Dakkili' },
      { name_te: 'బాలాయపల్లి', name_en: 'Balayapalle' },
      { name_te: 'వాకాడు', name_en: 'Vakadu' },
      { name_te: 'కోట', name_en: 'Kota' },
      { name_te: 'చిట్టమూరు', name_en: 'Chittamur' },
      { name_te: 'గూడూరు', name_en: 'Gudur' }
    ],
    'visakhapatnam': [
      { name_te: 'సీతమ్మధార (విశాఖ అర్బన్)', name_en: 'Seethammadhara' },
      { name_te: 'మహారాణిపేట', name_en: 'Maharanipeta' },
      { name_te: 'గోపాలపట్నం', name_en: 'Gopalapatnam' },
      { name_te: 'ములగాడ', name_en: 'Mulagada' },
      { name_te: 'గాజువాక', name_en: 'Gajuwaka' },
      { name_te: 'పెదగంట్యాడ', name_en: 'Pedagantyada' },
      { name_te: 'భీమునిపట్నం (భీమిలి)', name_en: 'Bheemunipatnam' },
      { name_te: 'ఆనందపురం', name_en: 'Anandapuram' },
      { name_te: 'పద్మనాభం', name_en: 'Padmanabham' },
      { name_te: 'పెందుర్తి', name_en: 'Pendurthi' }
    ],
    'vizianagaram': [
      { name_te: 'విజయనగరం', name_en: 'Vizianagaram' },
      { name_te: 'గంట్యాడ', name_en: 'Gantyada' },
      { name_te: 'పూసపాటిరేగ', name_en: 'Pusapatirega' },
      { name_te: 'డెంకాడ', name_en: 'Denkada' },
      { name_te: 'భోగాపురం', name_en: 'Bhogapuram' },
      { name_te: 'జామి', name_en: 'Jami' },
      { name_te: 'కొత్తవలస', name_en: 'Kothavalasa' },
      { name_te: 'వేపాడ', name_en: 'Vepada' },
      { name_te: 'ఎస్.కోట (శృంగవరపుకోట)', name_en: 'S.Kota' },
      { name_te: 'లక్కవరపుకోట', name_en: 'Lakkavarapukota' },
      { name_te: 'బొబ్బిలి', name_en: 'Bobbili' },
      { name_te: 'బాడంగి', name_en: 'Badangi' },
      { name_te: 'తెర్లాం', name_en: 'Therlam' },
      { name_te: 'రామభద్రపురం', name_en: 'Ramabhadrapuram' },
      { name_te: 'గజపతినగరం', name_en: 'Gajapathinagaram' },
      { name_te: 'బొండపల్లి', name_en: 'Bondapalle' },
      { name_te: 'మెంటాడ', name_en: 'Mentada' },
      { name_te: 'దత్తిరాజేరు', name_en: 'Dattirajeru' },
      { name_te: 'చీపురుపల్లి', name_en: 'Cheepurupalle' },
      { name_te: 'గరివిడి', name_en: 'Garividi' },
      { name_te: 'గుర్ల', name_en: 'Gurla' },
      { name_te: 'నెల్లిమర్ల', name_en: 'Nellimarla' }
    ],
    'west-godavari': [
      { name_te: 'భీమవరం', name_en: 'Bhimavaram' },
      { name_te: 'వీరవాసరం', name_en: 'Veeravasaram' },
      { name_te: 'పాలకోడేరు', name_en: 'Palakoderu' },
      { name_te: 'కాళ్ల', name_en: 'Kalla' },
      { name_te: 'ఆకివీడు', name_en: 'Akividu' },
      { name_te: 'నరసాపురం', name_en: 'Narasapuram' },
      { name_te: 'మొగల్తూరు', name_en: 'Mogalthur' },
      { name_te: 'పాలకొల్లు', name_en: 'Palakollu' },
      { name_te: 'యలమంచిలి', name_en: 'Yelamanchili' },
      { name_te: 'పోడూరు', name_en: 'Poduru' },
      { name_te: 'తాడేపల్లిగూడెం', name_en: 'Tadepalligudem' },
      { name_te: 'పెంటపాడు', name_en: 'Pentapadu' },
      { name_te: 'తణుకు', name_en: 'Tanuku' },
      { name_te: 'అత్తిలి', name_en: 'Attili' },
      { name_te: 'ఇరగవరం', name_en: 'Iragavaram' },
      { name_te: 'ఆచంట', name_en: 'Achanta' },
      { name_te: 'పెనుగొండ', name_en: 'Penugonda' },
      { name_te: 'పెనుమంట్ర', name_en: 'Penumantra' }
    ],
    'kadapa': [
      { name_te: 'కడప అర్బన్', name_en: 'Kadapa Urban' },
      { name_te: 'కడప రూరల్', name_en: 'Kadapa Rural' },
      { name_te: 'చెన్నూరు', name_en: 'Chennur' },
      { name_te: 'వల్లూరు', name_en: 'Vallur' },
      { name_te: 'కమలాపురం', name_en: 'Kamalapuram' },
      { name_te: 'పెండ్లిమర్రి', name_en: 'Pendlimarri' },
      { name_te: 'చింతకొమ్మదిన్నె', name_en: 'Chinthakommadinne' },
      { name_te: 'ప్రొద్దుటూరు', name_en: 'Proddatur' },
      { name_te: 'రాజోలు', name_en: 'Rajupalem' },
      { name_te: 'మైదుకూరు', name_en: 'Mydukur' },
      { name_te: 'దువ్వూరు', name_en: 'Duvvur' },
      { name_te: 'చాపాడు', name_en: 'Chapad' },
      { name_te: 'ఖాజీపేట', name_en: 'Khajipet' },
      { name_te: 'బి.మఠం', name_en: 'B.Matam' },
      { name_te: 'జమ్మలమడుగు', name_en: 'Jammalamadugu' },
      { name_te: 'ముద్దనూరు', name_en: 'Muddanur' },
      { name_te: 'కొండాపురం', name_en: 'Kondapuram' },
      { name_te: 'మైలవరం', name_en: 'Mylavaram' },
      { name_te: 'పెద్దముడియం', name_en: 'Peddamudium' },
      { name_te: 'వేముల', name_en: 'Vemula' },
      { name_te: 'పులివెందుల', name_en: 'Pulivendula' },
      { name_te: 'లింగాల', name_en: 'Lingala' },
      { name_te: 'సింహాద్రిపురం', name_en: 'Simhadripuram' },
      { name_te: 'తొండూరు', name_en: 'Thondur' },
      { name_te: 'వేంపల్లి', name_en: 'Vempalli' },
      { name_te: 'చక్రాయపేట', name_en: 'Chakrayapet' },
      { name_te: 'ఎర్రగుంట్ల', name_en: 'Yerraguntla' }
    ],
    'hyderabad': [
      { name_te: 'హైదరాబాద్ సెంట్రల్', name_en: 'Hyderabad Central' },
      { name_te: 'బంజారాహిల్స్ / జూబ్లీహిల్స్', name_en: 'Banjara Hills / Jubilee Hills' },
      { name_te: 'సికింద్రాబాద్', name_en: 'Secunderabad' },
      { name_te: 'అమీర్‌పేట్ / పంజాగుట్ట', name_en: 'Ameerpet / Punjagutta' },
      { name_te: 'ఖైరతాబాద్', name_en: 'Khairatabad' },
      { name_te: 'కూకట్‌పల్లి', name_en: 'Kukatpally' },
      { name_te: 'మాదాపూర్ / హైటెక్ సిటీ', name_en: 'Madhapur / HITEC City' },
      { name_te: 'గచ్చిబౌలి / ఫైనాన్షియల్ డిస్ట్రిక్ట్', name_en: 'Gachibowli' },
      { name_te: 'ఎల్బీనగర్ / దిల్‌సుఖ్‌నగర్', name_en: 'LB Nagar / Dilsukhnagar' },
      { name_te: 'ఉప్పల్ / మల్కాజిగిరి', name_en: 'Uppal / Malkajgiri' },
      { name_te: 'చార్మినార్ / పాతబస్తీ', name_en: 'Charminar' },
      { name_te: 'రాజేంద్రనగర్', name_en: 'Rajendranagar' },
      { name_te: 'సైబరాబాద్ బ్యూరో', name_en: 'Cyberabad Bureau' },
      { name_te: 'వరంగల్ బ్యూరో', name_en: 'Warangal Bureau' },
      { name_te: 'కరీంనగర్ బ్యూరో', name_en: 'Karimnagar Bureau' },
      { name_te: 'నిజామాబాద్ బ్యూరో', name_en: 'Nizamabad Bureau' },
      { name_te: 'ఖమ్మం బ్యూరో', name_en: 'Khammam Bureau' },
      { name_te: 'నల్గొండ బ్యూరో', name_en: 'Nalgonda Bureau' }
    ]
  };

  function normalizeSlug(str) {
    if (!str) return '';
    return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getAllDistricts() {
    return AP_DISTRICTS;
  }

  // Pre-populate AP_MANDALS aliases for instant direct resolution by slug, English name, and Telugu name
  (function initMandalAliases() {
    AP_DISTRICTS.forEach(d => {
      if (d.code === 'all' || !AP_MANDALS[d.code]) return;
      const mandalList = AP_MANDALS[d.code];
      if (d.slug && !AP_MANDALS[d.slug]) AP_MANDALS[d.slug] = mandalList;
      if (d.name_en) {
        const enLower = d.name_en.toLowerCase().trim();
        if (!AP_MANDALS[enLower]) AP_MANDALS[enLower] = mandalList;
        const norm = normalizeSlug(d.name_en);
        if (norm && !AP_MANDALS[norm]) AP_MANDALS[norm] = mandalList;
      }
      if (d.name_te && !AP_MANDALS[d.name_te.trim()]) {
        AP_MANDALS[d.name_te.trim()] = mandalList;
      }
      if (Array.isArray(d.keywords)) {
        d.keywords.forEach(kw => {
          const kwClean = String(kw).toLowerCase().trim();
          if (kwClean && !AP_MANDALS[kwClean]) AP_MANDALS[kwClean] = mandalList;
        });
      }
      if (Array.isArray(d.aliases)) {
        d.aliases.forEach(al => {
          const alClean = String(al).toLowerCase().trim();
          if (alClean && !AP_MANDALS[alClean]) AP_MANDALS[alClean] = mandalList;
        });
      }
    });

    // Special common alias mappings
    if (AP_MANDALS['prakasam']) {
      AP_MANDALS['ongole'] = AP_MANDALS['prakasam'];
      AP_MANDALS['ఒంగోలు'] = AP_MANDALS['prakasam'];
      AP_MANDALS['ప్రకాశం'] = AP_MANDALS['prakasam'];
    }
    if (AP_MANDALS['krishna']) {
      AP_MANDALS['ntr'] = AP_MANDALS['krishna'];
      AP_MANDALS['vijayawada'] = AP_MANDALS['krishna'];
      AP_MANDALS['విజయవాడ'] = AP_MANDALS['krishna'];
    }
  })();

  function getDistrictByCodeOrSlug(val) {
    if (!val) return null;
    const raw = String(val).trim();
    const clean = raw.toLowerCase();
    const norm = normalizeSlug(clean);

    // 1. Direct code/slug/English name match
    let found = AP_DISTRICTS.find(d => 
      d.code === clean || 
      d.slug === clean || 
      d.slug === norm ||
      (d.aliases && d.aliases.some(a => a.toLowerCase() === clean)) ||
      (d.name_en && d.name_en.toLowerCase() === clean) ||
      normalizeSlug(d.name_en) === norm
    );
    if (found) return found;

    // 2. Direct Telugu name match
    found = AP_DISTRICTS.find(d => d.name_te === raw || d.name_te === clean);
    if (found) return found;

    // 3. Keyword / partial Telugu or English match
    found = AP_DISTRICTS.find(d => {
      if (d.code === 'all') return false;
      if (d.name_te && (raw.includes(d.name_te) || d.name_te.includes(raw))) return true;
      if (d.name_en && (clean.includes(d.name_en.toLowerCase()) || d.name_en.toLowerCase().includes(clean))) return true;
      if (d.keywords && d.keywords.some(kw => raw.includes(kw) || clean.includes(kw.toLowerCase()) || kw.toLowerCase().includes(clean))) return true;
      return false;
    });

    return found || null;
  }

  function getMandalsForDistrict(districtCode) {
    if (!districtCode) return [];
    const raw = String(districtCode).trim();
    const clean = raw.toLowerCase();

    // 1. Direct key match in AP_MANDALS (covers code, slug, English name, and Telugu name)
    if (AP_MANDALS[clean] && AP_MANDALS[clean].length > 0) {
      return AP_MANDALS[clean];
    }
    if (AP_MANDALS[raw] && AP_MANDALS[raw].length > 0) {
      return AP_MANDALS[raw];
    }

    // 2. Resolve via district object
    const dObj = getDistrictByCodeOrSlug(districtCode) || findDistrictByText(districtCode);
    if (dObj) {
      if (AP_MANDALS[dObj.code] && AP_MANDALS[dObj.code].length > 0) {
        return AP_MANDALS[dObj.code];
      }
      if (dObj.slug && AP_MANDALS[dObj.slug] && AP_MANDALS[dObj.slug].length > 0) {
        return AP_MANDALS[dObj.slug];
      }
    }

    // 3. Fallback scan across all districts
    for (const d of AP_DISTRICTS) {
      if (d.code === 'all') continue;
      if (
        (d.name_te && raw.includes(d.name_te)) ||
        (d.name_en && clean.includes(d.name_en.toLowerCase())) ||
        (d.keywords && d.keywords.some(k => clean.includes(k.toLowerCase()) || raw.includes(k)))
      ) {
        if (AP_MANDALS[d.code] && AP_MANDALS[d.code].length > 0) return AP_MANDALS[d.code];
      }
    }

    return [];
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

  const exportObj = {
    districts: AP_DISTRICTS,
    mandals: AP_MANDALS,
    getAllDistricts,
    getDistrictsList: getAllDistricts,
    getDistrictByCodeOrSlug,
    getMandalsForDistrict,
    findDistrictByText,
    normalizeSlug
  };

  if (typeof window !== 'undefined') {
    window.MAMEKA_DISTRICTS = exportObj;
    window.AP_MANDALS = AP_MANDALS;
  }

  return exportObj;
}));
