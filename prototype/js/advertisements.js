/* Advertising engine (delivery, tracking, ad components) + advertiser workspace */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt;
  const R = PL.router, CPM = 0.35, CPC = 12;
  const seen = new Set();

  const ads = (PL.ads = {});
  const today = () => F().today();
  ads.eligible = placement => {
    const u = PL.auth.user(), hidden = u ? (db().hiddenAds[u.id] || []) : [];
    return db().campaigns.filter(c => c.status === 'Active' && c.placement.includes(placement) && c.startDate <= today() && c.endDate >= today() && c.spend < c.budget && !hidden.includes(c.id));
  };
  ads.pick = (placement, exclude = []) => { const l = ads.eligible(placement).filter(c => !exclude.includes(c.id)); if (!l.length) return null; return l[Math.floor(Date.now() / 60000) % l.length]; };
  ads.impression = c => {
    if (seen.has(c.id)) return; seen.add(c.id);
    c.metrics.impressions++; c.spend = Math.min(c.budget, Math.round((c.spend + CPM) * 100) / 100);
    if (c.spend >= c.budget) c.status = 'Completed';
    PL.store.save();
  };
  ads.click = c => {
    c.metrics.clicks++; c.spend = Math.min(c.budget, Math.round((c.spend + CPC) * 100) / 100);
    if (c.spend >= c.budget) c.status = 'Completed';
    PL.store.save();
  };
  const dest = c => c.creative.destination;
  ads.card = (c, kind = 'slot', preview = false) => {
    if (!preview) ads.impression(c); const cr = c.creative;
    const img = cr.image || ui().art(cr.imageSeed || c.id, cr.brand, 640, 280);
    const menu = ui().menu([{ label: 'Hide this ad', action: 'ad-hide', icon: 'eyeoff', data: { id: c.id } }, { label: 'Report ad', action: 'report', icon: 'flag', data: { type: 'ad', id: c.id } }], { label: 'Ad options' });
    if (kind === 'feed') return `<article class="card post ad-post" aria-label="Sponsored"><div class="post-head"><span class="logo-box" style="width:44px;height:44px;background:#B54708;font-size:16px;color:#fff" aria-hidden="true">Ad</span><div class="grow"><div class="bold">${E(cr.brand)}</div>${ui().sponsoredLabel()}</div>${menu}</div><div class="post-body"><p>${E(cr.description)}</p></div><img alt="" src="${img}" style="width:100%;display:block"><div class="row between pad"><div><div class="bold">${E(cr.headline)}</div></div><button class="btn btn-sm" data-action="ad-click" data-id="${c.id}">${E(cr.cta)} ${I('external', 14)}</button></div></article>`;
    return `<aside class="card sponsored-card ad-slot" style="overflow:hidden" aria-label="Sponsored"><div class="row between" style="padding:8px 12px">${ui().sponsoredLabel()}${menu}</div><img alt="" src="${img}" style="width:100%;display:block;aspect-ratio:640/280;object-fit:cover"><div class="pad"><div class="xs muted">${E(cr.brand)}</div><h4 style="margin:2px 0">${E(cr.headline)}</h4><p class="small muted" style="margin:0 0 10px">${E(cr.description)}</p><button class="btn btn-sm" data-action="ad-click" data-id="${c.id}">${E(cr.cta)}</button></div></aside>`;
  };
  ads.slot = placement => { const c = ads.pick(placement); return c ? `<div class="mb">${ads.card(c)}</div>` : ''; };
  ads.searchAd = () => ads.pick('Search');
  ads.homeBand = () => {
    const c = ads.pick('Companies') || ads.pick('Jobs'); if (!c) return '';
    return `<section class="section"><div class="container">${ads.card(c)}</div></section>`;
  };
  ads.feedAd = exclude => ads.pick('Feed', exclude);

  PL.act('ad-click', d => {
    const c = PL.q.campaign(d.id); if (!c) return; ads.click(c);
    const to = dest(c);
    if (to.startsWith('#')) PL.go(to.slice(1)); else { ui().toast('Opening advertiser site (demo link)', 'info'); window.open(to, '_blank', 'noopener'); }
  });
  PL.act('ad-hide', d => {
    const u = PL.auth.user(); if (!u) return ui().toast('Sign in to hide ads.', 'info');
    (db().hiddenAds[u.id] = db().hiddenAds[u.id] || []).push(d.id); PL.store.save(); ui().toast('Ad hidden. We will show you fewer like it.'); PL.rerender();
  });

  /* ---------- advertiser workspace ---------- */
  const OWN = { layout: 'advertiser', roles: ['advertiser'] };
  const mine = () => db().campaigns.filter(c => c.advertiserId === PL.auth.user().id);
  const sum = (l, f) => l.reduce((a, c) => a + f(c), 0);
  const ctr = c => c.metrics.impressions ? (c.metrics.clicks / c.metrics.impressions * 100) : 0;
  const cpc = c => c.metrics.clicks ? c.spend / c.metrics.clicks : 0;
  const STATUS = ['Active', 'Draft', 'Pending Approval', 'Paused', 'Rejected', 'Completed'];

  R.add('/advertiser/dashboard', () => {
    const l = mine(), act = l.filter(c => c.status === 'Active'), imp = sum(l, c => c.metrics.impressions), clk = sum(l, c => c.metrics.clicks), sp = sum(l, c => c.spend);
    const top = l.slice().sort((a, b) => b.metrics.clicks - a.metrics.clicks).slice(0, 5);
    return `${ui().pageHead('Advertiser dashboard', `<a class="btn" href="#/advertiser/campaigns/new">${I('plus', 16)} New campaign</a>`, 'Performance across your campaigns (demo metrics).')}
      <div class="grid g4">${ui().kpi('Active campaigns', act.length, `${l.length} total`, 'megaphone', '', '/advertiser/campaigns')}${ui().kpi('Impressions', F().num(imp), 'All campaigns', 'eye')}${ui().kpi('Clicks', F().num(clk), 'CTR ' + F().pct(clk, imp), 'zap', 'teal')}${ui().kpi('Spend', F().inr(Math.round(sp)), 'of ' + F().inr(sum(l, c => c.budget)) + ' budget', 'rupee', 'amber')}</div>
      ${l.some(c => c.status === 'Pending Approval') ? `<div class="mt">${ui().notice(l.filter(c => c.status === 'Pending Approval').length + ' campaign(s) are awaiting admin approval.', '')}</div>` : ''}${l.filter(c => c.status === 'Rejected').map(c => `<div class="mt">${ui().notice(`<b>${E(c.name)}</b> was rejected: ${E(c.rejectionReason)} <a href="#/advertiser/campaigns/${c.id}/edit">Edit & resubmit</a>`, 'err')}</div>`).join('')}
      <div class="grid g2 mt"><div class="card pad"><h3>Impressions by campaign</h3>${ui().barChart({ labels: top.map(c => c.name.split(' ')[0]), series: [{ name: 'Impressions', color: '#155EEF', values: top.map(c => c.metrics.impressions) }], fmtv: F().num })}</div>
      <div class="card pad"><h3>Top campaigns</h3>${ui().table({ cols: [{ label: 'Campaign', render: c => `<a href="#/advertiser/campaigns/${c.id}">${E(c.name)}</a>` }, { label: 'Clicks', render: c => F().num(c.metrics.clicks) }, { label: 'CTR', render: c => ctr(c).toFixed(2) + '%' }, { label: 'Status', render: c => ui().badge(c.status) }], rows: top })}</div></div>
      <div class="card pad mt"><h3>Budget pacing</h3>${act.map(c => `<div class="mb"><div class="row between small"><span>${E(c.name)}</span><span>${F().inr(Math.round(c.spend))} / ${F().inr(c.budget)}</span></div>${ui().progress(c.spend / c.budget * 100)}</div>`).join('') || '<p class="muted">No active campaigns.</p>'}</div>`;
  }, Object.assign({ title: 'Advertiser dashboard' }, OWN));

  R.add('/advertiser/campaigns', () => {
    const v = PL.vf('camps', { tab: 'All', q: '', page: 1 }), all = mine(), q = v.q.toLowerCase();
    const list = all.filter(c => (v.tab === 'All' || c.status === v.tab) && (!q || c.name.toLowerCase().includes(q)));
    const rows = ui().paginate(list, v.page, 8);
    return `${ui().pageHead('Campaigns', `<a class="btn" href="#/advertiser/campaigns/new">${I('plus', 16)} New campaign</a>`)}
      ${ui().tabs([{ id: 'All', label: 'All', count: all.length }].concat(STATUS.map(s => ({ id: s, label: s, count: all.filter(c => c.status === s).length }))), v.tab, 'camps')}
      <div class="card mt-s"><div class="pad">${ui().filterCtl('camps', { name: 'q', label: 'Search campaigns', placeholder: 'Search campaigns' })}</div>${ui().table({ empty: 'No campaigns in this view.', rows, cols: [
        { label: 'Campaign', render: c => `<a class="bold" href="#/advertiser/campaigns/${c.id}">${E(c.name)}</a><div class="xs muted">${E(c.type)} · ${E(c.placement.join(', '))}</div>` }, { label: 'Status', render: c => ui().badge(c.status) }, { label: 'Dates', render: c => F().date(c.startDate) + ' – ' + F().date(c.endDate) }, { label: 'Budget', render: c => `${F().inr(Math.round(c.spend))} / ${F().inr(c.budget)}` }, { label: 'Impr.', render: c => F().num(c.metrics.impressions) }, { label: 'CTR', render: c => ctr(c).toFixed(2) + '%' },
        { label: 'Actions', render: c => ui().menu([{ label: 'View', href: '#/advertiser/campaigns/' + c.id, icon: 'eye' }, { label: 'Edit', href: '#/advertiser/campaigns/' + c.id + '/edit', icon: 'edit' }].concat(c.status === 'Active' ? [{ label: 'Pause', action: 'camp-status', icon: 'pause', data: { id: c.id, to: 'Paused' } }] : []).concat(c.status === 'Paused' ? [{ label: 'Resume', action: 'camp-status', icon: 'play', data: { id: c.id, to: 'Active' } }] : []).concat([{ label: 'Duplicate', action: 'camp-dup', icon: 'copy', data: { id: c.id } }]).concat(['Draft', 'Rejected'].includes(c.status) ? ['-', { label: 'Delete', action: 'camp-del', icon: 'trash', danger: true, data: { id: c.id } }] : []), { align: 'right' }) }] })}</div>${ui().pager({ total: list.length, page: v.page, per: 8, scope: 'camps' })}`;
  }, Object.assign({ title: 'Campaigns' }, OWN));

  PL.act('camp-status', d => { const c = PL.q.campaign(d.id); c.status = d.to; PL.store.save(); ui().toast('Campaign ' + (d.to === 'Paused' ? 'paused' : 'resumed')); PL.rerender(); });
  PL.act('camp-dup', d => {
    const c = PL.q.campaign(d.id), n = JSON.parse(JSON.stringify(c)); n.id = PL.store.id('k'); n.name = c.name + ' (copy)'; n.status = 'Draft'; n.spend = 0; n.metrics = { impressions: 0, clicks: 0, conversions: 0 }; n.rejectionReason = ''; n.createdAt = F().iso();
    db().campaigns.unshift(n); PL.store.save(); ui().toast('Duplicated as draft'); PL.rerender();
  });
  PL.act('camp-del', async d => { if (!(await ui().confirm({ title: 'Delete campaign?', message: 'This permanently removes the draft.', confirmText: 'Delete', danger: true }))) return; const a = db().campaigns; a.splice(a.findIndex(c => c.id === d.id), 1); PL.store.save(); ui().toast('Campaign deleted'); PL.go('/advertiser/campaigns'); });
  PL.act('camp-submit', d => { const c = PL.q.campaign(d.id); c.status = 'Pending Approval'; c.rejectionReason = ''; db().users.filter(u => u.role === 'admin').forEach(a => PL.notify(a.id, 'campaign', 'Campaign awaiting approval', c.name, '/admin/advertisements')); PL.store.save(); ui().toast('Submitted for approval'); PL.rerender(); });
  PL.act('camp-simulate', d => {
    const c = PL.q.campaign(d.id); if (c.status !== 'Active') return ui().toast('Only active campaigns can deliver.', 'info');
    const imp = 800 + Math.floor(Math.random() * 400), clk = Math.round(imp * (0.018 + Math.random() * 0.012));
    c.metrics.impressions += imp; c.metrics.clicks += clk; c.metrics.conversions += Math.round(clk * 0.1); c.spend = Math.min(c.budget, Math.round(c.spend + imp * CPM / 10 + clk * CPC / 10));
    if (c.spend >= c.budget) { c.status = 'Completed'; PL.notify(c.advertiserId, 'campaign', 'Budget exhausted', c.name + ' has completed.', '/advertiser/campaigns/' + c.id); }
    PL.store.save(); ui().toast(`Simulated ${F().num(imp)} impressions and ${clk} clicks`); PL.rerender();
  });

  function formView(c) {
    const e = c || { name: '', objective: 'Awareness', type: 'Course', placement: ['Feed'], audience: { location: 'Pan-India', category: '' }, budget: 20000, startDate: today(), endDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), creative: { headline: '', description: '', cta: 'Learn more', destination: 'https://', imageSeed: 'new' } };
    const cr = e.creative;
    const steps = [
      { title: 'Campaign details', html: `${ui().field({ name: 'name', label: 'Campaign name', required: true, value: e.name, full: true })}${ui().field({ name: 'objective', label: 'Objective', type: 'select', options: ['Awareness', 'Registrations', 'Enrolments', 'Leads', 'Applications'], value: e.objective })}${ui().field({ name: 'type', label: 'Ad type', type: 'select', options: ['Course', 'Webinar', 'Product', 'Hiring', 'Brand', 'Newsletter'], value: e.type })}${ui().field({ name: 'placement', label: 'Placements', type: 'checkboxes', options: PL.PLACEMENTS, value: e.placement, full: true })}<small class="err full" id="plerr" role="alert"></small>` },
      { title: 'Creative', html: `<div class="full grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start"><div>${ui().field({ name: 'headline', label: 'Headline (max 60)', required: true, value: cr.headline, attrs: ' maxlength="60" data-live="ad-preview"' })}${ui().field({ name: 'description', label: 'Description (max 160)', type: 'textarea', rows: 3, required: true, value: cr.description, attrs: ' maxlength="160" data-live="ad-preview"' })}<div class="form-grid">${ui().field({ name: 'cta', label: 'Button text', required: true, value: cr.cta, attrs: ' maxlength="20" data-live="ad-preview"' })}${ui().field({ name: 'destination', label: 'Destination URL', type: 'url', required: true, value: cr.destination })}</div><div class="row"><button type="button" class="btn btn-secondary btn-sm" data-action="ad-image">${I('image', 16)} Upload image (max 250 KB)</button><span class="xs muted" id="adimgname">${cr.image ? 'Custom image attached' : 'Generated placeholder will be used'}</span></div></div><div><h3>Live preview</h3><div id="adprev">${previewHtml(cr)}</div><p class="xs muted mt-s">Ads are labelled “Sponsored” everywhere they appear. Ad copy must not include guarantees of jobs or unverifiable claims.</p></div></div>` },
      { title: 'Audience, budget & schedule', html: `${ui().field({ name: 'location', label: 'Location', value: e.audience.location })}${ui().field({ name: 'category', label: 'Job function', type: 'select', placeholder: 'Any function', options: PL.CATEGORIES, value: e.audience.category })}${ui().field({ name: 'budget', label: 'Total budget (₹)', type: 'number', required: true, min: 1000, value: e.budget })}<div></div>${ui().field({ name: 'startDate', label: 'Start date', type: 'date', required: true, value: e.startDate })}${ui().field({ name: 'endDate', label: 'End date', type: 'date', required: true, value: e.endDate })}` }];
    return `<div class="card pad-lg">${ui().stepForm({ attrs: `data-form="campaign" data-id="${c ? c.id : ''}"`, steps, submit: 'Submit for approval', extra: '<a class="btn btn-ghost" href="#/advertiser/campaigns">Cancel</a><button class="btn btn-secondary" type="submit" value="draft" data-all="1">Save draft</button>' })}</div>`;
  }
  function previewHtml(cr, img) {
    return `<aside class="card sponsored-card" style="overflow:hidden"><div class="row" style="padding:8px 12px">${ui().sponsoredLabel()}</div><img alt="" src="${img || cr.image || ui().art(cr.imageSeed || 'new', cr.brand || 'Your brand', 640, 280)}" style="width:100%;display:block;aspect-ratio:640/280;object-fit:cover"><div class="pad"><h4 style="margin:0 0 2px">${E(cr.headline) || 'Your headline'}</h4><p class="small muted" style="margin:0 0 10px">${E(cr.description) || 'Your description appears here.'}</p><span class="btn btn-sm">${E(cr.cta) || 'Learn more'}</span></div></aside>`;
  }
  let pendingImg = null;
  PL.live['ad-preview'] = () => { const f = document.querySelector('form[data-form="campaign"]'); if (!f) return; document.getElementById('adprev').innerHTML = previewHtml({ headline: f.headline.value, description: f.description.value, cta: f.cta.value, brand: PL.auth.user().brand }, pendingImg); };
  PL.act('ad-image', () => ui().pickImage(data => { pendingImg = data; document.getElementById('adimgname').textContent = 'Custom image attached'; PL.live['ad-preview'](); }));

  R.add('/advertiser/campaigns/new', ctx => { pendingImg = null; return { html: `${ui().pageHead('Create campaign')}${formView(null)}` }; }, Object.assign({ title: 'New campaign' }, OWN));
  R.add('/advertiser/campaigns/:id/edit', ctx => {
    const c = PL.q.campaign(ctx.params.id); if (!c || c.advertiserId !== PL.auth.user().id) return ui().empty('megaphone', 'Campaign not found', '', '<a class="btn" href="#/advertiser/campaigns">Back</a>');
    if (ctx.fresh) pendingImg = c.creative.image || null;
    return `${ui().pageHead('Edit campaign', '', c.status === 'Active' ? 'Editing an active campaign sends it back for approval when you submit.' : '')}${c.rejectionReason ? ui().notice('Rejected: ' + E(c.rejectionReason), 'err') : ''}${formView(c)}`;
  }, Object.assign({ title: 'Edit campaign' }, OWN));

  PL.form('campaign', (f, e) => {
    const d = ui().formData(f), u = PL.auth.user(), submit = e.submitter && e.submitter.value === 'submit';
    const okV = ui().validate(f); const pl = d.placement || []; document.getElementById('plerr').textContent = pl.length ? '' : 'Choose at least one placement';
    if (!pl.length) ui().stepShow(f, 0);
    if (!okV || !pl.length) return;
    if (d.endDate < d.startDate) return ui().setError(f, 'endDate', 'End date must be after start date');
    if (/guarantee/i.test(d.headline + ' ' + d.description)) return ui().setError(f, 'description', 'Guarantee claims are not allowed in ad copy');
    const creative = { headline: d.headline, description: d.description, cta: d.cta, destination: d.destination, imageSeed: d.headline.slice(0, 12), brand: u.brand, image: pendingImg || '' };
    let c = f.dataset.id ? PL.q.campaign(f.dataset.id) : null;
    const payload = { name: d.name, objective: d.objective, type: d.type, placement: pl, audience: { location: d.location, category: d.category }, budget: Number(d.budget), startDate: d.startDate, endDate: d.endDate, creative };
    if (c) Object.assign(c, payload); else { c = Object.assign({ id: PL.store.id('k'), advertiserId: u.id, spend: 0, status: 'Draft', metrics: { impressions: 0, clicks: 0, conversions: 0 }, createdAt: F().iso(), rejectionReason: '' }, payload); db().campaigns.unshift(c); }
    if (submit) { c.status = 'Pending Approval'; c.rejectionReason = ''; db().users.filter(x => x.role === 'admin').forEach(a => PL.notify(a.id, 'campaign', 'Campaign awaiting approval', c.name, '/admin/advertisements')); }
    else if (!['Draft', 'Rejected', 'Pending Approval', 'Paused', 'Active', 'Completed'].includes(c.status)) c.status = 'Draft';
    PL.store.save(); ui().toast(submit ? 'Campaign submitted for approval' : 'Draft saved'); PL.go('/advertiser/campaigns/' + c.id);
  });

  R.add('/advertiser/campaigns/:id', ctx => {
    const c = PL.q.campaign(ctx.params.id); if (!c || c.advertiserId !== PL.auth.user().id) return ui().empty('megaphone', 'Campaign not found', '', '<a class="btn" href="#/advertiser/campaigns">Back</a>');
    const m = c.metrics;
    return `<a href="#/advertiser/campaigns" class="small">${I('left', 14)} Campaigns</a>${ui().pageHead(c.name, `${ui().badge(c.status)}<a class="btn btn-secondary" href="#/advertiser/campaigns/${c.id}/edit">${I('edit', 16)} Edit</a>${c.status === 'Active' ? `<button class="btn btn-secondary" data-action="camp-simulate" data-id="${c.id}">${I('zap', 16)} Simulate delivery</button><button class="btn btn-secondary" data-action="camp-status" data-id="${c.id}" data-to="Paused">${I('pause', 16)} Pause</button>` : ''}${c.status === 'Paused' ? `<button class="btn" data-action="camp-status" data-id="${c.id}" data-to="Active">${I('play', 16)} Resume</button>` : ''}${['Draft', 'Rejected'].includes(c.status) ? `<button class="btn" data-action="camp-submit" data-id="${c.id}">Submit for approval</button>` : ''}`)}
      ${c.status === 'Rejected' ? ui().notice('<b>Rejected:</b> ' + E(c.rejectionReason), 'err') : ''}${c.status === 'Pending Approval' ? ui().notice('Awaiting admin review. Ads only run after approval.', '') : ''}
      <div class="grid g4 mt">${ui().kpi('Impressions', F().num(m.impressions), '', 'eye')}${ui().kpi('Clicks', F().num(m.clicks), 'CTR ' + ctr(c).toFixed(2) + '%', 'zap', 'teal')}${ui().kpi('Conversions', F().num(m.conversions), '', 'checkc', 'green')}${ui().kpi('Spend', F().inr(Math.round(c.spend)), 'CPC ' + F().inr(Math.round(cpc(c))), 'rupee', 'amber')}</div>
      <div class="grid g2 mt"><div class="card pad"><h3>Details</h3><dl class="kv"><dt>Objective</dt><dd>${E(c.objective)}</dd><dt>Type</dt><dd>${E(c.type)}</dd><dt>Placements</dt><dd>${E(c.placement.join(', '))}</dd><dt>Audience</dt><dd>${E(c.audience.location)}${c.audience.category ? ' · ' + E(c.audience.category) : ''}</dd><dt>Schedule</dt><dd>${F().date(c.startDate)} – ${F().date(c.endDate)}</dd><dt>Budget</dt><dd>${F().inr(c.budget)}</dd></dl><div class="mt">${ui().progress(c.spend / c.budget * 100)}</div></div>
      <div><h3>Creative preview</h3>${previewHtml(c.creative)}</div></div>`;
  }, Object.assign({ title: 'Campaign' }, OWN));

  R.add('/advertiser/analytics', () => {
    const v = PL.vf('ana', { camp: '', days: '14' }), all = mine().filter(c => c.metrics.impressions > 0), sel = v.camp ? all.filter(c => c.id === v.camp) : all, n = Number(v.days);
    const imp = sum(sel, c => c.metrics.impressions), clk = sum(sel, c => c.metrics.clicks);
    const labels = [], vals = [], cv = []; const w = Array.from({ length: n }, (_, i) => 0.6 + ((i * 7 + 3) % 10) / 10); const tw = w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) { const d = new Date(Date.now() - (n - 1 - i) * 864e5); labels.push(d.getDate() + '/' + (d.getMonth() + 1)); vals.push(Math.round(imp * (w[i] / tw))); cv.push(Math.round(clk * (w[i] / tw))); }
    return `${ui().pageHead('Analytics', `<button class="btn btn-secondary" data-action="ana-export">${I('download', 16)} Export CSV</button>`, 'Daily values are an estimated distribution of campaign totals (demo).')}
      <div class="card pad mb"><div class="grid g2">${ui().filterCtl('ana', { name: 'camp', type: 'select', label: 'Campaign', options: [{ v: '', l: 'All campaigns' }].concat(all.map(c => ({ v: c.id, l: c.name }))) })}${ui().filterCtl('ana', { name: 'days', type: 'select', label: 'Range', options: [{ v: '7', l: 'Last 7 days' }, { v: '14', l: 'Last 14 days' }, { v: '30', l: 'Last 30 days' }] })}</div></div>
      <div class="grid g4">${ui().kpi('Impressions', F().num(imp), '', 'eye')}${ui().kpi('Clicks', F().num(clk), '', 'zap', 'teal')}${ui().kpi('CTR', F().pct(clk, imp), '', 'trend', 'green')}${ui().kpi('Spend', F().inr(Math.round(sum(sel, c => c.spend))), '', 'rupee', 'amber')}</div>
      <div class="grid g2 mt"><div class="card pad"><h3>Impressions per day</h3>${ui().lineChart({ labels: labels.filter((_, i) => n <= 14 || i % 3 === 0), values: vals.filter((_, i) => n <= 14 || i % 3 === 0), name: 'Impressions' })}</div><div class="card pad"><h3>Clicks per day</h3>${ui().lineChart({ labels: labels.filter((_, i) => n <= 14 || i % 3 === 0), values: cv.filter((_, i) => n <= 14 || i % 3 === 0), color: '#0D9488', name: 'Clicks' })}</div></div>
      <div class="card mt">${ui().table({ rows: sel, cols: [{ label: 'Campaign', render: c => E(c.name) }, { label: 'Impressions', render: c => F().num(c.metrics.impressions) }, { label: 'Clicks', render: c => F().num(c.metrics.clicks) }, { label: 'CTR', render: c => ctr(c).toFixed(2) + '%' }, { label: 'Conversions', render: c => c.metrics.conversions }, { label: 'Spend', render: c => F().inr(Math.round(c.spend)) }, { label: 'CPC', render: c => F().inr(Math.round(cpc(c))) }] })}</div>`;
  }, Object.assign({ title: 'Analytics' }, OWN));
  PL.act('ana-export', () => ui().csv('campaign-analytics.csv', [['Campaign', 'Status', 'Impressions', 'Clicks', 'CTR %', 'Conversions', 'Spend', 'Budget']].concat(mine().map(c => [c.name, c.status, c.metrics.impressions, c.metrics.clicks, ctr(c).toFixed(2), c.metrics.conversions, Math.round(c.spend), c.budget]))));
})();
