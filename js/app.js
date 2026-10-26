/* App shell: layouts, static pages, settings, global search, bootstrap */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s);
  const BANNER = '';

  function active(path, items) { let best = null; items.forEach(i => { if ((path === i[1] || path.startsWith(i[1] + '/')) && (!best || i[1].length > best[1].length)) best = i; }); return best; }
  const brand = (href = '/') => `<a href="#${href}" class="brand" aria-label="PharmaLinkIn home"><span class="brand-mark">${I('pill', 18)}</span><span>Pharma<b>LinkIn</b></span></a>`;

  function profileMenu(u) {
    const items = u.role === 'candidate'
      ? [{ label: 'My profile', href: '#/app/profile', icon: 'user' }, { label: 'Find jobs', href: '#/job-results', icon: 'briefcase' }]
      : [{ label: 'My dashboard', href: '#' + PL.auth.homeFor(u), icon: 'dash' }];
    if (!PL.onboardingOnly() && u.role === 'candidate') items.push({ label: 'Settings', href: '#/app/settings', icon: 'settings' });
    if (!PL.onboardingOnly() && u.role === 'recruiter') items.push({ label: 'View profile', href: '#/app/profile', icon: 'user' }, { label: 'Settings', href: '#/app/settings', icon: 'settings' });
    items.push('-', { label: 'Sign out', action: 'logout', icon: 'logout' });
    return `<div class="dd"><button class="icon-btn" data-action="dd" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu" style="width:auto;padding:2px">${ui().avatar(u, 34)}</button><div class="dd-menu" role="menu"><div style="padding:8px 10px"><div class="bold">${E(u.name)}</div><div class="xs muted">${PL.auth.roleLabel(u.role)}</div></div><div class="dd-sep"></div>${items.map(i => i === '-' ? '<div class="dd-sep"></div>' : i.href ? `<a class="dd-item" role="menuitem" href="${i.href}">${I(i.icon, 16)}${i.label}</a>` : `<button class="dd-item" role="menuitem" data-action="${i.action}">${I(i.icon, 16)}${i.label}</button>`).join('')}</div></div>`;
  }

  const mobileBackbar = ctx => {
    const path = ctx.path, previous = PL.state.mobilePreviousPath;
    const flow = value => {
      if (/^\/app\/profile(?:\/|$)/.test(value)) return 'profile';
      if (/^\/(?:job-search|job-results|job\/|dashboard$|saved-jobs|my-applications)/.test(value)) return 'jobs';
      if (/^\/app\//.test(value)) return 'candidate-app';
      if (/^\/employer\//.test(value)) return 'employer';
      if (/^\/advertiser\//.test(value)) return 'advertiser';
      if (/^\/admin\//.test(value)) return 'admin';
      if (/^\/(?:login|register|verify-account|forgot-password|forgot-username|reset-password)$/.test(value)) return 'auth';
      if (/^\/onboarding(?:\/|$)/.test(value)) return 'onboarding';
      if (value === '/' || /^\/(?:jobs|companies|news|pricing|page)(?:\/|$)/.test(value)) return 'public';
      return '';
    };
    const roots = new Set(['/', '/app/profile', '/app/feed', '/app/dashboard', '/job-search', '/dashboard', '/login', '/register', '/onboarding', '/jobs', '/companies', '/news', '/pricing']);
    if (!previous || roots.has(path) || !flow(path) || flow(path) !== flow(previous)) return '';
    return `<div class="mobile-backbar"><button type="button" class="mobile-back-button" data-action="history-back">${I('left', 18)}<span>Back</span></button></div>`;
  };
  PL.brandHtml = brand; PL.profileMenu = profileMenu; PL.footerHtml = () => footer(); PL.mobileBackbar = mobileBackbar;
  PL.act('history-back', () => window.history.back());
  function publicLayout(ctx, html, u) {
    const cand = PL.onboardingOnly() && u && u.role === 'candidate';
    const links = cand ? [['Jobs', '/job-results']] : PL.onboardingOnly() ? [] : [['Jobs', '/jobs'], ['Companies', '/companies'], ['News', '/news'], ['Pricing', '/pricing']];
    const act = active(/^\/job/.test(ctx.path) && cand ? '/job-search' : ctx.path, links);
    return `${BANNER}<header class="site-header"><div class="container inner">${brand(cand ? '/job-search' : '/')}${links.length ? `<nav class="main-nav" id="mainnav" aria-label="Main">${links.map(l => `<a href="#${l[1]}" class="${act === l ? 'active' : ''}">${l[0]}</a>`).join('')}</nav>` : ''}
      <div class="row auth-btns" style="margin-left:auto">${u ? `${cand ? '' : `<a class="btn btn-secondary btn-sm" href="#${PL.auth.homeFor(u)}">My profile</a>`}${profileMenu(u)}` : `<span class="muted small hdr-q">Already have an account?</span><a class="btn btn-ghost btn-sm" href="#/login">Sign in</a>`}${links.length ? `<button class="icon-btn menu-toggle" data-action="menu-toggle" aria-label="Toggle menu" aria-controls="mainnav" style="margin-left:0">${I('menu')}</button>` : ''}</div></div></header>
      ${mobileBackbar(ctx)}<main id="main" tabindex="-1">${html}</main>${footer()}`;
  }
  function footer() {
    if (PL.onboardingOnly()) return `<footer class="site-footer"><div class="container"><div class="row between" style="gap:12px"><div class="brand" style="color:#fff"><span class="brand-mark">${I('pill', 18)}</span> PharmaLinkIn</div><ul class="row" style="list-style:none;margin:0;padding:0;gap:16px"><li><a href="#/page/privacy">Privacy</a></li><li><a href="#/page/terms">Terms</a></li><li><a href="#/page/contact">Contact</a></li><li><button class="link-btn" style="color:#D0D5DD" data-action="reset-demo">Reset demo data</button></li></ul></div><p class="xs mt">© ${new Date().getFullYear()} PharmaLinkIn prototype · Candidate onboarding preview · Demo content only</p></div></footer>`;
    return `<footer class="site-footer"><div class="container"><div class="foot-grid"><div><div class="brand" style="color:#fff">${'<span class="brand-mark">' + I('pill', 18) + '</span>'} PharmaLinkIn</div><p class="small mt-s">A pharma-industry network, job marketplace and employer platform. This is a <b>frontend prototype</b> with fictional data.</p></div>
      <div><h4>Product</h4><ul><li><a href="#/jobs">Find jobs</a></li><li><a href="#/companies">Companies</a></li><li><a href="#/news">Industry news</a></li><li><a href="#/pricing">Employer plans</a></li></ul></div>
      <div><h4>Company</h4><ul><li><a href="#/page/about">About</a></li><li><a href="#/page/contact">Contact</a></li><li><a href="#/page/help">Help</a></li></ul></div>
      <div><h4>Legal</h4><ul><li><a href="#/page/privacy">Privacy</a></li><li><a href="#/page/terms">Terms</a></li><li><button class="link-btn" style="color:#D0D5DD" data-action="reset-demo">Reset demo data</button></li></ul></div></div>
      <p class="xs mt">© ${new Date().getFullYear()} PharmaLinkIn prototype · Demo content only · Reference: pharmalinkin.com</p></div></footer>`;
  }
  function authLayout(ctx, html) { return `${BANNER}<header class="site-header"><div class="container inner">${brand()}<a class="btn btn-ghost btn-sm" style="margin-left:auto" href="#/">${I('left', 14)} Back to site</a></div></header>${mobileBackbar(ctx)}<main id="main" tabindex="-1">${html}</main>`; }

  function appLayout(ctx, html, u) {
    const unreadM = PL.q.unreadMsgs(u.id), unreadN = PL.q.unreadNotifs(u.id);
    const candidateProfile = u.role === 'candidate' && /^\/app\/profile(?:\/|$)/.test(ctx.path);
    const profileTitles = {
      '/app/profile': ctx.query.preview ? 'Profile' : 'My Profile',
      '/app/profile/edit': 'Edit Profile',
      '/app/profile/experience': 'Experience',
      '/app/profile/analytics': 'Profile Analytics',
      '/app/profile/completion': 'Profile Completion'
    };
    const profileTitle = profileTitles[ctx.path] || (ctx.path.startsWith('/app/profile/experience/') ? (ctx.path.endsWith('/new') ? 'Add Experience' : 'Edit Experience') : 'My Profile');
    const nav = [['Home', u.role === 'candidate' ? '/app/profile' : '/app/feed', 'home'], ['Jobs', u.role === 'candidate' ? '/job-results' : '/app/jobs', 'briefcase'], ['My Network', '/app/network', 'users'], ...(u.role === 'candidate' ? [] : [['Messages', '/app/messages', 'message', unreadM]]), ['Notifications', '/app/notifications', 'bell', unreadN]];
    const a = active(ctx.path, nav.concat([['Home', '/app/dashboard', 'home'], ['Jobs', '/app/applications', 'briefcase'], ['Jobs', '/app/saved-jobs', 'briefcase'], ['Jobs', '/app/job-alerts', 'briefcase']]));
    const actKey = a ? a[1] : '';
    const mapKey = { '/app/dashboard': '/app/feed', '/app/applications': '/app/jobs', '/app/saved-jobs': '/app/jobs', '/app/job-alerts': '/app/jobs' }[actKey] || actKey;
    const cta = u.role === 'candidate' ? null : ({ recruiter: ['Post a job', '/employer/jobs/new'], advertiser: ['New campaign', '/advertiser/campaigns/new'] }[u.role] || ['Dashboard', PL.auth.homeFor(u)]);
    const profileAction = ctx.path === '/app/profile' && !ctx.query.preview
      ? `<a href="#/app/profile/edit" aria-label="Edit profile">${I('edit', 18)}</a>`
      : ctx.path === '/app/profile/experience' ? `<a href="#/app/profile/experience/new?return=profile" aria-label="Add experience">${I('plus', 19)}</a>`
        : `<a href="#/app/profile" aria-label="View My Profile">${I('user', 18)}</a>`;
    const header = candidateProfile
      ? `<header class="profile-topbar"><span></span><strong>${E(profileTitle)}</strong>${profileAction}</header>`
      : `<header class="topnav"><div class="container container-wide inner"><a href="#${u.role === 'candidate' ? '/app/profile' : '/app/feed'}" class="brand" aria-label="PharmaLinkIn home"><span class="brand-mark">${I('pill', 18)}</span></a>
      <form class="search" data-form="global-search" role="search"><label class="sr" for="gs">Search people, jobs, companies</label>${I('search', 16)}<input id="gs" type="search" name="q" placeholder="Search people, jobs, companies" autocomplete="off"></form>
      <nav class="navlinks" aria-label="Primary">${nav.map(n => `<a class="navlink ${n[1] === mapKey ? 'active' : ''}" href="#${n[1]}" ${n[1] === mapKey ? 'aria-current="page"' : ''}>${I(n[2], 20)}<span class="lbl">${n[0]}</span>${n[3] ? `<span class="count" aria-label="${n[3]} unread">${n[3]}</span>` : ''}</a>`).join('')}</nav>
      ${cta ? `<a class="btn btn-sm hide-sm" href="#${cta[1]}" style="margin-left:6px">${cta[0]}</a>` : ''}${profileMenu(u)}</div></header>
      `;
    return `${BANNER}${header}${mobileBackbar(ctx)}
      <main id="main" tabindex="-1" class="container container-wide app-main">${html}</main>
      ${PL.mobileNav ? PL.mobileNav(u.role, ctx.path) : `<nav class="bottomnav" aria-label="Mobile primary">${nav.map(n => `<a href="#${n[1]}" class="${n[1] === mapKey ? 'active' : ''}">${I(n[2], 22)}<span>${n[0].replace('My ', '').replace('Notifications', 'Alerts')}</span>${n[3] ? `<span class="count">${n[3]}</span>` : ''}</a>`).join('')}</nav>`}`;
  }

  const NAVS = {
    employer: () => PL.onboardingOnly() ? [['Dashboard', '/employer/dashboard', 'dash'], ['Company profile', '/employer/company', 'building'], ['Jobs', '/employer/jobs', 'briefcase'], ['Post a job', '/employer/jobs/new', 'plus'], ['Applicants', '/employer/applicants', 'users'], ['Interviews', '/employer/interviews', 'calendar']] : [['Dashboard', '/employer/dashboard', 'dash'], ['Company profile', '/employer/company', 'building'], ['Jobs', '/employer/jobs', 'briefcase'], ['Post a job', '/employer/jobs/new', 'plus'], ['Applicants', '/employer/applicants', 'users'], ['Candidates', '/employer/candidates', 'search'], ['Interviews', '/employer/interviews', 'calendar'], ['Messages', '/employer/messages', 'message', 'm'], ['Notifications', '/employer/notifications', 'bell', 'n'], ['Subscription', '/employer/subscription', 'card'], ['Network feed', '/app/feed', 'news'], ['Browse jobs', '/jobs', 'globe']],
    advertiser: () => [['Dashboard', '/advertiser/dashboard', 'dash'], ['Campaigns', '/advertiser/campaigns', 'megaphone'], ['Create campaign', '/advertiser/campaigns/new', 'plus'], ['Analytics', '/advertiser/analytics', 'chart'], ['Notifications', '/advertiser/notifications', 'bell', 'n'], ['Public site', '/', 'globe']],
    admin: () => { const d = db(); return [['Dashboard', '/admin/dashboard', 'dash'], ['Users', '/admin/users', 'users'], ['Employers', '/admin/companies', 'building', d.companies.filter(c => c.verification === 'Pending').length], ['Jobs', '/admin/jobs', 'briefcase', d.jobs.filter(j => j.status === 'Pending Approval').length], ['Moderation', '/admin/moderation', 'flag', d.reports.filter(r => r.status === 'Open').length], ['Advertisements', '/admin/advertisements', 'megaphone', d.campaigns.filter(c => c.status === 'Pending Approval').length], ['Subscriptions', '/admin/subscriptions', 'card'], ['Reports', '/admin/reports', 'chart'], ['Settings', '/admin/settings', 'settings'], ['Audit logs', '/admin/audit-logs', 'list'], ['Notifications', '/admin/notifications', 'bell', 'n']]; }
  };
  function dashLayout(L, ctx, html, u) {
    const items = NAVS[L](); const a = active(ctx.path, items);
    const counts = { m: PL.q.unreadMsgs(u.id), n: PL.q.unreadNotifs(u.id) };
    const link = i => { const c = typeof i[3] === 'string' ? counts[i[3]] : i[3]; return `<a class="side-link ${a === i ? 'active' : ''}" href="#${i[1]}" ${a === i ? 'aria-current="page"' : ''}>${I(i[2], 18)}${i[0]}${c ? `<span class="count">${c}</span>` : ''}</a>`; };
    const title = { employer: 'Employer workspace', advertiser: 'Advertiser workspace', admin: 'Super Admin console' }[L];
    return `${BANNER}<div class="dash"><aside class="sidebar" id="sidebar" aria-label="${title}"><div class="row between nowrap" style="padding:4px 8px 10px">${brand(PL.auth.homeFor(u))}<button class="icon-btn dash-toggle" data-action="sidebar-toggle" aria-label="Close menu">${I('x')}</button></div><div class="side-label">${title}</div>${items.map(link).join('')}<div style="flex:1"></div>${L === 'admin' ? '<div class="small" style="color:#94A3B8;padding:10px">Admin console – prototype. Role separation is a UI demo, not real security.</div>' : ''}</aside><div class="scrim" id="scrim" data-action="sidebar-toggle"></div>
      <div><header class="dash-top"><button class="icon-btn dash-toggle" data-action="sidebar-toggle" aria-label="Open menu" aria-controls="sidebar">${I('menu')}</button><span class="badge ${L === 'admin' ? 'b-purple' : 'b-blue'}">${title}</span><div style="flex:1"></div>
        ${L === 'employer' && !PL.onboardingOnly() ? `<a class="icon-btn" href="#/employer/messages" aria-label="Messages">${I('message')}${counts.m ? `<span class="count" style="position:absolute;top:2px;right:2px">${counts.m}</span>` : ''}</a>` : ''}${PL.onboardingOnly() ? '' : `<a class="icon-btn" href="#/${L}/notifications" aria-label="Notifications">${I('bell')}${counts.n ? `<span class="count" style="position:absolute;top:2px;right:2px">${counts.n}</span>` : ''}</a>`}${profileMenu(u)}</header>
        ${mobileBackbar(ctx)}<main id="main" tabindex="-1" class="dash-body">${html}</main></div></div>${PL.mobileNav ? PL.mobileNav(u.role, ctx.path) : ''}`;
  }
  PL.layout = {
    render(meta, ctx, html, user) {
      const L = meta.layout || 'public'; document.body.className = L === 'admin' ? 'theme-admin' : '';
      let out;
      if (L === 'jobs') out = PL.jobsLayout(ctx, html, user); else if (L === 'public') out = publicLayout(ctx, html, user); else if (L === 'auth') out = authLayout(ctx, html);
      else if (L === 'app') out = appLayout(ctx, html, user); else out = dashLayout(L, ctx, html, user);
      document.getElementById('root').innerHTML = out;
    }
  };
  PL.act('menu-toggle', () => document.getElementById('mainnav').classList.toggle('open'));
  PL.act('sidebar-toggle', () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('scrim').classList.toggle('open'); });
  PL.act('reset-demo', async () => {
    if (!(await ui().confirm({ title: 'Reset demo data?', message: 'This restores the original seeded demo data and signs you out. All changes you made will be lost.', confirmText: 'Reset', danger: true }))) return;
    PL.store.reset(); PL.auth.logout(); PL.view = {}; ui().toast('Demo data restored to the original seed.', 'info'); PL.go('/'); PL.rerender();
  });
  PL.form('global-search', f => { const q = f.q.value.trim(); PL.go('/app/search?q=' + encodeURIComponent(q)); });

  /* ---- global search ---- */
  PL.router.add('/app/search', ctx => {
    const q = (ctx.query.q || '').toLowerCase(), u = PL.auth.user(), d = db();
    const people = d.users.filter(x => ['candidate', 'recruiter'].includes(x.role) && x.id !== u.id && x.status === 'Active' && !(x.profile && x.profile.privacy && x.profile.privacy.visibility === 'Private') && (!q || (x.name + ' ' + ((x.profile && x.profile.headline) || '') + ' ' + ((x.profile && x.profile.company) || '')).toLowerCase().includes(q))).slice(0, 8);
    const jobs = PL.q.publicJobs().filter(j => !q || (j.title + ' ' + j.department + ' ' + PL.q.company(j.companyId).name).toLowerCase().includes(q)).slice(0, 6);
    const comps = d.companies.filter(c => !q || c.name.toLowerCase().includes(q)).slice(0, 6);
    const ad = PL.ads && PL.ads.searchAd(q);
    return `<div class="narrow" style="max-width:860px;margin:0 auto"><h1 style="font-size:1.4rem">Search results for “${E(ctx.query.q || '')}”</h1>
      ${ad ? PL.ads.card(ad, 'search') : ''}
      <h3 class="mt">People</h3>${people.length ? `<div class="card pad">${people.map(p => PL.cmp.personRow(p)).join('')}</div>` : ui().empty('users', 'No people found', 'Try a different name or role.')}
      <h3 class="mt">Jobs</h3>${jobs.length ? `<div class="stack">${jobs.map(j => PL.cmp.jobCard(j, { base: '/app' })).join('')}</div>` : ui().empty('briefcase', 'No jobs found', 'Try fewer keywords.')}
      <h3 class="mt">Companies</h3>${comps.length ? `<div class="grid g2">${comps.map(c => PL.cmp.companyCard(c)).join('')}</div>` : ui().empty('building', 'No companies found', '')}</div>`;
  }, { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Search' });

  /* ---- settings ---- */
  PL.router.add('/app/settings', () => {
    const u = PL.auth.user();
    return `<div class="narrow" style="max-width:760px;margin:0 auto"><h1 style="font-size:1.5rem">Account settings</h1>
      <div class="card pad mb"><h3>Account details</h3><form data-form="settings" novalidate><div class="form-grid">${ui().field({ name: 'name', label: 'Full name', value: u.name, required: true })}${ui().field({ name: 'phone', label: 'Phone', type: 'tel', value: u.phone, required: true })}${ui().field({ name: 'location', label: 'Location', value: u.location })}${ui().field({ name: 'email', label: 'Email (read-only in demo)', value: u.email, disabled: true })}</div><button class="btn" type="submit">Save changes</button></form></div>
      <div class="card pad mb"><h3>Change password</h3><form data-form="change-pw" novalidate><div class="form-grid">${ui().field({ name: 'password', label: 'New password', type: 'password', required: true, minlength: 8, autocomplete: 'new-password' })}${ui().field({ name: 'confirm', label: 'Confirm password', type: 'password', required: true, match: 'password', autocomplete: 'new-password' })}</div><button class="btn" type="submit">Update password</button></form></div>
      <div class="card pad"><h3>Demo tools</h3><p class="muted small">All data is stored in this browser's LocalStorage and is not a secure production database. Do not enter real personal information.</p><button class="btn btn-outline-danger" data-action="reset-demo">${I('refresh', 16)} Reset demo data</button></div></div>`;
  }, { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Settings' });
  PL.form('settings', f => { if (!ui().validate(f)) return; const d = ui().formData(f), u = PL.auth.user(); u.name = d.name; u.phone = d.phone; u.location = d.location; PL.store.save(); ui().toast('Settings saved'); PL.rerender(); });
  PL.form('change-pw', f => { if (!ui().validate(f)) return; PL.auth.user().pw = PL.hashPw(ui().formData(f).password); PL.store.save(); f.reset(); ui().toast('Password updated (demo)'); });

  /* ---- static pages ---- */
  const PAGES = {
    about: ['About PharmaLinkIn', '<p>PharmaLinkIn is a concept for a pharmaceutical professional network and recruitment platform. It combines a professional feed, a pharma-specific job marketplace, employer tools, advertiser workspace and administrative moderation.</p><p>This site is a <b>clickable prototype</b> built with HTML, CSS and vanilla JavaScript. All companies, people, jobs, salaries and campaigns are fictional illustrations and have not been verified.</p>'],
    privacy: ['Privacy (prototype)', '<p>This prototype stores demo data only in your own browser using LocalStorage. Nothing is sent to a server. Do not enter real personal data, real passwords or confidential records.</p><p>A production version would require a full privacy policy, consent management and secure storage.</p>'],
    terms: ['Terms (prototype)', '<p>These placeholder terms exist only to demonstrate registration flows. Demo plans, prices and analytics are illustrative values and not commercial offers.</p>'],
    help: ['Help centre', '<h3>How do I explore every role?</h3><p>Use the <a href="#/login">demo access panel</a> on the sign-in page.</p><h3>Where is my data stored?</h3><p>In this browser only. Use “Reset demo data” in the footer to restore the original data.</p><h3>Is email, SMS or payment real?</h3><p>No. Verification codes, password resets and checkout are simulated.</p>'],
    contact: ['Contact us', null]
  };
  PL.router.add('/page/:slug', ctx => {
    const p = PAGES[ctx.params.slug]; if (!p) return `<div class="container section">${ui().empty('file', 'Page not found', '')}</div>`;
    return `<div class="container narrow section"><h1>${p[0]}</h1><div class="card pad-lg">${p[1] || `<p class="muted">Send us a message. (Demo: nothing is transmitted.)</p><form data-form="contact" novalidate>${ui().field({ name: 'name', label: 'Your name', required: true })}${ui().field({ name: 'email', label: 'Email', type: 'email', required: true })}${ui().field({ name: 'msg', label: 'Message', type: 'textarea', required: true })}<button class="btn" type="submit">Send message</button></form>`}</div></div>`;
  }, { layout: 'public', title: 'Information' });
  PL.form('contact', f => { if (!ui().validate(f)) return; f.reset(); ui().toast('Thanks! Your message was captured locally (demo – not sent).'); });

  document.addEventListener('DOMContentLoaded', () => {
    PL.store.load(); PL.initEvents(); PL.router.start();
  });
})();
