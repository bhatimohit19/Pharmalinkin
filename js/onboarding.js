/* Candidate onboarding (phase 1): account -> verify -> profile steps -> optional AI resume -> finish */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s);
  const me = () => PL.auth.user();
  const prof = u => (u.profile = u.profile || {});
  const list = v => String(v || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
  const EMP = ['Employed – pharma industry', 'Employed – other sector', 'Looking for opportunities', 'Student / Fresher', 'Self-employed / Consultant'];
  const TEMPLATES = [['none', 'Skip for now', 'No resume right now – you can create one later.'], ['Classic', 'Classic', 'Traditional single-column layout'], ['Modern', 'Modern', 'Accent-colour header, bold sections'], ['Compact', 'Compact', 'Tighter spacing, fits more']];
  const LABELS = [['Create account', 'Your sign-in details'], ['Verify mobile & email', 'Quick OTP check'], ['About you', 'Headline & summary'], ['Education', 'Highest qualification'], ['Experience', 'Your latest role'], ['More about you', 'Skills, awards, preferences'], ['AI resume', 'Optional'], ['Finish', 'Privacy & review']];
  const pctOf = cur => Math.round(Math.min(cur, LABELS.length) / LABELS.length * 100);

  /* journey shell: sticky progress sidebar + main panel (stacks on mobile) */
  PL.onb = {
    shell(cur, inner, nav) {
      const all = cur >= LABELS.length, pct = all ? 100 : pctOf(cur);
      const items = LABELS.map((l, i) => { const st = i < cur ? 'done' : i === cur ? 'cur' : ''; const body = `<span class="dot">${i < cur ? '✓' : i + 1}</span><span class="txt"><span class="lbl">${l[0]}</span><span class="sub">${l[1]}</span></span>`; return `<li class="${st}">${nav && i >= 2 && i <= 6 ? `<button type="button" class="onb-link" data-action="onb-goto" data-i="${i}">${body}</button>` : `<div class="onb-link">${body}</div>`}</li>`; }).join('');
      return `<div class="onb-page"><aside class="onb-side" aria-label="Onboarding progress"><div class="onb-top"><div><div class="xs muted">${all ? 'All done' : `Step ${cur + 1} of ${LABELS.length}`}</div><b class="onb-now">${all ? 'Onboarding complete' : LABELS[cur][0]}</b></div><b class="onb-pct">${pct}%</b></div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><ol class="onb-steps">${items}</ol></aside><section class="onb-main card">${inner}</section></div>`;
    },
    set(root, cur) {
      const side = root.querySelector('.onb-side'); if (!side) return; const pct = pctOf(cur);
      side.querySelectorAll('.onb-steps li').forEach((li, i) => { li.className = i < cur ? 'done' : i === cur ? 'cur' : ''; li.querySelector('.dot').textContent = i < cur ? '✓' : i + 1; });
      side.querySelector('.onb-top .xs').textContent = `Step ${cur + 1} of ${LABELS.length}`; side.querySelector('.onb-now').textContent = LABELS[cur][0]; side.querySelector('.onb-pct').textContent = pct + '%';
      const pb = side.querySelector('.progress'); pb.setAttribute('aria-valuenow', pct); pb.firstElementChild.style.width = pct + '%';
    }
  };
  document.addEventListener('stepchange', e => { if (e.target.matches && e.target.matches('form[data-form="onboarding"]')) PL.onb.set(e.target.closest('.onb-page'), e.detail + 2); });
  PL.act('onb-goto', d => { const f = document.querySelector('form[data-form="onboarding"]'); if (!f) return; const i = Number(d.i) - 2; if (i < Number(f.dataset.cur || 0)) { ui().stepShow(f, i); window.scrollTo({ top: 0 }); } });
  document.addEventListener('change', e => {
    if (!e.target.matches || !e.target.matches('input[name="fresher"]')) return;
    e.target.closest('form').querySelectorAll('[name=jobTitle],[name=company],[name=from],[name=to],[name=desc]').forEach(el => { el.disabled = e.target.checked; });
  });
  const head = (t, d) => `<div class="onb-head"><h2>${t}</h2><p class="muted">${d}</p></div>`;

  function steps(u) {
    const F = ui().field, p = prof(u), ex = (p.experience || [])[0] || {}, ed = (p.education || [])[0] || {}, pr = p.preferences || {}, pv = p.privacy || {};
    return [
      { title: 'About you', html: [head('Tell us about yourself','Employers and peers see this first. Keep it short and clear.'),
        F({ name: 'headline', label: 'Professional headline', required: true, full: true, value: p.headline || '', placeholder: 'e.g. Regulatory Affairs Executive' }),
        F({ name: 'location', label: 'Current location', required: true, value: u.location || '', placeholder: 'City, State' }),
        F({ name: 'qualification', label: 'Professional qualification', type: 'select', required: true, options: PL.QUALS, placeholder: 'Select…', value: p.qualification || '' }),
        F({ name: 'status', label: 'Current status', type: 'select', required: true, options: EMP, placeholder: 'Select…', value: p.status || '' }),
        F({ name: 'exp', label: 'Years of experience', type: 'number', min: 0, max: 45, required: true, value: p.experienceYears || 0 }),
        F({ name: 'about', label: 'Short summary', type: 'textarea', required: true, full: true, rows: 4, value: p.about || '', help: 'At least 30 characters.', minlength: 30 })].join('') },
      { title: 'Education', html: [head('Add your education','Start with your highest qualification. You can add more from your profile later.'),
        F({ name: 'degree', label: 'Degree / course', required: true, value: ed.degree || '', placeholder: 'e.g. B.Pharm' }),
        F({ name: 'institute', label: 'Institute / university', required: true, value: ed.institute || '' }),
        F({ name: 'year', label: 'Year of completion', required: true, pattern: '\\d{4}', value: ed.year || '', placeholder: 'YYYY' })].join('') },
      { title: 'Experience', html: [head('Add your experience','Share your latest role. If you are just starting out, tick the fresher box and continue.'),
        F({ name: 'fresher', type: 'checkbox', label: "I'm a fresher / no work experience yet", full: true, value: p.onboarded && !(p.experience || []).length }),
        F({ name: 'jobTitle', label: 'Job title', value: ex.title || '' }),
        F({ name: 'company', label: 'Company', value: ex.company || '' }),
        F({ name: 'from', label: 'Started (year)', pattern: '\\d{4}', value: ex.from || '', placeholder: 'YYYY' }),
        F({ name: 'to', label: 'Ended (year or Present)', value: ex.to || 'Present' }),
        F({ name: 'desc', label: 'What did you do?', type: 'textarea', full: true, rows: 3, value: ex.desc || '' })].join('') },
      { title: 'More about you', html: [head('Add more about you','Skills, certifications, awards and the kind of role you want next.'),
        '<h3 class="onb-sec">Skills & achievements</h3>',
        F({ name: 'skills', label: 'Key skills', required: true, full: true, value: (p.skills || []).join(', '), help: 'Separate with commas – add at least 3.' }),
        F({ name: 'certs', label: 'Certifications (optional)', full: true, value: (p.certifications || []).map(c => c.name).join(', '), help: 'Separate with commas.' }),
        F({ name: 'awards', label: 'Awards & achievements (optional)', full: true, value: (p.awards || []).join(', '), help: 'Separate with commas.' }),
        F({ name: 'languages', label: 'Languages', required: true, value: (p.languages || []).join(', ') }),
        '<h3 class="onb-sec">Job preferences</h3>',
        F({ name: 'prefLoc', label: 'Preferred job locations', required: true, value: (pr.locations || []).join(', ') }),
        F({ name: 'jobType', label: 'Job type', type: 'select', required: true, options: JOB_TYPES, value: pr.jobType || 'Full-time' }),
        F({ name: 'roles', label: 'Preferred functions', type: 'checkboxes', full: true, options: PL.CATEGORIES.slice(0, 12), value: pr.roles || [] })].join('') },
      { title: 'AI resume', html: head('Create your resume with AI <span class="badge b-teal">Optional</span>', 'Pick a template and our AI will draft a resume from the details you just entered. You can skip this and do it later.') +
        `<div class="field full" data-field="template"><div class="tpl-grid" role="radiogroup" aria-label="Resume template">${TEMPLATES.map(t => `<label class="tpl"><input type="radio" name="template" value="${t[0]}" ${(p.resumeTemplate || 'none') === t[0] ? 'checked' : ''}><span class="tpl-card"><span class="tpl-prev tpl-${t[0].toLowerCase()}"><i></i><i></i><i></i><i></i></span><b>${t[1]}</b><small>${t[2]}</small></span></label>`).join('')}</div></div>` },
      { title: 'Finish', html: [head('Review & finish','Choose who can see your profile, then complete your onboarding.'),
        F({ name: 'visibility', label: 'Profile visibility', type: 'select', required: true, options: ['Public', 'Connections only', 'Private'], value: pv.visibility || 'Public' }),
        F({ name: 'showEmail', type: 'checkbox', label: 'Show my email on my profile', full: true, value: !!pv.showEmail }),
        F({ name: 'showPhone', type: 'checkbox', label: 'Show my mobile number on my profile', full: true, value: !!pv.showPhone })].join('') }
    ];
  }

  PL.router.add('/onboarding', () => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/onboarding'); return ''; }
    if (u.role !== 'candidate') return `<div class="auth-wrap"><div class="card auth-card">${ui().empty('user', 'Candidate onboarding only', 'This preview covers the candidate onboarding experience.', '<a class="btn" href="#/">Back to home</a>')}</div></div>`;
    if (!u.verified) { PL.go('/verify-account?u=' + u.id); return ''; }
    return {
      html: PL.onb.shell(2, `<div class="onb-form">${ui().stepForm({ attrs: 'data-form="onboarding"', steps: steps(u), submit: 'Finish onboarding' })}</div>`, true),
      after: () => { const c = document.querySelector('input[name="fresher"]'); if (c && c.checked) c.dispatchEvent(new Event('change', { bubbles: true })); }
    };
  }, { layout: 'auth', title: 'Set up your profile' });

  PL.form('onboarding', f => {
    if (!ui().validate(f)) return;
    const u = me(); if (!u) return; const d = ui().formData(f), p = prof(u);
    const skills = list(d.skills);
    if (skills.length < 3) { ui().setError(f, 'skills', 'Please add at least 3 skills, separated by commas.'); ui().stepShow(f, 3); return; }
    if (!d.fresher && (!!d.jobTitle !== !!d.company)) { ui().setError(f, d.jobTitle ? 'company' : 'jobTitle', 'Enter both job title and company, or tick "fresher".'); ui().stepShow(f, 2); return; }
    u.location = d.location; p.headline = d.headline; p.about = d.about; p.qualification = d.qualification; p.status = d.status; p.experienceYears = Number(d.exp) || 0;
    const ed = (p.education || [])[0] || (p.education = [{ id: PL.store.id('e') }])[0];
    Object.assign(ed, { degree: d.degree, institute: d.institute, year: d.year });
    if (d.fresher || !d.jobTitle) { p.experience = []; p.title = ''; p.company = ''; }
    else {
      const ex = (p.experience || [])[0] || (p.experience = [{ id: PL.store.id('x') }])[0];
      Object.assign(ex, { title: d.jobTitle, company: d.company, from: d.from, to: d.to || 'Present', desc: d.desc }); p.title = d.jobTitle; p.company = d.company;
    }
    p.skills = skills; p.languages = list(d.languages); p.awards = list(d.awards);
    const old = p.certifications || [];
    p.certifications = list(d.certs).map(n => old.find(c => c.name === n) || { id: PL.store.id('ce'), name: n, issuer: '—', year: '' });
    const roles = Array.isArray(d.roles) ? d.roles : (d.roles ? [d.roles] : []);
    p.preferences = { roles: roles.length ? roles : [PL.CATEGORIES[0]], locations: list(d.prefLoc), salary: (p.preferences || {}).salary || '', jobType: d.jobType };
    p.resumeTemplate = d.template && d.template !== 'none' ? d.template : '';
    p.privacy = Object.assign(p.privacy || {}, { visibility: d.visibility, showEmail: !!d.showEmail, showPhone: !!d.showPhone });
    p.onboarded = true; PL.store.save();
    ui().toast('Onboarding complete!'); PL.go('/onboarding/done');
  });

  function resume(u) {
    const p = prof(u), ex = p.experience || [], ed = p.education || [];
    const yrs = p.experienceYears ? `${p.experienceYears}+ years of experience` : 'an early-career professional';
    const sum = `${p.headline || 'Pharma professional'} with ${yrs}. ${p.skills && p.skills.length ? 'Skilled in ' + p.skills.slice(0, 4).join(', ') + '.' : ''} Seeking ${(p.preferences || {}).jobType || 'full-time'} roles in ${((p.preferences || {}).roles || ['pharma'])[0]}.`;
    const sec = (t, b) => b ? `<h4>${t}</h4>${b}` : '';
    return `<div class="resume resume-${(p.resumeTemplate || 'Classic').toLowerCase()}"><div class="resume-head"><h3>${E(u.name)}</h3><div class="small">${E(u.email)} · ${E(u.phone || '')} · ${E(u.location)}</div></div>
      ${sec('Summary', `<p>${E(sum)}</p>`)}${sec('Experience', ex.map(x => `<p><b>${E(x.title)}</b>, ${E(x.company)} (${E(x.from)}–${E(x.to)})<br><span class="muted small">${E(x.desc)}</span></p>`).join(''))}
      ${sec('Education', ed.map(x => `<p><b>${E(x.degree)}</b>, ${E(x.institute)} (${E(x.year)})</p>`).join(''))}${sec('Skills', `<p>${E((p.skills || []).join(' · '))}</p>`)}
      ${sec('Certifications', (p.certifications || []).length ? `<p>${E(p.certifications.map(c => c.name).join(' · '))}</p>` : '')}${sec('Awards', (p.awards || []).length ? `<p>${E(p.awards.join(' · '))}</p>` : '')}</div>`;
  }

  PL.router.add('/onboarding/done', () => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/onboarding/done'); return ''; }
    if (u.role !== 'candidate') return '';
    const p = prof(u);
    if (!p.onboarded) { PL.go('/onboarding'); return ''; }
    const c = PL.q.completion(u), chips = a => (a || []).map(s => `<span class="badge b-blue">${E(s)}</span>`).join(' ') || '<span class="muted">—</span>';
    const row = (k, v) => `<div class="sum-row"><div class="xs muted">${k}</div><div>${v}</div></div>`;
    const ex = (p.experience || [])[0], ed = (p.education || [])[0] || {}, pr = p.preferences || {};
    const left = `<div class="card pad" style="box-shadow:none"><div class="row nowrap" style="gap:14px">${ui().avatar(u, 56)}<div class="grow"><div class="bold">${E(u.name)}</div><div class="muted small">${E(p.headline)} · ${E(u.location)}</div></div></div>
        <div class="mt-s"><div class="row between small"><span>Profile strength</span><b>${c.pct}%</b></div>${ui().progress(c.pct)}</div></div>
      <div class="mt">${row('Summary', E(p.about))}${row('Latest role', ex ? `${E(ex.title)} at ${E(ex.company)} (${E(ex.from)}–${E(ex.to)})` : 'Fresher')}${row('Education', `${E(ed.degree)} – ${E(ed.institute)}, ${E(ed.year)}`)}${row('Skills', chips(p.skills))}${(p.awards || []).length ? row('Awards', chips(p.awards)) : ''}${row('Looking for', `${E(pr.jobType)} · ${E((pr.locations || []).join(', '))}`)}${row('Visibility', E((p.privacy || {}).visibility))}</div>`;
    const right = p.resumeTemplate ? `<h3 style="margin-top:0">Your AI-drafted resume <span class="badge b-teal">${E(p.resumeTemplate)}</span></h3>${resume(u)}<p class="xs muted">Simulated AI draft built from your answers. Editing and download come later.</p>` : `<div class="card pad" style="box-shadow:none;text-align:center">${I('file', 28)}<h3>No resume yet</h3><p class="muted small">You skipped the AI resume step. You can create one later.</p></div>`;
    return PL.onb.shell(LABELS.length, `<div style="text-align:center"><span class="badge b-green">${I('check', 14)} Onboarding complete</span><h1 style="font-size:1.7rem;margin-top:10px">You're all set, ${E(u.name.split(' ')[0])}!</h1><p class="muted">Here is your profile summary.</p></div>
      <div class="done-grid mt"><div>${left}</div><div>${right}</div></div>
      <div class="notice done-notice mt" style="padding:12px 14px;border-radius:10px;background:var(--surface-2,#f4f7fb)">${I('zap', 16)} <b>Coming soon:</b> job search, network, messaging and more.</div>
      <div class="row mt" style="justify-content:center"><a class="btn btn-secondary" href="#/onboarding">${I('edit', 14)} Edit my answers</a><button class="btn btn-ghost" data-action="logout">Sign out</button></div>`);
  }, { layout: 'auth', title: 'Onboarding complete' });

  if (!PL.onboardingOnly()) return;

  /* landing page for the onboarding preview */
  PL.router.add('/', () => {
    const u = me();
    const cta = u ? `<a class="btn btn-lg" href="#${PL.auth.homeFor(u)}">Continue my profile</a>` : `<a class="btn btn-lg" href="#/register">Create your profile</a><a class="btn btn-lg btn-secondary" href="#/login">Sign in</a>`;
    const feat = (ic, t, d) => `<div class="card pad">${I(ic, 24)}<h3>${t}</h3><p class="muted small">${d}</p></div>`;
    const jobs = PL.q.publicJobs().sort((a, b) => (b.featured - a.featured) || (new Date(b.createdAt) - new Date(a.createdAt))).slice(0, 6);
    const jobCard = j => { const c = PL.q.company(j.companyId) || {}; return `<article class="card job-card pad"><div class="row nowrap start">${ui().logo(c, 44)}<div class="grow"><h3 style="margin:0">${E(j.title)}</h3><div class="small muted">${E(c.name)}</div></div></div><ul class="meta"><li>${I('pin', 14)}${E(j.location)}</li><li>${I('clock', 14)}${E(j.type)} · ${E(j.workMode)}</li></ul><div class="row between"><div class="chips"><span class="tag">${E(j.department)}</span></div><a class="btn btn-sm btn-secondary" href="#/register">Sign up to apply</a></div></article>`; };
    return `<section class="hero"><div class="container hero-grid"><div><span class="badge b-blue">For pharma professionals</span><h1 style="margin-top:12px">Build your pharma profile <span>in a few easy steps</span></h1><p class="muted" style="font-size:1.05rem">Join PharmaLinkIn, share your experience, skills and preferences, and get ready for opportunities across sales, regulatory, clinical research, quality and manufacturing.</p><div class="row mt" style="gap:10px">${cta}</div></div>
      <div class="hero-art"><img alt="Illustration of a pharma network" src="${ui().art('hero', 'Pharma careers, connected', 640, 420)}" style="width:100%;border-radius:12px;display:block"></div></div></section>
    <section class="section"><div class="container"><div class="section-head"><h2>How it works</h2></div><div class="grid g3">
      ${feat('user', '1. Create your account', 'Sign up and verify your mobile and email.')}${feat('edit', '2. Complete your profile', 'Education, experience, skills and preferences – with a progress bar.')}${feat('award', '3. Get your resume', 'Optionally let AI draft a resume from a template.')}</div></div></section>
    <section class="section"><div class="container"><div class="section-head"><h2>Latest jobs</h2><span class="muted small">Sign up free to apply</span></div><div class="grid g2">${jobs.map(jobCard).join('')}</div><div class="row mt" style="justify-content:center"><a class="btn" href="#/register">Create your free profile</a></div></div></section>`;
  }, { layout: 'public', title: 'Pharma professionals network' });
})();
