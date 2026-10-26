/* Candidate area: dashboard, profile, resume, apply wizard, applications, saved, alerts, network */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt;
  const R = PL.router, CAND = { layout: 'app', roles: ['candidate'] }, BOTH = { layout: 'app', roles: ['candidate', 'recruiter'] };
  const me = () => PL.auth.user();
  const prof = u => (u.profile = u.profile || { education: [], experience: [], skills: [], certifications: [], languages: [], preferences: { roles: [], locations: [] }, privacy: { visibility: 'Public' } });
  const msgPath = uid => (me().role === 'recruiter' ? '/employer/messages' : '/app/messages') + '?u=' + uid;
  PL.msgPath = msgPath;
  const FINAL = ['Hired', 'Rejected', 'Withdrawn'];
  const monthInput = (value, end) => /^\d{4}-\d{2}$/.test(String(value || '')) ? value : /^\d{4}$/.test(String(value || '')) ? value + (end ? '-12' : '-01') : '';
  const monthLabel = value => {
    const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
    return match ? new Date(+match[1], +match[2] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : String(value || '');
  };

  /* ---------- dashboard ---------- */
  R.add('/app/dashboard', () => {
    const u = me(), p = prof(u), apps = PL.q.appsOf(u.id), comp = PL.q.completion(u);
    const by = s => apps.filter(a => a.status === s).length;
    const applied = apps.map(a => a.jobId), prefs = (p.preferences && p.preferences.roles) || [];
    const rec = PL.q.publicJobs().filter(j => !applied.includes(j.id) && (prefs.includes(j.department) || !prefs.length)).slice(0, 3);
    const ints = apps.filter(a => a.interview && a.interview.status === 'Scheduled' && a.interview.date >= F().today()).sort((a, b) => a.interview.date.localeCompare(b.interview.date));
    return `${ui().pageHead('Welcome back, ' + E(u.name.split(' ')[0]), `<a class="btn" href="#/app/jobs">${I('search', 16)} Find jobs</a>`, 'Your job search at a glance.')}
      <div class="grid g4">${ui().kpi('Applications', apps.length, by('Under Review') + ' under review', 'file', '', '/app/applications')}${ui().kpi('Shortlisted', by('Shortlisted') + by('Interview Scheduled'), 'incl. interviews', 'usercheck', 'teal')}${ui().kpi('Saved jobs', PL.q.saved(u.id).length, 'Bookmarked', 'bookmark', 'amber', '/app/saved-jobs')}${ui().kpi('Profile views', p.views || 0, 'Last 30 days (demo)', 'eye', 'green')}</div>
      <div class="grid mt" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);align-items:start"><div class="stack">
        ${ints.length ? `<div class="card pad"><h3>${I('calendar', 18)} Upcoming interviews</h3>${ints.map(a => { const j = PL.q.job(a.jobId); return `<div class="row between" style="padding:8px 0;border-top:1px solid var(--border)"><div><a class="bold" href="#/app/applications/${a.id}">${E(j.title)}</a><div class="small muted">${E(PL.q.company(j.companyId).name)} · ${F().date(a.interview.date)} at ${E(a.interview.time)} · ${E(a.interview.type)}</div></div><a class="btn btn-sm btn-secondary" href="#/app/applications/${a.id}">Details</a></div>`; }).join('')}</div>` : ''}
        <div class="card pad"><div class="row between"><h3 style="margin:0">Recommended for you</h3><a href="#/app/jobs">See all</a></div><div class="stack mt-s">${rec.map(j => PL.cmp.jobCard(j, { base: '/app' })).join('') || '<p class="muted">Update your career preferences to get recommendations.</p>'}</div></div>
        <div class="card pad"><div class="row between"><h3 style="margin:0">Recent applications</h3><a href="#/app/applications">View all</a></div>${apps.length ? ui().table({ rows: apps.slice().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 4), cols: [{ label: 'Job', render: a => `<a href="#/app/applications/${a.id}">${E(PL.q.job(a.jobId).title)}</a>` }, { label: 'Applied', render: a => F().date(a.appliedAt) }, { label: 'Status', render: a => ui().badge(a.status) }] }) : ui().empty('file', 'No applications yet', 'Apply to a job to start tracking it here.')}</div></div>
      <div class="stack"><div class="card pad"><h3>Profile strength</h3><div class="row between small"><span>${comp.pct}% complete</span></div>${ui().progress(comp.pct)}${comp.missing.length ? `<p class="small muted mt-s">Add: ${comp.missing.map(E).join(', ')}</p>` : '<p class="small mt-s">Great – your profile is complete!</p>'}<a class="btn btn-secondary btn-sm" href="#/app/profile">Complete profile</a></div>
        <div class="card pad"><h3>Quick links</h3><div class="stack-sm"><a href="#/app/resume">${I('upload', 14)} Resume</a><a href="#/app/job-alerts">${I('bell', 14)} Job alerts</a><a href="#/app/network">${I('users', 14)} My network</a><a href="#/app/feed">${I('home', 14)} Feed</a></div></div>${PL.ads ? PL.ads.slot('Sidebar') : ''}</div></div>`;
  }, Object.assign({ title: 'Dashboard' }, CAND));

  /* ---------- profile ---------- */
  const sect = (title, body, actions = '', id = '') => `<section class="card pad-lg" ${id ? `id="${id}"` : ''}><div class="row between"><h3 style="margin:0">${title}</h3>${actions}</div><div class="mt-s">${body}</div></section>`;
  const ctl = (own, action, data, label, ic = 'edit') => own ? `<button class="icon-btn" data-action="${action}" ${Object.entries(data).map(([k, v]) => `data-${k}="${E(v)}"`).join(' ')} aria-label="${label}">${I(ic, 16)}</button>` : '';
  function profilePage(ctx) {
    const viewer = me(), id = ctx.params.id || viewer.id, u = PL.q.user(id);
    if (!u || !['candidate', 'recruiter'].includes(u.role)) return ui().empty('user', 'Profile not found', '', '<a class="btn" href="#/app/feed">Back to feed</a>');
    const own = u.id === viewer.id, p = prof(u), priv = p.privacy || {};
    if (!own && priv.visibility === 'Private') return ui().empty('lock', 'This profile is private', 'The member has chosen not to share their profile.');
    if (!own && u.status !== 'Active') return ui().empty('ban', 'Profile unavailable', 'This account is not active.');
    if (!own && viewer.role === 'recruiter') {
      PL.state.profileViewSeen = PL.state.profileViewSeen || {};
      const key = viewer.id + ':' + u.id;
      if (!PL.state.profileViewSeen[key]) { p.views = (Number(p.views) || 0) + 1; PL.state.profileViewSeen[key] = true; PL.store.save(); }
    }
    const status = own ? null : PL.q.connStatus(viewer.id, u.id), co = PL.q.companyOf(u);
    const showContact = own || (priv.showEmail && priv.showPhone) || (viewer.role === 'recruiter' && (db().unlocked[viewer.id] || []).includes(u.id)) || status === 'connected';
    const connBtn = own ? '' : status === 'connected' ? `<button class="btn btn-secondary" disabled>${I('usercheck', 16)} Connected</button>` : status === 'sent' ? `<button class="btn btn-secondary" data-action="conn-withdraw" data-id="${u.id}">Pending – withdraw</button>` : status === 'received' ? `<button class="btn" data-action="conn-accept" data-id="${u.id}">Accept request</button>` : `<button class="btn" data-action="conn-send" data-id="${u.id}">${I('userplus', 16)} Connect</button>`;
    const fol = !own && PL.q.follows(viewer.id).users.includes(u.id);
    const skills = p.skills || [], roles = (p.preferences && p.preferences.roles) || [];
    const posts = db().posts.filter(x => x.authorId === u.id && !x.removed && (own || x.visibility === 'Public')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
    const apps = PL.q.appsOf(u.id).slice().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 3);
    const activity = posts.map(x => `<article class="li-activity"><b>Shared an update</b><p>${E(x.content)}</p><span class="xs muted">${F().ago(x.createdAt)}</span></article>`).concat(apps.map(x => {
      const j = PL.q.job(x.jobId);
      return j ? `<article class="li-activity"><b>Applied for a job</b><p><a href="#/job/${j.id}">${E(j.title)}</a> at ${E((PL.q.company(j.companyId) || {}).name || '')}</p><span class="xs muted">${F().ago(x.appliedAt)}</span></article>` : '';
    }).filter(Boolean)).slice(0, 4);
    const preferenceWords = [...skills, ...roles].map(x => String(x).toLowerCase());
    const recJobs = PL.q.publicJobs().map(j => {
      const searchable = [j.title, j.department, ...(j.skills || [])].join(' ').toLowerCase();
      return { job: j, score: preferenceWords.filter(w => w.length > 2 && searchable.includes(w)).length };
    }).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.job);
    const followed = PL.q.follows(u.id).companies;
    const recCompanies = db().companies.filter(x => !followed.includes(x.id)).map(c => {
      const jobs = PL.q.publicJobs().filter(j => j.companyId === c.id);
      return { company: c, jobs, score: jobs.filter(j => roles.includes(j.department)).length };
    }).sort((a, b) => b.score - a.score || b.jobs.length - a.jobs.length).slice(0, 3);
    const experience = (p.experience || []).map(x => `<article class="li-entry">${ui().logo(x.company || 'Company', 42)}<div class="grow"><b>${E(x.title || 'Professional experience')}</b><div>${E(x.company || '')}</div><div class="small muted">${E([x.from, x.to || 'Present'].filter(Boolean).join(' – '))}</div>${x.desc ? `<p>${E(x.desc)}</p>` : ''}</div>${own ? (u.role === 'candidate' ? `<a class="icon-btn" href="#/app/profile/experience/${E(x.id)}?return=profile" aria-label="Edit experience">${I('edit', 16)}</a>` : ctl(true, 'prof-edit', { sec: 'exp', id: x.id }, 'Edit experience')) + ctl(true, 'prof-del', { sec: 'exp', id: x.id }, 'Delete experience', 'trash') : ''}</article>`).join('');
    const education = (p.education || []).map(x => `<article class="li-entry">${I('grad', 26)}<div class="grow"><b>${E(x.degree || x.level || 'Education')}</b><div>${E(x.institute || '')}</div><div class="small muted">${E(x.year || (x.current ? 'Currently pursuing' : ''))}</div></div>${own ? (u.role === 'candidate' ? `<a class="icon-btn" href="#/onboarding?edit=education" aria-label="Edit education">${I('edit', 16)}</a>` : ctl(true, 'prof-edit', { sec: 'edu', id: x.id }, 'Edit education')) + ctl(true, 'prof-del', { sec: 'edu', id: x.id }, 'Delete education', 'trash') : ''}</article>`).join('');
    const analytics = own ? `<section class="li-card li-analytics"><h2>Analytics</h2><p class="small muted">Your activity in this demo</p><div class="li-stats"><div><b>${Number(p.views) || 0}</b><span>Profile views</span></div><div><b>${PL.q.appsOf(u.id).length}</b><span>Applications</span></div><div><b>${PL.q.saved(u.id).length}</b><span>Saved jobs</span></div></div></section>` : '';
    if (own && u.role === 'candidate') {
      const preview = !!ctx.query.preview, completion = PL.q.completion(u);
      const acceptedConnections = db().connections.filter(x => x.status === 'accepted' && (x.requesterId === u.id || x.recipientId === u.id)).length;
      const profileTitle = p.title || (p.headline || '').split('|')[0] || 'Add your professional title';
      const rawHeadline = String(p.headline || '');
      const profileHeadline = rawHeadline.toLowerCase().startsWith((profileTitle + ' |').toLowerCase()) ? rawHeadline.slice(profileTitle.length + 3) : rawHeadline;
      const expRows = (p.experience || []).slice(0, preview ? 2 : 1).map(x => `<article class="cp-entry"><span class="cp-entry-icon">${I('briefcase', 18)}</span><div class="cp-entry-copy"><b>${E(x.title || 'Professional experience')}</b><span>${E(x.company || '')}${x.location ? ` · ${E(x.location)}` : ''}</span><small>${E([monthLabel(x.from), x.to === 'Present' || x.current ? 'Present' : monthLabel(x.to)].filter(Boolean).join(' – '))}</small>${x.desc ? `<p>${E(x.desc)}</p>` : ''}</div>${!preview ? `<div class="cp-entry-actions"><a href="#/app/profile/experience/${E(x.id)}?return=profile" class="cp-icon-link" aria-label="Edit experience">${I('edit', 15)}</a>${ctl(true, 'prof-del', { sec: 'exp', id: x.id }, 'Delete experience', 'trash')}</div>` : ''}</article>`).join('');
      const eduRows = (p.education || []).map(x => `<article class="cp-entry"><span class="cp-entry-icon">${I('grad', 18)}</span><div class="cp-entry-copy"><b>${E(x.degree || x.level || 'Education')}</b><span>${E(x.institute || '')}</span><small>${E(x.year || (x.current ? 'Currently pursuing' : ''))}</small></div>${!preview ? `<div class="cp-entry-actions"><a href="#/onboarding?edit=education" class="cp-icon-link" aria-label="Edit education">${I('edit', 15)}</a>${ctl(true, 'prof-del', { sec: 'edu', id: x.id }, 'Delete education', 'trash')}</div>` : ''}</article>`).join('');
      const skillTags = (p.skills || []).map(x => `<span>${E(x)}</span>`).join('');
      const interestTags = [...roles, ...(p.languages || []), ...(p.certifications || []).map(x => x.name)].filter(Boolean).map(x => `<span>${E(x)}</span>`).join('');
      const activityRows = activity.slice(0, 3).join('');
      return `<div class="li-profile candidate-profile-screen">
        <section class="cp-card cp-hero ${preview ? 'cp-public-hero' : 'cp-private-hero'}"><div class="cp-cover ${p.coverImg ? 'has-image' : ''}">${p.coverImg ? `<img src="${p.coverImg}" alt="">` : ''}${!preview ? `<button type="button" class="cp-cover-btn" data-action="prof-cover" aria-label="Change profile banner">${I('image', 15)} <span>Edit banner</span></button>` : ''}</div><div class="cp-hero-body"><div class="cp-identity"><div class="cp-avatar">${ui().avatar(u, 72)}${!preview ? `<button type="button" class="cp-photo-btn" data-action="prof-photo" aria-label="Change photo">${I('image', 15)}</button>` : ''}</div><div class="cp-identity-copy"><h1>${E(u.name)} ${u.verified ? `<span class="verified" title="Verified">${I('shield', 15)}</span>` : ''}</h1><p class="cp-title">${E(profileTitle)}</p>${profileHeadline ? `<p class="cp-headline">${E(profileHeadline)}</p>` : ''}<div class="cp-location">${I('pin', 14)} ${E(u.location || 'Add your location')}${p.company ? ` · ${E(p.company)}` : ''}</div></div></div>${preview ? `<div class="cp-hero-actions"><button type="button" class="btn btn-secondary btn-sm" data-action="profile-share">${I('share', 14)} Share profile</button></div>` : ''}</div></section>
        ${preview ? `<div class="cp-preview-label">${I('eye', 14)} Public profile preview</div><nav class="cp-profile-tabs" aria-label="Profile sections"><a href="#profile-about">About</a><a href="#profile-experience">Experience</a><a href="#profile-education">Education</a><a href="#profile-skills">Skills</a></nav>` : `<section class="cp-card cp-completion-card"><div class="cp-completion-heading"><b>Profile Completion</b><strong>${completion.pct}%</strong></div>${ui().progress(completion.pct)}<p>Complete your profile to get more job matches</p><div class="cp-completion-actions"><a class="btn btn-secondary btn-sm" href="#/app/profile/completion">Complete Profile</a><a href="#/app/profile/analytics">${I('chart', 14)} Profile Analytics</a></div></section><section class="cp-card cp-section cp-inline-analytics"><div class="cp-section-head"><h2>Profile Analytics</h2><a href="#/app/profile/analytics">View all</a></div><div class="cp-analytics-grid"><div><b>${Number(p.views) || 0}</b><span>Profile Views</span></div><div><b>${Number(p.resumeDownloads) || 0}</b><span>Resume Downloads</span></div><div><b>${Number(p.searchAppearances) || 0}</b><span>Search Appearances</span></div></div><p class="cp-analytics-note">Browser-local prototype totals; demo profiles may include sample starting counts.</p></section>`}
        <section class="cp-card cp-section" id="profile-about"><div class="cp-section-head"><h2>About</h2>${!preview ? `<a href="#/app/profile/edit" aria-label="Edit about">${I('edit', 15)}</a>` : ''}</div><p class="cp-about">${E(p.about || 'Add a short professional summary to introduce yourself.')}</p></section>
        ${!preview ? `<div class="cp-ad-wrap"><span>Advertisement</span><a class="cp-promo" href="#/job-search"><span><b>Grow Your Career<br>with PharmaLinkIn</b><small>Get noticed by top recruiters</small><strong>Explore Now ${I('right', 14)}</strong></span><span class="cp-promo-art">${I('briefcase', 30)}</span></a></div>` : ''}
        <section class="cp-card cp-section" id="profile-experience"><div class="cp-section-head"><h2>Experience</h2>${!preview ? `<div class="cp-section-actions"><a href="#/app/profile/experience/new?return=profile" aria-label="Add experience">${I('plus', 16)}</a><a href="#/app/profile/experience">View All</a></div>` : ''}</div>${expRows || '<p class="cp-empty">No experience added yet.</p>'}</section>
        ${!preview ? `<section class="cp-card cp-section cp-resume-card"><div class="cp-section-head"><h2>Resume</h2><button type="button" class="cp-text-action" data-action="resume-upload">${I('upload', 15)} ${p.resume ? 'Update' : 'Upload'}</button></div>${p.resume ? `<div class="cp-resume-file">${I('file', 24)}<span><b>${E(p.resume.name)}</b><small>${E(p.resume.type || 'Resume')} · ${F().size(p.resume.size)} · Uploaded ${F().date(p.resume.uploadedAt)}</small></span></div><p class="cp-analytics-note">This prototype saves the file name and details locally; it does not store the file itself.</p>` : `<p class="cp-empty">No uploaded resume yet. Add a PDF or Word file to use for applications.</p>`}</section>` : ''}
        <section class="cp-card cp-section" id="profile-education"><div class="cp-section-head"><h2>Education</h2>${!preview ? `<div class="cp-section-actions"><a href="#/onboarding?edit=education" aria-label="Add or edit education">${I('plus', 16)}</a></div>` : ''}</div>${eduRows || '<p class="cp-empty">No education added yet.</p>'}</section>
        <section class="cp-card cp-section" id="profile-skills"><div class="cp-section-head"><h2>Skills</h2>${!preview ? `<a href="#/onboarding?edit=skills" aria-label="Edit skills">${I('edit', 15)}</a>` : ''}</div><div class="cp-skills">${skillTags || '<span class="cp-empty">Add your professional skills.</span>'}</div></section>
        <section class="cp-card cp-section" id="profile-interests"><div class="cp-section-head"><h2>Interests</h2>${!preview ? `<a href="#/onboarding?edit=interests" aria-label="Edit interests">${I('edit', 15)}</a>` : ''}</div><div class="cp-skills">${interestTags || '<span class="cp-empty">Add career interests, languages, and certifications.</span>'}</div></section>
        <section class="cp-card cp-section" id="profile-activity"><div class="cp-section-head"><h2>Activity</h2>${!preview ? `<a href="#/app/feed">See all</a>` : ''}</div>${activityRows || `<p class="cp-empty">${preview ? 'No recent activity yet.' : 'You have not shared any updates yet.'}</p>`}${!preview && !activityRows ? `<a class="cp-activity-cta" href="#/app/feed">${I('plus', 14)} Start a post</a>` : ''}</section>
        <section class="cp-card cp-section"><div class="cp-section-head"><h2>Recommended Jobs</h2><a href="#/job-results">View All</a></div>${recJobs.slice(0, 2).map(j => `<a class="cp-job-row" href="#/job/${j.id}">${ui().logo(PL.q.company(j.companyId) || { name: 'Company' }, 38)}<span><b>${E(j.title)}</b><small>${E((PL.q.company(j.companyId) || {}).name || '')} · ${E(j.city)}</small></span>${I('right', 15)}</a>`).join('') || '<p class="cp-empty">No job recommendations yet.</p>'}</section>
        <section class="cp-card cp-section"><div class="cp-section-head"><h2>Recommended Companies</h2><a href="#/job-search">Explore jobs</a></div>${recCompanies.slice(0, 2).map(x => `<a class="cp-job-row" href="#/companies/${x.company.id}">${ui().logo(x.company, 38)}<span><b>${E(x.company.name)}</b><small>${E(x.company.industry)} · ${x.jobs.length} open ${x.jobs.length === 1 ? 'role' : 'roles'}</small></span>${I('right', 15)}</a>`).join('') || '<p class="cp-empty">No company recommendations yet.</p>'}</section>
      </div>`;
    }
    const actionControls = own ? `<button class="btn btn-secondary btn-sm" data-action="prof-basic">${I('edit', 14)} Edit profile</button>` : `${connBtn}<a class="btn btn-secondary btn-sm" href="#${msgPath(u.id)}">${I('message', 16)} Message</a><button class="btn btn-ghost btn-sm" data-action="follow-user" data-id="${u.id}">${fol ? 'Following' : 'Follow'}</button>${ui().menu([{ label: 'Report profile', action: 'report', icon: 'flag', data: { type: 'user', id: u.id } }], { label: 'More' })}${viewer.role === 'recruiter' && u.role === 'candidate' ? `<button class="btn btn-ghost btn-sm" data-action="save-cand" data-id="${u.id}">${I('bookmark', 14)} ${(db().savedCandidates[viewer.id] || []).includes(u.id) ? 'Saved' : 'Save candidate'}</button>` : ''}`;
    return `<div class="li-profile">
      <section class="li-card li-hero"><div class="li-cover"><img src="${p.coverImg || ui().art(u.id + 'c', '', 1200, 300)}" alt=""></div><div class="li-hero-body"><div class="li-hero-top"><div class="li-avatar">${ui().avatar(u, 92)}${own ? `<button type="button" class="li-photo-btn" data-action="prof-photo" aria-label="Change profile photo">${I('image', 16)}</button>` : ''}</div><div class="li-actions">${actionControls}</div></div>
        <h1>${E(u.name)} ${u.verified ? `<span class="verified" title="Verified">${I('shield', 16)}</span>` : ''}</h1><p class="li-title">${E(p.title || (p.headline || '').split('|')[0] || '')}</p><p class="li-headline">${E(p.headline || '')}</p><div class="li-location">${E(u.location || '')}${co ? ' · ' + E(co.name) : ''}</div>${showContact ? `<div class="li-contact">${I('mail', 14)} ${E(u.email)}${u.phone ? ` <span>·</span> ${I('phone', 14)} ${E(u.phone)}` : ''}</div>` : (u.role === 'candidate' ? '<div class="xs muted mt-s">Contact details are hidden by the member’s privacy settings.</div>' : '')}
        ${own ? `<div class="li-completion"><div class="row between small"><b>Profile completion</b><b>${PL.q.completion(u).pct}%</b></div>${ui().progress(PL.q.completion(u).pct)}<a href="#/onboarding">Complete your profile to get more job matches</a></div>` : ''}</div></section>
      <div class="li-columns"><div class="li-main">
        ${sect('About', `<p class="li-about">${E(p.about) || '<span class="muted">Add a short professional summary to introduce yourself.</span>'}</p>`, ctl(own, 'prof-basic', {}, 'Edit about'))}
        ${sect('Experience', experience || '<p class="muted">No experience added yet.</p>', own ? u.role === 'candidate' ? `<a class="btn btn-secondary btn-sm" href="#/app/profile/experience/new?return=profile">${I('plus', 14)} Add experience</a>` : `<button class="btn btn-secondary btn-sm" data-action="prof-add" data-sec="exp">${I('plus', 14)} Add experience</button>` : '', 'profile-experience')}
        ${sect('Education', education || '<p class="muted">No education added yet.</p>', own ? u.role === 'candidate' ? `<a class="btn btn-secondary btn-sm" href="#/onboarding?edit=education">${I('plus', 14)} Add education</a>` : `<button class="btn btn-secondary btn-sm" data-action="prof-add" data-sec="edu">${I('plus', 14)} Add education</button>` : '', 'profile-education')}
        ${sect('Interests', `<div class="li-tags">${[...roles, ...skills, ...(p.languages || []), ...(p.certifications || []).map(x => x.name)].filter(Boolean).map(x => `<span>${E(x)}</span>`).join('') || '<span class="muted">Add skills, roles, and professional interests.</span>'}</div>`, own ? u.role === 'candidate' ? `<div class="li-edit-links"><a href="#/onboarding?edit=interests">${I('edit', 14)} Interests</a><a href="#/onboarding?edit=certifications">${I('edit', 14)} Certifications</a><a href="#/onboarding?edit=languages">${I('edit', 14)} Languages</a></div>` : ctl(true, 'prof-list', { sec: 'skills' }, 'Edit interests') : '', 'profile-interests')}
        ${sect('Activity', activity.length ? activity.join('') : '<p class="muted">No recent activity yet.</p>')}
      </div><aside class="li-aside">${analytics}
        <section class="li-card li-recommend"><h2>Recommended jobs</h2>${recJobs.length ? recJobs.map(j => `<a class="li-recommend-row" href="#/job/${j.id}">${ui().logo(PL.q.company(j.companyId) || { name: 'Company' }, 42)}<span><b>${E(j.title)}</b><small>${E((PL.q.company(j.companyId) || {}).name || '')} · ${E(j.city)}</small></span></a>`).join('') : '<p class="small muted">No job recommendations yet.</p>'}<a class="li-more" href="#/job-results">Explore jobs</a></section>
        <section class="li-card li-recommend"><h2>Recommended companies</h2>${recCompanies.length ? recCompanies.map(x => `<a class="li-recommend-row" href="#/companies/${x.company.id}">${ui().logo(x.company, 42)}<span><b>${E(x.company.name)}</b><small>${E(x.company.industry)} · ${x.jobs.length} open ${x.jobs.length === 1 ? 'role' : 'roles'}</small></span></a>`).join('') : '<p class="small muted">No company recommendations yet.</p>'}<a class="li-more" href="#/job-search">Browse companies hiring</a></section>
        ${own ? sect('Career preferences & privacy', `<dl class="kv"><dt>Preferred roles</dt><dd>${E(roles.join(', ') || '—')}</dd><dt>Locations</dt><dd>${E(((p.preferences || {}).locations || []).join(', ') || '—')}</dd><dt>Expected salary</dt><dd>${E((p.preferences || {}).salary || '—')}</dd><dt>Visibility</dt><dd>${E(priv.visibility || 'Public')}</dd><dt>Email shown</dt><dd>${priv.showEmail ? 'Yes' : 'No'}</dd><dt>Phone shown</dt><dd>${priv.showPhone ? 'Yes' : 'No'}</dd></dl>`, `<button class="btn btn-secondary btn-sm" data-action="prof-prefs">${I('edit', 14)} Edit</button>`) : ''}
      </aside></div></div>`;
  }
  R.add('/app/profile', ctx => {
    const html = profilePage(ctx);
    return ctx.query.focus ? { html, after: () => setTimeout(() => { const target = document.getElementById('profile-' + ctx.query.focus); if (target) target.scrollIntoView({ block: 'start' }); }, 0) } : html;
  }, Object.assign({ title: 'My profile' }, BOTH));

  R.add('/app/profile/edit', () => {
    const u = me(), p = prof(u);
    return `<div class="cp-form-page"><form class="cp-card cp-form" data-form="profile-edit" novalidate><div class="cp-form-photo"><div class="cp-avatar">${ui().avatar(u, 78)}<button type="button" class="cp-photo-btn" data-action="prof-photo" aria-label="Change photo">${I('camera', 15)}</button></div><button type="button" class="link-btn" data-action="prof-photo">Change Photo</button></div>
      ${ui().field({ name: 'name', label: 'Full Name', required: true, value: u.name })}${ui().field({ name: 'phone', label: 'Mobile Number', type: 'tel', required: true, value: u.phone })}${ui().field({ name: 'email', label: 'Email Address', type: 'email', value: u.email, disabled: true, help: 'Email address cannot be changed in this prototype.' })}${ui().field({ name: 'title', label: 'Designation', required: true, value: p.title || '' })}${ui().field({ name: 'company', label: 'Company', value: p.company || '' })}${ui().field({ name: 'location', label: 'Location', value: u.location || '' })}${ui().field({ name: 'headline', label: 'Professional Headline', value: p.headline || '', full: true })}${ui().field({ name: 'about', label: 'About Me', type: 'textarea', rows: 5, value: p.about || '', full: true })}<button class="btn cp-form-submit" type="submit">Save Changes</button></form></div>`;
  }, Object.assign({ title: 'Edit profile' }, CAND));
  R.add('/app/profile/experience', () => {
    const p = prof(me()), rows = p.experience || [];
    return `<div class="cp-form-page cp-experience-page"><section class="cp-card cp-section"><div class="cp-section-head"><h2>Experience</h2><a class="btn btn-sm" href="#/app/profile/experience/new?return=profile">${I('plus', 14)} Add Experience</a></div>${rows.length ? rows.map(x => `<article class="cp-exp-row"><span class="cp-entry-icon">${I('briefcase', 18)}</span><div class="cp-entry-copy"><b>${E(x.title || 'Professional experience')}</b><span>${E(x.company || '')}</span><small>${E([monthLabel(x.from), x.to === 'Present' || x.current ? 'Present' : monthLabel(x.to)].filter(Boolean).join(' – '))}</small>${x.location ? `<small>${E(x.location)}</small>` : ''}${x.desc ? `<p>${E(x.desc)}</p>` : ''}</div><div class="cp-entry-actions"><a href="#/app/profile/experience/${E(x.id)}?return=profile" class="cp-icon-link" aria-label="Edit experience">${I('edit', 15)}</a>${ctl(true, 'prof-del', { sec: 'exp', id: x.id }, 'Delete experience', 'trash')}</div></article>`).join('') : '<p class="cp-empty">No experience added yet.</p>'}</section></div>`;
  }, Object.assign({ title: 'Experience' }, CAND));
  R.add('/app/profile/experience/:id', ctx => {
    const u = me(), p = prof(u), isNew = ctx.params.id === 'new';
    const item = isNew ? null : (p.experience || []).find(x => x.id === ctx.params.id);
    if (!isNew && !item) return ui().empty('briefcase', 'Experience not found', '', '<a class="btn" href="#/app/profile/experience">Back to experience</a>');
    const returningToProfile = ctx.query.return === 'profile';
    const current = !!(item && (item.current || item.to === 'Present')), currentMonth = new Date().toISOString().slice(0, 7);
    return `<div class="cp-form-page"><form class="cp-card cp-form cp-exp-form" data-form="profile-experience" data-id="${isNew ? '' : E(item.id)}" data-mode="${isNew ? 'new' : 'edit'}" data-return="${returningToProfile ? 'profile' : 'list'}" novalidate><h1>${isNew ? 'Add Experience' : 'Edit Experience'}</h1>
      ${ui().field({ name: 'title', label: 'Designation', required: true, value: item && item.title || '', placeholder: 'Select designation' })}${ui().field({ name: 'company', label: 'Company', required: true, value: item && item.company || '', placeholder: 'Enter company name' })}${ui().field({ name: 'location', label: 'Location', required: true, value: item && item.location || u.location || '', placeholder: 'Select location' })}<div class="cp-date-fields">${ui().field({ name: 'from', label: 'From', type: 'month', required: true, value: item && monthInput(item.from) || '', attrs: ' min="1940-01" max="' + currentMonth + '"' })}${ui().field({ name: 'to', label: 'To', type: 'month', required: !current, disabled: current, value: item && !current ? monthInput(item.to, true) : '', attrs: ' min="1940-01" max="' + currentMonth + '"' })}</div>${ui().field({ name: 'current', label: 'I currently work here', type: 'checkbox', value: current, attrs: ' data-live="profile-current"' })}${ui().field({ name: 'desc', label: 'Description', type: 'textarea', rows: 5, required: true, full: true, value: item && item.desc || '', placeholder: 'Enter description' })}<button class="btn cp-form-submit" type="submit">Save Changes</button></form></div>`;
  }, Object.assign({ title: 'Experience' }, CAND));
  R.add('/app/profile/analytics', () => {
    const u = me(), p = prof(u);
    return `<div class="cp-form-page cp-analytics-page"><section class="cp-card cp-section"><div class="cp-section-head"><div><h2>Profile Analytics</h2><p class="cp-analytics-subtitle">Your profile performance at a glance</p></div><span class="cp-private">${I('eye', 13)} Only you</span></div><div class="cp-analytics-grid"><div><b>${Number(p.views) || 0}</b><span>Profile Views</span></div><div><b>${Number(p.resumeDownloads) || 0}</b><span>Resume Downloads</span></div><div><b>${Number(p.searchAppearances) || 0}</b><span>Search Appearances</span></div></div><p class="cp-analytics-note">Browser-local prototype totals; demo profiles may include sample starting counts. Resume downloads count generated resume export attempts.</p></section><section class="cp-card cp-section"><div class="cp-section-head"><h2>Who Viewed Your Profile</h2></div><p class="cp-empty">Viewer identities are not available in this prototype.</p></section></div>`;
  }, Object.assign({ title: 'Profile analytics' }, CAND));
  R.add('/app/profile/completion', () => {
    const u = me(), p = prof(u), checks = [
      ['Professional headline', !!p.headline, '#/app/profile/edit'],
      ['About Me', (p.about || '').length > 30, '#/app/profile/edit'],
      ['Location', !!u.location, '#/app/profile/edit'],
      ['Education', (p.education || []).length > 0, '#/onboarding?edit=education'],
      ['Work experience', (p.experience || []).length > 0, '#/app/profile/experience/new?return=profile'],
      ['At least 3 skills', (p.skills || []).length >= 3, '#/onboarding?edit=skills'],
      ['Certifications', (p.certifications || []).length > 0, '#/onboarding?edit=certifications'],
      ['Languages', (p.languages || []).length > 0, '#/onboarding?edit=languages'],
      ['Resume ready', PL.q.hasResume(u), '#/app/resume'],
      ['Career preferences', !!(p.preferences && p.preferences.roles && p.preferences.roles.length), '#/onboarding?edit=interests']
    ];
    const pct = PL.q.completion(u).pct;
    const next = checks.find(([, done]) => !done);
    return `    <div class="cp-form-page"><section class="cp-card cp-section cp-completion-detail"><div class="cp-completion-score"><span>${pct}%</span><b>Profile Completion</b><small>Profiles with complete information get more job matches.</small></div>${ui().progress(pct)}<h2>Complete These Sections</h2><div class="cp-checklist">${checks.map(([label, done, href]) => `<a href="${href}" class="${done ? 'done' : ''}"><span class="cp-checkmark ${done ? 'done' : ''}">${done ? I('checkc', 16) : ''}</span>${label}${I('right', 15)}</a>`).join('')}</div>${next ? `<a class="btn cp-form-submit" href="${next[2]}">Complete Next Item: ${next[0]}</a>` : '<p class="cp-empty">Your profile is complete.</p>'}</section></div>`;
  }, Object.assign({ title: 'Profile completion' }, CAND));
  R.add('/app/profile/:id', profilePage, Object.assign({ title: 'Profile' }, BOTH));

  const SEC = {
    exp: { key: 'experience', label: 'experience', fields: [{ name: 'title', label: 'Job title', required: true }, { name: 'company', label: 'Company', required: true }, { name: 'from', label: 'From (year)', required: true, pattern: '\\d{4}' }, { name: 'to', label: 'To (year or Present)', required: true }, { name: 'desc', label: 'Description', type: 'textarea', rows: 3, full: true }] },
    edu: { key: 'education', label: 'education', fields: [{ name: 'degree', label: 'Degree', required: true }, { name: 'institute', label: 'Institute', required: true }, { name: 'year', label: 'Year', required: true, pattern: '\\d{4}' }] },
    cert: { key: 'certifications', label: 'certification', fields: [{ name: 'name', label: 'Certification', required: true }, { name: 'issuer', label: 'Issuer', required: true }, { name: 'year', label: 'Year', required: true, pattern: '\\d{4}' }] }
  };
  const withVal = (fields, o) => fields.map(f => Object.assign({}, f, { value: o ? o[f.name] : '' }));
  PL.act('prof-basic', async () => {
    const u = me(), p = prof(u);
    const r = await ui().ask({ title: 'Edit profile', grid: true, fields: [{ name: 'name', label: 'Full name', required: true, value: u.name }, { name: 'location', label: 'Location', value: u.location }, { name: 'headline', label: 'Headline', required: true, value: p.headline, full: true }, { name: 'qualification', label: 'Qualification', type: 'select', placeholder: 'Select', options: PL.QUALS, value: p.qualification }, { name: 'experienceYears', label: 'Experience (years)', type: 'number', min: 0, max: 50, value: p.experienceYears }, { name: 'about', label: 'About', type: 'textarea', rows: 5, full: true, value: p.about }] });
    if (!r) return; u.name = r.name; u.location = r.location; Object.assign(p, { headline: r.headline, qualification: r.qualification, experienceYears: Number(r.experienceYears) || 0, about: r.about, title: r.headline.split('|')[0].trim() });
    PL.store.save(); ui().toast('Profile updated'); PL.rerender();
  });
  async function secForm(sec, existing) {
    const s = SEC[sec]; return ui().ask({ title: (existing ? 'Edit ' : 'Add ') + s.label, grid: true, fields: withVal(s.fields, existing) });
  }
  PL.act('prof-add', async d => { const r = await secForm(d.sec); if (!r) return; r.id = PL.store.id('x'); const p = prof(me()); (p[SEC[d.sec].key] = p[SEC[d.sec].key] || []).push(r); PL.store.save(); ui().toast('Added'); PL.rerender(); });
  PL.act('prof-edit', async d => { const p = prof(me()), o = p[SEC[d.sec].key].find(x => x.id === d.id), r = await secForm(d.sec, o); if (!r) return; Object.assign(o, r); PL.store.save(); ui().toast('Updated'); PL.rerender(); });
  PL.act('prof-del', async d => { if (!(await ui().confirm({ title: 'Delete this entry?', confirmText: 'Delete', danger: true }))) return; const a = prof(me())[SEC[d.sec].key], i = a.findIndex(x => x.id === d.id); if (i < 0) return ui().toast('This profile entry is no longer available.', 'err'); a.splice(i, 1); PL.store.save(); PL.rerender(); });
  PL.act('prof-list', async d => { const p = prof(me()), r = await ui().ask({ title: 'Edit ' + d.sec, message: 'Separate items with commas.', fields: [{ name: 'v', label: d.sec === 'skills' ? 'Skills' : 'Languages', type: 'textarea', rows: 3, value: (p[d.sec] || []).join(', ') }] }); if (!r) return; p[d.sec] = ui().split(r.v); PL.store.save(); PL.rerender(); });
  PL.act('prof-prefs', async () => {
    const p = prof(me()), pr = (p.preferences = p.preferences || {}), pv = (p.privacy = p.privacy || {});
    const r = await ui().ask({ title: 'Career preferences & privacy', grid: true, fields: [{ name: 'roles', label: 'Preferred roles (comma separated)', value: (pr.roles || []).join(', '), full: true }, { name: 'locations', label: 'Preferred locations', value: (pr.locations || []).join(', ') }, { name: 'salary', label: 'Expected salary', value: pr.salary }, { name: 'visibility', label: 'Profile visibility', type: 'select', options: ['Public', 'Private'], value: pv.visibility || 'Public' }, { name: 'showEmail', label: 'Show email on profile', type: 'checkbox', value: pv.showEmail }, { name: 'showPhone', label: 'Show phone on profile', type: 'checkbox', value: pv.showPhone }] });
    if (!r) return; pr.roles = ui().split(r.roles); pr.locations = ui().split(r.locations); pr.salary = r.salary; Object.assign(pv, { visibility: r.visibility, showEmail: r.showEmail, showPhone: r.showPhone }); PL.store.save(); ui().toast('Preferences saved'); PL.rerender();
  });
  PL.act('prof-photo', () => ui().pickImage(data => { me().photo = data; PL.store.save(); ui().toast('Photo updated'); PL.rerender(); }));
  PL.act('prof-cover', () => ui().pickImage(data => { const p = prof(me()); p.coverImg = data; PL.store.save(); ui().toast('Profile banner updated'); PL.rerender(); }));
  PL.act('resume-upload', () => ui().pickFile('.pdf,.doc,.docx', file => {
    if (!/\.(pdf|docx?)$/i.test(file.name)) return ui().toast('Please choose a PDF or Word file.', 'err');
    if (file.size > 2 * 1048576) return ui().toast('File is larger than 2 MB.', 'err');
    prof(me()).resume = { name: file.name, type: file.type || 'Resume file', size: file.size, uploadedAt: F().iso(), visibility: 'Recruiters only' };
    PL.store.save(); ui().toast('Resume details updated'); PL.rerender();
  }));
  PL.form('profile-edit', f => {
    if (!ui().validate(f)) return;
    const d = ui().formData(f), u = me(), p = prof(u);
    Object.assign(u, { name: d.name, phone: d.phone, location: d.location });
    Object.assign(p, { title: d.title, company: d.company, headline: d.headline || d.title, about: d.about });
    PL.store.save(); ui().toast('Profile updated'); PL.go('/app/profile');
  });
  PL.form('profile-experience', f => {
    if (!ui().validate(f)) return;
    const d = ui().formData(f), u = me(), p = prof(u), current = f.dataset.mode === 'new';
    const latestMonth = new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(d.from) || d.from < '1940-01' || d.from > latestMonth) { ui().setError(f, 'from', 'Choose a valid start month between January 1940 and the current month.'); f.elements.namedItem('from').focus(); return; }
    if (!d.current && (!/^\d{4}-\d{2}$/.test(d.to) || d.to < '1940-01' || d.to > latestMonth)) { ui().setError(f, 'to', 'Choose a valid end month between January 1940 and the current month.'); f.elements.namedItem('to').focus(); return; }
    if (!d.current && d.to < d.from) { ui().setError(f, 'to', 'End date cannot be before the start date.'); f.elements.namedItem('to').focus(); return; }
    const item = current ? { id: PL.store.id('x') } : (p.experience || []).find(x => x.id === f.dataset.id);
    if (!item) return ui().toast('This experience entry is no longer available.', 'err');
    Object.assign(item, { title: d.title, company: d.company, location: d.location, from: d.from, to: d.current ? 'Present' : d.to, current: d.current, desc: d.desc });
    if (current) (p.experience = p.experience || []).push(item);
    if (d.current || (p.experience || [])[0] === item) { p.title = d.title; p.company = d.company; }
    PL.store.save(); ui().toast(current ? 'Experience added' : 'Experience updated'); PL.go(f.dataset.return === 'profile' ? '/app/profile?focus=experience' : '/app/profile/experience');
  });
  PL.live['profile-current'] = el => {
    const end = el.form.elements.namedItem('to');
    if (!end) return;
    end.required = !el.checked;
    end.disabled = el.checked;
    if (el.checked) { end.value = ''; end.removeAttribute('aria-invalid'); const err = end.closest('.field').querySelector('.err'); if (err) err.textContent = ''; }
  };
  PL.act('profile-share', () => {
    const link = ui().url('/app/profile?preview=1');
    if (navigator.share) {
      navigator.share({ title: me().name + ' | PharmaLinkIn', url: link }).catch(error => { if (error.name !== 'AbortError') ui().toast('Unable to share your profile.', 'err'); });
    } else ui().copy(link);
  });
  PL.act('save-cand', d => { const u = me(), l = (db().savedCandidates[u.id] = db().savedCandidates[u.id] || []), i = l.indexOf(d.id); if (i >= 0) l.splice(i, 1); else l.push(d.id); PL.store.save(); ui().toast(i >= 0 ? 'Removed from saved candidates' : 'Candidate saved'); PL.rerender(); });

  /* ---------- resume ---------- */
  R.add('/app/resume', () => {
    const u = me(), r = prof(u).resume;
    return `${ui().pageHead('Resume')}<div class="narrow stack" style="max-width:760px">
      <div class="card pad-lg">${r ? `<div class="row between nowrap"><div class="row nowrap">${I('file', 36)}<div><div class="bold">${E(r.name)}</div><div class="small muted">${E(r.type)} · ${F().size(r.size)} · uploaded ${F().date(r.uploadedAt)}</div></div></div><button class="btn btn-secondary btn-sm" data-action="resume-upload">${I('upload', 14)} Update</button></div>` : ui().empty('file', 'No uploaded resume', 'Your generated profile resume is available below and can be used when applying.', '<button type="button" class="btn" data-action="resume-upload">Upload resume</button>')}</div>${PL.onb && PL.onb.resumeCard ? PL.onb.resumeCard(u) : ''}</div>`;
  }, Object.assign({ title: 'Resume' }, CAND));

  /* ---------- apply wizard ---------- */
  const STEPS = ['Contact', 'Resume', 'Questions', 'Review'];
  R.add('/app/jobs/:id/apply', ctx => {
    const u = me(), j = PL.q.job(ctx.params.id);
    if (!j || j.status !== 'Published' || j.closingDate < F().today()) return ui().empty('briefcase', 'This job is no longer accepting applications', '', '<a class="btn" href="#/app/jobs">Browse jobs</a>');
    const ex = PL.q.appFor(u.id, j.id); if (ex) return ui().empty('checkc', 'You have already applied', 'Your application is ' + E(ex.status) + '.', `<a class="btn" href="#/app/applications/${ex.id}">View application</a>`);
    let w = PL.state.apply; if (!w || w.jobId !== j.id) w = PL.state.apply = { jobId: j.id, step: 0, name: u.name, phone: u.phone || '', location: u.location || '', resume: prof(u).resume ? prof(u).resume.name : '', cover: '', answers: j.questions.map(() => ''), consent: false };
    const c = PL.q.company(j.companyId), s = w.step;
    const body = [
      `${ui().field({ name: 'name', label: 'Full name', required: true, value: w.name })}${ui().field({ name: 'phone', label: 'Phone', type: 'tel', required: true, value: w.phone })}${ui().field({ name: 'location', label: 'Current location', value: w.location })}${ui().field({ name: 'email', label: 'Email', value: u.email, disabled: true })}`,
      `<p class="muted">Choose the resume to send with your application.</p>${w.resume ? `<div class="card pad row between nowrap" style="box-shadow:none"><div class="row nowrap">${I('file', 28)}<div><div class="bold">${E(w.resume)}</div><div class="xs muted">Selected</div></div></div><button type="button" class="btn btn-secondary btn-sm" data-action="apply-resume">Upload a different file</button></div>` : `<div class="card pad" style="box-shadow:none">${ui().empty('upload', 'No resume attached', 'A resume is required to apply.', '<button type="button" class="btn" data-action="apply-resume">Upload resume</button>')}</div>`}<small class="err" id="reserr" role="alert"></small>`,
      `${ui().field({ name: 'cover', label: 'Cover letter (optional)', type: 'textarea', rows: 5, value: w.cover, help: 'Keep it concise – max 1000 characters.', attrs: ' maxlength="1000"' })}${j.questions.map((q, i) => ui().field({ name: 'q' + i, label: q, required: true, value: w.answers[i] })).join('')}`,
      `<dl class="kv"><dt>Name</dt><dd>${E(w.name)}</dd><dt>Phone</dt><dd>${E(w.phone)}</dd><dt>Location</dt><dd>${E(w.location || '—')}</dd><dt>Resume</dt><dd>${E(w.resume)}</dd><dt>Cover letter</dt><dd>${E(w.cover || '—')}</dd>${j.questions.map((q, i) => `<dt>${E(q)}</dt><dd>${E(w.answers[i])}</dd>`).join('')}</dl>${ui().field({ name: 'consent', label: 'Consent', type: 'checkbox', required: true, html: 'I confirm the information is accurate and consent to share it with ' + E(c.name) + '.', value: w.consent })}`
    ][s];
    return `<div class="narrow" style="max-width:760px;margin:0 auto"><a href="#/app/jobs/${j.id}" class="small">${I('left', 14)} Back to job</a><h1 style="font-size:1.4rem">Apply: ${E(j.title)}</h1><p class="muted">${E(c.name)} · ${E(j.location)}</p>
      <div class="step-bar" role="list" aria-label="Progress">${STEPS.map((t, i) => `<div role="listitem" class="step ${i < s ? 'done' : i === s ? 'active' : ''}" ${i === s ? 'aria-current="step"' : ''}>${i < s ? '✓' : i + 1}. ${t}</div>`).join('')}</div>
      <form class="card pad-lg mt" data-form="apply-step" novalidate>${body}<div class="row between mt">${s ? '<button type="button" class="btn btn-secondary" data-action="apply-back">Back</button>' : '<span></span>'}<button class="btn" type="submit">${s === 3 ? 'Submit application' : 'Continue'}</button></div></form></div>`;
  }, Object.assign({ title: 'Apply' }, CAND));
  PL.act('apply-back', () => { PL.state.apply.step--; PL.rerender(); });
  PL.act('apply-resume', () => ui().pickFile('.pdf,.doc,.docx', f => { if (!/\.(pdf|docx?)$/i.test(f.name)) return ui().toast('Please choose a PDF or Word file.', 'err'); if (f.size > 2 * 1048576) return ui().toast('File is larger than 2 MB.', 'err'); PL.state.apply.resume = f.name; PL.rerender(); }));
  PL.form('apply-step', f => {
    const w = PL.state.apply, s = w.step, j = PL.q.job(w.jobId), u = me();
    if (s === 1 && !w.resume) { document.getElementById('reserr').textContent = 'Please attach a resume'; return; }
    if (!ui().validate(f)) return; const d = ui().formData(f);
    if (s === 0) Object.assign(w, { name: d.name, phone: d.phone, location: d.location });
    if (s === 2) { w.cover = d.cover; w.answers = j.questions.map((_, i) => d['q' + i]); }
    if (s < 3) { w.step++; return PL.rerender(); }
    if (PL.q.appFor(u.id, j.id)) return ui().toast('You already applied to this job.', 'info');
    const id = PL.store.id('a'), now = F().iso();
    const app = { id, ref: 'PLI-2026-' + (1000 + parseInt(id.slice(1), 10)), jobId: j.id, candidateId: u.id, recruiterId: j.recruiterId, resumeName: w.resume, coverLetter: w.cover, answers: j.questions.map((q, i) => ({ q, a: w.answers[i] })), status: 'Applied', appliedAt: now, updatedAt: now, notes: [], interview: null, history: [{ status: 'Applied', at: now, note: 'Application submitted' }], phone: w.phone };
    db().applications.unshift(app); u.phone = w.phone; u.location = w.location || u.location;
    PL.notify(j.recruiterId, 'application', 'New applicant', u.name + ' applied for ' + j.title + '.', '/employer/applicants/' + id);
    PL.notify(u.id, 'status', 'Application submitted', 'Your application for ' + j.title + ' was submitted.', '/app/applications/' + id);
    PL.store.save(); PL.state.apply = null; PL.go('/app/applications/' + id + '?new=1');
  });

  /* ---------- applications ---------- */
  R.add('/app/applications', () => {
    const v = PL.vf('myapps', { tab: 'All', q: '', page: 1 }), all = PL.q.appsOf(me().id), q = v.q.toLowerCase();
    const groups = { All: () => true, Active: a => ['Applied', 'Under Review', 'Shortlisted'].includes(a.status), Interview: a => a.status === 'Interview Scheduled', 'Offer / Hired': a => ['Offer', 'Hired'].includes(a.status), Rejected: a => a.status === 'Rejected', Withdrawn: a => a.status === 'Withdrawn' };
    const list = all.filter(a => groups[v.tab](a) && (!q || PL.q.job(a.jobId).title.toLowerCase().includes(q) || PL.q.company(PL.q.job(a.jobId).companyId).name.toLowerCase().includes(q))).sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    return `${ui().pageHead('My applications')}${ui().tabs(Object.keys(groups).map(k => ({ id: k, label: k, count: all.filter(groups[k]).length })), v.tab, 'myapps')}<div class="card mt-s"><div class="pad">${ui().filterCtl('myapps', { name: 'q', label: 'Search', placeholder: 'Search by job or company' })}</div>${ui().table({ empty: 'No applications in this view.', rows: ui().paginate(list, v.page, 8), cols: [{ label: 'Job', render: a => { const j = PL.q.job(a.jobId); return `<a class="bold" href="#/app/applications/${a.id}">${E(j.title)}</a><div class="xs muted">${E(PL.q.company(j.companyId).name)}</div>`; } }, { label: 'Reference', render: a => E(a.ref) }, { label: 'Applied', render: a => F().date(a.appliedAt) }, { label: 'Updated', render: a => F().ago(a.updatedAt) }, { label: 'Status', render: a => ui().badge(a.status) }] })}</div>${ui().pager({ total: list.length, page: v.page, per: 8, scope: 'myapps' })}`;
  }, Object.assign({ title: 'Applications' }, CAND));
  R.add('/app/applications/:id', ctx => {
    const a = PL.q.app(ctx.params.id), u = me();
    if (!a || a.candidateId !== u.id) return ui().empty('file', 'Application not found', '', '<a class="btn" href="#/app/applications">My applications</a>');
    const j = PL.q.job(a.jobId), c = PL.q.company(j.companyId), iv = a.interview;
    return `<a href="#/app/applications" class="small">${I('left', 14)} My applications</a>${ctx.query.new ? `<div class="mt-s">${ui().notice('<b>Application submitted!</b> Your reference number is <b>' + E(a.ref) + '</b>. We have notified the employer.', 'ok')}</div>` : ''}
      <div class="grid mt-s" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);align-items:start"><div class="stack"><div class="card pad-lg"><div class="row nowrap start">${ui().logo(c, 52)}<div class="grow"><h1 style="font-size:1.3rem;margin:0"><a href="#/app/jobs/${j.id}" style="color:var(--text)">${E(j.title)}</a></h1><div class="muted">${E(c.name)} · ${E(j.location)}</div></div>${ui().badge(a.status)}</div><dl class="kv mt"><dt>Reference</dt><dd>${E(a.ref)}</dd><dt>Applied on</dt><dd>${F().date(a.appliedAt)}</dd><dt>Resume</dt><dd>${E(a.resumeName)}</dd><dt>Cover letter</dt><dd>${E(a.coverLetter || '—')}</dd></dl>${a.answers.map(x => `<p class="small"><b>${E(x.q)}</b><br>${E(x.a)}</p>`).join('')}</div>
        ${iv ? `<div class="card pad-lg"><h3>${I('calendar', 18)} Interview ${ui().badge(iv.status || 'Scheduled')}</h3><dl class="kv"><dt>Date & time</dt><dd>${F().date(iv.date)} at ${E(iv.time)}</dd><dt>Type</dt><dd>${E(iv.type)}</dd><dt>${iv.type === 'In person' ? 'Location' : 'Link'}</dt><dd>${/^https?:/.test(iv.link) ? `<a href="${E(iv.link)}" target="_blank" rel="noopener">${E(iv.link)}</a>` : E(iv.link)}</dd><dt>Interviewer</dt><dd>${E(iv.interviewer)}</dd>${iv.notes ? `<dt>Notes</dt><dd>${E(iv.notes)}</dd>` : ''}</dl></div>` : ''}</div>
        <div class="stack"><div class="card pad"><h3>Timeline</h3><ol class="timeline">${a.history.slice().reverse().map(h => `<li><b>${E(h.status)}</b><div class="xs muted">${F().date(h.at)} · ${E(h.note || '')}</div></li>`).join('')}</ol></div><div class="card pad"><div class="stack-sm"><a class="btn btn-secondary" href="#${msgPath(j.recruiterId)}">${I('message', 16)} Message recruiter</a>${FINAL.includes(a.status) ? '' : `<button class="btn btn-outline-danger" data-action="withdraw" data-id="${a.id}">Withdraw application</button>`}</div></div></div></div>`;
  }, Object.assign({ title: 'Application' }, CAND));
  PL.act('withdraw', async d => {
    if (!(await ui().confirm({ title: 'Withdraw application?', message: 'The employer will be notified. You may re-apply later.', confirmText: 'Withdraw', danger: true }))) return;
    const a = PL.q.app(d.id), j = PL.q.job(a.jobId), now = F().iso(); a.status = 'Withdrawn'; a.updatedAt = now; a.history.push({ status: 'Withdrawn', at: now, note: 'Withdrawn by candidate' });
    PL.notify(a.recruiterId, 'application', 'Application withdrawn', me().name + ' withdrew from ' + j.title + '.', '/employer/applicants/' + a.id); PL.store.save(); ui().toast('Application withdrawn'); PL.rerender();
  });

  /* ---------- saved ---------- */
  R.add('/app/saved-jobs', () => {
    const u = me(), v = PL.vf('saved', { tab: 'Jobs' }), jobs = PL.q.saved(u.id).map(PL.q.job).filter(Boolean), news = (db().newsBookmarks[u.id] || []).map(PL.q.news).filter(Boolean), posts = (db().savedPosts[u.id] || []).map(PL.q.post).filter(p => p && !p.removed);
    const panel = v.tab === 'Jobs' ? (jobs.length ? `<div class="stack">${jobs.map(j => PL.cmp.jobCard(j, { base: '/app' })).join('')}</div>` : ui().empty('bookmark', 'No saved jobs', 'Tap the bookmark on any job to save it.', '<a class="btn" href="#/app/jobs">Browse jobs</a>'))
      : v.tab === 'Articles' ? (news.length ? `<div class="stack">${news.map(n => `<div class="card pad row between"><a class="bold" href="#/news/${n.id}">${E(n.title)}</a><button class="btn btn-ghost btn-sm" data-action="bookmark-news" data-id="${n.id}">Remove</button></div>`).join('')}</div>` : ui().empty('news', 'No bookmarked articles', ''))
        : (posts.length ? `<div class="stack">${posts.map(p => `<div class="card pad"><div class="small muted">${E(PL.q.user(p.authorId).name)} · ${F().ago(p.createdAt)}</div><p>${E(p.content.slice(0, 200))}</p><button class="btn btn-ghost btn-sm" data-action="post-save" data-id="${p.id}">Remove</button></div>`).join('')}</div>` : ui().empty('bookmark', 'No saved posts', ''));
    return `${ui().pageHead('Saved')}${ui().tabs([{ id: 'Jobs', label: 'Jobs', count: jobs.length }, { id: 'Articles', label: 'Articles', count: news.length }, { id: 'Posts', label: 'Posts', count: posts.length }], v.tab, 'saved')}<div class="mt-s">${panel}</div>`;
  }, Object.assign({ title: 'Saved' }, CAND));

  /* ---------- alerts ---------- */
  const alertFields = a => [{ name: 'keyword', label: 'Keyword', value: a && a.keyword }, { name: 'category', label: 'Function', type: 'select', placeholder: 'Any', options: PL.CATEGORIES, value: a && a.category }, { name: 'location', label: 'Location', value: a && a.location }, { name: 'experience', label: 'Experience', type: 'select', placeholder: 'Any', options: ['0-1', '1-3', '3-5', '5-10', '10+'], value: a && a.experience }];
  R.add('/app/job-alerts', () => {
    const l = db().alerts[me().id] || [];
    const matches = a => PL.q.publicJobs().filter(j => (!a.keyword || (j.title + j.department).toLowerCase().includes(a.keyword.toLowerCase())) && (!a.category || j.department === a.category) && (!a.location || j.location.toLowerCase().includes(a.location.toLowerCase()))).length;
    return `${ui().pageHead('Job alerts', `<button class="btn" data-action="alert-add">${I('plus', 16)} New alert</button>`, 'Alerts create in-app notifications when matching jobs are published (simulated).')}${l.length ? `<div class="stack">${l.map(a => `<div class="card pad row between"><div><div class="bold">${E([a.keyword, a.category].filter(Boolean).join(' · ') || 'Any job')}</div><div class="small muted">${E(a.location || 'Any location')} · exp ${E(a.experience || 'any')} · ${matches(a)} matching jobs</div></div><div class="row"><label class="check"><input type="checkbox" data-action="alert-toggle" data-id="${a.id}" ${a.enabled ? 'checked' : ''}> Enabled</label><button class="icon-btn" data-action="alert-del" data-id="${a.id}" aria-label="Delete alert">${I('trash', 16)}</button></div></div>`).join('')}</div>` : ui().empty('bell', 'No alerts yet', 'Create an alert to hear about new matching jobs.')}`;
  }, Object.assign({ title: 'Job alerts' }, CAND));
  PL.act('alert-add', async () => { const r = await ui().ask({ title: 'New job alert', fields: alertFields(null) }); if (!r) return; if (!r.keyword && !r.category && !r.location) return ui().toast('Add at least one criterion.', 'err'); (db().alerts[me().id] = db().alerts[me().id] || []).push(Object.assign({ id: PL.store.id('al'), enabled: true }, r)); PL.store.save(); ui().toast('Alert created'); PL.rerender(); });
  PL.act('alert-toggle', (d, el) => { const a = db().alerts[me().id].find(x => x.id === d.id); a.enabled = el.checked; PL.store.save(); ui().toast(a.enabled ? 'Alert enabled' : 'Alert disabled'); });
  PL.act('alert-del', d => { const l = db().alerts[me().id]; l.splice(l.findIndex(x => x.id === d.id), 1); PL.store.save(); PL.rerender(); });

  /* ---------- network ---------- */
  const finish = (msg, rr = true) => { PL.store.save(); ui().toast(msg); if (rr) PL.rerender(); };
  PL.act('conn-send', d => { const u = me(); if (PL.q.conn(u.id, d.id)) return; db().connections.push({ id: PL.store.id('cn'), requesterId: u.id, recipientId: d.id, status: 'pending', createdAt: F().iso() }); PL.notify(d.id, 'connection', 'New connection request', u.name + ' wants to connect with you.', '/app/network'); finish('Connection request sent'); });
  PL.act('conn-accept', d => { const u = me(), c = PL.q.conn(u.id, d.id); c.status = 'accepted'; PL.notify(d.id, 'connection', 'Request accepted', u.name + ' accepted your connection request.', '/app/profile/' + u.id); finish('You are now connected'); });
  const rm = (d, msg) => { const a = db().connections; a.splice(a.indexOf(PL.q.conn(me().id, d.id)), 1); finish(msg); };
  PL.act('conn-decline', d => rm(d, 'Request declined'));
  PL.act('conn-withdraw', d => rm(d, 'Request withdrawn'));
  PL.act('conn-remove', async d => { if (await ui().confirm({ title: 'Remove connection?', confirmText: 'Remove', danger: true })) rm(d, 'Connection removed'); });
  PL.act('follow-user', d => { const u = me(), f = PL.q.follows(u.id), i = f.users.indexOf(d.id); if (i >= 0) f.users.splice(i, 1); else f.users.push(d.id); finish(i >= 0 ? 'Unfollowed' : 'Following'); });
  R.add('/app/network', () => {
    const u = me(), v = PL.vf('net', { tab: 'Invitations' }), c = db().connections;
    const inv = c.filter(x => x.recipientId === u.id && x.status === 'pending'), sent = c.filter(x => x.requesterId === u.id && x.status === 'pending'), conns = c.filter(x => x.status === 'accepted' && (x.requesterId === u.id || x.recipientId === u.id)).map(x => PL.q.user(x.requesterId === u.id ? x.recipientId : x.requesterId));
    const sug = db().users.filter(x => ['candidate', 'recruiter'].includes(x.role) && x.id !== u.id && x.status === 'Active' && PL.q.connStatus(u.id, x.id) === 'none' && !(x.profile && x.profile.privacy && x.profile.privacy.visibility === 'Private')).slice(0, 8);
    const row = (p, btns) => `<div class="row nowrap" style="padding:10px 0;border-bottom:1px solid var(--border)">${ui().avatar(p, 46)}<div class="grow"><a class="bold" href="#/app/profile/${p.id}">${E(p.name)}</a><div class="small muted">${E((p.profile && p.profile.headline) || '')}</div></div><div class="row nowrap">${btns}</div></div>`;
    const panel = v.tab === 'Invitations' ? (inv.length ? inv.map(x => { const p = PL.q.user(x.requesterId); return row(p, `<button class="btn btn-sm" data-action="conn-accept" data-id="${p.id}">Accept</button><button class="btn btn-sm btn-secondary" data-action="conn-decline" data-id="${p.id}">Decline</button>`); }).join('') : ui().empty('userplus', 'No pending invitations', ''))
      : v.tab === 'Connections' ? (conns.length ? conns.map(p => row(p, `<a class="btn btn-sm btn-secondary" href="#${msgPath(p.id)}">Message</a><button class="btn btn-sm btn-ghost" data-action="conn-remove" data-id="${p.id}">Remove</button>`)).join('') : ui().empty('users', 'No connections yet', 'Connect with colleagues and peers.'))
        : v.tab === 'Sent' ? (sent.length ? sent.map(x => { const p = PL.q.user(x.recipientId); return row(p, `<button class="btn btn-sm btn-secondary" data-action="conn-withdraw" data-id="${p.id}">Withdraw</button>`); }).join('') : ui().empty('send', 'No sent requests', ''))
          : sug.map(p => row(p, `<button class="btn btn-sm" data-action="conn-send" data-id="${p.id}">${I('userplus', 14)} Connect</button>`)).join('');
    return `${ui().pageHead('My network')}<div class="narrow" style="max-width:820px">${ui().tabs([{ id: 'Invitations', label: 'Invitations', count: inv.length }, { id: 'Connections', label: 'Connections', count: conns.length }, { id: 'Sent', label: 'Sent', count: sent.length }, { id: 'Suggestions', label: 'People you may know' }], v.tab, 'net')}<div class="card pad mt-s">${panel}</div></div>`;
  }, Object.assign({ title: 'Network' }, BOTH));
})();
