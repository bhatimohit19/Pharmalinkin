/* Job search (Naukri-style): search home -> results with filters -> job detail. Used right after onboarding. */
(function () {
  const PL = window.PL, ui = () => PL.ui, db = () => PL.store.s, E = s => PL.esc(s), I = (n, s) => PL.ui.icon(n, s), F = () => PL.ui.fmt, R = PL.router;
  const lc = s => String(s || '').toLowerCase();
  const PER = 8;
  const SAL = [['0-3', '0-3 Lakhs', 0, 3], ['3-6', '3-6 Lakhs', 3, 6], ['6-10', '6-10 Lakhs', 6, 10], ['10-15', '10-15 Lakhs', 10, 15], ['15+', '15+ Lakhs', 15, 999]];
  const FRESH = [['1', 'Last 1 day'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['15', 'Last 15 days'], ['30', 'Last 30 days']];
  const CSV = ['mode', 'dept', 'type', 'qual', 'sal', 'city', 'ind', 'company'];
  const co = j => PL.q.company(j.companyId) || { name: '', industry: '' };
  const days = j => Math.max(0, Math.floor((Date.now() - new Date(j.createdAt)) / 864e5));
  const me = () => PL.auth.user();
  const applied = (u, id) => !!(u && PL.q.appFor(u.id, id));

  window.addEventListener('hashchange', e => { try { const o = new URL(e.oldURL).hash.slice(1); if (/^\/(dashboard|my-applications|saved-jobs|job-search|job-results)/.test(o)) PL.state.jbFrom = o; } catch (x) { } });
  const parse = q => { const p = { q: q.q || '', loc: q.loc || '', exp: q.exp === undefined ? '' : q.exp, fresh: q.fresh || '', sort: q.sort || 'rel', page: Math.max(1, +q.page || 1) }; CSV.forEach(k => (p[k] = q[k] ? q[k].split(',').filter(Boolean) : [])); return p; };
  const url = p => { const sp = new URLSearchParams(); Object.keys(p).forEach(k => { const v = Array.isArray(p[k]) ? p[k].join(',') : p[k]; if (v !== '' && v != null && !(k === 'sort' && v === 'rel') && !(k === 'page' && +v === 1)) sp.set(k, v); }); const s = sp.toString(); return '/job-results' + (s ? '?' + s : ''); };
  const nav = (p, keepScroll) => { const u = url(p); if (keepScroll) { history.pushState(null, '', '#' + u); PL.router.resolve({ rerender: true }); } else PL.go(u); };

  const SYN = { mr: ['medical representative', 'medical rep'], mrs: ['medical representative'], qa: ['quality assurance'], qc: ['quality control'], ra: ['regulatory'], pv: ['pharmacovigilance'], rnd: ['research'], hr: ['human resource'], kam: ['key account'], asm: ['area sales'], rsm: ['regional sales'], zsm: ['zonal sales'], bd: ['business development'], cra: ['clinical research'], cro: ['clinical research'], ms: ['manufacturing'], qms: ['quality'], gmp: ['manufacturing', 'quality'], sales: ['medical representative', 'sales'], rep: ['representative'] };
  const wordHit = (hay, w) => (w.length <= 3 ? new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(hay) : hay.includes(w)) || (SYN[w] || []).some(s => hay.includes(s));
  const match = (j, p, skip) => {
    const c = co(j), qq = lc(p.q).trim(), ll = lc(p.loc).trim();
    if (qq) { const hay = lc([j.title, j.department, c.name, (j.skills || []).join(' '), j.qualification, j.city, j.location, (j.locations || []).join(' ')].join(' ')); if (!qq.split(/[\s,]+/).filter(Boolean).every(w => wordHit(hay, w))) return false; }
    if (ll && !lc(j.location + ' ' + (j.locations || []).join(' ')).includes(ll)) return false;
    if (skip !== 'exp' && p.exp !== '' && !(j.expMin <= +p.exp && +p.exp <= j.expMax)) return false;
    if (skip !== 'fresh' && p.fresh && days(j) > +p.fresh) return false;
    if (skip !== 'mode' && p.mode.length && !p.mode.includes(j.workMode)) return false;
    if (skip !== 'dept' && p.dept.length && !p.dept.includes(j.department)) return false;
    if (skip !== 'type' && p.type.length && !p.type.includes(j.type)) return false;
    if (skip !== 'qual' && p.qual.length && !p.qual.includes(j.qualification)) return false;
    if (skip !== 'city' && p.city.length && !p.city.includes(j.city)) return false;
    if (skip !== 'ind' && p.ind.length && !p.ind.includes(c.industry)) return false;
    if (skip !== 'company' && p.company.length && !p.company.includes(j.companyId)) return false;
    if (skip !== 'sal' && p.sal.length && !SAL.some(s => p.sal.includes(s[0]) && j.salMax >= s[2] && j.salMin <= s[3])) return false;
    return true;
  };
  const score = (j, p) => { const qq = lc(p.q).trim(); let s = j.featured ? 2 : 0; if (qq) { const t = lc(j.title); qq.split(/[\s,]+/).filter(Boolean).forEach(w => { if (t.includes(w)) s += 5; if ((j.skills || []).some(x => lc(x).includes(w))) s += 3; if (lc(j.department).includes(w)) s += 2; if (lc(co(j).name).includes(w)) s += 2; }); } return s - days(j) / 100; };
  const run = p => PL.q.publicJobs().filter(j => match(j, p)).sort(p.sort === 'date' ? (a, b) => new Date(b.createdAt) - new Date(a.createdAt) : (a, b) => score(b, p) - score(a, p));
  const facet = (p, key, get) => { const m = {}; PL.q.publicJobs().filter(j => match(j, p, key)).forEach(j => { const v = get(j); if (v) m[v] = (m[v] || 0) + 1; }); return m; };

  /* ---------- search bar ---------- */
  const EXPS = ['Fresher', ...Array.from({ length: 30 }, (_, i) => i + 1 + (i ? ' years' : ' year'))];
  const expSel = v => `<select name="exp" aria-label="Experience"><option value="">Experience</option>${EXPS.map((x, i) => `<option value="${i}" ${String(v) === String(i) && v !== '' ? 'selected' : ''}>${i ? x : 'Fresher (0 years)'}</option>`).join('')}</select>`;
  const searchBar = p => `<form data-form="jb-search" class="jb-bar" role="search" autocomplete="off"><div class="jb-f jb-f-q"><span class="jb-ic">${I('search', 18)}</span><input class="jb-q" name="q" value="${E(p.q)}" placeholder="Enter skills / designations / companies" aria-label="Search jobs"><div class="jb-sugg" hidden></div></div><div class="jb-f jb-f-e">${expSel(p.exp)}</div><div class="jb-f jb-f-l"><span class="jb-ic">${I('pin', 18)}</span><input name="loc" value="${E(p.loc)}" placeholder="Enter location" aria-label="Location"></div><button class="btn jb-go" type="submit">Search</button></form>`;
  PL.form('jb-search', f => nav({ ...parse({}), q: f.q.value.trim(), loc: f.loc.value.trim(), exp: f.exp.value }));

  let sugCache;
  const suggestions = () => { if (sugCache) return sugCache; const s = new Set(); PL.q.publicJobs().forEach(j => { s.add(j.title); s.add(j.department); s.add(j.city); (j.skills || []).forEach(x => s.add(x)); s.add(co(j).name); }); return (sugCache = [...s].filter(Boolean)); };
  document.addEventListener('input', e => {
    const t = e.target; if (!t.classList || !t.classList.contains('jb-q')) return;
    const box = t.parentElement.querySelector('.jb-sugg'), v = lc(t.value).trim();
    if (!v) { box.hidden = true; return; }
    const r = suggestions().filter(x => lc(x).includes(v)).sort((a, b) => lc(a).indexOf(v) - lc(b).indexOf(v)).slice(0, 7);
    box.innerHTML = r.map(x => `<button type="button" data-action="jb-sugg" data-v="${E(x)}">${I('search', 14)} ${E(x)}</button>`).join(''); box.hidden = !r.length;
  });
  document.addEventListener('focusout', e => { const t = e.target; if (t.classList && t.classList.contains('jb-q')) setTimeout(() => { const b = t.parentElement && t.parentElement.querySelector('.jb-sugg'); if (b) b.hidden = true; }, 180); });
  PL.act('jb-sugg', (d, el) => { const f = el.closest('form'); f.q.value = d.v; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
  PL.act('jb-go', d => nav({ ...parse({}), ...JSON.parse(d.p) }));

  /* ---------- job card ---------- */
  const salTxt = j => j.salMin ? `${j.salMin}-${j.salMax} LPA` : 'Not disclosed';
  const expTxt = j => `${j.expMin}-${j.expMax} Yrs`;
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rating = j => { const h = hash(j.companyId); return { r: (3 + (h % 20) / 10).toFixed(1), n: 2 + (h % 38) }; };
  const ago = j => { const d = days(j); return d === 0 ? 'Today' : d < 7 ? d + 'd ago' : Math.floor(d / 7) + (d >= 28 ? '+ weeks ago' : 'w ago'); };
  const liked = (u, id) => !!(u && ((db().jobLikes || {})[u.id] || []).includes(id));
  const fileIc = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 9h6M9 13h6"/></svg>';
  const star = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#F79009" aria-hidden="true"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>';
  const card = j => {
    const c = co(j), u = me(), saved = u && PL.q.isSaved(u.id, j.id), ap = applied(u, j.id), rt = rating(j);
    return `<article class="jb-card"><div class="jb-card-grid"><div class="jb-card-logo">${ui().logo(c, 68)}</div><div class="jb-card-body"><div class="jb-card-title"><div class="grow"><h3><a href="#/job/${j.id}">${E(j.title)}</a></h3><div class="jb-co"><b>${E(c.name)}</b><span class="jb-rate">${star} ${rt.r}</span><span class="jb-rev">${rt.n} Reviews</span></div></div></div>
      <div class="jb-meta"><span>${I('briefcase', 15)}${expTxt(j)}</span><span>${I('pin', 15)}${E(j.location || j.city)}</span><span>${I('rupee', 15)}${salTxt(j)}</span><span>${I('tag', 15)}${E(j.department)}</span></div>
      <p class="jb-desc">${fileIc}<span>${E(j.description.slice(0, 120))}…</span></p>
      <div class="jb-tags">${(j.skills || []).slice(0, 7).map(s => `<span>${E(s)}</span>`).join('')}</div>
      <div class="jb-foot"><span class="xs muted">${ago(j)}${ap ? ' · Applied' : ''}</span><div class="row jb-acts"><button type="button" class="jb-save" data-action="jb-share" data-id="${j.id}">${I('share', 18)} Share Job</button><button type="button" class="jb-save ${liked(u, j.id) ? 'on' : ''}" data-action="jb-like" data-id="${j.id}" aria-pressed="${liked(u, j.id)}">${I('like', 18)} ${liked(u, j.id) ? 'Liked' : 'Like'}</button><button type="button" class="jb-save ${saved ? 'on' : ''}" data-action="jb-save" data-id="${j.id}" aria-pressed="${!!saved}">${I('bookmark', 18)} ${saved ? 'Saved' : 'Save'}</button><a class="jb-save jb-view" href="#/job/${j.id}">${I('eye', 18)} View Job</a></div></div></div></div></article>`;
  };
  PL.act('jb-like', d => {
    const u = me();
    if (!u) return PL.auth.requireLogin('/job/' + d.id, 'Sign in to like jobs.');
    if (u.role !== 'candidate') return ui().toast('Only candidate accounts can like jobs.', 'info');
    const likes = (db().jobLikes = db().jobLikes || {}), mine = (likes[u.id] = likes[u.id] || []), i = mine.indexOf(d.id);
    if (i >= 0) { mine.splice(i, 1); ui().toast('Job unliked'); }
    else { mine.push(d.id); ui().toast('Job liked'); }
    PL.store.save(); PL.rerender();
  });
  const mini = j => { const c = co(j), rt = rating(j); return `<a class="jb-mini" href="#/job/${j.id}"><div class="jb-mini-t">${ui().logo(c, 40)}<span class="xs muted">${ago(j)}</span></div><b>${E(j.title)}</b><div class="jb-mini-c">${E(c.name)} <span class="jb-rate">${star} ${rt.r}</span></div><div class="jb-mini-l">${I('pin', 14)} ${E(j.workMode === 'Remote' ? 'Remote' : j.city)}</div></a>`; };
  PL.act('jb-share', d => {
    const j = PL.q.job(d.id);
    if (!j) return ui().toast('This job is no longer available to share.', 'err');
    const link = ui().url('/job/' + j.id);
    const title = j.title + ' at ' + co(j).name;
    const text = title + ' on PharmaLinkIn';
    const L = encodeURIComponent(link), T = encodeURIComponent(text);
    const icon = paths => `<svg viewBox="0 0 48 48" aria-hidden="true">${paths}</svg>`;
    const options = [
      { name: 'WhatsApp', icon: icon('<circle cx="24" cy="24" r="20" fill="#25D366"/><path fill="#fff" d="M16.2 14.8c-.5 0-1.1.2-1.5.7-1 1-1.7 2.3-1.7 4.1 0 2.4 1.7 5.1 2 5.5.2.3 3.3 5.1 8 7 3.9 1.5 4.7 1.2 5.6 1.1.9-.1 2.8-1.1 3.2-2.2.4-1.1.4-2 .3-2.2-.1-.2-.5-.4-1-.6l-3.1-1.5c-.4-.1-.7-.2-1 .3-.4.6-1.2 1.5-1.5 1.8-.3.3-.5.4-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.7-2.6-3.2-.3-.5 0-.7.2-1 .2-.2.5-.6.7-.9.2-.3.3-.5.5-.8.2-.3.1-.6 0-.8-.1-.2-1-2.6-1.4-3.5-.4-.9-.8-.8-1.1-.8h-.9z"/><path fill="#fff" d="m12 37 1.7-6.2a17 17 0 1 1 6.5 6.2L12 37zm4-2.6.4.2a14 14 0 1 0-3.5-3.4l.2.4-1 3.6 3.9-.8z"/>') },
      { name: 'LinkedIn', icon: icon('<rect x="4" y="4" width="40" height="40" rx="8" fill="#0A66C2"/><path fill="#fff" d="M13 19h6v19h-6zm3-9a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zm7 9h5.8v2.6h.1c.8-1.5 2.8-3.1 5.8-3.1 6.2 0 7.3 4.1 7.3 9.3V38h-6v-9c0-2.2 0-5-3.1-5s-3.6 2.4-3.6 4.9V38H23z"/>') },
      { name: 'Facebook', icon: icon('<circle cx="24" cy="24" r="21" fill="#1877F2"/><path fill="#fff" d="M27 42V26h5.4l.8-6.2H27v-4c0-1.8.5-3 3.1-3h3.3V7.3c-.6-.1-2.6-.3-5-.3-5 0-8.4 3-8.4 8.6v4.2h-5.6V26H20v16z"/>') },
      { name: 'Meta', icon: icon('<path fill="none" stroke="#0866FF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M5 31c3-12 7-18 12-18 7 0 12 22 17 22 4 0 7-6 9-15M5 31c2 4 4 6 7 6 6 0 12-24 19-24 5 0 9 7 12 18"/>') },
      { name: 'Telegram', icon: icon('<circle cx="24" cy="24" r="21" fill="#24A1DE"/><path fill="#fff" d="m11 23 24-9c1.1-.4 2 .3 1.6 2l-4.1 19c-.3 1.4-1.1 1.8-2.3 1.1l-6.8-5-3.3 3.2c-.4.4-.8.8-1.6.8l.5-7 12.7-11.5c.6-.5-.1-.8-.9-.3L15.1 26.2l-6.7-2.1c-1.5-.5-1.5-1.5.6-2.1z"/>') },
      { name: 'Gmail', icon: icon('<path fill="#4285F4" d="M7 12h5v25H7z"/><path fill="#34A853" d="M36 12h5v25h-5z"/><path fill="#EA4335" d="M7 14.5V9c0-1.7 1.9-2.7 3.3-1.7L24 17l13.7-9.7C39.1 6.3 41 7.3 41 9v5.5L24 26z"/><path fill="#FBBC04" d="M36 12h5v25h-5z"/><path fill="#C5221F" d="M7 12h5v25H7z"/>') }
    ];
    const shares = {
      WhatsApp: `https://wa.me/?text=${T}%20${L}`,
      LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${L}`,
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${L}`,
      Telegram: `https://t.me/share/url?url=${L}&text=${T}`,
      Gmail: `mailto:?subject=${T}&body=${T}%0A${L}`
    };
    const body = `<div class="jb-share-content"><h2>Share this Job</h2><p>Help someone find this opportunity</p><div class="jb-share-grid">${options.map(o => shares[o.name] ? `<a class="jb-share-option" href="${shares[o.name]}" ${o.name === 'Gmail' ? '' : 'target="_blank" rel="noopener"'}>${o.icon}<span>${o.name}</span></a>` : `<button type="button" class="jb-share-option" data-share-native>${o.icon}<span>${o.name}</span></button>`).join('')}</div></div>`;
    const m = ui().modal({ title: 'Share this job', body, footer: '<button type="button" class="btn btn-secondary" data-share-cancel>Cancel</button>' });
    m.el.classList.add('jb-share-modal');
    m.el.parentElement.classList.add('jb-share-overlay');
    m.el.querySelector('[data-share-cancel]').onclick = () => m.close();
    m.el.querySelector('[data-share-native]').onclick = async () => {
      if (!navigator.share) {
        m.close();
        ui().copy(link);
        return;
      }
      try {
        await navigator.share({ title, text, url: link });
        m.close();
      } catch (error) {
        if (error.name !== 'AbortError') ui().toast('Unable to open the device share sheet.', 'err');
      }
    };
    m.el.querySelector('[data-share-cancel]').focus();
  });
  /* pending guest action (save / apply) resumes after sign-in */
  const PEND = 'pl_jb_pending';
  const setPend = (t, id) => { try { sessionStorage.setItem(PEND, JSON.stringify({ t, id })); } catch (e) { } };
  const takePend = id => { try { const v = JSON.parse(sessionStorage.getItem(PEND) || 'null'); if (v && v.id === id) { sessionStorage.removeItem(PEND); return v; } } catch (e) { } return null; };
  const toggleSave = (u, id) => {
    const s = (db().savedJobs[u.id] = db().savedJobs[u.id] || []), i = s.indexOf(id);
    if (i >= 0) { s.splice(i, 1); ui().toast('Removed from saved jobs'); } else { s.push(id); ui().toast('Job saved'); }
    PL.store.save();
  };
  PL.act('jb-save', d => {
    const u = me();
    if (!u) { setPend('save', d.id); return PL.auth.requireLogin('/job/' + d.id, 'Sign in to save this job.'); }
    if (u.role !== 'candidate') return ui().toast('Only candidates can save jobs.', 'info');
    toggleSave(u, d.id); PL.rerender();
  });
  const userExp = u => { const p = u.profile || {}; return p.level === 'Fresher' ? 0 : (p.experienceYears || 0); };
  const doApply = (u, j) => {
    PL.q.syncLegacyApplications(u.id);
    if (PL.q.appFor(u.id, j.id)) return ui().toast('You already applied to this job.', 'info');
    const id = PL.store.id('a'), now = F().iso(), p = u.profile || {};
    const application = {
      id, ref: 'PLI-' + new Date(now).getFullYear() + '-' + id.replace(/\D/g, ''),
      jobId: j.id, candidateId: u.id, recruiterId: j.recruiterId,
      resumeName: p.resume && p.resume.name || 'Generated PharmaLinkIn profile resume',
      resumeSource: p.resume ? 'uploaded' : 'profile',
      coverLetter: '', answers: [], status: 'Applied', appliedAt: now, updatedAt: now,
      notes: [], interview: null, phone: u.phone,
      history: [{ status: 'Applied', at: now, note: 'Application submitted' }]
    };
    db().applications.unshift(application);
    if (PL.q.user(j.recruiterId)) PL.notify(j.recruiterId, 'application', 'New applicant', u.name + ' applied for ' + j.title + '.', '/employer/applicants/' + id);
    PL.notify(u.id, 'status', 'Application submitted', 'Your application for ' + j.title + ' was submitted.', '/my-applications');
    PL.store.save();
    ui().toast('Application submitted. Track its status in My applications.');
    PL.rerender();
  };
  const confirmApply = (u, j) => {
    const p = u.profile || {}, exp = userExp(u), pct = PL.q.completion(u).pct, c = co(j), warn = [];
    if (exp < j.expMin) warn.push(`This role asks for ${j.expMin}-${j.expMax} years of experience and your profile shows ${exp === 0 ? 'none (Fresher)' : exp + ' yr' + (exp === 1 ? '' : 's')}. You can still apply.`);
    else if (exp > j.expMax) warn.push(`This role is for ${j.expMin}-${j.expMax} years and your profile shows ${exp} years. You can still apply.`);
    if (pct < 70) warn.push(`Your profile is only ${pct}% complete. <a href="#/onboarding">Complete it</a> to improve your chances.`);
    const resumeName = p.resume && p.resume.name || 'Generated PharmaLinkIn profile resume';
    const body = `<div class="jb-ap"><div class="row nowrap">${ui().logo(c, 44)}<div><b>${E(j.title)}</b><div class="small muted">${E(c.name)} &middot; ${E(j.city)}</div></div></div>
      <div class="jb-ap-row">${I('file', 18)}<div><span class="xs muted">Resume shared with your application</span><b>${E(resumeName)}</b><small class="xs muted">${p.resume ? 'Previously uploaded resume' : 'Generated from your candidate profile'}</small></div></div>
      <div class="jb-ap-row">${I('mail', 18)}<div><span class="xs muted">Recruiter will contact you on</span><b>${E(u.email)}${u.phone ? ' &middot; ' + E(u.phone) : ''}</b></div></div>
      ${warn.map(w => `<div class="jb-warn">${I('alert', 16)}<span>${w}</span></div>`).join('')}</div>`;
    const m = ui().modal({ title: 'Apply to this job?', body, footer: '<button type="button" class="btn btn-secondary" data-c="0">Cancel</button><button type="button" class="btn" data-c="1">Confirm &amp; apply</button>' });
    m.el.querySelector('[data-c="0"]').onclick = () => m.close();
    m.el.querySelector('[data-c="1"]').onclick = () => { m.close(); doApply(u, j); };
  };
  PL.act('jb-apply', d => {
    const u = me(); if (!u) { setPend('apply', d.id); return PL.auth.requireLogin('/job/' + d.id, 'Sign in to apply for jobs.'); }
    if (u.role !== 'candidate') return ui().toast('Only candidate accounts can apply to jobs.', 'info');
    const j = PL.q.job(d.id); if (!j || applied(u, d.id)) return;
    confirmApply(u, j);
  });
  PL.act('jb-withdraw', async d => {
    const u = me(); if (!u) return;
    const ok = await ui().confirm({ title: 'Withdraw application?', message: 'The recruiter will no longer see this application.', confirmText: 'Withdraw', danger: true });
    if (!ok) return;
    const a = PL.q.app(d.id);
    if (!a || a.candidateId !== u.id || ['Hired', 'Rejected', 'Withdrawn'].includes(a.status)) return ui().toast('This application can no longer be withdrawn.', 'err');
    const now = F().iso(); a.status = 'Withdrawn'; a.updatedAt = now; a.history = a.history || []; a.history.push({ status: 'Withdrawn', at: now, note: 'Withdrawn by candidate' });
    PL.notify(a.recruiterId, 'application', 'Application withdrawn', u.name + ' withdrew from ' + PL.q.job(a.jobId).title + '.', '/employer/applicants/' + a.id);
    PL.store.save(); ui().toast('Application withdrawn'); PL.rerender();
  });

  /* ---------- home ---------- */
  const recommended = u => {
    const p = (u && u.profile) || {}, words = [...(p.skills || []), p.headline, ...((p.preferences && p.preferences.roles) || [])].filter(Boolean).map(lc);
    const exp = p.level === 'Fresher' ? 0 : (p.experienceYears || 0), locs = [...((p.preferences && p.preferences.locations) || []), u && u.location].filter(Boolean).map(lc);
    return PL.q.publicJobs().map(j => { const h = lc(j.title + ' ' + j.department + ' ' + (j.skills || []).join(' ')); let s = words.filter(w => w.length > 2 && h.includes(w)).length * 3 + (j.expMin <= exp && exp <= j.expMax ? 2 : 0) + (locs.some(l => lc(j.city).includes(l) || l.includes(lc(j.city))) ? 2 : 0) + (j.featured ? 1 : 0) - days(j) / 60; return [j, s]; }).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);
  };
  let tab = 'rec';
  PL.act('jb-tab', d => { tab = d.t; PL.rerender(); });
  /* ---------- candidate dashboard ---------- */
  R.add('/dashboard', () => {
    const u = me();
    if (!u) { PL.auth.requireLogin('/dashboard'); return ''; }
    if (u.role !== 'candidate') return '';
    const p = u.profile || {};
    if (!p.onboarded) { PL.go('/onboarding'); return ''; }
    const applications = PL.q.syncLegacyApplications(u.id).slice().sort((a, b) => String(b.appliedAt || '').localeCompare(String(a.appliedAt || '')));
    const jobLikes = db().jobLikes || {}, likedIds = jobLikes[u.id] || [];
    const likedJobs = likedIds.slice().reverse().map(id => PL.q.job(id)).filter(j => j && j.status === 'Published');
    const resume = p.resume, generatedResume = PL.onb && PL.onb.resumeCard ? PL.onb.resumeCard(u) : '';
    const upcomingInterviews = applications.filter(a => a.interview && a.interview.date >= F().today() && (a.interview.status || 'Scheduled') === 'Scheduled')
      .sort((a, b) => String(a.interview.date).localeCompare(String(b.interview.date))).slice(0, 3).map(a => {
        const j = PL.q.job(a.jobId); if (!j) return '';
        return `<a class="jb-dash-row" href="#/app/applications/${a.id}"><span class="jb-home-activity-icon">${I('calendar', 18)}</span><span class="jb-dash-row-copy"><b>${E(j.title)}</b><small>${E(co(j).name)} · ${F().date(a.interview.date)}${a.interview.time ? ' at ' + E(a.interview.time) : ''}</small><small>${E(a.interview.type || 'Interview')} · View details</small></span>${I('right', 16)}</a>`;
      }).filter(Boolean);
    const latestApplications = applications.slice(0, 4).map(a => {
      const j = PL.q.job(a.jobId); if (!j) return '';
      const company = co(j);
      return `<a class="jb-dash-row" href="#/job/${j.id}">${ui().logo(company, 46)}<span class="jb-dash-row-copy"><b>${E(j.title)}</b><small>${E(company.name)} · ${E(j.city)}</small><small>Applied ${F().date(a.appliedAt)}</small></span>${ui().badge(a.status)}</a>`;
    }).filter(Boolean).join('');
    const likedRows = likedJobs.slice(0, 4).map(j => {
      const company = co(j);
      return `<div class="jb-dash-row">${ui().logo(company, 46)}<a class="jb-dash-row-copy" href="#/job/${j.id}"><b>${E(j.title)}</b><small>${E(company.name)} · ${E(j.city)}</small></a><button type="button" class="jb-save on" data-action="jb-like" data-id="${j.id}" aria-label="Unlike ${E(j.title)}" aria-pressed="true">${I('like', 17)} Liked</button></div>`;
    }).join('');
    const stat = (label, count, target, icon) => target[0] === '#'
      ? `<button type="button" class="jb-dash-stat" data-action="jb-dashboard-scroll" data-target="${E(target.slice(1))}"><span>${I(icon, 19)}</span><b>${count}</b><small>${label}</small></button>`
      : `<a class="jb-dash-stat" href="#${target}"><span>${I(icon, 19)}</span><b>${count}</b><small>${label}</small></a>`;
    return `<div class="jb-dash jb-candidate-home">
      <div class="jb-dashboard-heading"><div><span class="jb-dashboard-eyebrow">Candidate Dashboard</span><h1>Welcome back, ${E(u.name.split(' ')[0])}</h1><p>Track your applications, liked jobs, and resume.</p></div><a class="btn btn-secondary btn-sm" href="#/job-results">${I('search', 15)} Find jobs</a></div>
      <div class="jb-dashboard-stats">${stat('Applied jobs', applications.length, '/my-applications', 'file')}${stat('Liked jobs', likedJobs.length, '#liked-jobs', 'like')}</div>
      <section class="jb-home-resume"><div class="jb-home-section-heading"><span class="jb-home-section-icon">${I('file', 21)}</span><span><h2>My Resume</h2><small>${resume ? 'Uploaded resume' : 'Generate a resume from your profile'}</small></span></div>
        ${resume ? `<div class="jb-home-resume-file"><span><b>${E(resume.name)}</b><small>${E(resume.type || 'Resume file')} · ${F().size(resume.size)} · Uploaded ${F().date(resume.uploadedAt)}</small></span><span class="badge b-teal">${E(resume.visibility || 'Recruiters only')}</span></div><p class="jb-home-resume-note">This prototype keeps resume details only; the uploaded file itself is not stored and cannot be downloaded here.</p>` : `<p class="jb-home-resume-note">No uploaded file yet. Upload a PDF or Word resume, or download a generated PDF from your profile details.</p>`}
        <div class="jb-home-resume-actions"><button type="button" class="btn btn-secondary btn-sm" data-action="resume-upload">${I('upload', 15)} ${resume ? 'Update uploaded resume' : 'Upload resume'}</button>${generatedResume ? `<button type="button" class="btn btn-sm" data-action="onb-download">${I('download', 15)} Download generated resume</button>` : `<a class="btn btn-sm" href="#/app/profile/completion">${I('edit', 15)} Complete profile to generate</a>`}<a class="jb-home-text-link" href="#/app/resume">Manage resume</a></div>
        ${generatedResume ? `<details class="jb-home-resume-preview"><summary>Preview generated resume</summary>${generatedResume}</details>` : ''}
      </section>
      <section class="jb-home-list-panel" id="applied-jobs"><div class="jb-home-section-heading"><span class="jb-home-section-icon">${I('briefcase', 21)}</span><span><h2>Applied Jobs</h2><small>${applications.length} application${applications.length === 1 ? '' : 's'} · latest status updates</small></span><a href="#/my-applications">View all</a></div>${latestApplications ? `<div class="jb-dash-list">${latestApplications}</div>` : `<p class="jb-home-empty">Your applications will appear here after you apply for a job.</p><a class="btn btn-secondary btn-sm" href="#/job-results">Browse jobs</a>`}</section>
      <section class="jb-home-list-panel" id="liked-jobs"><div class="jb-home-section-heading"><span class="jb-home-section-icon">${I('like', 21)}</span><span><h2>Liked Jobs</h2><small>${likedJobs.length} saved for later consideration</small></span><a href="#/job-results">Find more</a></div>${likedRows ? `<div class="jb-dash-list">${likedRows}</div>` : `<p class="jb-home-empty">Jobs you like will appear here so you can easily revisit them.</p><a class="btn btn-secondary btn-sm" href="#/job-results">Explore jobs</a>`}</section>
      ${upcomingInterviews.length ? `<section class="jb-home-list-panel"><div class="jb-home-section-heading"><span class="jb-home-section-icon">${I('calendar', 21)}</span><span><h2>Upcoming Interviews</h2><small>Your next scheduled interview${upcomingInterviews.length === 1 ? '' : 's'}</small></span></div><div class="jb-dash-list">${upcomingInterviews.join('')}</div></section>` : ''}
    </div>`;
  }, { layout: 'jobs', title: 'Dashboard' });
  PL.act('jb-dashboard-scroll', (d, el) => {
    const section = document.getElementById(d.target);
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const gate = path => { const u = me(); if (!u) { PL.auth.requireLogin(path); return null; } if (u.role !== 'candidate') return null; if (!(u.profile && u.profile.onboarded)) { PL.go('/onboarding'); return null; } return u; };
  R.add('/my-applications', () => {
    const u = gate('/my-applications'); if (!u) return '';
    const list = PL.q.syncLegacyApplications(u.id).slice().sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).map(a => ({ a, j: PL.q.job(a.jobId) })).filter(x => x.j);
    const row = ({ a, j }) => { const c = co(j); return `<article class="jb-card jb-app"><div class="jb-top"><div class="grow"><h3><a href="#/job/${j.id}">${E(j.title)}</a></h3><div class="jb-co"><b>${E(c.name)}</b></div></div>${ui().logo(c, 48)}</div>
      <div class="jb-meta"><span>${I('pin', 15)}${E(j.city)}</span><span>${I('briefcase', 15)}${expTxt(j)}</span><span>${I('rupee', 15)}${salTxt(j)}</span></div>
      <div class="jb-app-status">${ui().badge(a.status)}</div>
      <div class="jb-foot"><span class="xs muted">Applied on ${F().date(a.appliedAt)}</span><div class="row nowrap jb-acts">${['Hired', 'Rejected', 'Withdrawn'].includes(a.status) ? '' : `<button type="button" class="jb-save" data-action="jb-withdraw" data-id="${a.id}">${I('x', 18)} Withdraw</button>`}<a class="jb-save jb-view" href="#/job/${j.id}">${I('eye', 18)} View job</a></div></div></article>`; };
    return `<div class="jb-page"><a href="#/dashboard" class="small">${I('left', 14)} Back to dashboard</a><h1>My applications <span class="muted">(${list.length})</span></h1><p class="muted small">Application statuses reflect the latest updates available from the employer.</p>${list.length ? `<div class="jb-list">${list.map(row).join('')}</div>` : `<div class="jb-none">${I('file', 40)}<h3>No applications yet</h3><p class="muted">Jobs you apply to will appear here.</p><a class="btn" href="#/job-results">Browse jobs</a></div>`}</div>`;
  }, { layout: 'jobs', title: 'My applications' });
  R.add('/saved-jobs', () => {
    const u = gate('/saved-jobs'); if (!u) return '';
    const list = PL.q.saved(u.id).map(id => PL.q.job(id)).filter(Boolean);
    return `<div class="jb-page"><a href="#/dashboard" class="small">${I('left', 14)} Back to dashboard</a><h1>Saved jobs <span class="muted">(${list.length})</span></h1>${list.length ? `<div class="jb-list">${list.map(card).join('')}</div>` : `<div class="jb-none">${I('bookmark', 40)}<h3>No saved jobs yet</h3><p class="muted">Tap Save on any job to keep it here.</p><a class="btn" href="#/job-results">Browse jobs</a></div>`}</div>`;
  }, { layout: 'jobs', title: 'Saved jobs' });
  PL.act('jb-soon', () => ui().toast('Coming soon in the next phase', 'info'));
  PL.act('jb-alert', () => {
    const u = me(); if (!u) return PL.auth.requireLogin(location.hash.slice(1), 'Sign in to create job alerts.');
    if (u.role !== 'candidate') return ui().toast('Only candidates can create job alerts.', 'info');
    const p = (u.profile = u.profile || {}); p.alerts = p.alerts || []; const path = location.hash.slice(1);
    if (p.alerts.some(a => a.path === path)) return ui().toast('You already have an alert for this search', 'info');
    p.alerts.push({ path, at: new Date().toISOString() }); PL.store.save(); ui().toast('Job alert created. We will email you similar jobs (demo)');
  });
  PL.mobileNav = (role, path) => {
    const routes = {
      candidate: { home: '/app/profile', jobs: '/job-results', post: '/app/feed', dashboard: '/dashboard' },
      recruiter: { home: '/', jobs: '/employer/jobs', post: '/employer/jobs/new', dashboard: '/employer/dashboard' },
      advertiser: { home: '/', jobs: '/advertiser/campaigns', post: '/advertiser/campaigns/new', dashboard: '/advertiser/dashboard' },
      admin: { home: '/', jobs: '/admin/jobs', post: '', dashboard: '/admin/dashboard' }
    };
    const links = routes[role] || { home: '/', jobs: '/job-results', post: '/login', dashboard: '/login' };
    const isJobs = role === 'candidate' ? /^\/(job-results|job\/|saved-jobs|my-applications)/.test(path) : path === links.jobs || path.startsWith(links.jobs + '/');
    const isDashboard = path === links.dashboard || (role !== 'candidate' && path.startsWith(links.dashboard + '/'));
    const isHome = path === links.home;
    const isPost = !!links.post && path === links.post;
    const item = (label, href, icon, active) => `<a class="jb-mobile-item ${active ? 'active' : ''}" href="#${href}" ${active ? 'aria-current="page"' : ''}><span class="jb-mobile-icon">${I(icon, 20)}</span><span>${label}</span></a>`;
    const post = links.post ? `<a class="jb-mobile-item jb-post-item ${isPost ? 'active' : ''}" href="#${links.post}" aria-label="${role === 'recruiter' ? 'Post a job' : role === 'advertiser' ? 'Create campaign' : role === 'candidate' ? 'Create post' : 'Post'}"><span class="jb-post-plus">${I('plus', 23)}</span><span>${role === 'recruiter' ? 'Post Job' : role === 'advertiser' ? 'Campaign' : 'Post'}</span></a>` : `<button type="button" class="jb-mobile-item" data-action="jb-post-denied"><span class="jb-post-plus">${I('plus', 23)}</span><span>Post</span></button>`;
    return `<nav class="jb-mobile-nav" aria-label="Mobile primary navigation">${item('Home', links.home, 'home', isHome)}${item('Jobs', links.jobs, 'briefcase', isJobs)}${post}<button type="button" class="jb-mobile-item" data-action="jb-social"><span class="jb-mobile-icon">${I('globe', 20)}</span><span>Social</span></button>${item(role === 'candidate' ? 'Dashboard' : 'Dashboard', links.dashboard, 'dash', isDashboard)}</nav>`;
  };
  R.add('/job-search', () => {
    const u = me(), jobs = PL.q.publicJobs(), cand = u && u.role === 'candidate', pr = (u && u.profile) || {};
    const pct = cand ? PL.q.completion(u).pct : 0, ex = (pr.experience || [])[0] || {};
    const applications = cand ? PL.q.syncLegacyApplications(u.id) : [];
    const appliedJobs = applications.map(a => PL.q.job(a.jobId)).filter(Boolean);
    const rec = recommended(u), like = jobs.filter(j => !rec.includes(j)).slice(0, 8);
    const pv = pr.preferences || {}, pl = (pv.locations || []).map(lc), pro = (pv.roles || []).map(lc), prefJobs = cand ? jobs.filter(j => (pl.length && pl.some(l => lc(j.city).includes(l))) || (pro.length && pro.some(r => lc(j.title + ' ' + j.department).includes(r)))).slice(0, 8) : [];
    const tabs = [['app', 'Applies', appliedJobs], ['rec', 'Profile', rec], ['like', 'You might like', like], ['pref', 'Preferences', prefJobs]];
    if (tab === 'app' && !appliedJobs.length) tab = 'rec';
    const cur = tabs.find(x => x[0] === tab) || tabs[1];
    const early = jobs.filter(j => j.featured).concat(jobs).filter((j, i, a) => a.indexOf(j) === i).slice(0, 6);
    const ring = `<div class="jb-ring" style="--p:${pct}"><div class="jb-ring-in">${ui().avatar(u || { name: 'U' }, 92)}</div><span>${pct}%</span></div>`;
    return `<div class="jb-3"><aside class="jb-left">
      <div class="jb-pcard">${ring}<h2>${E(u ? u.name : 'Guest')}</h2><div class="jb-sub">${E(pr.headline || '')}${ex.company ? ' @ ' + E(ex.company) : ''}</div><div class="xs muted">Last updated today</div><a class="btn jb-rbtn" href="#/dashboard">${cand ? 'My dashboard' : 'Sign in'}</a></div>
      <a class="jb-perf jb-perf-link" href="#/app/profile/analytics"><h3>Profile analytics</h3><div class="jb-perf-g"><div><span>Profile views</span><b>${Number(pr.views) || 0}</b></div><div><span>Search appearances</span><b>${Number(pr.searchAppearances) || 0}</b></div></div><small>Resume downloads: ${Number(pr.resumeDownloads) || 0}</small></a>
      <nav class="jb-side" aria-label="Sections"><a class="on" href="#/job-search">${I('home', 20)} My home</a><a href="#/job-results">${I('briefcase', 20)} Jobs</a>${cand ? `<a href="#/my-applications">${I('file', 20)} Applications</a><a href="#/saved-jobs">${I('bookmark', 20)} Saved</a>` : ''}<button data-action="jb-soon">${I('building', 20)} Companies</button><button data-action="jb-soon">${fileIc} Blogs</button></nav></aside>
      <div class="jb-center">
        <section class="jb-panel"><div class="jb-sh"><h2>Recommended jobs for you</h2><a href="#/job-results">View all</a></div>
          <div class="jb-tabs" role="tablist">${tabs.map(x => `<button role="tab" aria-selected="${x[0] === tab}" class="${x[0] === tab ? 'on' : ''}" data-action="jb-tab" data-t="${x[0]}">${x[1]} (${x[2].length})</button>`).join('')}</div>
          <div class="jb-scroll">${cur[2].length ? cur[2].map(mini).join('') : `<div class="jb-empty">${tab === 'pref' ? 'Set job preferences to see matches here.' : 'Nothing here yet.'}</div>`}</div></section>
        <section class="jb-panel"><div class="jb-sh"><div class="row nowrap"><span class="jb-ea">${I('zap', 28)}</span><div><h2>${early.length} Early access roles from top companies</h2><div class="muted small">See what recruiters are searching for, even before they post a job</div></div></div><a href="#/job-results">View all</a></div>
          <div class="jb-scroll">${early.map(j => { const c = co(j), rt = rating(j); return `<a class="jb-early" href="#/job/${j.id}"><div class="row between nowrap"><b>${E(j.title)}</b><span class="xs muted">${ago(j)}</span></div><div class="muted">${E(c.name)}</div><div class="jb-tags"><span>${star} ${rt.r}+</span><span>${E(c.industry)}</span></div><div class="jb-meta"><span>${I('briefcase', 14)}${expTxt(j)}</span><span>${I('rupee', 14)}${salTxt(j)}</span><span>${I('pin', 14)}${E(j.city)}</span></div></a>`; }).join('')}</div></section>
      </div>
      <aside class="jb-right"><div class="jb-promo"><div class="jb-promo-t">Explore top career content</div><div class="jb-promo-art"><b>Don&rsquo;t wait.<br>Move first.</b></div><button class="btn jb-rbtn" data-action="jb-soon">${I('arrow', 14)} Explore tips</button></div>
        <div class="jb-promo jb-safe">${I('shield', 44)}<h3>Never pay anyone to get a job</h3><p class="muted">Fraudsters may ask you to invest money either to earn more OR to get you a job. Never make such payments.</p><a href="#/page/help">Learn more</a></div></aside></div>`;
  }, { layout: 'jobs', title: 'Find jobs' });



  /* ---------- results ---------- */
  const facetBox = (title, key, p, counts, labelOf, open = true, limit = 6) => {
    let ents = Object.entries(counts).sort((a, b) => b[1] - a[1]); (p[key] || []).forEach(v => { if (!counts[v]) ents.push([v, 0]); });
    if (!ents.length) return '';
    const rows = ents.map(([v, n], i) => `<label class="jb-chk ${i >= limit ? 'more' : ''}"><input type="checkbox" data-f="${key}" value="${E(v)}" ${p[key].includes(v) ? 'checked' : ''}><span>${E(labelOf ? labelOf(v) : v)}</span><em>(${n})</em></label>`).join('');
    return `<details class="jb-fs" ${open || p[key].length ? 'open' : ''}><summary>${title}${p[key].length ? ` <i class="jb-cnt">${p[key].length}</i>` : ''}</summary><div class="jb-fb">${rows}${ents.length > limit ? `<button type="button" class="link-btn jb-more" data-action="jb-more">View more</button>` : ''}</div></details>`;
  };
  const filters = p => {
    const salCounts = {}; PL.q.publicJobs().filter(j => match(j, p, 'sal')).forEach(j => SAL.forEach(s => { if (j.salMax >= s[2] && j.salMin <= s[3]) salCounts[s[0]] = (salCounts[s[0]] || 0) + 1; }));
    const frCounts = {}; PL.q.publicJobs().filter(j => match(j, p, 'fresh')).forEach(j => FRESH.forEach(f => { if (days(j) <= +f[0]) frCounts[f[0]] = (frCounts[f[0]] || 0) + 1; }));
    const ex = p.exp === '' ? 0 : +p.exp;
    const fresh = `<details class="jb-fs" ${p.fresh ? 'open' : ''}><summary>Freshness${p.fresh ? ' <i class="jb-cnt">1</i>' : ''}</summary><div class="jb-fb">${FRESH.map(f => `<label class="jb-chk"><input type="radio" name="fresh" data-f="fresh" value="${f[0]}" ${p.fresh === f[0] ? 'checked' : ''}><span>${f[1]}</span><em>(${frCounts[f[0]] || 0})</em></label>`).join('')}${p.fresh ? '<button type="button" class="link-btn jb-more" data-action="jb-unfresh">Clear</button>' : ''}</div></details>`;
    const exps = `<details class="jb-fs" open><summary>Experience</summary><div class="jb-fb"><div class="jb-range"><b id="jb-exv">${p.exp === '' ? 'Any' : (+p.exp === 0 ? 'Fresher' : p.exp + (+p.exp === 1 ? ' year' : ' years'))}</b><input type="range" min="0" max="30" step="1" value="${ex}" data-f="exp" aria-label="Experience in years" ${p.exp === '' ? 'class="untouched"' : ''}><div class="jb-ticks"><span>0</span><span>10</span><span>20</span><span>30</span></div>${p.exp !== '' ? '<button type="button" class="link-btn jb-more" data-action="jb-unexp">Clear</button>' : ''}</div></div></details>`;
    return `<div class="jb-fhead"><h3>All Filters</h3><button type="button" class="link-btn" data-action="jb-clear">Clear all</button><button type="button" class="icon-btn jb-fclose" data-action="jb-fx" aria-label="Close filters">${I('x', 20)}</button></div><div class="jb-fscroll">
      ${facetBox('Work mode', 'mode', p, facet(p, 'mode', j => j.workMode))}${exps}${facetBox('Department', 'dept', p, facet(p, 'dept', j => j.department))}${facetBox('Salary', 'sal', p, salCounts, v => (SAL.find(s => s[0] === v) || [])[1] || v)}${facetBox('Location', 'city', p, facet(p, 'city', j => j.city))}${facetBox('Companies', 'company', p, facet(p, 'company', j => j.companyId), v => (PL.q.company(v) || {}).name || v, false)}${fresh}${facetBox('Employment type', 'type', p, facet(p, 'type', j => j.type), null, false)}${facetBox('Education', 'qual', p, facet(p, 'qual', j => j.qualification), null, false)}${facetBox('Industry', 'ind', p, facet(p, 'ind', j => co(j).industry), null, false)}</div>
      <div class="jb-fapply"><button type="button" class="btn btn-block" data-action="jb-fx">Show results</button></div>`;
  };
  const MOBILE_FACETS = [
    ['mode', 'Work mode'],
    ['dept', 'Department'],
    ['city', 'Location'],
    ['exp', 'Experience'],
    ['sal', 'Salary'],
    ['company', 'Companies'],
    ['ind', 'Industries'],
    ['type', 'Role'],
    ['qual', 'Education'],
    ['fresh', 'Freshness']
  ];
  const mobileFacetOptions = (p, key) => {
    if (key === 'exp') {
      const value = p.exp === '' ? 0 : +p.exp;
      return `<div class="jb-mobile-range"><b>${p.exp === '' ? 'Any experience' : value === 0 ? 'Fresher' : `${value} ${value === 1 ? 'year' : 'years'}`}</b><input type="range" min="0" max="30" step="1" value="${value}" data-mobile-f="exp" aria-label="Experience in years"><div><span>Fresher</span><span>30+ years</span></div><button type="button" data-action="jb-mobile-unset" data-key="exp">Clear selection</button></div>`;
    }
    if (key === 'fresh') {
      const counts = {};
      PL.q.publicJobs().filter(j => match(j, p, 'fresh')).forEach(j => FRESH.forEach(f => { if (days(j) <= +f[0]) counts[f[0]] = (counts[f[0]] || 0) + 1; }));
      return FRESH.map(f => `<label class="jb-mobile-choice"><input type="radio" name="mobile-fresh" value="${f[0]}" data-mobile-f="fresh" ${p.fresh === f[0] ? 'checked' : ''}><span>${f[1]}</span><em>${counts[f[0]] || 0}</em></label>`).join('') + `<button type="button" class="jb-mobile-clear-one" data-action="jb-mobile-unset" data-key="fresh">Clear selection</button>`;
    }
    let counts, labelOf;
    if (key === 'sal') {
      counts = {};
      PL.q.publicJobs().filter(j => match(j, p, 'sal')).forEach(j => SAL.forEach(s => { if (j.salMax >= s[2] && j.salMin <= s[3]) counts[s[0]] = (counts[s[0]] || 0) + 1; }));
      labelOf = v => (SAL.find(s => s[0] === v) || [])[1] || v;
    } else if (key === 'company') {
      counts = facet(p, key, j => j.companyId);
      labelOf = v => (PL.q.company(v) || {}).name || v;
    } else counts = facet(p, key, j => ({ mode: j => j.workMode, dept: j => j.department, city: j => j.city, ind: j => co(j).industry, type: j => j.type, qual: j => j.qualification }[key] || (() => ''))(j));
    const entries = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]);
    (p[key] || []).forEach(value => { if (!entries.some(x => x[0] === value)) entries.push([value, 0]); });
    if (!entries.length) return '<p class="jb-mobile-empty">No options available for this search.</p>';
    return entries.map(([value, count]) => `<label class="jb-mobile-choice"><input type="checkbox" data-mobile-f="${key}" value="${E(value)}" ${p[key].includes(value) ? 'checked' : ''}><span>${E(labelOf ? labelOf(value) : value)}</span><em>${count}</em></label>`).join('');
  };
  const mobileFilterSheet = p => {
    const active = PL.state.jbMobileFacet || 'mode';
    return `<div class="jb-filter-overlay" id="jb-filter-overlay" aria-hidden="true"><section class="jb-mobile-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="jb-mobile-filter-title">
      <header><h2 id="jb-mobile-filter-title">Filter Jobs</h2><button type="button" class="jb-mobile-reset" data-action="jb-mobile-clear">Clear all</button><button type="button" data-action="jb-mobile-cancel" aria-label="Close filters">${I('x', 20)}</button></header>
      <div class="jb-mobile-filter-content"><nav aria-label="Filter categories">${MOBILE_FACETS.map(([key, label]) => `<button type="button" data-action="jb-mobile-category" data-key="${key}" class="${active === key ? 'active' : ''}">${label}${(key === 'exp' ? p.exp !== '' : key === 'fresh' ? !!p.fresh : p[key].length) ? '<i></i>' : ''}</button>`).join('')}</nav>
        <div class="jb-mobile-filter-options" id="jb-mobile-filter-options">${mobileFacetOptions(p, active)}</div></div>
      <footer><button type="button" class="btn btn-secondary" data-action="jb-mobile-cancel">Cancel</button><button type="button" class="btn" data-action="jb-mobile-apply">Apply</button></footer>
    </section></div>`;
  };
  const renderMobileFacet = key => {
    const p = PL.state.jbMobileDraft || current(), root = document.getElementById('jb-filter-overlay');
    if (!root) return;
    PL.state.jbMobileFacet = MOBILE_FACETS.some(x => x[0] === key) ? key : 'mode';
    root.querySelectorAll('[data-action="jb-mobile-category"]').forEach(button => {
      const key = button.dataset.key, selected = key === 'exp' ? p.exp !== '' : key === 'fresh' ? !!p.fresh : (p[key] || []).length > 0;
      button.classList.toggle('active', key === PL.state.jbMobileFacet);
      const indicator = button.querySelector('i');
      if (selected && !indicator) button.insertAdjacentHTML('beforeend', '<i></i>');
      else if (!selected && indicator) indicator.remove();
    });
    root.querySelector('#jb-mobile-filter-options').innerHTML = mobileFacetOptions(p, PL.state.jbMobileFacet);
  };
  const updateMobileFilterCount = () => {
    const button = document.querySelector('.jb-mobile-filter-sheet [data-action="jb-mobile-apply"]');
    if (button) button.textContent = `Apply (${run(PL.state.jbMobileDraft || current()).length})`;
  };
  const collect = () => { const p = parse({}), root = document.getElementById('jb-filters'), bar = document.querySelector('.jb-bar'); if (bar) { p.q = bar.q.value.trim(); p.loc = bar.loc.value.trim(); p.exp = bar.exp.value; } p.sort = (document.getElementById('jb-sort') || {}).value || 'rel'; CSV.forEach(k => (p[k] = [...root.querySelectorAll(`input[type=checkbox][data-f="${k}"]:checked`)].map(i => i.value))); const fr = root.querySelector('input[data-f="fresh"]:checked'); p.fresh = fr ? fr.value : ''; return p; };
  const current = () => parse(PL.router.parse().query);
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.closest && t.closest('#jb-filter-overlay') && t.dataset.mobileF) {
      const p = PL.state.jbMobileDraft || (PL.state.jbMobileDraft = current());
      const key = t.dataset.mobileF;
      if (key === 'fresh') p.fresh = t.value;
      else if (key === 'exp') p.exp = t.value;
      else p[key] = [...document.querySelectorAll(`#jb-mobile-filter-options input[data-mobile-f="${key}"]:checked`)].map(input => input.value);
      renderMobileFacet(key); updateMobileFilterCount(); return;
    }
    if (!t.closest || !t.closest('#jb-filters')) return;
    if (t.matches('input[data-f="exp"]')) { const p = current(); p.exp = t.value; p.page = 1; nav(p, true); return; }
    const p = current(), c = collect(); CSV.forEach(k => (p[k] = c[k])); p.fresh = c.fresh; p.page = 1; nav(p, true);
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.matches && t.matches('#jb-mobile-filter-options input[data-mobile-f="exp"]')) {
      const p = PL.state.jbMobileDraft || (PL.state.jbMobileDraft = current());
      p.exp = t.value;
      const value = t.parentElement.querySelector('b');
      if (value) value.textContent = +t.value === 0 ? 'Fresher' : t.value + (+t.value === 1 ? ' year' : ' years');
      updateMobileFilterCount();
      return;
    }
    if (t.matches && t.matches('#jb-filters input[data-f="exp"]')) { const v = document.getElementById('jb-exv'); if (v) v.textContent = +t.value === 0 ? 'Fresher' : t.value + (+t.value === 1 ? ' year' : ' years'); }
  });
  document.addEventListener('change', e => { const t = e.target; if (t.id === 'jb-sort') { const p = current(); p.sort = t.value; p.page = 1; nav(p, true); } });
  PL.act('jb-more', (d, el) => { const b = el.closest('.jb-fb'); b.classList.toggle('all'); el.textContent = b.classList.contains('all') ? 'View less' : 'View more'; });
  PL.act('jb-clear', () => { const p = current(); nav({ ...parse({}), q: p.q, loc: p.loc }, true); });
  PL.act('jb-unexp', () => { const p = current(); p.exp = ''; p.page = 1; nav(p, true); });
  PL.act('jb-unfresh', () => { const p = current(); p.fresh = ''; p.page = 1; nav(p, true); });
  PL.act('jb-fopen', () => {
    const overlay = document.getElementById('jb-filter-overlay');
    if (overlay) {
      PL.state.jbMobileDraft = current();
      PL.state.jbMobileDraft.page = 1;
      PL.state.jbMobileFacet = 'mode';
      renderMobileFacet('mode'); overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('jb-lock'); updateMobileFilterCount();
      return;
    }
    document.getElementById('jb-filters').classList.add('open');
  });
  PL.act('jb-fx', () => document.getElementById('jb-filters').classList.remove('open'));
  PL.act('jb-mobile-category', d => renderMobileFacet(d.key));
  PL.act('jb-mobile-cancel', () => {
    const overlay = document.getElementById('jb-filter-overlay');
    if (overlay) { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }
    document.body.classList.remove('jb-lock'); PL.state.jbMobileDraft = null;
  });
  document.addEventListener('click', e => {
    const overlay = e.target;
    if (overlay && overlay.id === 'jb-filter-overlay' && overlay.classList.contains('open')) {
      const close = overlay.querySelector('[data-action="jb-mobile-cancel"]');
      if (close) close.click();
    }
  });
  document.addEventListener('keydown', e => {
    const overlay = document.getElementById('jb-filter-overlay');
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      const close = overlay.querySelector('[data-action="jb-mobile-cancel"]');
      if (close) close.click();
    }
  });
  PL.act('jb-mobile-apply', () => {
    const p = PL.state.jbMobileDraft || current();
    p.page = 1;
    PL.state.jbMobileDraft = null;
    nav(p, true);
  });
  PL.act('jb-mobile-unset', d => {
    const p = PL.state.jbMobileDraft || (PL.state.jbMobileDraft = current());
    if (d.key === 'exp') p.exp = '';
    else if (d.key === 'fresh') p.fresh = '';
    renderMobileFacet(d.key); updateMobileFilterCount();
  });
  PL.act('jb-mobile-clear', () => {
    const p = PL.state.jbMobileDraft || (PL.state.jbMobileDraft = current());
    const clean = parse({});
    clean.q = p.q; clean.loc = p.loc; clean.sort = p.sort;
    PL.state.jbMobileDraft = clean;
    renderMobileFacet(PL.state.jbMobileFacet); updateMobileFilterCount();
  });
  PL.act('jb-mobile-quick', d => {
    const overlay = document.getElementById('jb-filter-overlay');
    if (!overlay) return;
    PL.state.jbMobileDraft = current(); PL.state.jbMobileDraft.page = 1;
    renderMobileFacet(d.key); overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('jb-lock'); updateMobileFilterCount();
  });
  PL.act('jb-rm', d => { const p = current(); if (d.k === 'q' || d.k === 'loc' || d.k === 'exp' || d.k === 'fresh') p[d.k] = ''; else p[d.k] = p[d.k].filter(x => x !== d.v); p.page = 1; nav(p, true); });
  PL.act('jb-page', d => { const p = current(); p.page = +d.n; nav(p); });

  R.add('/job-results', ctx => {
    const p = parse(ctx.query), list = run(p), pages = Math.max(1, Math.ceil(list.length / PER)), page = Math.min(p.page, pages), rows = list.slice((page - 1) * PER, page * PER);
    PL.state.lastResults = url(p);
    const chips = []; const add = (k, v, t) => chips.push(`<button type="button" class="jb-ac" data-action="jb-rm" data-k="${k}" data-v="${E(v)}">${E(t)} ${I('x', 12)}</button>`);
    if (p.q) add('q', '', p.q); if (p.loc) add('loc', '', p.loc); if (p.exp !== '') add('exp', '', +p.exp === 0 ? 'Fresher' : p.exp + ' yrs'); if (p.fresh) add('fresh', '', (FRESH.find(f => f[0] === p.fresh) || [])[1]);
    CSV.forEach(k => p[k].forEach(v => add(k, v, k === 'sal' ? (SAL.find(s => s[0] === v) || [])[1] : k === 'company' ? ((PL.q.company(v) || {}).name || v) : v)));
    const pg = [];
    if (pages > 1) { const from = Math.max(1, Math.min(page - 2, pages - 4)), to = Math.min(pages, from + 4); pg.push(`<button class="btn btn-secondary btn-sm" ${page === 1 ? 'disabled' : ''} data-action="jb-page" data-n="${page - 1}">${I('left', 14)} Prev</button>`); for (let i = from; i <= to; i++) pg.push(`<button class="btn btn-sm ${i === page ? '' : 'btn-secondary'}" data-action="jb-page" data-n="${i}" ${i === page ? 'aria-current="page"' : ''}>${i}</button>`); pg.push(`<button class="btn btn-secondary btn-sm" ${page === pages ? 'disabled' : ''} data-action="jb-page" data-n="${page + 1}">Next ${I('arrow', 14)}</button>`); }
    const title = p.q ? `${E(p.q)} jobs${p.loc ? ' in ' + E(p.loc) : ''}` : p.loc ? `Jobs in ${E(p.loc)}` : 'All pharma jobs';
    const s0 = (page - 1) * PER;
    const activeFilterCount = (p.exp !== '' ? 1 : 0) + (p.fresh ? 1 : 0) + CSV.reduce((n, key) => n + p[key].length, 0);
    const mobileFilterBar = `<div class="jb-mobile-filterbar"><button type="button" class="jb-mobile-filter-icon" data-action="jb-fopen" aria-label="Open all job filters">${I('filter', 19)}${activeFilterCount ? `<i>${activeFilterCount}</i>` : ''}</button>${MOBILE_FACETS.slice(0, 5).map(([key, label]) => {
      const count = key === 'exp' ? (p.exp !== '' ? 1 : 0) : (p[key] || []).length;
      return `<button type="button" data-action="jb-mobile-quick" data-key="${key}">${label}${count ? `<i>${count}</i>` : ''}</button>`;
    }).join('')}</div>`;
    return `<div class="jb-3 jb-3r"><aside class="jb-filters" id="jb-filters" aria-label="Filters">${filters(p)}</aside>
      <section class="jb-results jb-results-screen"><div class="jb-rh"><div class="jb-count" role="status">${list.length ? `${s0 + 1} - ${s0 + rows.length} of ${list.length}` : '0'} <b>${title}</b></div><div class="jb-rt"><button type="button" class="link-btn" data-action="jb-alert">Send me jobs like these</button><label class="jb-sortlab">Sort by: <select id="jb-sort"><option value="rel" ${p.sort === 'rel' ? 'selected' : ''}>Recommended</option><option value="date" ${p.sort === 'date' ? 'selected' : ''}>Date</option></select></label><button class="btn btn-secondary btn-sm jb-fbtn" data-action="jb-fopen">${I('filter', 14)} Filters${activeFilterCount ? ` (${activeFilterCount})` : ''}</button></div></div>
      ${chips.length ? `<div class="jb-applied">${chips.join('')}<button type="button" class="link-btn" data-action="jb-clear-all">Clear all</button></div>` : ''}
      ${rows.length ? `<div class="jb-list">${rows.map(card).join('')}</div>${pg.length ? `<div class="jb-pager">${pg.join('')}</div>` : ''}` : `<div class="jb-none">${I('search', 40)}<h3>No jobs match your search</h3><p class="muted">Try removing some filters, checking the spelling, or searching with a broader keyword.</p><button class="btn btn-secondary" data-action="jb-clear-all">Clear search &amp; filters</button></div>`}
      ${mobileFilterBar}${mobileFilterSheet(p)}</section>
      <aside class="jb-right"><div class="jb-promo jb-safe">${I('shield', 44)}<h3>Never pay anyone to get a job</h3><p class="muted">Fraudsters may ask you to invest money either to earn more OR to get you a job. Never make such payments.</p><a href="#/page/help">Learn more</a></div></aside></div>`;
  }, { layout: 'jobs', title: 'Job results' });
  PL.act('jb-clear-all', () => nav(parse({})));

  /* ---------- detail ---------- */
  const li = a => `<ul class="jb-ul">${(a || []).map(x => `<li>${E(x)}</li>`).join('')}</ul>`;
  R.add('/job/:id', ctx => {
    const j = PL.q.job(ctx.params.id), back = PL.state.jbFrom || PL.state.lastResults || '/job-search', backTxt = /^\/dashboard/.test(back) ? 'Back to dashboard' : /^\/my-applications/.test(back) ? 'Back to my applications' : /^\/saved-jobs/.test(back) ? 'Back to saved jobs' : /^\/job-search/.test(back) ? 'Back to home' : 'Back to results';
    if (!j || j.status !== 'Published') return `<div class="container section">${ui().empty('briefcase', 'Job not available', 'This job may have been closed or removed.', `<a class="btn" href="#/job-search">Browse jobs</a>`)}</div>`;
    const u = me();
    if (u && u.role === 'candidate') PL.q.syncLegacyApplications(u.id);
    const pend = u && u.role === 'candidate' ? takePend(j.id) : null;
    if (pend && pend.t === 'save' && !PL.q.isSaved(u.id, j.id)) toggleSave(u, j.id);
    const c = co(j), saved = u && PL.q.isSaved(u.id, j.id), ap = applied(u, j.id);
    const html = `<div class="container jb-detail"><a href="#${back}" class="small">${I('left', 14)} ${backTxt}</a>
      <div class="jb-detail-sections">
        <section class="card jb-dhead"><div class="jb-top"><div class="jb-detail-logo">${ui().logo(c, 76)}</div><div class="grow"><h1>${E(j.title)}</h1><div class="jb-co">${E(c.name)}</div><div class="jb-category">${I('tag', 15)} ${E(j.department)}</div></div></div>
          <div class="jb-meta big"><span>${I('briefcase', 15)}${expTxt(j)}</span><span>${I('rupee', 15)}${salTxt(j)}</span><span>${I('pin', 15)}${E(j.location || j.city)}</span><span>${I('clock', 15)}${E(j.type)} · ${E(j.workMode)}</span></div>
          <div class="jb-dstats"><span>Posted: <b>${days(j) === 0 ? 'Today' : days(j) + ' day' + (days(j) === 1 ? '' : 's') + ' ago'}</b></span><span>Openings: <b>${j.vacancies}</b></span><span>Applicants: <b>${(j.views || 0) % 97 + 3 + (ap ? 1 : 0)}</b></span></div>
        </section>
        <section class="card pad-lg jb-description"><h2>About this job</h2><p>${E(j.description)}</p><h3>Responsibilities</h3>${li(j.responsibilities)}${j.preferred ? `<h3>Preferred candidate</h3><p>${E(j.preferred)}</p>` : ''}${(j.benefits || []).length ? `<h3>Benefits</h3>${li(j.benefits)}` : ''}${j.incentives ? `<p><b>Incentives:</b> ${E(j.incentives)}</p>` : ''}
          <div class="jb-detail-facts"><div><span>Department</span><b>${E(j.department)}</b></div><div><span>Industry</span><b>${E(c.industry)}</b></div><div><span>Education</span><b>${E(j.qualification || 'Not specified')}</b></div><div><span>Work mode</span><b>${E(j.workMode)}</b></div></div>
          ${(j.skills || []).length ? `<h3>Key skills</h3><div class="jb-tags big">${j.skills.map(s => `<span>${E(s)}</span>`).join('')}</div>` : ''}
          <div class="jb-company-summary">${ui().logo(c, 44)}<div><b>${E(c.name)}</b><div class="small muted">${E(c.industry)}${c.hq ? ' · ' + E(c.hq) : ''}</div>${c.description ? `<p>${E(c.description)}</p>` : ''}</div></div>
        </section>
      </div>
      <div class="jb-detail-actions">${ap ? `<span class="badge b-green">${I('check', 14)} Application submitted</span>` : `<button class="btn" data-action="jb-apply" data-id="${j.id}">Apply</button>`}<button class="btn btn-secondary" data-action="jb-contact" data-id="${j.id}">${I('phone', 16)} View Contact</button><button class="btn btn-secondary" data-action="jb-like" data-id="${j.id}" aria-pressed="${liked(u, j.id)}">${I('like', 16)} ${liked(u, j.id) ? 'Liked' : 'Like'}</button><button class="btn btn-secondary" data-action="jb-save" data-id="${j.id}" aria-pressed="${!!saved}">${I('bookmark', 16)} ${saved ? 'Saved' : 'Save'}</button><button class="btn btn-secondary" data-action="jb-share" data-id="${j.id}">${I('share', 16)} Share Job</button></div>
      </div>`;
    return pend && pend.t === 'apply' && !ap && u ? { html, after: () => setTimeout(() => confirmApply(u, j), 50) } : html;
  }, { layout: 'jobs', title: 'Job details' });
  PL.act('jb-signin', d => PL.auth.requireLogin('/job/' + d.id, 'Sign in to view contact details.'));
  PL.act('jb-contact', d => {
    const u = me();
    if (!u) return PL.auth.requireLogin('/job/' + d.id, 'Sign in to view contact details.');
    if (u.role !== 'candidate') return ui().toast('Contact details are available to candidate accounts.', 'info');
    const j = PL.q.job(d.id), recruiter = j && PL.q.user(j.recruiterId);
    const phone = String(recruiter && recruiter.phone || '').replace(/\D/g, '');
    const email = recruiter && String(recruiter.email || '').trim();
    const links = [];
    if (phone) links.push(`<a class="btn jb-contact-option" href="https://wa.me/${phone}" target="_blank" rel="noopener">${I('message', 18)} WhatsApp</a>`);
    if (phone) links.push(`<a class="btn btn-secondary jb-contact-option" href="tel:${phone}">${I('phone', 18)} Call</a>`);
    if (email) links.push(`<a class="btn btn-secondary jb-contact-option" href="mailto:${E(email)}">${I('mail', 18)} Email</a>`);
    const content = `<p class="muted">${recruiter ? `Contact ${E(recruiter.name)} at ${E((PL.q.company(j.companyId) || {}).name || 'the hiring company')}.` : 'Contact information has not been provided for this job.'}</p>${links.length ? `<div class="jb-contact-options">${links.join('')}</div>` : '<p class="small muted">No contact options are available for this job yet.</p>'}`;
    ui().modal({ title: 'View contact', body: content });
  });

  /* ---------- Naukri-style header + search overlay ---------- */
  PL.jobsLayout = (ctx, html, u) => {
    const p = parse(ctx.query || {}), onRes = ctx.path === '/job-results';
    const sum = onRes ? [p.q, p.exp !== '' ? (+p.exp === 0 ? 'Fresher' : p.exp + ' yrs') : '', p.loc].filter(Boolean).join(', ') : '';
    const nav = (h, t, on) => `<a href="#${h}" class="${on ? 'on' : ''}">${t}</a>`;
    const role = u ? u.role : '';
    const inbox = role === 'recruiter' ? '/employer/messages' : '';
    const notifications = role === 'candidate' ? '/app/notifications' : role === 'recruiter' ? '/employer/notifications' : '';
    const unreadMessages = u && inbox ? PL.q.unreadMsgs(u.id) : 0, unreadNotifications = u && notifications ? PL.q.unreadNotifs(u.id) : 0;
    document.body.className = '';
    return `<header class="jb-hd ${role === 'candidate' && ctx.path === '/dashboard' ? 'jb-dashboard-hd' : ''}"><div class="jb-hd-in">${PL.brandHtml('/job-search')}
      <nav class="jb-nav" aria-label="Main">${nav('/job-search', 'Home', ctx.path === '/job-search')}${nav('/job-results', 'Jobs', /^\/job(-results|\/)/.test(ctx.path))}${role !== 'candidate' ? nav('/dashboard', 'Dashboard', ctx.path === '/dashboard') : ''}</nav>
      <button type="button" class="jb-pill" data-action="jb-sopen" aria-label="Search jobs"><span class="${sum ? '' : 'ph'}">${E(sum || 'Search jobs here')}</span><i class="jb-sgo">${I('search', 16)}</i></button>
      <div class="jb-hd-r">${u ? `${inbox ? `<a class="icon-btn jb-head-link" href="#${inbox}" aria-label="Inbox${unreadMessages ? ', ' + unreadMessages + ' unread' : ''}">${I('message', 20)}${unreadMessages ? `<i>${unreadMessages}</i>` : ''}</a>` : ''}${notifications ? `<a class="icon-btn jb-head-link" href="#${notifications}" aria-label="Notifications${unreadNotifications ? ', ' + unreadNotifications + ' unread' : ''}">${I('bell', 20)}${unreadNotifications ? `<i>${unreadNotifications}</i>` : ''}</a>` : ''}${PL.profileMenu(u)}` : `<a class="btn btn-sm" href="#/login">Sign in</a>`}</div></div></header>
      ${PL.mobileBackbar(ctx)}<div class="jb-ov" id="jb-ov" hidden><div class="jb-ov-top"><div class="jb-hd-in">${PL.brandHtml('/job-search')}<button type="button" class="icon-btn jb-ov-x" data-action="jb-sclose" aria-label="Close search">${I('x', 22)}</button></div>${searchBar(p)}</div><div class="jb-ov-scrim" data-action="jb-sclose"></div></div>
      <main id="main" tabindex="-1" class="jb-main-mobile ${ctx.path === '/job-results' ? 'has-job-filterbar' : ''}">${html}</main><footer class="jb-foot2"><span>&copy; ${new Date().getFullYear()} PharmaLinkIn prototype &middot; Demo content only</span><button class="link-btn" data-action="reset-demo">Reset demo data</button></footer>${PL.mobileNav(role, ctx.path)}`;
  };
  PL.act('jb-social', () => {
    const links = PL.config.socialLinks || [];
    const body = links.length
      ? `<p class="muted">Follow PharmaLinkIn on its official social channels.</p><nav class="jb-social-links" aria-label="Official social media">${links.map(link => `<a href="${E(link.url)}" target="_blank" rel="noopener noreferrer">${I('globe', 18)}<span>${E(link.label)}</span>${I('arrow', 14)}</a>`).join('')}</nav>`
      : '<p class="muted">Official social-media profiles are not available yet.</p>';
    ui().modal({ title: 'Follow PharmaLinkIn', body });
  });
  PL.act('jb-post-denied', () => ui().toast('Posting is not available for this account.', 'info'));
  PL.act('jb-sopen', () => { const o = document.getElementById('jb-ov'); if (!o) return; o.hidden = false; document.body.classList.add('jb-lock'); const q = o.querySelector('.jb-q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } });
  PL.act('jb-sclose', () => { const o = document.getElementById('jb-ov'); if (o) o.hidden = true; document.body.classList.remove('jb-lock'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const o = document.getElementById('jb-ov'); if (o && !o.hidden) { o.hidden = true; document.body.classList.remove('jb-lock'); } } });
})();