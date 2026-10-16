/* Shared UI helpers & components */
(function () {
  const PL = (window.PL = window.PL || {});
  PL.view = {}; PL.live = {};
  PL.vf = (scope, defaults = {}) => (PL.view[scope] = Object.assign({}, defaults, PL.view[scope] || {}));
  PL.actions = {}; PL.forms = {};
  PL.act = (name, fn) => { PL.actions[name] = fn; };
  PL.form = (name, fn) => { PL.forms[name] = fn; };

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.5.6 3.5 2.6 3.5 6"/>', message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 20a2 2 0 0 0 4 0"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12 5 5 9-10"/>',
    like: '<path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.2 7a2 2 0 0 1-2 1.7H7"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>', more: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    down: '<path d="m6 9 6 6 6-6"/>', right: '<path d="m9 6 6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>', pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.2M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', logout: '<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>', settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>', file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>', download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    megaphone: '<path d="M3 10v4h4l8 5V5L7 10zM18 9a4 4 0 0 1 0 6"/>', chart: '<path d="M4 20V4M4 20h16M8 16v-5M13 16V8M18 16v-9"/>', rupee: '<path d="M7 5h10M7 9h10M7 5c6 0 6 8 0 8h-.5l7.5 7"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', checkc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>', send: '<path d="m21 3-9 18-2-8-8-2z"/><path d="m21 3-11 10"/>', dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5M18 8v6M15 11h6"/>', usercheck: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5M15 12l2 2 4-4"/>', grad: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>', trend: '<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>', pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="M7 4v16l13-8z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1"/>', news: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="M17 8h4v10a2 2 0 0 1-4 0M7 8h6M7 12h6M7 16h4"/>', card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', external: '<path d="M14 4h6v6M20 4 10 14M18 14v6H4V6h6"/>',
    pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-40 12 12)"/><path d="m9.5 8.5 5.5 7"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>', book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n, s = 18, cls = '') => `<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[n] || ''}</svg>`;
  const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const PAL = ['#155EEF', '#0D9488', '#6941C6', '#C11574', '#C4320A', '#0E7090', '#3F6212', '#B54708', '#3538CD'];
  const initials = n => String(n).replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function avatar(u, size = 40, cls = '') {
    const name = typeof u === 'string' ? u : (u && u.name) || '?';
    if (u && typeof u === 'object' && u.photo) return `<img class="avatar ${cls}" src="${u.photo}" alt="${esc(name)}" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`;
    return `<span class="avatar ${cls}" style="width:${size}px;height:${size}px;background:${PAL[hash(name) % PAL.length]};font-size:${Math.round(size * .38)}px" aria-hidden="true">${esc(initials(name))}</span>`;
  }
  function logo(c, size = 44) {
    const name = typeof c === 'string' ? c : (c && c.name) || '?';
    if (c && typeof c === 'object' && c.logoImg) return `<img class="logo-box" src="${c.logoImg}" alt="${esc(name)} logo" width="${size}" height="${size}" style="width:${size}px;height:${size}px">`;
    return `<span class="logo-box" style="width:${size}px;height:${size}px;background:${PAL[hash(name) % PAL.length]};font-size:${Math.round(size * .36)}px" aria-hidden="true">${esc(name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase())}</span>`;
  }
  function art(seed, label = '', w = 800, h = 420) {
    const a = PAL[hash(seed) % PAL.length], b = PAL[hash(seed + 'x') % PAL.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * .82}" cy="${h * .2}" r="${h * .45}" fill="#fff" fill-opacity=".09"/><circle cx="${w * .12}" cy="${h * .98}" r="${h * .4}" fill="#fff" fill-opacity=".08"/><rect x="${w * .62}" y="${h * .55}" width="${w * .3}" height="${h * .09}" rx="${h * .045}" fill="#fff" fill-opacity=".18" transform="rotate(-30 ${w * .77} ${h * .6})"/><text x="34" y="${h - 36}" font-family="Segoe UI,Arial,sans-serif" font-size="${Math.round(h / 11)}" font-weight="700" fill="#fff">${esc(label)}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const fmt = {
    date: iso => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); },
    time: t => t || '—',
    ago(iso) { const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4); if (isNaN(m)) return ''; if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; const d = Math.floor(h / 24); if (d < 30) return d + 'd ago'; return fmt.date(iso); },
    inr: n => '₹' + Number(n || 0).toLocaleString('en-IN'),
    lpa: (a, b) => `₹${a}${b ? ' – ' + b : ''} LPA`,
    size: b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB',
    num: n => Number(n || 0).toLocaleString('en-IN'),
    pct: (a, b) => (b ? ((a / b) * 100).toFixed(2) : '0.00') + '%',
    iso: () => new Date().toISOString(), today: () => new Date().toISOString().slice(0, 10)
  };
  const BADGE = { Applied: 'b-blue', 'Under Review': 'b-amber', Shortlisted: 'b-teal', 'Interview Scheduled': 'b-purple', Offer: 'b-green', Hired: 'b-green', Rejected: 'b-red', Withdrawn: '', Published: 'b-green', 'Pending Approval': 'b-amber', Draft: '', Paused: 'b-amber', Closed: '', Expired: '', Unpublished: '', Active: 'b-green', Completed: '', Suspended: 'b-amber', Banned: 'b-red', 'Pending Verification': 'b-blue', Verified: 'b-green', Pending: 'b-amber', Open: 'b-red', Resolved: 'b-green', Dismissed: '', Removed: 'b-purple', Paid: 'b-green', Failed: 'b-red', Cancelled: '', Scheduled: 'b-blue' };
  const badge = (s, extra = '') => `<span class="badge ${BADGE[s] || ''} ${extra}">${esc(s)}</span>`;
  const sponsoredLabel = (t = 'Sponsored') => `<span class="badge badge-sponsored">${esc(t)}</span>`;

  /* ---- toasts / modal ---- */
  function toast(msg, type = 'ok') {
    const box = document.getElementById('toasts'); if (!box) return;
    const t = document.createElement('div'); t.className = 'toast ' + type; t.setAttribute('role', type === 'err' ? 'alert' : 'status');
    t.innerHTML = `${icon(type === 'err' ? 'alert' : type === 'info' ? 'info' : 'checkc', 18)}<span>${esc(msg)}</span>`;
    box.appendChild(t); setTimeout(() => t.remove(), 3800);
  }
  let mid = 0;
  function modal({ title, body, footer = '', wide = false, onClose }) {
    const root = document.getElementById('modal-root'); const id = ++mid;
    const ov = document.createElement('div'); ov.className = 'modal-ov';
    ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mt${id}" tabindex="-1"><div class="modal-head"><h3 id="mt${id}">${esc(title)}</h3><button type="button" class="icon-btn" aria-label="Close dialog" data-modal-close>${icon('x')}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div>`;
    const prev = document.activeElement; let closed = false;
    const key = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') { const f = [...ov.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex="0"]')].filter(x => x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    function close(r) { if (closed) return; closed = true; ov.remove(); document.removeEventListener('keydown', key, true); if (prev && prev.focus && document.contains(prev)) prev.focus(); if (onClose) onClose(r); }
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    ov.querySelector('[data-modal-close]').onclick = () => close();
    document.addEventListener('keydown', key, true);
    root.appendChild(ov);
    const f = ov.querySelector('.modal-body input:not([type=hidden]),.modal-body select,.modal-body textarea,.modal-foot .btn') || ov.querySelector('.modal'); f.focus();
    return { el: ov.querySelector('.modal'), close };
  }
  const closeModals = () => { document.querySelectorAll('.modal-ov [data-modal-close]').forEach(b => b.click()); };
  function confirmDlg({ title = 'Are you sure?', message = '', confirmText = 'Confirm', danger = false }) {
    return new Promise(res => {
      let result = false;
      const m = modal({ title, body: `<p>${message}</p>`, footer: `<button class="btn btn-secondary" data-c="0">Cancel</button><button class="btn ${danger ? 'btn-danger' : ''}" data-c="1">${esc(confirmText)}</button>`, onClose: () => res(result) });
      m.el.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { result = b.dataset.c === '1'; m.close(); }));
    });
  }
  function ask({ title, message = '', fields = [], confirmText = 'Save', danger = false, wide = false, grid = false }) {
    return new Promise(res => {
      let out = null; const fid = 'ask' + (++mid);
      const m = modal({ title, wide, body: `<form id="${fid}" novalidate>${message ? `<p class="muted">${message}</p>` : ''}<div class="${grid ? 'form-grid' : ''}">${fields.map(field).join('')}</div></form>`, footer: `<button type="button" class="btn btn-secondary" data-c>Cancel</button><button type="submit" form="${fid}" class="btn ${danger ? 'btn-danger' : ''}">${esc(confirmText)}</button>`, onClose: () => res(out) });
      const form = m.el.querySelector('form'); m.el.querySelector('[data-c]').onclick = () => m.close();
      form.addEventListener('submit', e => { e.preventDefault(); if (!validate(form)) return; out = formData(form); m.close(); });
    });
  }

  /* ---- forms ---- */
  let fidc = 0;
  function field(f) {
    const id = 'f' + (++fidc) + '_' + f.name, t = f.type || 'text', req = f.required ? ' required aria-required="true"' : '';
    const opts = (f.options || []).map(o => (typeof o === 'object' ? o : { v: o, l: o }));
    const wrap = inner => `<div class="field ${f.full ? 'full' : ''}" data-field="${esc(f.name)}">${inner}${f.help ? `<small class="help" id="${id}_h">${f.help}</small>` : ''}<small class="err" id="${id}_e" role="alert"></small></div>`;
    const label = `<label for="${id}">${esc(f.label || '')}${f.required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>`;
    const attrs = `${f.attrs || ''}${f.pattern ? ` pattern="${esc(f.pattern)}"` : ''}${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}${f.match ? ` data-match="${esc(f.match)}"` : ''}${f.minlength ? ` minlength="${f.minlength}"` : ''}${f.disabled ? ' disabled' : ''}`;
    const aria = ` aria-describedby="${id}_e${f.help ? ' ' + id + '_h' : ''}"`;
    if (t === 'select') return wrap(`${label}<select id="${id}" name="${f.name}"${req}${attrs}${aria}>${f.placeholder !== undefined ? `<option value="">${esc(f.placeholder || 'Select…')}</option>` : ''}${opts.map(o => `<option value="${esc(o.v)}" ${String(o.v) === String(f.value) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`);
    if (t === 'textarea') return wrap(`${label}<textarea id="${id}" name="${f.name}" rows="${f.rows || 4}" placeholder="${esc(f.placeholder || '')}"${req}${attrs}${aria}>${esc(f.value || '')}</textarea>`);
    if (t === 'checkbox') return wrap(`<label class="check"><input type="checkbox" id="${id}" name="${f.name}" ${f.value ? 'checked' : ''}${req}${aria}><span>${f.html || esc(f.label)}</span></label>`);
    if (t === 'radio') return wrap(`<span class="label" id="${id}_l">${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ''}</span><div class="row" role="radiogroup" aria-labelledby="${id}_l">${opts.map((o, i) => `<label class="check"><input type="radio" name="${f.name}" value="${esc(o.v)}" ${String(o.v) === String(f.value) ? 'checked' : ''} ${f.required ? 'required' : ''}> ${esc(o.l)}</label>`).join('')}</div>`);
    if (t === 'checkboxes') { const v = f.value || []; return wrap(`<span class="label">${esc(f.label)}</span><div class="row">${opts.map(o => `<label class="check"><input type="checkbox" name="${f.name}" value="${esc(o.v)}" ${v.includes(o.v) ? 'checked' : ''}> ${esc(o.l)}</label>`).join('')}</div>`); }
    if (t === 'password') return wrap(`${label}<div class="pw"><input id="${id}" type="password" name="${f.name}" autocomplete="${f.autocomplete || 'current-password'}" placeholder="${esc(f.placeholder || '')}"${req}${attrs}${aria}><button type="button" class="icon-btn" data-action="toggle-pw" aria-label="Show password">${icon('eye')}</button></div>`);
    return wrap(`${label}<input id="${id}" type="${t}" name="${f.name}" value="${esc(f.value == null ? '' : f.value)}" placeholder="${esc(f.placeholder || '')}"${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ''}${req}${attrs}${aria}>`);
  }
  function setError(form, name, msg) {
    const fld = form.querySelector(`[data-field="${name}"]`); if (!fld) return;
    fld.classList.toggle('invalid', !!msg); const e = fld.querySelector('.err'); if (e) e.textContent = msg || '';
    const c = fld.querySelector('input,select,textarea'); if (c) c.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function validate(form) {
    let first = null; const names = new Set(); form.querySelectorAll('[name]').forEach(el => names.add(el.name));
    names.forEach(name => {
      const els = [...form.querySelectorAll(`[name="${name}"]`)]; const el = els[0]; if (!el || el.disabled) return; let msg = '';
      const v = (el.value || '').trim();
      if (el.type === 'radio') { if (el.required && !els.some(e => e.checked)) msg = 'Please select an option'; }
      else if (el.type === 'checkbox') { if (el.required && !el.checked) msg = 'This is required to continue'; }
      else if (el.required && !v) msg = 'This field is required';
      else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Enter a valid email address';
      else if (v && el.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(v)) msg = 'Enter a valid URL starting with http(s)://';
      else if (v && el.type === 'tel' && !/^[+\d][\d\s-]{8,15}$/.test(v)) msg = 'Enter a valid phone number';
      else if (v && el.minLength > 0 && v.length < el.minLength) msg = `Use at least ${el.minLength} characters`;
      else if (v && el.pattern && !new RegExp('^(?:' + el.pattern + ')$').test(v)) msg = el.title || 'Invalid format';
      else if (v && el.type === 'number' && el.min !== '' && Number(v) < Number(el.min)) msg = `Minimum value is ${el.min}`;
      else if (v && el.type === 'number' && el.max !== '' && Number(v) > Number(el.max)) msg = `Maximum value is ${el.max}`;
      else if (el.dataset.match) { const o = form.querySelector(`[name="${el.dataset.match}"]`); if (o && o.value !== el.value) msg = 'Values do not match'; }
      setError(form, name, msg); if (msg && !first) first = el;
    });
    if (first) { first.focus(); return false; }
    return true;
  }
  function formData(form) {
    const o = {};
    form.querySelectorAll('[name]').forEach(el => {
      if (el.disabled) return; const n = el.name; const same = form.querySelectorAll(`[name="${n}"]`);
      if (el.type === 'radio') { if (el.checked) o[n] = el.value; else if (!(n in o)) o[n] = ''; }
      else if (el.type === 'checkbox') { if (same.length > 1) { o[n] = o[n] || []; if (el.checked) o[n].push(el.value); } else o[n] = el.checked; }
      else o[n] = typeof el.value === 'string' ? el.value.trim() : el.value;
    });
    return o;
  }

  /* ---- components ---- */
  function table({ cols, rows, empty = 'No records found.' }) {
    if (!rows.length) return emptyState('list', empty, '');
    return `<div class="table-wrap"><table class="table"><thead><tr>${cols.map(c => `<th scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td data-label="${esc(c.label)}">${c.render(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function pager({ total, page = 1, per = 8, scope }) {
    const pages = Math.ceil(total / per); if (pages <= 1) return '';
    let h = `<nav class="pager" aria-label="Pagination"><button data-action="page" data-scope="${scope}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page">${icon('left', 16)}</button>`;
    for (let i = 1; i <= pages; i++) h += `<button data-action="page" data-scope="${scope}" data-page="${i}" class="${i === page ? 'active' : ''}" ${i === page ? 'aria-current="page"' : ''}>${i}</button>`;
    return h + `<button data-action="page" data-scope="${scope}" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''} aria-label="Next page">${icon('right', 16)}</button></nav>`;
  }
  const paginate = (arr, page, per) => arr.slice((page - 1) * per, page * per);
  function emptyState(ic, title, msg, action = '') { return `<div class="empty">${icon(ic, 34)}<h3>${esc(title)}</h3>${msg ? `<p class="muted">${msg}</p>` : ''}${action}</div>`; }
  function tabs(items, active, scope) {
    return `<div class="tabs" role="tablist">${items.map(t => { const o = typeof t === 'object' ? t : { id: t, label: t }; return `<button class="tab ${o.id === active ? 'active' : ''}" role="tab" aria-selected="${o.id === active}" data-action="tab" data-scope="${scope}" data-tab="${esc(o.id)}">${esc(o.label)}${o.count != null ? `<span class="count">${o.count}</span>` : ''}</button>`; }).join('')}</div>`;
  }
  function menu(items, { label = 'More actions', ic = 'more', align = '' } = {}) {
    return `<div class="dd"><button type="button" class="icon-btn" data-action="dd" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(label)}">${icon(ic)}</button><div class="dd-menu ${align}" role="menu">${items.map(i => i === '-' ? '<div class="dd-sep"></div>' : i.href ? `<a class="dd-item ${i.danger ? 'danger' : ''}" role="menuitem" href="${i.href}">${i.icon ? icon(i.icon, 16) : ''}${esc(i.label)}</a>` : `<button type="button" role="menuitem" class="dd-item ${i.danger ? 'danger' : ''}" data-action="${i.action}" ${Object.entries(i.data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>${i.icon ? icon(i.icon, 16) : ''}${esc(i.label)}</button>`).join('')}</div></div>`;
  }
  const progress = (pct, cls = '') => `<div class="progress ${cls}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100, pct)}%"></span></div>`;
  const kpi = (label, value, sub = '', ic = 'chart', tone = '', href = '') => `<${href ? `a href="#${href}"` : 'div'} class="card kpi" ${href ? 'style="color:inherit;text-decoration:none;display:block"' : ''}><div class="row between nowrap"><span class="label">${esc(label)}</span><span class="ico ${tone}">${icon(ic, 18)}</span></div><div class="value">${value}</div><div class="sub">${sub}</div></${href ? 'a' : 'div'}>`;
  const pageHead = (title, actions = '', sub = '') => `<div class="page-head"><div><h1>${esc(title)}</h1>${sub ? `<p class="muted" style="margin:2px 0 0">${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
  const notice = (msg, type = '') => `<div class="notice ${type}" role="note">${icon(type === 'ok' ? 'checkc' : type === 'err' || type === 'warn' ? 'alert' : 'info', 18)}<div>${msg}</div></div>`;
  const demoNote = msg => notice(msg, '');

  /* filter controls bound to PL.view[scope] */
  function filterCtl(scope, { name, type = 'text', label, options, placeholder }) {
    const v = PL.vf(scope)[name]; const id = `flt-${scope}-${name}`;
    if (type === 'select') return `<div class="field" style="margin:0"><label for="${id}" class="sr">${esc(label)}</label><select id="${id}" name="${name}" data-filter="${scope}" aria-label="${esc(label)}">${options.map(o => { const x = typeof o === 'object' ? o : { v: o, l: o }; return `<option value="${esc(x.v)}" ${String(x.v) === String(v == null ? '' : v) ? 'selected' : ''}>${esc(x.l)}</option>`; }).join('')}</select></div>`;
    return `<div class="field" style="margin:0"><label for="${id}" class="sr">${esc(label)}</label><input id="${id}" type="search" name="${name}" value="${esc(v || '')}" placeholder="${esc(placeholder || label)}" data-filter="${scope}" autocomplete="off"></div>`;
  }

  /* ---- charts ---- */
  const niceMax = m => { if (m <= 5) return 5; const p = Math.pow(10, Math.floor(Math.log10(m))), n = m / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  function barChart({ labels, series, height = 210, fmtv = v => v }) {
    const W = 600, H = height, l = 44, b = 26, t = 10, r = 8, max = niceMax(Math.max(1, ...series.flatMap(s => s.values)));
    const iw = W - l - r, ih = H - t - b, gw = iw / labels.length, bw = Math.min(30, (gw * .72) / series.length);
    let g = ''; for (let i = 0; i <= 4; i++) { const y = t + ih - (ih * i) / 4; g += `<line x1="${l}" x2="${W - r}" y1="${y}" y2="${y}" stroke="#EAECF0"/><text x="${l - 6}" y="${y + 3}" text-anchor="end">${fmtv(Math.round((max * i) / 4))}</text>`; }
    let bars = ''; series.forEach((s, si) => s.values.forEach((v, i) => { const h = (ih * v) / max, x = l + gw * i + (gw - bw * series.length) / 2 + bw * si; bars += `<rect x="${x}" y="${t + ih - h}" width="${bw - 2}" height="${h}" rx="3" fill="${s.color}"><title>${esc(s.name)} – ${esc(labels[i])}: ${fmtv(v)}</title></rect>`; }));
    const lb = labels.map((x, i) => `<text x="${l + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle">${esc(x)}</text>`).join('');
    const legend = series.length > 1 ? `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart">${g}${bars}${lb}</svg>${legend}`;
  }
  function lineChart({ labels, values, color = '#155EEF', height = 210, name = 'Value' }) {
    const W = 600, H = height, l = 44, b = 26, t = 10, r = 12, max = niceMax(Math.max(1, ...values)), iw = W - l - r, ih = H - t - b, n = values.length;
    const x = i => l + (n === 1 ? iw / 2 : (iw * i) / (n - 1)), y = v => t + ih - (ih * v) / max;
    let g = ''; for (let i = 0; i <= 4; i++) { const yy = t + ih - (ih * i) / 4; g += `<line x1="${l}" x2="${W - r}" y1="${yy}" y2="${yy}" stroke="#EAECF0"/><text x="${l - 6}" y="${yy + 3}" text-anchor="end">${Math.round((max * i) / 4)}</text>`; }
    const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const dots = values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"><title>${esc(name)} – ${esc(labels[i])}: ${v}</title></circle>`).join('');
    const lb = labels.map((s, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(s)}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart">${g}<polygon points="${l},${t + ih} ${pts} ${x(n - 1)},${t + ih}" fill="${color}" fill-opacity=".08"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5"/>${dots}${lb}</svg>`;
  }
  function donut(items, size = 150) {
    const tot = items.reduce((a, i) => a + i.value, 0) || 1, R = 40, C = 2 * Math.PI * R; let off = 0;
    const segs = items.filter(i => i.value > 0).map(i => { const len = (i.value / tot) * C; const s = `<circle cx="50" cy="50" r="${R}" fill="none" stroke="${i.color}" stroke-width="16" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 50 50)"><title>${esc(i.label)}: ${i.value}</title></circle>`; off += len; return s; }).join('');
    return `<div class="row nowrap" style="align-items:center"><svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Donut chart"><circle cx="50" cy="50" r="${R}" fill="none" stroke="#F2F4F7" stroke-width="16"/>${segs}<text x="50" y="54" text-anchor="middle" style="font-size:14px;font-weight:700;fill:#101828">${tot}</text></svg><div class="legend" style="flex-direction:column;gap:6px">${items.map(i => `<span><i style="background:${i.color}"></i>${esc(i.label)}: <b>${i.value}</b></span>`).join('')}</div></div>`;
  }

  /* ---- misc helpers ---- */
  function pickImage(cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; if (f.size > 250 * 1024) { toast('Demo limit: choose an image under 250 KB (stored locally in your browser).', 'err'); return; } const r = new FileReader(); r.onload = () => cb(r.result, f); r.readAsDataURL(f); };
    inp.click();
  }
  function pickFile(accept, cb) { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.onchange = () => { if (inp.files[0]) cb(inp.files[0]); }; inp.click(); }
  function copy(text) { const done = () => toast('Link copied to clipboard'); if (navigator.clipboard && window.isSecureContext !== false) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); function fallback() { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove(); done(); } }
  const url = path => location.href.split('#')[0] + '#' + path;
  const hashtags = s => String(s || '').split(/[\s,]+/).map(x => x.replace(/^#/, '').replace(/[^\w]/g, '')).filter(Boolean);
  const split = s => String(s || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const csv = (name, rows) => { const e = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; const blob = new Blob([rows.map(r => r.map(e).join(',')).join('\r\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };

  /* ---- multi-step form: grouped fieldsets + progress bar ---- */
  function stepForm({ attrs = '', steps, submit = 'Submit', before = '', extra = '', free = false }) {
    const n = steps.length;
    return `<form ${attrs} novalidate data-steps="${n}" ${free ? 'data-free="1"' : ''}>${before}<div class="stepper" aria-label="Form progress"><div class="stepper-meta"><span class="stepper-label">Step 1 of ${n}: ${esc(steps[0].title)}</span><span class="stepper-pct">0% complete</span></div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span style="width:0%"></span></div><ol class="step-bar stepper-list">${steps.map((s, i) => `<li><button type="button" class="step ${i === 0 ? 'active' : ''}" data-action="step-goto" data-i="${i}" ${i === 0 ? 'aria-current="step"' : ''}>${i + 1}. ${esc(s.title)}</button></li>`).join('')}</ol></div>${steps.map((s, i) => `<fieldset class="fstep ${i === 0 ? 'on' : ''}" data-title="${esc(s.title)}"><legend class="sr">${esc(s.title)}</legend>${s.intro ? `<p class="muted">${s.intro}</p>` : ''}<div class="form-grid">${s.html}</div></fieldset>`).join('')}<div class="row between mt"><button type="button" class="btn btn-secondary" data-action="step-back" style="visibility:hidden">Back</button><div class="row">${extra}<button class="btn" type="submit" value="submit" data-next="Continue" data-last="${esc(submit)}">${free ? esc(submit) : 'Continue'}</button></div></div></form>`;
  }
  function stepShow(form, i) {
    const fs = [...form.querySelectorAll('.fstep')], n = fs.length; i = Math.max(0, Math.min(n - 1, i));
    fs.forEach((f, k) => f.classList.toggle('on', k === i)); form.dataset.cur = i;
    form.querySelectorAll('.stepper-list .step').forEach((b, k) => { b.classList.toggle('active', k === i); b.classList.toggle('done', k < i && stepComplete(fs[k])); b.removeAttribute('aria-current'); if (k === i) b.setAttribute('aria-current', 'step'); });
    const lab = form.querySelector('.stepper-label'); if (lab) lab.textContent = `Step ${i + 1} of ${n}: ${fs[i].dataset.title}`;
    const back = form.querySelector('[data-action="step-back"]'); if (back) back.style.visibility = i ? 'visible' : 'hidden';
    const nx = form.querySelector('[type=submit]'); if (nx) nx.textContent = (i === n - 1 || form.dataset.free) ? nx.dataset.last : nx.dataset.next;
    stepProgress(form);
    form.dispatchEvent(new CustomEvent('stepchange', { bubbles: true, detail: i }));
  }
  function stepComplete(fs) {
    const req = [...fs.querySelectorAll('[required]')], seen = new Set();
    return req.every(el => { if (el.type === 'radio') { if (seen.has(el.name)) return true; seen.add(el.name); return [...fs.querySelectorAll(`[name="${el.name}"]`)].some(r => r.checked); } return el.type === 'checkbox' ? el.checked : (el.value || '').trim() !== ''; });
  }
  function stepProgress(form) {
    const fs = [...form.querySelectorAll('.fstep')]; let tot = 0, ok = 0; const seen = new Set();
    fs.forEach(f => f.querySelectorAll('[required]').forEach(el => { const k = el.type === 'radio' ? el.name : el; if (seen.has(k)) return; seen.add(k); tot++; if (el.type === 'radio' ? [...f.querySelectorAll(`[name="${el.name}"]`)].some(r => r.checked) : el.type === 'checkbox' ? el.checked : (el.value || '').trim() !== '') ok++; }));
    const pct = tot ? Math.round((ok / tot) * 100) : 0, bar = form.querySelector('.stepper .progress');
    if (bar) { bar.firstElementChild.style.width = pct + '%'; bar.setAttribute('aria-valuenow', pct); }
    const p = form.querySelector('.stepper-pct'); if (p) p.textContent = pct + '% complete';
    const cur = +form.dataset.cur || 0;
    form.querySelectorAll('.stepper-list .step').forEach((b, k) => { if (k !== cur) b.classList.toggle('done', stepComplete(fs[k])); });
  }
  PL.ui = { stepShow, stepForm, esc, icon, avatar, logo, art, fmt, badge, sponsoredLabel, toast, modal, closeModals, confirm: confirmDlg, ask, field, setError, validate, formData, table, pager, paginate, empty: emptyState, tabs, menu, progress, kpi, pageHead, notice, demoNote, filterCtl, barChart, lineChart, donut, pickImage, pickFile, copy, url, hashtags, split, csv };
  PL.esc = esc;

  /* ---- global event delegation ---- */
  let deb;
  PL.initEvents = function () {
    document.addEventListener('click', async e => {
      const dd = e.target.closest('[data-action="dd"]');
      document.querySelectorAll('.dd.open').forEach(d => { if (!dd || !d.contains(dd)) { d.classList.remove('open'); const b = d.querySelector('[data-action="dd"]'); if (b) b.setAttribute('aria-expanded', 'false'); } });
      if (dd) { const w = dd.closest('.dd'); const o = w.classList.toggle('open'); dd.setAttribute('aria-expanded', o); return; }
      const el = e.target.closest('[data-action]'); if (!el || el.disabled) return;
      const name = el.dataset.action;
      if (name === 'toggle-pw') { const inp = el.parentElement.querySelector('input'); const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); el.innerHTML = icon(show ? 'eyeoff' : 'eye'); return; }
      if (name === 'tab') { PL.vf(el.dataset.scope).tab = el.dataset.tab; PL.vf(el.dataset.scope).page = 1; PL.rerender(); return; }
      if (name === 'page') { PL.vf(el.dataset.scope).page = parseInt(el.dataset.page, 10); PL.rerender(); window.scrollTo({ top: 0 }); return; }
      if (name === 'step-back' || name === 'step-goto') { const f = el.closest('form'), cur = +f.dataset.cur || 0, to = name === 'step-back' ? cur - 1 : +el.dataset.i; if (to < cur || f.dataset.free) stepShow(f, to); return; }
      const fn = PL.actions[name]; if (!fn) { console.warn('No action', name); return; }
      if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
      try { await fn(el.dataset, el, e); } catch (err) { console.error(err); toast('Something went wrong: ' + err.message, 'err'); }
    });
    document.addEventListener('submit', async e => {
      const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
      const fn = PL.forms[f.dataset.form]; if (!fn) return;
      if (f.dataset.steps) {
        const fs = [...f.querySelectorAll('.fstep')], cur = +f.dataset.cur || 0;
        if (!f.dataset.free && !(e.submitter && e.submitter.dataset.all) && cur < fs.length - 1) { if (validate(fs[cur])) { stepShow(f, cur + 1); window.scrollTo({ top: 0 }); const nf = fs[cur + 1].querySelector('input,select,textarea'); if (nf) nf.focus(); } return; }
        for (let k = 0; k < fs.length; k++) if (!validate(fs[k])) { stepShow(f, k); return; }
      }
      try { await fn(f, e); } catch (err) { console.error(err); toast('Something went wrong: ' + err.message, 'err'); }
    });
    const onFilter = (e, isInput) => {
      const el = e.target; if (!el.dataset || !el.dataset.filter) return;
      const text = el.type === 'search' || el.type === 'text'; if (isInput !== text) return;
      const apply = () => { const v = PL.vf(el.dataset.filter); v[el.name] = el.type === 'checkbox' ? el.checked : el.value; v.page = 1; PL.rerender({ focusId: el.id }); };
      clearTimeout(deb); if (isInput) deb = setTimeout(apply, 160); else apply();
    };
    const sp = e => { const f = e.target.closest && e.target.closest('form[data-steps]'); if (f) stepProgress(f); };
    document.addEventListener('input', sp); document.addEventListener('change', sp);
    document.addEventListener('input', e => { onFilter(e, true); const f = e.target.closest('[data-live]'); if (f && PL.live[f.dataset.live]) PL.live[f.dataset.live](f); });
    document.addEventListener('change', e => { onFilter(e, false); const f = e.target.closest('[data-live]'); if (f && PL.live[f.dataset.live]) PL.live[f.dataset.live](f); });
    PL.live = PL.live || {};
  };
})();
