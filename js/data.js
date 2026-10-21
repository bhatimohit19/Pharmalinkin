/* Demo data + LocalStorage store. All names/companies are fictional demo content. */
(function () {
  const PL = (window.PL = window.PL || {});
  const KEY = 'pharmalinkin_demo_v3', VERSION = 3, DAY = 864e5;
  const BASE = new Date(); BASE.setMinutes(0, 0, 0);
  const ago = (d, h = 0) => { if (d && typeof d === 'object') { h = d.h || h; d = d.d || 0; } return new Date(BASE.getTime() - d * DAY - h * 36e5).toISOString(); };
  const ahead = d => new Date(BASE.getTime() + d * DAY).toISOString().slice(0, 10);
  PL.DEMO_PW = 'Demo@123';
  PL.hashPw = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return 'h' + h; };

  PL.CATEGORIES = ['Medical Representative', 'Pharmaceutical Sales', 'Area Sales Manager', 'Regional Sales Manager', 'Zonal Sales Manager', 'National Sales Manager', 'Product Management', 'Medical Affairs', 'Regulatory Affairs', 'Quality Assurance', 'Quality Control', 'Pharmacovigilance', 'Clinical Research', 'Manufacturing', 'Production', 'R&D', 'Hospital Pharmacy', 'Retail Pharmacy', 'Distribution', 'Supply Chain', 'Medical Devices'];
  PL.QUALS = ['D.Pharm', 'B.Pharm', 'M.Pharm', 'Pharm.D', 'B.Sc Life Sciences', 'M.Sc Life Sciences', 'B.Tech Biotechnology', 'MBBS', 'MBA', 'Any Graduate'];
  PL.JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  PL.WORK_MODES = ['On-site', 'Hybrid', 'Remote', 'Field / Travelling'];
  PL.STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Offer', 'Hired', 'Rejected', 'Withdrawn'];
  PL.SIZES = ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];
  PL.INDUSTRIES = ['Pharmaceutical Manufacturing', 'Biotechnology', 'Clinical Research (CRO)', 'Diagnostics', 'Medical Devices', 'Healthcare Services', 'Pharma Distribution', 'Medical Education'];
  PL.PLACEMENTS = ['Feed', 'Sidebar', 'Jobs', 'Companies', 'Newsletter', 'Webinar', 'Course', 'Search'];

  const CITY = { M: ['Mumbai', 'Maharashtra'], P: ['Pune', 'Maharashtra'], H: ['Hyderabad', 'Telangana'], B: ['Bengaluru', 'Karnataka'], G: ['Gurugram', 'Haryana'], D: ['New Delhi', 'Delhi'], A: ['Ahmedabad', 'Gujarat'], V: ['Vadodara', 'Gujarat'], C: ['Chennai', 'Tamil Nadu'], K: ['Kolkata', 'West Bengal'], Ko: ['Kochi', 'Kerala'], I: ['Indore', 'Madhya Pradesh'], N: ['Nagpur', 'Maharashtra'] };

  const DEPT = {
    'Medical Representative': { r: ['Promote the assigned product portfolio to doctors, chemists and hospitals in the territory', 'Achieve monthly call, coverage and sales targets', 'Maintain accurate field reports and CRM records', 'Organise doctor meets and CME activities in line with company policy'], s: ['Product knowledge', 'Territory management', 'Communication', 'CRM tools'] },
    'Regulatory Affairs': { r: ['Prepare and review CTD/eCTD dossiers for submission', 'Track regulatory change and assess impact on products', 'Coordinate responses to agency queries with cross-functional teams', 'Maintain product licences, renewals and variation filings'], s: ['CTD / eCTD', 'Regulatory guidelines', 'Technical writing', 'Dossier review'] },
    'Quality Assurance': { r: ['Review batch manufacturing and packing records', 'Support internal audits and external inspections', 'Manage deviations, CAPA and change controls', 'Ensure GMP and data integrity compliance on the shop floor'], s: ['GMP', 'Documentation', 'CAPA', 'Audit readiness'] },
    'Quality Control': { r: ['Perform analysis of raw material, in-process and finished product samples', 'Operate and maintain analytical instruments such as HPLC and GC', 'Document results in line with data integrity norms', 'Support method validation and stability studies'], s: ['HPLC', 'Wet chemistry', 'Data integrity', 'Method validation'] },
    'Clinical Research': { r: ['Support site selection, initiation, monitoring and close-out', 'Review source data and ensure protocol and ICH-GCP compliance', 'Maintain trial master file and tracking systems', 'Coordinate with investigators, sponsors and ethics committees'], s: ['ICH-GCP', 'Site monitoring', 'EDC systems', 'Protocol review'] },
    'Pharmacovigilance': { r: ['Process individual case safety reports within regulatory timelines', 'Perform MedDRA coding and narrative writing', 'Support aggregate reports and signal detection activities', 'Maintain safety database quality and reconciliation'], s: ['MedDRA', 'Case processing', 'Argus / safety databases', 'Narrative writing'] },
    'Medical Affairs': { r: ['Engage key opinion leaders and provide scientific exchange', 'Develop medical content and training for field teams', 'Support advisory boards and investigator-initiated studies', 'Respond to unsolicited medical information requests'], s: ['Scientific communication', 'KOL engagement', 'Therapy area expertise', 'Medical content'] },
    'R&D': { r: ['Design and execute formulation development experiments', 'Prepare technical documents and development reports', 'Support scale-up and technology transfer to manufacturing', 'Maintain laboratory notebooks and compliance records'], s: ['Formulation', 'DoE', 'Technology transfer', 'Analytical basics'] },
    'Production': { r: ['Execute daily production as per approved batch records', 'Supervise operators and ensure line clearance and hygiene norms', 'Drive yield, OEE and downtime improvements', 'Coordinate with QA, warehouse and maintenance teams'], s: ['Tablet / capsule process', 'GMP', 'Lean manufacturing', 'Team supervision'] },
    'Manufacturing': { r: ['Lead end-to-end plant operations and output planning', 'Own safety, quality and compliance KPIs', 'Drive capacity expansion and cost improvement projects', 'Build and mentor the site leadership team'], s: ['Plant operations', 'Regulatory inspections', 'Budgeting', 'Leadership'] }
  };
  const SALES = { r: ['Own the sales plan and revenue targets for the territory', 'Coach and review a field team of medical representatives', 'Build relationships with key doctors, institutions and channel partners', 'Analyse secondary sales data and plan coverage'], s: ['Team leadership', 'Sales analytics', 'Territory planning', 'Key account management'] };
  const GENERIC = { r: ['Deliver against the objectives of the role and report progress to the manager', 'Collaborate with cross-functional teams', 'Follow applicable SOPs, compliance and safety requirements', 'Contribute to continuous improvement initiatives'], s: ['Communication', 'Stakeholder management', 'Problem solving', 'MS Office'] };
  const deptText = d => DEPT[d] || (/Sales|Distribution|Retail/.test(d) ? SALES : GENERIC);
  PL.deptText = deptText;
  const BENEFITS = ['Health insurance', 'Performance incentives', 'Provident fund', 'Learning & certification support', 'Annual bonus', 'Travel allowance'];

  const demoProfile = p => ({ onboarded: true, level: 'Experienced', dob: '1996-05-14', resumeFile: p.resume ? p.resume.name : '', education: [{ id: 'e0', level: '10th', degree: 'High School (10th)', board: 'CBSE', institute: 'Demo Public School, Mumbai', year: '2012', grade: '85', current: false }, { id: 'e00', level: '12th', degree: 'Intermediate (12th) (Science)', board: 'CBSE', institute: 'Demo Junior College, Mumbai', year: '2014', grade: '80', current: false }, { id: 'e1', level: 'Graduation', degree: 'B.Pharm', board: '', institute: 'Demo College of Pharmacy, Mumbai', year: '2022', grade: '8.2', current: false }] });
  function seed() {
    const s = { version: VERSION, counters: {}, settings: { siteName: 'PharmaLinkIn', supportEmail: 'support@pharmalinkin.example', moderation: true, allowRegistration: true, maintenance: false }, categories: PL.CATEGORIES.slice(), templates: [
      { id: 'tpl1', name: 'Application received', subject: 'We received your application', body: 'Hi {{name}}, your application for {{job}} has been received.' },
      { id: 'tpl2', name: 'Interview invitation', subject: 'Interview scheduled for {{job}}', body: 'Hi {{name}}, your interview is scheduled on {{date}} at {{time}}.' },
      { id: 'tpl3', name: 'Job approved', subject: 'Your job is live', body: 'Your job "{{job}}" has been approved and is now visible to candidates.' },
      { id: 'tpl4', name: 'Job rejected', subject: 'Your job needs changes', body: 'Your job "{{job}}" was not approved. Reason: {{reason}}.' }] };

    /* ---- companies ---- */
    const C = (id, name, industry, size, city, verification, about, extra = {}) => ({ id, name, industry, size, hq: CITY[city].join(', '), locations: [CITY[city][0]], verification, description: about, website: 'https://' + name.toLowerCase().replace(/[^a-z]+/g, '') + '.example.com', specializations: [], culture: 'We value scientific rigour, patient-first thinking and continuous learning.', benefits: BENEFITS.slice(0, 4), social: { linkedin: '', twitter: '' }, logoImg: '', coverImg: '', createdAt: ago(300), ...extra });
    s.companies = [
      C('c1', 'Medicura Pharma', 'Pharmaceutical Manufacturing', '5000+', 'M', 'Verified', 'Medicura Pharma is a demo company representing a large branded-generics manufacturer with oncology, cardiology and respiratory portfolios.', { locations: ['Mumbai', 'Vadodara', 'Ahmedabad', 'Pune'], specializations: ['Oncology', 'Cardiology', 'Oral solids'], recruiterIds: ['r1'] }),
      C('c2', 'Veridian Lifesciences', 'Biotechnology', '1001-5000', 'H', 'Verified', 'Veridian Lifesciences is a demo biotech with research, clinical development and medical affairs teams across India.', { locations: ['Hyderabad', 'Bengaluru'], specializations: ['Biologics', 'Clinical development'], recruiterIds: ['r2'] }),
      C('c3', 'Axiom Biotech', 'Biotechnology', '201-500', 'B', 'Verified', 'Axiom Biotech is a demo mid-size biotech focused on process development and regulatory CMC.', { specializations: ['Bioprocess', 'CMC'], recruiterIds: ['r7'] }),
      C('c4', 'Novacare Healthcare', 'Pharma Distribution', '1001-5000', 'M', 'Verified', 'Novacare Healthcare is a demo sales-led pharma company with a pan-India field force and retail network.', { locations: ['Mumbai', 'New Delhi', 'Chennai', 'Gurugram'], specializations: ['Respiratory', 'Diabetes', 'Primary care'], recruiterIds: ['r3'] }),
      C('c5', 'Sanjivani Labs', 'Pharmaceutical Manufacturing', '501-1000', 'A', 'Verified', 'Sanjivani Labs is a demo generics manufacturer with oral solid and liquid dosage plants.', { locations: ['Ahmedabad', 'Vadodara'], specializations: ['Generics', 'Oral solids'], recruiterIds: ['r4'] }),
      C('c6', 'Helix Diagnostics', 'Diagnostics', '501-1000', 'P', 'Verified', 'Helix Diagnostics is a demo diagnostics and pathology network with hospital partnerships.', { specializations: ['Pathology', 'Hospital labs'], recruiterIds: ['r8'] }),
      C('c7', 'Aurora Medical Devices', 'Medical Devices', '201-500', 'C', 'Verified', 'Aurora Medical Devices is a demo manufacturer of surgical and monitoring devices.', { specializations: ['Surgical devices', 'Patient monitoring'], recruiterIds: ['r9'] }),
      C('c8', 'CureWell Pharmaceuticals', 'Pharmaceutical Manufacturing', '1001-5000', 'V', 'Pending', 'CureWell Pharmaceuticals is a demo company awaiting employer verification.', { recruiterIds: ['r5'] }),
      C('c9', 'Zenith Clinical Research', 'Clinical Research (CRO)', '501-1000', 'H', 'Verified', 'Zenith Clinical Research is a demo CRO offering data management, monitoring and safety services.', { locations: ['Hyderabad', 'Bengaluru'], specializations: ['Clinical operations', 'Data management', 'Pharmacovigilance'], recruiterIds: ['r10'] }),
      C('c10', 'BioNova Labs', 'Biotechnology', '51-200', 'B', 'Pending', 'BioNova Labs is a demo early-stage biotech startup awaiting verification.', { recruiterIds: ['r6'] })
    ];

    /* ---- users ---- */
    const pw = PL.hashPw(PL.DEMO_PW);
    const base = (id, name, email, role, city, createdDays, extra = {}) => ({ id, name, email, role, status: 'Active', verified: true, pw, phone: '+91 98' + String(10000000 + Math.abs(id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 89999999), location: CITY[city].join(', '), createdAt: ago(createdDays), photo: '', ...extra });
    const cand = (id, name, city, headline, title, company, qual, exp, skills, days, prefRoles, edu, extra = {}) => base(id, name, id + '@demo.pharmalinkin.example', 'candidate', city, days, {
      profile: { headline, title, company, qualification: qual, experienceYears: exp, about: `${name} is a demo ${title.toLowerCase()} profile used to illustrate the PharmaLinkIn candidate experience.`, education: edu, experience: [{ id: 'x1', title, company, from: String(2026 - Math.max(1, exp)), to: 'Present', desc: 'Demo experience entry.' }], skills, certifications: [], languages: ['English', 'Hindi'], coverImg: '', views: 20 + (exp * 13) % 70,
        preferences: { roles: prefRoles, locations: [CITY[city][0]], salary: '₹6+ LPA', jobType: 'Full-time' }, privacy: { visibility: 'Public', showEmail: false, showPhone: false },
        resume: exp > 0 ? { name: name.split(' ')[0] + '_' + name.split(' ').pop() + '_Resume.pdf', type: 'PDF', size: 180000 + exp * 9000, visibility: 'Recruiters only', uploadedAt: ago(30) } : null }, ...extra });
    s.users = [
      cand('u1', 'Mohit Bhati', 'M', 'Medical Representative | Oncology & Cardiology | 4 yrs field experience', 'Medical Representative', 'Zorvia Healthcare', 'B.Pharm', 4, ['Product knowledge', 'Territory management', 'KOL engagement', 'CRM tools', 'Oncology'], 200, ['Medical Representative', 'Area Sales Manager'], [{ id: 'e1', degree: 'B.Pharm', institute: 'Demo College of Pharmacy, Mumbai', year: '2022' }]),
      cand('u2', 'Sneha Kulkarni', 'P', 'Regulatory Affairs Specialist | CTD & eCTD dossiers', 'Regulatory Affairs Specialist', 'Lumina Pharma', 'M.Pharm', 5, ['CTD / eCTD', 'Dossier review', 'Regulatory guidelines'], 180, ['Regulatory Affairs'], [{ id: 'e1', degree: 'M.Pharm (Pharmaceutics)', institute: 'Demo Institute of Pharmaceutical Sciences', year: '2020' }]),
      cand('u3', 'Dr. Imran Sheikh', 'H', 'Clinical Research Physician | Phase II–III oncology trials', 'Clinical Research Physician', 'Zenith Clinical Research', 'MBBS', 8, ['ICH-GCP', 'Protocol review', 'Safety monitoring'], 170, ['Clinical Research', 'Medical Affairs'], [{ id: 'e1', degree: 'MBBS', institute: 'Demo Medical College', year: '2015' }]),
      cand('u4', 'Ananya Reddy', 'H', 'QA Executive | GMP & documentation', 'QA Executive', 'Praxon Labs', 'B.Pharm', 3, ['GMP', 'CAPA', 'Documentation'], 150, ['Quality Assurance', 'Quality Control'], [{ id: 'e1', degree: 'B.Pharm', institute: 'Demo College of Pharmacy, Hyderabad', year: '2021' }]),
      cand('u5', 'Rohit Verma', 'D', 'Area Sales Manager | Respiratory & Diabetes | 8 yrs', 'Area Sales Manager', 'Novacare Healthcare', 'B.Pharm', 8, ['Team leadership', 'Territory planning', 'Sales analytics'], 140, ['Area Sales Manager', 'Regional Sales Manager'], [{ id: 'e1', degree: 'B.Pharm', institute: 'Demo University', year: '2016' }, { id: 'e2', degree: 'MBA (Marketing)', institute: 'Demo Business School', year: '2019' }]),
      cand('u6', 'Kavya Menon', 'Ko', 'Pharmacovigilance Associate | Case processing', 'PV Associate', 'SafeRx Solutions', 'Pharm.D', 2, ['MedDRA', 'Case processing', 'Narrative writing'], 120, ['Pharmacovigilance'], [{ id: 'e1', degree: 'Pharm.D', institute: 'Demo College of Pharmacy, Kochi', year: '2023' }]),
      cand('u7', 'Vikram Singh', 'A', 'Production Manager | Oral solid dosage', 'Production Manager', 'Sanjivani Labs', 'B.Pharm', 11, ['Lean manufacturing', 'GMP', 'Team supervision'], 110, ['Production', 'Manufacturing'], [{ id: 'e1', degree: 'B.Pharm', institute: 'Demo Pharma Institute', year: '2013' }]),
      cand('u8', 'Neha Joshi', 'N', 'Hospital Pharmacist | Clinical pharmacy & stewardship', 'Clinical Pharmacist', 'City Care Hospital', 'Pharm.D', 5, ['Clinical pharmacy', 'Antimicrobial stewardship', 'Inventory control'], 100, ['Hospital Pharmacy', 'Pharmacovigilance'], [{ id: 'e1', degree: 'Pharm.D', institute: 'Demo College of Pharmacy, Nagpur', year: '2019' }]),
      cand('u9', 'Arjun Patel', 'V', 'R&D Scientist | Formulation development', 'Research Scientist', 'Lumina Pharma', 'M.Pharm', 6, ['Formulation', 'DoE', 'Technology transfer'], 90, ['R&D'], [{ id: 'e1', degree: 'M.Pharm (Pharmaceutics)', institute: 'Demo University', year: '2018' }]),
      cand('u10', 'Divya Nair', 'B', 'Medical Affairs Manager | Oncology', 'Medical Affairs Manager', 'Veridian Lifesciences', 'Pharm.D', 9, ['KOL engagement', 'Medical content', 'Scientific communication'], 80, ['Medical Affairs'], [{ id: 'e1', degree: 'Pharm.D', institute: 'Demo College of Pharmacy, Bengaluru', year: '2016' }]),
      cand('u11', 'Suresh Kumar', 'C', 'Retail Pharmacy Manager | Chain operations', 'Retail Pharmacy Manager', 'HealthPlus Pharmacy', 'D.Pharm', 7, ['Inventory control', 'Team supervision', 'Customer service'], 70, ['Retail Pharmacy', 'Medical Representative'], [{ id: 'e1', degree: 'D.Pharm', institute: 'Demo Diploma Institute', year: '2017' }]),
      cand('u12', 'Meera Iyer', 'M', 'Product Manager | Diabetes portfolio', 'Product Manager', 'Novacare Healthcare', 'MBA', 7, ['Brand strategy', 'Market research', 'Portfolio planning'], 60, ['Product Management'], [{ id: 'e1', degree: 'B.Pharm', institute: 'Demo University', year: '2015' }, { id: 'e2', degree: 'MBA', institute: 'Demo Business School', year: '2018' }]),
      cand('u13', 'Tanvi Shah', 'P', 'Fresher B.Pharm graduate seeking QC / QA roles', 'Graduate trainee', '—', 'B.Pharm', 0, ['HPLC basics', 'Wet chemistry'], 20, ['Quality Control'], [{ id: 'e1', degree: 'B.Pharm', institute: 'Demo College of Pharmacy, Pune', year: '2026' }], { status: 'Pending Verification', verified: false })
    ];
    const rec = (id, name, designation, cid, city, days, extra = {}) => base(id, name, id + '@demo.pharmalinkin.example', 'recruiter', city, days, { companyId: cid, profile: { headline: designation, title: designation, company: s.companies.find(c => c.id === cid).name }, ...extra });
    s.users.push(
      rec('r1', 'Priya Nair', 'HR Business Partner', 'c1', 'M', 280), rec('r2', 'Sayara Negi', 'Human Resource Manager', 'c2', 'H', 260), rec('r3', 'Karthik Rao', 'Talent Acquisition Lead', 'c4', 'M', 250),
      rec('r4', 'Farah Khan', 'HR Manager', 'c5', 'A', 240), rec('r5', 'Manish Gupta', 'Recruitment Lead', 'c8', 'V', 40, { status: 'Active' }), rec('r6', 'Tara Bose', 'Founder & HR', 'c10', 'B', 15),
      rec('r7', 'Ishaan Das', 'Talent Partner', 'c3', 'B', 200), rec('r8', 'Leena Pawar', 'HR Executive', 'c6', 'P', 190), rec('r9', 'Gopal Krishnan', 'HR Manager', 'c7', 'C', 170), rec('r10', 'Nandini Rao', 'Recruitment Manager', 'c9', 'H', 160),
      base('a1', 'Pooja Shah', 'a1@demo.pharmalinkin.example', 'advertiser', 'M', 150, { brand: 'Praxis Medical Education', profile: { headline: 'Marketing Lead', company: 'Praxis Medical Education' } }),
      base('a2', 'Rahul Iyer', 'a2@demo.pharmalinkin.example', 'advertiser', 'B', 130, { brand: 'LabEdge Instruments', profile: { headline: 'Brand Manager', company: 'LabEdge Instruments' } }),
      base('a3', 'Nikhil Rao', 'a3@demo.pharmalinkin.example', 'advertiser', 'M', 120, { brand: 'Medicura Pharma – Talent Brand', profile: { headline: 'Employer Branding', company: 'Medicura Pharma' } }),
      base('a4', 'Isha Kapoor', 'a4@demo.pharmalinkin.example', 'advertiser', 'D', 12, { brand: 'CarePlus HealthTech', profile: { headline: 'Growth Marketing', company: 'CarePlus HealthTech' } }),
      base('adm1', 'Platform Admin', 'admin@demo.pharmalinkin.example', 'admin', 'M', 330, { profile: { headline: 'Super Administrator', company: 'PharmaLinkIn' } }),
      base('u14', 'Harish Pillai', 'harish@demo.pharmalinkin.example', 'candidate', 'Ko', 90, { status: 'Suspended', profile: { headline: 'Medical Representative', title: 'MR', company: '—', qualification: 'B.Sc Life Sciences', experienceYears: 2, about: '', education: [], experience: [], skills: [], certifications: [], languages: [], preferences: { roles: [], locations: [], salary: '', jobType: 'Full-time' }, privacy: { visibility: 'Public', showEmail: false, showPhone: false }, resume: null, views: 4 } }));

    /* ---- jobs ---- */
    const recOf = {}; s.companies.forEach(c => (recOf[c.id] = c.recruiterIds[0]));
    const J = (id, title, dept, cid, city, qual, exp, sal, type, mode, status, d, close, views, featured, extra = {}) => {
      const t = deptText(dept);
      return { id, title, department: dept, companyId: cid, recruiterId: recOf[cid], city: CITY[city][0], state: CITY[city][1], country: 'India', locations: [CITY[city][0]], location: CITY[city].join(', '), qualification: qual, expMin: exp[0], expMax: exp[1], salMin: sal[0], salMax: sal[1], salaryPeriod: 'LPA', type, workMode: mode, vacancies: 1 + (views % 4), status, createdAt: ago(d), closingDate: ahead(close), views, featured: !!featured,
        description: `${title} at ${s.companies.find(c => c.id === cid).name}. This is demo job content created to illustrate the PharmaLinkIn candidate and employer experience.`, responsibilities: t.r, skills: t.s, preferred: 'Prior industry exposure and relevant certifications are an advantage.', benefits: BENEFITS.slice(0, 3 + (views % 3)), incentives: /Sales|Representative|Distribution/.test(dept) ? 'Quarterly performance incentive' : '', travel: /Field|Sales|Representative/.test(dept + mode) ? 'Up to 60% travel' : 'Minimal', specialization: dept, certifications: '', questions: ['How many years of experience do you have in ' + dept + '?', 'What is your notice period?'], ...extra };
    };
    s.jobs = [
      J('j1', 'Medical Representative – Oncology', 'Medical Representative', 'c1', 'M', 'B.Pharm', [1, 4], [4, 7], 'Full-time', 'Field / Travelling', 'Published', 3, 25, 412, true),
      J('j2', 'Regulatory Affairs Specialist', 'Regulatory Affairs', 'c1', 'M', 'M.Pharm', [3, 6], [8, 14], 'Full-time', 'Hybrid', 'Published', 5, 30, 288),
      J('j3', 'QA Executive – Formulations', 'Quality Assurance', 'c1', 'V', 'B.Pharm', [2, 5], [4, 7], 'Full-time', 'On-site', 'Published', 8, 21, 190),
      J('j4', 'Area Sales Manager – Cardiology', 'Area Sales Manager', 'c1', 'P', 'B.Pharm', [5, 9], [9, 14], 'Full-time', 'Field / Travelling', 'Pending Approval', 1, 40, 0),
      J('j5', 'Production Supervisor', 'Production', 'c1', 'A', 'B.Sc Life Sciences', [3, 6], [5, 8], 'Full-time', 'On-site', 'Draft', 2, 45, 0),
      J('j6', 'Pharmacovigilance Associate', 'Pharmacovigilance', 'c1', 'M', 'Pharm.D', [0, 2], [4, 6], 'Full-time', 'Hybrid', 'Paused', 20, 15, 96),
      J('j7', 'Clinical Research Associate', 'Clinical Research', 'c2', 'H', 'M.Sc Life Sciences', [2, 5], [6, 10], 'Full-time', 'Hybrid', 'Published', 2, 28, 340, true),
      J('j8', 'Medical Affairs Manager', 'Medical Affairs', 'c2', 'H', 'Pharm.D', [6, 10], [22, 32], 'Full-time', 'Hybrid', 'Published', 4, 35, 210),
      J('j9', 'R&D Scientist – Formulation', 'R&D', 'c2', 'H', 'M.Pharm', [3, 7], [9, 15], 'Full-time', 'On-site', 'Published', 6, 30, 177),
      J('j10', 'Regional Sales Manager – West', 'Regional Sales Manager', 'c4', 'M', 'MBA', [8, 12], [20, 28], 'Full-time', 'Field / Travelling', 'Published', 1, 30, 233, true),
      J('j11', 'Medical Representative – Respiratory', 'Medical Representative', 'c4', 'D', 'B.Pharm', [0, 3], [3.5, 5.5], 'Full-time', 'Field / Travelling', 'Published', 3, 20, 301),
      J('j12', 'Zonal Sales Manager – North', 'Zonal Sales Manager', 'c4', 'G', 'MBA', [10, 15], [28, 38], 'Full-time', 'Field / Travelling', 'Published', 9, 30, 120),
      J('j13', 'National Sales Manager', 'National Sales Manager', 'c4', 'M', 'MBA', [15, 20], [45, 60], 'Full-time', 'Hybrid', 'Published', 12, 45, 98),
      J('j14', 'Product Manager – Diabetes', 'Product Management', 'c4', 'M', 'MBA', [5, 8], [18, 26], 'Full-time', 'Hybrid', 'Published', 7, 30, 154),
      J('j15', 'Production Executive – Tablets', 'Production', 'c5', 'A', 'B.Pharm', [1, 4], [3.5, 5.5], 'Full-time', 'On-site', 'Published', 2, 20, 143),
      J('j16', 'QC Analyst – HPLC', 'Quality Control', 'c5', 'A', 'M.Sc Life Sciences', [1, 4], [3.5, 6], 'Full-time', 'On-site', 'Published', 5, 25, 167),
      J('j17', 'Manufacturing Head – Oral Solids', 'Manufacturing', 'c5', 'V', 'B.Tech Biotechnology', [15, 20], [35, 50], 'Full-time', 'On-site', 'Published', 15, 45, 76),
      J('j18', 'Supply Chain Planner', 'Supply Chain', 'c5', 'A', 'MBA', [3, 6], [7, 11], 'Full-time', 'Hybrid', 'Published', 4, 30, 88),
      J('j19', 'Distribution Manager – South', 'Distribution', 'c4', 'C', 'Any Graduate', [6, 10], [10, 15], 'Full-time', 'Hybrid', 'Published', 11, 30, 64),
      J('j20', 'Hospital Pharmacist', 'Hospital Pharmacy', 'c6', 'P', 'Pharm.D', [0, 3], [3, 4.5], 'Full-time', 'On-site', 'Published', 6, 20, 119),
      J('j21', 'Retail Pharmacy Manager', 'Retail Pharmacy', 'c4', 'C', 'D.Pharm', [3, 7], [4.5, 7], 'Full-time', 'On-site', 'Published', 10, 25, 101),
      J('j22', 'Medical Devices Sales Specialist', 'Medical Devices', 'c7', 'C', 'B.Tech Biotechnology', [2, 6], [6, 10], 'Full-time', 'Field / Travelling', 'Published', 3, 30, 132),
      J('j23', 'Clinical Data Manager', 'Clinical Research', 'c9', 'H', 'M.Sc Life Sciences', [4, 8], [12, 18], 'Full-time', 'Hybrid', 'Published', 8, 30, 205, true),
      J('j24', 'Pharmacovigilance Safety Scientist', 'Pharmacovigilance', 'c9', 'B', 'Pharm.D', [2, 5], [7, 11], 'Full-time', 'Hybrid', 'Published', 2, 30, 158),
      J('j25', 'Biotech Process Engineer', 'R&D', 'c3', 'B', 'B.Tech Biotechnology', [3, 6], [8, 13], 'Full-time', 'On-site', 'Published', 5, 28, 111),
      J('j26', 'Regulatory Affairs Associate – CMC', 'Regulatory Affairs', 'c3', 'B', 'M.Pharm', [1, 3], [5, 8], 'Full-time', 'Hybrid', 'Published', 1, 30, 72),
      J('j27', 'Medical Representative – Diagnostics', 'Medical Representative', 'c6', 'K', 'B.Sc Life Sciences', [1, 3], [3.2, 5], 'Full-time', 'Field / Travelling', 'Published', 9, 18, 99),
      J('j28', 'QA Documentation Officer', 'Quality Assurance', 'c8', 'V', 'B.Pharm', [1, 3], [3.5, 5], 'Full-time', 'On-site', 'Pending Approval', 2, 30, 0),
      J('j29', 'Area Sales Manager – Gastro', 'Area Sales Manager', 'c8', 'I', 'B.Pharm', [5, 8], [8, 12], 'Full-time', 'Field / Travelling', 'Pending Approval', 1, 30, 0),
      J('j30', 'Lab Technologist', 'Quality Control', 'c10', 'B', 'M.Sc Life Sciences', [0, 2], [3, 4.5], 'Full-time', 'On-site', 'Rejected', 6, 20, 0, false, { rejectionReason: 'Salary and responsibilities are incomplete. Please add detailed duties.' }),
      J('j31', 'Medical Science Liaison', 'Medical Affairs', 'c2', 'B', 'Pharm.D', [4, 8], [18, 26], 'Full-time', 'Hybrid', 'Expired', 40, -3, 260),
      J('j32', 'Quality Control Chemist', 'Quality Control', 'c1', 'M', 'M.Sc Life Sciences', [2, 4], [4.5, 7], 'Full-time', 'On-site', 'Closed', 60, -20, 310),
      J('j33', 'Clinical Trial Coordinator', 'Clinical Research', 'c2', 'H', 'B.Sc Life Sciences', [1, 3], [4, 6], 'Full-time', 'On-site', 'Closed', 120, -80, 280),
      J('j34', 'Territory Business Manager', 'Pharmaceutical Sales', 'c4', 'D', 'B.Pharm', [3, 6], [6, 9], 'Full-time', 'Field / Travelling', 'Closed', 150, -110, 350),
      J('j35', 'Packaging Operator Lead', 'Production', 'c5', 'A', 'Any Graduate', [2, 5], [3, 4.5], 'Full-time', 'On-site', 'Closed', 200, -160, 120),
      J('j36', 'Biostatistician', 'Clinical Research', 'c9', 'H', 'M.Sc Life Sciences', [3, 6], [9, 14], 'Full-time', 'Hybrid', 'Closed', 250, -210, 190)
    ];

    /* ---- applications ---- */
    const coverFor = n => `Dear Hiring Team, I am excited to apply for this role. With my background and passion for the pharmaceutical industry I believe I can contribute from day one. Regards, ${n}`;
    const A = (id, jobId, candId, status, d, extra = {}) => {
      const u = s.users.find(x => x.id === candId), j = s.jobs.find(x => x.id === jobId);
      const history = [{ status: 'Applied', at: ago(d), note: 'Application submitted' }];
      if (status !== 'Applied') history.push({ status, at: ago(Math.max(0, d - 1)), note: 'Status updated by employer' });
      return { id, ref: 'PLI-2026-' + String(1000 + parseInt(id.slice(1), 10)), jobId, candidateId: candId, recruiterId: j.recruiterId, resumeName: u.profile && u.profile.resume ? u.profile.resume.name : 'Resume.pdf', coverLetter: coverFor(u.name), answers: j.questions.map((q, i) => ({ q, a: i ? '30 days' : String(Math.max(1, (u.profile && u.profile.experienceYears) || 1)) })), status, appliedAt: ago(d), updatedAt: ago(Math.max(0, d - 1)), notes: [], interview: null, history, phone: u.phone, ...extra };
    };
    s.applications = [
      A('a1', 'j1', 'u1', 'Interview Scheduled', 6, { interview: { date: ahead(3), time: '11:00', type: 'Video call', link: 'https://meet.example.com/pli-demo-1', interviewer: 'Priya Nair', notes: 'Please keep ID proof ready.', status: 'Scheduled' } }),
      A('a2', 'j1', 'u5', 'Applied', 2), A('a3', 'j1', 'u11', 'Shortlisted', 5, { notes: [{ id: 'n1', by: 'r1', text: 'Good retail exposure; check territory fit.', at: ago(4) }] }), A('a4', 'j1', 'u8', 'Applied', 1),
      A('a5', 'j2', 'u2', 'Interview Scheduled', 7, { interview: { date: ahead(2), time: '15:30', type: 'In person', link: 'Medicura HQ, Andheri East, Mumbai', interviewer: 'Priya Nair', notes: '', status: 'Scheduled' } }),
      A('a6', 'j2', 'u10', 'Under Review', 4), A('a7', 'j2', 'u9', 'Applied', 3),
      A('a8', 'j3', 'u4', 'Shortlisted', 8), A('a9', 'j3', 'u7', 'Under Review', 6), A('a10', 'j3', 'u9', 'Rejected', 9),
      A('a11', 'j6', 'u6', 'Applied', 15), A('a12', 'j6', 'u8', 'Applied', 14),
      A('a14', 'j11', 'u1', 'Under Review', 2), A('a16', 'j27', 'u1', 'Rejected', 20),
      A('a17', 'j7', 'u3', 'Under Review', 1), A('a18', 'j10', 'u5', 'Applied', 1),
      A('a23', 'j32', 'u13', 'Rejected', 40), A('a24', 'j32', 'u4', 'Hired', 45), A('a25', 'j32', 'u7', 'Rejected', 30),
      A('a19', 'j33', 'u3', 'Hired', 110), A('a20', 'j34', 'u5', 'Hired', 140), A('a21', 'j35', 'u7', 'Rejected', 190), A('a22', 'j36', 'u10', 'Offer', 240)
    ];

    /* ---- news ---- */
    const N = (id, title, cat, d, sponsored, summary, body) => ({ id, title, category: cat, createdAt: ago(d), sponsored, summary, body, source: sponsored ? 'Sponsored content' : 'PharmaLinkIn Editorial (demo)' });
    s.news = [
      N('n1', 'Digital documentation is reshaping GMP audit readiness', 'Manufacturing', 1, false, 'Demo article: why paperless batch records are becoming the norm in oral solid dosage plants.', ['This is illustrative demo editorial content for the prototype.', 'Plants adopting electronic batch records report faster review cycles and fewer transcription errors, although validation effort remains significant.', 'Quality leaders advise starting with a single line, defining data-integrity controls early and training operators before go-live.']),
      N('n2', 'What clinical research associates should know about decentralised trials', 'Clinical Trials', 2, false, 'Demo article on remote monitoring skills and hybrid trial models.', ['Illustrative demo content.', 'Decentralised and hybrid trial elements bring new responsibilities for monitors, from remote source data review to vendor oversight.', 'Professionals can build confidence through ICH-GCP refreshers and hands-on EDC training.']),
      N('n3', 'Regulatory affairs: preparing a clean CTD Module 3', 'Regulatory', 3, false, 'Demo checklist-style piece for CMC authors.', ['Illustrative demo content.', 'A well structured Module 3 reduces review queries. Align specifications, stability data and justification sections early.', 'Use version-controlled templates and an internal peer-review step before submission.']),
      N('n4', 'Career guide: moving from Medical Representative to Area Sales Manager', 'Careers', 4, false, 'Demo career article on skills, mentoring and territory results.', ['Illustrative demo content.', 'Managers look for consistent target delivery, coaching potential and analytical thinking.', 'Seek stretch assignments such as mentoring new joiners and leading product launches in your territory.']),
      N('n5', 'Pharmacovigilance case processing: automation and the human reviewer', 'Technology', 6, false, 'Demo piece on assisted coding and quality review.', ['Illustrative demo content.', 'Automation can speed up intake and coding, but trained safety professionals remain essential for medical review and quality control.']),
      N('n6', 'Upskill in Clinical Research – certification programme (Sponsored)', 'Careers', 2, true, 'Sponsored by Praxis Medical Education. A demo programme listing for aspiring clinical research professionals.', ['This is a sponsored article. It is a demo advertisement and not editorial content.', 'The programme outline, schedule and fees are illustrative values only.']),
      N('n7', 'Supply-chain resilience for temperature-sensitive medicines', 'Market', 8, false, 'Demo article on cold-chain planning and supplier diversification.', ['Illustrative demo content.', 'Planners combine safety stock, qualified alternate suppliers and monitoring technology to protect product integrity.']),
      N('n8', 'Policy watch: what employers should track this quarter', 'Policy', 9, false, 'Demo summary of compliance topics for pharma employers.', ['Illustrative demo content, not legal advice.', 'Employers should monitor licensing renewals, labelling updates and data-protection obligations.'])
    ];

    /* ---- posts ---- */
    const cm = (id, userId, text, d) => ({ id, userId, text, createdAt: ago(d) });
    const P = (id, authorId, d, content, tags, likes, comments, extra = {}) => ({ id, authorId, topic: '', content, image: '', imageSeed: '', hashtags: tags, likes, comments, createdAt: ago(d.d || d, d.h || 0), visibility: 'Public', type: 'organic', removed: false, ...extra });
    s.posts = [
      P('p1', 'u2', { d: 0, h: 3 }, 'Delighted to share that our regulatory team closed a six-month dossier submission cycle. Biggest lesson: lock the Module 3 specifications early and keep a living query-response tracker. Happy to share templates with anyone starting their first CTD.', ['RegulatoryAffairs', 'CTD'], ['u1', 'u4', 'u10', 'u9'], [cm('cm1', 'u10', 'Great insight, Sneha. Would love the tracker template.', 0), cm('cm2', 'u4', 'Congratulations to the team!', 0)], { topic: 'Achievement', imageSeed: 'dossier' }),
      P('p2', 'r1', 1, 'We are hiring! Medicura Pharma is growing its oncology field team in Mumbai. If you have 1–4 years of experience as a Medical Representative, take a look and apply.', ['Hiring', 'MedicalRepresentative'], ['u1', 'u5', 'u11'], [cm('cm3', 'u11', 'Shared with my network.', 1)], { type: 'job', jobId: 'j1', topic: 'Hiring drive' }),
      P('p3', 'r4', 1, 'Sanjivani Labs has begun groundwork for a new oral solid dosage facility in Ahmedabad (demo announcement). The site is planned with modern containment and digital batch record capabilities.', ['Manufacturing', 'GMP', 'NewFacility'], ['u7', 'u4', 'u9'], [cm('cm4', 'u7', 'Exciting times for the Gujarat cluster!', 1)], { topic: 'Company update', imageSeed: 'facility' }),
      P('p4', 'u5', 2, '5 habits that helped me move from Medical Representative to Area Sales Manager in six years:\n1. Own your territory data\n2. Prepare every doctor call\n3. Coach juniors early\n4. Ask for stretch targets\n5. Keep learning the science', ['SalesCareers', 'Pharma'], ['u1', 'u11', 'u12', 'u6', 'u2'], [cm('cm5', 'u1', 'Very useful, especially point 3. Thank you!', 2), cm('cm6', 'u12', 'Agree on learning the science.', 2)], { topic: 'Career advice' }),
      P('p5', 'u9', 2, 'Our paper on amorphous solid dispersions for poorly soluble APIs is now published in a peer-reviewed journal (demo post). Key finding: polymer selection mattered more than drug load in our stability study.', ['Formulation', 'Research'], ['u2', 'u4', 'u10'], [], { topic: 'Research', imageSeed: 'research' }),
      P('p6', 'u10', 3, 'Back from the Indian Pharmacovigilance & Medical Affairs Summit (demo event). Three takeaways: better real-world evidence collaboration, scientific exchange beyond promotion, and training the next generation of MSLs.', ['MedicalAffairs', 'Conference'], ['u2', 'u3', 'u8'], [cm('cm7', 'u3', 'Thanks for the summary.', 3)], { topic: 'Conference update', imageSeed: 'summit' }),
      P('p7', 'u6', 3, 'Tip for new PV associates: write narratives as if a medical reviewer will read them first. Chronology, causality, outcome. Always.', ['Pharmacovigilance', 'Tips'], ['u8', 'u3'], [], {}),
      P('p8', 'r3', 4, 'Novacare Healthcare is hiring a Regional Sales Manager for the Western region. Looking for leaders with a strong record of coaching field teams.', ['Hiring', 'SalesLeadership'], ['u5', 'u12'], [], { type: 'job', jobId: 'j10', topic: 'Hiring drive' }),
      P('p9', 'u8', 4, 'Completed five years as a clinical pharmacist. This year I led an antimicrobial stewardship audit that improved documentation of indication and duration across three wards. Grateful to my team.', ['HospitalPharmacy', 'Stewardship'], ['u3', 'u6', 'u10', 'u1'], [cm('cm8', 'u6', 'Congratulations Neha!', 4)], { topic: 'Achievement' }),
      P('p10', 'u7', 5, 'Reduced changeover time on our tablet line by 18% using SMED and operator-led checklists. Small steps, steady results.', ['LeanManufacturing', 'Production'], ['u4', 'u9'], [], { topic: 'Shop floor' }),
      P('p11', 'u4', 6, 'Audit-ready is a daily habit, not a pre-audit sprint. Keep documentation contemporaneous and your team confident.', ['QualityAssurance', 'GMP'], ['u7', 'u9', 'u2'], [], {}),
      P('p12', 'u3', 6, 'Worth a read for CRAs: decentralised trial elements and what they mean for monitoring skills.', ['ClinicalResearch'], ['u6'], [], { type: 'news', newsId: 'n2' }),
      P('p13', 'r2', 7, 'Veridian Lifesciences is looking for a Clinical Research Associate in Hyderabad. ICH-GCP training and EDC exposure preferred.', ['Hiring', 'ClinicalResearch'], ['u3', 'u6'], [], { type: 'job', jobId: 'j7', topic: 'Hiring drive' }),
      P('p14', 'u12', 8, 'Brand teams: spend more time in the field. The best positioning insights I have ever had came from sitting with chemists for a day.', ['ProductManagement'], ['u5', 'u1'], [cm('cm9', 'u5', 'Absolutely.', 8)], {})
    ];

    /* ---- connections, messages, notifications ---- */
    const Cn = (id, a, b, st, d) => ({ id, requesterId: a, recipientId: b, status: st, createdAt: ago(d) });
    s.connections = [Cn('cn1', 'u1', 'u2', 'accepted', 40), Cn('cn2', 'u1', 'u5', 'accepted', 30), Cn('cn3', 'u3', 'u1', 'pending', 1), Cn('cn4', 'u6', 'u1', 'pending', 2), Cn('cn5', 'u1', 'u10', 'pending', 3), Cn('cn6', 'u2', 'u10', 'accepted', 20), Cn('cn7', 'u4', 'u9', 'accepted', 25), Cn('cn8', 'u5', 'u12', 'accepted', 15)];
    const cid = (a, b) => ['conv', a, b].sort().join('_');
    const M = (id, a, b, text, d, read = true) => ({ id, conversationId: cid(a, b), senderId: a, recipientId: b, content: text, createdAt: ago(d.d || d, d.h || 0), read });
    s.messages = [
      M('m1', 'r1', 'u1', 'Hi Mohit, thanks for applying to the Medical Representative – Oncology role. We would like to schedule a quick call.', 5), M('m2', 'u1', 'r1', 'Thank you Priya! I am available this week after 4 PM.', 5), M('m3', 'r1', 'u1', 'Great. We have scheduled an interview for you – please check your applications page.', { d: 0, h: 5 }, false),
      M('m4', 'u2', 'u1', 'Hey Mohit, are you attending the Mumbai pharma meetup next week?', 2), M('m5', 'u1', 'u2', 'Planning to – will confirm tomorrow.', 2),
      M('m6', 'r1', 'u2', 'Hi Sneha, we have your application for Regulatory Affairs Specialist under review.', 6)
    ];
    const Nf = (id, userId, type, title, message, link, d, read = false) => ({ id, userId, type, title, message, link, relatedEntityId: '', read, createdAt: ago(d.d || d, d.h || 0) });
    s.notifications = [
      Nf('nt1', 'u1', 'connection', 'New connection request', 'Dr. Imran Sheikh wants to connect with you.', '/app/network', { d: 0, h: 2 }), Nf('nt2', 'u1', 'interview', 'Interview scheduled', 'Medicura Pharma scheduled an interview for Medical Representative – Oncology.', '/app/applications/a1', { d: 0, h: 5 }), Nf('nt3', 'u1', 'message', 'New message from Priya Nair', 'Great. We have scheduled an interview for you…', '/app/messages?c=' + cid('r1', 'u1'), { d: 0, h: 5 }), Nf('nt4', 'u1', 'status', 'Application update', 'Your application at Novacare Healthcare is now Under Review.', '/app/applications/a14', 1, true),
      Nf('nt5', 'r1', 'application', 'New applicant', 'Mohit Bhati applied for Medical Representative – Oncology.', '/employer/applicants/a1', 6, true), Nf('nt6', 'r1', 'job', 'Job submitted', 'Area Sales Manager – Cardiology is pending admin approval.', '/employer/jobs', 1),
      Nf('nt7', 'a1', 'campaign', 'Campaign approved', 'Clinical Research Certification Webinar Series is now Active.', '/advertiser/campaigns/k1', 10, true), Nf('nt8', 'a1', 'campaign', 'Campaign pending approval', 'Pharmacovigilance Career Webinar is waiting for review.', '/advertiser/campaigns/k4', 1),
      Nf('nt9', 'adm1', 'job', 'Jobs awaiting approval', '3 jobs are pending moderation.', '/admin/jobs', 1), Nf('nt10', 'adm1', 'moderation', 'New content report', 'A post was reported for unverified claims.', '/admin/moderation', 2), Nf('nt11', 'adm1', 'verification', 'Employer verification pending', 'CureWell Pharmaceuticals and BioNova Labs await review.', '/admin/companies', 3)
    ];

    /* ---- campaigns ---- */
    const K = (id, adv, name, objective, type, placement, aud, budget, spend, status, sd, ed, imp, clk, conv, cr, extra = {}) => ({ id, advertiserId: adv, name, objective, type, placement, audience: aud, budget, spend, status, startDate: ahead(-sd), endDate: ahead(ed), metrics: { impressions: imp, clicks: clk, conversions: conv }, creative: { headline: cr[0], description: cr[1], cta: cr[2], destination: cr[3], imageSeed: cr[4], brand: s.users.find(u => u.id === adv).brand }, createdAt: ago(sd + 3), rejectionReason: '', ...extra });
    s.campaigns = [
      K('k1', 'a1', 'Clinical Research Certification Webinar Series', 'Registrations', 'Webinar', ['Feed', 'Sidebar', 'Webinar'], { location: 'Pan-India', category: 'Clinical Research' }, 50000, 18420, 'Active', 12, 18, 52600, 1380, 214, ['Free webinar: Getting started in clinical research', 'A demo 4-part webinar series for aspiring CRAs. Dates and curriculum are illustrative.', 'Register now', 'https://example.com/praxis/clinical-research', 'webinar']),
      K('k2', 'a1', 'Pharmacovigilance Foundation Course', 'Enrolments', 'Course', ['Feed', 'Course', 'Search'], { location: 'Pan-India', category: 'Pharmacovigilance' }, 40000, 9100, 'Active', 6, 24, 24800, 610, 58, ['Pharmacovigilance foundation course', 'Demo course listing covering case processing and MedDRA basics. Fees and certification shown here are illustrative.', 'View course', 'https://example.com/praxis/pv-course', 'pvcourse']),
      K('k3', 'a1', 'Regulatory Writing Bootcamp (Draft)', 'Awareness', 'Course', ['Newsletter'], { location: 'Mumbai', category: 'Regulatory Affairs' }, 20000, 0, 'Draft', 0, 30, 0, 0, 0, ['Regulatory writing bootcamp', 'Draft creative for a demo bootcamp.', 'Learn more', 'https://example.com/praxis/reg-writing', 'regwriting']),
      K('k4', 'a1', 'Pharmacovigilance Career Webinar', 'Registrations', 'Webinar', ['Feed', 'Webinar'], { location: 'Pan-India', category: 'Pharmacovigilance' }, 25000, 0, 'Pending Approval', -2, 20, 0, 0, 0, ['Build a career in drug safety', 'A demo webinar on entry paths into pharmacovigilance.', 'Save my seat', 'https://example.com/praxis/pv-career', 'pvcareer']),
      K('k5', 'a1', 'Medical Writing Masterclass', 'Enrolments', 'Course', ['Feed'], { location: 'Pan-India', category: 'Medical Affairs' }, 30000, 11200, 'Paused', 20, 10, 31400, 700, 41, ['Medical writing masterclass', 'Demo masterclass for aspiring medical writers.', 'Know more', 'https://example.com/praxis/medical-writing', 'medwriting']),
      K('k6', 'a1', 'Quality Auditor Training (Completed)', 'Enrolments', 'Course', ['Feed', 'Sidebar'], { location: 'Pan-India', category: 'Quality Assurance' }, 20000, 20000, 'Completed', 60, -20, 61000, 1500, 120, ['GMP auditor training', 'Demo course campaign that has ended.', 'View details', 'https://example.com/praxis/auditor', 'auditor']),
      K('k7', 'a1', 'Pharma Interview Prep Pack', 'Leads', 'Course', ['Sidebar'], { location: 'Pan-India', category: 'Medical Representative' }, 10000, 0, 'Rejected', 8, 30, 0, 0, 0, ['Ace your pharma interview', 'Guaranteed placement in 30 days!', 'Buy now', 'https://example.com/praxis/interview-prep', 'prep'], { rejectionReason: 'Placement guarantees are not allowed in ad copy. Please revise the claim.' }),
      K('k8', 'a2', 'LabEdge HPLC Systems – Spring Offer', 'Leads', 'Product', ['Sidebar', 'Feed'], { location: 'Gujarat, Maharashtra', category: 'Quality Control' }, 60000, 22300, 'Active', 14, 16, 44200, 920, 77, ['Upgrade your QC lab with modern HPLC', 'Demo product promotion from a laboratory instruments supplier. Specifications and pricing are illustrative.', 'Request a quote', 'https://example.com/labedge/hplc', 'hplc']),
      K('k9', 'a3', 'Oncology Sales Division – Hiring Drive', 'Applications', 'Hiring', ['Feed', 'Jobs'], { location: 'Mumbai, Pune', category: 'Medical Representative' }, 80000, 31500, 'Active', 10, 20, 73800, 2100, 330, ['Join our oncology sales division', 'Medicura Pharma is expanding its oncology field team (demo campaign). Explore open roles for medical representatives.', 'See open roles', '#/jobs/j1', 'oncohire'], { jobId: 'j1' }),
      K('k10', 'a4', 'CarePlus Clinic Management Software', 'Leads', 'Product', ['Feed', 'Newsletter'], { location: 'Pan-India', category: 'Hospital Pharmacy' }, 35000, 0, 'Pending Approval', -3, 25, 0, 0, 0, ['Simplify pharmacy inventory in your hospital', 'Demo healthtech promotion for hospital pharmacy teams.', 'Book a demo', 'https://example.com/careplus', 'careplus']),
      K('k11', 'a3', 'Featured Employer – Medicura Pharma', 'Awareness', 'Brand', ['Companies', 'Search'], { location: 'Pan-India', category: 'Pharmaceutical Sales' }, 30000, 8400, 'Active', 9, 21, 19800, 410, 36, ['Medicura Pharma – careers in oncology and cardiology', 'Featured employer card (demo).', 'View company', '#/companies/c1', 'medicura'], { companyId: 'c1' }),
      K('k12', 'a2', 'Lab Equipment Newsletter Sponsor', 'Awareness', 'Newsletter', ['Newsletter'], { location: 'Pan-India', category: 'Quality Control' }, 15000, 3200, 'Active', 5, 25, 9200, 210, 18, ['LabEdge monthly lab-tech newsletter', 'Sponsored newsletter promotion (demo): instrument tips, validation checklists and maintenance guides.', 'Subscribe', 'https://example.com/labedge/newsletter', 'labnews'])
    ];

    /* ---- plans, subscriptions, invoices ---- */
    s.plans = [
      { id: 'free', name: 'Free', price: 0, tagline: 'Try PharmaLinkIn hiring', limits: { jobs: 1, featured: 0, resumes: 5, duration: 15, campaigns: 'Not included' }, features: ['1 active job', 'Basic company page', '5 candidate contact unlocks / month'] },
      { id: 'growth', name: 'Growth', price: 4999, tagline: 'For growing HR teams', limits: { jobs: 10, featured: 2, resumes: 50, duration: 30, campaigns: 'Basic add-on available' }, features: ['10 active jobs', '2 featured jobs', '50 contact unlocks / month', 'Applicant tracking'] },
      { id: 'professional', name: 'Professional', price: 14999, tagline: 'For high-volume hiring', limits: { jobs: 50, featured: 10, resumes: 300, duration: 45, campaigns: 'Up to 3 active campaigns' }, features: ['50 active jobs', '10 featured jobs', '300 contact unlocks / month', 'Sponsored campaigns', 'Priority moderation'] },
      { id: 'enterprise', name: 'Enterprise', price: null, tagline: 'Custom for large employers', limits: { jobs: 999, featured: 50, resumes: 9999, duration: 60, campaigns: 'Dedicated campaign manager' }, features: ['Unlimited jobs', '50 featured jobs', 'Unlimited contact unlocks', 'Dedicated account manager', 'Custom integrations'] }
    ];
    const sub = (id, userId, planId, status, ren, usage) => ({ id, userId, planId, status, renewalDate: ahead(ren), usage });
    s.subscriptions = [sub('s1', 'r1', 'growth', 'Active', 22, { resumes: 18 }), sub('s2', 'r2', 'professional', 'Active', 40, { resumes: 96 }), sub('s3', 'r3', 'growth', 'Active', 9, { resumes: 31 }), sub('s4', 'r4', 'free', 'Active', 0, { resumes: 2 }), sub('s5', 'r7', 'growth', 'Expired', -5, { resumes: 50 }), sub('s6', 'r10', 'professional', 'Active', 28, { resumes: 140 })];
    s.invoices = [
      { id: 'inv1', userId: 'r1', planId: 'growth', amount: 4999, status: 'Paid', createdAt: ago(38) }, { id: 'inv2', userId: 'r1', planId: 'growth', amount: 4999, status: 'Paid', createdAt: ago(8) },
      { id: 'inv3', userId: 'r2', planId: 'professional', amount: 14999, status: 'Paid', createdAt: ago(20) }, { id: 'inv4', userId: 'r3', planId: 'growth', amount: 4999, status: 'Paid', createdAt: ago(21) },
      { id: 'inv5', userId: 'r7', planId: 'growth', amount: 4999, status: 'Failed', createdAt: ago(5) }, { id: 'inv6', userId: 'r10', planId: 'professional', amount: 14999, status: 'Pending', createdAt: ago(2) }];

    /* ---- reports, audit ---- */
    const Rp = (id, by, tt, tid, reason, st, d) => ({ id, reporterId: by, targetType: tt, targetId: tid, reason, status: st, createdAt: ago(d), history: [] });
    s.reports = [Rp('rp1', 'u4', 'post', 'p10', 'Unverified claim', 'Open', 1), Rp('rp2', 'u8', 'job', 'j28', 'Company details look inconsistent', 'Open', 2), Rp('rp3', 'u3', 'user', 'r5', 'Suspicious recruiter behaviour', 'Open', 2), Rp('rp4', 'u2', 'comment', 'p4:cm6', 'Spam', 'Open', 3), Rp('rp5', 'u7', 'ad', 'k9', 'Misleading hiring claim', 'Open', 4), Rp('rp6', 'u5', 'post', 'p7', 'Off-topic', 'Dismissed', 20)];
    const L = (id, action, tt, tid, d) => ({ id, adminId: 'adm1', action, targetType: tt, targetId: tid, createdAt: ago(d) });
    s.auditLogs = [L('al1', 'Approved employer verification', 'company', 'c2', 250), L('al2', 'Approved campaign', 'campaign', 'k1', 12), L('al3', 'Approved job', 'job', 'j7', 2), L('al4', 'Suspended user', 'user', 'u14', 30), L('al5', 'Dismissed report', 'report', 'rp6', 20), L('al6', 'Approved campaign', 'campaign', 'k9', 10)];

    /* ---- per-user state ---- */
    s.savedJobs = { u1: ['j7', 'j9'] }; s.savedPosts = { u1: ['p4'] }; s.newsBookmarks = { u1: ['n1'] };
    s.alerts = { u1: [{ id: 'al1', keyword: 'Medical Representative', location: 'Mumbai', category: 'Medical Representative', experience: '1-3', enabled: true }] };
    s.follows = { u1: { users: ['u2', 'r1'], companies: ['c1', 'c4'] } };
    s.hiddenAds = {}; s.savedCandidates = { r1: ['u2', 'u10'] }; s.unlocked = { r1: [] };
    s.signedUp = {};
    s.users.forEach(x => { if (x.id === 'u1') Object.assign(x.profile, demoProfile(x.profile)); });
    return s;
  }
  PL.seed = seed;

  /* ---- store ---- */
  PL.store = {
    s: null,
    load() {
      let data = null;
      try { const raw = localStorage.getItem(KEY); if (raw) { data = JSON.parse(raw); if (!data || data.version !== VERSION || !Array.isArray(data.users) || !Array.isArray(data.jobs)) data = null; } } catch (e) { data = null; }
      this.s = data || seed(); this.s.users.forEach(x => { if (x.id === 'u1' && x.name === 'Aarav Mehta') { x.name = 'Mohit Bhati'; Object.assign(x.profile, demoProfile(x.profile)); } });
      this.save();
      return this.s;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) { console.warn('LocalStorage unavailable', e); } },
    reset() { try { localStorage.removeItem(KEY); sessionStorage.removeItem('pl_session'); localStorage.removeItem('pl_session'); } catch (e) { } this.s = seed(); this.save(); },
    id(prefix) { const s = this.s; s.counters[prefix] = (s.counters[prefix] || 100) + 1; return prefix + s.counters[prefix]; }
  };
  PL.db = () => PL.store.s;
  PL.convId = (a, b) => ['conv', a, b].sort().join('_');

  /* ---- queries ---- */
  const db = () => PL.store.s;
  PL.q = {
    user: id => db().users.find(u => u.id === id),
    company: id => db().companies.find(c => c.id === id),
    job: id => db().jobs.find(j => j.id === id),
    app: id => db().applications.find(a => a.id === id),
    post: id => db().posts.find(p => p.id === id),
    news: id => db().news.find(n => n.id === id),
    campaign: id => db().campaigns.find(c => c.id === id),
    plan: id => db().plans.find(p => p.id === id),
    sub: uid => db().subscriptions.find(x => x.userId === uid),
    publicJobs: () => db().jobs.filter(j => j.status === 'Published'),
    companyOf: u => (u && u.companyId ? db().companies.find(c => c.id === u.companyId) : null),
    verified: c => !!c && c.verification === 'Verified',
    myJobs: uid => { const u = PL.q.user(uid); return db().jobs.filter(j => u && j.companyId === u.companyId); },
    myApps: uid => { const ids = PL.q.myJobs(uid).map(j => j.id); return db().applications.filter(a => ids.includes(a.jobId)); },
    appsOf: uid => db().applications.filter(a => a.candidateId === uid),
    appFor: (uid, jobId) => db().applications.find(a => a.candidateId === uid && a.jobId === jobId && a.status !== 'Withdrawn'),
    saved: uid => db().savedJobs[uid] || [],
    isSaved: (uid, jid) => (db().savedJobs[uid] || []).includes(jid),
    follows: uid => (db().follows[uid] = db().follows[uid] || { users: [], companies: [] }),
    conn(a, b) { return db().connections.find(c => (c.requesterId === a && c.recipientId === b) || (c.requesterId === b && c.recipientId === a)); },
    connStatus(me, other) { const c = PL.q.conn(me, other); if (!c) return 'none'; if (c.status === 'accepted') return 'connected'; return c.requesterId === me ? 'sent' : 'received'; },
    unreadNotifs: uid => db().notifications.filter(n => n.userId === uid && !n.read).length,
    unreadMsgs: uid => db().messages.filter(m => m.recipientId === uid && !m.read).length,
    usage(uid) { const u = PL.q.user(uid), sub = PL.q.sub(uid), plan = PL.q.plan(sub ? sub.planId : 'free'); const jobs = PL.q.myJobs(uid).filter(j => ['Published', 'Pending Approval', 'Paused'].includes(j.status)); return { plan, sub, jobs: jobs.length, featured: jobs.filter(j => j.featured).length, resumes: sub ? sub.usage.resumes : 0 }; },
    completion(u) {
      const p = u.profile || {}; const checks = [['Headline', !!p.headline, 10], ['About summary', (p.about || '').length > 30, 10], ['Location', !!u.location, 5], ['Education', (p.education || []).length > 0, 15], ['Work experience', (p.experience || []).length > 0, 15], ['At least 3 skills', (p.skills || []).length >= 3, 10], ['Certifications', (p.certifications || []).length > 0, 10], ['Languages', (p.languages || []).length > 0, 5], ['Resume uploaded', !!p.resume, 15], ['Career preferences', !!(p.preferences && p.preferences.roles && p.preferences.roles.length), 5]];
      const pct = checks.reduce((a, c) => a + (c[1] ? c[2] : 0), 0); return { pct, missing: checks.filter(c => !c[1]).map(c => c[0]) };
    }
  };
  PL.notify = (userId, type, title, message, link) => { db().notifications.unshift({ id: PL.store.id('nt'), userId, type, title, message, link: link || '', relatedEntityId: '', read: false, createdAt: new Date().toISOString() }); };
  PL.audit = (action, targetType, targetId) => { const a = PL.auth && PL.auth.user(); db().auditLogs.unshift({ id: PL.store.id('al'), adminId: a ? a.id : 'adm1', action, targetType, targetId, createdAt: new Date().toISOString() }); };
})();
