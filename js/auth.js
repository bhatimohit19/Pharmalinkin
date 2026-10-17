/* Authentication, registration, verification and password recovery (all simulated) */
(function () {
  const PL = (window.PL = window.PL || {});
  const ui = () => PL.ui, db = () => PL.store.s;
  const NEXT_KEY = 'pl_next';
  const ROLE_LABEL = { candidate: 'Candidate', recruiter: 'Recruiter / Employer', advertiser: 'Advertiser', admin: 'Super Admin' };
  const safe = fn => { try { return fn(); } catch (e) { return null; } };

  PL.auth = {
    user() {
      const id = safe(() => sessionStorage.getItem('pl_session') || localStorage.getItem('pl_session'));
      const u = id && PL.q.user(id); return u && !['Suspended', 'Banned'].includes(u.status) ? u : null;
    },
    setSession(id, remember) { safe(() => { sessionStorage.removeItem('pl_session'); localStorage.removeItem('pl_session'); (remember ? localStorage : sessionStorage).setItem('pl_session', id); }); },
    logout() { safe(() => { sessionStorage.removeItem('pl_session'); localStorage.removeItem('pl_session'); }); },
    roleLabel: r => ROLE_LABEL[r] || r,
    homeFor(u) { if (u && u.role === 'recruiter' && PL.onboardingOnly()) return u.profile && u.profile.onboarded ? '/employer/dashboard' : '/employer/onboarding'; if (u && u.role === 'candidate' && PL.onboardingOnly()) return u.profile && u.profile.onboarded ? '/onboarding/done' : '/onboarding'; return !u ? '/' : { candidate: '/app/dashboard', recruiter: '/employer/dashboard', advertiser: '/advertiser/dashboard', admin: '/admin/dashboard' }[u.role] || '/'; },
    requireLogin(next, msg = 'Please sign in to continue.') { safe(() => sessionStorage.setItem(NEXT_KEY, next || '')); ui().toast(msg, 'info'); PL.go('/login'); },
    takeNext() { const n = safe(() => sessionStorage.getItem(NEXT_KEY)); safe(() => sessionStorage.removeItem(NEXT_KEY)); return n; },
    hasNext() { return !!safe(() => sessionStorage.getItem(NEXT_KEY)); },
    emailTaken: e => db().users.some(u => u.email.toLowerCase() === String(e).toLowerCase())
  };

  const demoAccounts = [
    { role: 'Candidate', email: 'u1@demo.pharmalinkin.example', name: 'Aarav Mehta', icon: 'user', desc: 'Jobs, feed, applications' },
    { role: 'Recruiter / Employer', email: 'r1@demo.pharmalinkin.example', name: 'Priya Nair', icon: 'briefcase', desc: 'Medicura Pharma (Growth plan)' },
    { role: 'Advertiser', email: 'a1@demo.pharmalinkin.example', name: 'Pooja Shah', icon: 'megaphone', desc: 'Praxis Medical Education' },
    { role: 'Super Admin', email: 'admin@demo.pharmalinkin.example', name: 'Platform Admin', icon: 'shield', desc: 'Moderation & reports' }
  ];
  const demoPanel = () => `<div class="card pad"><h3>${ui().icon('zap', 18)} Demo access panel</h3><p class="muted small">Try the onboarding with a ready-made account, or register your own. Password: <code>${PL.DEMO_PW}</code>. This is a prototype – no real authentication is performed.</p><div class="stack-sm">${demoAccounts.filter(a => !PL.onboardingOnly() || a.role === 'Candidate' || (a.role.startsWith('Recruiter') && PL.employerOn())).map(a => `<div class="row between nowrap card pad" style="padding:10px 12px;box-shadow:none"><div class="row nowrap" style="gap:10px">${ui().icon(a.icon, 20)}<div><div class="bold small">${a.role}</div><div class="xs muted">${a.name} · ${a.desc}</div></div></div><div class="row nowrap"><button class="btn btn-secondary btn-sm" data-action="demo-fill" data-email="${a.email}">Fill</button><button class="btn btn-sm" data-action="demo-login" data-email="${a.email}">Sign in</button></div></div>`).join('')}</div></div>`;

  function doLogin(u, remember) {
    PL.auth.setSession(u.id, remember);
    ui().toast('Welcome back, ' + u.name.split(' ')[0] + '!');
    const next = PL.auth.takeNext();
    PL.go(next || PL.auth.homeFor(u));
  }
  PL.act('demo-fill', d => { const f = document.querySelector('form[data-form="login"]'); if (!f) return; f.email.value = d.email; f.password.value = PL.DEMO_PW; f.password.focus(); });
  PL.act('demo-login', d => { const u = db().users.find(x => x.email === d.email); if (u) doLogin(u, false); });
  PL.act('logout', () => { PL.auth.logout(); ui().toast('You have been signed out.', 'info'); PL.go('/'); });

  /* ---- login ---- */
  PL.router.add('/login', () => {
    const next = PL.auth.hasNext();
    return `<div class="auth-wrap"><div style="max-width:880px;width:100%" class="grid g2" ><div class="card auth-card" style="max-width:none"><h1 style="font-size:1.6rem">Sign in</h1><p class="muted">Welcome back to PharmaLinkIn.</p>${next ? ui().notice('Sign in to continue to the page you were trying to open.', '') : ''}
      <form data-form="login" novalidate class="mt"><div id="login-msg"></div>
      ${ui().field({ name: 'email', label: 'Email address', type: 'email', required: true, autocomplete: 'username', placeholder: 'you@company.com' })}
      ${ui().field({ name: 'password', label: 'Password', type: 'password', required: true })}
      <div class="row between"><label class="check"><input type="checkbox" name="remember"> Remember me</label><a href="#/forgot-password">Forgot password?</a></div>
      <button class="btn btn-block mt" type="submit">Sign in</button></form>
      <div class="divider"></div><p class="small muted center" style="text-align:center">Or continue with <b>(demo-only, not connected)</b></p>
      <div class="row nowrap"><button class="btn btn-secondary btn-block" data-action="social-demo" data-p="Google">Google</button><button class="btn btn-secondary btn-block" data-action="social-demo" data-p="Microsoft">Microsoft</button></div>
      <p class="small center mt" style="text-align:center">New here? <a href="#/register">Create an account</a></p></div>${demoPanel()}</div></div>`;
  }, { layout: 'auth', title: 'Sign in', guestOnly: true });
  PL.act('social-demo', d => ui().toast(d.p + ' sign-in is a demo-only placeholder. Use the demo access panel instead.', 'info'));
  PL.form('login', f => {
    if (!ui().validate(f)) return;
    const d = ui().formData(f), u = db().users.find(x => x.email.toLowerCase() === d.email.toLowerCase());
    const msg = f.querySelector('#login-msg'); msg.innerHTML = '';
    if (!u || u.pw !== PL.hashPw(d.password)) { ui().setError(f, 'password', 'Invalid email or password.'); return; }
    if (u.status === 'Banned') { msg.innerHTML = ui().notice('This account has been banned. Please contact support (demo).', 'err'); return; }
    if (u.status === 'Suspended') { msg.innerHTML = ui().notice('This account is suspended. Please contact support (demo).', 'warn'); return; }
    if (u.status === 'Pending Verification') { msg.innerHTML = ui().notice(`Please verify your email first (simulated). <a href="#/verify-account?u=${u.id}">Open verification</a>`, 'warn'); return; }
    doLogin(u, d.remember);
  });

  /* ---- register ---- */
  const emp = ['Employed – pharma industry', 'Employed – other sector', 'Looking for opportunities', 'Student / Fresher', 'Self-employed / Consultant'];
  function regSteps(role) {
    const F = ui().field, pass = [F({ name: 'password', label: 'Password', type: 'password', required: true, minlength: 8, autocomplete: 'new-password', help: 'Use at least 8 characters. Use a fake password – this is a demo.' }), F({ name: 'confirm', label: 'Confirm password', type: 'password', required: true, match: 'password', autocomplete: 'new-password' })];
    const terms = F({ name: 'terms', type: 'checkbox', required: true, full: true, html: 'I agree to the <a href="#/page/terms">Terms</a> and <a href="#/page/privacy">Privacy Policy</a> (demo).' });
    const acct = { title: 'Account', intro: 'Your sign-in details.', html: '' };
    if (role === 'candidate') return [
      { title: 'Create your account', html: [F({ name: 'name', label: 'Full name', required: true, autocomplete: 'name' }), F({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' }), F({ name: 'phone', label: 'Mobile number', type: 'tel', required: true, placeholder: '+91 98XXXXXXXX' }), ...pass, terms].join('') }];
    if (role === 'recruiter' && PL.onboardingOnly()) return [{ title: 'Create your account', html: [F({ name: 'name', label: 'Full name', required: true, autocomplete: 'name' }), F({ name: 'email', label: 'Work email', type: 'email', required: true }), F({ name: 'phone', label: 'Mobile number', type: 'tel', required: true, placeholder: '+91 98XXXXXXXX' }), F({ name: 'designation', label: 'Your designation', required: true, placeholder: 'e.g. HR Manager' }), F({ name: 'company', label: 'Company name', required: true }), F({ name: 'website', label: 'Company website', type: 'url', required: true, placeholder: 'https://' }), F({ name: 'industry', label: 'Industry', type: 'select', options: PL.INDUSTRIES, placeholder: 'Select…', required: true }), F({ name: 'size', label: 'Company size', type: 'select', options: PL.SIZES, placeholder: 'Select…', required: true }), ...pass, terms].join('') }];
    if (role === 'recruiter') return [
      { title: 'Personal details', html: [F({ name: 'name', label: 'Full name', required: true }), F({ name: 'email', label: 'Work email', type: 'email', required: true }), F({ name: 'phone', label: 'Phone', type: 'tel', required: true }), F({ name: 'designation', label: 'Designation', required: true })].join('') },
      { title: 'Company details', html: [F({ name: 'company', label: 'Company name', required: true }), F({ name: 'website', label: 'Company website', type: 'url', required: true, placeholder: 'https://' }), F({ name: 'industry', label: 'Industry', type: 'select', options: PL.INDUSTRIES, placeholder: 'Select…', required: true }), F({ name: 'size', label: 'Company size', type: 'select', options: PL.SIZES, placeholder: 'Select…', required: true })].join('') },
      { title: 'Secure your account', html: pass.join('') + terms }];
    return [
      { title: 'Contact details', html: [F({ name: 'name', label: 'Contact name', required: true }), F({ name: 'email', label: 'Business email', type: 'email', required: true }), F({ name: 'phone', label: 'Phone', type: 'tel', required: true })].join('') },
      { title: 'Business details', html: [F({ name: 'brand', label: 'Company or brand name', required: true }), F({ name: 'category', label: 'Business category', type: 'select', required: true, placeholder: 'Select…', options: ['Pharmaceutical manufacturer', 'Healthcare technology', 'Laboratory equipment', 'Medical education', 'Professional training', 'Staffing / recruitment'] }), F({ name: 'objective', label: 'Advertising objective', type: 'select', required: true, placeholder: 'Select…', options: ['Brand awareness', 'Lead generation', 'Event / webinar registrations', 'Course enrolments', 'Hiring campaign'] })].join('') },
      { title: 'Secure your account', html: pass.join('') + terms }];
  }
  PL.router.add('/register', ctx => {
    const role = ctx.query.role;
    if (role === 'recruiter' && !PL.employerOn()) { PL.go('/register'); return ''; }
    if (!(PL.onboardingOnly() ? ['candidate', 'recruiter'] : ['candidate', 'recruiter', 'advertiser']).includes(role)) {
      const rc = (r, ic, t, d) => `<a class="role-card" href="#/register?role=${r}" style="display:block;text-decoration:none;color:inherit"><span>${ui().icon(ic, 28)}</span><h3 style="margin-top:8px">${t}</h3><p class="muted small" style="margin:0">${d}</p></a>`;
      return `<div class="auth-wrap"><div class="card auth-card wide"><h1 style="font-size:1.6rem">Create your account</h1><p class="muted">How do you want to use PharmaLinkIn?</p><div class="grid ${PL.onboardingOnly() ? 'g2' : 'g3'} mt">${rc('candidate', 'user', "I\u0027m a Candidate", 'Find jobs, grow your network and track applications.')}${PL.onboardingOnly() ? (PL.employerOn() ? rc('recruiter', 'briefcase', "I'm an Employer", 'Post jobs, manage applicants and discover talent.') : `<div class="role-card" aria-disabled="true" style="opacity:.55;cursor:not-allowed"><span>${ui().icon('briefcase', 28)}</span><h3 style="margin-top:8px">I'm an Employer</h3><p class="muted small" style="margin:0">Coming soon</p></div>`) : rc('recruiter', 'briefcase', "I'm an Employer", 'Post jobs, manage applicants and discover talent.')}${PL.onboardingOnly() ? '' : rc('advertiser', 'megaphone', 'Advertiser', 'Promote hiring drives, webinars, courses and products.')}</div><p class="small mt" style="text-align:center">Already registered? <a href="#/login">Sign in</a></p></div></div>`;
    }
    const title = { candidate: 'Candidate registration', recruiter: 'Employer registration', advertiser: 'Advertiser registration' }[role];
    if (role === 'candidate' && PL.onboardingOnly()) {
      const F = ui().field, I = ui().icon;
      const cc = ['+91', '+1', '+44', '+971', '+65', '+61'].map(c => `<option>${c}</option>`).join('');
      return PL.onb.shell(0, `<div class="onb-head"><h2>Create your account</h2><p class="muted">Let's get started with your basic details.</p></div><form data-form="register" data-role="candidate" novalidate><div class="form-grid">${F({ name: 'first', label: 'First Name', required: true, autocomplete: 'given-name', placeholder: 'Enter first name' })}${F({ name: 'last', label: 'Surname', required: true, autocomplete: 'family-name', placeholder: 'Enter surname' })}
        <div class="field full"><label>Mobile Number <span class="req">*</span></label><div class="phone-row"><select name="cc" aria-label="Country code">${cc}</select><input name="phone" type="tel" required inputmode="numeric" placeholder="Enter mobile number" autocomplete="tel-national"></div></div>
        ${F({ name: 'email', label: 'Email', type: 'email', required: true, full: true, autocomplete: 'email', placeholder: 'Enter your email' })}${F({ name: 'password', label: 'Password', type: 'password', required: true, minlength: 8, full: true, autocomplete: 'new-password', placeholder: 'Create a password', help: 'Minimum 8 characters' })}</div>
        <button class="btn btn-lg btn-block mt" type="submit">Continue</button></form>
        <div class="or-sep"><span>or</span></div>
        <div class="social-row"><button type="button" class="btn btn-secondary btn-block" data-action="social-login" data-n="Google">${I('globe', 16)} Continue with Google</button><button type="button" class="btn btn-secondary btn-block" data-action="social-login" data-n="LinkedIn">${I('link', 16)} Continue with LinkedIn</button></div>
        <p class="xs muted" style="text-align:center;margin-top:14px">By continuing, you agree to our <a href="#/page/terms">Terms of Service</a> and <a href="#/page/privacy">Privacy Policy</a>.</p>
        <p style="text-align:center;margin:6px 0 0"><a class="link-btn" href="#/register">← Back</a> <span class="muted small">· Already registered? <a href="#/login">Sign in</a></span></p>`);
    }
    if (role === 'recruiter' && PL.onboardingOnly()) return PL.onb.shell(0, `<div class="onb-head"><h2>Create your employer account</h2><p class="muted">Tell us who you are and which company you hire for. Next we'll verify your mobile and email.</p></div>${ui().notice('Demo prototype: details stay in your browser only. No email or SMS is sent.', '')}<form data-form="register" data-role="recruiter" novalidate class="mt"><div class="form-grid">${regSteps('recruiter')[0].html}</div><button class="btn btn-lg btn-block mt" type="submit">Create account &amp; continue</button></form><p class="small mt" style="text-align:center"><a href="#/register">Change account type</a> · Already registered? <a href="#/login">Sign in</a></p>`, false, 'e');
    return `<div class="auth-wrap"><div class="card auth-card wide"><a href="#/register" class="small">${ui().icon('left', 14)} Change account type</a><h1 style="font-size:1.6rem;margin-top:8px">${title}</h1>${ui().notice('Demo prototype: details stay in your browser only. No email or SMS is sent.', '')}<div class="mt">${ui().stepForm({ attrs: `data-form="register" data-role="${role}"`, steps: regSteps(role), submit: 'Create account' })}</div></div></div>`;
  }, { layout: 'auth', title: 'Register', guestOnly: true });
  PL.form('register', f => {
    if (!ui().validate(f)) return;
    const role = f.dataset.role, d = ui().formData(f);
    if (PL.auth.emailTaken(d.email)) { ui().setError(f, 'email', 'This email is already registered in the demo data. Try signing in.'); f.querySelector('[name=email]').focus(); return; }
    if (d.first) { d.name = (d.first + ' ' + (d.last || '')).trim(); d.phone = (d.cc || '+91') + ' ' + d.phone; }
    const id = PL.store.id('u'), now = new Date().toISOString();
    const u = { id, name: d.name, email: d.email, role, status: 'Pending Verification', verified: false, pw: PL.hashPw(d.password), phone: d.phone, location: '', createdAt: now, photo: '' };
    if (role === 'candidate') {
      u.location = d.city ? `${d.city}, ${d.state}` : '';
      u.profile = { headline: d.qualification ? `${d.qualification} · ${d.status}` : '', title: '', company: '', qualification: d.qualification || '', experienceYears: Number(d.exp) || 0, about: '', education: [], experience: [], skills: [], certifications: [], languages: ['English'], coverImg: '', views: 0, preferences: { roles: [], locations: d.city ? [d.city] : [], salary: '', jobType: 'Full-time' }, privacy: { visibility: 'Public', showEmail: false, showPhone: false }, resume: null };
    } else if (role === 'recruiter') {
      const cid = PL.store.id('c');
      db().companies.push({ id: cid, name: d.company, industry: d.industry, size: d.size, hq: '', locations: [], verification: 'Pending', description: '', website: d.website, specializations: [], culture: '', benefits: [], social: { linkedin: '', twitter: '' }, logoImg: '', coverImg: '', createdAt: now, recruiterIds: [id] });
      u.companyId = cid; u.profile = { headline: d.designation, title: d.designation, company: d.company };
      db().subscriptions.push({ id: PL.store.id('s'), userId: id, planId: 'free', status: 'Active', renewalDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), usage: { resumes: 0 } });
    } else { u.brand = d.brand; u.businessCategory = d.category; u.objective = d.objective; u.profile = { headline: d.category, company: d.brand }; }
    db().users.push(u); PL.store.save();
    PL.go('/verify-account?u=' + id);
  });

  /* ---- verification ---- */
  PL.router.add('/verify-account', ctx => {
    const u = PL.q.user(ctx.query.u);
    if (!u) return `<div class="auth-wrap"><div class="card auth-card">${ui().empty('mail', 'No account to verify', 'Register first or sign in.', '<a class="btn" href="#/register">Register</a>')}</div></div>`;
    if (ctx.query.done || u.verified) return `<div class="auth-wrap"><div class="card auth-card center" style="text-align:center"><span class="badge b-green">${ui().icon('check', 14)} Verified</span><h1 style="font-size:1.5rem;margin-top:10px">Email verified</h1><p class="muted">${PL.esc(u.email)} is now verified (simulated). You are signed in.</p><a class="btn btn-lg" href="#${PL.onboardingOnly() && (u.role === 'candidate' || u.role === 'recruiter') ? PL.auth.homeFor(u) : '/registration-complete?u=' + u.id}">Continue</a></div></div>`;
    const both = PL.onboardingOnly() && (u.role === 'candidate' || u.role === 'recruiter'), kind = u.role === 'recruiter' ? 'e' : 'c';
    if (both && u.verified) { PL.go(PL.auth.homeFor(u)); return ''; }
    if (both) {
      const boxes = n => `<div class="otp-row" data-otp="${n}">${[0, 1, 2, 3, 4, 5].map(i => `<input class="otp-box" inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="${n} digit ${i + 1}">`).join('')}</div><input type="hidden" name="${n === 'mobile' ? 'otp' : 'code'}">`;
      const card = (n, ic, t, val) => `<div class="vcard"><div class="vcard-h"><span class="vic">${ui().icon(ic, 18)}</span><div class="grow"><b>${t}</b><div class="small muted">${PL.esc(val)}</div></div><a class="link-btn" href="#/register?role=${u.role}">Edit</a></div>${boxes(n)}<div class="small muted vcard-f">Resend in <b class="otp-timer">00:25</b></div></div>`;
      return {
        html: PL.onb.shell(1, `<div class="onb-head"><h2>Verify your mobile &amp; email</h2><p class="muted">Enter the 6-digit codes we sent you.</p></div><form data-form="verify" data-u="${u.id}" novalidate>${card('mobile', 'phone', 'Mobile Number', u.phone || 'your mobile')}${card('email', 'mail', 'Email Address', u.email)}<p class="xs muted" style="text-align:center;margin:10px 0">Demo only – nothing is sent. Use code <b>123456</b> for both.</p><button class="btn btn-lg btn-block" type="submit">Verify &amp; Continue</button></form><p style="text-align:center;margin-top:10px"><a class="link-btn" href="#/register?role=${u.role}">← Back</a></p>`, false, kind),
        after: () => { PL.otpInit && PL.otpInit(); }
      };
    }
    return `<div class="auth-wrap"><div class="card auth-card"><h1 style="font-size:1.5rem">Verify your email</h1><p class="muted">We "sent" a 6-digit code to <b>${PL.esc(u.email)}</b>.</p>${ui().notice('<b>Simulation only:</b> no real email or OTP is sent. Use the demo code <b>123456</b>.', 'warn')}<form data-form="verify" data-u="${u.id}" novalidate class="mt">${ui().field({ name: 'code', label: 'Verification code', required: true, placeholder: '123456', attrs: 'inputmode="numeric" maxlength="6"' })}<button class="btn btn-block" type="submit">Verify email</button></form><div class="row between mt"><button class="link-btn" data-action="resend-code">Resend code (simulated)</button><a href="#/login">Back to sign in</a></div></div></div>`;
  }, { layout: 'auth', title: 'Verify account' });
  PL.act('resend-code', () => ui().toast('A new demo code was "sent". It is still 123456.', 'info'));
  PL.act('social-login', d => ui().toast(d.n + ' sign-in is not available in this demo. Please use the form.', 'info'));
  let otpTimer;
  PL.otpInit = () => {
    const rows = [...document.querySelectorAll('.otp-row')]; if (!rows.length) return;
    const sync = r => { r.nextElementSibling.value = [...r.querySelectorAll('.otp-box')].map(b => b.value).join(''); };
    rows.forEach(r => {
      const bx = [...r.querySelectorAll('.otp-box')];
      bx.forEach((b, i) => {
        b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && bx[i + 1]) bx[i + 1].focus(); sync(r); });
        b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && bx[i - 1]) bx[i - 1].focus(); });
        b.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); bx.forEach((x, k) => x.value = t[k] || ''); sync(r); (bx[Math.min(t.length, 5)]).focus(); });
      });
    });
    let s = 25; clearInterval(otpTimer);
    otpTimer = setInterval(() => {
      const els = document.querySelectorAll('.otp-timer'); if (!els.length) { clearInterval(otpTimer); return; }
      s = Math.max(0, s - 1); els.forEach(e => e.textContent = '00:' + String(s).padStart(2, '0'));
      if (!s) clearInterval(otpTimer);
    }, 1000);
    rows[0].querySelector('.otp-box').focus();
  };
  PL.form('verify', f => {
    const d = ui().formData(f), hasOtp = !!f.querySelector('[name=otp]');
    if (hasOtp) {
      if (d.otp !== '123456' || d.code !== '123456') { ui().toast(!d.otp || !d.code ? 'Enter both 6-digit codes.' : 'Incorrect code. Use 123456 for this demo.', 'err'); return; }
    } else {
      if (!ui().validate(f)) return;
      if (d.code !== '123456') { ui().setError(f, 'code', 'Incorrect code. Use 123456 for this demo.'); return; }
    }
    const u = PL.q.user(f.dataset.u); u.verified = true; u.status = 'Active';
    if (hasOtp) { PL.store.save(); if (u.role === 'recruiter') { const co = PL.q.companyOf(u); if (co) co.verification = 'Verified'; } PL.store.save(); PL.auth.setSession(u.id, false); ui().toast('Mobile and email verified'); PL.go(PL.auth.homeFor(u)); return; }
    if (u.role === 'recruiter') db().users.filter(x => x.role === 'admin').forEach(a => PL.notify(a.id, 'verification', 'Employer verification pending', `${u.profile.company} registered and awaits review.`, '/admin/companies'));
    PL.store.save(); PL.auth.setSession(u.id, false); PL.go('/verify-account?u=' + u.id + '&done=1');
  });
  PL.router.add('/registration-complete', ctx => {
    const u = PL.q.user(ctx.query.u) || PL.auth.user(); if (!u) return `<div class="auth-wrap"><div class="card auth-card">${ui().empty('user', 'Nothing to show', '', '<a class="btn" href="#/login">Sign in</a>')}</div></div>`;
    const steps = { candidate: ['Complete your profile and add skills', 'Upload your resume', 'Browse jobs and apply', 'Connect with professionals'], recruiter: ['Complete your company profile', 'Your company enters admin verification (demo queue)', 'Post your first job – it goes to moderation', 'Review applicants'], advertiser: ['Create your first campaign', 'Submit it for admin approval', 'Track simulated analytics'] }[u.role];
    return `<div class="auth-wrap"><div class="card auth-card center" style="text-align:center"><span class="badge b-teal">${ui().icon('award', 14)} Registration complete</span><h1 style="font-size:1.6rem;margin-top:10px">You are all set, ${PL.esc(u.name.split(' ')[0])}!</h1><p class="muted">Your ${PL.auth.roleLabel(u.role)} account is ready.</p><ul class="stack-sm" style="text-align:left;list-style:none;padding:0">${steps.map(s => `<li class="row nowrap" style="gap:8px">${ui().icon('checkc', 18, 'verified')} ${s}</li>`).join('')}</ul>${PL.onboardingOnly() ? ui().notice('<b>Coming soon:</b> the full employer experience (job posting, applicants, company page) is being prepared and will be enabled in the next release.', '') + '<button class="btn btn-secondary btn-block mt" data-action="logout">Sign out</button>' : `<a class="btn btn-lg btn-block mt" href="#${PL.auth.homeFor(u)}">Go to my dashboard</a>`}</div></div>`;
  }, { layout: 'auth', title: 'Welcome' });

  /* ---- forgot / reset ---- */
  PL.router.add('/forgot-password', ctx => {
    const sent = ctx.query.sent; const u = sent && db().users.find(x => x.email.toLowerCase() === sent.toLowerCase());
    return `<div class="auth-wrap"><div class="card auth-card"><h1 style="font-size:1.5rem">Forgot your password?</h1>${sent ? `${ui().notice('If an account exists for <b>' + PL.esc(sent) + '</b>, a reset link has been sent. <b>(Simulation – no email is sent.)</b>', 'ok')}${u ? `<div class="notice warn mt">Demo shortcut: <a href="#/reset-password?email=${encodeURIComponent(sent)}">Open the simulated reset link</a></div>` : ''}<a class="btn btn-secondary btn-block mt" href="#/login">Back to sign in</a>` : `<p class="muted">Enter your email and we will "send" a reset link.</p><form data-form="forgot" novalidate>${ui().field({ name: 'email', label: 'Email address', type: 'email', required: true })}<button class="btn btn-block" type="submit">Send reset link</button></form><p class="small mt" style="text-align:center"><a href="#/login">Back to sign in</a></p>`}</div></div>`;
  }, { layout: 'auth', title: 'Forgot password', guestOnly: true });
  PL.form('forgot', f => { if (!ui().validate(f)) return; PL.go('/forgot-password?sent=' + encodeURIComponent(ui().formData(f).email)); });
  PL.router.add('/reset-password', ctx => {
    const u = db().users.find(x => x.email.toLowerCase() === String(ctx.query.email || '').toLowerCase());
    if (!u) return `<div class="auth-wrap"><div class="card auth-card">${ui().empty('lock', 'Reset link invalid', 'This simulated link is not valid.', '<a class="btn" href="#/forgot-password">Request again</a>')}</div></div>`;
    return `<div class="auth-wrap"><div class="card auth-card"><h1 style="font-size:1.5rem">Reset password</h1><p class="muted">Account: <b>${PL.esc(u.email)}</b></p><form data-form="reset" data-u="${u.id}" novalidate>${ui().field({ name: 'password', label: 'New password', type: 'password', required: true, minlength: 8, autocomplete: 'new-password' })}${ui().field({ name: 'confirm', label: 'Confirm new password', type: 'password', required: true, match: 'password', autocomplete: 'new-password' })}<button class="btn btn-block" type="submit">Update password</button></form></div></div>`;
  }, { layout: 'auth', title: 'Reset password' });
  PL.form('reset', f => { if (!ui().validate(f)) return; const u = PL.q.user(f.dataset.u); u.pw = PL.hashPw(ui().formData(f).password); PL.store.save(); ui().toast('Password updated. Please sign in.'); PL.go('/login'); });
})();
