/* Forgot password: Initiate -> Verify -> Reset -> Success (simulated, no messages are sent) */
(function () {
  const PL = window.PL, ui = () => PL.ui, E = s => PL.esc(s), I = (n, s) => ui().icon(n, s);
  const st = { step: 0, id: '', secs: 25 };
  let timer;
  const RULES = [['Must be at least 8 characters', v => v.length >= 8], ['Include a capital letter', v => /[A-Z]/.test(v)], ['Include a number', v => /\d/.test(v)], ['Include a special character', v => /[^A-Za-z0-9]/.test(v)]];
  const isMail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), isPhone = v => /^\+?\d[\d\s-]{8,13}$/.test(v);
  const digits = v => v.replace(/\D/g, '').slice(-10);

  const bar = () => `<ol class="fp-steps" aria-label="Progress">${['Initiate', 'Verify', 'Reset'].map((l, i) => `<li class="${i < st.step || st.step === 3 ? 'done' : i === st.step ? 'cur' : ''}"><span class="dot"></span><span class="lbl">${l}</span></li>`).join('')}</ol>`;
  const pw = (n, label) => `<div class="fp-pw"><input type="password" name="${n}" placeholder="${label}" aria-label="${label}" autocomplete="new-password"><button type="button" class="fp-eye" data-action="fp-eye" aria-label="Show or hide password">${I('eye', 18)}</button></div>`;

  const panel = () => {
    if (st.step === 0) return `<div class="fp-ic">${I('lock', 34)}</div><h1>Forgot Your Password?</h1><p class="muted">Enter your registered email address or mobile number to receive a verification code.</p>
      <form data-form="fp-send" novalidate><div class="fp-in"><span class="fp-lead">${I('mail', 16)}</span><input name="id" value="${E(st.id)}" placeholder="Enter your mobile number or email id" aria-label="Email or mobile number" autocomplete="username"></div><small class="err" id="fp-err" role="alert"></small>
      <button class="btn btn-block" type="submit">Send Code</button></form><a class="fp-link" href="#" data-action="fp-faq">FAQ &amp; Support</a>`;
    if (st.step === 1) return `<h1>Verify Your Contact Info</h1><p class="fp-chk">${I('checkc', 18)} <span>Check your ${isMail(st.id) ? 'email' : 'mobile'}: <b>${E(st.id)}</b></span></p>
      <form data-form="fp-verify" novalidate><div class="otp-row" data-otp="fp">${[0, 1, 2, 3, 4, 5].map(i => `<input class="otp-box" inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="Digit ${i + 1}">`).join('')}</div><input type="hidden" name="code">
      <p class="small">Enter the 6-digit code we sent.</p><p class="small fp-resend"><span id="fp-t"></span></p><small class="err" id="fp-err" role="alert"></small>
      <p class="xs muted">Demo only – nothing is sent. Use code <b>123456</b>. <button type="button" class="link-btn" data-action="fp-fill">Fill demo code</button></p>
      <button class="btn btn-block" type="submit">Verify Code</button></form><a class="fp-link" href="#" data-action="fp-back">Back to previous step</a>`;
    if (st.step === 2) return `<h1>Create a New Password</h1><p class="muted">Choose a strong password.</p>
      <form data-form="fp-reset" novalidate>${pw('p1', 'New Password')}${pw('p2', 'Confirm New Password')}<div class="fp-meter"><i id="fp-m"></i></div>
      <ul class="fp-rules">${RULES.map((r, i) => `<li data-r="${i}">${I('check', 14)} ${r[0]}</li>`).join('')}</ul><small class="err" id="fp-err" role="alert"></small>
      <button class="btn btn-block" type="submit">Reset Password</button></form><a class="fp-link" href="#/login">Back to Login</a>`;
    return `<div class="fp-ic ok">${I('checkc', 40)}</div><h1>Password Reset Successful!</h1><p class="muted">You can now log in with your new password.</p><a class="btn btn-block" href="#/login">Go to Login</a>`;
  };

  const paint = () => {
    const w = document.getElementById('fp'); if (!w) return;
    w.innerHTML = bar() + `<div class="card fp-card">${panel()}</div>`;
    clearInterval(timer);
    if (st.step === 1) {
      const bx = [...w.querySelectorAll('.otp-box')], h = w.querySelector('[name=code]');
      const sync = () => { h.value = bx.map(b => b.value).join(''); };
      bx.forEach((b, i) => {
        b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && bx[i + 1]) bx[i + 1].focus(); sync(); });
        b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && bx[i - 1]) bx[i - 1].focus(); });
        b.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); bx.forEach((x, k) => x.value = t[k] || ''); sync(); bx[Math.min(t.length, 5)].focus(); });
      });
      const tick = () => { const t = document.getElementById('fp-t'); if (!t) { clearInterval(timer); return; } t.innerHTML = st.secs > 0 ? `Resend in <b>00:${String(st.secs).padStart(2, '0')}</b>` : `<button type="button" class="link-btn" data-action="fp-resend">Resend Code</button>`; };
      tick(); timer = setInterval(() => { st.secs = Math.max(0, st.secs - 1); tick(); if (!st.secs) clearInterval(timer); }, 1000);
      bx[0].focus();
    }
    if (st.step === 2) {
      const f = w.querySelector('form'), p1 = f.p1;
      p1.addEventListener('input', () => {
        const ok = RULES.map(r => r[1](p1.value)); f.querySelectorAll('[data-r]').forEach((li, i) => li.classList.toggle('ok', ok[i]));
        const n = ok.filter(Boolean).length, m = document.getElementById('fp-m'); m.style.width = (p1.value ? Math.max(1, n) * 25 : 0) + '%'; m.dataset.l = n;
      });
    }
  };

  const err = m => { const e = document.getElementById('fp-err'); if (e) e.textContent = m; };

  PL.router.add('/forgot-password', () => {
    st.step = 0; st.id = ''; st.secs = 25;
    const faq = ['Need further help?', 'Can\u2019t receive OTP?', 'Trouble with email?', 'Get it to help'];
    return { html: `<div class="auth-wrap fp-wrap"><div class="fp-page"><div id="fp"></div><div class="fp-faq"><b>FAQ &amp; Support</b><ul>${faq.map(t => `<li><a href="#" data-action="fp-faq">${t}</a></li>`).join('')}</ul></div></div></div>`, after: paint };
  }, { layout: 'auth', title: 'Forgot password', guestOnly: true });
  PL.router.add('/reset-password', () => { PL.go('/forgot-password'); return ''; }, { layout: 'auth', title: 'Forgot password' });

  PL.act('fp-faq', (d, el, e) => { e && e.preventDefault(); ui().toast('Support is a demo placeholder. Write to support@pharmalinkin.example', 'info'); });
  PL.act('fp-back', (d, el, e) => { e && e.preventDefault(); st.step = 0; paint(); });
  PL.act('fp-fill', () => { document.querySelectorAll('#fp .otp-box').forEach((b, i) => b.value = '123456'[i]); document.querySelector('#fp [name=code]').value = '123456'; });
  PL.act('fp-resend', () => { st.secs = 25; paint(); ui().toast('A new demo code was "sent". It is still 123456.', 'info'); });
  PL.act('fp-eye', (d, el) => { const i = el.previousElementSibling, show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.innerHTML = I(show ? 'eyeoff' : 'eye', 18); });

  PL.form('fp-send', f => {
    const v = f.id.value.trim();
    if (!v) return err('Enter your email or mobile number');
    if (!isMail(v) && !isPhone(v)) return err('Enter a valid email address or mobile number');
    st.id = v; st.step = 1; st.secs = 25; paint();
  });
  PL.form('fp-verify', f => {
    const c = f.code.value;
    if (c.length < 6) return err('Enter the 6-digit code');
    if (c !== '123456') return err('Incorrect code. Use 123456 for this demo.');
    st.step = 2; paint();
  });
  PL.form('fp-reset', f => {
    const a = f.p1.value, b = f.p2.value;
    if (!RULES.every(r => r[1](a))) return err('Please meet all the password requirements');
    if (a !== b) return err('Passwords do not match');
    const users = PL.store.s.users, k = st.id.toLowerCase();
    const acc = users.find(x => x.email.toLowerCase() === k || (isPhone(st.id) && x.phone && digits(x.phone) === digits(st.id)));
    if (acc) { acc.pw = PL.hashPw(a); PL.store.save(); }
    st.step = 3; paint();
  });
})();
