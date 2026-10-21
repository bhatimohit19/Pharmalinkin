/* Job search (Naukri-style): search home -> results with filters -> job detail. Used right after onboarding. */
(function () {
  const PL = window.PL, ui = () => PL.ui, db = () => PL.store.s, E = s => PL.esc(s), I = (n, s) => PL.ui.icon(n, s), F = () => PL.ui.fmt, R = PL.router;
  const lc = s => String(s || '').toLowerCase();
  const PER = 8;
  const SAL = [['0-3', '0-3 Lakhs', 0, 3], ['3-6', '3-6 Lakhs', 3, 6], ['6-10', '6-10 Lakhs', 6, 10], ['10-15', '10-15 Lakhs', 10, 15], ['15+', '15+ Lakhs', 15, 999]];
  const FRESH = [['1', 'Last 1 day'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['15', 'Last 15 days'], ['30', 'Last 30 days']];
  const CSV = ['mode', 'dept', 'type', 'qual', 'sal', 'city', 'ind'];
  const co = j => PL.q.company(j.companyId) || { name: '', industry: '' };
  const days = j => Math.max(0, Math.floor((Date.now() - new Date(j.createdAt)) / 864e5));
  const me = () => PL.auth.user();
  const applied = (u, id) => !!(u && u.profile && (u.profile.applied || []).some(a => a.id === id));

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
  const fileIc = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 9h6M9 13h6"/></svg>';
  const star = '<svg viewBox="0 0 24 24" width="14" height="14" fill="#F79009" aria-hidden="true"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/></svg>';
  const card = j => {
    const c = co(j), u = me(), saved = u && PL.q.isSaved(u.id, j.id), ap = applied(u, j.id), rt = rating(j);
    return `<article class="jb-card"><div class="jb-top"><div class="grow"><h3><a href="#/job/${j.id}">${E(j.title)}</a></h3><div class="jb-co"><b>${E(c.name)}</b><span class="jb-rate">${star} ${rt.r}</span><span class="jb-rev">${rt.n} Reviews</span></div></div>${ui().logo(c, 54)}</div>
      <div class="jb-meta"><span>${I('briefcase', 15)}${expTxt(j)}</span><span>${I('pin', 15)}${E(j.city)}</span><span>${I('rupee', 15)}${salTxt(j)}</span></div>
      <p class="jb-desc">${fileIc}<span>${E(j.description.slice(0, 120))}…</span></p>
      <div class="jb-tags">${(j.skills || []).slice(0, 7).map(s => `<span>${E(s)}</span>`).join('')}</div>
      <div class="jb-foot"><span class="xs muted">${ago(j)}</span><div class="row nowrap jb-acts">${ap ? `<span class="badge b-green">${I('check', 12)} Applied</span>` : ''}<button type="button" class="jb-save" data-action="jb-share" data-id="${j.id}">${I('share', 18)} Share</button><button class="jb-save ${saved ? 'on' : ''}" data-action="jb-save" data-id="${j.id}" aria-pressed="${!!saved}">${I('bookmark', 18)} ${saved ? 'Saved' : 'Save'}</button><a class="jb-save jb-view" href="#/job/${j.id}">${I('eye', 18)} View job</a></div></div></article>`;
  };
  const mini = j => { const c = co(j), rt = rating(j); return `<a class="jb-mini" href="#/job/${j.id}"><div class="jb-mini-t">${ui().logo(c, 40)}<span class="xs muted">${ago(j)}</span></div><b>${E(j.title)}</b><div class="jb-mini-c">${E(c.name)} <span class="jb-rate">${star} ${rt.r}</span></div><div class="jb-mini-l">${I('pin', 14)} ${E(j.workMode === 'Remote' ? 'Remote' : j.city)}</div></a>`; };
  PL.act('jb-share', d => {
    const j = PL.q.job(d.id); const link = ui().url('/job/' + d.id); const L = encodeURIComponent(link);
    const T = encodeURIComponent((j ? j.title + ' at ' + co(j).name : 'Job opening') + ' on PharmaLinkIn');
    const svg = p => `<svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden="true">${p}</svg>`;
    const net = [
      ['WhatsApp', '#25D366', `https://wa.me/?text=${T}%20${L}`, svg('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.1-.2-1.2-1.6-1.2-3s.8-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.2-.3.3-.1.6.2.3.7 1.2 1.5 1.9 1 .9 1.900 1.200 2.200 1.300.3.1.4.1.6-.1l.8-1c.2-.2.3-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.500z"/>')],
      ['Facebook', '#1877F2', `https://www.facebook.com/sharer/sharer.php?u=${L}`, svg('<path d="M14 8V6.5c0-.7.2-1 1.100-1H17V2h-2.700C11.200 2 10 3.800 10 6.200V8H7.500v3.500H10V22h4V11.500h2.800L17.300 8z"/>')],
      ['X (Twitter)', '#000', `https://twitter.com/intent/tweet?text=${T}&url=${L}`, svg('<path d="M17.800 3h3.100l-6.800 7.700L22 21h-6.200l-4.900-6.300L5.300 21H2.200l7.300-8.300L2 3h6.400l4.400 5.800zm-1.100 16.200h1.700L7.400 4.700H5.600z"/>')],
      ['LinkedIn', '#0A66C2', `https://www.linkedin.com/sharing/share-offsite/?url=${L}`, svg('<path d="M4.500 8.500h3.600V20H4.500zM6.300 3a2.100 2.100 0 1 1 0 4.200 2.100 2.100 0 0 1 0-4.200zM10 8.500h3.400v1.600c.5-.9 1.700-1.900 3.500-1.900 3.700 0 4.400 2.400 4.400 5.600V20h-3.600v-5.500c0-1.300 0-3-1.800-3s-2.100 1.400-2.100 2.900V20H10z"/>')],
      ['Email', '#EA4335', `mailto:?subject=${T}&body=${T}%0A${L}`, svg('<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.200L4.500 7v.1L12 12.500 19.500 7.100V7z"/>')]
    ];
    const body = `<div class="jb-shr-grid">${net.map(n => `<a class="jb-shr" href="${n[2]}" target="_blank" rel="noopener" ${n[0] === 'Email' ? '' : ''}><span style="background:${n[1]}">${n[3]}</span><small>${n[0]}</small></a>`).join('')}</div><div class="jb-shr-link"><input readonly value="${E(link)}" aria-label="Job link"><button type="button" class="btn btn-secondary" data-copy>Copy link</button></div>`;
    const m = ui().modal({ title: 'Share this job', body });
    m.el.querySelector('[data-copy]').onclick = () => ui().copy(link);
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
  const STAGES = ['Applied', 'Viewed by recruiter', 'Shortlisted', 'Interview'];
  const stageOf = a => { const m = (Date.now() - new Date(a.at)) / 6e4; return m < 1 ? 0 : m < 4 ? 1 : hash(a.id) % 2 ? 1 : 2; };
  const userExp = u => { const p = u.profile || {}; return p.level === 'Fresher' ? 0 : (p.experienceYears || 0); };
  const doApply = (u, id) => { const p = (u.profile = u.profile || {}); p.applied = p.applied || []; if (!applied(u, id)) p.applied.push({ id, at: new Date().toISOString() }); PL.store.save(); ui().toast('Application sent! (demo)'); PL.rerender(); };
  const confirmApply = (u, j) => {
    const p = u.profile || {}, exp = userExp(u), pct = PL.q.completion(u).pct, c = co(j), warn = [];
    if (exp < j.expMin) warn.push(`This role asks for ${j.expMin}-${j.expMax} years of experience and your profile shows ${exp === 0 ? 'none (Fresher)' : exp + ' yr' + (exp === 1 ? '' : 's')}. You can still apply.`);
    else if (exp > j.expMax) warn.push(`This role is for ${j.expMin}-${j.expMax} years and your profile shows ${exp} years. You can still apply.`);
    if (pct < 70) warn.push(`Your profile is only ${pct}% complete. <a href="#/onboarding">Complete it</a> to improve your chances.`);
    const body = `<div class="jb-ap"><div class="row nowrap">${ui().logo(c, 44)}<div><b>${E(j.title)}</b><div class="small muted">${E(c.name)} &middot; ${E(j.city)}</div></div></div>
      <div class="jb-ap-row">${I('file', 18)}<div><span class="xs muted">Resume that will be sent</span><b>${E(p.resumeFile || u.name + ' - PharmaLinkIn profile resume')}</b></div></div>
      <div class="jb-ap-row">${I('mail', 18)}<div><span class="xs muted">Recruiter will contact you on</span><b>${E(u.email)}${u.phone ? ' &middot; ' + E(u.phone) : ''}</b></div></div>
      ${warn.map(w => `<div class="jb-warn">${I('alert', 16)}<span>${w}</span></div>`).join('')}</div>`;
    const m = ui().modal({ title: 'Apply to this job?', body, footer: '<button type="button" class="btn btn-secondary" data-c="0">Cancel</button><button type="button" class="btn" data-c="1">Confirm &amp; apply</button>' });
    m.el.querySelector('[data-c="0"]').onclick = () => m.close();
    m.el.querySelector('[data-c="1"]').onclick = () => { m.close(); doApply(u, j.id); };
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
    if (!ok) return; u.profile.applied = (u.profile.applied || []).filter(a => a.id !== d.id); PL.store.save(); ui().toast('Application withdrawn'); PL.rerender();
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
    const c = PL.q.completion(u), ex = (p.experience || [])[0] || {};
    const appl = (p.applied || []).slice().reverse().map(a => ({ j: PL.q.job(a.id), at: a.at, a })).filter(x => x.j);
    const savedJobs = PL.q.saved(u.id).map(id => PL.q.job(id)).filter(Boolean);
    const rec = recommended(u).filter(j => !appl.some(a => a.j.id === j.id)).slice(0, 8);
    const kpi = (n, l, ic) => `<div class="jb-kpi"><span class="jb-kpi-i">${I(ic, 20)}</span><b>${n}</b><span>${l}</span></div>`;
    const row = x => `<div class="jb-arow"><a class="grow" href="#/job/${x.j.id}"><b>${E(x.j.title)}</b><div class="xs muted">${E(co(x.j).name)} &middot; ${E(x.j.city)}${x.at ? '' : ' &middot; ' + ago(x.j)}</div></a><div class="row nowrap jb-acts">${x.at ? `<span class="badge ${stageOf(x.a) ? 'b-blue' : 'b-green'}">${I('check', 12)} ${STAGES[stageOf(x.a)]}</span>` : ''}<button type="button" class="jb-save" data-action="jb-share" data-id="${x.j.id}" aria-label="Share job">${I('share', 18)}<span class="jb-lbl"> Share</span></button><button type="button" class="jb-save ${PL.q.isSaved(u.id, x.j.id) ? 'on' : ''}" data-action="jb-save" data-id="${x.j.id}" aria-label="Save job">${I('bookmark', 18)}<span class="jb-lbl"> ${PL.q.isSaved(u.id, x.j.id) ? 'Saved' : 'Save'}</span></button><a class="jb-save jb-view" href="#/job/${x.j.id}">${I('eye', 18)}<span class="jb-lbl"> View job</span></a></div></div>`;
    return `<div class="jb-dash"><div class="jb-dhead"><div><h1>Welcome, ${E(u.name.split(' ')[0])}!</h1><p class="muted">${E(p.headline || '')}${ex.company ? ' @ ' + E(ex.company) : ''}</p></div><div class="row"><a class="btn" href="#/job-results">${I('search', 16)} Find jobs</a><a class="btn btn-secondary" href="#/onboarding/done">${I('file', 16)} My resume</a></div></div>
      <div class="jb-kpis"><a href="#/my-applications">${kpi(appl.length, 'Applications', 'file')}</a><a href="#/saved-jobs">${kpi(savedJobs.length, 'Saved jobs', 'bookmark')}</a>${kpi(c.pct + '%', 'Profile strength', 'user')}${kpi((p.skills || []).length, 'Skills', 'zap')}</div>
      <div class="jb-dgrid"><div class="jb-center">
        <section class="jb-panel"><div class="jb-sh"><h2>Recent applications</h2>${appl.length > 5 ? '<a href="#/my-applications">View all ('+appl.length+')</a>' : appl.length ? '<a href="#/my-applications">View all</a>' : ''}</div>${appl.length ? appl.slice(0, 5).map(row).join('') : `<div class="jb-empty">You haven&rsquo;t applied to any job yet. <a href="#/job-results">Browse jobs</a></div>`}</section>
        <section class="jb-panel"><div class="jb-sh"><h2>Saved jobs</h2>${savedJobs.length ? '<a href="#/saved-jobs">View all ('+savedJobs.length+')</a>' : ''}</div>${savedJobs.length ? savedJobs.slice(0, 5).map(j => row({ j })).join('') : `<div class="jb-empty">No saved jobs yet. Tap Save on any job to keep it here.</div>`}</section>
        <section class="jb-panel"><div class="jb-sh"><h2>Recommended for you</h2><a href="#/job-results">View all</a></div><div class="jb-scroll">${rec.map(mini).join('')}</div></section></div>
      <aside class="jb-right"><div class="jb-panel"><h3 style="margin-top:0">Profile strength</h3><div class="row between small"><span>${c.pct}% complete</span></div>${ui().progress(c.pct)}${c.missing.length ? `<p class="small muted mt-s">Add: ${c.missing.map(E).join(', ')}</p>` : '<p class="small mt-s">Great &ndash; your profile is complete!</p>'}<a class="btn btn-secondary btn-sm" href="#/onboarding">${I('edit', 14)} Edit my answers</a></div></aside></div></div>`;
  }, { layout: 'jobs', title: 'Dashboard' });
  const gate = path => { const u = me(); if (!u) { PL.auth.requireLogin(path); return null; } if (u.role !== 'candidate') return null; if (!(u.profile && u.profile.onboarded)) { PL.go('/onboarding'); return null; } return u; };
  R.add('/my-applications', () => {
    const u = gate('/my-applications'); if (!u) return '';
    const list = (u.profile.applied || []).slice().reverse().map(a => ({ a, j: PL.q.job(a.id) })).filter(x => x.j);
    const row = ({ a, j }) => { const c = co(j), st = stageOf(a); return `<article class="jb-card jb-app"><div class="jb-top"><div class="grow"><h3><a href="#/job/${j.id}">${E(j.title)}</a></h3><div class="jb-co"><b>${E(c.name)}</b></div></div>${ui().logo(c, 48)}</div>
      <div class="jb-meta"><span>${I('pin', 15)}${E(j.city)}</span><span>${I('briefcase', 15)}${expTxt(j)}</span><span>${I('rupee', 15)}${salTxt(j)}</span></div>
      <ol class="jb-steps" aria-label="Application status">${STAGES.map((s, i) => `<li class="${i < st ? 'done' : i === st ? 'now' : ''}"><i></i><span>${s}</span></li>`).join('')}</ol>
      <div class="jb-foot"><span class="xs muted">Applied on ${F().date(a.at)}</span><div class="row nowrap jb-acts"><button type="button" class="jb-save" data-action="jb-withdraw" data-id="${j.id}">${I('x', 18)} Withdraw</button><a class="jb-save jb-view" href="#/job/${j.id}">${I('eye', 18)} View job</a></div></div></article>`; };
    return `<div class="jb-page"><a href="#/dashboard" class="small">${I('left', 14)} Back to dashboard</a><h1>My applications <span class="muted">(${list.length})</span></h1><p class="muted small">Status updates are simulated in this demo.</p>${list.length ? `<div class="jb-list">${list.map(row).join('')}</div>` : `<div class="jb-none">${I('file', 40)}<h3>No applications yet</h3><p class="muted">Jobs you apply to will appear here.</p><a class="btn" href="#/job-results">Browse jobs</a></div>`}</div>`;
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
  R.add('/job-search', () => {
    const u = me(), jobs = PL.q.publicJobs(), cand = u && u.role === 'candidate', pr = (u && u.profile) || {};
    const pct = cand ? PL.q.completion(u).pct : 0, ex = (pr.experience || [])[0] || {};
    const appliedJobs = (pr.applied || []).map(a => PL.q.job(a.id)).filter(Boolean);
    const rec = recommended(u), like = jobs.filter(j => !rec.includes(j)).slice(0, 8);
    const pv = pr.preferences || {}, pl = (pv.locations || []).map(lc), pro = (pv.roles || []).map(lc), prefJobs = cand ? jobs.filter(j => (pl.length && pl.some(l => lc(j.city).includes(l))) || (pro.length && pro.some(r => lc(j.title + ' ' + j.department).includes(r)))).slice(0, 8) : [];
    const tabs = [['app', 'Applies', appliedJobs], ['rec', 'Profile', rec], ['like', 'You might like', like], ['pref', 'Preferences', prefJobs]];
    if (tab === 'app' && !appliedJobs.length) tab = 'rec';
    const cur = tabs.find(x => x[0] === tab) || tabs[1];
    const early = jobs.filter(j => j.featured).concat(jobs).filter((j, i, a) => a.indexOf(j) === i).slice(0, 6);
    const ring = `<div class="jb-ring" style="--p:${pct}"><div class="jb-ring-in">${ui().avatar(u || { name: 'U' }, 92)}</div><span>${pct}%</span></div>`;
    return `<div class="jb-3"><aside class="jb-left">
      <div class="jb-pcard">${ring}<h2>${E(u ? u.name : 'Guest')}</h2><div class="jb-sub">${E(pr.headline || '')}${ex.company ? ' @ ' + E(ex.company) : ''}</div><div class="xs muted">Last updated today</div><a class="btn jb-rbtn" href="#/dashboard">${cand ? 'My dashboard' : 'Sign in'}</a></div>
      <div class="jb-perf"><h3>Profile performance</h3><div class="jb-perf-g"><div><span>Search appearances</span><b>${34 + pct % 17}</b></div><div><span>Recruiter actions</span><b>${4 + pct % 9}</b></div></div></div>
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
      ${facetBox('Work mode', 'mode', p, facet(p, 'mode', j => j.workMode))}${exps}${facetBox('Department', 'dept', p, facet(p, 'dept', j => j.department))}${facetBox('Salary', 'sal', p, salCounts, v => (SAL.find(s => s[0] === v) || [])[1] || v)}${facetBox('Location', 'city', p, facet(p, 'city', j => j.city))}${fresh}${facetBox('Role category', 'type', p, facet(p, 'type', j => j.type), null, false)}${facetBox('Education', 'qual', p, facet(p, 'qual', j => j.qualification), null, false)}${facetBox('Industry', 'ind', p, facet(p, 'ind', j => co(j).industry), null, false)}</div>
      <div class="jb-fapply"><button type="button" class="btn btn-block" data-action="jb-fx">Show results</button></div>`;
  };
  const collect = () => { const p = parse({}), root = document.getElementById('jb-filters'), bar = document.querySelector('.jb-bar'); if (bar) { p.q = bar.q.value.trim(); p.loc = bar.loc.value.trim(); p.exp = bar.exp.value; } p.sort = (document.getElementById('jb-sort') || {}).value || 'rel'; CSV.forEach(k => (p[k] = [...root.querySelectorAll(`input[type=checkbox][data-f="${k}"]:checked`)].map(i => i.value))); const fr = root.querySelector('input[data-f="fresh"]:checked'); p.fresh = fr ? fr.value : ''; return p; };
  const current = () => parse(PL.router.parse().query);
  document.addEventListener('change', e => {
    const t = e.target; if (!t.closest || !t.closest('#jb-filters')) return;
    if (t.matches('input[data-f="exp"]')) { const p = current(); p.exp = t.value; p.page = 1; nav(p, true); return; }
    const p = current(), c = collect(); CSV.forEach(k => (p[k] = c[k])); p.fresh = c.fresh; p.page = 1; nav(p, true);
  });
  document.addEventListener('input', e => { const t = e.target; if (t.matches && t.matches('#jb-filters input[data-f="exp"]')) { const v = document.getElementById('jb-exv'); if (v) v.textContent = +t.value === 0 ? 'Fresher' : t.value + (+t.value === 1 ? ' year' : ' years'); } });
  document.addEventListener('change', e => { const t = e.target; if (t.id === 'jb-sort') { const p = current(); p.sort = t.value; p.page = 1; nav(p, true); } });
  PL.act('jb-more', (d, el) => { const b = el.closest('.jb-fb'); b.classList.toggle('all'); el.textContent = b.classList.contains('all') ? 'View less' : 'View more'; });
  PL.act('jb-clear', () => { const p = current(); nav({ ...parse({}), q: p.q, loc: p.loc }, true); });
  PL.act('jb-unexp', () => { const p = current(); p.exp = ''; p.page = 1; nav(p, true); });
  PL.act('jb-unfresh', () => { const p = current(); p.fresh = ''; p.page = 1; nav(p, true); });
  PL.act('jb-fopen', () => document.getElementById('jb-filters').classList.add('open'));
  PL.act('jb-fx', () => document.getElementById('jb-filters').classList.remove('open'));
  PL.act('jb-rm', d => { const p = current(); if (d.k === 'q' || d.k === 'loc' || d.k === 'exp' || d.k === 'fresh') p[d.k] = ''; else p[d.k] = p[d.k].filter(x => x !== d.v); p.page = 1; nav(p, true); });
  PL.act('jb-page', d => { const p = current(); p.page = +d.n; nav(p); });

  R.add('/job-results', ctx => {
    const p = parse(ctx.query), list = run(p), pages = Math.max(1, Math.ceil(list.length / PER)), page = Math.min(p.page, pages), rows = list.slice((page - 1) * PER, page * PER);
    PL.state.lastResults = url(p);
    const chips = []; const add = (k, v, t) => chips.push(`<button type="button" class="jb-ac" data-action="jb-rm" data-k="${k}" data-v="${E(v)}">${E(t)} ${I('x', 12)}</button>`);
    if (p.q) add('q', '', p.q); if (p.loc) add('loc', '', p.loc); if (p.exp !== '') add('exp', '', +p.exp === 0 ? 'Fresher' : p.exp + ' yrs'); if (p.fresh) add('fresh', '', (FRESH.find(f => f[0] === p.fresh) || [])[1]);
    CSV.forEach(k => p[k].forEach(v => add(k, v, k === 'sal' ? (SAL.find(s => s[0] === v) || [])[1] : v)));
    const pg = [];
    if (pages > 1) { const from = Math.max(1, Math.min(page - 2, pages - 4)), to = Math.min(pages, from + 4); pg.push(`<button class="btn btn-secondary btn-sm" ${page === 1 ? 'disabled' : ''} data-action="jb-page" data-n="${page - 1}">${I('left', 14)} Prev</button>`); for (let i = from; i <= to; i++) pg.push(`<button class="btn btn-sm ${i === page ? '' : 'btn-secondary'}" data-action="jb-page" data-n="${i}" ${i === page ? 'aria-current="page"' : ''}>${i}</button>`); pg.push(`<button class="btn btn-secondary btn-sm" ${page === pages ? 'disabled' : ''} data-action="jb-page" data-n="${page + 1}">Next ${I('arrow', 14)}</button>`); }
    const title = p.q ? `${E(p.q)} jobs${p.loc ? ' in ' + E(p.loc) : ''}` : p.loc ? `Jobs in ${E(p.loc)}` : 'All pharma jobs';
    const s0 = (page - 1) * PER;
    return `<div class="jb-3 jb-3r"><aside class="jb-filters" id="jb-filters" aria-label="Filters">${filters(p)}</aside>
      <section class="jb-results"><div class="jb-rh"><div class="jb-count" role="status">${list.length ? `${s0 + 1} - ${s0 + rows.length} of ${list.length}` : '0'} <b>${title}</b></div><div class="jb-rt"><button type="button" class="link-btn" data-action="jb-alert">Send me jobs like these</button><label class="jb-sortlab">Sort by: <select id="jb-sort"><option value="rel" ${p.sort === 'rel' ? 'selected' : ''}>Recommended</option><option value="date" ${p.sort === 'date' ? 'selected' : ''}>Date</option></select></label><button class="btn btn-secondary btn-sm jb-fbtn" data-action="jb-fopen">${I('filter', 14)} Filters${chips.length ? ` (${chips.length})` : ''}</button></div></div>
      ${chips.length ? `<div class="jb-applied">${chips.join('')}<button type="button" class="link-btn" data-action="jb-clear-all">Clear all</button></div>` : ''}
      ${rows.length ? `<div class="jb-list">${rows.map(card).join('')}</div>${pg.length ? `<div class="jb-pager">${pg.join('')}</div>` : ''}` : `<div class="jb-none">${I('search', 40)}<h3>No jobs match your search</h3><p class="muted">Try removing some filters, checking the spelling, or searching with a broader keyword.</p><button class="btn btn-secondary" data-action="jb-clear-all">Clear search &amp; filters</button></div>`}</section>
      <aside class="jb-right"><div class="jb-promo jb-safe">${I('shield', 44)}<h3>Never pay anyone to get a job</h3><p class="muted">Fraudsters may ask you to invest money either to earn more OR to get you a job. Never make such payments.</p><a href="#/page/help">Learn more</a></div></aside></div>`;
  }, { layout: 'jobs', title: 'Job results' });
  PL.act('jb-clear-all', () => nav(parse({})));

  /* ---------- detail ---------- */
  const li = a => `<ul class="jb-ul">${(a || []).map(x => `<li>${E(x)}</li>`).join('')}</ul>`;
  R.add('/job/:id', ctx => {
    const j = PL.q.job(ctx.params.id), back = PL.state.jbFrom || PL.state.lastResults || '/job-search', backTxt = /^\/dashboard/.test(back) ? 'Back to dashboard' : /^\/my-applications/.test(back) ? 'Back to my applications' : /^\/saved-jobs/.test(back) ? 'Back to saved jobs' : /^\/job-search/.test(back) ? 'Back to home' : 'Back to results';
    if (!j || j.status !== 'Published') return `<div class="container section">${ui().empty('briefcase', 'Job not available', 'This job may have been closed or removed.', `<a class="btn" href="#/job-search">Browse jobs</a>`)}</div>`;
    const u = me(), pend = u && u.role === 'candidate' ? takePend(j.id) : null;
    if (pend && pend.t === 'save' && !PL.q.isSaved(u.id, j.id)) toggleSave(u, j.id);
    const c = co(j), saved = u && PL.q.isSaved(u.id, j.id), ap = applied(u, j.id), rc = PL.q.user(j.recruiterId);
    const sim = PL.q.publicJobs().filter(x => x.id !== j.id && (x.department === j.department || x.companyId === j.companyId)).slice(0, 4);
    const dt = (k, v) => v ? `<div class="jb-dr"><span>${k}</span><b>${E(v)}</b></div>` : '';
    const html = `<div class="container jb-detail"><a href="#${back}" class="small">${I('left', 14)} ${backTxt}</a>
      <div class="jb-dgrid"><div class="jb-dmain">
        <div class="card jb-dhead"><div class="jb-top">${ui().logo(c, 60)}<div class="grow"><h1>${E(j.title)}</h1><div class="jb-co">${E(c.name)}</div></div></div>
          <div class="jb-meta big"><span>${I('briefcase', 15)}${expTxt(j)}</span><span>${I('rupee', 15)}${salTxt(j)}</span><span>${I('pin', 15)}${E(j.location)}</span><span>${I('clock', 15)}${E(j.type)} &middot; ${E(j.workMode)}</span></div>
          <div class="jb-dstats"><span>Posted: <b>${days(j) === 0 ? 'Today' : days(j) + ' day' + (days(j) === 1 ? '' : 's') + ' ago'}</b></span><span>Openings: <b>${j.vacancies}</b></span><span>Applicants: <b>${(j.views || 0) % 97 + 3 + (ap ? 1 : 0)}</b></span></div>
          <div class="row mt-s">${ap ? `<span class="badge b-green" style="padding:10px 14px">${I('check', 14)} Applied</span>` : `<button class="btn" data-action="jb-apply" data-id="${j.id}">Apply now</button>`}<button class="btn btn-secondary" data-action="jb-save" data-id="${j.id}" aria-pressed="${!!saved}">${I('bookmark', 16)} ${saved ? 'Saved' : 'Save'}</button><button class="btn btn-secondary" data-action="jb-share" data-id="${j.id}">${I('share', 16)} Share</button></div></div>
        <div class="card pad-lg jb-contact"><h2>Contact details</h2>${!u ? `<div class="jb-lock">${I('shield', 28)}<p>Sign in to view the recruiter&rsquo;s email and contact number.</p><button type="button" class="btn" data-action="jb-signin" data-id="${j.id}">Sign in to view</button></div>` : rc ? `<div class="jb-crow"><span class="jb-ci">${I('user', 18)}</span><div><span class="xs muted">Recruiter</span><b>${E(rc.name)}</b><div class="small muted">${E(c.name)}</div></div></div><div class="jb-crow"><span class="jb-ci">${I('mail', 18)}</span><div><span class="xs muted">Email</span><b><a href="mailto:${E(rc.email)}">${E(rc.email)}</a></b></div></div><div class="jb-crow"><span class="jb-ci">${I('phone', 18)}</span><div><span class="xs muted">Contact number</span><b><a href="tel:${E(String(rc.phone || '').replace(/\s/g, ''))}">${E(rc.phone || 'Not provided')}</a></b></div></div>` : '<p class="muted">Contact details are not available for this job.</p>'}</div>
        <div class="card pad-lg"><h2>Job description</h2><p>${E(j.description)}</p><h3>Roles &amp; responsibilities</h3>${li(j.responsibilities)}<h3>Preferred candidate</h3><p>${E(j.preferred)}</p>${(j.benefits || []).length ? `<h3>Perks &amp; benefits</h3>${li(j.benefits)}` : ''}${j.incentives ? `<p><b>Incentives:</b> ${E(j.incentives)}</p>` : ''}</div>
        <div class="card pad-lg"><h2>Role details</h2><div class="jb-drs">${dt('Role', j.title)}${dt('Industry type', c.industry)}${dt('Department', j.department)}${dt('Employment type', j.type)}${dt('Work mode', j.workMode)}${dt('Education', j.qualification)}${dt('Travel', j.travel)}</div><h3 class="mt">Key skills</h3><div class="jb-tags big">${(j.skills || []).map(s => `<span>${E(s)}</span>`).join('')}</div></div>
        <div class="card pad-lg"><h2>About company</h2><div class="row nowrap start">${ui().logo(c, 48)}<div><b>${E(c.name)}</b><div class="small muted">${E(c.industry)}${c.hq ? ' &middot; ' + E(c.hq) : ''}${c.size ? ' &middot; ' + E(c.size) + ' employees' : ''}</div></div></div><p class="small mt-s">${E(c.description || '')}</p></div></div>
        <aside class="jb-dside"><div class="card pad"><h3>Similar jobs</h3>${sim.length ? sim.map(x => `<a class="jb-sim" href="#/job/${x.id}"><b>${E(x.title)}</b><span>${E(co(x).name)}</span><span class="xs muted">${expTxt(x)} &middot; ${salTxt(x)} &middot; ${E(x.city)}</span></a>`).join('') : '<p class="muted small">No similar jobs right now.</p>'}</div></aside></div></div>`;
    return pend && pend.t === 'apply' && !ap && u ? { html, after: () => setTimeout(() => confirmApply(u, j), 50) } : html;
  }, { layout: 'jobs', title: 'Job details' });
  PL.act('jb-signin', d => PL.auth.requireLogin('/job/' + d.id, 'Sign in to view contact details.'));

  /* ---------- Naukri-style header + search overlay ---------- */
  PL.jobsLayout = (ctx, html, u) => {
    const p = parse(ctx.query || {}), onRes = ctx.path === '/job-results';
    const sum = onRes ? [p.q, p.exp !== '' ? (+p.exp === 0 ? 'Fresher' : p.exp + ' yrs') : '', p.loc].filter(Boolean).join(', ') : '';
    const nav = (h, t, on) => `<a href="#${h}" class="${on ? 'on' : ''}">${t}</a>`;
    document.body.className = '';
    return `<header class="jb-hd"><div class="jb-hd-in">${PL.brandHtml('/job-search')}
      <nav class="jb-nav" aria-label="Main">${nav('/job-search', 'Home', ctx.path === '/job-search')}${nav('/job-results', 'Jobs', /^\/job(-results|\/)/.test(ctx.path))}${nav('/dashboard', 'Dashboard', ctx.path === '/dashboard')}</nav>
      <button type="button" class="jb-pill" data-action="jb-sopen" aria-label="Search jobs"><span class="${sum ? '' : 'ph'}">${E(sum || 'Search jobs here')}</span><i class="jb-sgo">${I('search', 16)}</i></button>
      <div class="jb-hd-r">${u ? `<button type="button" class="icon-btn" data-action="jb-soon" aria-label="Notifications">${I('bell', 20)}</button>${PL.profileMenu(u)}` : `<a class="btn btn-sm" href="#/login">Sign in</a>`}</div></div></header>
      <div class="jb-ov" id="jb-ov" hidden><div class="jb-ov-top"><div class="jb-hd-in">${PL.brandHtml('/job-search')}<button type="button" class="icon-btn jb-ov-x" data-action="jb-sclose" aria-label="Close search">${I('x', 22)}</button></div>${searchBar(p)}</div><div class="jb-ov-scrim" data-action="jb-sclose"></div></div>
      <main id="main" tabindex="-1">${html}</main><footer class="jb-foot2"><span>&copy; ${new Date().getFullYear()} PharmaLinkIn prototype &middot; Demo content only</span><button class="link-btn" data-action="reset-demo">Reset demo data</button></footer>`;
  };
  PL.act('jb-sopen', () => { const o = document.getElementById('jb-ov'); if (!o) return; o.hidden = false; document.body.classList.add('jb-lock'); const q = o.querySelector('.jb-q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } });
  PL.act('jb-sclose', () => { const o = document.getElementById('jb-ov'); if (o) o.hidden = true; document.body.classList.remove('jb-lock'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const o = document.getElementById('jb-ov'); if (o && !o.hidden) { o.hidden = true; document.body.classList.remove('jb-lock'); } } });
})();