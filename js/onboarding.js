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
  const TABS = [['skills', 'Skills', 'Your Skills', 'Type and add your skills'], ['awards', 'Awards', 'Awards & Achievements', 'Add an award or achievement'], ['certs', 'Certifications', 'Certifications', 'Add a certification'], ['langs', 'Languages', 'Languages', 'Add a language you speak'], ['projects', 'Projects', 'Projects', 'Add a project']];
  const TEMPLATES = ['Modern', 'Professional', 'Creative', 'Classic'];
  const TONES = [['Professional', 'file'], ['Modern', 'zap'], ['Concise', 'list']];

  PL.onb = {
    shell(cur, inner, _nav, kind = 'c', wide) {
      const L = LAB[kind], all = cur >= L.length, no = all ? L.length : cur + 1;
      const items = L.map((l, i) => `<li class="${all || i < cur ? 'done' : i === cur ? 'cur' : ''}"><span class="dot">${all || i < cur ? '✓' : ''}</span><span class="lbl">${l}</span></li>`).join('');
      return `<div class="onb2" data-kind="${kind}"><div class="onb2-card ${wide ? 'wide' : ''}"><div class="onb2-top"><span class="onb2-step">${all ? 'All done' : `Step ${no} of ${L.length}`}</span></div><ol class="onb2-steps" aria-label="Progress">${items}</ol><div class="onb2-body">${inner}</div></div></div>`;
    },
    set(root, i) {
      if (!root) return; const kind = root.dataset.kind || 'c', m = MAP[kind], cur = m.idx[i];
      root.querySelectorAll('.onb2-steps li').forEach((li, k) => { li.className = k < cur ? 'done' : k === cur ? 'cur' : ''; li.querySelector('.dot').textContent = k < cur ? '✓' : ''; });
      root.querySelector('.onb2-step').textContent = `Step ${m.no[i]} of ${LAB[kind].length}`;
    }
  };
  const head = (t, d) => `<div class="onb-head"><h2>${t}</h2><p class="muted">${d}</p></div>`;
  const note = t => `<div class="onb-note full">${I('zap', 15)} ${t}</div>`;

  /* ---------- repeatable cards (education / experience) ---------- */
  const years = () => { const y = new Date().getFullYear(), o = []; for (let k = y + 6; k >= 1980; k--) o.push(k); return o; };
  const yearSel = (k, v) => `<select data-k="${k}"><option value="">Year</option>${years().map(y => `<option ${String(v) === String(y) ? 'selected' : ''}>${y}</option>`).join('')}</select>`;
  const eduCard = (e = {}) => `<div class="rcard" data-card="edu"><div class="rcard-head"><div class="grow"><input class="rc-title" data-k="degree" list="onb-quals" placeholder="Degree / Course, e.g. B.Pharm" value="${E(e.degree || '')}"><input class="rc-sub" data-k="institute" placeholder="Institute / University" value="${E(e.institute || '')}"></div><button type="button" class="icon-btn" data-action="onb-del" aria-label="Remove">${I('trash', 16)}</button></div>
    <label class="chk"><input type="checkbox" data-k="current" ${e.current ? 'checked' : ''}> Currently Studying</label>
    <div class="rc-grid"><label><span>Start Year</span>${yearSel('from', e.from)}</label><label><span>End Year</span>${yearSel('to', e.current ? '' : e.year)}</label><label><span>CGPA / Percentage</span><input data-k="grade" value="${E(e.grade || '')}" placeholder="e.g. 8.2 or 85%"></label></div></div>`;
  const expCard = (x = {}) => `<div class="rcard" data-card="exp"><div class="rcard-head"><b class="exp-title">${x.current ? 'Present Employer (Current)' : 'Previous Employer'}</b><label class="switch-row"><span class="xs muted">I currently work here</span><span class="switch"><input type="checkbox" data-k="current" ${x.current ? 'checked' : ''}><i></i></span></label><button type="button" class="icon-btn" data-action="onb-del" aria-label="Remove">${I('trash', 16)}</button></div>
    <label class="rc-f"><span>Company Name</span><input data-k="company" value="${E(x.company || '')}"></label><label class="rc-f"><span>Job Title</span><input data-k="title" value="${E(x.title || '')}"></label><label class="rc-f"><span>Division / Segment</span><input data-k="division" list="onb-divs" placeholder="e.g. Oncology, Generics, Hospital" value="${E(x.division || '')}"></label>
    <datalist id="onb-divs">${['Oncology', 'Cardiology', 'Diabetes', 'Generics', 'Branded Generics', 'Biologics', 'OTC / Consumer Health', 'API', 'Hospital', 'Institutional', 'Medical Devices', 'Clinical Research', 'Regulatory', 'Quality'].map(d => `<option value="${d}">`).join('')}</datalist>
    <div class="rc-grid two"><label><span>Start Date</span><input type="month" data-k="from" value="${E(x.from || '')}"></label><label><span>End Date</span><input type="${x.current ? 'text' : 'month'}" data-k="to" value="${x.current ? 'Present' : E(x.to && x.to !== 'Present' ? x.to : '')}" ${x.current ? 'disabled' : ''}></label></div>
    <label class="rc-f"><span>Description (Optional)</span><textarea data-k="desc" rows="2" placeholder="Describe your role and key achievements…">${E(x.desc || '')}</textarea></label></div>`;
  const chip = v => `<span class="chip" data-v="${E(v)}">${E(v)}<button type="button" data-action="tag-del" aria-label="Remove ${E(v)}">×</button></span>`;
  const addLabel = (k, has) => k === 'edu' ? (has ? 'Add Another Education' : 'Add Education') : (has ? 'Add Another Experience' : 'Add Experience');

  /* ---------- candidate steps ---------- */
  function steps(u) {
    const F = ui().field, p = prof(u), edu = (p.education || []).map(e => Object.assign({}, e, { to: e.year })), exp = (p.experience || []).length ? p.experience : [{ current: true }], ed = edu.length ? edu : [{}];
    const tags = { skills: p.skills || [], awards: p.awards || [], certs: (p.certifications || []).map(c => c.name), langs: p.languages || [], projects: p.projects || [] };
    const AI = 'We\u2019ll use your information to create a resume that highlights your strengths and gets you noticed.';
    return [
      { title: 'Details', html: [head('Tell us about yourself', 'Add a photo and a few details to personalize your profile.'),
        `<div class="photo-box full"><div class="photo-av" id="onb-photo">${ui().avatar(u, 84)}</div><b>Add your photo (Optional)</b><small class="muted">JPG or PNG. A clear photo helps recruiters recognize you.</small><div class="row" style="justify-content:center"><button type="button" class="btn btn-secondary btn-sm" data-action="onb-photo" data-cap="user">${I('image', 15)} Take a Photo</button><button type="button" class="btn btn-secondary btn-sm" data-action="onb-photo">${I('upload', 15)} Upload</button></div><button type="button" class="link-btn" data-action="onb-skip-photo">Skip for now</button></div>`,
        `<div class="field full" data-field="level"><label>What's your current role? <span class="req">*</span></label><div class="tone-row lvl-row">${[['Fresher', 'user', 'Just starting out'], ['Experienced', 'briefcase', 'Already working']].map(x => `<label class="pill lvl"><input type="radio" name="level" value="${x[0]}" required ${p.level === x[0] ? 'checked' : ''}><span>${I(x[1], 16)} <b>${x[0]}</b><small>${x[2]}</small></span></label>`).join('')}</div></div>`,
        F({ name: 'location', label: 'Current Location', required: true, full: true, value: u.location || '', placeholder: 'Enter your city' })].join('') },
      { title: 'Education', html: [head('Add your education', 'Add all your education details (Schools, Colleges, etc.)'),
        `<datalist id="onb-quals">${PL.QUALS.map(q => `<option value="${E(q)}">`).join('')}</datalist><div class="full rlist" data-list="edu">${ed.map(eduCard).join('')}</div><div class="full"><button type="button" class="btn btn-soft btn-block" data-action="onb-add" data-k="edu">${I('plus', 15)} <span>${addLabel('edu', true)}</span></button></div>`,
        note('Students can skip. You can always update later!')].join('') },
      { title: 'Experience', html: [head('Add your experience', 'Share your work experience (if any)'),
        `<div class="full rlist" data-list="exp">${exp.map(expCard).join('')}</div><div class="full"><button type="button" class="btn btn-soft btn-block" data-action="onb-add" data-k="exp">${I('plus', 15)} <span>${addLabel('exp', true)}</span></button></div>`,
        note('Freshers can skip. You can always update later!')].join('') },
      { title: 'More about you', html: [head('Add more about you', 'Skills, awards, certifications, and more to help you stand out.'),
        `<div class="full"><div class="tabs2" role="tablist">${TABS.map((t, i) => `<button type="button" role="tab" class="${i ? '' : 'on'}" data-action="onb-tab" data-k="${t[0]}">${t[1]}</button>`).join('')}</div>${TABS.map((t, i) => `<div class="tpanel ${i < 2 ? 'on' : ''}" data-panel="${t[0]}"><div class="tag-add"><input data-tag-input="${t[0]}" placeholder="${t[3]}" aria-label="${t[3]}"><button type="button" class="btn btn-sm" data-action="tag-add" data-k="${t[0]}">Add</button></div>${t[0] === 'skills' ? `<div class="pop"><span class="xs muted">Popular:</span> ${POPULAR.map(s => `<button type="button" class="chip pop-chip" data-action="tag-pop" data-k="skills" data-v="${E(s)}">${E(s)}</button>`).join('')}</div>` : ''}<div class="tag-title">${t[2]}${t[0] === 'skills' ? '' : ' <span class="muted xs">(Optional)</span>'}</div><div class="tag-list" data-k="${t[0]}">${tags[t[0]].map(chip).join('')}</div></div>`).join('')}</div>`,
        note('You can always update these later')].join('') },
      { title: 'AI resume', html: [`<div class="onb-head"><h2>Create your resume with AI <span class="ai-badge">AI Powered</span></h2><p class="muted">Let our AI write a professional resume for you in seconds.</p></div>`,
        `<div class="ai-box full">${I('zap', 18)}<span>${AI}</span></div>`,
        `<div class="full"><h4 class="sub-h">What should we focus on?</h4><div class="focus-grid">${[['edu', 'Education'], ['skills', 'Skills'], ['exp', 'Experience'], ['projects', 'Projects'], ['awards', 'Awards']].map(x => `<label class="check"><input type="checkbox" name="fx_${x[0]}" checked><span>${x[1]}</span></label>`).join('')}</div></div>`,
        `<div class="full"><h4 class="sub-h">Choose a tone</h4><div class="tone-row">${TONES.map((t, i) => `<label class="pill"><input type="radio" name="tone" value="${t[0]}" ${i ? '' : 'checked'}><span>${I(t[1], 14)} ${t[0]}</span></label>`).join('')}</div></div>`].join('') },
      { title: 'Template', html: [head('Choose a template', 'Select a style that fits your personality.'),
        `<div class="full"><div class="tpl2-grid" role="radiogroup" aria-label="Resume template">${TEMPLATES.map((t, i) => `<label class="tpl2"><input type="radio" name="template" value="${t}" ${i ? '' : 'checked'}><span class="tpl2-prev tp-${t.toLowerCase()}"><i></i><i></i><i></i><i></i><i></i></span><b>${t}</b></label>`).join('')}</div><button type="button" class="link-btn more-tpl" data-action="onb-more-tpl">More templates</button></div>`,
        `<div class="full inc-box"><b>Your resume will include</b><div class="inc-grid" id="onb-includes"></div></div>`].join('') },
      { title: 'Ready', html: [`<div class="onb-head row between nowrap"><div><h2 style="text-align:left">Your resume is ready!</h2><p class="muted" style="text-align:left">Preview and make any final changes.</p></div><button type="button" class="btn btn-secondary btn-sm" data-action="onb-edit-ai">Edit with AI ${I('zap', 14)}</button></div>`,
        `<div class="full" id="resume-preview"></div>`, `<p class="xs muted full" style="text-align:center">Looks good? You can customize it anytime.</p>`].join('') }
    ];
  }

  /* ---------- reading the form / building the resume ---------- */
  function readForm(f) {
    const val = n => { const el = f.querySelector(`[name="${n}"]`); return el ? el.value.trim() : ''; };
    const cards = k => [...f.querySelectorAll(`[data-card="${k}"]`)].map(c => { const o = {}; c.querySelectorAll('[data-k]').forEach(el => { o[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value.trim(); }); return o; });
    const tag = k => [...f.querySelectorAll(`.tag-list[data-k="${k}"] [data-v]`)].map(e => e.dataset.v);
    const on = n => { const el = f.querySelector(`[name="fx_${n}"]`); return !el || el.checked; };
    const edu = cards('edu').filter(e => e.degree || e.institute).map(e => ({ degree: e.degree, institute: e.institute, from: e.from, year: e.current ? 'Present' : e.to, grade: e.grade, current: e.current }));
    const exp = cards('exp').filter(x => x.company || x.title).map(x => ({ title: x.title, company: x.company, division: x.division, from: x.from, to: x.current ? 'Present' : (x.to || 'Present'), desc: x.desc, current: x.current }));
    const lv = f.querySelector('[name=level]:checked'), level = lv ? lv.value : '';
    const t = f.querySelector('[name=tone]:checked'), tp = f.querySelector('[name=template]:checked');
    const role = (exp[0] && exp[0].title) || (level === 'Fresher' ? 'Fresher' : 'Pharma professional');
    return { level, role, location: val('location'), edu, exp, skills: tag('skills'), awards: tag('awards'), certs: tag('certs'), langs: tag('langs'), projects: tag('projects'), inc: { edu: on('edu'), skills: on('skills'), exp: on('exp'), projects: on('projects'), awards: on('awards') }, tone: t ? t.value : 'Professional', template: tp ? tp.value : 'Modern' };
  }
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
    const ed = inc.edu !== false && d.edu.length ? d.edu.map(x => `<div class="r-row"><div><b>${E(x.degree || '')}</b>${x.institute ? `<div class="muted">${E(x.institute)}</div>` : ''}${x.grade ? `<div class="muted">CGPA/Score: ${E(x.grade)}</div>` : ''}</div><span class="muted">${E(x.from || '')}${x.from ? ' – ' : ''}${E(x.year || '')}</span></div>`).join('') : '';
    const contact = [u.phone && I('phone', 12) + ' ' + E(u.phone), u.email && I('mail', 12) + ' ' + E(u.email), d.location && I('pin', 12) + ' ' + E(d.location)].filter(Boolean).join('<span class="sep"></span>');
    return `<div class="resume resume2 rt-${E(String(tpl || 'Modern').toLowerCase())}"><div class="resume-head">${ui().avatar(u, 54)}<div><h3>${E(u.name)}</h3><div class="r-role">${E(d.role)}</div><div class="r-contact">${contact}</div></div></div>
      ${sec('Professional Summary', `<p>${E(d.summary || aiSummary(d))}</p>`)}${sec('Experience', ex)}${sec('Education', ed)}${inc.skills !== false && d.skills.length ? sec('Skills', chips(d.skills)) : ''}${inc.projects !== false && d.projects.length ? sec('Projects', `<p>${E(d.projects.join(' · '))}</p>`) : ''}${inc.awards !== false && d.awards.length ? sec('Awards', `<p>${E(d.awards.join(' · '))}</p>`) : ''}${d.certs.length ? sec('Certifications', `<p>${E(d.certs.join(' · '))}</p>`) : ''}${d.langs.length ? sec('Languages', `<p>${E(d.langs.join(' · '))}</p>`) : ''}</div>`;
  }
  const profData = (u, p) => ({ role: p.headline || '', location: u.location || '', summary: p.about, exp: (p.experience || []).map(x => ({ title: x.title, company: x.company, division: x.division, from: x.from, to: x.to, desc: x.desc })), edu: (p.education || []).map(x => ({ degree: x.degree, institute: x.institute, from: x.from, year: x.year, grade: x.grade })), skills: p.skills || [], awards: p.awards || [], certs: (p.certifications || []).map(c => c.name), langs: p.languages || [], projects: p.projects || [], inc: {} });

  function refreshIncludes(f) {
    const d = readForm(f), box = f.querySelector('#onb-includes'); if (!box) return;
    const items = [[d.inc.edu, 'Education'], [d.inc.exp && d.exp.length, 'Experience (if any)'], [d.inc.skills, 'Skills'], [d.inc.awards, 'Awards'], [d.inc.projects && d.projects.length, 'Projects'], [d.certs.length, 'Certifications']].filter(x => x[0]);
    box.innerHTML = items.map(x => `<span>${I('checkc', 15)} ${x[1]}</span>`).join('');
  }
  function renderPreview(f) {
    const u = me(), d = readForm(f); f._summary = f._summary && f._tone === d.tone ? f._summary : aiSummary(d); f._tone = d.tone; d.summary = f._summary;
    f.querySelector('#resume-preview').innerHTML = resumeHtml(d, u, d.template);
  }
  function onbStep(f, i) {
    const nx = f.querySelector('[type=submit]'), lab = { 4: 'Next: Choose Template', 5: 'Create My Resume' }[i]; if (lab && nx) nx.textContent = lab;
    const dl = f.querySelector('[data-action="onb-download"]'); if (dl) dl.hidden = i !== 6;
    if (i === 5) refreshIncludes(f); if (i === 6) renderPreview(f);
  }
  document.addEventListener('stepchange', e => {
    const f = e.target; if (!f.matches || !f.matches('form[data-form="onboarding"],form[data-form="emp-onboarding"]')) return;
    PL.onb.set(f.closest('.onb2'), e.detail); if (f.dataset.form === 'onboarding') onbStep(f, e.detail);
  });

  /* ---------- interactions ---------- */
  const grab = (cap, cb) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (cap) inp.setAttribute('capture', cap);
    inp.onchange = () => { const file = inp.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(1, 256 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .85)); }; img.onerror = () => ui().toast('Could not read that image', 'err'); img.src = r.result; }; r.readAsDataURL(file); };
    inp.click();
  };
  PL.act('onb-photo', d => grab(d.cap, data => { const u = me(); u.photo = data; PL.store.save(); const box = document.getElementById('onb-photo'); if (box) box.innerHTML = ui().avatar(u, 84); ui().toast('Photo added'); }));
  PL.act('onb-skip-photo', () => { const r = document.querySelector('[name=role]'); if (r) r.focus(); });
  PL.act('onb-more-tpl', () => ui().toast('More templates are coming soon', 'info'));
  PL.act('onb-edit-ai', () => { const f = document.querySelector('form[data-form="onboarding"]'), rs = [...f.querySelectorAll('[name=tone]')], k = rs.findIndex(r => r.checked), n = rs[(k + 1) % rs.length]; n.checked = true; renderPreview(f); ui().toast('Rewrote your summary in a ' + n.value + ' tone'); });
  PL.act('onb-download', () => {
    const el = document.querySelector('.resume'); if (!el) return;
    const css = [...document.querySelectorAll('link[rel=stylesheet]')].map(l => `<link rel="stylesheet" href="${l.href}">`).join(''), fr = document.createElement('iframe');
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    fr.contentDocument.open(); fr.contentDocument.write(`<!doctype html><html><head>${css}</head><body style="margin:0;padding:16px;background:#fff">${el.outerHTML}</body></html>`); fr.contentDocument.close();
    setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { ui().toast('Printing is not available here', 'err'); } setTimeout(() => fr.remove(), 2000); }, 500);
  });
  const refreshAdd = list => { const k = list.dataset.list, b = list.parentElement.querySelector(`[data-action="onb-add"][data-k="${k}"] span`); if (b) b.textContent = addLabel(k, !!list.children.length); };
  PL.act('onb-add', d => { const list = document.querySelector(`.rlist[data-list="${d.k}"]`); list.insertAdjacentHTML('beforeend', d.k === 'edu' ? eduCard() : expCard({ current: !list.children.length })); refreshAdd(list); const last = list.lastElementChild.querySelector('input'); if (last) last.focus(); });
  PL.act('onb-del', (d, el) => { const list = el.closest('.rlist'); el.closest('.rcard').remove(); refreshAdd(list); });
  PL.act('onb-tab', (d, el) => { const w = el.closest('.full'); w.querySelectorAll('.tabs2 button').forEach(b => b.classList.toggle('on', b === el)); w.querySelectorAll('.tpanel').forEach(p => p.classList.toggle('on', p.dataset.panel === d.k || (d.k === 'skills' && p.dataset.panel === 'awards'))); });
  const addTag = (k, v) => { v = String(v || '').trim(); if (!v) return; const l = document.querySelector(`.tag-list[data-k="${k}"]`); if ([...l.querySelectorAll('[data-v]')].some(c => c.dataset.v.toLowerCase() === v.toLowerCase())) return; l.insertAdjacentHTML('beforeend', chip(v)); };
  PL.act('tag-add', d => { const inp = document.querySelector(`[data-tag-input="${d.k}"]`); addTag(d.k, inp.value); inp.value = ''; inp.focus(); });
  PL.act('tag-pop', d => addTag(d.k, d.v));
  PL.act('tag-del', (d, el) => el.closest('.chip').remove());
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-tag-input]')) { e.preventDefault(); addTag(e.target.dataset.tagInput, e.target.value); e.target.value = ''; } });
  document.addEventListener('change', e => {
    const t = e.target; if (!t.matches || !t.matches('.rcard input[data-k="current"]')) return;
    const c = t.closest('.rcard'), end = c.querySelector('[data-k="to"]');
    if (c.dataset.card === 'exp') c.querySelector('.exp-title').textContent = t.checked ? 'Present Employer (Current)' : 'Previous Employer';
    if (end) { end.disabled = t.checked; end.value = ''; end.type = t.checked ? 'text' : 'month'; if (t.checked) end.value = 'Present'; }
  });

  /* ---------- candidate onboarding route ---------- */
  PL.router.add('/onboarding', () => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/onboarding'); return ''; }
    if (u.role !== 'candidate') return `<div class="auth-wrap"><div class="card auth-card">${ui().empty('user', 'Candidate onboarding only', 'This preview covers the candidate onboarding experience.', '<a class="btn" href="#/">Back to home</a>')}</div></div>`;
    if (!u.verified) { PL.go('/verify-account?u=' + u.id); return ''; }
    return { html: PL.onb.shell(2, `<div class="onb-form">${ui().stepForm({ attrs: 'data-form="onboarding"', steps: steps(u), submit: 'Save to Profile', extra: '<button type="button" class="btn btn-secondary" data-action="onb-download" hidden>' + I('download', 15) + ' Download PDF</button>' })}</div>`, false, 'c'), after: () => { const f = document.querySelector('form[data-form="onboarding"]'); if (f) ui().stepShow(f, 0); } };
  }, { layout: 'auth', title: 'Set up your profile' });

  PL.form('onboarding', f => {
    if (!ui().validate(f)) return;
    const u = me(); if (!u) return; const d = readForm(f), p = prof(u);
    d.summary = f._summary || aiSummary(d);
    u.location = d.location; p.level = d.level; p.headline = d.role; p.about = d.summary;
    p.education = d.edu.map(e => ({ id: PL.store.id('e'), degree: e.degree, institute: e.institute, from: e.from, year: e.year, grade: e.grade }));
    p.experience = d.exp.map(x => ({ id: PL.store.id('x'),     title: x.title, company: x.company, division: x.division, from: x.from, to: x.to, desc: x.desc }));
    const cur = d.exp[0]; p.title = cur ? cur.title : ''; p.company = cur ? cur.company : ''; p.experienceYears = expYears(d.exp);
    p.skills = d.skills; p.languages = d.langs; p.awards = d.awards; p.projects = d.projects;
    const old = p.certifications || []; p.certifications = d.certs.map(n => old.find(c => c.name === n) || { id: PL.store.id('ce'), name: n, issuer: '—', year: '' });
    p.qualification = (d.edu[0] && d.edu[0].degree) || p.qualification || '';
    p.preferences = Object.assign({ roles: [PL.CATEGORIES[0]], locations: [d.location], jobType: 'Full-time', salary: '' }, p.preferences || {});
    p.resumeTemplate = d.template; p.resumeTone = d.tone; p.privacy = Object.assign({ visibility: 'Public', showEmail: false, showPhone: false }, p.privacy || {});
    p.onboarded = true; PL.store.save(); ui().toast('Profile saved!'); PL.go('/onboarding/done');
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
      <div class="mt">${row('Summary', E(p.about))}${row('Latest role', ex ? `${E(ex.title)} at ${E(ex.company)}` : 'Fresher / not added')}${row('Education', ed ? `${E(ed.degree)} – ${E(ed.institute)}` : 'Not added')}${row('Skills', chips(p.skills))}${(p.awards || []).length ? row('Awards', chips(p.awards)) : ''}</div>`;
    const right = `<h3 style="margin-top:0">Your resume <span class="badge b-teal">${E(p.resumeTemplate || 'Modern')}</span></h3>${resumeHtml(profData(u, p), u, p.resumeTemplate)}<div class="row mt"><button class="btn btn-secondary btn-sm" data-action="onb-download">${I('download', 14)} Download PDF</button></div>`;
    return PL.onb.shell(LAB.c.length, `<div style="text-align:center"><span class="badge b-green">${I('check', 14)} Onboarding complete</span><h1 style="font-size:1.7rem;margin-top:10px">You're all set, ${E(u.name.split(' ')[0])}!</h1><p class="muted">Here is your profile summary.</p></div>
      <div class="done-grid mt"><div>${left}</div><div>${right}</div></div>
      <div class="notice done-notice mt" style="padding:12px 14px;border-radius:10px;background:var(--surface-2,#f4f7fb)">${I('zap', 16)} <b>Coming soon:</b> job search, network, messaging and more.</div>
      <div class="row mt" style="justify-content:center"><a class="btn btn-secondary" href="#/onboarding">${I('edit', 14)} Edit my answers</a><button class="btn btn-ghost" data-action="logout">Sign out</button></div>`, false, 'c', true);
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
    const jobCard = j => { const c = PL.q.company(j.companyId) || {}; return `<article class="card job-card pad"><div class="row nowrap start">${ui().logo(c, 44)}<div class="grow"><h3 style="margin:0">${E(j.title)}</h3><div class="small muted">${E(c.name)}</div></div></div><ul class="meta"><li>${I('pin', 14)}${E(j.location)}</li><li>${I('clock', 14)}${E(j.type)} · ${E(j.workMode)}</li></ul><div class="row between"><div class="chips"><span class="tag">${E(j.department)}</span></div><a class="btn btn-sm btn-secondary" href="#/register">Sign up to apply</a></div></article>`; };
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
      <div class="land-feats">${feat('shield', 'Verified Jobs')}${feat('building', 'Trusted Companies')}${feat('zap', 'AI Powered Matching')}${feat('chart', 'Career Growth')}</div></div></section>
    <section class="section"><div class="container"><div class="section-head"><h2>Latest jobs</h2><span class="muted small">Sign up free to apply</span></div><div class="grid g2">${jobs.map(jobCard).join('')}</div><div class="row mt" style="justify-content:center"><a class="btn" href="#/register">Create your free profile</a></div></div></section>`;
        return { html, after };
      }, { layout: 'public', title: 'Pharma professionals network' });
  PL.act('brand-scroll', d => { const t = document.getElementById('bs-track'); if (t) t.scrollBy({ left: 140 * Number(d.dir), behavior: 'smooth' }); });
})();
