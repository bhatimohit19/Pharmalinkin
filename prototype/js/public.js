/* Public website: home, jobs, companies, news, pricing + shared components (PL.cmp) */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt;
  const R = PL.router;

  /* ---------- shared helpers ---------- */
  PL.report = async function (type, id) {
    const u = PL.auth.user(); if (!u) return PL.auth.requireLogin(location.hash.slice(1), 'Sign in to report content.');
    const r = await ui().ask({ title: 'Report this ' + type, message: 'Tell us what is wrong. Reports are reviewed by our moderation team (demo).', confirmText: 'Submit report', fields: [{ name: 'reason', label: 'Reason', type: 'select', required: true, placeholder: 'Select a reason', options: ['Spam or misleading', 'Inappropriate or offensive', 'Fake or unverified information', 'Harassment', 'Other'] }, { name: 'details', label: 'Details (optional)', type: 'textarea', rows: 3 }] });
    if (!r) return;
    db().reports.unshift({ id: PL.store.id('rp'), reporterId: u.id, targetType: type, targetId: id, reason: r.reason + (r.details ? ' – ' + r.details : ''), status: 'Open', createdAt: F().iso(), history: [] });
    db().users.filter(x => x.role === 'admin').forEach(a => PL.notify(a.id, 'moderation', 'New content report', 'A ' + type + ' was reported: ' + r.reason, '/admin/moderation'));
    PL.store.save(); ui().toast('Report submitted. Thank you.');
  };
  const jobUrl = (j, base) => `#${base}/jobs/${j.id}`;
  const salary = j => (j.salMin ? F().lpa(j.salMin, j.salMax) : 'Not disclosed');
  const exp = j => `${j.expMin}–${j.expMax} yrs`;

  const cmp = (PL.cmp = {});
  cmp.jobCard = (j, o = {}) => {
    const c = PL.q.company(j.companyId), u = PL.auth.user(), base = o.base || '';
    const saved = u && u.role === 'candidate' && PL.q.isSaved(u.id, j.id);
    const applied = u && PL.q.appFor(u.id, j.id);
    return `<article class="card card-hover job-card ${j.featured ? 'sponsored-card' : ''}"><div class="row nowrap start">${ui().logo(c, 46)}<div class="grow"><h3><a href="${jobUrl(j, base)}">${E(j.title)}</a></h3><div class="small"><a href="#/companies/${c.id}" style="color:var(--text-2)">${E(c.name)}</a> ${PL.q.verified(c) ? `<span class="verified" title="Verified employer">${I('shield', 14)}</span>` : ''}</div></div>
      <div class="row nowrap" style="gap:6px">${j.featured ? '<span class="badge b-amber">Featured</span>' : ''}${u && u.role === 'candidate' ? `<button class="icon-btn" data-action="save-job" data-id="${j.id}" aria-pressed="${!!saved}" aria-label="${saved ? 'Unsave' : 'Save'} ${E(j.title)}" style="${saved ? 'color:var(--primary)' : ''}">${I('bookmark')}</button>` : ''}</div></div>
      <ul class="meta"><li>${I('pin', 14)}${E(j.location)}</li><li>${I('briefcase', 14)}${exp(j)}</li><li>${I('rupee', 14)}${salary(j)}</li><li>${I('clock', 14)}${E(j.type)} · ${E(j.workMode)}</li></ul>
      <div class="row between"><div class="chips"><span class="tag">${E(j.department)}</span><span class="tag">${E(j.qualification)}</span></div><div class="row"><span class="xs muted">${F().ago(j.createdAt)}</span>${applied ? ui().badge(applied.status) : `<a class="btn btn-sm btn-secondary" href="${jobUrl(j, base)}">View details</a>`}</div></div></article>`;
  };
  cmp.companyCard = c => {
    const n = db().jobs.filter(j => j.companyId === c.id && j.status === 'Published').length;
    return `<article class="card card-hover pad"><div class="row nowrap start">${ui().logo(c, 52)}<div class="grow"><h3 style="margin:0"><a href="#/companies/${c.id}" style="color:var(--text)">${E(c.name)}</a></h3><div class="small muted">${E(c.industry)} · ${E(c.hq)}</div></div>${PL.q.verified(c) ? ui().badge('Verified') : ui().badge('Pending', '')}</div><p class="small muted" style="margin:10px 0">${E(c.description.slice(0, 110))}…</p><div class="row between"><span class="small">${I('briefcase', 14)} ${n} open job${n === 1 ? '' : 's'}</span><a class="btn btn-sm btn-secondary" href="#/companies/${c.id}">View company</a></div></article>`;
  };
  cmp.personRow = p => `<div class="row nowrap" style="padding:10px 0;border-bottom:1px solid var(--border)">${ui().avatar(p, 44)}<div class="grow"><a class="bold" href="#/app/profile/${p.id}">${E(p.name)}</a><div class="small muted">${E((p.profile && p.profile.headline) || PL.auth.roleLabel(p.role))}</div></div><a class="btn btn-sm btn-secondary" href="#/app/profile/${p.id}">View</a></div>`;

  /* ---------- actions ---------- */
  PL.act('save-job', d => {
    const u = PL.auth.user(); if (!u) return PL.auth.requireLogin(location.hash.slice(1), 'Sign in to save jobs.');
    if (u.role !== 'candidate') return ui().toast('Only candidates can save jobs.', 'info');
    const s = (db().savedJobs[u.id] = db().savedJobs[u.id] || []); const i = s.indexOf(d.id);
    if (i >= 0) { s.splice(i, 1); ui().toast('Removed from saved jobs'); } else { s.push(d.id); ui().toast('Job saved'); }
    PL.store.save(); PL.rerender();
  });
  PL.act('share', d => ui().copy(ui().url(d.path)));
  PL.act('report', d => PL.report(d.type, d.id));
  PL.act('apply-job', d => {
    const u = PL.auth.user(), path = '/app/jobs/' + d.id + '/apply';
    if (!u) return PL.auth.requireLogin(path, 'Sign in or register as a candidate to apply.');
    if (u.role !== 'candidate') return ui().toast('Only candidate accounts can apply to jobs.', 'info');
    PL.go(path);
  });
  PL.act('follow-company', d => {
    const u = PL.auth.user(); if (!u) return PL.auth.requireLogin(location.hash.slice(1), 'Sign in to follow companies.');
    const f = PL.q.follows(u.id), i = f.companies.indexOf(d.id);
    if (i >= 0) f.companies.splice(i, 1); else f.companies.push(d.id);
    PL.store.save(); ui().toast(i >= 0 ? 'Unfollowed' : 'Following company'); PL.rerender();
  });
  PL.act('bookmark-news', d => {
    const u = PL.auth.user(); if (!u) return PL.auth.requireLogin(location.hash.slice(1), 'Sign in to bookmark articles.');
    const b = (db().newsBookmarks[u.id] = db().newsBookmarks[u.id] || []), i = b.indexOf(d.id);
    if (i >= 0) b.splice(i, 1); else b.push(d.id);
    PL.store.save(); ui().toast(i >= 0 ? 'Bookmark removed' : 'Article bookmarked'); PL.rerender();
  });
  PL.form('home-search', f => { const q = f.q.value.trim(), l = f.loc.value.trim(); PL.view.jobs = Object.assign(PL.vf('jobs'), { q, loc: l, cat: '', page: 1 }); PL.go('/jobs'); });

  /* ---------- home ---------- */
  R.add('/', () => {
    const jobs = PL.q.publicJobs().sort((a, b) => (b.featured - a.featured) || (new Date(b.createdAt) - new Date(a.createdAt))).slice(0, 6);
    const comps = db().companies.filter(PL.q.verified).slice(0, 4), news = db().news.slice(0, 3);
    const counts = c => PL.q.publicJobs().filter(j => j.department === c).length;
    return `<section class="hero"><div class="container hero-grid"><div><span class="badge b-blue">Pharma careers & network</span><h1 style="margin-top:12px">Where pharma professionals <span>connect, grow and get hired</span></h1><p class="muted" style="font-size:1.05rem">Discover roles across sales, regulatory, clinical research, quality, manufacturing and more – and follow the people and companies shaping the industry.</p>
        <form data-form="home-search" class="card pad mt" role="search" style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;padding:12px"><div class="field" style="margin:0"><label class="sr" for="hq">Job title or keyword</label><input id="hq" name="q" placeholder="Job title, skill or company"></div><div class="field" style="margin:0"><label class="sr" for="hl">Location</label><input id="hl" name="loc" placeholder="City or state"></div><button class="btn" type="submit">${I('search', 16)} Search jobs</button></form>
        <div class="stat-row"><div><strong>${PL.q.publicJobs().length}</strong><span class="muted small">Open jobs</span></div><div><strong>${db().companies.length}</strong><span class="muted small">Employers</span></div><div><strong>${db().users.filter(u => u.role === 'candidate').length}</strong><span class="muted small">Professionals</span></div></div></div>
      <div class="hero-art"><img alt="Illustration of a pharma network" src="${ui().art('hero', 'Pharma careers, connected', 640, 420)}" style="width:100%;border-radius:12px;display:block"></div></div></section>
    <section class="section"><div class="container"><div class="section-head"><h2>Browse by function</h2><a href="#/jobs">All jobs ${I('arrow', 14)}</a></div><div class="grid g4">${PL.CATEGORIES.slice(0, 12).map(c => `<a class="cat-tile" href="#/jobs?cat=${encodeURIComponent(c)}">${I('pill', 18)}<span class="grow">${E(c)}</span><span class="xs muted">${counts(c)}</span></a>`).join('')}</div></div></section>
    <section class="section"><div class="container"><div class="section-head"><h2>Latest & featured jobs</h2><a href="#/jobs">View all ${I('arrow', 14)}</a></div><div class="grid g2">${jobs.map(j => cmp.jobCard(j)).join('')}</div></div></section>
    ${PL.ads ? PL.ads.homeBand() : ''}
    <section class="section"><div class="container"><div class="section-head"><h2>Verified employers</h2><a href="#/companies">All companies ${I('arrow', 14)}</a></div><div class="grid g4">${comps.map(cmp.companyCard).join('')}</div></div></section>
    <section class="section"><div class="container"><div class="section-head"><h2>Industry news</h2><a href="#/news">More news ${I('arrow', 14)}</a></div><div class="grid g3">${news.map(newsCard).join('')}</div></div></section>
    <section class="section"><div class="container"><div class="grid g3">
      <div class="card pad">${I('user', 24)}<h3>For candidates</h3><p class="muted small">Build a profile, upload your resume, apply with one workflow and track every application.</p><a class="btn btn-secondary btn-sm" href="#/register?role=candidate">Create profile</a></div>
      <div class="card pad">${I('briefcase', 24)}<h3>For employers</h3><p class="muted small">Post jobs, manage applicants, schedule interviews and discover verified talent.</p><a class="btn btn-secondary btn-sm" href="#/pricing">See plans</a></div>
      <div class="card pad">${I('megaphone', 24)}<h3>For advertisers</h3><p class="muted small">Promote courses, webinars and products to a focused pharma audience.</p><a class="btn btn-secondary btn-sm" href="#/register?role=advertiser">Start advertising</a></div></div>
      <figure class="card pad-lg mt" style="margin:24px 0 0"><blockquote style="margin:0;font-size:1.1rem">“A focused platform for the pharma sector makes hiring far more efficient for our team.”</blockquote><figcaption class="muted small mt-s">– Sayara Negi, Human Resource Manager (illustrative testimonial)</figcaption></figure>
      <div class="cta-band mt"><div><h2>Ready to take the next step?</h2><p>Join the demo and explore every role in minutes.</p></div><a class="btn" href="#/login">Try the demo</a></div></div></section>`;
  }, { layout: 'public', title: 'Pharma jobs & network' });

  /* ---------- jobs ---------- */
  function jobList(base) {
    return ctx => {
      const q = ctx.query;
      if (ctx.fresh && (q.q || q.cat)) Object.assign(PL.vf('jobs', {}), { q: q.q || '', cat: q.cat || '', page: 1 });
      const v = PL.vf('jobs', { q: '', cat: '', loc: '', qual: '', type: '', mode: '', exp: '', sort: 'new', page: 1 });
      const lower = s => String(s || '').toLowerCase(), qq = lower(v.q), ll = lower(v.loc);
      let list = PL.q.publicJobs().filter(j => {
        const c = PL.q.company(j.companyId);
        if (qq && !lower(j.title + ' ' + j.department + ' ' + c.name + ' ' + j.skills.join(' ')).includes(qq)) return false;
        if (ll && !lower(j.location + ' ' + j.locations.join(' ')).includes(ll)) return false;
        if (v.cat && j.department !== v.cat) return false;
        if (v.qual && j.qualification !== v.qual) return false;
        if (v.type && j.type !== v.type) return false;
        if (v.mode && j.workMode !== v.mode) return false;
        if (v.exp) { const [lo, hi] = v.exp === '10+' ? [10, 99] : v.exp.split('-').map(Number); if (!(j.expMin <= hi && j.expMax >= lo)) return false; }
        return true;
      });
      list.sort(v.sort === 'sal' ? (a, b) => b.salMax - a.salMax : (a, b) => (b.featured - a.featured) || (new Date(b.createdAt) - new Date(a.createdAt)));
      const per = 8, page = Math.min(v.page, Math.max(1, Math.ceil(list.length / per))), rows = ui().paginate(list, page, per);
      const sel = (name, label, opts) => ui().filterCtl('jobs', { name, type: 'select', label, options: [{ v: '', l: label }].concat(opts.map(o => (typeof o === 'object' ? o : { v: o, l: o }))) });
      const ad = PL.ads ? PL.ads.slot('Jobs') : '';
      const body = `<div class="card pad mb"><div class="grid" style="grid-template-columns:2fr 1.2fr 1.4fr 1fr;gap:10px">${ui().filterCtl('jobs', { name: 'q', label: 'Keyword', placeholder: 'Title, skill or company' })}${ui().filterCtl('jobs', { name: 'loc', label: 'Location', placeholder: 'City or state' })}${sel('cat', 'All functions', PL.CATEGORIES)}${sel('sort', 'Sort', [{ v: 'new', l: 'Newest / featured' }, { v: 'sal', l: 'Highest salary' }])}</div>
        <div class="grid mt-s" style="grid-template-columns:repeat(4,1fr);gap:10px">${sel('qual', 'Any qualification', PL.QUALS)}${sel('type', 'Any job type', PL.JOB_TYPES)}${sel('mode', 'Any work mode', PL.WORK_MODES)}${sel('exp', 'Any experience', [{ v: '0-1', l: '0–1 yrs' }, { v: '1-3', l: '1–3 yrs' }, { v: '3-5', l: '3–5 yrs' }, { v: '5-10', l: '5–10 yrs' }, { v: '10+', l: '10+ yrs' }])}</div></div>
        <div class="row between mb"><span class="muted small" role="status">${list.length} job${list.length === 1 ? '' : 's'} found</span><button class="btn btn-ghost btn-sm" data-action="clear-job-filters">Clear filters</button></div>
        ${ad}${rows.length ? `<div class="stack">${rows.map(j => cmp.jobCard(j, { base })).join('')}</div>${ui().pager({ total: list.length, page, per, scope: 'jobs' })}` : ui().empty('search', 'No jobs match your filters', 'Try removing some filters or broadening your keyword.', '<button class="btn btn-secondary" data-action="clear-job-filters">Clear filters</button>')}`;
      return base ? `<h1 style="font-size:1.5rem">Find jobs</h1>${body}` : `<div class="container section"><h1>Find pharma jobs</h1>${body}</div>`;
    };
  }
  PL.act('clear-job-filters', () => { PL.view.jobs = {}; PL.rerender(); });
  R.add('/jobs', jobList(''), { layout: 'public', title: 'Jobs' });
  R.add('/app/jobs', jobList('/app'), { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Jobs' });

  const li = a => `<ul style="padding-left:20px;margin:6px 0">${a.map(x => `<li>${E(x)}</li>`).join('')}</ul>`;
  function jobDetail(base) {
    return ctx => {
      const j = PL.q.job(ctx.params.id), u = PL.auth.user();
      const owner = u && u.role === 'recruiter' && j && u.companyId === j.companyId, admin = u && u.role === 'admin';
      if (!j || (j.status !== 'Published' && !owner && !admin)) return `<div class="container section">${ui().empty('briefcase', 'Job not available', 'This job may have been closed, expired or removed.', '<a class="btn" href="#' + base + '/jobs">Browse jobs</a>')}</div>`;
      const c = PL.q.company(j.companyId), applied = u && PL.q.appFor(u.id, j.id), saved = u && PL.q.isSaved(u.id, j.id);
      const similar = PL.q.publicJobs().filter(x => x.id !== j.id && (x.department === j.department || x.companyId === j.companyId)).slice(0, 3);
      const open = j.status === 'Published' && new Date(j.closingDate) >= new Date(F().today());
      j.views = j.views || 0; if (ctx.fresh && !owner) { j.views++; PL.store.save(); }
      const apply = !open ? `<button class="btn" disabled>Applications closed</button>` : applied ? `<a class="btn btn-secondary" href="#/app/applications/${applied.id}">${I('checkc', 16)} Applied – ${E(applied.status)}</a>` : `<button class="btn" data-action="apply-job" data-id="${j.id}">Apply now</button>`;
      const html = `<div class="${base ? '' : 'container section'}"><a href="#${base}/jobs" class="small">${I('left', 14)} Back to jobs</a>
        <div class="grid mt-s" style="grid-template-columns:minmax(0,1fr) 320px;align-items:start">
        <div class="stack"><div class="card pad-lg"><div class="row nowrap start">${ui().logo(c, 60)}<div class="grow"><h1 style="font-size:1.5rem;margin:0">${E(j.title)}</h1><a href="#/companies/${c.id}">${E(c.name)}</a> ${PL.q.verified(c) ? ui().badge('Verified', '') : '<span class="badge b-amber">Verification pending</span>'}${j.status !== 'Published' ? ' ' + ui().badge(j.status) : ''}</div></div>
          <ul class="meta mt"><li>${I('pin', 14)}${E(j.location)}</li><li>${I('briefcase', 14)}${exp(j)}</li><li>${I('rupee', 14)}${salary(j)}</li><li>${I('clock', 14)}${E(j.type)} · ${E(j.workMode)}</li><li>${I('calendar', 14)}Apply by ${F().date(j.closingDate)}</li></ul>
          <div class="row mt">${apply}${u && u.role === 'candidate' ? `<button class="btn btn-secondary" data-action="save-job" data-id="${j.id}" aria-pressed="${!!saved}">${I('bookmark', 16)} ${saved ? 'Saved' : 'Save'}</button>` : ''}<button class="btn btn-ghost" data-action="share" data-path="${base}/jobs/${j.id}">${I('share', 16)} Share</button><button class="btn btn-ghost" data-action="report" data-type="job" data-id="${j.id}">${I('flag', 16)} Report</button></div></div>
          <div class="card pad-lg"><h3>About the role</h3><p>${E(j.description)}</p><h3>Responsibilities</h3>${li(j.responsibilities)}<h3>Required skills</h3><div class="chips">${j.skills.map(s => `<span class="tag">${E(s)}</span>`).join('')}</div><h3 class="mt">Preferred</h3><p>${E(j.preferred)}</p><h3>Benefits</h3>${li(j.benefits)}${j.incentives ? `<p><b>Incentives:</b> ${E(j.incentives)}</p>` : ''}</div></div>
        <aside class="stack"><div class="card pad"><h3>Job overview</h3><dl class="kv"><dt>Function</dt><dd>${E(j.department)}</dd><dt>Qualification</dt><dd>${E(j.qualification)}</dd><dt>Vacancies</dt><dd>${j.vacancies}</dd><dt>Travel</dt><dd>${E(j.travel)}</dd><dt>Posted</dt><dd>${F().date(j.createdAt)}</dd></dl></div>
        <div class="card pad"><h3>About ${E(c.name)}</h3><p class="small muted">${E(c.description)}</p><a class="btn btn-secondary btn-sm" href="#/companies/${c.id}">View company</a></div>
        ${PL.ads ? PL.ads.slot('Sidebar') : ''}</aside></div>
        ${similar.length ? `<h2 class="mt">Similar jobs</h2><div class="grid g3">${similar.map(x => cmp.jobCard(x, { base })).join('')}</div>` : ''}</div>`;
      return html;
    };
  }
  R.add('/jobs/:id', jobDetail(''), { layout: 'public', title: 'Job details' });
  R.add('/app/jobs/:id', jobDetail('/app'), { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Job details' });

  /* ---------- companies ---------- */
  R.add('/companies', () => {
    const v = PL.vf('companies', { q: '', ind: '', size: '', page: 1 }), q = v.q.toLowerCase();
    const list = db().companies.filter(c => (!q || (c.name + c.hq).toLowerCase().includes(q)) && (!v.ind || c.industry === v.ind) && (!v.size || c.size === v.size));
    const opt = (l, a) => [{ v: '', l }].concat(a.map(x => ({ v: x, l: x })));
    const rows = ui().paginate(list, v.page, 9);
    return `<div class="container section"><h1>Companies</h1><div class="card pad mb"><div class="grid g3">${ui().filterCtl('companies', { name: 'q', label: 'Search companies', placeholder: 'Company name or city' })}${ui().filterCtl('companies', { name: 'ind', type: 'select', label: 'Industry', options: opt('All industries', PL.INDUSTRIES) })}${ui().filterCtl('companies', { name: 'size', type: 'select', label: 'Size', options: opt('Any size', PL.SIZES) })}</div></div>
      ${PL.ads ? PL.ads.slot('Companies') : ''}${rows.length ? `<div class="grid g3">${rows.map(cmp.companyCard).join('')}</div>${ui().pager({ total: list.length, page: v.page, per: 9, scope: 'companies' })}` : ui().empty('building', 'No companies found', 'Adjust your filters.')}</div>`;
  }, { layout: 'public', title: 'Companies' });

  R.add('/companies/:id', ctx => {
    const c = PL.q.company(ctx.params.id), u = PL.auth.user();
    if (!c) return `<div class="container section">${ui().empty('building', 'Company not found', '', '<a class="btn" href="#/companies">All companies</a>')}</div>`;
    const v = PL.vf('company', { tab: 'About' }), jobs = db().jobs.filter(j => j.companyId === c.id && j.status === 'Published');
    const following = u && PL.q.follows(u.id).companies.includes(c.id);
    const tabs = ['About', 'Jobs', 'Culture'];
    const t = tabs.includes(v.tab) ? v.tab : 'About';
    const panel = t === 'About' ? `<div class="card pad-lg"><h3>About</h3><p>${E(c.description)}</p><dl class="kv"><dt>Industry</dt><dd>${E(c.industry)}</dd><dt>Size</dt><dd>${E(c.size)} employees</dd><dt>Headquarters</dt><dd>${E(c.hq)}</dd><dt>Locations</dt><dd>${E(c.locations.join(', '))}</dd><dt>Website</dt><dd>${E(c.website)}</dd></dl><h3 class="mt">Specialisations</h3><div class="chips">${c.specializations.map(s => `<span class="tag">${E(s)}</span>`).join('') || '<span class="muted small">Not listed</span>'}</div></div>`
      : t === 'Jobs' ? (jobs.length ? `<div class="stack">${jobs.map(j => cmp.jobCard(j, { base: u ? '/app' : '' })).join('')}</div>` : ui().empty('briefcase', 'No open jobs', 'Follow this company to hear about new openings.'))
        : `<div class="card pad-lg"><h3>Culture</h3><p>${E(c.culture)}</p><h3>Benefits</h3>${li(c.benefits)}</div>`;
    return `<div class="container section">${PL.q.verified(c) ? '' : ui().notice('This employer is <b>awaiting verification</b>. Details are not yet confirmed by PharmaLinkIn.', 'warn')}
      <div class="card mt-s" style="overflow:hidden"><img class="cover" alt="" src="${c.coverImg || ui().art(c.id, '', 1200, 200)}" style="width:100%;height:150px;object-fit:cover;display:block"><div class="pad row between nowrap start">${'<div class="row nowrap start">' + ui().logo(c, 68) + `<div><h1 style="font-size:1.5rem;margin:0">${E(c.name)}</h1><div class="muted">${E(c.industry)} · ${E(c.hq)}</div><div class="mt-s">${ui().badge(c.verification)}</div></div></div>`}<button class="btn ${following ? 'btn-secondary' : ''}" data-action="follow-company" data-id="${c.id}">${following ? 'Following' : 'Follow'}</button></div></div>
      <div class="mt">${ui().tabs(tabs.map(x => ({ id: x, label: x, count: x === 'Jobs' ? jobs.length : null })), t, 'company')}</div><div class="mt-s">${panel}</div></div>`;
  }, { layout: 'public', title: 'Company' });

  /* ---------- news ---------- */
  function newsCard(n) {
    return `<article class="card card-hover" style="overflow:hidden"><img alt="" src="${ui().art(n.id, n.category, 600, 260)}" style="width:100%;display:block;aspect-ratio:600/260;object-fit:cover"><div class="pad"><div class="row">${n.sponsored ? ui().sponsoredLabel() : `<span class="tag">${E(n.category)}</span>`}<span class="xs muted">${F().date(n.createdAt)}</span></div><h3 style="margin:8px 0 4px"><a href="#/news/${n.id}" style="color:var(--text)">${E(n.title)}</a></h3><p class="small muted" style="margin:0">${E(n.summary)}</p></div></article>`;
  }
  R.add('/news', () => {
    const v = PL.vf('news', { q: '', cat: '', page: 1 }), q = v.q.toLowerCase(), cats = [...new Set(db().news.map(n => n.category))];
    const list = db().news.filter(n => (!q || (n.title + n.summary).toLowerCase().includes(q)) && (!v.cat || n.category === v.cat));
    const rows = ui().paginate(list, v.page, 6);
    return `<div class="container section"><h1>Industry news</h1><p class="muted">Illustrative demo articles for the prototype.</p><div class="card pad mb"><div class="grid g2">${ui().filterCtl('news', { name: 'q', label: 'Search articles', placeholder: 'Search articles' })}${ui().filterCtl('news', { name: 'cat', type: 'select', label: 'Category', options: [{ v: '', l: 'All categories' }].concat(cats.map(c => ({ v: c, l: c }))) })}</div></div>
      ${rows.length ? `<div class="grid g3">${rows.map(newsCard).join('')}</div>${ui().pager({ total: list.length, page: v.page, per: 6, scope: 'news' })}` : ui().empty('news', 'No articles found', '')}</div>`;
  }, { layout: 'public', title: 'News' });
  R.add('/news/:id', ctx => {
    const n = PL.q.news(ctx.params.id), u = PL.auth.user();
    if (!n) return `<div class="container section">${ui().empty('news', 'Article not found', '', '<a class="btn" href="#/news">All news</a>')}</div>`;
    const bm = u && (db().newsBookmarks[u.id] || []).includes(n.id), rel = db().news.filter(x => x.id !== n.id && x.category === n.category).concat(db().news.filter(x => x.id !== n.id)).slice(0, 3);
    return `<div class="container narrow section" style="max-width:780px"><a href="#/news" class="small">${I('left', 14)} All news</a><article class="card mt-s" style="overflow:hidden"><img alt="" src="${ui().art(n.id, n.category, 800, 320)}" style="width:100%;display:block"><div class="pad-lg"><div class="row">${n.sponsored ? ui().sponsoredLabel() : `<span class="tag">${E(n.category)}</span>`}<span class="small muted">${F().date(n.createdAt)} · ${E(n.source)}</span></div><h1 style="font-size:1.7rem">${E(n.title)}</h1>${n.sponsored ? ui().notice('This is a sponsored article, not editorial content.', 'warn') : ''}${n.body.map(p => `<p>${E(p)}</p>`).join('')}<div class="row mt"><button class="btn btn-secondary" data-action="bookmark-news" data-id="${n.id}" aria-pressed="${!!bm}">${I('bookmark', 16)} ${bm ? 'Bookmarked' : 'Bookmark'}</button><button class="btn btn-ghost" data-action="share" data-path="/news/${n.id}">${I('share', 16)} Share</button></div></div></article>
      <h2 class="mt">Related articles</h2><div class="grid g3">${rel.map(newsCard).join('')}</div></div>`;
  }, { layout: 'public', title: 'Article' });

  /* ---------- pricing & checkout ---------- */
  R.add('/pricing', () => {
    const u = PL.auth.user(), cur = u && u.role === 'recruiter' ? PL.q.sub(u.id) : null;
    return `<div class="container section"><div class="center" style="display:block;text-align:center"><h1>Employer plans</h1><p class="muted">Illustrative demo pricing in INR per month. No real payment is taken.</p></div>
      <div class="grid g4 mt">${db().plans.map(p => `<div class="card plan ${p.id === 'growth' ? 'popular' : ''}">${p.id === 'growth' ? '<span class="badge b-blue" style="align-self:flex-start">Most popular</span>' : ''}<h3 style="margin:0">${E(p.name)}</h3><p class="muted small" style="margin:0">${E(p.tagline)}</p><div class="price">${p.price === null ? 'Custom' : p.price === 0 ? '₹0' : F().inr(p.price)}<small class="muted" style="font-size:.8rem;font-weight:400">${p.price ? ' /mo' : ''}</small></div><ul>${p.features.map(f => `<li>${I('check', 16)}${E(f)}</li>`).join('')}</ul><div class="small muted">Job duration: ${p.limits.duration} days</div><div style="flex:1"></div>${cur && cur.planId === p.id && cur.status === 'Active' ? '<button class="btn btn-secondary" disabled>Current plan</button>' : `<button class="btn ${p.id === 'growth' ? '' : 'btn-secondary'}" data-action="choose-plan" data-id="${p.id}">${p.price === null ? 'Contact sales' : p.price === 0 ? 'Start free' : 'Choose ' + E(p.name)}</button>`}</div>`).join('')}</div>
      <div class="card pad mt"><h3>Feature comparison</h3>${ui().table({ cols: [{ label: 'Feature', render: r => r[0] }].concat(db().plans.map((p, i) => ({ label: p.name, render: r => r[i + 1] }))), rows: [['Active jobs'].concat(db().plans.map(p => p.limits.jobs > 900 ? 'Unlimited' : p.limits.jobs)), ['Featured jobs'].concat(db().plans.map(p => p.limits.featured)), ['Contact unlocks / month'].concat(db().plans.map(p => p.limits.resumes > 9000 ? 'Unlimited' : p.limits.resumes)), ['Sponsored campaigns'].concat(db().plans.map(p => p.limits.campaigns))] })}</div></div>`;
  }, { layout: 'public', title: 'Pricing' });
  PL.act('choose-plan', async d => {
    const u = PL.auth.user(), p = PL.q.plan(d.id);
    if (p.price === null) { const r = await ui().ask({ title: 'Contact sales', message: 'Tell us about your hiring needs (demo – not sent).', fields: [{ name: 'company', label: 'Company', required: true }, { name: 'email', label: 'Work email', type: 'email', required: true }], confirmText: 'Send request' }); if (r) ui().toast('Thanks! Our team will get in touch (demo).'); return; }
    if (!u) return PL.auth.requireLogin('/pricing/checkout/' + p.id, 'Sign in or register as an employer to choose a plan.');
    if (u.role !== 'recruiter') return ui().toast('Plans are available to employer accounts.', 'info');
    PL.go('/pricing/checkout/' + p.id);
  });
  R.add('/pricing/checkout/:plan', ctx => {
    const p = PL.q.plan(ctx.params.plan), u = PL.auth.user();
    if (!p || p.price === null) return `<div class="container section">${ui().empty('card', 'Plan not found', '', '<a class="btn" href="#/pricing">View plans</a>')}</div>`;
    return `<div class="container section" style="max-width:860px"><a href="#/pricing" class="small">${I('left', 14)} Plans</a><h1>Checkout (preview)</h1>${ui().notice('<b>Simulated checkout.</b> No payment is processed and card details are never stored.', 'warn')}
      <div class="grid mt" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start"><form class="card pad-lg" data-form="checkout" data-plan="${p.id}" novalidate><h3>Payment details</h3>${ui().field({ name: 'name', label: 'Name on card', required: true, value: u ? u.name : '' })}${ui().field({ name: 'card', label: 'Card number (use 4242 4242 4242 4242)', required: true, pattern: '[\\d ]{16,19}', attrs: ' inputmode="numeric" autocomplete="off"' })}<div class="form-grid">${ui().field({ name: 'exp', label: 'Expiry (MM/YY)', required: true, pattern: '(0[1-9]|1[0-2])/\\d{2}' })}${ui().field({ name: 'cvv', label: 'CVV', required: true, pattern: '\\d{3,4}', attrs: ' autocomplete="off"' })}</div><button class="btn" type="submit">Pay ${F().inr(p.price)} (demo)</button></form>
      <div class="card pad"><h3>Order summary</h3><div class="row between"><span>${E(p.name)} plan</span><b>${F().inr(p.price)}</b></div><div class="row between small muted"><span>GST (18%)</span><span>${F().inr(Math.round(p.price * .18))}</span></div><hr><div class="row between bold"><span>Total</span><span>${F().inr(Math.round(p.price * 1.18))}</span></div></div></div></div>`;
  }, { layout: 'public', title: 'Checkout', roles: ['recruiter'] });
  PL.form('checkout', f => {
    if (!ui().validate(f)) return;
    const u = PL.auth.user(), p = PL.q.plan(f.dataset.plan);
    const card = f.card.value.replace(/\s/g, '');
    if (card === '4000000000000002') { ui().toast('Payment declined (demo failure card).', 'err'); db().invoices.unshift({ id: PL.store.id('inv'), userId: u.id, planId: p.id, amount: p.price, status: 'Failed', createdAt: F().iso() }); PL.store.save(); return; }
    let s = PL.q.sub(u.id); const renew = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    if (s) { s.planId = p.id; s.status = 'Active'; s.renewalDate = renew; } else db().subscriptions.push({ id: PL.store.id('s'), userId: u.id, planId: p.id, status: 'Active', renewalDate: renew, usage: { resumes: 0 } });
    db().invoices.unshift({ id: PL.store.id('inv'), userId: u.id, planId: p.id, amount: Math.round(p.price * 1.18), status: 'Paid', createdAt: F().iso() });
    PL.notify(u.id, 'billing', 'Subscription activated', 'You are now on the ' + p.name + ' plan.', '/employer/subscription');
    PL.store.save(); ui().toast('Payment successful (demo). ' + p.name + ' plan activated.'); PL.go('/employer/subscription');
  });
})();
