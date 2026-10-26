/* Messaging + notifications */
(function () {
  const PL = (window.PL = window.PL || {});
  let W;
  const ui = () => W || (W = Object.assign({}, PL.ui, {
    paginate: (arr, page, per) => { const pages = Math.max(1, Math.ceil(arr.length / per)), p = Math.min(Math.max(1, page || 1), pages); return { items: arr.slice((p - 1) * per, p * per), page: p }; }
  }));
  const db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt, me = () => PL.auth.user();

  function convs(uid) {
    const map = {};
    db().messages.filter(m => m.senderId === uid || m.recipientId === uid).forEach(m => { (map[m.conversationId] = map[m.conversationId] || []).push(m); });
    return Object.entries(map).map(([id, ms]) => {
      ms.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const last = ms[ms.length - 1], other = PL.q.user(last.senderId === uid ? last.recipientId : last.senderId);
      return { id, ms, last, other, unread: ms.filter(m => m.recipientId === uid && !m.read).length };
    }).filter(c => c.other).sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
  }
  const canMsg = (u, o) => o && o.id !== u.id && o.status === 'Active' && (u.role === 'recruiter' || o.role === 'recruiter' || PL.q.connStatus(u.id, o.id) === 'connected');

  function messagesPage(base) {
    return (ctx, u) => {
      const v = PL.vf('msg', { q: '' }), list = convs(u.id);
      let cid = ctx.query.c, other = null;
      if (ctx.query.u) { const o = PL.q.user(ctx.query.u); if (o && canMsg(u, o)) { cid = PL.convId(u.id, o.id); other = o; } }
      if (!cid && list.length && window.innerWidth > 860) cid = list[0].id;
      const cur = list.find(c => c.id === cid); if (cur) other = cur.other;
      if (cur && cur.unread) { cur.ms.forEach(m => { if (m.recipientId === u.id) m.read = true; }); PL.store.save(); }
      const shown = list.filter(c => !v.q || c.other.name.toLowerCase().includes(v.q.toLowerCase()));
      const lst = `<div class="msg-list"><div class="pad"><label class="sr" for="msg-q">Search conversations</label><input id="msg-q" placeholder="Search conversations" value="${E(v.q)}" data-filter="msg" name="q"></div>${shown.map(c => `<a class="conv ${c.id === cid ? 'active' : ''}" href="#${base}/messages?c=${c.id}" style="text-decoration:none;color:inherit">${ui().avatar(c.other, 40)}<div class="grow" style="min-width:0"><div class="row between nowrap"><b class="small">${E(c.other.name)}</b><span class="xs muted">${F().ago(c.last.createdAt)}</span></div><div class="xs muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.last.senderId === u.id ? 'You: ' : ''}${E(c.last.content)}</div></div>${c.unread ? `<span class="count">${c.unread}</span>` : ''}</a>`).join('') || '<p class="muted small pad">No conversations yet.</p>'}</div>`;
      let thread;
      if (other) {
        const ms = cur ? cur.ms : [];
        thread = `<div class="thread"><div class="row nowrap pad" style="border-bottom:1px solid var(--border)">${ui().avatar(other, 38)}<div class="grow"><a class="bold" href="#/app/profile/${other.id}">${E(other.name)}</a><div class="xs muted">${E((other.profile && other.profile.headline) || PL.auth.roleLabel(other.role))}</div></div><div>${ui().menu([{ label: 'Report conversation', action: 'report', icon: 'flag', data: { type: 'message', id: cid } }], { label: 'Conversation options', align: 'right' })}</div></div>
          <div class="thread-body" id="thread-body" tabindex="0" aria-label="Messages">${ms.map(m => `<div class="bubble-msg ${m.senderId === u.id ? 'me' : ''}">${E(m.content)}<time>${F().ago(m.createdAt)}</time></div>`).join('') || '<p class="muted small">Start the conversation.</p>'}</div>
          <form class="row nowrap pad" style="border-top:1px solid var(--border)" data-form="send-msg" data-to="${other.id}" novalidate><label class="sr" for="msg-text">Message</label><input id="msg-text" name="text" class="grow" placeholder="Write a message…" maxlength="1000" autocomplete="off" required><button class="btn" type="submit">${I('send', 16)} Send</button></form></div>`;
      } else thread = `<div class="thread">${ui().empty('message', 'Select a conversation', 'Choose a conversation or start one from a profile.')}</div>`;
      return { html: `${ui().pageHead('Messages')}<div class="card msg-layout">${lst}${thread}</div>`, after: () => { const b = document.getElementById('thread-body'); if (b) b.scrollTop = b.scrollHeight; } };
    };
  }
  PL.form('send-msg', f => {
    const u = me(), o = PL.q.user(f.dataset.to), t = f.text.value.trim();
    if (!t) { f.text.focus(); return; }
    if (!canMsg(u, o)) return ui().toast('You can only message connections or recruiters.', 'err');
    const cid = PL.convId(u.id, o.id);
    db().messages.push({ id: PL.store.id('m'), conversationId: cid, senderId: u.id, recipientId: o.id, content: t, createdAt: F().iso(), read: false });
    PL.notify(o.id, 'message', 'New message from ' + u.name, t.slice(0, 80), PL.msgPath(u.id).split('?')[0] + '?c=' + cid);
    PL.store.save();
    if (location.hash.includes('u=')) PL.go((u.role === 'recruiter' ? '/employer' : '/app') + '/messages?c=' + cid); else PL.rerender({ focusId: 'msg-text' });
  });
  PL.router.add('/app/messages', messagesPage('/app'), { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Messages' });
  PL.router.add('/employer/messages', messagesPage('/employer'), { layout: 'employer', roles: ['recruiter'], title: 'Messages' });

  const ICONS = { message: 'message', application: 'file', job: 'briefcase', connection: 'userplus', like: 'like', comment: 'message', ad: 'megaphone', moderation: 'flag', system: 'bell' };
  function notifPage(layout) {
    return (ctx, u) => {
      const v = PL.vf('notif',       { tab: 'All' });
      let list = db().notifications.filter(n => n.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const unread = list.filter(n => !n.read).length;
            if (v.tab === 'Unread') list = list.filter(n => !n.read);
      const pg = ui().paginate(list, v.page || 1, 15);
      return `${ui().pageHead('Notifications', unread ? `<button class="btn btn-secondary btn-sm" data-action="notif-all">Mark all as read</button>` : '', unread + ' unread')}${ui().tabs(['All', 'Unread'], v.tab, 'notif')}
        <div class="card" style="overflow:hidden">${pg.items.map(n => `<button class="notif ${n.read ? '' : 'unread'}" data-action="notif-open" data-id="${n.id}"><span class="ico">${I(ICONS[n.type] || 'bell', 18)}</span><span class="grow"><b class="small">${E(n.title)}</b><br><span class="small muted">${E(n.message)}</span><br><span class="xs muted">${F().ago(n.createdAt)}</span></span>${n.read ? '' : '<span class="badge b-blue">New</span>'}</button>`).join('') || ui().empty('bell', 'No notifications', 'You are all caught up.')}</div>${ui().pager({ total: list.length, page: pg.page, per: 15, scope: 'notif' })}`;
    };
  }
  PL.act('notif-all', () => { db().notifications.forEach(n => { if (n.userId === me().id) n.read = true; }); PL.store.save(); PL.rerender(); });
  PL.act('notif-open', d => { const n = db().notifications.find(x => x.id === d.id); if (!n) return; n.read = true; PL.store.save(); if (n.link) PL.go(n.link); else PL.rerender(); });
  PL.router.add('/app/notifications', notifPage(), { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Notifications' });
  PL.router.add('/employer/notifications', notifPage(), { layout: 'employer', roles: ['recruiter'], title: 'Notifications' });
  PL.router.add('/advertiser/notifications', notifPage(), { layout: 'advertiser', roles: ['advertiser'], title: 'Notifications' });
  PL.router.add('/admin/notifications', notifPage(), { layout: 'admin', roles: ['admin'], title: 'Notifications' });
})();
