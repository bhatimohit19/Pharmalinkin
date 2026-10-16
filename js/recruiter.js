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

  /* ---------- dashboard ---------- */
  reg('/employer/dashboard', (ctx, u) => {
    const co = company(u), jobs = PL.q.myJobs(u.id), apps = PL.q.myApps(u.id), us = PL.q.usage(u.id);
    const by = s => apps.filter(a => a.status === s).length, pend = jobs.filter(j => j.status === 'Pending Approval').length;
    const upcoming = apps.filter(a => a.interview && a.interview.status !== 'Cancelled' && a.interview.date >= F().today()).sort((a, b) => a.interview.date.localeCompare(b.interview.date)).slice(0, 4);
    const recent = apps.slice().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 5);
    const banners = [];
    if (co && co.verification !== 'Verified') banners.push(ui().notice(`Company verification is <b>${E(co.verification)}</b>. Some features may be limited until an admin verifies it.`, 'warn'));
    if (pend) banners.push(ui().notice(`${pend} job${pend > 1 ? 's are' : ' is'} awaiting admin approval.`, ''));
    if (us.sub && us.sub.status !== 'Active') banners.push(ui().notice('Your subscription has expired. Renew to keep publishing jobs.', 'err'));
    return `${ui().pageHead('Employer dashboard', `<a class="btn" href="#/employer/jobs/new">${I('plus', 16)} Post a job</a>`, co ? co.name : '')}${banners.join('')}
      <div class="grid g4 mb">${ui().kpi('Active jobs', jobs.filter(j => j.status === 'Published').length, us.jobs + ' / ' + us.plan.limits.jobs + ' plan slots', 'briefcase', '', '/employer/jobs')}${ui().kpi('Applications', apps.length, by('Applied') + ' new', 'file', 'teal', '/employer/applicants')}${ui().kpi('Shortlisted', by('Shortlisted'), 'In interview ' + by('Interview Scheduled'), 'user', 'amber', '/employer/applicants')}${ui().kpi('Job views', jobs.reduce((s, j) => s + j.views, 0), 'Across all jobs', 'eye', '')}</div>
      <div class="grid g2"><div class="card pad"><div class="card-head"><h3>Recent applicants</h3><a href="#/employer/applicants">View all</a></div>${recent.map(a => { const c = PL.q.user(a.candidateId), j = PL.q.job(a.jobId); return `<div class="person-row">${ui().avatar(c, 38)}<div class="grow"><a class="bold small" href="#/employer/applicants/${a.id}">${E(c.name)}</a><div class="xs muted">${E(j.title)} · ${F().ago(a.appliedAt)}</div></div>${ui().badge(a.status)}</div>`; }).join('') || '<p class="muted small">No applications yet.</p>'}</div>
      <div class="card pad"><div class="card-head"><h3>Upcoming interviews</h3><a href="#/employer/interviews">Calendar</a></div>${upcoming.map(a => `<div class="person-row"><div class="grow"><a class="bold small" href="#/employer/applicants/${a.id}">${E(PL.q.user(a.candidateId).name)}</a><div class="xs muted">${E(PL.q.job(a.jobId).title)}</div></div><span class="small">${F().date(a.interview.date)} ${E(a.interview.time)}</span></div>`).join('') || '<p class="muted small">None scheduled.</p>'}</div></div>
      <div class="card pad mt"><h3>Plan usage — ${E(us.plan.name)}</h3><div class="grid g3"><div>${ui().progress(us.jobs, us.plan.limits.jobs, 'Active jobs')}</div><div>${ui().progress(us.featured, us.plan.limits.featured, 'Featured jobs')}</div><div>${ui().progress(us.resumes, us.plan.limits.resumes, 'Contact unlocks')}</div></div></div>`;
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
    const v = PL.vf('ejobs', { tab: 'All', page: 1 }), all = PL.q.myJobs(u.id);
    const tabs = ['All', 'Published', 'Pending Approval', 'Draft', 'Paused', 'Closed', 'Rejected', 'Expired'];
    const list = all.filter(j => v.tab === 'All' || j.status === v.tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Manage jobs', `<a class="btn" href="#/employer/jobs/new">${I('plus', 16)} Post a job</a>`)}${ui().tabs(tabs, v.tab, 'ejobs')}
      ${ui().table({ cols: [{ label: 'Job', render: j => `<a class="bold" href="#/employer/jobs/${j.id}/edit">${E(j.title)}</a><div class="xs muted">${E(j.location)} · ${E(j.type)}</div>` }, { label: 'Status', render: j => ui().badge(j.status) + (j.status === 'Rejected' && j.rejectionReason ? `<div class="xs muted">${E(j.rejectionReason)}</div>` : '') }, { label: 'Applicants', render: j => `<a href="#/employer/applicants?job=${j.id}">${PL.q.myApps(u.id).filter(a => a.jobId === j.id).length}</a>` }, { label: 'Views', render: j => j.views }, { label: 'Closes', render: j => F().date(j.closingDate) },
        { label: '', render: j => ui().menu([{ label: 'Edit', href: '/employer/jobs/' + j.id + '/edit', icon: 'edit' }, { label: 'Preview', href: '/jobs/' + j.id, icon: 'eye' }, { label: 'Duplicate', action: 'job-dup', data: { id: j.id }, icon: 'copy' }].concat(j.status === 'Published' ? [{ label: 'Pause', action: 'job-status', data: { id: j.id, s: 'Paused' }, icon: 'pause' }] : []).concat(j.status === 'Paused' || j.status === 'Draft' ? [{ label: j.status === 'Draft' ? 'Submit' : 'Resume', action: 'job-status', data: { id: j.id, s: 'Published' }, icon: 'play' }] : []).concat(['Published', 'Paused'].includes(j.status) ? [{ label: 'Close job', action: 'job-status', data: { id: j.id, s: 'Closed' }, icon: 'x' }] : []).concat([{ label: 'Delete', action: 'job-del', data: { id: j.id }, icon: 'trash', danger: true }]), { label: 'Job actions', align: 'right' }) }], rows: pg.items, empty: 'No jobs in this status.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'ejobs' })}`;
  }, 'Manage jobs');

  function publishCheck(u, j) {
    const us = PL.q.usage(u.id), co = company(u);
    if (us.sub && us.sub.status !== 'Active') return 'Your subscription is not active. Renew it to publish jobs.';
    if (j.status !== 'Published' && j.status !== 'Pending Approval' && us.jobs >= us.plan.limits.jobs) return `Your ${us.plan.name} plan allows ${us.plan.limits.jobs} active job(s). Upgrade to post more.`;
    if (j.featured && us.featured >= us.plan.limits.featured && !j.wasFeatured) return 'Featured job limit reached for your plan.';
    if (co && co.verification === 'Rejected') return 'Your company verification was rejected.';
    return '';
  }
  function submitJob(u, j) {
    const err = publishCheck(u, j); if (err) { ui().toast(err, 'err'); return false; }
    j.status = db().settings.moderation ? 'Pending Approval' : 'Published';
    if (j.status === 'Pending Approval') db().users.filter(x => x.role === 'admin').forEach(a => PL.notify(a.id, 'moderation', 'Job awaiting approval', j.title + ' was submitted.', '/admin/jobs'));
    return true;
  }
  PL.act('job-status', d => {
    const u = me(), j = PL.q.job(d.id); if (d.s === 'Published' && j.status !== 'Paused') { if (!submitJob(u, j)) return; } else if (d.s === 'Published') j.status = 'Published'; else j.status = d.s;
    PL.store.save(); ui().toast('Job status: ' + j.status); PL.rerender();
  });
  PL.act('job-dup', d => { const j = JSON.parse(JSON.stringify(PL.q.job(d.id))); j.id = PL.store.id('j'); j.title += ' (Copy)'; j.status = 'Draft'; j.views = 0; j.featured = false; j.createdAt = F().iso(); db().jobs.unshift(j); PL.store.save(); ui().toast('Duplicated as draft'); PL.rerender(); });
  PL.act('job-del', async d => { if (!(await ui().confirm({ title: 'Delete this job?', message: 'Applications for it will remain on record.', confirmText: 'Delete', danger: true }))) return; db().jobs = db().jobs.filter(j => j.id !== d.id); PL.store.save(); ui().toast('Job deleted'); PL.rerender(); });

  /* ---------- job wizard ---------- */
  const JSTEPS = ['Basics', 'Requirements', 'Compensation', 'Description', 'Screening', 'Review'];
  const lines = t => (t || '').split('\n').map(s => s.trim()).filter(Boolean);
  function jobWizard(ctx, u) {
    const editId = ctx.params.id;
    let w = PL.state.jw;
    if (!w || w.editId !== editId || ctx.fresh) {
      const j = editId ? PL.q.job(editId) : null;
      if (editId && (!j || j.recruiterId !== u.id)) return ui().empty('briefcase', 'Job not found', 'This job does not exist or is not yours.', '<a class="btn" href="#/employer/jobs">Back</a>');
      w = PL.state.jw = { editId, step: 0, d: j ? JSON.parse(JSON.stringify(j)) : { title: '', department: '', type: 'Full-time', workMode: 'On-site', vacancies: 1, city: '', state: '', qualification: PL.QUALS[0], expMin: 0, expMax: 3, salMin: '', salMax: '', skills: [], responsibilities: [], benefits: [], preferred: '', incentives: '', travel: '', description: '', questions: [], featured: false, closingDate: '' } };
    }
    const d = w.d, s = w.step, f = (n, l, x) => ui().field(Object.assign({ name: n, label: l, value: d[n] == null ? '' : d[n] }, x || {}));
    const bar = `<div class="step-bar" role="list">${JSTEPS.map((t, i) => `<div role="listitem" class="step ${i < s ? 'done' : i === s ? 'active' : ''}" ${i === s ? 'aria-current="step"' : ''}>${i < s ? '✓' : i + 1}. ${t}</div>`).join('')}</div>`;
    let body = '';
    if (s === 0) body = f('title', 'Job title', { required: true }) + f('department', 'Department / category', { type: 'select', options: PL.CATEGORIES, required: true, placeholder: '' }) + f('type', 'Employment type', { type: 'select', options: PL.JOB_TYPES }) + f('workMode', 'Work mode', { type: 'select', options: PL.WORK_MODES }) + f('city', 'City', { required: true }) + f('state', 'State', { required: true }) + f('vacancies', 'Vacancies', { type: 'number', min: 1 }) + f('closingDate', 'Closing date', { type: 'date', required: true });
    if (s === 1) body = f('qualification', 'Minimum qualification', { type: 'select', options: PL.QUALS }) + f('expMin', 'Min experience (yrs)', { type: 'number', min: 0 }) + f('expMax', 'Max experience (yrs)', { type: 'number', min: 0 }) + f('skills', 'Skills (comma separated)', { value: (d.skills || []).join(', '), full: true, required: true }) + f('preferred', 'Preferred qualifications', { full: true });
    if (s === 2) body = f('salMin', 'Min salary (₹ LPA)', { type: 'number', min: 0 }) + f('salMax', 'Max salary (₹ LPA)', { type: 'number', min: 0 }) + f('incentives', 'Incentives') + f('travel', 'Travel requirement') + f('benefits', 'Benefits (one per line)', { type: 'textarea', rows: 4, full: true, value: (d.benefits || []).join('\n') });
    if (s === 3) body = f('description', 'Role overview', { type: 'textarea', rows: 5, full: true, required: true, minlength: 30 }) + f('responsibilities', 'Responsibilities (one per line)', { type: 'textarea', rows: 5, full: true, value: (d.responsibilities || []).join('\n') });
    if (s === 4) body = f('questions', 'Screening questions (one per line)', { type: 'textarea', rows: 4, full: true, value: (d.questions || []).join('\n'), help: 'Candidates answer these when applying.' }) + `<div class="field full"><label class="check"><input type="checkbox" name="featured" ${d.featured ? 'checked' : ''}> Feature this job (uses a featured slot)</label></div>`;
    if (s === 5) {
      const err = publishCheck(u, d);
      body = `<div class="full">${ui().notice(db().settings.moderation ? 'Moderation is on: your job will be reviewed by an admin before going live.' : 'Moderation is off: your job will go live immediately.', '')}${err ? ui().notice(E(err), 'err') : ''}<h3>${E(d.title)}</h3><p class="muted">${E(d.city)}, ${E(d.state)} · ${E(d.type)} · ${E(d.workMode)} · ${E(d.qualification)} · ${d.expMin}-${d.expMax} yrs</p><p>${E(d.description)}</p><p class="small"><b>Skills:</b> ${E((d.skills || []).join(', '))}</p><p class="small"><b>Closes:</b> ${F().date(d.closingDate)}</p></div>`;
    }
    return `${ui().pageHead(editId ? 'Edit job' : 'Post a job')}${bar}<form class="card pad-lg form-grid" data-form="job-step" novalidate>${body}<div class="full row between">${s > 0 ? '<button type="button" class="btn btn-secondary" data-action="job-back">Back</button>' : '<span></span>'}<div class="row"><button type="button" class="btn btn-secondary" data-action="job-draft">Save draft</button>${s < 5 ? '<button class="btn" type="submit">Next</button>' : '<button class="btn" type="submit">Submit job</button>'}</div></div></form>`;
  }
  reg('/employer/jobs/new', jobWizard, 'Post a job');
  reg('/employer/jobs/:id/edit', jobWizard, 'Edit job');
  function collect(f) {
    const w = PL.state.jw, d = w.d, x = ui().formData(f), s = w.step;
    const pick = (...k) => k.forEach(n => { if (x[n] !== undefined) d[n] = x[n]; });
    if (s === 0) pick('title', 'department', 'type', 'workMode', 'city', 'state', 'vacancies', 'closingDate');
    if (s === 1) { pick('qualification', 'expMin', 'expMax', 'preferred'); d.skills = (x.skills || '').split(',').map(t => t.trim()).filter(Boolean); }
    if (s === 2) { pick('salMin', 'salMax', 'incentives', 'travel'); d.benefits = lines(x.benefits); }
    if (s === 3) { pick('description'); d.responsibilities = lines(x.responsibilities); }
    if (s === 4) { d.questions = lines(x.questions); d.featured = !!f.featured.checked; }
    d.location = d.city && d.state ? d.city + ', ' + d.state : d.location; d.locations = [d.location];
  }
  function persist(u, status) {
    const w = PL.state.jw, d = w.d; let j = w.editId ? PL.q.job(w.editId) : null;
    if (!j) { j = Object.assign({}, d, { id: PL.store.id('j'), companyId: company(u).id, recruiterId: u.id, views: 0, createdAt: F().iso(), status: 'Draft' }); db().jobs.unshift(j); w.editId = j.id; }
    else Object.assign(j, d);
    j.vacancies = +j.vacancies || 1; j.expMin = +j.expMin || 0; j.expMax = +j.expMax || 0; j.salMin = +j.salMin || 0; j.salMax = +j.salMax || 0;
    if (status === 'submit') { j.wasFeatured = false; if (!submitJob(u, j)) { PL.store.save(); return null; } } else if (!['Published', 'Pending Approval', 'Paused'].includes(j.status)) j.status = 'Draft';
    PL.store.save(); return j;
  }
  PL.form('job-step', f => {
    const w = PL.state.jw, u = me();
    if (w.step < 5 && !ui().validate(f)) return;
    if (w.step === 1 && +f.expMax.value < +f.expMin.value) return ui().setError(f, 'expMax', 'Max must be ≥ min');
    if (w.step === 2 && f.salMax.value && +f.salMax.value < +f.salMin.value) return ui().setError(f, 'salMax', 'Max must be ≥ min');
    if (w.step < 5) { collect(f); w.step++; PL.rerender(); window.scrollTo(0, 0); return; }
    const j = persist(u, 'submit'); if (!j) return;
    PL.state.jw = null; ui().toast(j.status === 'Pending Approval' ? 'Submitted for admin approval' : 'Job published'); PL.go('/employer/jobs');
  });
  PL.act('job-back', () => { const f = document.querySelector('form[data-form="job-step"]'); if (f) collect(f); PL.state.jw.step--; PL.rerender(); });
  PL.act('job-draft', () => { const f = document.querySelector('form[data-form="job-step"]'); if (f && PL.state.jw.step < 5) collect(f); if (!PL.state.jw.d.title) return ui().toast('Add a job title first', 'err'); persist(me(), 'draft'); PL.state.jw = null; ui().toast('Draft saved'); PL.go('/employer/jobs'); });

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
