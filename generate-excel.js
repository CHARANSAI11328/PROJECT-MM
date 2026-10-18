const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('./db.js');

// Accurate English mappings for reporters from the database
const REPORTERS_ENGLISH_DATA = [
  {
    db_id: 'rep_1790260017612_218',
    name: 'Vaka Srinivasa Rao',
    name_te: 'వాకా శ్రీనివాసరావు',
    designation: 'Editor-in-Chief (Founder)',
    press_id: 'T-091-01',
    phone: '9441085075',
    district: 'AP & Telangana',
    mandal: 'Tenali / Head Office',
    email: 'vasucadbury@gmail.com',
    status: 'Active',
    display_order: 1
  },
  {
    db_id: 'rep_1790268977276_593',
    name: 'Kamarajugadda Srinivasa Vijay Kumar',
    name_te: 'కామరాజుగడ్డ శ్రీనివాస విజయ కుమార్',
    designation: 'Associate Editor',
    press_id: 'B-092-01',
    phone: '9866162808',
    district: 'AP & Telangana',
    mandal: 'Head Office',
    email: 'banti.ammulu@gmail.com',
    status: 'Active',
    display_order: 2
  },
  {
    db_id: 'rep_1790342056365_300',
    name: 'P. Radha Krishna Murthy',
    name_te: 'పి . రాధ కృష్ణ మూర్తి',
    designation: 'Staff Reporter',
    press_id: 'O-108-01',
    phone: '9441659909',
    district: 'Prakasam',
    mandal: 'Ongole',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790342520848_104',
    name: 'Kondru Rosaiah',
    name_te: 'కొండ్రు రోసైయ',
    designation: 'Constituency In-charge',
    press_id: 'O-105-01',
    phone: '9849750137',
    district: 'Prakasam',
    mandal: 'Addanki',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790342643908_713',
    name: 'Devaki Sai Ram',
    name_te: 'దేవకి సాయి రామ్',
    designation: 'Staff Reporter',
    press_id: 'M-111-01',
    phone: '9949237143',
    district: 'Markapuram',
    mandal: 'Markapuram',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790348737692_271',
    name: 'Ummareddy Murali Krishna',
    name_te: 'ఉమ్మారెడ్డి మురళి కృష్ణ',
    designation: 'Constituency In-charge',
    press_id: 'B-092-02',
    phone: '6302124196',
    district: 'Bapatla',
    mandal: 'Bapatla',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790349011836_533',
    name: 'K. Veera Narayana',
    name_te: 'కె . వీర నారాయణ',
    designation: 'Constituency In-charge',
    press_id: 'M-087-01',
    phone: '9396715705',
    district: 'Guntur',
    mandal: 'Mangalagiri',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790349545017_99',
    name: 'Sameer Baig',
    name_te: 'సమీర్ బేగ్',
    designation: 'Constituency In-charge',
    press_id: 'P-88-01',
    phone: '8374739743',
    district: 'Guntur',
    mandal: 'Ponnur',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790349727389_49',
    name: 'Vasimalla Sunny',
    name_te: 'వాసీమళ్ల సన్నీ',
    designation: 'Constituency In-charge',
    press_id: 'P-93-01',
    phone: '7997287764',
    district: 'Guntur',
    mandal: 'Prathipadu',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790349937197_458',
    name: 'Singaraju',
    name_te: 'సింగరాజు',
    designation: 'District Bureau',
    press_id: 'M-111-01',
    phone: '9908591522',
    district: 'Markapuram',
    mandal: 'Markapuram',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790350520411_339',
    name: 'M. Salman Raj',
    name_te: 'ఎమ్ . సాల్మన్ రాజ్',
    designation: 'Constituency In-charge',
    press_id: 'S-107-01',
    phone: '9703882991',
    district: 'Prakasam',
    mandal: 'Santhanuthalapadu',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790350811834_515',
    name: 'D. Bhagyam',
    name_te: 'డి . భాగ్యం',
    designation: 'Constituency In-charge',
    press_id: 'C-106-01',
    phone: '9299751820',
    district: 'Bapatla',
    mandal: 'Chirala',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790509553678_305',
    name: 'Shaik Kaleshagari Vali',
    name_te: 'షేక్ కాలేషగారి వలి',
    designation: 'Mandal Reporter',
    press_id: 'O-105-02',
    phone: '9705932709',
    district: 'Prakasam',
    mandal: 'Santhamaguluru',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790509872803_13',
    name: 'Dr. Medapati Immanuel',
    name_te: 'డా. మేడపాటి ఇమ్మనుయేల్',
    designation: 'District Bureau',
    press_id: 'E.G-050-01',
    phone: '9505431099',
    district: 'East Godavari',
    mandal: 'Rajahmundry',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790510121412_383',
    name: 'Kotte Brahmam',
    name_te: 'కొట్టే బ్రహ్మం',
    designation: 'Mandal Reporter',
    press_id: 'O-105-03',
    phone: '9948210823',
    district: 'Prakasam',
    mandal: 'Addanki',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790510280832_202',
    name: 'Pulipati Sudhakar',
    name_te: 'పులిపాటి సుధాకర్',
    designation: 'Mandal Reporter',
    press_id: 'O-105-04',
    phone: '9640295779',
    district: 'Prakasam',
    mandal: 'Korisapadu',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790510480431_884',
    name: 'Katta Simonu',
    name_te: 'కట్ట సిమోను',
    designation: 'Mandal Reporter',
    press_id: 'S-107-02',
    phone: '9346117981',
    district: 'Prakasam',
    mandal: 'Santhanuthalapadu',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790598238511_490',
    name: 'Barapati Shiva Prabhas',
    name_te: 'బరపాటి శివ ప్రభాస్',
    designation: 'Town Reporter',
    press_id: 'V-80-01',
    phone: '9182792112',
    district: 'NTR (Vijayawada)',
    mandal: 'Vijayawada Central',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1790607848033_390',
    name: 'Makkapati Niveditha',
    name_te: 'మక్కపాటి నివేదిత',
    designation: 'Telangana State Bureau',
    press_id: 'TS-70-01',
    phone: '9440832347',
    district: 'Telangana State',
    mandal: 'Head Office',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1791201151836_462',
    name: 'Madala Venkata Rao',
    name_te: 'మాదాల వెంకట రావు',
    designation: 'Mandal Reporter',
    press_id: 'S-107-03',
    phone: '8317644676',
    district: 'Prakasam',
    mandal: 'Cheimakurthi',
    email: '-',
    status: 'Active',
    display_order: 3
  },
  {
    db_id: 'rep_1791204208825_380',
    name: 'Samanthapudi Srinivasa Chari',
    name_te: 'సమంతపూడి శ్రీనివాసా చారి',
    designation: 'Reporter',
    press_id: 'O-108-02',
    phone: '9247846496',
    district: 'Prakasam',
    mandal: 'Ongole Urban',
    email: '-',
    status: 'Active',
    display_order: 3
  }
];

async function generateCleanEnglishExcel() {
  console.log('Generating Clean English Excel Sheet for Reporters Directory...');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mameka Mahodayam Daily';
  workbook.lastModifiedBy = 'Editorial Desk';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Reporters List', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // Direct Column Headers on Row 1 (No decorative top banners or headings)
  const columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Name', key: 'name', width: 36 },
    { header: 'Designation', key: 'designation', width: 28 },
    { header: 'ID No', key: 'press_id', width: 16 },
    { header: 'Phone No', key: 'phone', width: 18 },
    { header: 'District', key: 'district', width: 22 },
    { header: 'Mandal / Area', key: 'mandal', width: 26 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  sheet.columns = columns;

  // Style Header Row (Row 1)
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Professional Corporate Royal Navy
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } },
      right: { style: 'thin', color: { argb: 'FF3B82F6' } }
    };
  });

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // Add Data Rows directly under Row 1
  REPORTERS_ENGLISH_DATA.forEach((rep, index) => {
    const rowNum = 2 + index;
    const row = sheet.getRow(rowNum);
    row.height = 24;

    const isEditor = (rep.display_order === 1);
    const isAssociateEditor = (rep.display_order === 2);
    const isLeadership = isEditor || isAssociateEditor;

    row.getCell(1).value = index + 1;
    row.getCell(2).value = rep.name;
    row.getCell(3).value = rep.designation;
    row.getCell(4).value = rep.press_id;
    row.getCell(5).value = rep.phone;
    row.getCell(6).value = rep.district;
    row.getCell(7).value = rep.mandal;
    row.getCell(8).value = rep.email;
    row.getCell(9).value = rep.status;

    // Row Background colors
    let bgColor = (index % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';
    if (isEditor) {
      bgColor = 'FFFEF3C7'; // Light Amber/Gold for Editor-in-Chief
    } else if (isAssociateEditor) {
      bgColor = 'FFE0F2FE'; // Light Sky for Associate Editor
    }

    for (let c = 1; c <= 9; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.border = thinBorder;

      // Make Editor and Associate Editor BOLD
      if (isLeadership) {
        cell.font = {
          name: 'Calibri',
          size: 11,
          bold: true,
          color: { argb: isEditor ? 'FF92400E' : 'FF0369A1' }
        };
      } else {
        cell.font = {
          name: 'Calibri',
          size: 10.5,
          bold: false,
          color: { argb: 'FF1E293B' }
        };
      }

      // Alignments
      if (c === 1 || c === 4 || c === 5 || c === 9) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (c === 5) cell.numFmt = '@'; // Treat phone number as text
        if (c === 9) {
          cell.font = {
            name: 'Calibri',
            size: 10,
            bold: true,
            color: { argb: 'FF15803D' } // Active Green
          };
        }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }
    }
  });

  // Enable AutoFilter on Row 1
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 9 }
  };

  // Save the workbooks
  const fileNames = [
    'Reporters_List.xlsx',
    'Reporters_Directory_English.xlsx',
    'Mameka_Mahodayam_Reporters_Directory.xlsx'
  ];

  for (const fileName of fileNames) {
    const filePath = path.join(__dirname, fileName);
    try {
      await workbook.xlsx.writeFile(filePath);
      console.log(`✓ Successfully written to: ${fileName}`);
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.log(`ℹ Notice: ${fileName} is currently open in Excel, skipping lock.`);
      } else {
        console.error(`Error saving ${fileName}:`, err.message);
      }
    }
  }

  console.log('✓ Columns: S.No, Name, Designation, ID No, Phone No, District, Mandal / Area, Email, Status');
  console.log('✓ Editor and Associate Editor are styled BOLD.');
  process.exit(0);
}

generateCleanEnglishExcel().catch(err => {
  console.error(err);
  process.exit(1);
});
