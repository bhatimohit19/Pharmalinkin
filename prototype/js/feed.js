/* Social feed: composer, posts, comments, ads insertion, follow suggestions */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, db = () => PL.store.s, I = (n, s) => PL.ui.icon(n, s), E = s => PL.esc(s), F = () => PL.ui.fmt;
  const me = () => PL.auth.user();
  PL.state.openComments = PL.state.openComments || {};
  PL.state.draft = PL.state.draft || { content: '', topic: '', tags: '', visibility: 'Public', image: '' };
  const TOPICS = ['Achievement', 'Career advice', 'Hiring drive', 'Research', 'Company update', 'Conference update', 'Question'];

  const hid = () => (db().hiddenPosts = db().hiddenPosts || {});
  function visible(p, u) {
    if (p.removed || (hid()[u.id] || []).includes(p.id)) return false;
    const a = PL.q.user(p.authorId); if (!a || a.status !== 'Active') return false;
    if (p.visibility === 'Connections' && p.authorId !== u.id && PL.q.connStatus(u.id, p.authorId) !== 'connected') return false;
    return true;
  }
  const linkify = t => E(t).replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');

  function postCard(p, u) {
    const a = PL.q.user(p.authorId), co = PL.q.companyOf(a), liked = p.likes.includes(u.id), saved = (db().savedPosts[u.id] || []).includes(p.id);
    const open = PL.state.openComments[p.id], own = p.authorId === u.id;
    let embed = '';
    if (p.type === 'job') { const j = PL.q.job(p.jobId); if (j) embed = `<div class="mb">${PL.cmp.jobCard(j, { base: '/app' })}</div>`; }
    if (p.type === 'news') { const n = PL.q.news(p.newsId); if (n) embed = `<a class="card pad row nowrap" style="color:inherit;text-decoration:none" href="#/news/${n.id}"><img alt="" src="${ui().art(n.id, n.category, 160, 100)}" style="width:80px;border-radius:8px"><div><div class="xs muted">${E(n.category)}</div><div class="bold">${E(n.title)}</div></div></a>`; }
    const items = [{ label: saved ? 'Unsave post' : 'Save post', action: 'post-save', icon: 'bookmark', data: { id: p.id } }];
    if (own || u.role === 'admin') items.push({ label: 'Delete post', action: 'post-delete', icon: 'trash', danger: true, data: { id: p.id } });
    if (!own) items.push({ label: 'Hide post', action: 'post-hide', icon: 'eyeoff', data: { id: p.id } }, { label: 'Report post', action: 'report', icon: 'flag', data: { type: 'post', id: p.id } });
    return `<article class="card post" id="post-${p.id}"><div class="post-head">${ui().avatar(a, 46)}<div class="grow"><a class="bold" href="#/app/profile/${a.id}">${E(a.name)}</a> ${a.role === 'recruiter' ? '<span class="badge b-blue">Recruiter</span>' : ''}<div class="xs muted">${E((a.profile && a.profile.headline) || '')}${co ? ' · ' + E(co.name) : ''}</div><div class="xs muted">${F().ago(p.createdAt)} · ${E(p.visibility)}${p.topic ? ' · ' + E(p.topic) : ''}</div></div>${ui().menu(items, { label: 'Post options', align: 'right' })}</div>
      <div class="post-body">${linkify(p.content)}</div>${embed}${p.image || p.imageSeed ? `<img class="post-img" alt="Post image" src="${p.image || ui().art(p.imageSeed, p.topic || 'PharmaLinkIn', 800, 400)}">` : ''}
      <div class="post-stats"><span>${p.likes.length} like${p.likes.length === 1 ? '' : 's'}</span><button class="link-btn" data-action="post-comments" data-id="${p.id}" style="color:var(--muted)">${p.comments.length} comment${p.comments.length === 1 ? '' : 's'}</button></div>
      <div class="post-actions"><button class="${liked ? 'on' : ''}" data-action="post-like" data-id="${p.id}" aria-pressed="${liked}">${I('like', 18)} Like</button><button data-action="post-comments" data-id="${p.id}" aria-expanded="${!!open}">${I('message', 18)} Comment</button><button data-action="share" data-path="/app/feed">${I('share', 18)} Share</button><button class="${saved ? 'on' : ''}" data-action="post-save" data-id="${p.id}" aria-pressed="${saved}">${I('bookmark', 18)} Save</button></div>
      ${open ? `<div class="mt-s">${p.comments.map(c => { const cu = PL.q.user(c.userId) || { name: 'Former member' }; return `<div class="comment">${ui().avatar(cu, 32)}<div class="bubble"><div class="row between nowrap"><b>${E(cu.name)}</b><span class="xs muted">${F().ago(c.createdAt)}</span></div>${E(c.text)}<div class="xs mt-s">${c.userId === u.id || u.role === 'admin' ? `<button class="link-btn" data-action="comment-del" data-id="${p.id}" data-cid="${c.id}">Delete</button>` : `<button class="link-btn" data-action="report" data-type="comment" data-id="${p.id}:${c.id}">Report</button>`}</div></div></div>`; }).join('')}
        <form class="comment" data-form="comment" data-id="${p.id}" novalidate>${ui().avatar(u, 32)}<div class="grow row nowrap"><label class="sr" for="cm-${p.id}">Add a comment</label><input id="cm-${p.id}" name="text" placeholder="Add a comment…" maxlength="500" autocomplete="off" required><button class="btn btn-sm" type="submit">Post</button></div></form></div>` : ''}</article>`;
  }

  function composer(u) {
    const d = PL.state.draft;
    return `<form class="card pad-lg" data-form="compose" novalidate aria-label="Create a post"><div class="row nowrap start">${ui().avatar(u, 46)}<div class="grow"><label class="sr" for="cp-text">Share an update</label><textarea id="cp-text" name="content" rows="3" maxlength="1500" placeholder="Share an update, insight or opportunity with the pharma community…" data-live="compose-draft" required>${E(d.content)}</textarea><small class="err" id="cp-err" role="alert"></small>
      <div class="grid g3 mt-s" style="gap:8px"><div class="field" style="margin:0"><label class="sr" for="cp-topic">Topic</label><select id="cp-topic" name="topic" data-live="compose-draft"><option value="">Topic (optional)</option>${TOPICS.map(t => `<option ${d.topic === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div class="field" style="margin:0"><label class="sr" for="cp-tags">Hashtags</label><input id="cp-tags" name="tags" placeholder="#Hashtags, comma separated" value="${E(d.tags)}" data-live="compose-draft"></div><div class="field" style="margin:0"><label class="sr" for="cp-vis">Visibility</label><select id="cp-vis" name="visibility" data-live="compose-draft"><option ${d.visibility === 'Public' ? 'selected' : ''}>Public</option><option ${d.visibility === 'Connections' ? 'selected' : ''}>Connections</option></select></div></div>
      <div class="row between mt-s"><div class="row"><button type="button" class="btn btn-ghost btn-sm" data-action="compose-image">${I('image', 16)} Photo</button><span class="xs muted" id="cp-img">${d.image ? 'Image attached' : ''}</span></div><div class="row"><span class="xs muted" id="cp-count">${d.content.length}/1500</span><button class="btn btn-sm" type="submit">Post</button></div></div></div></div></form>`;
  }
  PL.live['compose-draft'] = () => {
    const f = document.querySelector('form[data-form="compose"]'); if (!f) return; const d = PL.state.draft;
    d.content = f.content.value; d.topic = f.topic.value; d.tags = f.tags.value; d.visibility = f.visibility.value;
    const c = document.getElementById('cp-count'); if (c) c.textContent = d.content.length + '/1500';
  };
  PL.act('compose-image', () => ui().pickImage(data => { PL.state.draft.image = data; document.getElementById('cp-img').textContent = 'Image attached'; }));
  PL.form('compose', f => {
    const u = me(), d = PL.state.draft; PL.live['compose-draft']();
    if (!d.content.trim()) { document.getElementById('cp-err').textContent = 'Write something before posting'; f.content.focus(); return; }
    db().posts.unshift({ id: PL.store.id('p'), authorId: u.id, topic: d.topic, content: d.content.trim(), image: d.image, imageSeed: '', hashtags: ui().hashtags(d.tags), likes: [], comments: [], createdAt: F().iso(), visibility: d.visibility, type: 'organic', removed: false });
    PL.state.draft = { content: '', topic: '', tags: '', visibility: 'Public', image: '' }; PL.store.save(); ui().toast('Post published'); PL.rerender();
  });

  PL.act('post-like', d => { const p = PL.q.post(d.id), u = me(), i = p.likes.indexOf(u.id); if (i >= 0) p.likes.splice(i, 1); else { p.likes.push(u.id); if (p.authorId !== u.id) PL.notify(p.authorId, 'like', 'New like', u.name + ' liked your post.', '/app/feed'); } PL.store.save(); PL.rerender(); });
  PL.act('post-save', d => { const u = me(), l = (db().savedPosts[u.id] = db().savedPosts[u.id] || []), i = l.indexOf(d.id); if (i >= 0) l.splice(i, 1); else l.push(d.id); PL.store.save(); ui().toast(i >= 0 ? 'Removed from saved' : 'Post saved'); PL.rerender(); });
  PL.act('post-comments', d => { PL.state.openComments[d.id] = !PL.state.openComments[d.id]; PL.rerender(); if (PL.state.openComments[d.id]) { const el = document.getElementById('cm-' + d.id); if (el) el.focus(); } });
  PL.form('comment', f => {
    const t = f.text.value.trim(); if (!t) { f.text.focus(); return; }
    const p = PL.q.post(f.dataset.id), u = me(); p.comments.push({ id: PL.store.id('cm'), userId: u.id, text: t, createdAt: F().iso() });
    if (p.authorId !== u.id) PL.notify(p.authorId, 'comment', 'New comment', u.name + ' commented on your post.', '/app/feed');
    PL.store.save(); PL.rerender({ focusId: 'cm-' + p.id });
  });
  PL.act('comment-del', d => { const p = PL.q.post(d.id); p.comments.splice(p.comments.findIndex(c => c.id === d.cid), 1); PL.store.save(); PL.rerender(); });
  PL.act('post-delete', async d => { if (!(await ui().confirm({ title: 'Delete this post?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true }))) return; const p = PL.q.post(d.id); p.removed = true; if (me().role === 'admin') PL.audit('Removed post', 'post', p.id); PL.store.save(); ui().toast('Post deleted'); PL.rerender(); });
  PL.act('post-hide', d => { (hid()[me().id] = hid()[me().id] || []).push(d.id); PL.store.save(); ui().toast('Post hidden'); PL.rerender(); });

  function leftRail(u) {
    const p = u.profile || {}, co = PL.q.companyOf(u), conns = db().connections.filter(c => c.status === 'accepted' && (c.requesterId === u.id || c.recipientId === u.id)).length;
    return `<aside class="stack"><div class="card profile-mini" style="overflow:hidden;padding-bottom:14px"><div class="cover" style="background:url('${ui().art(u.id + 'c', '', 400, 80)}') center/cover"></div>${ui().avatar(u, 56)}<div style="padding:8px 16px 0"><a class="bold" href="#/app/profile">${E(u.name)}</a><div class="small muted">${E(p.headline || PL.auth.roleLabel(u.role))}</div>${co ? `<div class="xs muted">${E(co.name)}</div>` : ''}</div><div class="row between small" style="padding:10px 16px 0"><span class="muted">Connections</span><a href="#/app/network" class="bold">${conns}</a></div></div>
      <div class="card pad stack-sm">${u.role === 'candidate' ? `<a class="side-link" href="#/app/dashboard">${I('dash', 16)} Dashboard</a><a class="side-link" href="#/app/saved-jobs">${I('bookmark', 16)} Saved</a><a class="side-link" href="#/app/applications">${I('file', 16)} Applications</a>` : `<a class="side-link" href="#/employer/dashboard">${I('dash', 16)} Employer dashboard</a><a class="side-link" href="#/employer/jobs/new">${I('plus', 16)} Post a job</a>`}</div></aside>`;
  }
  function rightRail(u) {
    const f = PL.q.follows(u.id), pending = db().connections.filter(c => c.recipientId === u.id && c.status === 'pending').length;
    const sug = db().users.filter(x => x.role === 'candidate' && x.id !== u.id && x.status === 'Active' && !f.users.includes(x.id) && PL.q.connStatus(u.id, x.id) === 'none' && !(x.profile && x.profile.privacy && x.profile.privacy.visibility === 'Private')).slice(0, 3);
    const jobs = PL.q.publicJobs().filter(j => j.featured).slice(0, 3), tags = {};
    db().posts.filter(p => !p.removed).forEach(p => p.hashtags.forEach(t => (tags[t] = (tags[t] || 0) + 1)));
    const top = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `<aside class="stack">${PL.ads ? PL.ads.slot('Sidebar') : ''}${pending ? `<div class="card pad"><a href="#/app/network">${I('userplus', 16)} ${pending} pending connection request${pending > 1 ? 's' : ''}</a></div>` : ''}
      <div class="card pad"><h3>People you may know</h3>${sug.map(p => `<div class="person-row">${ui().avatar(p, 38)}<div class="grow"><a class="bold small" href="#/app/profile/${p.id}">${E(p.name)}</a><div class="xs muted">${E(((p.profile || {}).title) || '')}</div></div><button class="icon-btn" data-action="conn-send" data-id="${p.id}" aria-label="Connect with ${E(p.name)}">${I('userplus', 18)}</button></div>`).join('') || '<p class="muted small">No suggestions.</p>'}</div>
      <div class="card pad"><h3>Featured jobs</h3>${jobs.map(j => `<div class="person-row"><div class="grow"><a class="bold small" href="#/app/jobs/${j.id}">${E(j.title)}</a><div class="xs muted">${E(PL.q.company(j.companyId).name)}</div></div></div>`).join('')}</div>
      <div class="card pad"><h3>Trending topics</h3><div class="chips">${top.map(t => `<button class="chip" data-action="feed-tag" data-tag="${E(t[0])}">#${E(t[0])}</button>`).join('')}</div></div></aside>`;
  }
  PL.act('feed-tag', d => { PL.vf('feed').tag = d.tag; PL.vf('feed').tab = 'All'; PL.rerender(); window.scrollTo(0, 0); });
  PL.act('feed-more', () => { PL.vf('feed').n += 8; PL.rerender(); });
  PL.act('feed-clear-tag', () => { PL.vf('feed').tag = ''; PL.rerender(); });

  PL.router.add('/app/feed', () => {
    const u = me(), v = PL.vf('feed', { tab: 'All', tag: '', n: 8 }), f = PL.q.follows(u.id);
    let list = db().posts.filter(p => visible(p, u)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (v.tab === 'Following') list = list.filter(p => p.authorId === u.id || f.users.includes(p.authorId) || PL.q.connStatus(u.id, p.authorId) === 'connected' || (PL.q.companyOf(PL.q.user(p.authorId)) && f.companies.includes(PL.q.companyOf(PL.q.user(p.authorId)).id)));
    if (v.tab === 'Jobs') list = list.filter(p => p.type === 'job');
    if (v.tab === 'Saved') list = list.filter(p => (db().savedPosts[u.id] || []).includes(p.id));
    if (v.tag) list = list.filter(p => p.hashtags.includes(v.tag));
    const shown = list.slice(0, v.n), used = []; let out = '';
    shown.forEach((p, i) => {
      out += postCard(p, u);
      if (PL.ads && (i + 1) % 4 === 0) { const ad = PL.ads.feedAd(used.slice(-1)); if (ad) { used.push(ad.id); out += PL.ads.card(ad, 'feed'); } }
    });
    return `<div class="app-grid">${leftRail(u)}<div class="stack">${composer(u)}${ui().tabs(['All', 'Following', 'Jobs', 'Saved'], v.tab, 'feed')}${v.tag ? `<div class="row"><span class="tag">#${E(v.tag)}</span><button class="link-btn small" data-action="feed-clear-tag">Clear filter</button></div>` : ''}${out || ui().empty('news', v.tab === 'Following' ? 'Nothing from your network yet' : 'No posts here', v.tab === 'Following' ? 'Follow people and companies or make connections to see their updates.' : 'Be the first to share something.')}${list.length > shown.length ? '<button class="btn btn-secondary" data-action="feed-more">Load more</button>' : ''}</div>${rightRail(u)}</div>`;
  }, { layout: 'app', roles: ['candidate', 'recruiter'], title: 'Feed' });
})();
