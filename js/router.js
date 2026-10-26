/* Lightweight hash router: #/path?query. Works from file:// and Live Server. */
(function () {
  const PL = (window.PL = window.PL || {});
  const routes = [];
  PL.state = PL.state || {};
  PL.router = {
    add(pattern, handler, meta = {}) {
      const keys = [];
      const re = new RegExp('^' + pattern.replace(/:[^/]+/g, m => { keys.push(m.slice(1)); return '([^/]+)'; }) + '/?$');
      routes.push({ pattern, re, keys, handler, meta });
    },
    addMany(patterns, handler, meta) { patterns.forEach(p => this.add(p, handler, meta)); },
    parse() {
      let h = location.hash.slice(1) || '/'; if (h[0] !== '/') h = '/' + h;
      const [path, qs] = h.split('?'); const query = {}; new URLSearchParams(qs || '').forEach((v, k) => (query[k] = v));
      return { path, query };
    },
    match(path) {
      for (const r of routes) { const m = r.re.exec(path); if (m) { const params = {}; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); return { r, params }; } }
      return null;
    },
    resolve(opts = {}) {
      const { path, query } = this.parse(); const m = this.match(path);
      const fresh = !opts.rerender;
      const ctx = { path, query, params: m ? m.params : {}, fresh, meta: m ? m.r.meta : {} };
      PL.ctx = ctx;
      const user = PL.auth.user();
      if (!PL.isAllowed(path)) { PL.go('/'); return; }
      if (fresh) PL.ui.closeModals();
      let meta = ctx.meta, html;
      if (!m) { meta = { layout: 'public', title: 'Page not found' }; html = PL.ui.empty('search', 'Page not found', 'The page <b>' + PL.esc(path) + '</b> does not exist in this prototype.', '<a class="btn" href="#/">Back to home</a>'); html = `<div class="container section">${html}</div>`; }
      else {
        if (meta.guestOnly && user) { PL.go(PL.auth.homeFor(user)); return; }
        if (meta.roles) {
          if (!user) { PL.auth.requireLogin(path + (location.hash.includes('?') ? '?' + location.hash.split('?')[1] : '')); return; }
          if (!meta.roles.includes(user.role)) { PL.ui.toast('That area is not available for a ' + PL.auth.roleLabel(user.role) + ' account.', 'err'); PL.go(PL.auth.homeFor(user)); return; }
        }
        try { html = m.r.handler(ctx, user); } catch (e) { console.error('Route error', path, e); html = `<div class="container section">${PL.ui.empty('alert', 'Something went wrong', PL.esc(e.message), '<a class="btn" href="#/">Back to home</a>')}</div>`; }
      }
      let after = null; if (html && typeof html === 'object') { after = html.after; html = html.html; }
      const active = opts.rerender && document.activeElement ? { id: document.activeElement.id, s: document.activeElement.selectionStart, e: document.activeElement.selectionEnd } : null;
      const y = window.scrollY;
      PL.layout.render(meta, ctx, html, user);
      document.title = (meta.title ? meta.title + ' · ' : '') + 'PharmaLinkIn (demo)';
      if (after) after(ctx);
      if (fresh) { window.scrollTo(0, 0); const mn = document.getElementById('main'); if (mn) mn.focus({ preventScroll: true }); }
      else { window.scrollTo(0, y); const fid = opts.focusId || (active && active.id); if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); if (active && active.s != null && el.setSelectionRange && /text|search/.test(el.type)) try { el.setSelectionRange(active.s, active.e); } catch (e) { } } } }
    },
    start() {
      let navigationTimer;
      const onNavigation = () => {
        window.clearTimeout(navigationTimer);
        navigationTimer = window.setTimeout(() => this.resolve(), 0);
      };
      window.addEventListener('hashchange', event => {
        const previousHash = new URL(event.oldURL).hash.slice(1);
        const previousPath = (previousHash || '/').split('?')[0];
        PL.state.mobilePreviousPath = previousPath[0] === '/' ? previousPath : '/' + previousPath;
        onNavigation();
      });
      window.addEventListener('popstate', onNavigation);
      this.resolve();
    }
  };
  PL.go = p => { if (location.hash === '#' + p) PL.router.resolve(); else location.hash = '#' + p; };
  PL.rerender = o => PL.router.resolve(Object.assign({ rerender: true }, o));
})();
