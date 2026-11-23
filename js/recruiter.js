/* Recruiter / employer workspace */
(function () {
  const PL = (window.PL = window.PL || {});
  let W;
  const ui = () => W || (W = Object.assign({}, PL.ui, {
    paginate: (arr, page, per) => { const pages = Math.max(1, Math.ceil(arr.length / per)), p = Math.min(Math.max(1, page || 1), pages); return { items: arr.slice((p - 1) * per, p * per), page: p }; },
    progress: (used, limit, label) => `<div class="small row between"><span>${PL.esc(label)}</span><b>${used} / ${limit >= 999 ? '∞' : limit}</b></div>${PL.ui.progress(limit ? (used / limit) * 100 : 0, used >= limit ? 'danger' : '')}`
  }));
  const db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt, me = () => PL.auth.user();
  const R = { layout: 'employer', roles: ['recruiter'] };
  const reg = (p, h, title) => PL.router.add(p, h, Object.assign({ title }, R));
  const company = u => PL.q.companyOf(u);
  const PH = () => PL.onboardingOnly();
  const localDT = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  const pubFmt = v => v ? new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  // demo stand-in for a server scheduler: go live when the publish time has passed
  function releaseScheduled() {
    const now = new Date(); const today = now.toISOString().slice(0, 10); let n = 0;
    db().jobs.forEach(j => {
      if (j.status === 'Scheduled' && j.scheduleMinDate && j.scheduleMinDate <= today) { j.status = 'Published'; j.publishedAt = j.scheduleMinDate; n++; }
      if (j.status === 'Published' && j.scheduleMaxDate && j.scheduleMaxDate < today) { j.status = 'Closed'; n++; }
    });
    if (n) PL.store.save();
  }
  PL.releaseScheduledJobs = releaseScheduled;

  /* ---------- dashboard ---------- */
  reg('/employer/dashboard', (ctx, u) => {
    releaseScheduled();
    const co = company(u), jobs = PL.q.myJobs(u.id), apps = PL.q.myApps(u.id), us = PL.q.usage(u.id);
    const by = s => apps.filter(a => a.status === s).length, pend = jobs.filter(j => j.status === 'Pending Approval').length;
    const upcoming = apps.filter(a => a.interview && a.interview.status !== 'Cancelled' && a.interview.date >= F().today()).sort((a, b) => a.interview.date.localeCompare(b.interview.date)).slice(0, 4);
    const recent = apps.slice().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 5);
    const banners = [];
    if (co && co.verification !== 'Verified') banners.push(ui().notice(`Company verification is <b>${E(co.verification)}</b>. Some features may be limited until an admin verifies it.`, 'warn'));
    if (PH() && co && co.verification === 'Verified') banners.push(ui().notice(`${I('check', 14)} <b>${E(co.name)}</b> is verified. You can post jobs now or schedule them for later.`, 'ok'));
    const sched = jobs.filter(j => j.status === 'Scheduled').sort((a, b) => a.publishAt.localeCompare(b.publishAt));
    if (pend && !PH()) banners.push(ui().notice(`${pend} job${pend > 1 ? 's are' : ' is'} awaiting admin approval.`, ''));
    if (us.sub && us.sub.status !== 'Active') banners.push(ui().notice('Your subscription has expired. Renew to keep publishing jobs.', 'err'));
    return `${ui().pageHead('Employer dashboard', `<a class="btn" href="#/employer/jobs/new">${I('plus', 16)} Post a job</a>`, co ? co.name : '')}${banners.join('')}
      <div class="grid g4 mb">${ui().kpi('Active jobs', jobs.filter(j => j.status === 'Published').length, PH() ? sched.length + ' scheduled' : us.jobs + ' / ' + us.plan.limits.jobs + ' plan slots', 'briefcase', '', '/employer/jobs')}${ui().kpi('Applications', apps.length, by('Applied') + ' new', 'file', 'teal', '/employer/applicants')}${ui().kpi('Shortlisted', by('Shortlisted'), 'In interview ' + by('Interview Scheduled'), 'user', 'amber', '/employer/applicants')}${ui().kpi('Job views', jobs.reduce((s, j) => s + j.views, 0), 'Across all jobs', 'eye', '')}</div>
      <div class="grid g2"><div class="card pad"><div class="card-head"><h3>Recent applicants</h3><a href="#/employer/applicants">View all</a></div>${recent.map(a => { const c = PL.q.user(a.candidateId), j = PL.q.job(a.jobId); return `<div class="person-row">${ui().avatar(c, 38)}<div class="grow"><a class="bold small" href="#/employer/applicants/${a.id}">${E(c.name)}</a><div class="xs muted">${E(j.title)} · ${F().ago(a.appliedAt)}</div></div>${ui().badge(a.status)}</div>`; }).join('') || '<p class="muted small">No applications yet.</p>'}</div>
      <div class="card pad"><div class="card-head"><h3>Upcoming interviews</h3><a href="#/employer/interviews">Calendar</a></div>${upcoming.map(a => `<div class="person-row"><div class="grow"><a class="bold small" href="#/employer/applicants/${a.id}">${E(PL.q.user(a.candidateId).name)}</a><div class="xs muted">${E(PL.q.job(a.jobId).title)}</div></div><span class="small">${F().date(a.interview.date)} ${E(a.interview.time)}</span></div>`).join('') || '<p class="muted small">None scheduled.</p>'}</div></div>
      ${sched.length ? `<div class="card pad mt"><div class="card-head"><h3>Scheduled jobs</h3><a href="#/employer/jobs">Manage</a></div>${sched.slice(0, 4).map(j => `<div class="person-row"><div class="grow"><a class="bold small" href="#/employer/jobs/${j.id}/edit">${E(j.title)}</a><div class="xs muted">${E(j.location)}</div></div><span class="small">${I('calendar', 14)} Goes live ${pubFmt(j.publishAt)}</span></div>`).join('')}</div>` : ''}
      ${PH() ? '' : `<div class="card pad mt"><h3>Plan usage — ${E(us.plan.name)}</h3><div class="grid g3"><div>${ui().progress(us.jobs, us.plan.limits.jobs, 'Active jobs')}</div><div>${ui().progress(us.featured, us.plan.limits.featured, 'Featured jobs')}</div><div>${ui().progress(us.resumes, us.plan.limits.resumes, 'Contact unlocks')}</div></div></div>`}`;
  }, 'Employer dashboard');

  /* ---------- company ---------- */
  reg('/employer/company', (ctx, u) => {
    const c = company(u); if (!c) return ui().empty('building', 'No company', 'Your account is not linked to a company.');
    const f = (n, l, x) => ui().field(Object.assign({ name: n, label: l, value: c[n] || '' }, x || {}));
    return `${ui().pageHead('Company profile', `<a class="btn btn-secondary" href="#/companies/${c.id}">View public page</a>`)}${ui().notice('Verification status: <b>' + E(c.verification) + '</b>', c.verification === 'Verified' ? 'ok' : 'warn')}
      <div class="card pad-lg">${ui().stepForm({ attrs: 'data-form="company"', free: true, submit: 'Save changes', steps: [
        { title: 'Basics', html: f('name', 'Company name', { required: true }) + f('industry', 'Industry', { type: 'select', options: PL.INDUSTRIES }) + f('size', 'Company size', { type: 'select', options: PL.SIZES }) + f('hq', 'Headquarters') + f('website', 'Website', { type: 'url' }) + f('locations', 'Locations') },
        { title: 'About & culture', html: f('specializations', 'Specializations', { full: true }) + f('description', 'About', { type: 'textarea', rows: 4, full: true, required: true }) + f('culture', 'Culture', { type: 'textarea', rows: 3, full: true }) + f('benefits', 'Benefits', { type: 'textarea', rows: 3, full: true }) },
        { title: 'Branding', html: `<div class="field full"><label>Logo</label><div class="row">${ui().logo(c, 48)}<button type="button" class="btn btn-secondary btn-sm" data-action="co-logo">Upload logo</button></div></div>` }] })}</div>`;
  }, 'Company profile');
  PL.form('company', f => {
    if (!ui().validate(f)) return; const c = company(me()), d = ui().formData(f);
    Object.assign(c, d); PL.store.save(); ui().toast('Company profile saved'); PL.rerender();
  });
  PL.act('co-logo', () => ui().pickImage(img => { company(me()).logoImg = img; PL.store.save(); PL.rerender(); }));

  /* ---------- manage jobs ---------- */
  reg('/employer/jobs', (ctx, u) => {
    releaseScheduled(); const v = PL.vf('ejobs', { tab: 'All', page: 1 }), all = PL.q.myJobs(u.id);
    const tabs = ['All', 'Published', 'Scheduled', 'Pending Approval', 'Draft', 'Paused', 'Closed', 'Rejected', 'Expired'];
    const list = all.filter(j => v.tab === 'All' || j.status === v.tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Manage jobs', `<a class="btn" href="#/employer/jobs/new">${I('plus', 16)} Post a job</a>`)}${ui().tabs(tabs, v.tab, 'ejobs')}
      ${ui().table({ cols: [{ label: 'Job', render: j => `<a class="bold" href="#/employer/jobs/${j.id}/edit">${E(j.title)}</a><div class="xs muted">${E(j.location)} · ${E(j.type)}</div>` }, { label: 'Status', render: j => ui().badge(j.status) + (j.status === 'Scheduled' ? `<div class="xs muted">${pubFmt(j.publishAt)}</div>` : '') + (j.status === 'Rejected' && j.rejectionReason ? `<div class="xs muted">${E(j.rejectionReason)}</div>` : '') }, { label: 'Applicants', render: j => `<a href="#/employer/applicants?job=${j.id}">${PL.q.myApps(u.id).filter(a => a.jobId === j.id).length}</a>` }, { label: 'Views', render: j => j.views }, { label: 'Closes', render: j => F().date(j.closingDate) },
        { label: '', render: j => ui().menu([{ label: 'Edit', href: '/employer/jobs/' + j.id + '/edit', icon: 'edit' }, ...(PH() ? [] : [{ label: 'Preview', href: '/jobs/' + j.id, icon: 'eye' }]), { label: 'Duplicate', action: 'job-dup', data: { id: j.id }, icon: 'copy' }].concat(j.status === 'Published' ? [{ label: 'Pause', action: 'job-status', data: { id: j.id, s: 'Paused' }, icon: 'pause' }] : []).concat(['Paused', 'Draft', 'Scheduled'].includes(j.status) ? [{ label: j.status === 'Paused' ? 'Resume' : 'Publish now', action: 'job-status', data: { id: j.id, s: 'Published' }, icon: 'play' }] : []).concat(['Published', 'Paused'].includes(j.status) ? [{ label: 'Close job', action: 'job-status', data: { id: j.id, s: 'Closed' }, icon: 'x' }] : []).concat([{ label: 'Delete', action: 'job-del', data: { id: j.id }, icon: 'trash', danger: true }]), { label: 'Job actions', align: 'right' }) }], rows: pg.items, empty: 'No jobs in this status.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'ejobs' })}`;
  }, 'Manage jobs');

  function publishCheck(u, j) {
    const us = PL.q.usage(u.id), co = company(u);
    if (u.role === 'admin') return '';
    if (PH()) return '';
    if (us.sub && us.sub.status !== 'Active') return 'Your subscription is not active. Renew it to publish jobs.';
    if (j.status !== 'Published' && j.status !== 'Pending Approval' && us.jobs >= us.plan.limits.jobs) return `Your ${us.plan.name} plan allows ${us.plan.limits.jobs} active job(s). Upgrade to post more.`;
    if (j.featured && us.featured >= us.plan.limits.featured && !j.wasFeatured) return 'Featured job limit reached for your plan.';
    if (co && co.verification === 'Rejected') return 'Your company verification was rejected.';
    return '';
  }
  function submitJob(u, j) {
    const err = publishCheck(u, j); if (err) { ui().toast(err, 'err'); return false; }
    j.status = db().settings.moderation && !PH() && u.role !== 'admin' ? 'Pending Approval' : 'Published';
    if (j.status === 'Pending Approval') db().users.filter(x => x.role === 'admin').forEach(a => PL.notify(a.id, 'moderation', 'Job awaiting approval', j.title + ' was submitted.', '/admin/jobs'));
    return true;
  }
  PL.act('job-status', d => {
    const u = me(), j = PL.q.job(d.id); if (d.s === 'Published' && j.status !== 'Paused') { if (!submitJob(u, j)) return; } else if (d.s === 'Published') j.status = 'Published'; else j.status = d.s;
    PL.store.save(); ui().toast('Job status: ' + j.status); PL.rerender();
  });
  PL.act('job-dup', d => { const j = JSON.parse(JSON.stringify(PL.q.job(d.id))); j.id = PL.store.id('j'); j.title += ' (Copy)'; j.status = 'Draft'; j.views = 0; j.featured = false; j.createdAt = F().iso(); db().jobs.unshift(j); PL.store.save(); ui().toast('Duplicated as draft'); PL.rerender(); });
  PL.act('job-del', async d => { if (!(await ui().confirm({ title: 'Delete this job?', message: 'Applications for it will remain on record.', confirmText: 'Delete', danger: true }))) return; db().jobs = db().jobs.filter(j => j.id !== d.id); PL.store.save(); ui().toast('Job deleted'); PL.rerender(); });

  /* ---------- four-step job-posting flow ---------- */
  const JOB_STEPS = ['Job Details', 'Job Description', 'Contact Details', 'Preview & Publish'];
  const lines = t => (t || '').split('\n').map(s => s.trim()).filter(Boolean);
  const defaultJob = () => ({ title: '', department: '', designation: '', divisionName: '', segment: '', specialization: '', type: 'Full-time', workMode: 'On-site', vacancies: 1, city: '', state: '', pinCode: '', qualification: PL.QUALS[0], expMin: 0, expMax: 3, salMin: '', salMax: '', skills: [], responsibilities: [], benefits: [], preferred: '', incentives: '', travel: '', description: '', descriptionAI: false, questions: [], closingDate: '', banner: '', contactName: '', contactEmail: '', contactPhone: '', alternateContactName: '', alternateContactPhone: '', alternateContactPhone2: '', alternateContactEmail: '', contactVisibility: { email: false, phone: false, toggle: false }, alternateContacts: [], freeApply: false, scheduleEnabled: false, scheduleAttachment: '', scheduleMinDate: '', scheduleMaxDate: '', publishAt: '', featured: false, paidJob: false, paidAmount: 0, externalApplyUrl: '' });
  const descriptionInputs = d => JSON.stringify([d.title, d.department, d.specialization, d.city, d.state, d.type, d.workMode, d.qualification, d.expMin, d.expMax, d.salMin, d.salMax, d.skills]);
  function collectJobForm(form) {
    const w = PL.state.jw, d = w && w.d;
    if (!d || !form) return;
    const before = descriptionInputs(d), x = ui().formData(form);
    if (x.contactVisibilityToggle !== undefined) d.contactVisibility.toggle = !!x.contactVisibilityToggle;
    if (x.segment !== undefined) d.specialization = d.segment = x.segment;
    Object.keys(x).forEach(k => { if (!['contactEmailVisible', 'contactPhoneVisible'].includes(k)) d[k] = x[k]; });
    if (x.skills !== undefined) d.skills = String(x.skills).split(',').map(v => v.trim()).filter(Boolean);
    if (x.contactEmailVisible !== undefined || x.contactPhoneVisible !== undefined) d.contactVisibility = { email: !!x.contactEmailVisible, phone: !!x.contactPhoneVisible };
    d.location = d.city && d.state ? d.city + ', ' + d.state : '';
    d.locations = d.location ? [d.location] : [];
    if (before !== descriptionInputs(d) && d.descriptionAI) {
      d.description = ''; d.descriptionAI = false; w.descriptionStatus = 'idle'; w.descriptionFingerprint = '';
      w.completed = w.completed.map((done, i) => i < 1 ? done : false);
    }
    return x;
  }
  function ready(w, step) {
    const d = w.d;
    if (step === 0) return +d.expMax >= +d.expMin && (!d.salMax || +d.salMax >= +d.salMin);
    if (step === 1) return !!(d.descriptionAI && d.description.trim().length >= 30 && w.descriptionFingerprint === descriptionInputs(d));
    if (step === 2) return !d.contactVisibility.toggle || !!(d.contactName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.contactEmail) && /^[+\d][\d\s-]{8,15}$/.test(d.contactPhone));
    return ready(w, 0) && ready(w, 1) && ready(w, 2);
  }
  function suggestedTitle(d) {
    const role = d.specialization ? `${d.department} – ${d.specialization.trim()}` : d.department;
    return role + (d.city ? ' – ' + d.city.trim() : '');
  }
  async function generateTitle(w) {
    const token = w.titleToken = (w.titleToken || 0) + 1;
    w.titleStatus = 'loading'; updateTitleStatus(w);
    await new Promise(resolve => setTimeout(resolve, 450));
    if (PL.state.jw !== w || token !== w.titleToken || w.titleEdited) return;
    try {
      if (!w.d.department || !w.d.city.trim()) throw new Error('Choose a job category and location first.');
      w.d.title = suggestedTitle(w.d); w.titleStatus = 'ready';
    } catch (error) {
      w.titleStatus = 'error'; w.titleError = error.message;
    }
    const form = document.querySelector('form[data-form="job-step"]');
    if (form && form.elements.title && w.titleStatus === 'ready') form.elements.title.value = w.d.title;
    updateTitleStatus(w);
  }
  async function generateDescription(w) {
    await new Promise(resolve => setTimeout(resolve, 850));
    const d = w.d, duties = PL.deptText(d.department).r;
    const experience = +d.expMin === +d.expMax ? `${d.expMin} years` : `${d.expMin}–${d.expMax} years`;
    const pay = d.salMin ? `The indicated compensation is ₹${d.salMin}–${d.salMax || d.salMin} LPA.` : 'Compensation will be discussed based on experience and role fit.';
    const title = d.title.trim() || d.department || 'Open role';
    const location = [d.city, d.state].filter(Boolean).join(', ') || 'a location to be confirmed';
    const skills = (d.skills || []).join(', ') || 'role-relevant skills';
    const closingDate = d.closingDate ? F().date(d.closingDate) : 'a date to be confirmed';
    return [
      `${title}${d.specialization ? ` (${d.specialization})` : ''}. This ${d.type.toLowerCase()} role is based in ${location} (${d.workMode.toLowerCase()}). The successful candidate will contribute to the team’s objectives while following applicable pharmaceutical quality, safety, and compliance practices.`,
      `Key responsibilities:\n${duties.map(item => `• ${item}`).join('\n')}`,
      `Candidate profile: ${d.qualification || 'a relevant qualification'} or equivalent, with ${experience} of relevant experience. Helpful skills include ${skills}. ${pay}`,
      `This position has ${d.vacancies || 1} opening${+d.vacancies === 1 ? '' : 's'} and is open for applications until ${closingDate}.`
    ].join('\n\n');
  }
  function setNextButton(form) {
    const w = PL.state.jw, button = form && form.querySelector('[type=submit]');
    if (button && w) button.disabled = !ready(w, w.step) || (w.step === 0 && w.titleStatus === 'loading') || (w.step === 1 && w.descriptionStatus === 'loading');
  }
  function titleStatus(w) {
    if (w.titleStatus === 'loading') return `<span class="jb-ai-status" role="status">${I('zap', 16)} Generating suggested title…</span>`;
    if (w.titleStatus === 'error') return `<p class="err jb-ai-error" role="alert">${E(w.titleError || 'Title generation failed.')}</p><button class="btn btn-secondary btn-sm" type="button" data-action="job-title-retry">Retry title suggestion</button>`;
    return `<span class="jb-ai-status">${w.titleStatus === 'ready' ? 'Demo AI title suggestion · editable' : 'AI title suggestion · demo'}</span><button class="btn btn-secondary btn-sm" type="button" data-action="job-title-retry">${w.titleStatus === 'ready' ? 'Regenerate title' : 'Generate suggested title'}</button>`;
  }
  function updateTitleStatus(w) {
    const tools = document.querySelector('.jb-title-tools');
    if (tools) tools.innerHTML = titleStatus(w);
    const form = document.querySelector('form[data-form="job-step"]');
    if (form) setNextButton(form);
  }
  function preview(d, u) {
    const c = d.companyId ? PL.q.company(d.companyId) : null, companyName = c ? c.name : d.companyName;
    const contact = [d.contactVisibility.email ? E(d.contactEmail) : '', d.contactVisibility.phone ? E(d.contactPhone) : ''].filter(Boolean);
    return `<section class="jb-post-preview"><div class="jb-post-company">${c ? ui().logo(c, 48) : ''}<div><h2>${E(d.title)}</h2><b>${E(companyName || '')}</b></div></div>
      <p class="muted">${E(d.department)}${d.specialization ? ` · ${E(d.specialization)}` : ''} · ${E(d.city)}, ${E(d.state)} · ${E(d.type)} · ${E(d.workMode)}</p>
      <div class="jb-post-preview-description">${E(d.description)}</div>
      <h3>Candidate contact</h3>${contact.length ? `<p>${contact.join(' · ')}</p>` : '<p class="muted">No contact details will be shown; candidates apply through PharmaLinkIn.</p>'}
      <p class="small"><b>Apply button:</b> PharmaLinkIn application form (default)</p></section>`;
  }
  function postingCompany(u, d) {
    const own = company(u);
    if (own) return own;
    const name = (d.companyName || '').trim();
    const c = { id: PL.store.id('c'), name, industry: 'Pharmaceuticals', size: '1-10', hq: d.location, locations: [d.city], verification: 'Pending', description: `${name} job posting profile.`, website: '', specializations: [], culture: '', benefits: [], social: { linkedin: '', twitter: '' }, logoImg: '', coverImg: '', createdAt: F().iso(), recruiterIds: [u.id] };
    db().companies.push(c);
    return c;
  }
  function jobWizard(ctx, u) {
    const editId = ctx.params.id;
    let w = PL.state.jw;
    if (!w || w.editId !== editId || ctx.fresh) {
      const j = editId ? PL.q.job(editId) : null;
      if (editId && (!j || (u.role !== 'admin' && j.recruiterId !== u.id && (!company(u) || j.companyId !== company(u).id)))) return ui().empty('briefcase', 'Job not found', 'This job does not exist or is not yours.', '<a class="btn" href="#/employer/jobs">Back</a>');
      const d = j ? Object.assign(defaultJob(), JSON.parse(JSON.stringify(j))) : defaultJob();
      const own = company(u); if (own) { d.companyId = own.id; d.companyName = own.name; }
      d.contactName = d.contactName || u.name; d.contactEmail = d.contactEmail || u.email; d.contactPhone = d.contactPhone || u.phone || '';
      d.contactVisibility = d.contactVisibility || { email: false, phone: false };
      w = PL.state.jw = { editId, step: 0, completed: [false, false, false, false], d, titleEdited: !!j, titleStatus: j ? 'ready' : 'idle', descriptionStatus: j && j.descriptionAI ? 'ready' : 'idle', descriptionFingerprint: j && j.descriptionAI ? descriptionInputs(d) : '', titleError: '' };
    }
    const d = w.d, s = w.step, f = (n, l, x) => ui().field(Object.assign({ name: n, label: l, value: d[n] == null ? '' : d[n] }, x || {}));
    const status = titleStatus(w);
    let body;
    if (s === 0) body = `<div class="jb-client-step1">
      ${!d.companyId ? f('companyName', 'Company', { help: 'The company profile will be marked pending verification in this prototype.' }) : `<div class="field"><label>Company</label><div class="jb-company-value">${ui().logo(PL.q.company(d.companyId), 38)}<b>${E(PL.q.company(d.companyId).name)}</b></div></div>`}
      ${f('title', 'Job title')}<div class="field jb-title-tools">${status}</div>
      ${f('designation', 'Job designation')}
      ${f('type', 'Employment type', { type: 'select', options: PL.JOB_TYPES })}
      ${f('department', 'Job category', { type: 'select', options: PL.CATEGORIES, placeholder: '' })}
      ${f('divisionName', 'Division name')}
      ${f('segment', 'Segment', { value: d.segment || d.specialization })}
      ${f('city', 'Job location / HQ')}
      ${f('state', 'State')}
      ${f('pinCode', 'PIN code', { type: 'text' })}
      ${f('salMin', 'CTC / minimum salary (₹ LPA)', { type: 'number', min: 0 })}
      ${f('salMax', 'CTC / maximum salary (₹ LPA)', { type: 'number', min: 0 })}
      ${f('workMode', 'Work mode', { type: 'select', options: PL.WORK_MODES })}
      ${f('qualification', 'Minimum qualification', { type: 'select', options: PL.QUALS })}
      ${f('expMin', 'Minimum experience (years)', { type: 'number', min: 0 })}
      ${f('expMax', 'Maximum experience (years)', { type: 'number', min: 0 })}
      ${f('skills', 'Key skills (comma separated)', { value: (d.skills || []).join(', '), full: true })}
      ${f('vacancies', 'Number of openings', { type: 'number', min: 1 })}
      ${f('closingDate', 'Application closing date', { type: 'date' })}
      </div><button class="btn jb-ai-generate jb-step1-ai" type="button" data-action="job-description-generate" ${w.descriptionStatus === 'loading' ? 'disabled' : ''}>${I('zap', 18)} Write Job Description with AI</button>`;
    if (s === 1) body = `<div class="jb-description-step">
      <section class="jb-banner-field"><div class="jb-banner-head"><label>Job banner <span class="muted">(Optional)</span></label><button class="btn btn-outline-primary btn-sm" type="button" data-action="job-banner">${d.banner ? 'Change File' : 'Choose File'}</button></div><div class="jb-banner-preview">${d.banner ? `<img src="${E(d.banner)}" alt="Job banner preview">` : `<div class="jb-banner-logo"><b>Pharma</b><b>LinkIn</b><small>Connect · Hire · Grow</small></div><div class="jb-banner-art">${I('briefcase', 42)}</div>`}</div></section>
      ${f('title', 'Job title')}
      <button class="btn jb-ai-generate" type="button" data-action="job-description-generate" ${w.descriptionStatus === 'loading' ? 'disabled' : ''}>${I('zap', 18)} ${w.descriptionStatus === 'ready' ? 'Regenerate with AI' : w.descriptionStatus === 'error' ? 'Retry AI generation' : 'Generate Job Description with AI'}</button>
      ${w.descriptionStatus === 'loading' ? `<p class="jb-ai-status" role="status">${I('zap', 16)} Generating job description…</p>` : ''}
      ${w.descriptionStatus === 'error' ? `<p class="err jb-ai-error" role="alert">${E(w.descriptionError || 'AI generation failed. Please retry.')}</p>` : ''}
      ${d.descriptionAI ? (u.role === 'admin'
        ? `<div class="jb-ai-output jb-ai-output-editor" aria-label="AI-generated job description"><div class="jb-ai-toolbar">${I('bold', 18)} ${I('italic', 18)} ${I('list', 18)} ${I('link', 18)}</div><textarea class="jb-admin-description" name="description" maxlength="2000" rows="10" aria-label="Edit AI-generated job description">${E(d.description)}</textarea><div class="jb-ai-count">${d.description.length} / 2000</div></div><p class="xs muted">Generated with demo AI. As an Admin, you can edit and save the final description.</p>`
        : `<div class="jb-ai-output jb-ai-output-editor" aria-label="AI-generated job description" aria-readonly="true"><div class="jb-ai-toolbar">${I('bold', 18)} ${I('italic', 18)} ${I('list', 18)} ${I('link', 18)}</div><div class="jb-ai-output-text">${E(d.description)}</div><div class="jb-ai-count">${d.description.length} / 2000</div></div><p class="xs muted">Generated with demo AI. Editing is disabled.</p>`) : ''}</div>`;
    if (s === 2) body = `<div class="jb-contact-step">
      <div class="jb-contact-toggle"><div>${I('users', 26)}<div><b>Contact to Show</b><small>Toggle to show or hide contact details in this job post.</small></div></div><label class="jb-switch"><input type="checkbox" name="contactVisibilityToggle" ${d.contactVisibility.toggle ? 'checked' : ''}><span></span></label></div>
      <h3>Contact Details</h3>
      <div class="jb-contact-card"><span class="jb-contact-badge">Primary Contact</span><div class="jb-contact-grid">
        ${f('contactName', 'Contact person')}
        ${f('contactPhone', 'Mobile number', { type: 'tel' })}
        ${f('alternateContactPhone', 'Alternative number (Optional)', { type: 'tel' })}
        ${f('contactEmail', 'Email address', { type: 'email' })}
      </div></div>
      <div class="jb-contact-card"><span class="jb-contact-badge alternate">Alternate Contact</span><div class="jb-contact-grid">
        ${f('alternateContactName', 'Contact person')}
        ${f('alternateContactPhone', 'Mobile number', { type: 'tel' })}
        ${f('alternateContactPhone2', 'Alternative number (Optional)', { type: 'tel' })}
        ${f('alternateContactEmail', 'Email address', { type: 'email' })}
      </div></div>
      <div class="jb-contact-options"><label class="check"><input type="checkbox" name="contactEmailVisible" ${d.contactVisibility.email ? 'checked' : ''}> Show email address</label><label class="check"><input type="checkbox" name="contactPhoneVisible" ${d.contactVisibility.phone ? 'checked' : ''}> Show phone number</label></div>
      </div>`;
    if (s === 3) {
      const err = publishCheck(u, d);
      const adminOnly = u.role === 'admin';
      body = `${err ? ui().notice(E(err), 'err') : ''}
        <div class="jb-verification-info">${I('shield', 26)}<div><b>Review &amp; Publish Your Job</b><small>Please verify the details before publishing your job.</small></div></div>
        <div class="jb-publish-option"><div class="jb-publish-option-head">${I('calendar', 26)}<div><b>Schedule a Job</b><small>Choose when to publish your job post.</small></div></div>
          ${adminOnly ? `<label class="jb-select-row"><input type="checkbox" name="scheduleEnabled" ${d.scheduleEnabled ? 'checked' : ''}> <span>Schedule for a date range</span></label><div class="jb-schedule-fields jb-schedule-range"><label><span>Min Date</span><input type="date" name="scheduleMinDate" value="${E(d.scheduleMinDate || '')}" aria-label="Min Date"></label><label><span>Max Date</span><input type="date" name="scheduleMaxDate" value="${E(d.scheduleMaxDate || '')}" min="${E(d.scheduleMinDate || '')}" aria-label="Max Date"></label></div>` : '<label class="jb-select-row"><input type="checkbox" checked disabled> <span>Publish Immediately</span></label>'}
        </div>
        ${adminOnly ? `<section class="jb-upload-option"><div class="jb-publish-option-head">${I('paperclip', 26)}<div><b>Attach File <span class="muted">(Optional)</span></b><small>Upload a JPEG or PDF job poster / company brochure.</small></div></div><div class="jb-dropzone"><input type="url" name="scheduleAttachment" value="${E(d.scheduleAttachment || '')}" placeholder="https://example.com/brochure.pdf" aria-label="Attachment URL"></div></section>` : ''}
        <section class="jb-link-option"><div class="jb-publish-option-head">${I('link', 26)}<div><b>Customise Job Link <span class="muted">(Optional)</span></b><small>Create a custom URL or external application link.</small></div></div><div class="jb-link-field"><input type="url" name="externalApplyUrl" value="${E(d.externalApplyUrl || '')}" placeholder="https://example.com/apply"><span>${I('external', 18)}</span></div></section>
        ${adminOnly ? `<section class="jb-feature-card"><div class="jb-feature-head">${I('star', 26)}<div><b>Feature This Job <span class="jb-premium">Premium</span></b><small>Get more visibility with a featured listing.</small></div></div><label class="jb-feature-toggle"><span>Enable Featured Job</span><input type="checkbox" name="featured" ${d.featured ? 'checked' : ''}></label></section>
        <section class="jb-feature-card"><div class="jb-feature-head">${I('users', 26)}<div><b>Free Vacancy to Apply</b><small>Allow candidates to apply through PharmaLinkIn without a subscription.</small></div></div><label class="jb-feature-toggle"><span>Enable Free Apply</span><input type="checkbox" name="freeApply" ${d.freeApply ? 'checked' : ''}></label></section>` : ''}
        ${preview(d, u)}
        ${db().settings.moderation && u.role !== 'admin' ? ui().notice('Your job will be reviewed by our team before going live on PharmaLinkIn.', '') : ''}`;
    }
    const stepper = PL.onb.stepper(JOB_STEPS, s, true);
    const heading = s === 0 ? '<h2>Job details</h2><p class="muted">Start with the role information. A suggested title will be generated from these details.</p>' : s === 1 ? '<h2>AI-generated job description</h2><p class="muted">A successful AI generation is required to continue.</p>' : s === 2 ? '<h2>Contact details</h2><p class="muted">Choose which contact details candidates can see.</p>' : '<h2>Preview your job</h2><p class="muted">Review how candidates will see this job before publishing.</p>';
    const primary = s === 3 ? 'Publish job' : s === 0 && w.titleStatus === 'loading' ? 'Generating title…' : 'Next';
    return `<div class="onb2 jb-job-posting"><div class="onb2-card wide jb-job-post-card">${stepper}<div class="onb2-body">${heading}<form class="jb-job-form" data-form="job-step" novalidate>${body}<div class="row between mt jb-job-actions">${s ? `<div class="row"><button type="button" class="btn btn-secondary" data-action="job-back">← Back</button>${s === 3 ? '<button type="button" class="btn btn-secondary" data-action="job-goto" data-i="0">Edit</button>' : ''}</div>` : '<span></span>'}<button class="btn" type="submit" ${!ready(w, s) || w.titleStatus === 'loading' || w.descriptionStatus === 'loading' ? 'disabled' : ''}>${primary}</button></div></form></div></div></div>`;
  }
  reg('/employer/jobs/new', jobWizard, 'Post a job');
  PL.router.add('/job-post', jobWizard, { layout: 'jobs', roles: ['candidate', 'recruiter', 'advertiser', 'admin'], title: 'Post a job' });
  reg('/employer/jobs/:id/edit', jobWizard, 'Edit job');
  PL.form('job-step', form => {
    const w = PL.state.jw, u = me();
    if (!w || !u) return;
    collectJobForm(form);
    if (w.step === 0) {
      if (!ui().validate(form)) return;
      if (+w.d.expMax < +w.d.expMin) return ui().setError(form, 'expMax', 'Maximum experience must be at least minimum experience.');
      if (w.d.salMax && +w.d.salMax < +w.d.salMin) return ui().setError(form, 'salMax', 'Maximum salary must be at least minimum salary.');
      if (w.d.closingDate && new Date(w.d.closingDate) < new Date(F().today())) return ui().setError(form, 'closingDate', 'Choose today or a future date.');
    }
    if (w.step === 1 && !ready(w, 1)) { ui().toast('Generate the job description with AI before continuing.', 'err'); return; }
    if (w.step === 2 && !ui().validate(form)) return;
    if (w.step === 3 && u.role === 'admin' && w.d.scheduleEnabled) {
      if (!w.d.scheduleMinDate || !w.d.scheduleMaxDate) { ui().toast('Choose both Min Date and Max Date.', 'err'); return; }
      if (new Date(w.d.scheduleMaxDate) < new Date(w.d.scheduleMinDate)) { ui().toast('Max Date cannot be earlier than Min Date.', 'err'); return; }
    }
    if (!ready(w, w.step)) return;
    w.completed[w.step] = true;
    if (w.step < 3) { w.step++; PL.rerender(); window.scrollTo(0, 0); return; }
    if (!JOB_STEPS.every((_, i) => i === 3 || w.completed[i]) || !ready(w, 3) || !w.d.descriptionAI) { ui().toast('Complete all steps and generate the job description with AI before publishing.', 'err'); return; }
    const j = persistJob(u, 'submit');
    if (!j) return;
    PL.state.jw = null;
    ui().toast(j.status === 'Pending Approval' ? 'Submitted for admin approval' : 'Job published');
    PL.go(u.role === 'recruiter' ? '/employer/jobs' : '/job-results?browse=1');
  });
  function persistJob(u, status) {
    const w = PL.state.jw, d = w.d, c = d.companyId ? PL.q.company(d.companyId) : postingCompany(u, d);
    if (!c) { ui().toast('Select a valid company before publishing.', 'err'); return null; }
    d.companyId = c.id; d.recruiterId = u.id; d.authorRole = u.role;
    d.vacancies = +d.vacancies || 1; d.expMin = +d.expMin || 0; d.expMax = +d.expMax || 0; d.salMin = +d.salMin || 0; d.salMax = +d.salMax || 0;
    d.location = d.city + ', ' + d.state; d.locations = [d.location]; d.aiGeneratedDescription = !!d.descriptionAI;
    let j = w.editId ? PL.q.job(w.editId) : null;
    if (!j) { j = Object.assign({}, d, { id: PL.store.id('j'), views: 0, createdAt: F().iso(), status: 'Draft' }); db().jobs.unshift(j); w.editId = j.id; }
    else Object.assign(j, d);
    if (status === 'submit') {
      j.wasFeatured = false;
      if (!submitJob(u, j)) { PL.store.save(); return null; }
      if (u.role === 'admin' && d.scheduleEnabled && d.scheduleMinDate && d.scheduleMaxDate) {
        j.scheduleMinDate = d.scheduleMinDate;
        j.scheduleMaxDate = d.scheduleMaxDate;
        j.publishAt = d.scheduleMinDate;
        j.status = d.scheduleMinDate <= new Date().toISOString().slice(0, 10) ? 'Published' : 'Scheduled';
      }
    }
    PL.store.save(); return j;
  }
  PL.act('job-back', () => {
    const form = document.querySelector('form[data-form="job-step"]'), w = PL.state.jw;
    if (!w || !form || !w.step) return;
    collectJobForm(form); w.step--; PL.rerender();
  });
  PL.act('job-banner', () => ui().pickImage(img => {
    const w = PL.state.jw;
    if (!w) return;
    w.d.banner = img;
    PL.rerender();
  }));
  PL.act('job-goto', d => {
    const w = PL.state.jw, form = document.querySelector('form[data-form="job-step"]'), target = +d.i;
    if (!w || target < 0 || target >= w.step || !w.completed[target]) return;
    if (form) collectJobForm(form);
    w.step = target; PL.rerender();
  });
  PL.act('job-title-retry', () => {
    const w = PL.state.jw, form = document.querySelector('form[data-form="job-step"]');
    if (!w) return;
    if (form) collectJobForm(form);
    w.titleEdited = false; generateTitle(w);
  });
  PL.act('job-description-generate', async () => {
    const w = PL.state.jw, form = document.querySelector('form[data-form="job-step"]');
    if (!w || w.descriptionStatus === 'loading') return;
    if (form) collectJobForm(form);
    const token = w.descriptionToken = (w.descriptionToken || 0) + 1;
    w.descriptionStatus = 'loading'; w.descriptionError = ''; PL.rerender();
    try {
      const description = await generateDescription(w);
      if (PL.state.jw !== w || token !== w.descriptionToken) return;
      w.d.description = description; w.d.responsibilities = PL.deptText(w.d.department).r.slice(); w.d.descriptionAI = true;
      w.descriptionFingerprint = descriptionInputs(w.d); w.descriptionStatus = 'ready';
    } catch (error) {
      if (PL.state.jw !== w || token !== w.descriptionToken) return;
      w.descriptionStatus = 'error'; w.descriptionError = error.message || 'AI generation failed. Please retry.';
    }
    PL.rerender();
  });
  function syncTitleInputs(form) {
    const w = PL.state.jw; if (!w || !form || w.step !== 0) return;
    const input = form.elements.title;
    if (input) { const current = input.value; if (current !== w.d.title) { w.d.title = current; w.titleEdited = true; w.titleToken = (w.titleToken || 0) + 1; w.titleStatus = current ? 'ready' : 'idle'; } }
  }
  document.addEventListener('input', e => {
    const form = e.target.closest && e.target.closest('form[data-form="job-step"]');
    if (!form) return;
    if (e.target.name === 'title' && PL.state.jw) { PL.state.jw.titleEdited = true; PL.state.jw.titleStatus = e.target.value ? 'ready' : 'idle'; PL.state.jw.titleToken = (PL.state.jw.titleToken || 0) + 1; }
    collectJobForm(form); syncTitleInputs(form); setNextButton(form);
  });
  document.addEventListener('change', e => {
    const form = e.target.closest && e.target.closest('form[data-form="job-step"]');
    if (!form) return;
    if (e.target.name === 'title' && PL.state.jw) { PL.state.jw.titleEdited = true; PL.state.jw.titleToken = (PL.state.jw.titleToken || 0) + 1; }
    collectJobForm(form); syncTitleInputs(form);
    if (PL.state.jw && PL.state.jw.step === 0 && ['department', 'specialization', 'city', 'state'].includes(e.target.name) && !PL.state.jw.titleEdited && PL.state.jw.d.department && PL.state.jw.d.city.trim()) generateTitle(PL.state.jw);
    setNextButton(form);
  });

  /* ---------- applicants ---------- */
  const APP_ST = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Offer', 'Hired', 'Rejected'];
  reg('/employer/applicants', (ctx, u) => {
    const v = PL.vf('eapps', { q: '', job: ctx.query.job || '', status: '', page: 1 }); if (ctx.fresh && ctx.query.job) v.job = ctx.query.job;
    const jobs = PL.q.myJobs(u.id);
    let list = PL.q.myApps(u.id).filter(a => (!v.job || a.jobId === v.job) && (!v.status || a.status === v.status) && (!v.q || PL.q.user(a.candidateId).name.toLowerCase().includes(v.q.toLowerCase()))).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    const pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Applicants', `<button class="btn btn-secondary" data-action="apps-export">${I('download', 16)} Export CSV</button>`)}
      <div class="card pad row mb">${ui().filterCtl('eapps', { name: 'q', type: 'search', label: 'Search name', placeholder: 'Search candidate' })}${ui().filterCtl('eapps', { name: 'job', type: 'select', label: 'Job', options: [{ v: '', l: 'All jobs' }].concat(jobs.map(j => ({ v: j.id, l: j.title }))) })}${ui().filterCtl('eapps', { name: 'status', type: 'select', label: 'Status', options: [{ v: '', l: 'All statuses' }].concat(APP_ST) })}</div>
      ${ui().table({ cols: [{ label: 'Candidate', render: a => { const c = PL.q.user(a.candidateId); return `<div class="row nowrap">${ui().avatar(c, 34)}<div><a class="bold" href="#/employer/applicants/${a.id}">${E(c.name)}</a><div class="xs muted">${E((c.profile || {}).title || '')}</div></div></div>`; } }, { label: 'Job', render: a => E(PL.q.job(a.jobId).title) }, { label: 'Applied', render: a => F().date(a.appliedAt) }, { label: 'Status', render: a => ui().badge(a.status) }], rows: pg.items, empty: 'No applicants match.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'eapps' })}`;
  }, 'Applicants');
  PL.act('apps-export', () => { const u = me(); ui().csv('applicants.csv', [['Ref', 'Candidate', 'Email', 'Job', 'Status', 'Applied']].concat(PL.q.myApps(u.id).map(a => { const c = PL.q.user(a.candidateId); return [a.ref, c.name, c.email, PL.q.job(a.jobId).title, a.status, a.appliedAt]; }))); });

  reg('/employer/applicants/:id', (ctx, u) => {
    const a = PL.q.app(ctx.params.id);
    if (!a || a.recruiterId !== u.id) return ui().empty('file', 'Application not found', 'It may belong to another recruiter.', '<a class="btn" href="#/employer/applicants">Back</a>');
    const c = PL.q.user(a.candidateId), j = PL.q.job(a.jobId), p = c.profile || {}, iv = a.interview;
    return `${ui().pageHead(c.name, `<a class="btn btn-secondary" href="#/app/profile/${c.id}">Full profile</a><a class="btn btn-secondary" href="#${PL.msgPath(c.id)}">${I('message', 16)} Message</a>`, E(j.title) + ' · ' + a.ref)}
      <div class="grid" style="grid-template-columns:minmax(0,1fr) 320px;gap:20px"><div class="stack">
      <div class="card pad-lg"><div class="row between"><div class="row nowrap">${ui().avatar(c, 56)}<div><b>${E(p.headline || '')}</b><div class="small muted">${E(c.location || '')} · ${p.experienceYears || 0} yrs · ${E(p.qualification || '')}</div></div></div>${ui().badge(a.status)}</div>
        <dl class="kv mt"><dt>Email</dt><dd>${E(c.email)}</dd><dt>Phone</dt><dd>${E(a.phone || c.phone || '—')}</dd><dt>Resume</dt><dd>${E(a.resumeName || '—')}</dd><dt>Skills</dt><dd>${(p.skills || []).map(s => `<span class="tag">${E(s)}</span>`).join(' ')}</dd></dl></div>
      ${a.coverLetter ? `<div class="card pad"><h3>Cover letter</h3><p style="white-space:pre-wrap">${E(a.coverLetter)}</p></div>` : ''}
      ${(a.answers || []).length ? `<div class="card pad"><h3>Screening answers</h3>${a.answers.map(x => `<p><b class="small">${E(x.q)}</b><br>${E(x.a)}</p>`).join('')}</div>` : ''}
      <div class="card pad"><h3>Timeline</h3><ul class="timeline">${(a.history || []).slice().reverse().map(h => `<li><b>${E(h.status)}</b> <span class="xs muted">${F().ago(h.at)}</span>${h.note ? `<div class="small muted">${E(h.note)}</div>` : ''}</li>`).join('')}</ul></div>
      <div class="card pad"><h3>Internal notes</h3>${(a.notes || []).map(n => `<div class="comment"><div class="bubble">${E(n.text)}<div class="xs muted">${F().ago(n.at)}</div></div></div>`).join('')}<form class="row nowrap mt-s" data-form="app-note" data-id="${a.id}" novalidate><label class="sr" for="note">Note</label><input id="note" name="text" class="grow" placeholder="Add a private note…" required><button class="btn btn-sm">Add</button></form></div></div>
      <aside class="stack"><div class="card pad"><h3>Update status</h3><form data-form="app-status" data-id="${a.id}" novalidate>${ui().field({ name: 'status', label: 'Status', type: 'select', options: APP_ST, value: a.status })}${ui().field({ name: 'note', label: 'Note (optional)', type: 'textarea', rows: 2 })}<button class="btn" style="width:100%">Update</button></form></div>
      <div class="card pad"><h3>Interview</h3>${iv ? `<dl class="kv" style="grid-template-columns:80px 1fr"><dt>When</dt><dd>${F().date(iv.date)} ${E(iv.time)}</dd><dt>Type</dt><dd>${E(iv.type)}</dd><dt>With</dt><dd>${E(iv.interviewer || '—')}</dd><dt>Status</dt><dd>${E(iv.status)}</dd></dl>` : '<p class="muted small">Not scheduled.</p>'}<div class="row mt-s"><button class="btn btn-secondary btn-sm" data-action="iv-schedule" data-id="${a.id}">${iv ? 'Reschedule' : 'Schedule'}</button>${iv && iv.status !== 'Cancelled' ? `<button class="btn btn-ghost btn-sm" data-action="iv-cancel" data-id="${a.id}">Cancel</button>` : ''}</div></div></aside></div>`;
  }, 'Applicant');
  PL.form('app-note', f => { const t = f.text.value.trim(); if (!t) return; PL.q.app(f.dataset.id).notes.push({ id: PL.store.id('nt'), by: me().id, text: t, at: F().iso() }); PL.store.save(); PL.rerender(); });
  function setStatus(a, st, note) {
    a.status = st; a.updatedAt = F().iso(); a.history.push({ status: st, at: F().iso(), note: note || '' });
    PL.notify(a.candidateId, 'application', 'Application update', `Your application for ${PL.q.job(a.jobId).title} is now "${st}".`, '/app/applications/' + a.id);
  }
  PL.form('app-status', f => { const a = PL.q.app(f.dataset.id), x = ui().formData(f); if (x.status !== a.status || x.note) setStatus(a, x.status, x.note); PL.store.save(); ui().toast('Status updated'); PL.rerender(); });
  PL.act('iv-schedule', async d => {
    const a = PL.q.app(d.id), iv = a.interview || {};
    const x = await ui().ask({ title: 'Schedule interview', confirmText: 'Save', grid: true, fields: [{ name: 'date', label: 'Date', type: 'date', required: true, value: iv.date || '' }, { name: 'time', label: 'Time', type: 'text', required: true, value: iv.time || '10:00', placeholder: '10:00' }, { name: 'type', label: 'Type', type: 'select', options: ['Video', 'Phone', 'In person'], value: iv.type || 'Video' }, { name: 'interviewer', label: 'Interviewer', value: iv.interviewer || '' }, { name: 'link', label: 'Link / location', full: true, value: iv.link || '' }] });
    if (!x) return;
    if (x.date < F().today()) return ui().toast('Pick a future date', 'err');
    a.interview = Object.assign({ notes: '' }, x, { status: 'Scheduled' }); setStatus(a, 'Interview Scheduled', `Interview on ${x.date} at ${x.time}`);
    PL.store.save(); ui().toast('Interview scheduled'); PL.rerender();
  });
  PL.act('iv-cancel', async d => { if (!(await ui().confirm({ title: 'Cancel interview?', message: 'The candidate will be notified.', confirmText: 'Cancel interview', danger: true }))) return; const a = PL.q.app(d.id); a.interview.status = 'Cancelled'; PL.notify(a.candidateId, 'application', 'Interview cancelled', 'Your interview for ' + PL.q.job(a.jobId).title + ' was cancelled.', '/app/applications/' + a.id); PL.store.save(); PL.rerender(); });

  /* ---------- candidate discovery ---------- */
  reg('/employer/candidates', (ctx, u) => {
    const v = PL.vf('cands', { q: '', loc: '', page: 1 }), us = PL.q.usage(u.id), unl = db().unlocked[u.id] = db().unlocked[u.id] || [], sv = db().savedCandidates[u.id] || [];
    let list = db().users.filter(x => x.role === 'candidate' && x.status === 'Active' && (x.profile.privacy || {}).visibility !== 'Private');
    if (v.q) list = list.filter(x => (x.name + ' ' + (x.profile.title || '') + ' ' + (x.profile.skills || []).join(' ')).toLowerCase().includes(v.q.toLowerCase()));
    if (v.loc) list = list.filter(x => (x.location || '').toLowerCase().includes(v.loc.toLowerCase()));
    const pg = ui().paginate(list, v.page, 8);
    PL.state.candidateSearchImpressions = PL.state.candidateSearchImpressions || {};
    let recordedSearchImpression = false;
    pg.items.forEach(candidate => {
      const key = u.id + ':' + candidate.id;
      if (!PL.state.candidateSearchImpressions[key]) {
        candidate.profile.searchAppearances = (Number(candidate.profile.searchAppearances) || 0) + 1;
        PL.state.candidateSearchImpressions[key] = true;
        recordedSearchImpression = true;
      }
    });
    if (recordedSearchImpression) PL.store.save();
    return `${ui().pageHead('Find candidates', '', `Contact unlocks used: ${us.resumes} / ${us.plan.limits.resumes}`)}<div class="card pad row mb">${ui().filterCtl('cands', { name: 'q', type: 'search', label: 'Keyword or skill', placeholder: 'e.g. HPLC, regulatory' })}${ui().filterCtl('cands', { name: 'loc', type: 'search', label: 'Location', placeholder: 'City' })}</div>
      <div class="stack">${pg.items.map(x => `<div class="card pad row between nowrap"><div class="row nowrap">${ui().avatar(x, 48)}<div><a class="bold" href="#/app/profile/${x.id}">${E(x.name)}</a><div class="small muted">${E(x.profile.headline || x.profile.title || '')}</div><div class="xs muted">${E(x.location || '')} · ${x.profile.experienceYears || 0} yrs</div>${unl.includes(x.id) ? `<div class="xs">${E(x.email)} · ${E(x.phone || '')}</div>` : ''}</div></div><div class="row">${unl.includes(x.id) ? '<span class="badge b-green">Contact unlocked</span>' : `<button class="btn btn-secondary btn-sm" data-action="unlock" data-id="${x.id}">Unlock contact</button>`}<button class="btn btn-ghost btn-sm" data-action="save-cand" data-id="${x.id}">${sv.includes(x.id) ? 'Saved' : 'Save'}</button><a class="btn btn-sm" href="#/employer/messages?u=${x.id}">Message</a></div></div>`).join('') || ui().empty('user', 'No candidates found', 'Try a different keyword.')}</div>${ui().pager({ total: list.length, page: pg.page, per: 8, scope: 'cands' })}`;
  }, 'Find candidates');
  PL.act('unlock', async d => {
    const u = me(), us = PL.q.usage(u.id);
    if (us.sub && us.sub.status !== 'Active') return ui().toast('Subscription inactive', 'err');
    if (us.resumes >= us.plan.limits.resumes) return ui().toast('Contact unlock quota reached. Upgrade your plan.', 'err');
    if (!(await ui().confirm({ title: 'Unlock contact details?', message: 'This uses 1 of your monthly unlocks.', confirmText: 'Unlock' }))) return;
    (db().unlocked[u.id] = db().unlocked[u.id] || []).push(d.id); if (us.sub) us.sub.usage.resumes++; PL.store.save(); ui().toast('Contact unlocked'); PL.rerender();
  });

  /* ---------- interviews ---------- */
  reg('/employer/interviews', (ctx, u) => {
    const ivs = PL.q.myApps(u.id).filter(a => a.interview).sort((a, b) => a.interview.date.localeCompare(b.interview.date));
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const has = {}; ivs.forEach(a => { if (a.interview.status !== 'Cancelled') has[a.interview.date] = (has[a.interview.date] || 0) + 1; });
    let cal = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(x => `<div class="hd">${x}</div>`).join(''); for (let i = 0; i < first; i++) cal += '<div></div>';
    for (let d = 1; d <= days; d++) { const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; cal += `<div class="${has[k] ? 'has' : ''} ${k === F().today() ? 'today' : ''}" ${has[k] ? `title="${has[k]} interview(s)"` : ''}>${d}</div>`; }
    return `${ui().pageHead('Interviews')}<div class="grid" style="grid-template-columns:320px minmax(0,1fr);gap:20px"><div class="card pad"><h3>${now.toLocaleString('en', { month: 'long', year: 'numeric' })}</h3><div class="cal">${cal}</div></div>
      ${ui().table({ cols: [{ label: 'Candidate', render: a => `<a href="#/employer/applicants/${a.id}">${E(PL.q.user(a.candidateId).name)}</a>` }, { label: 'Job', render: a => E(PL.q.job(a.jobId).title) }, { label: 'When', render: a => F().date(a.interview.date) + ' ' + E(a.interview.time) }, { label: 'Type', render: a => E(a.interview.type) }, { label: 'Status', render: a => ui().badge(a.interview.status) }], rows: ivs, empty: 'No interviews scheduled.' })}</div>`;
  }, 'Interviews');

  /* ---------- subscription ---------- */
  reg('/employer/subscription', (ctx, u) => {
    const us = PL.q.usage(u.id), inv = db().invoices.filter(i => i.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return `${ui().pageHead('Subscription & billing', `<a class="btn" href="#/pricing">Upgrade plan</a>`)}${us.sub && us.sub.status !== 'Active' ? ui().notice('Your subscription has ' + E(us.sub.status.toLowerCase()) + '.', 'err') : ''}
      <div class="grid g2 mb"><div class="card pad-lg"><div class="row between"><h3>${E(us.plan.name)} plan</h3>${us.sub ? ui().badge(us.sub.status) : ''}</div><p class="muted">${us.plan.price == null ? 'Custom pricing' : F().inr(us.plan.price) + ' / month'}</p>${us.sub ? `<p class="small">Renews on ${F().date(us.sub.renewalDate)}</p>` : ''}<ul>${us.plan.features.map(f => `<li>${E(f)}</li>`).join('')}</ul></div>
      <div class="card pad-lg stack"><h3>Usage</h3>${ui().progress(us.jobs, us.plan.limits.jobs, 'Active jobs')}${ui().progress(us.featured, us.plan.limits.featured, 'Featured jobs')}${ui().progress(us.resumes, us.plan.limits.resumes, 'Contact unlocks')}</div></div>
      <h3>Invoices</h3>${ui().table({ cols: [{ label: 'Invoice', render: i => E(i.id.toUpperCase()) }, { label: 'Plan', render: i => E(PL.q.plan(i.planId).name) }, { label: 'Date', render: i => F().date(i.createdAt) }, { label: 'Amount', render: i => F().inr(i.amount) }, { label: 'Status', render: i => ui().badge(i.status) }], rows: inv, empty: 'No invoices yet.' })}`;
  }, 'Subscription');
})();
