/* Super-admin workspace */
(function () {
  const PL = (window.PL = window.PL || {});
  let W;
  const ui = () => W || (W = Object.assign({}, PL.ui, {
    paginate: (arr, page, per) => { const pages = Math.max(1, Math.ceil(arr.length / per)), p = Math.min(Math.max(1, page || 1), pages); return { items: arr.slice((p - 1) * per, p * per), page: p }; }
  }));
  const db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt, me = () => PL.auth.user();
  const reg = (p, h, title) => PL.router.add(p, h, { layout: 'admin', roles: ['admin'], title });

  const monthKey = d => String(d).slice(0, 7);
  function lastMonths(n) { const out = [], now = new Date(); for (let i = n - 1; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); out.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleString('en', { month: 'short' }) }); } return out; }
  const countBy = (arr, ms, f) => ms.map(m => arr.filter(x => monthKey(f(x)) === m.key).length);

  reg('/admin/dashboard', () => {
    const d = db(), ms = lastMonths(6);
    const openRep = d.reports.filter(r => r.status === 'Open').length, pj = d.jobs.filter(j => j.status === 'Pending Approval').length, pc = d.companies.filter(c => c.verification === 'Pending').length, pk = d.campaigns.filter(k => k.status === 'Pending Approval').length;
    const rev = d.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
    const roles = ['candidate', 'recruiter', 'advertiser', 'admin'].map((r, i) => ({ label: PL.auth.roleLabel(r), value: d.users.filter(u => u.role === r).length, color: ['#155EEF', '#0E9384', '#F79009', '#6D28D9'][i] }));
    return `${ui().pageHead('Admin dashboard', '', 'Platform overview from demo data')}
      <div class="grid g4 mb">${ui().kpi('Users', d.users.length, d.users.filter(u => u.status !== 'Active').length + ' not active', 'users', '', '/admin/users')}${ui().kpi('Jobs', d.jobs.length, pj + ' pending approval', 'briefcase', 'teal', '/admin/jobs')}${ui().kpi('Applications', d.applications.length, 'All time', 'file', 'amber')}${ui().kpi('Revenue (paid)', F().inr(rev), d.invoices.length + ' invoices', 'chart', '', '/admin/subscriptions')}</div>
      ${ui().notice(`<b>Moderation queue:</b> <a href="#/admin/jobs">${pj} jobs</a> · <a href="#/admin/companies">${pc} companies</a> · <a href="#/admin/advertisements">${pk} campaigns</a> · <a href="#/admin/moderation">${openRep} open reports</a>`, pj + pc + pk + openRep ? 'warn' : 'ok')}
      <div class="grid g2 mt"><div class="card pad"><h3>New users by month</h3>${ui().lineChart({ labels: ms.map(m => m.label), values: countBy(d.users, ms, u => u.createdAt || F().iso()), name: 'Users' })}</div>
      <div class="card pad"><h3>Jobs & applications by month</h3>${ui().barChart({ labels: ms.map(m => m.label), series: [{ name: 'Jobs', color: '#155EEF', values: countBy(d.jobs, ms, j => j.createdAt) }, { name: 'Applications', color: '#0E9384', values: countBy(d.applications, ms, a => a.appliedAt) }] })}</div>
      <div class="card pad"><h3>Users by role</h3>${ui().donut(roles)}</div>
      <div class="card pad"><h3>Recent admin activity</h3>${d.auditLogs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map(l => `<div class="person-row"><div class="grow small">${E(l.action)} <span class="muted">(${E(l.targetType)} ${E(l.targetId)})</span></div><span class="xs muted">${F().ago(l.createdAt)}</span></div>`).join('')}</div></div>`;
  }, 'Admin dashboard');

  /* users */
  reg('/admin/users', () => {
    const v = PL.vf('ausers', { q: '', role: '', status: '', page: 1 });
    let list = db().users.filter(u => (!v.q || (u.name + u.email).toLowerCase().includes(v.q.toLowerCase())) && (!v.role || u.role === v.role) && (!v.status || u.status === v.status));
    const pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Users')}<div class="card pad row mb">${ui().filterCtl('ausers', { name: 'q', label: 'Search users', placeholder: 'Name or email' })}${ui().filterCtl('ausers', { name: 'role', type: 'select', label: 'Role', options: [{ v: '', l: 'All roles' }, 'candidate', 'recruiter', 'advertiser', 'admin'] })}${ui().filterCtl('ausers', { name: 'status', type: 'select', label: 'Status', options: [{ v: '', l: 'All statuses' }].concat(['Active', 'Suspended', 'Banned', 'Pending Verification']) })}</div>
      ${ui().table({ cols: [{ label: 'User', render: u => `<div class="row nowrap">${ui().avatar(u, 32)}<div><b>${E(u.name)}</b><div class="xs muted">${E(u.email)}</div></div></div>` }, { label: 'Role', render: u => E(PL.auth.roleLabel(u.role)) }, { label: 'Status', render: u => ui().badge(u.status) }, { label: '', render: u => u.id === me().id || u.role === 'admin' ? '' : ui().menu([{ label: 'View profile', href: '/app/profile/' + u.id, icon: 'eye' }].concat(u.status !== 'Active' ? [{ label: 'Reactivate', action: 'user-status', data: { id: u.id, s: 'Active' }, icon: 'check' }] : [{ label: 'Suspend', action: 'user-status', data: { id: u.id, s: 'Suspended' }, icon: 'pause' }]).concat(u.status !== 'Banned' ? [{ label: 'Ban', action: 'user-status', data: { id: u.id, s: 'Banned' }, icon: 'x', danger: true }] : []), { label: 'User actions', align: 'right' }) }], rows: pg.items, empty: 'No users match.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'ausers' })}`;
  }, 'Users');
  PL.act('user-status', async d => {
    const u = PL.q.user(d.id);
    if (d.s !== 'Active' && !(await ui().confirm({ title: `${d.s === 'Banned' ? 'Ban' : 'Suspend'} ${u.name}?`, message: 'They will be unable to sign in.', confirmText: d.s === 'Banned' ? 'Ban' : 'Suspend', danger: true }))) return;
    u.status = d.s; PL.audit(d.s === 'Active' ? 'Reactivated user' : d.s === 'Banned' ? 'Banned user' : 'Suspended user', 'user', u.id); PL.store.save(); ui().toast('User ' + d.s.toLowerCase()); PL.rerender();
  });

  /* companies */
  reg('/admin/companies', () => {
    const v = PL.vf('acos', { tab: 'Pending', page: 1 });
    const list = db().companies.filter(c => c.verification === v.tab), pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Company verification')}${ui().tabs(['Pending', 'Verified', 'Rejected'], v.tab, 'acos')}${ui().table({ cols: [{ label: 'Company', render: c => `<div class="row nowrap">${ui().logo(c, 34)}<div><a class="bold" href="#/companies/${c.id}">${E(c.name)}</a><div class="xs muted">${E(c.industry)} · ${E(c.hq || '')}</div></div></div>` }, { label: 'Website', render: c => E(c.website || '—') }, { label: 'Status', render: c => ui().badge(c.verification) }, { label: '', render: c => `<div class="row">${c.verification !== 'Verified' ? `<button class="btn btn-sm" data-action="co-verify" data-id="${c.id}" data-v="Verified">Verify</button>` : ''}${c.verification === 'Pending' ? `<button class="btn btn-outline-danger btn-sm" data-action="co-verify" data-id="${c.id}" data-v="Rejected">Reject</button>` : ''}</div>` }], rows: pg.items, empty: 'Nothing in this queue.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'acos' })}`;
  }, 'Companies');
  PL.act('co-verify', async d => {
    const c = PL.q.company(d.id); let reason = '';
    if (d.v === 'Rejected') { const x = await ui().ask({ title: 'Reject ' + c.name, confirmText: 'Reject', fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: true, rows: 3 }] }); if (!x) return; reason = x.reason; }
    c.verification = d.v; PL.audit(d.v === 'Verified' ? 'Approved employer verification' : 'Rejected employer verification', 'company', c.id);
    db().users.filter(u => u.companyId === c.id).forEach(u => PL.notify(u.id, 'system', 'Company ' + d.v.toLowerCase(), d.v === 'Verified' ? c.name + ' is now verified.' : 'Verification rejected: ' + reason, '/employer/company'));
    PL.store.save(); ui().toast('Company ' + d.v.toLowerCase()); PL.rerender();
  });

  /* jobs */
  reg('/admin/jobs', () => {
    const v = PL.vf('ajobs', { tab: 'Pending Approval', page: 1 });
    const list = db().jobs.filter(j => v.tab === 'All' || j.status === v.tab), pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Job moderation')}${ui().tabs(['Pending Approval', 'Published', 'Rejected', 'All'], v.tab, 'ajobs')}${ui().table({ cols: [{ label: 'Job', render: j => `<a class="bold" href="#/jobs/${j.id}">${E(j.title)}</a><div class="xs muted">${E((PL.q.company(j.companyId) || {}).name || '')} · ${E(j.location)}</div>` }, { label: 'Recruiter', render: j => E((PL.q.user(j.recruiterId) || {}).name || '—') }, { label: 'Status', render: j => ui().badge(j.status) }, { label: '', render: j => `<div class="row">${j.status === 'Pending Approval' ? `<button class="btn btn-sm" data-action="job-mod" data-id="${j.id}" data-v="Published">Approve</button><button class="btn btn-outline-danger btn-sm" data-action="job-mod" data-id="${j.id}" data-v="Rejected">Reject</button>` : j.status === 'Published' ? `<button class="btn btn-outline-danger btn-sm" data-action="job-mod" data-id="${j.id}" data-v="Rejected">Take down</button>` : ''}</div>` }], rows: pg.items, empty: 'No jobs here.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'ajobs' })}`;
  }, 'Jobs');
  PL.act('job-mod', async d => {
    const j = PL.q.job(d.id); let reason = '';
    if (d.v === 'Rejected') { const x = await ui().ask({ title: 'Reject job', confirmText: 'Reject', fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: true, rows: 3 }] }); if (!x) return; reason = x.reason; j.rejectionReason = reason; }
    j.status = d.v; PL.audit(d.v === 'Published' ? 'Approved job' : 'Rejected job', 'job', j.id);
    PL.notify(j.recruiterId, 'job', d.v === 'Published' ? 'Job approved' : 'Job rejected', j.title + (d.v === 'Published' ? ' is now live.' : ' was rejected: ' + reason), '/employer/jobs');
    PL.store.save(); ui().toast('Job ' + (d.v === 'Published' ? 'approved' : 'rejected')); PL.rerender();
  });

  /* moderation / reports */
  function targetLabel(r) {
    if (r.targetType === 'post') { const p = PL.q.post(r.targetId); return p ? E(p.content.slice(0, 70)) + '…' : '(removed)'; }
    if (r.targetType === 'job') { const j = PL.q.job(r.targetId); return j ? E(j.title) : '(removed)'; }
    if (r.targetType === 'user') { const u = PL.q.user(r.targetId); return u ? E(u.name) : '(removed)'; }
    if (r.targetType === 'ad') { const k = PL.q.campaign(r.targetId); return k ? E(k.name) : '(removed)'; }
    if (r.targetType === 'comment') { const [p, c] = r.targetId.split(':'), po = PL.q.post(p), cm = po && po.comments.find(x => x.id === c); return cm ? E(cm.text.slice(0, 70)) : '(removed)'; }
    return E(r.targetId);
  }
  reg('/admin/moderation', () => {
    const v = PL.vf('amod', { tab: 'Open', page: 1 }), list = db().reports.filter(r => v.tab === 'All' || r.status === v.tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), pg = ui().paginate(list, v.page, 10);
    return `${ui().pageHead('Reports & moderation')}${ui().tabs(['Open', 'Resolved', 'Dismissed', 'Removed', 'All'], v.tab, 'amod')}${ui().table({ cols: [{ label: 'Target', render: r => `<span class="tag">${E(r.targetType)}</span> ${targetLabel(r)}` }, { label: 'Reason', render: r => E(r.reason) }, { label: 'Reporter', render: r => E((PL.q.user(r.reporterId) || {}).name || '—') }, { label: 'Date', render: r => F().date(r.createdAt) }, { label: 'Status', render: r => ui().badge(r.status) }, { label: '', render: r => r.status === 'Open' ? `<div class="row"><button class="btn btn-sm" data-action="rep" data-id="${r.id}" data-v="Resolved">Resolve</button><button class="btn btn-secondary btn-sm" data-action="rep" data-id="${r.id}" data-v="Dismissed">Dismiss</button>${['post', 'comment', 'job'].includes(r.targetType) ? `<button class="btn btn-outline-danger btn-sm" data-action="rep" data-id="${r.id}" data-v="Removed">Remove content</button>` : ''}</div>` : '' }], rows: pg.items, empty: 'No reports.' })}${ui().pager({ total: list.length, page: pg.page, per: 10, scope: 'amod' })}`;
  }, 'Moderation');
  PL.act('rep', async d => {
    const r = db().reports.find(x => x.id === d.id);
    if (d.v === 'Removed') {
      if (!(await ui().confirm({ title: 'Remove this content?', message: 'It will no longer be visible.', confirmText: 'Remove', danger: true }))) return;
      if (r.targetType === 'post') { const p = PL.q.post(r.targetId); if (p) p.removed = true; }
      if (r.targetType === 'job') { const j = PL.q.job(r.targetId); if (j) j.status = 'Rejected'; }
      if (r.targetType === 'comment') { const [p, c] = r.targetId.split(':'), po = PL.q.post(p); if (po) po.comments = po.comments.filter(x => x.id !== c); }
    }
    r.status = d.v; r.history.push({ status: d.v, at: F().iso(), by: me().id });
    PL.audit(d.v + ' report', 'report', r.id); PL.notify(r.reporterId, 'moderation', 'Report ' + d.v.toLowerCase(), 'Thanks for helping keep PharmaLinkIn safe.', '');
    PL.store.save(); ui().toast('Report ' + d.v.toLowerCase()); PL.rerender();
  });

  /* advertisements */
  reg('/admin/advertisements', () => {
    const v = PL.vf('aads', { tab: 'Pending Approval', page: 1 }), list = db().campaigns.filter(k => v.tab === 'All' || k.status === v.tab), pg = ui().paginate(list, v.page, 8);
    return `${ui().pageHead('Advertisement approvals', '', 'Review creative, targeting and budget')}${ui().tabs(['Pending Approval', 'Active', 'Rejected', 'All'], v.tab, 'aads')}
      <div class="stack">${pg.items.map(k => `<div class="card pad"><div class="row between"><div><b>${E(k.name)}</b> ${ui().badge(k.status)}<div class="xs muted">${E((PL.q.user(k.advertiserId) || {}).name || '')} · ${E(k.type)} · ${E(k.objective)} · Budget ${F().inr(k.budget)} · ${F().date(k.startDate)} – ${F().date(k.endDate)}</div></div>${k.status === 'Pending Approval' ? `<div class="row"><button class="btn btn-sm" data-action="ad-mod" data-id="${k.id}" data-v="Active">Approve</button><button class="btn btn-outline-danger btn-sm" data-action="ad-mod" data-id="${k.id}" data-v="Rejected">Reject</button></div>` : ''}</div><div class="grid g2 mt-s"><div>${PL.ads.card(Object.assign({}, k, { status: 'Active' }), 'slot', true)}</div><div class="small"><p><b>Placement:</b> ${E((k.placement || []).join(', '))}</p><p><b>Audience:</b> ${E((k.audience || {}).location || 'All')} / ${E((k.audience || {}).category || 'All')}</p><p><b>Destination:</b> ${E(k.creative.destination || '—')}</p>${k.rejectionReason ? `<p class="muted"><b>Rejection:</b> ${E(k.rejectionReason)}</p>` : ''}</div></div></div>`).join('') || ui().empty('megaphone', 'No campaigns here', '')}</div>${ui().pager({ total: list.length, page: pg.page, per: 8, scope: 'aads' })}`;
  }, 'Advertisements');
  PL.act('ad-mod', async d => {
    const k = PL.q.campaign(d.id);
    if (d.v === 'Rejected') { const x = await ui().ask({ title: 'Reject campaign', confirmText: 'Reject', fields: [{ name: 'reason', label: 'Reason (shown to advertiser)', type: 'textarea', required: true, rows: 3 }] }); if (!x) return; k.rejectionReason = x.reason; }
    k.status = d.v; PL.audit(d.v === 'Active' ? 'Approved campaign' : 'Rejected campaign', 'campaign', k.id);
    PL.notify(k.advertiserId, 'ad', d.v === 'Active' ? 'Campaign approved' : 'Campaign rejected', k.name + (d.v === 'Active' ? ' is now live.' : ': ' + k.rejectionReason), '/advertiser/campaigns/' + k.id);
    PL.store.save(); ui().toast('Campaign ' + (d.v === 'Active' ? 'approved' : 'rejected')); PL.rerender();
  });

  /* subscriptions */
  reg('/admin/subscriptions', () => {
    const d = db(), rows = d.subscriptions;
    return `${ui().pageHead('Subscriptions & billing')}<div class="grid g3 mb">${ui().kpi('Active subscriptions', rows.filter(s => s.status === 'Active').length, rows.length + ' total', 'users')}${ui().kpi('Paid revenue', F().inr(d.invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0)), 'Demo figures', 'chart', 'teal')}${ui().kpi('Failed payments', d.invoices.filter(i => i.status === 'Failed').length, 'Needs follow-up', 'alert', 'red')}</div>
      <h3>Subscriptions</h3>${ui().table({ cols: [{ label: 'User', render: s => E((PL.q.user(s.userId) || {}).name || s.userId) }, { label: 'Plan', render: s => E(PL.q.plan(s.planId).name) }, { label: 'Status', render: s => ui().badge(s.status) }, { label: 'Renewal', render: s => F().date(s.renewalDate) }, { label: 'Unlocks used', render: s => s.usage.resumes }], rows })}
      <h3 class="mt">Invoices</h3>${ui().table({ cols: [{ label: 'Invoice', render: i => E(i.id.toUpperCase()) }, { label: 'User', render: i => E((PL.q.user(i.userId) || {}).name || i.userId) }, { label: 'Plan', render: i => E(PL.q.plan(i.planId).name) }, { label: 'Amount', render: i => F().inr(i.amount) }, { label: 'Status', render: i => ui().badge(i.status) }, { label: 'Date', render: i => F().date(i.createdAt) }], rows: d.invoices })}`;
  }, 'Subscriptions');

  /* analytics */
  reg('/admin/reports', () => {
    const d = db(), ms = lastMonths(6), top = d.jobs.slice().sort((a, b) => b.views - a.views).slice(0, 5);
    const cats = {}; d.jobs.filter(j => j.status === 'Published').forEach(j => (cats[j.department] = (cats[j.department] || 0) + 1));
    const cat = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const ads = d.campaigns.reduce((m, k) => (m.i += k.metrics.impressions, m.c += k.metrics.clicks, m.s += k.spend, m), { i: 0, c: 0, s: 0 });
    return `${ui().pageHead('Reports & analytics', `<button class="btn btn-secondary" data-action="admin-export">${I('download', 16)} Export CSV</button>`)}
      <div class="grid g2"><div class="card pad"><h3>Applications per month</h3>${ui().lineChart({ labels: ms.map(m => m.label), values: countBy(d.applications, ms, a => a.appliedAt), color: '#0E9384', name: 'Applications' })}</div>
      <div class="card pad"><h3>Published jobs by category</h3>${ui().barChart({ labels: cat.map(c => c[0].split(' ')[0]), series: [{ name: 'Jobs', color: '#155EEF', values: cat.map(c => c[1]) }] })}</div>
      <div class="card pad"><h3>Most viewed jobs</h3>${top.map(j => `<div class="person-row"><div class="grow small">${E(j.title)}</div><b>${F().num(j.views)}</b></div>`).join('')}</div>
      <div class="card pad"><h3>Advertising</h3><dl class="kv"><dt>Impressions</dt><dd>${F().num(ads.i)}</dd><dt>Clicks</dt><dd>${F().num(ads.c)}</dd><dt>CTR</dt><dd>${F().pct(ads.c, ads.i)}</dd><dt>Spend</dt><dd>${F().inr(ads.s)}</dd></dl></div></div>`;
  }, 'Analytics');
  PL.act('admin-export', () => ui().csv('platform-summary.csv', [['Metric', 'Value'], ['Users', db().users.length], ['Jobs', db().jobs.length], ['Applications', db().applications.length], ['Campaigns', db().campaigns.length], ['Open reports', db().reports.filter(r => r.status === 'Open').length]]));

  /* settings */
  reg('/admin/settings', () => {
    const s = db().settings, cats = db().categories;
    return `${ui().pageHead('Platform settings')}<div class="grid g2"><form class="card pad-lg" data-form="admin-settings" novalidate>${ui().field({ name: 'siteName', label: 'Site name', value: s.siteName, required: true })}${ui().field({ name: 'supportEmail', label: 'Support email', type: 'email', value: s.supportEmail, required: true })}
      <label class="check mb"><input type="checkbox" name="moderation" ${s.moderation ? 'checked' : ''}> Require admin approval for new jobs</label><label class="check mb"><input type="checkbox" name="allowRegistration" ${s.allowRegistration ? 'checked' : ''}> Allow new registrations</label><label class="check mb"><input type="checkbox" name="maintenance" ${s.maintenance ? 'checked' : ''}> Maintenance mode (banner only in demo)</label><button class="btn">Save settings</button></form>
      <div class="card pad-lg"><h3>Job categories</h3><div class="chips mb">${cats.map(c => `<span class="chip">${E(c)} <button class="link-btn" data-action="cat-del" data-c="${E(c)}" aria-label="Remove ${E(c)}">×</button></span>`).join('')}</div><form class="row nowrap" data-form="cat-add" novalidate><label class="sr" for="newcat">New category</label><input id="newcat" name="c" class="grow" placeholder="New category" required><button class="btn btn-secondary">Add</button></form></div></div>`;
  }, 'Settings');
  PL.form('admin-settings', f => { if (!ui().validate(f)) return; const x = ui().formData(f), s = db().settings; Object.assign(s, { siteName: x.siteName, supportEmail: x.supportEmail, moderation: !!f.moderation.checked, allowRegistration: !!f.allowRegistration.checked, maintenance: !!f.maintenance.checked }); PL.audit('Updated settings', 'settings', 'site'); PL.store.save(); ui().toast('Settings saved'); PL.rerender(); });
  PL.form('cat-add', f => { const c = f.c.value.trim(); if (!c) return; if (db().categories.some(x => x.toLowerCase() === c.toLowerCase())) return ui().toast('Category exists', 'err'); db().categories.push(c); PL.audit('Added category', 'category', c); PL.store.save(); PL.rerender(); });
  PL.act('cat-del', d => { db().categories = db().categories.filter(c => c !== d.c); PL.audit('Removed category', 'category', d.c); PL.store.save(); PL.rerender(); });

  /* audit logs */
  reg('/admin/audit-logs', () => {
    const v = PL.vf('alog', { q: '', page: 1 }), list = db().auditLogs.filter(l => !v.q || (l.action + l.targetType + l.targetId).toLowerCase().includes(v.q.toLowerCase())).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), pg = ui().paginate(list, v.page, 12);
    return `${ui().pageHead('Audit logs')}<div class="card pad mb">${ui().filterCtl('alog', { name: 'q', label: 'Search logs', placeholder: 'Search action or target' })}</div>${ui().table({ cols: [{ label: 'When', render: l => F().date(l.createdAt) }, { label: 'Admin', render: l => E((PL.q.user(l.adminId) || {}).name || l.adminId) }, { label: 'Action', render: l => E(l.action) }, { label: 'Target', render: l => `${E(l.targetType)} ${E(l.targetId)}` }], rows: pg.items, empty: 'No log entries.' })}${ui().pager({ total: list.length, page: pg.page, per: 12, scope: 'alog' })}`;
  }, 'Audit logs');
})();
