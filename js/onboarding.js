/* Onboarding (phase 1): candidate + employer journeys, landing page */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s);
  const me = () => PL.auth.user();
  const prof = u => (u.profile = u.profile || {});
  const list = v => String(v || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  const LAB = { c: ['Account', 'Verify', 'Details', 'Education', 'Experience', 'Resume', 'Finish'], e: ['Account', 'Verify', 'Company', 'Hiring'] };
  // form fieldset index -> highlighted label / "Step n of N"
  const MAP = { c: { idx: [2, 3, 4, 5, 5, 5, 5], no: [3, 4, 5, 6, 7, 7, 7] }, e: { idx: [2, 3], no: [3, 4] } };
  const ROLES = ['Medical Representative', 'Area Sales Manager', 'Product Manager', 'Medical Affairs', 'Regulatory Affairs', 'Quality Assurance', 'Quality Control', 'Clinical Research Associate', 'Pharmacovigilance', 'Production / Manufacturing', 'R&D / Formulation', 'Student / Fresher', 'Other'];
  const POPULAR = ['Drug Development', 'Pharmacovigilance', 'Clinical Research', 'Regulatory Affairs', 'GMP', 'Quality Assurance', 'Medical Writing', 'Pharma Sales'];
  const TABS = [['skills', 'Skills', 'Your Skills', 'Type and add your skills'], ['interests', 'Interests', 'Career Interests', 'Add a role or professional interest'], ['awards', 'Awards', 'Awards & Achievements', 'Add an award or achievement'], ['certs', 'Certifications', 'Certifications', 'Add a certification'], ['langs', 'Languages', 'Languages', 'Add a language you speak'], ['projects', 'Projects', 'Projects', 'Add a project']];
  const TEMPLATES = ['Modern', 'Professional', 'Creative', 'Classic'];
  const TONES = [['Professional', 'file'], ['Modern', 'zap'], ['Concise', 'list']];

  PL.onb = {
    shell(cur, inner, _nav, kind = 'c', wide) {
      if (kind === 'c' && cur < 2) {
        const S = ['Register', 'Create Resume', 'Finish'], si = S.map((l, i) => `<li class="${i ? '' : 'cur'}"><span class="dot"></span><span class="lbl">${l}</span></li>`).join('');
        return `<div class="onb2" data-kind="${kind}"><div class="onb2-card"><div class="onb2-top"><span class="onb2-step">Step 1 of 3</span></div><ol class="onb2-steps" aria-label="Progress">${si}</ol><div class="onb2-body">${inner}</div></div></div>`;
      }
      const L = LAB[kind], all = cur >= L.length, no = all ? L.length : cur + 1;
      const items = L.map((l, i) => `<li class="${all || i < cur ? 'done' : i === cur ? 'cur' : ''}"><span class="dot">${all || i < cur ? '✓' : ''}</span><span class="lbl">${l}</span></li>`).join('');
      return `<div class="onb2" data-kind="${kind}"><div class="onb2-card ${wide ? 'wide' : ''}"><div class="onb2-top"><span class="onb2-step">${all ? 'All done' : `Step ${no} of ${L.length}`}</span></div><ol class="onb2-steps" aria-label="Progress">${items}</ol><div class="onb2-body">${inner}</div></div></div>`;
    },
    set(root, i) {
      if (!root) return;
      const editForm = root.querySelector('form[data-edit-section]');
      if (editForm) { const edit = editForm.dataset.editSection; root.querySelector('.onb2-step').textContent = `Edit ${edit === 'education' ? 'Education' : edit === 'skills' ? 'Skills' : edit === 'certifications' ? 'Certifications' : edit === 'languages' ? 'Languages' : 'Interests'}`; return; }
      const kind = root.dataset.kind || 'c', m = MAP[kind], cur = m.idx[i];
      root.querySelectorAll('.onb2-steps li').forEach((li, k) => { li.className = k < cur ? 'done' : k === cur ? 'cur' : ''; li.querySelector('.dot').textContent = k < cur ? '✓' : ''; });
      root.querySelector('.onb2-step').textContent = `Step ${m.no[i]} of ${LAB[kind].length}`;
    }
  };
  const head = (t, d) => `<div class="onb-head"><h2>${t}</h2><p class="muted">${d}</p></div>`;
  const note = t => `<div class="onb-note full">${I('zap', 15)} ${t}</div>`;

  /* ---------- repeatable cards (education / experience) ---------- */
  const years = (ahead = 6) => { const y = new Date().getFullYear(), o = []; for (let k = y + ahead; k >= 1980; k--) o.push(k); return o; };
  const yearSel = (k, v) => `<select data-k="${k}"><option value="">Year</option>${years().map(y => `<option ${String(v) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select>`;
  const EQ = [{ k: '10th', t: 'High School (10th)', req: true, board: true }, { k: '12th', t: 'Intermediate (12th)', req: true, board: true, stream: true }, { k: 'Graduation', t: 'Graduation', req: true, deg: true }, { k: 'Post Graduation', t: 'Post Graduation', req: false, deg: true }, { k: 'Diploma / Certification', t: 'Diploma / Certification Course', req: false, deg: true }];
  const BOARDS = ['CBSE', 'ICSE / ISC', 'State Board', 'IB', 'NIOS', 'Other'], STREAMS = ['Science (PCB)', 'Science (PCM)', 'Commerce', 'Arts', 'Other'];
  const EDUCATION_ORDER = ['10th', '12th', 'Graduation', 'Post Graduation'];
  const eligibleEducation = education => {
    const current = education.find(item => item.current), currentIndex = current ? EDUCATION_ORDER.indexOf(current.level) : -1;
    return currentIndex < 0 ? education : education.filter(item => item.level === 'Diploma / Certification' || EDUCATION_ORDER.indexOf(item.level) <= currentIndex);
  };
  const refreshEducationProgression = root => {
    const cards = [...root.querySelectorAll('.rcard[data-card="edu"]')];
    const current = cards.find(card => card.querySelector('[data-k="current"]').checked);
    const currentIndex = current ? EDUCATION_ORDER.indexOf(current.dataset.level) : -1;
    cards.forEach(card => {
      const levelIndex = EDUCATION_ORDER.indexOf(card.dataset.level), hidden = currentIndex >= 0 && levelIndex > currentIndex;
      card.hidden = hidden;
      card.querySelectorAll('[data-k]').forEach(field => {
        field.disabled = hidden || (field.dataset.k === 'to' && card.querySelector('[data-k="current"]').checked);
      });
    });
  };
  const star = r => r ? ' <em class="req">*</em>' : '';
  const eduCard = (q, e = {}) => `<div class="rcard" data-card="edu" data-level="${q.k}"><div class="rcard-head"><b>${q.t}${q.req ? '' : ' <span class="muted xs">(Optional)</span>'}</b></div>
    <label class="chk"><input type="checkbox" data-k="current" ${e.current ? 'checked' : ''}> Currently pursuing this education</label>
    ${q.deg ? `<label class="rc-f"><span>${q.k === 'Diploma / Certification' ? 'Course / Certification Name' : 'Degree / Diploma'}${star(q.k === 'Graduation')}</span><input data-k="degree" list="onb-quals" placeholder="${q.k === 'Graduation' ? 'e.g. B.Pharm, D.Pharm, B.Sc' : q.k === 'Diploma / Certification' ? 'e.g. Diploma in Clinical Research, PV Certification' : 'e.g. M.Pharm, MBA, M.Sc'}" value="${E(e.degree || '')}"></label>` : ''}
    ${q.board ? `<label class="rc-f"><span>Board <em class="req">*</em></span><input data-k="board" list="onb-boards" placeholder="Select or type board" value="${E(e.board || '')}"></label>` : ''}
    ${q.stream ? `<label class="rc-f"><span>Stream <span class="muted xs">(Optional)</span></span><input data-k="stream" list="onb-streams" placeholder="e.g. Science (PCB)" value="${E(e.stream || '')}"></label>` : ''}
    <label class="rc-f"><span>${q.deg ? 'Institute / University' : 'School Name'}${star(q.req)}</span><input data-k="institute" placeholder="${q.deg ? 'Enter institute or university name' : 'Enter school name'}" value="${E(e.institute || '')}"></label>
    <div class="rc-grid two"><label><span>Passing Year${star(q.req)}</span><select data-k="to" ${e.current ? 'disabled' : ''}><option value="">Year</option>${years(q.deg ? 6 : 0).map(y => `<option ${!e.current && String(e.year) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select></label><label><span>${q.deg ? 'CGPA / %' : 'Percentage / %'} <span class="muted xs">(Optional)</span></span><input data-k="grade" value="${E(e.grade || '')}" placeholder="e.g. 8.2 or 85%"></label></div></div>`;  const DIVS = ['Oncology', 'Cardiology', 'Diabetes', 'Generics', 'Branded Generics', 'Biologics', 'OTC / Consumer Health', 'API', 'Hospital', 'Institutional', 'Medical Devices', 'Clinical Research', 'Regulatory', 'Quality', 'Other'];
  const monthValue = (value, month) => /^\d{4}$/.test(String(value || '')) ? `${value}-${month}` : value || '';
  const expCard = (x = {}) => { const current = !!(x.current || x.to === 'Present'); return `<div class="rcard" data-card="exp"><div class="rcard-head"><b class="exp-title">${current ? 'Present Employer (Current)' : 'Previous Employer'}</b><label class="switch-row"><span class="xs muted">I currently work here</span><span class="switch"><input type="checkbox" data-k="current" ${current ? 'checked' : ''}><i></i></span></label><button type="button" class="icon-btn" data-action="onb-del" aria-label="Remove">${I('trash', 16)}</button></div>
    <label class="rc-f"><span>Company Name <em class="req">*</em></span><input data-k="company" value="${E(x.company || '')}"></label><label class="rc-f"><span>Job Title <em class="req">*</em></span><input data-k="title" value="${E(x.title || '')}"></label><label class="rc-f"><span>Division / Segment <em class="req">*</em></span>    <select data-k="division"><option value="">Select division / segment</option>${DIVS.concat(x.division && !DIVS.includes(x.division) ? [x.division] : []).map(d => `<option ${x.division === d ? 'selected' : ''}>${E(d)}</option>`).join('')}</select></label>
    <div class="rc-f"><span>CTC (Cost to Company) – per annum <em class="req">*</em></span><div class="phone-row ctc-row"><select data-k="ctcCur" aria-label="Currency">${['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'].map(c => `<option ${(x.ctcCur || 'INR') === c ? 'selected' : ''}>${c}</option>`).join('')}</select><input data-k="ctc" inputmode="decimal" placeholder="e.g. 850000" value="${E(x.ctc || '')}" aria-label="CTC amount"></div></div>
    <div class="rc-grid two"><label><span>Start Date <em class="req">*</em></span><input type="month" data-k="from" value="${E(monthValue(x.from, '01'))}"></label><label><span>End Date <em class="req">*</em></span><input type="${current ? 'text' : 'month'}" data-k="to" value="${current ? 'Present' : E(monthValue(x.to && x.to !== 'Present' ? x.to : '', '12'))}" ${current ? 'disabled' : ''}></label></div>
    <label class="rc-f"><span>Description (Optional)</span><textarea data-k="desc" rows="2" placeholder="Describe your role and key achievements…">${E(x.desc || '')}</textarea></label></div>`; };
  const MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const pastYears = () => { const y = new Date().getFullYear(), o = []; for (let k = y; k >= 1980; k--) o.push(k); return o; };
  const DATED = ['awards', 'certs'];
  const OPTS = { skills: POPULAR, interests: [...new Set(ROLES.concat(POPULAR))], awards: ['Employee of the Year', 'Best Performer', 'Top Sales Achiever', 'Star Performer'], certs: ['GCP Certification', 'GMP Certification', 'Pharmacovigilance Certification', 'Six Sigma'], langs: ['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Gujarati', 'Bengali'], projects: ['Clinical Trial Study', 'Formulation Development', 'Process Validation'] };
  const asEnt = v => typeof v === 'string' ? { name: v, month: '', year: '' } : { name: v.name, month: v.month || '', year: v.year || '' };
  const dateTxt = o => [o.month ? MONF[o.month - 1].slice(0, 3) : '', o.year].filter(Boolean).join(' ');
  const lab = v => { const o = asEnt(v), d = dateTxt(o); return o.name + (d ? ` (${d})` : ''); };
  const chip = v => { const o = asEnt(v); return `<span class="chip" data-v="${E(o.name)}" data-m="${E(o.month)}" data-y="${E(o.year)}">${E(lab(o))}<button type="button" data-action="tag-del" aria-label="Remove ${E(o.name)}">×</button></span>`; };
  const addLabel = (k, has) => k === 'edu' ? (has ? 'Add Another Education' : 'Add Education') : (has ? 'Add Another Experience' : 'Add Experience');

  /* ---------- candidate steps ---------- */
  function steps(u, dr) {
    const F = ui().field, p = Object.assign({}, prof(u));
    if (dr) { p.level = dr.level; p.dob = dr.dob; p.education = dr.edu; p.experience = dr.exp; p.skills = dr.skills; p.awards = dr.awards; p.certifications = dr.certs.map(c => asEnt(c)); p.languages = dr.langs; p.projects = dr.projects; p.preferences = Object.assign({}, p.preferences || {}, { roles: dr.interests || (p.preferences && p.preferences.roles) || [] }); u = Object.assign({}, u, { location: dr.location }); }
    const edu = (p.education || []).slice(), legacy = edu.filter(e => !e.level), slot = q => edu.find(e => e.level === q.k) || (q.k === 'Graduation' ? legacy[0] : q.k === 'Post Graduation' ? legacy[1] : null) || {}, exp = (p.experience || []).length ? p.experience : [{ current: true }];
    const tags = { skills: p.skills || [], interests: (p.preferences && p.preferences.roles) || [], awards: p.awards || [], certs: (p.certifications || []).map(c => ({ name: c.name, month: c.month, year: c.year })), langs: p.languages || [], projects: p.projects || [] };
    const panel = (t, i) => {
      const k = t[0], dated = DATED.includes(k);
      const sel = dated ? `<select data-tag-m="${k}" aria-label="Month"><option value="">Month</option>${MONF.map((m, j) => `<option value="${j + 1}">${m}</option>`).join('')}</select><select data-tag-y="${k}" aria-label="Year"><option value="">Year</option>${pastYears().map(y => `<option>${y}</option>`).join('')}</select>` : '';
      const opts = OPTS[k] ? `<div class="pop"><span class="xs muted">Suggestions:</span> ${OPTS[k].map(s => `<button type="button" class="chip pop-chip" data-action="tag-pop" data-k="${k}" data-v="${E(s)}">${E(s)}</button>`).join('')}</div>` : '';
      return `<div class="tpanel ${i < 1 ? 'on' : ''}" data-panel="${k}"><div class="tag-title">${t[2]}${k === 'skills' ? '' : ' <span class="muted xs">(Optional)</span>'}</div><div class="tag-add ${dated ? 'dated' : ''}"><input data-tag-input="${k}" placeholder="${t[3]}" aria-label="${t[3]}">${sel}<button type="button" class="btn btn-sm" data-action="tag-add" data-k="${k}">Add</button></div>${opts}<div class="tag-list" data-k="${k}">${tags[k].map(chip).join('')}</div></div>`;
    };
    const AI = 'We\u2019ll use your information to create a resume that highlights your strengths and gets you noticed.';
    return [
      { title: 'Details', html: [head('Tell us about yourself', 'Add a photo and a few details to personalize your profile.'),
        `<div class="photo-box full"><div class="photo-av" id="onb-photo">${ui().avatar(u, 84)}</div><b>Add your photo (Optional)</b><small class="muted">JPG or PNG. A clear photo helps recruiters recognize you.</small><div class="row" style="justify-content:center"><button type="button" class="btn btn-secondary btn-sm" data-action="onb-photo" data-cap="user">${I('image', 15)} Take a Photo</button><button type="button" class="btn btn-secondary btn-sm" data-action="onb-photo">${I('upload', 15)} Upload</button></div></div>`,
        `<div class="cover-onboarding full"><div class="cover-onboarding-preview ${p.coverImg ? 'has-image' : ''}" id="onb-cover">${p.coverImg ? `<img src="${p.coverImg}" alt="Profile banner preview">` : `<span>${I('image', 24)} Add a profile banner</span>`}</div><div><b>Profile banner (Optional)</b><small class="muted">Add a background image to your profile. You can change it later.</small><button type="button" class="btn btn-secondary btn-sm" data-action="onb-cover">${I('upload', 15)} ${p.coverImg ? 'Change banner' : 'Upload banner'}</button></div></div>`,
        `<div class="field full" data-field="level"><label>What's your current role? <span class="req">*</span></label><div class="tone-row lvl-row">${[['Fresher', 'user', 'Just starting out'], ['Experienced', 'briefcase', 'Already working']].map(x => `<label class="pill lvl"><input type="radio" name="level" value="${x[0]}" ${p.level === x[0] ? 'checked' : ''}><span>${I(x[1], 16)} <b>${x[0]}</b><small>${x[2]}</small></span></label>`).join('')}</div><small class="lvl-err" role="alert">Please select your current role &ndash; Fresher or Experienced.</small></div>`,
        F({ name: 'location', label: 'Current Location', required: true, full: true, value: u.location || '', placeholder: 'Enter your city' }),
        `<div class="field" data-field="dob"><label for="onb-dob">Date of Birth <span class="req">*</span></label><input type="date" id="onb-dob" name="dob" required max="${new Date().toISOString().slice(0, 10)}" min="1940-01-01" value="${E(p.dob || '')}"></div><div class="field" data-field="age"><label for="onb-age">Age (in years)</label><input id="onb-age" name="age" readonly tabindex="-1" placeholder="Auto-filled" value="${ageOf(p.dob)}"></div>`].join('') },
      { title: 'Education', html: [head('Add your education', 'Add the qualifications you have completed or are currently pursuing.'),
        `<datalist id="onb-quals">${PL.QUALS.map(q => `<option value="${E(q)}">`).join('')}</datalist>        <datalist id="onb-boards">${BOARDS.map(q => `<option value="${q}">`).join('')}</datalist><datalist id="onb-streams">${STREAMS.map(q => `<option value="${q}">`).join('')}</datalist><div class="full rlist edu-list" data-list="edu">${(() => { let seen = false; return EQ.map(q => { const e = slot(q); if (e.current) { if (seen) return eduCard(q, Object.assign({}, e, { current: false, year: '' })); seen = true; } return eduCard(q, e); }).join(''); })()}</div>`,
                note('Later academic levels stay hidden while you are pursuing an earlier level. Mark that level complete to add the next one. Diploma / Certification can be added at any stage. Only one qualification can be marked as currently pursuing.')].join('') },
              { title: 'Experience', html: [head('Add your experience', 'Share your work experience'),
        `<div class="full rlist" data-list="exp">${exp.map(expCard).join('')}</div><div class="full"><button type="button" class="btn btn-soft btn-block" data-action="onb-add" data-k="exp">${I('plus', 15)} <span>${addLabel('exp', true)}</span></button></div>`,
        ].join('') },
      { title: 'More about you', html: [head('Add more about you', 'Skills, awards, certifications, and more to help you stand out.'),
        `<div class="full"><div class="tabs2" role="tablist">${TABS.map((t, i) => `<button type="button" role="tab" class="${i ? '' : 'on'}" data-action="onb-tab" data-k="${t[0]}">${t[1]}</button>`).join('')}</div>${TABS.map(panel).join('')}</div>`,
        note('You can always update these later')].join('') },
      { title: 'AI resume', html: [`<div class="onb-head"><h2>Create your resume with AI <span class="ai-badge">AI Powered</span></h2><p class="muted">Let our AI write a professional resume for you in seconds.</p></div>`,
        `<div class="ai-box full">${I('zap', 18)}<span>${AI}</span></div>`,
        `<div class="full"><h4 class="sub-h">What should we focus on?</h4><div class="focus-grid">${[['edu', 'Education'], ['skills', 'Skills'], ['exp', 'Experience'], ['projects', 'Projects'], ['awards', 'Awards']].map(x => `<label class="check"><input type="checkbox" name="fx_${x[0]}" checked><span>${x[1]}</span></label>`).join('')}</div></div>`,
        `<div class="full"><h4 class="sub-h">Choose a tone</h4><div class="tone-row">${TONES.map((t, i) => `<label class="pill"><input type="radio" name="tone" value="${t[0]}" ${i ? '' : 'checked'}><span>${I(t[1], 14)} ${t[0]}</span></label>`).join('')}</div></div>`].join('') },
      { title: 'Template', html: [head('Choose a template', 'Select a style that fits your personality.'),
        `<div class="full"><div class="tpl2-grid" role="radiogroup" aria-label="Resume template">${TEMPLATES.map((t, i) => `<label class="tpl2"><input type="radio" name="template" value="${t}" ${i ? '' : 'checked'}><span class="tpl2-prev tp-${t.toLowerCase()}"><i></i><i></i><i></i><i></i><i></i></span><b>${t}</b></label>`).join('')}</div><button type="button" class="link-btn more-tpl" data-action="onb-more-tpl">More templates</button></div>`,
        `<div class="full inc-box"><b>Your resume will include</b><div class="inc-grid" id="onb-includes"></div></div>`].join('') },
      { title: 'Ready', html: [`<div class="onb-head row between nowrap"><div><h2 style="text-align:left">Your resume is ready!</h2><p class="muted" style="text-align:left">Preview and make any final changes.</p></div></div>`,
        `<div class="full" id="resume-preview"></div>`, `<p class="xs muted full" style="text-align:center">Looks good? You can customize it anytime.</p>`].join('') }
    ];
  }

  /* ---------- reading the form / building the resume ---------- */
  function readForm(f, preserveHiddenEducation = false) {
    const val = n => { const el = f.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; };
    const cards = k => [...f.querySelectorAll(`[data-card="${k}"]`)].map(c => { const o = { level: c.dataset.level }; c.querySelectorAll('[data-k]').forEach(el => { o[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value.trim(); }); return o; });
    const tag = k => [...f.querySelectorAll(`.tag-list[data-k="${k}"] [data-v]`)].map(e => DATED.includes(k) ? { name: e.dataset.v, month: e.dataset.m || '', year: e.dataset.y || '' } : e.dataset.v);
    const on = n => { const el = f.querySelector(`[name="fx_${n}"]`); return !el || el.checked; };
    const education = cards('edu').filter(e => e.degree || e.institute || e.board || e.stream || e.to || e.grade || e.current).map(e => ({ level: e.level, degree: e.level === '10th' ? 'High School (10th)' : e.level === '12th' ? 'Intermediate (12th)' + (e.stream ? ' (' + e.stream + ')' : '') : e.degree, board: e.board || '', stream: e.stream || '', institute: e.institute, year: e.current ? 'Present' : e.to, grade: e.grade, current: e.current }));
    const edu = preserveHiddenEducation ? education : eligibleEducation(education);
    const lv = f.querySelector('[name=level]:checked'), level = lv ? lv.value : '';
    const exp = level === 'Fresher' ? [] : cards('exp').filter(x => x.company || x.title).map(x => ({ title: x.title, company: x.company, division: x.division, ctcCur: x.ctcCur, ctc: x.ctc, from: x.from, to: x.current ? 'Present' : (x.to || 'Present'), desc: x.desc, current: x.current }));
    const t = f.querySelector('[name=tone]:checked'), tp = f.querySelector('[name=template]:checked');
    const role = (exp[0] && exp[0].title) || (level === 'Fresher' ? 'Fresher' : 'Pharma professional');
    return { level, role, location: val('location'), dob: val('dob'), edu, exp, skills: tag('skills'), interests: tag('interests'), awards: tag('awards'), certs: tag('certs'), langs: tag('langs'), projects: tag('projects'), inc: { edu: on('edu'), skills: on('skills'), exp: on('exp'), projects: on('projects'), awards: on('awards') }, tone: t ? t.value : 'Professional', template: tp ? tp.value : 'Modern' };
  }
  const ageOf = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if (!m) return ''; const n = new Date(); let a = n.getFullYear() - +m[1]; if (n.getMonth() + 1 < +m[2] || (n.getMonth() + 1 === +m[2] && n.getDate() < +m[3])) a--; return a >= 0 && a < 120 ? String(a) : ''; };
  document.addEventListener('input', e => { const t = e.target; if (t && t.name === 'dob') { const a = document.getElementById('onb-age'); if (a) a.value = ageOf(t.value); } });
  const monthYr = v => { if (!v || v === 'Present') return v || ''; const m = /^(\d{4})-(\d{2})$/.exec(v); return m ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1] + ' ' + m[1] : v; };
  function expYears(exp) {
    let months = 0; const now = new Date();
    exp.forEach(x => { const a = /^(\d{4})-(\d{2})/.exec(x.from || ''); if (!a) return; const b = /^(\d{4})-(\d{2})/.exec(x.to || ''), end = b ? new Date(+b[1], +b[2] - 1) : now; months += Math.max(0, (end.getFullYear() - +a[1]) * 12 + end.getMonth() - (+a[2] - 1)); });
    return Math.round(months / 12);
  }
  function aiSummary(d) {
    const y = expYears(d.exp), role = d.role || 'Pharma professional', sk = d.skills.slice(0, 4).join(', ');
    const yrs = y ? `${y}+ years of experience` : 'a strong foundation';
    if (d.tone === 'Concise') return `${role}. ${y ? y + '+ yrs' : 'Early-career'}${sk ? ' · ' + sk : ''}. Quality-focused and compliance-minded.`;
    if (d.tone === 'Modern') return `${role} who loves turning science into impact. Brings ${yrs}${sk ? ' and hands-on strength in ' + sk : ''}. Curious, collaborative and ready for the next challenge.`;
    return `Motivated ${role.toLowerCase()} with ${yrs} in the pharmaceutical industry.${sk ? ' Skilled in ' + sk + '.' : ''} Committed to accuracy, regulatory compliance and continuous learning.`;
  }
  function resumeHtml(d, u, tpl) {
    const sec = (t, b) => b ? `<h4>${t}</h4>${b}` : '', chips = a => `<div class="rchips">${a.map(s => `<span>${E(s)}</span>`).join('')}</div>`, inc = d.inc || {};
    const ex = inc.exp !== false && d.exp.length ? d.exp.map(x => `<div class="r-row"><div><b>${E(x.title || '')}</b>${x.company ? `<div class="muted">${E(x.company)}${x.division ? ' · ' + E(x.division) : ''}</div>` : ''}</div><span class="muted">${monthYr(x.from)}${x.from ? ' – ' : ''}${monthYr(x.to)}</span></div>${x.desc ? `<p class="r-desc">${E(x.desc)}</p>` : ''}`).join('') : '';
    const ed = inc.edu !== false && d.edu.length ? d.edu.map(x => `<div class="r-row"><div><b>${E(x.degree || '')}</b>${x.institute || x.board ? `<div class="muted">${E([x.institute, x.board].filter(Boolean).join(' · '))}</div>` : ''}${x.grade ? `<div class="muted">CGPA/Score: ${E(x.grade)}</div>` : ''}</div><span class="muted">${E(x.year || '')}</span></div>`).join('') : '';
    const contact = [u.phone && I('phone', 12) + ' ' + E(u.phone), u.email && I('mail', 12) + ' ' + E(u.email), d.location && I('pin', 12) + ' ' + E(d.location)].filter(Boolean).join('<span class="sep"></span>');
    return `<div class="resume resume2 rt-${E(String(tpl || 'Modern').toLowerCase())}"><div class="resume-head">${ui().avatar(u, 54)}<div><h3>${E(u.name)}</h3><div class="r-role">${E(d.role)}</div><div class="r-contact">${contact}</div></div></div>
      ${sec('Professional Summary', `<p>${E(d.summary || aiSummary(d))}</p>`)}${sec('Experience', ex)}${sec('Education', ed)}${inc.skills !== false && d.skills.length ? sec('Skills', chips(d.skills)) : ''}${inc.projects !== false && d.projects.length ? sec('Projects', `<p>${E(d.projects.join(' · '))}</p>`) : ''}${inc.awards !== false && d.awards.length ? sec('Awards', `<p>${E(d.awards.map(lab).join(' · '))}</p>`) : ''}${d.certs.length ? sec('Certifications', `<p>${E(d.certs.map(lab).join(' · '))}</p>`) : ''}${d.langs.length ? sec('Languages', `<p>${E(d.langs.join(' · '))}</p>`) : ''}</div>`;
  }
  PL.onb.resumeCard = u => { const p = (u.profile || {}); if (!(p.about || (p.education || []).length || (p.experience || []).length || (p.skills || []).length)) return ''; return '<div class="card pad-lg"><h3 style="margin-top:0">Your PharmaLinkIn resume <span class="badge b-teal">' + E(p.resumeTemplate || 'Modern') + '</span></h3>' + resumeHtml(profData(u, p), u, p.resumeTemplate) + DLROW + '</div>'; };
  const RHEAD = '<div class="rs-head"><b>Your resume</b></div>';
  const DLROW = '';
  const profData = (u, p) => ({ role: p.headline || '', location: u.location || '', summary: p.about, exp: (p.experience || []).map(x => ({ title: x.title, company: x.company, division: x.division, from: x.from, to: x.to, desc: x.desc })), edu: (p.education || []).map(x => ({ degree: x.degree, board: x.board, institute: x.institute, year: x.year, grade: x.grade })), skills: p.skills || [], awards: (p.awards || []).map(asEnt), certs: (p.certifications || []).map(c => ({ name: c.name, month: c.month, year: c.year })), langs: p.languages || [], projects: p.projects || [], inc: {} });

  function refreshIncludes(f) {
    const d = readForm(f), box = f.querySelector('#onb-includes'); if (!box) return;
    const items = [[d.inc.edu, 'Education'], [d.inc.exp && d.exp.length, 'Experience (if any)'], [d.inc.skills, 'Skills'], [d.inc.awards, 'Awards'], [d.inc.projects && d.projects.length, 'Projects'], [d.certs.length, 'Certifications']].filter(x => x[0]);
    box.innerHTML = items.map(x => `<span>${I('checkc', 15)} ${x[1]}</span>`).join('');
  }
  function renderPreview(f) {
    const u = me(), d = readForm(f); f._summary = f._summary && f._tone === d.tone ? f._summary : aiSummary(d); f._tone = d.tone; d.summary = f._summary;
    f.querySelector('#resume-preview').innerHTML = RHEAD + resumeHtml(d, u, d.template);
  }
  function onbStep(f, i) {
    const nx = f.querySelector('[type=submit]'), lab = { 4: 'Next: Choose Template', 5: 'Create My Resume' }[i]; if (lab && nx) nx.textContent = lab;
    if (i === 5) refreshIncludes(f); if (i === 6) renderPreview(f);
  }
  document.addEventListener('stepchange', e => {
    const f = e.target; if (!f.matches || !f.matches('form[data-form="onboarding"],form[data-form="emp-onboarding"]')) return;
    if (f.dataset.form === 'onboarding') {
      const lv = f.querySelector('[name=level]:checked');
      if (e.detail === 2 && lv && lv.value === 'Fresher') { const back = f._prev > 2; f._prev = undefined; ui().stepShow(f, back ? 1 : 3); return; }
      f._prev = e.detail;
    }
    PL.onb.set(f.closest('.onb2'), e.detail); if (f.dataset.form === 'onboarding') { onbStep(f, e.detail); const u = me(); if (u && !f.dataset.editSection) { prof(u).draft = Object.assign(readForm(f), { step: e.detail }); PL.store.save(); } }
  });

  /* ---------- interactions ---------- */
  const grab = (cap, cb, maxEdge = 256) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (cap) inp.setAttribute('capture', cap);
    inp.onchange = () => { const file = inp.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, maxEdge / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); let quality = .82, data = c.toDataURL('image/jpeg', quality); while (data.length > 350 * 1024 && quality > .5) { quality -= .08; data = c.toDataURL('image/jpeg', quality); } if (data.length > 350 * 1024) return ui().toast('Image is too large to store in this prototype. Choose a smaller image.', 'err'); cb(data); }; img.onerror = () => ui().toast('Could not read that image', 'err'); img.src = r.result; }; r.readAsDataURL(file); };
    inp.click();
  };
  PL.act('onb-photo', d => grab(d.cap, data => { const u = me(); u.photo = data; PL.store.save(); const box = document.getElementById('onb-photo'); if (box) box.innerHTML = ui().avatar(u, 84); ui().toast('Photo added'); }));
  PL.act('onb-cover', () => grab('', data => { const p = prof(me()); p.coverImg = data; PL.store.save(); const box = document.getElementById('onb-cover'); if (box) { box.classList.add('has-image'); box.innerHTML = `<img src="${data}" alt="Profile banner preview">`; } ui().toast('Profile banner added'); }, 1000));
  PL.act('onb-skip-photo', () => { const r = document.querySelector('[name=role]'); if (r) r.focus(); });
  PL.act('onb-skip-step', (d, el) => {
    const f = el.closest('form'), fs = [...f.querySelectorAll('.fstep')], cur = +f.dataset.cur || 0;
    f.querySelectorAll('.fstep.on .rcard').forEach(c => c.querySelectorAll('input:not([type=checkbox]),textarea,select').forEach(x => { if (!x.disabled) x.value = ''; }));
    ui().stepShow(f, Math.min(cur + 1, fs.length - 1)); window.scrollTo({ top: 0 });
  });
  PL.act('onb-more-tpl', () => ui().toast('More templates are coming soon', 'info'));
  // End must not be before start (education years, experience months)
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('form[data-form="onboarding"]'); if (!f) return;
    const fs = [...f.querySelectorAll('.fstep')], cur = +f.dataset.cur || 0, scope = cur === fs.length - 1 ? fs : [fs[cur]];
    f.querySelectorAll('.rc-bad').forEach(x => x.classList.remove('rc-bad'));
    const bad = (s, t, msg) => { e.preventDefault(); e.stopImmediatePropagation(); ui().stepShow(f, fs.indexOf(s)); t.classList.add('rc-bad'); t.focus(); ['input', 'change'].forEach(ev => t.addEventListener(ev, () => t.classList.remove('rc-bad'), { once: true })); ui().toast(msg, 'err'); };
    for (const s of scope) for (const c of s.querySelectorAll('.rcard[data-card="edu"]')) {
      if (c.hidden) continue;
      const g = k => c.querySelector(`[data-k="${k}"]`), v = k => ((g(k) || {}).value || '').trim(), lv = c.dataset.level, cur = g('current').checked;
      if (f.dataset.editSection === 'education' && !cur && !['degree', 'board', 'stream', 'institute', 'to', 'grade'].some(v)) continue;
      if (lv !== '10th' && lv !== '12th' && lv !== 'Graduation' && !cur && !['degree', 'institute', 'to', 'grade'].some(v)) continue;
      const miss = [g('degree') ? 'degree' : '', g('board') ? 'board' : '', 'institute', cur ? '' : 'to'].find(k => k && !v(k)), nm = { degree: lv === 'Diploma / Certification' ? 'course / certification name' : 'degree', board: 'board', institute: lv === '10th' || lv === '12th' ? 'school name' : 'institute / university', to: 'passing year' }, ttl = (EQ.find(q => q.k === lv) || {}).t || lv;
      if (miss) { bad(s, g(miss), `Please select/enter the ${nm[miss]} for ${ttl}`); return; }
    }
    if (f.dataset.editSection === 'education' && !readForm(f).edu.length) {
      const s = scope[0], field = s.querySelector('.rcard[data-card="edu"] [data-k="board"]');
      bad(s, field, 'Add at least one completed or currently pursuing qualification.'); return;
    }
    const lvl = f.querySelector('[name=level]:checked');
    for (const s of scope) { const lr = s.querySelector('[data-field="level"] .lvl-row'); if (lr && !lvl) { bad(s, lr, 'Please select whether you are a Fresher or Experienced'); return; } }
    const fresher = !!(lvl && lvl.value === 'Fresher');
    for (const s of fresher ? [] : scope) {
      const cs = [...s.querySelectorAll('.rcard[data-card="exp"]')];
      if (cs.length && lvl && lvl.value !== 'Fresher' && !cs.some(c => ['company', 'title'].some(k => ((c.querySelector(`[data-k="${k}"]`) || {}).value || '').trim()))) { bad(s, cs[0].querySelector('[data-k="company"]'), 'Please add your work experience'); return; }
    }
    for (const s of fresher ? [] : scope) for (const c of s.querySelectorAll('.rcard[data-card="exp"]')) {
      const g = k => c.querySelector(`[data-k="${k}"]`), v = k => ((g(k) || {}).value || '').trim();
      if (!['company', 'title', 'division', 'from', 'to', 'ctc', 'desc'].some(v)) continue;
      const miss = ['company', 'title', 'division', 'ctc', 'from', 'to'].find(k => g(k) && !g(k).disabled && !v(k));
      if (!miss) continue;
      bad(s, g(miss), 'Please fill in all experience fields (only the description is optional)'); return;
    }
    if (f.dataset.editSection === 'skills' && !readForm(f).skills.length) {
      const s = scope[0], input = s.querySelector('[data-tag-input="skills"]');
      bad(s, input, 'Add at least one professional skill before saving.'); return;
    }
    for (const s of scope) for (const c of s.querySelectorAll(fresher ? '.rcard[data-card="edu"]' : '.rcard')) {
      const a = c.querySelector('[data-k="from"]'), b = c.querySelector('[data-k="to"]'); if (!a || !b || b.disabled || !a.value || !b.value || !(c.dataset.card === 'edu' ? Number(b.value) < Number(a.value) : b.value < a.value)) continue;
      e.preventDefault(); e.stopImmediatePropagation(); ui().stepShow(f, fs.indexOf(s)); b.focus();
      ui().toast(c.dataset.card === 'edu' ? 'End year can\u2019t be before the start year' : 'End date can\u2019t be before the start date', 'err'); return;
    }
  }, true);
  PL.act('onb-edit-ai', () => { const f = document.querySelector('form[data-form="onboarding"]'), rs = [...f.querySelectorAll('[name=tone]')], k = rs.findIndex(r => r.checked), n = rs[(k + 1) % rs.length]; n.checked = true; renderPreview(f); ui().toast('Rewrote your summary in a ' + n.value + ' tone'); });
  /* Excel (CSV) export: every qualification gets its own columns so 10th / 12th / Graduation / Post Graduation can be managed independently */
  PL.onb.exportRows = users => {
    const H = ['Name', 'Email', 'Mobile', 'Date of Birth', 'Age', 'Location'], per = { '10th': ['Board', 'School', 'Passing Year', 'Percentage', 'Currently Pursuing'], '12th': ['Board', 'Stream', 'School', 'Passing Year', 'Percentage', 'Currently Pursuing'], Graduation: ['Degree', 'Institute', 'Passing Year', 'CGPA/Percentage', 'Currently Pursuing'], 'Post Graduation': ['Degree', 'Institute', 'Passing Year', 'CGPA/Percentage', 'Currently Pursuing'], 'Diploma / Certification': ['Course', 'Institute', 'Passing Year', 'Grade/Percentage', 'Currently Pursuing'] };
    EQ.forEach(q => per[q.k].forEach(c => H.push(q.t + ' - ' + c)));
    const rows = users.map(u => {
      const p = u.profile || {}, ed = p.education || [], r = [u.name, u.email, u.phone || '', p.dob || '', ageOf(p.dob), u.location || ''];
      EQ.forEach(q => { const e = ed.find(x => x.level === q.k) || {}, yr = e.current ? '' : (e.year || ''), cp = e.current ? 'Yes' : (e.level ? 'No' : '');
        r.push(...(q.k === '10th' ? [e.board, e.institute, yr, e.grade, cp] : q.k === '12th' ? [e.board, e.stream, e.institute, yr, e.grade, cp] : [e.degree, e.institute, yr, e.grade, cp]).map(x => x || '')); });
      return r;
    });
    return [H].concat(rows);
  };
  PL.act('onb-export', () => { const u = me(); ui().csv('my-profile-details.csv', PL.onb.exportRows([u])); });
  PL.act('admin-export-cand', () => ui().csv('candidates.csv', PL.onb.exportRows(PL.store.s.users.filter(u => u.role === 'candidate'))));  PL.act('onb-download', () => {
    const el = document.querySelector('.resume'); if (!el) return;
    const css = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => `<link rel="stylesheet" href="${l.href}">`).join(''), fr = document.createElement('iframe');
    const doc = `<!doctype html><html><head>${css}</head><body style="margin:0;padding:16px;background:#fff">${el.outerHTML}</body></html>`;
    const u = me(), p = prof(u);
    if (matchMedia('(pointer:coarse)').matches) {
      const w = window.open('', '_blank'); if (!w) { ui().toast('Allow pop-ups, then tap Download PDF again', 'err'); return; }
      p.resumeDownloads = (Number(p.resumeDownloads) || 0) + 1; PL.store.save();
      w.document.open(); w.document.write(doc); w.document.close();
      setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* user can use Share > Print */ } }, 700);
      ui().toast('In the print screen choose Save as PDF (on iPhone: Share \u203a Print \u203a pinch to zoom the preview)', 'info'); return;
    }
    p.resumeDownloads = (Number(p.resumeDownloads) || 0) + 1; PL.store.save();
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    fr.contentDocument.open(); fr.contentDocument.write(doc); fr.contentDocument.close();
    setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { ui().toast('Printing is not available here', 'err'); } setTimeout(() => fr.remove(), 2000); }, 500);
  });
  const refreshAdd = list => { const k = list.dataset.list, b = list.parentElement.querySelector(`[data-action="onb-add"][data-k="${k}"] span`); if (b) b.textContent = addLabel(k, !!list.children.length); };
  PL.act('onb-add', d => { const list = document.querySelector(`.rlist[data-list="${d.k}"]`); list.insertAdjacentHTML('beforeend', d.k === 'edu' ? eduCard() : expCard({ current: !list.children.length })); refreshAdd(list); const last = list.lastElementChild.querySelector('input'); if (last) last.focus(); });
  PL.act('onb-del', (d, el) => { const list = el.closest('.rlist'); el.closest('.rcard').remove(); refreshAdd(list); const f0 = list.firstElementChild; if (f0 && f0.dataset.card === 'exp') { const cb = f0.querySelector('[data-k="current"]'); f0.querySelector('.exp-title').textContent = cb.checked ? 'Present Employer (Current)' : 'Previous Employer'; } });
  document.addEventListener('input', e => { const t = e.target; if (t.matches && t.matches('[data-k="ctc"]')) t.value = t.value.replace(/[^\d.,]/g, ''); });
  PL.act('onb-tab', (d, el) => { const w = el.closest('.full'); w.querySelectorAll('.tabs2 button').forEach(b => b.classList.toggle('on', b === el)); w.querySelectorAll('.tpanel').forEach(p => p.classList.toggle('on', p.dataset.panel === d.k)); });
  const addTag = (k, v, m, y) => {
    v = String(v || '').trim(); if (!v) { ui().toast('Enter a value before adding it.', 'err'); return false; }
    if (v.length > 80) { ui().toast('Keep each item to 80 characters or fewer.', 'err'); return false; }
    const l = document.querySelector(`.tag-list[data-k="${k}"]`), dated = DATED.includes(k), ms = document.querySelector(`[data-tag-m="${k}"]`), ys = document.querySelector(`[data-tag-y="${k}"]`);
    m = dated && ms ? ms.value : ''; y = dated && ys ? ys.value : '';
    if (dated && (!m || !y)) { ui().toast('Choose a month and year.', 'err'); return false; }
    if ([...l.querySelectorAll('[data-v]')].some(c => c.dataset.v.toLowerCase() === v.toLowerCase() && (!dated || ((c.dataset.m || '') === m && (c.dataset.y || '') === y)))) { ui().toast('This item has already been added.', 'info'); return false; }
    l.insertAdjacentHTML('beforeend', chip(dated ? { name: v, month: m, year: y } : v));
    if (ms) ms.value = ''; if (ys) ys.value = '';
    return true;
  };
  PL.act('tag-add', d => { const inp = document.querySelector(`[data-tag-input="${d.k}"]`); if (addTag(d.k, inp.value)) inp.value = ''; inp.focus(); });
  PL.act('tag-pop', d => addTag(d.k, d.v));
  PL.act('tag-del', (d, el) => el.closest('.chip').remove());
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-tag-input]')) { e.preventDefault(); if (addTag(e.target.dataset.tagInput, e.target.value)) e.target.value = ''; } });
  /* autosave: keep everything typed so far, so re-login resumes exactly where the user left off */
  let draftTimer;
  const autosave = e => {
    const f = e.target.closest && e.target.closest('form[data-form="onboarding"]'); if (!f || f.dataset.editSection) return;
    clearTimeout(draftTimer); draftTimer = setTimeout(() => { const u = me(); if (u && f.isConnected) { prof(u).draft = Object.assign(readForm(f, true), { step: +f.dataset.cur || 0 }); PL.store.save(); } }, 250);
  };
  ['input', 'change', 'click'].forEach(ev => document.addEventListener(ev, e => { if (ev !== 'click' || (e.target.closest && e.target.closest('.tag-list,[data-action^="tag-"],[data-action="onb-del"],[data-action="onb-add"]'))) autosave(e); }));

  document.addEventListener('change', e => {
    const t = e.target; if (!t.matches || !t.matches('.rcard input[data-k="current"]')) return;
    const c = t.closest('.rcard'), end = c.querySelector('[data-k="to"]');
    if (c.dataset.card === 'edu' && t.checked) document.querySelectorAll('.rcard[data-card="edu"] input[data-k="current"]:checked').forEach(o => { if (o === t) return; o.checked = false; const oe = o.closest('.rcard').querySelector('[data-k="to"]'); if (oe) oe.disabled = false; });
    if (c.dataset.card === 'exp') c.querySelector('.exp-title').textContent = t.checked ? 'Present Employer (Current)' : 'Previous Employer';
    if (end) { end.disabled = t.checked; end.value = ''; end.type = t.checked ? 'text' : 'month'; if (t.checked) end.value = 'Present'; }
    if (c.dataset.card === 'edu') refreshEducationProgression(t.closest('form'));
  });

  /* ---------- candidate onboarding route ---------- */
  PL.router.add('/onboarding', ctx => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/onboarding'); return ''; }
    if (u.role !== 'candidate') return `<div class="auth-wrap"><div class="card auth-card">${ui().empty('user', 'Candidate onboarding only', 'This preview covers the candidate onboarding experience.', '<a class="btn" href="#/">Back to home</a>')}</div></div>`;
    if (!u.verified) { PL.go('/verify-account?u=' + u.id); return ''; }
    const edit = ['education', 'skills', 'interests', 'certifications', 'languages'].includes(ctx.query.edit) ? ctx.query.edit : '';
    const editIndex = { education: 1, skills: 3, interests: 3, certifications: 3, languages: 3 };
    const dr = edit ? null : prof(u).draft, st = edit ? editIndex[edit] : dr ? Math.min(dr.step || 0, 6) : 0;
    const cancelFocus = edit === 'education' ? 'education' : edit === 'skills' ? 'skills' : 'interests';
    const attrs = `data-form="onboarding"${edit ? ` data-edit-section="${edit}"` : ''}`;
    const before = edit ? `<a class="onb-edit-back" href="#/app/profile?focus=${cancelFocus}">${I('left', 14)} Back to profile</a>` : '';
    return { html: PL.onb.shell(2, `<div class="onb-form">${ui().stepForm({ attrs, steps: steps(u, dr), submit: edit ? 'Save Changes' : 'Save to Profile', free: !!edit, before })}</div>`, false, 'c'), after: () => {
      const f = document.querySelector('form[data-form="onboarding"]'); if (!f) return;
      ui().stepShow(f, st); refreshEducationProgression(f);
      if (edit) {
        const root = f.closest('.onb2'); root.dataset.editMode = edit;
        root.querySelector('.onb2-step').textContent = `Edit ${edit === 'education' ? 'Education' : edit === 'skills' ? 'Skills' : edit === 'certifications' ? 'Certifications' : edit === 'languages' ? 'Languages' : 'Interests'}`;
        root.querySelector('.onb2-steps').hidden = true;
        f.querySelector('.stepper').hidden = true;
        f.querySelectorAll('.fstep').forEach((step, i) => { step.hidden = i !== st; });
        f.querySelector('[data-action="step-back"]').hidden = true;
        const editTab = { skills: 'skills', interests: 'interests', certifications: 'certs', languages: 'langs' }[edit];
        if (editTab) f.querySelector(`.tabs2 [data-k="${editTab}"]`).click();
      } else if (st) ui().toast('Welcome back – continuing where you left off', 'info');
    } };
  }, { layout: 'auth', title: 'Set up your profile' });

  PL.form('onboarding', f => {
    if (!f.dataset.editSection && !ui().validate(f)) return;
    const u = me(); if (!u) return; const d = readForm(f), p = prof(u);
    if (f.dataset.editSection) {
      if (f.dataset.editSection === 'education') {
        const old = p.education || [], legacy = old.filter(e => !e.level);
        p.education = d.edu.map((e, i) => {
          const previous = old.find(x => x.level === e.level) || legacy[i];
          return { id: previous && previous.id || PL.store.id('e'), level: e.level, degree: e.degree, board: e.board, stream: e.stream, institute: e.institute, year: e.year, grade: e.grade, current: e.current };
        });
        p.qualification = (d.edu[0] && d.edu[0].degree) || '';
      } else if (f.dataset.editSection === 'skills') p.skills = d.skills;
      else if (f.dataset.editSection === 'certifications') {
        const old = p.certifications || [];
        p.certifications = d.certs.map(item => Object.assign({}, old.find(entry => entry.name === item.name) || { id: PL.store.id('ce'), issuer: '—' }, item));
      } else if (f.dataset.editSection === 'languages') p.languages = d.langs;
      else {
        p.preferences = Object.assign({ roles: [], locations: [] }, p.preferences || {});
        p.preferences.roles = d.interests;
      }
      PL.store.save();
      const focus = f.dataset.editSection === 'education' ? 'education' : f.dataset.editSection === 'skills' ? 'skills' : 'interests';
      ui().toast(`${f.dataset.editSection[0].toUpperCase()}${f.dataset.editSection.slice(1)} saved`);
      PL.go('/app/profile?focus=' + focus);
      return;
    }
    d.summary = f._summary || aiSummary(d);
    u.location = d.location; p.dob = d.dob; p.level = d.level; p.headline = d.role; p.about = d.summary;
    p.education = d.edu.map(e => ({ id: PL.store.id('e'), level: e.level, degree: e.degree, board: e.board, stream: e.stream, institute: e.institute, year: e.year, grade: e.grade, current: e.current }));
    p.experience = d.exp.map(x => ({ id: PL.store.id('x'),     title: x.title, company: x.company, division: x.division, ctcCur: x.ctcCur, ctc: x.ctc, from: x.from, to: x.to, desc: x.desc }));
    const cur = d.exp[0]; p.title = cur ? cur.title : ''; p.company = cur ? cur.company : ''; p.experienceYears = expYears(d.exp);
    p.skills = d.skills; p.languages = d.langs; p.awards = d.awards; p.projects = d.projects;
    const old = p.certifications || []; p.certifications = d.certs.map(c => { const o = old.find(x => x.name === c.name); return Object.assign({ id: PL.store.id('ce'), issuer: '—' }, o || {}, { name: c.name, month: c.month, year: c.year }); });
    p.qualification = (d.edu[0] && d.edu[0].degree) || p.qualification || '';
    p.preferences = Object.assign({ roles: [], locations: [d.location], jobType: 'Full-time', salary: '' }, p.preferences || {});
    p.preferences.roles = d.interests;
    p.resumeTemplate = d.template; p.resumeTone = d.tone; p.privacy = Object.assign({ visibility: 'Public', showEmail: false, showPhone: false }, p.privacy || {});
    p.onboarded = true; delete p.draft; PL.store.save(); ui().toast('Profile saved! Here are jobs for you'); PL.go('/job-search');
  });

  /* ---------- finish page ---------- */
  PL.router.add('/onboarding/done', () => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/onboarding/done'); return ''; }
    if (u.role !== 'candidate') return '';
    const p = prof(u);
    if (!p.onboarded) { PL.go('/onboarding'); return ''; }
    const c = PL.q.completion(u), chips = a => (a || []).map(s => `<span class="badge b-blue">${E(s)}</span>`).join(' ') || '<span class="muted">—</span>';
    const row = (k, v) => `<div class="sum-row"><div class="xs muted">${k}</div><div>${v}</div></div>`;
    const ex = (p.experience || [])[0], ed = (p.education || [])[0];
    const left = `<div class="card pad" style="box-shadow:none"><div class="row nowrap" style="gap:14px">${ui().avatar(u, 56)}<div class="grow"><div class="bold">${E(u.name)}</div><div class="muted small">${E(p.headline)} · ${E(u.location)}</div></div></div><div class="mt-s"><div class="row between small"><span>Profile strength</span><b>${c.pct}%</b></div>${ui().progress(c.pct)}</div></div>
      <div class="mt">${row('Summary', E(p.about))}${row('Latest role', ex ? [ex.title, ex.company].filter(Boolean).map(E).join(' at ') : 'Fresher / not added')}${row('Education', ed ? [ed.degree, ed.institute].filter(Boolean).map(E).join(' – ') || 'Not added' : 'Not added')}${row('Skills', chips(p.skills))}${(p.awards || []).length ? row('Awards', chips((p.awards || []).map(lab))) : ''}</div>`;
    const right = `${RHEAD}${resumeHtml(profData(u, p), u, p.resumeTemplate)}`;
    const st = (n, l) => `<div class="dash-stat"><b>${n}</b><span>${l}</span></div>`;
    const stats = `<div class="dash-stats">${st(c.pct + '%', 'Profile strength')}${st((p.skills || []).length, 'Skills')}${st((p.education || []).length, 'Education')}${st((p.experience || []).length, 'Experience')}</div>`;
    return PL.onb.shell(LAB.c.length, `<div style="text-align:center"><span class="badge b-green">${I('check', 14)} Profile created</span><h1 style="font-size:1.7rem;margin-top:10px">Dashboard</h1><p class="muted">Welcome, ${E(u.name.split(' ')[0])}! Your resume is ready &ndash; download it anytime from here.</p></div>
      <div class="mt">${stats}</div>
      <div class="done-grid mt"><div>${left}</div><div>${right}</div></div>
      <div class="row mt" style="justify-content:center"><a class="btn" href="#/job-search">${I('search', 14)} Find jobs</a></div>
      <div class="row mt" style="justify-content:center"><button class="btn btn-secondary" data-action="onb-export">${I('download', 14)} Export to Excel</button><a class="btn btn-secondary" href="#/onboarding">${I('edit', 14)} Edit my answers</a><button class="btn btn-ghost" data-action="logout">Sign out</button></div>`, false, 'c', true);
  }, { layout: 'auth', title: 'Onboarding complete' });

  /* ---------- employer onboarding ---------- */
  const coOf = u => PL.q.companyOf(u);
  PL.router.add('/employer/onboarding', () => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/employer/onboarding'); return ''; }
    if (u.role !== 'recruiter') { PL.go(PL.auth.homeFor(u)); return ''; }
    if (!u.verified) { PL.go('/verify-account?u=' + u.id); return ''; }
    const co = coOf(u);
    if ((u.profile && u.profile.onboarded) || !co || co.description) { PL.go('/employer/dashboard'); return ''; }
    const F = ui().field, f = (n, l, x) => F(Object.assign({ name: n, label: l, value: Array.isArray(co[n]) ? co[n].join(', ') : (co[n] || '') }, x || {}));
    const st = [
      { title: 'Company profile', html: [head('Tell candidates about ' + E(co.name), 'This appears on your public company page and on every job you post.'),
        f('tagline', 'Tagline', { full: true, placeholder: 'e.g. Making quality medicines accessible' }),
        f('hq', 'Headquarters', { required: true, placeholder: 'City, State' }), f('locations', 'Other locations', { placeholder: 'Comma separated' }),
        f('description', 'About the company', { type: 'textarea', rows: 5, full: true, required: true, minlength: 30, placeholder: 'What you do, your products and your mission.' }),
        f('culture', 'Culture & values', { type: 'textarea', rows: 3, full: true })].join('') },
      { title: 'Hiring needs', html: [head('What are you hiring for?', 'Helps us tailor your dashboard. You can change this anytime.'),
        F({ name: 'hireFns', label: 'Functions you hire for', type: 'checkboxes', full: true, options: PL.CATEGORIES.slice(0, 12), value: co.hireFns || [] }),
        F({ name: 'hireVolume', label: 'Hires planned in the next 6 months', type: 'select', options: ['1–5', '6–20', '21–50', '50+'], value: co.hireVolume || '1–5' }),
        f('benefits', 'Benefits you offer', { type: 'textarea', rows: 3, full: true, placeholder: 'One per line, e.g. Health insurance' })].join('') }
    ];
    return { html: PL.onb.shell(2, `<div class="onb-form">${ui().stepForm({ attrs: 'data-form="emp-onboarding"', steps: st, submit: 'Launch my dashboard' })}</div>`, false, 'e'), after: () => { const fm = document.querySelector('form[data-form="emp-onboarding"]'); if (fm) ui().stepShow(fm, 0); } };
  }, { layout: 'auth', title: 'Set up your company' });
  PL.form('emp-onboarding', f => {
    if (!ui().validate(f)) return;
    const u = me(), co = u && coOf(u); if (!co) return; const d = ui().formData(f);
    Object.assign(co, { tagline: d.tagline || '', hq: d.hq, locations: list(d.locations), description: d.description, culture: d.culture || '', benefits: (d.benefits || '').split('\n').map(s => s.trim()).filter(Boolean), hireFns: Array.isArray(d.hireFns) ? d.hireFns : (d.hireFns ? [d.hireFns] : []), hireVolume: d.hireVolume, verification: 'Verified' });
    u.profile = Object.assign(u.profile || {}, { onboarded: true }); PL.store.save();
    ui().toast('Company set up – welcome to your dashboard!'); PL.go('/employer/dashboard');
  });

  if (!PL.onboardingOnly()) return;

  /* ---------- landing page ---------- */
  const person = (c1, c2, f) => `<svg viewBox="0 0 120 120" width="96" height="96" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="${c2}"/><path d="M22 112c3-24 18-34 38-34s35 10 38 34z" fill="${c1}"/><circle cx="60" cy="46" r="19" fill="#f2c9a5"/><path d="M40 44c0-14 9-22 21-22 11 0 20 7 20 20-6-4-10-9-12-14-7 9-17 14-29 16z" fill="${f}"/></svg>`;
  PL.router.add('/', () => {
    const u = me();
    const cont = u ? `<div class="land-cont"><a class="btn" href="#${PL.auth.homeFor(u)}">Continue where I left off</a></div>` : '';
    const role = (r, ic, t, d, btn, cls) => `<div class="land-card"><div class="land-art">${ic}</div><h3>${t}</h3><p class="muted small">${d}</p><a class="btn ${cls} btn-block" ${r === 'recruiter' && !PL.employerOn() ? 'disabled aria-disabled="true" title="Coming soon" style="opacity:.55;cursor:not-allowed;pointer-events:none"' : `href="#/register?role=${r}"`}>${btn}</a></div>`;
    const feat = (ic, t) => `<div class="land-feat"><span>${I(ic, 22)}</span><b>${t}</b></div>`;
    const brands = [['Cipla', '#0b5ea8', 'cipla.com'], ['NOVARTIS', '#e0611f', 'novartis.com'], ['gsk', '#f36f21', 'gsk.com'], ['Pfizer', '#0b3a8f', 'pfizer.com'], ['SUN PHARMA', '#e8892b', 'sunpharma.com'], ['Dr. Reddy\u2019s', '#7a2a8c', 'drreddys.com'], ['Lupin', '#0a7d5a', 'lupin.com']];
    const jobs = PL.q.publicJobs().sort((a, b) => (b.featured - a.featured) || (new Date(b.createdAt) - new Date(a.createdAt))).slice(0, 6);
    const jobCard = j => { const c = PL.q.company(j.companyId) || {}; return `<article class="card job-card pad"><div class="row nowrap start">${ui().logo(c, 44)}<div class="grow"><h3 style="margin:0">${E(j.title)}</h3><div class="small muted">${E(c.name)}</div></div></div><ul class="meta"><li>${I('pin', 14)}${E(j.location)}</li><li>${I('clock', 14)}${E(j.type)} · ${E(j.workMode)}</li></ul><div class="row between"><div class="chips"><span class="tag">${E(j.department)}</span></div><a class="btn btn-sm btn-secondary" href="#/register?role=candidate">Sign up to apply</a></div></article>`; };
    const after = () => {
      const t = document.getElementById('bs-track'); if (!t) return;
      let hover = false; t.onmouseenter = () => hover = true; t.onmouseleave = () => hover = false; t.ontouchstart = () => hover = true; t.ontouchend = () => hover = false;
      let pos = t.scrollLeft;
      const tick = () => { if (!document.body.contains(t)) return; if (!hover && !matchMedia('(prefers-reduced-motion: reduce)').matches) { if (Math.abs(t.scrollLeft - pos) > 2) pos = t.scrollLeft; pos += 0.4; if (pos >= t.scrollWidth / 2) pos = 0; t.scrollLeft = pos; } else pos = t.scrollLeft; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    const html = `<section class="land"><div class="land-in"><span class="land-pill">Trusted by top companies</span>
      <div class="brand-strip"><button type="button" class="bs-arrow" data-action="brand-scroll" data-dir="-1" aria-label="Previous">${I('left', 16)}</button><div class="bs-track" id="bs-track">${brands.concat(brands).map(b => `<span class="bs-logo" style="color:${b[1]}"><img src="https://www.google.com/s2/favicons?domain=${b[2]}&sz=64" alt="" loading="lazy" onerror="this.remove()"><span class="bs-txt">${b[0]}</span></span>`).join('')}</div><button type="button" class="bs-arrow" data-action="brand-scroll" data-dir="1" aria-label="Next">${I('right', 16)}</button></div>
      <h1>Your Next Career Move<br><span>Starts Here</span></h1><p class="muted land-sub">Join India's trusted platform for pharma jobs, skilled professionals, and growth opportunities.</p>${cont}
      <div class="land-cards">${role('candidate', person('#2b6cd9', '#e6f0ff', '#1d2b4f'), "I'm a Candidate", 'Find jobs, build your profile, and grow your career.', 'Register as Candidate', '')}${role('recruiter', person('#1c3f7a', '#eef2f8', '#2a2a2a'), "I'm an Employer", 'Post jobs, find top talent, and grow your team.', 'Register as Employer', 'btn-secondary')}</div>
      <div class="land-feats">${feat('shield', 'Verified Jobs')}${feat('building', 'Trusted Companies')}${feat('zap', 'AI Powered Matching')}${feat('chart', 'Career Growth')}</div></div></section>`;
        return { html, after };
      }, { layout: 'public', title: 'Pharma professionals network' });
  PL.act('brand-scroll', d => { const t = document.getElementById('bs-track'); if (t) t.scrollBy({ left: 140 * Number(d.dir), behavior: 'smooth' }); });
})();
