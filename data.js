/* =====================================================================
   Incentive Automation — data layer (sample)
   Parses the real HITS roster, classifies every person into one of the
   9 incentive teams, and generates STABLE (seeded) mock metrics + a
   transparent, slab-based incentive calculation.
   Real calculation logic / data points will be swapped in later.
   Attaches everything to window.INCENTIVE.
   ===================================================================== */
(function () {
  // --- Raw roster (from the uploaded sheet) ----------------------------
  const CSV = `Emp Id,Name,employee_email,manager_email,Team,designation
WM363,Mohammedfaizan Sakariyawala,faizan.s@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Assistant Manager Growth
WM409,Shirin Rizvi,shirin.rizvi@blitzscale.co,pratiksha.yadav@blitzscale.co,Hits,Growth Manager
WM441,Vikash Yadav,vikash.yadav@blitzscale.co,shreya.srivastava@blitzscale.co,Hits,Growth Consultant
WM460,Aastha,aastha.jha@blitzscale.co,pratiksha.yadav@blitzscale.co,Hits,Senior Growth Manager
WM469,Akshita Srivastava,akshita.srivastava@blitzscale.co,pratiksha.yadav@blitzscale.co,Hits,Growth Manager
WM477,Harjyot Singh Chawla,harjyot.singh@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM482,Deepak Mourya,deepak.mourya@blitzscale.co,ayushi.yadav@shopdeck.com,Hits,Growth Consultant
WM478,Nikita Sinha,nikita.sinha@blitzscale.co,pawan.kumar@blitzscale.co,Hyper Care,Growth Consultant
WM487,Ayush Gupta,ayush.gupta@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM515,Preeti,preeti.jangra@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM523,Shubham Goyal,shubham.goyal@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Manager
WM540,Shruti Vats,shruti.vats@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM543,Madhura M,madhura.m@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM559,Bhavana Ahirwar,bhavana.ahirwar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Manager
WM566,Gagandeep Singh,gagan.singh@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM568,Tuleshwar Sahu,tuleshwar.sahu@blitzscale.co,bhavana.ahirwar@blitzscale.co,Hits,Growth Lead
WM617,Swati Singh,swati.singh@shopdeck.com,bhavana.ahirwar@blitzscale.co,Hits,Growth Lead
WM616,Pawan Kumar,pawan.kumar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Senior Growth Manager
WM635,Pratyush Pandey,pratyush.pandey@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM638,Fatir Khan,fatir.khan@shopdeck.com,pratiksha.yadav@blitzscale.co,Hits,Growth Manager
WM642,Vishal Chauhan,vishal.chauhan@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM666,Akanksha Chouhan,akanksha.thakur@shopdeck.com,pawan.kumar@blitzscale.co,Hits,Growth Consultant
WM669,Syed Amaan Husain,syedamaan.husain@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM665,Md Azharul Imam,azharul.imam@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Manager
WM694,Vikash,vikash.v@blitzscale.co,faizan.s@blitzscale.co,Hits,Key Account Executive
WM732,Pratyush Joshi,pratyush.joshi@blitzscale.co,aastha.jha@blitzscale.co,Good Seller,Growth Lead
WM737,Aakash,aakash@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Manager
WM748,Aaruni Vaidya,aaruni.vaidya@shopdeck.com,pawan.kumar@blitzscale.co,Hyper Care,Growth Lead
WM744,Aanchal Agrawal,aanchal.agrawal@shopdeck.com,pawan.kumar@blitzscale.co,Hyper Care,Growth Consultant
WM749,Rahul Anand,rahul.anand@shopdeck.com,shirin.rizvi@blitzscale.co,Hits,Growth Consultant
WM757,Rebecca Raechel Anil,rebecca.raechel@shopdeck.com,aastha.jha@blitzscale.co,Good Seller,Growth Manager
WM767,Naina Kumari,naina.kumari@shopdeck.com,aakash@shopdeck.com,1k-5k,Growth Lead
WM805,Anshika Satpathy,anshika.satpathy@shopdeck.com,pratiksha.yadav@blitzscale.co,Hits,Growth Manager
WM810,Niranjan Singh,niranjan.singh@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM815,Taha Usmani,taha.usmani@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM814,Shivon Bansal,shivon.bansal@shopdeck.com,ayushi.yadav@shopdeck.com,1k-5k,Growth Lead
WM823,Satish,satish.kumar@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM854,Sandeep Singh Sanger,sandeep.sanger@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM898,Surbhi Malviya,surbhi.malviya@blitzscale.co,pawan.kumar@blitzscale.co,Hits,Key Account Executive
WM913,Gautam Mishra,gautam.mishra@shopdeck.com,faizan.s@blitzscale.co,Hits,Key Account Executive
WM941,Rayala Bhanu Sriraj,rayalabhanu.sriraj@shopdeck.com,aastha.jha@blitzscale.co,1k-5k,Growth Lead
WM1024,Harshita Gupta,harshita.gupta@shopdeck.com,fatir.khan@shopdeck.com,1k-5k,Growth Lead
WM1025,Aitesam Khan,aitesam.khan@shopdeck.com,bhavana.ahirwar@blitzscale.co,Good Seller,Growth Lead
WM1026,Hamza Tufail Rohila,hamza.rohila@shopdeck.com,fatir.khan@shopdeck.com,Hits,Growth Consultant
WM1028,Davidson Udayakumar,davidson.udayakumar@shopdeck.com,akshita.srivastava@blitzscale.co,Good Seller,Growth Lead
WM1051,Pratiksha Yadav,pratiksha.yadav@blitzscale.co,purushottam.muthal@blitzscale.co,,Category Lead
WM1070,Roopesh Banavath,roopesh.banavath@blitzscale.co,purushottam.muthal@blitzscale.co,,Category Lead
WM1084,Komal Giri,komal.giri@shopdeck.com,aakash@shopdeck.com,Hits,Growth Lead
WM1152,Kanchi Dixit,kanchi.dixit@shopdeck.com,bhavana.ahirwar@blitzscale.co,Hits,Growth Consultant
WM1153,Shweta Mohatewar,shweta.mohatewar@shopdeck.com,shubham.goyal@blitzscale.co,Hits,Growth Consultant
WM1154,Richa Pandey,richa.pandey@shopdeck.com,akshita.srivastava@blitzscale.co,Hits,Growth Consultant
WM1155,Susmit,susmit.g@shopdeck.com,shirin.rizvi@blitzscale.co,Hits,Growth Consultant
WM1156,Divyanshi Panjikar,divyanshi.panjikar@shopdeck.com,akshita.srivastava@blitzscale.co,Hits,Growth Consultant
WM1160,Rahul Jangid,rahul.jangid@shopdeck.com,akshita.srivastava@blitzscale.co,Hits,Growth Consultant
WM1161,Abhinav Rana,abhinav.rana@shopdeck.com,bhavana.ahirwar@blitzscale.co,Hits,AI Video Editor
WM1177,Rohan Sagar,rohan.sagar@shopdeck.com,fatir.khan@shopdeck.com,Hits,Growth Consultant
WM1180,Aditi Gupta,aditi.gupta@shopdeck.com,aakash@shopdeck.com,Hits,Growth Consultant
WM1200,Saiprasad Chandru Shet,saiprasad.shet@shopdeck.com,fatir.khan@shopdeck.com,Hits,Growth Consultant
WM1201,Kiran,kiran.m@shopdeck.com,shubham.goyal@blitzscale.co,Hits,Growth Consultant
WM1205,Pushp Raj,pushp.raj@shopdeck.com,shubham.goyal@blitzscale.co,Hits,Growth Consultant
WM1204,Putsala Haasini,putsala.haasini@shopdeck.com,aastha.jha@blitzscale.co,,Data Analyst
WM1214,Rohit Gupta,rohit.gupta@shopdeck.com,pawan.kumar@blitzscale.co,,Data Operations Executive
WM1215,Rinkesh Mandal,rinkesh.mandal@shopdeck.com,shreya.srivastava@blitzscale.co,Hits,Growth Consultant
WM1217,Sumit Pandey,sumit.pandey@shopdeck.com,faizan.s@blitzscale.co,Revenue,Key Account Executive
WM1235,Rachna Sharma,rachna.sharma@blitzscale.co,purushottam.muthal@blitzscale.co,,Business Analyst
WM1233,Ayushi Yadav,ayushi.yadav@shopdeck.com,pratiksha.yadav@blitzscale.co,Hits,Growth Manager
WM1304,Rohan Agrawal,rohan.agrawal@blitzscale.co,ayushi.yadav@shopdeck.com,Hits,Growth Consultant
WM1306,Tanaya Rajkumar Gore,tanaya.gore@blitzscale.co,ayushi.yadav@shopdeck.com,Hits,Growth Consultant
WM1315,Rohit Kumar Sah,rohit.sah@shopdeck.com,bhavana.ahirwar@blitzscale.co,Hits,Growth Consultant
WM1319,Eva Ambust,eva.ambust@blitzscale.co,aakash@shopdeck.com,Hits,Growth Consultant
WM1320,Patan Nafisa,patan.nafisa@blitzscale.co,shubham.goyal@blitzscale.co,Hits,Growth Consultant
WM1327,Sachin Srivastava,sachin.srivastava@blitzscale.co,anshika.satpathy@shopdeck.com,Hits,Growth Consultant
WM1332,Lakshya Pandey,lakshya.pandey@blitzscale.co,anshika.satpathy@shopdeck.com,Hits,Growth Consultant
WM1342,Piyush Dubey,piyush.dubey@shopdeck.com,anshika.satpathy@shopdeck.com,Hits,Growth Consultant
WM1353,Sadiya Iqbal Rajgoli,sadiya.rajgoli@blitzscale.co,pawan.kumar@blitzscale.co,Hyper Care,Growth Consultant
WM1354,Nishan A Bandekar,nishan.bandekar@blitzscale.co,pawan.kumar@blitzscale.co,Hyper Care,Growth Consultant
WM1419,Hardik Grover,hardik.grover@blitzscale.co,aastha.jha@blitzscale.co,1k-5k,Growth Consultant
WM1451,Dev Vashisth,dev.vashisth@blitzscale.co,pawan.kumar@blitzscale.co,Hyper Care,Growth Consultant
WM1464,Aditya Kumar Prasad,aditya.prasad@blitzscale.co,,Hits,Growth Consultant - Campaign
WM1469,Ameen A R,ameen.ar@blitzscale.co,shreya.srivastava@blitzscale.co,Hits,Growth Consultant
WM1483,Srabanika Das,srabanika.das@blitzscale.co,pawan.kumar@blitzscale.co,,Growth Consultant - Campaign
WM1488,Sourabh Yadav,sourabh.yadav@blitzscale.co,aastha.jha@blitzscale.co,1k-5k,Growth Lead
WM1491,Shivam Kumar,shivam.kumar@blitzscale.co,aastha.jha@blitzscale.co,1k-5k,Growth Lead
WM1546,Jivraj Shrinivas Karwa,jivraj.karwa@blitzscale.co,purushottam.muthal@blitzscale.co,,Category Lead
WM1555,Mannat Chawla,mannat.chawla@blitzscale.co,aastha.jha@blitzscale.co,1k-5k,Growth Lead
WM1569,Himanshu Mall,himanshu.mall@blitzscale.co,shirin.rizvi@blitzscale.co,Hits,Growth Consultant
WM1570,PANKAJ YADAV,pankaj.yadav@blitzscale.co,anshika.satpathy@shopdeck.com,Hits,Growth Consultant
WM1572,Rahul Kumar Mallick,rahul.kumar@blitzscale.co,azharul.imam@shopdeck.com,Hits,Growth Consultant
WM1582,Pranav Pillai,pranav.pillai@blitzscale.co,shirin.rizvi@blitzscale.co,Hits,Growth Consultant
WM1585,SAURAV SINGH,saurav.singh@blitzscale.co,azharul.imam@shopdeck.com,Hits,Growth Consultant
WM1588,Aditya Bargotra,aditya.bargotra@blitzscale.co,azharul.imam@shopdeck.com,Hits,Growth Consultant
WM1589,AADITYA KUMAR SINGH,aaditya.kumar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1593,KRISHNA KUMAR SINGH,krishna.kumar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1562,Pratyush Bopanna,pratyush.bopanna@blitzscale.co,purushottam.muthal@blitzscale.co,,Business Manager
WM1598,Ashutosh Ranjan,ashutosh.ranjan@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1599,Anish Dash,anish.dash@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1600,Animesh Tiwari,animesh.tiwari@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1601,Pooja M Krishna,pooja.krishna@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1602,Shivam Ratnani,shivam.ratnani@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1606,Pujarchana Nayak,pujarchana.nayak@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1607,Arpit Katiyar,arpit.katiyar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1608,Vrijendra Balaji,vrijendra.balaji@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1613,Sanjana Doddamani,sanjana.doddamani@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1619,Priyal Gupta,priyal.gupta@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1620,Ayushi Agarwal,ayushi.agarwal@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1621,Jaison,jaison@blitzscale.co,roopesh.banavath@blitzscale.co,1k-5k,Growth Lead
WM1622,Nimisha Baruah,nimisha.baruah@shopdeck.com,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1623,Hemant,hemant@shopdeck.com,roopesh.banavath@blitzscale.co,1k-5k,Growth lead
WM1624,Shreyash Shivaji Kotlawar,shreyash.shivaji@blitzscale.co,roopesh.banavath@blitzscale.co,1k-5k,Growth Lead
WM1625,Roshita Dulani,roshita.dulani@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Manager
WM1639,Pihuni Jain,pihuni.jain@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1640,Seema Paroha,seema.paroha@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1641,Sanjib Kumar Bhagabati,sanjib.kumar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1642,Sarv Shreshth,sarv.shreshth@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1644,Sankhajit Ghosh,sankhajit.Ghosh@blitzscale.co,roopesh.banavath@blitzscale.co,1k-5k,Growth Lead
WM1645,Rahul Saini,rahul.saini@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1646,Shubham Kumar,shubham.kumar@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1647,Vanshika Nigam,vanshika.nigam@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1648,Sargunpreet Singh,sargunpreet.singh@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1649,Jatin Kuchhal,jatin.kuchhal@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1650,Saurabh Kumar,saurabh.kumar@blitzscale.co,roopesh.banavath@blitzscale.co,1k-5k,Growth Lead
WM1651,Sejal Negi,sejal.negi@blitzscale.co,roopesh.banavath@blitzscale.co,,Escalation Manager
WM1652,Faraz Pasha,faraz.pasha@blitzscale.co,roopesh.banavath@blitzscale.co,,Escalation Manager
WM1655,Srishti,srishti@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Consultant
WM1659,Vatsal Sharma,vatsal.sharma@blitzscale.co,roopesh.banavath@blitzscale.co,Hits,Growth Manager
WM1508,Raj Rajak,raj.rajak@shopdeck.com,pawan.kumar@blitzscale.co,Hits,Growth Consultant - Campaign
WM1526,Soumen Das,soumen.das@shopdeck.com,pawan.kumar@blitzscale.co,Hits,Growth Consultant - Campaign
WM1527,Sneha Sharma,sneha.sharma@shopdeck.com,pawan.kumar@blitzscale.co,Hits,Growth Consultant - Campaign
WM1533,Shaik Rabbani,shaik.rabbani@blitzscale.co,pawan.kumar@blitzscale.co,Hits,Growth Consultant - Campaign
WM830,Ankit Jaiswal,ankit.jaiswal@shopdeck.com,ruchita.kachhadiya@blitzscale.co,Hits,Growth Consultant
WM895,Somoshri Sarkar,somoshri.sarkar@shopdeck.com,ruchita.kachhadiya@blitzscale.co,Hits,Growth Consultant
WM636,Mayank Nagar,mayank.nagar@shopdeck.com,anubhav.kumar@blitzscale.co,Hits,Growth Manager
WM843,Aniket Annasaheb Bhujang,aniket.bhujang@shopdeck.com,poshith.s@blitzscale.co,Hits,Growth Manager
WM1175,Aashirbad Sabat,aashirbad.sabat@shopdeck.com,utkarsh.verma@blitzscale.co,Hits,Growth Manager
WM1389,Sandhya Narwade,sandhya.narwade@blitzscale.co,ankit.yadav@blitzscale.co,Hits,Growth Lead`;

  // --- Parse -----------------------------------------------------------
  const lines = CSV.trim().split('\n');
  const header = lines[0].split(',');
  const people = lines.slice(1).map((ln) => {
    const c = ln.split(',');
    return {
      empId: c[0].trim(),
      name: c[1].trim(),
      email: c[2].trim().toLowerCase(),
      managerEmail: (c[3] || '').trim().toLowerCase(),
      teamRaw: (c[4] || '').trim(),
      designation: (c[5] || '').trim(),
    };
  });

  // --- Team taxonomy (the 9 cards) -------------------------------------
  const TEAMS = {
    core:      { key: 'core',      name: 'HITS Core Team',       short: 'Core',       icon: 'target',         accent: '#4764cd', tint: '#eff2fa' },
    midmarket: { key: 'midmarket', name: 'HITS 1k–5k Team',      short: '1k–5k',      icon: 'chart-line-up',  accent: '#673ab7', tint: '#f6f2ff' },
    goodseller:{ key: 'goodseller',name: 'HITS Good Seller Team',short: 'Good Seller',icon: 'medal',          accent: '#22a12a', tint: '#eeffed' },
    hypercare: { key: 'hypercare', name: 'HITS Hypercare Team',  short: 'Hypercare',  icon: 'first-aid-kit',  accent: '#00b1cc', tint: '#f2ffff' },
    revival:   { key: 'revival',   name: 'HITS Revival Team',    short: 'Revival',    icon: 'arrow-u-up-left',accent: '#e08a2d', tint: '#fff7f2' },
    campaign:  { key: 'campaign',  name: 'HITS Campaign Team',   short: 'Campaign',   icon: 'megaphone',      accent: '#e91e63', tint: '#fff2f2' },
    ai:        { key: 'ai',        name: 'HITS AI Team',         short: 'AI',         icon: 'sparkle',        accent: '#531ba8', tint: '#f6f2ff' },
    kae:       { key: 'kae',       name: 'HITS KAE Team',        short: 'KAE',        icon: 'identification-badge', accent: '#8d6708', tint: '#fbf6e6' },
    gm:        { key: 'gm',        name: 'HITS GM',              short: 'GM',         icon: 'crown-simple',   accent: '#1d2025', tint: '#f2f2f5' },
  };
  const TEAM_ORDER = ['core', 'midmarket', 'goodseller', 'hypercare', 'revival', 'campaign', 'ai', 'kae', 'gm'];

  function classify(p) {
    const d = p.designation.toLowerCase();
    if (d.includes('key account')) return 'kae';
    if (d.includes('ai ')) return 'ai';
    if (d.includes('campaign')) return 'campaign';
    if (d.includes('growth manager') || d.includes('category lead') || d.includes('business manager') || d.includes('assistant manager'))
      return 'gm';
    if (p.teamRaw === '1k-5k') return 'midmarket';
    if (p.teamRaw === 'Good Seller') return 'goodseller';
    if (p.teamRaw === 'Hyper Care') return 'hypercare';
    if (p.teamRaw === 'Revenue' || d.includes('escalation')) return 'revival';
    if (p.teamRaw === 'Hits') return 'core';
    // Data/Business analysts & ops, blank teams → treated as GM/support pool
    return 'gm';
  }

  people.forEach((p) => { p.team = classify(p); });

  // --- Seeded RNG helpers (stable per key) -----------------------------
  function fnv(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rngFor = (key) => mulberry32(fnv(String(key)));
  const between = (r, lo, hi) => lo + (hi - lo) * r;

  // --- Manager / reporting graph --------------------------------------
  const byEmail = {};
  people.forEach((p) => { byEmail[p.email] = p; });
  people.forEach((p) => { p.reports = []; });
  people.forEach((p) => {
    if (p.managerEmail && byEmail[p.managerEmail]) byEmail[p.managerEmail].reports.push(p);
  });
  function descendants(p, acc = [], seen = new Set()) {
    p.reports.forEach((r) => {
      if (seen.has(r.email)) return;
      seen.add(r.email); acc.push(r); descendants(r, acc, seen);
    });
    return acc;
  }

  // --- Roles -----------------------------------------------------------
  const ADMINS = ['roopesh.banavath@blitzscale.co', 'pratiksha.yadav@blitzscale.co', 'pawan.kumar@blitzscale.co'];
  function roleOf(p) {
    if (ADMINS.includes(p.email)) return 'admin';
    if (p.reports.length > 0) return 'manager';
    return 'gc';
  }
  people.forEach((p) => { p.role = roleOf(p); });

  // --- Time periods: AUTO-ROLLING --------------------------------------
  // Generated from a fixed start month up to the CURRENT month. When the
  // calendar rolls into a new month, that month's dropdown appears
  // automatically (no code change). MONTHS[last] = current pay period.
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function buildMonths(startY, startM) {
    const now = new Date();
    const endY = now.getFullYear(), endM = now.getMonth() + 1;
    const out = []; let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      out.push({ key: y + '-' + String(m).padStart(2, '0'), label: MONTH_NAMES[m - 1] + ' ' + y, month: m, year: y });
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }
  const MONTHS = buildMonths(2026, 1); // start Jan 2026
  const PERIOD = MONTHS[MONTHS.length - 1].label;

  // --- Formatters ------------------------------------------------------
  function inr(n) { if (n == null) return '—'; return '₹' + Math.round(n).toLocaleString('en-IN'); }
  function inrShort(n) {
    if (n == null) return '—';
    const a = Math.abs(n);
    if (a >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
    if (a >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
    if (a >= 1e3) return '₹' + (n / 1e3).toFixed(1) + 'k';
    return '₹' + Math.round(n);
  }
  function pct(n, d = 1) { if (n == null) return '—'; return (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d) + '%'; }
  function initials(name) { const parts = name.trim().split(/\s+/); return ((parts[0] || '')[0] || '') + ((parts[1] || '')[0] || ''); }

  // --- Demo personas for quick login ----------------------------------
  const DEMO = {
    admin:   byEmail['roopesh.banavath@blitzscale.co'],
    manager: byEmail['faizan.s@blitzscale.co'],
    gc:      byEmail['animesh.tiwari@blitzscale.co'],
    hypercare: byEmail['nikita.sinha@blitzscale.co'],
  };

  // Base object — engine.js extends this with the metric model & aggregations.
  window.INCENTIVE = {
    people, byEmail, TEAMS, TEAM_ORDER, MONTHS, PERIOD, DEMO, ADMINS,
    descendants, rngFor, between,
    inr, inrShort, pct, initials,
    // Source spreadsheets (for the Data Sources status panel). LIVE=false until
    // the Google Sheets API + OAuth read scope are wired to a backend.
    DATA_LIVE: false,
    DATA_SOURCES: [
      { name: 'HITs master', fileId: '118VOymNnTx_9xVSVr5AHLYZemTi-kxj2uBYURZPSGbQ', tab: 'hitsmaster', desc: 'Seller HITs by month/year (cols A–D)' },
      { name: 'People allocation', fileId: '1HliC-KU8MaUptWtlIXnvBn-MoOG07h1KJt-gJ-cvcno', tab: 'People', desc: 'GC/GM → team & manager mapping' },
      { name: 'HITs target', fileId: '1jsH10XfE1QQfx6ZgbiNt7FrKClPBZSVSiyT2CGn4AuE', tab: 'target', desc: 'Name, target, month, year, role' },
      { name: 'HITs handover', fileId: '1ZLOcj648aYvVaEGHX_QHB1Qx3OMUT3K_eeW-SBUbCso', tab: 'handover', desc: 'Col J TRUE/FALSE · GC (E) · GM (F)' },
      { name: '3-week go-live', fileId: '1i89A3_In2FGdfbc5HErMWquPFKfJLMcGekQBsYFfwZI', tab: '3weekgolive', desc: 'Seller IDs that are 3-week HITs' },
      { name: 'Spend / Live', fileId: '1wwfbMVkMKq80Znq1mkpO-NCLI-fc7d2hPIepCp04bQ0', tab: 'spendinputs', desc: 'Daily live (F) & spend (H) per GC (B) · Spend/Live = H÷F' },
      { name: 'Task & Callback adherence', fileId: '12rfk37xtBfletLM1w-gfeiuPZof5ctxnDy_75V5yL-o', tab: 'Task', desc: 'Subtask (D) · date (G) · GC (I) · status (M)' },
      { name: 'SOS / Escalations (WES)', fileId: '1SIww2UQnmcVs6lgLGYMxGLcxdCVf3MYkPZk7BfY3hIU', tab: 'sos', desc: 'Type (A) · seller (B) · date (C) · GC (E) → Input D' },
      { name: 'KAE Strikes log', fileId: '16JUSC2vOsG6SvN1-RhnFWZ5fdIrF1SyAYo_EiGbckkE', tab: 'Strikes_Log', desc: 'Date (B) · KAE (C) · Emp ID (D) · issue (G)' },
    ],
  };
})();
