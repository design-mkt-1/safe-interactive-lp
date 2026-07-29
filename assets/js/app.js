/* ==========================================================================
   Topbet — Interactive Vault Landing Page
   --------------------------------------------------------------------------
   State machine:
     idle -> scanning -> unlocking -> revealing -> register

   All user-facing copy lives in COPY below. To localise the page, add a
   locale and change ACTIVE_LOCALE — no markup changes required.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Copy
   * ------------------------------------------------------------------ */

  var COPY = {
    en: {
      headline:    'Your welcome package is sealed.',
      subhead:     'It is locked to this device. Unlock the vault to see what is inside.',
      hint:        'Press and hold to scan',
      hintHolding: 'Hold…',
      granted:     'Access granted',

      revealKicker: 'Vault open',
      offerPrimary:   '100% BONUS',
      offerSecondary: '+ 250 free spins',

      lockLabel:  'Reserved for this device for',
      lockExpired: 'Reservation expired',

      toRegister: 'Claim my bonus',

      formTitle:  'Create your account',
      lblEmail:   'Email address',
      lblPassword:'Password',
      lblTerms:   'I am 18 or over and I accept the <a href="#terms">Terms &amp; Conditions</a> and <a href="#privacy">Privacy Policy</a>.',
      submit:     'Register now',
      formNote:   'Your bonus is applied automatically after your first deposit.',

      errEmailRequired: 'Please enter your email address.',
      errEmailInvalid:  'That does not look like a valid email address.',
      errPassword:      'Password must be at least 8 characters.',
      errTerms:         'You must confirm your age and accept the terms.',

      tapStart:   'Tap to begin',

      footerLegal:
        'Topbet. Gambling can be addictive — please play responsibly. ' +
        '18+ only. <a href="#responsible">Responsible gambling</a> · ' +
        '<a href="#terms">Terms apply</a>'
    }
  };

  var ACTIVE_LOCALE = 'en';
  var t = COPY[ACTIVE_LOCALE];

  /* ------------------------------------------------------------------ *
   * Config
   * ------------------------------------------------------------------ */

  var HOLD_MS       = 1600;               // how long the user must hold
  var LOCK_MINUTES  = 15;                 // bonus reservation window
  var LOCK_KEY      = 'topbet.vault.lockUntil';
  var RING_LENGTH   = 335;                // scanner plate perimeter, matches the SVG

  // Two clips: a seamless idle loop, and the opening animation which plays
  // once and holds on its final frame. Each basename resolves to a .webm and
  // a .mp4 — the browser picks via the <source> elements.
  var SOURCES = {
    portrait: {
      idle: 'assets/video/vault-idle-9x16',
      open: 'assets/video/vault-open-9x16'
    },
    landscape: {
      idle: 'assets/video/vault-idle-16x9',
      open: 'assets/video/vault-open-16x9'
    }
  };

  /* ------------------------------------------------------------------ *
   * Elements
   * ------------------------------------------------------------------ */

  var $ = function (id) { return document.getElementById(id); };

  var root        = document.documentElement;
  var clipIdle    = $('clipIdle');
  var clipOpen    = $('clipOpen');
  var clipStill   = $('clipStill');
  var scanner     = $('scanner');
  var scanProgress= $('scanProgress');
  var panelIntro  = $('panelIntro');
  var panelReveal = $('panelReveal');
  var panelReg    = $('panelRegister');
  var lockBox     = $('lockBox');
  var lockTimer   = $('lockTimer');
  var tapStart    = $('tapStart');
  var form        = $('regForm');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ *
   * Copy injection
   * ------------------------------------------------------------------ */

  function paint() {
    $('headline').textContent    = t.headline;
    $('subhead').textContent     = t.subhead;
    $('scanHint').textContent    = t.hint;
    $('grantedText').textContent = t.granted;

    $('revealKicker').textContent   = t.revealKicker;
    $('offerPrimary').textContent   = t.offerPrimary;
    $('offerSecondary').textContent = t.offerSecondary;
    $('lockLabel').textContent      = t.lockLabel;
    $('toRegister').textContent     = t.toRegister;

    $('formTitle').textContent  = t.formTitle;
    $('lblEmail').textContent   = t.lblEmail;
    $('lblPassword').textContent= t.lblPassword;
    $('lblTerms').innerHTML     = t.lblTerms;
    $('submitBtn').textContent  = t.submit;
    $('formNote').textContent   = t.formNote;
    $('tapStartText').textContent = t.tapStart;
    $('footerLegal').innerHTML  = t.footerLegal;

    scanner.setAttribute('aria-label', t.hint);
  }

  /* ------------------------------------------------------------------ *
   * Source selection
   * ------------------------------------------------------------------ */

  // Point a <video>'s two <source> children at a basename and reload it.
  // Letting the browser negotiate format beats hand-rolled detection:
  // Chromium builds without proprietary codecs cannot play H.264 at all,
  // while Safari prefers the MP4.
  function setClip(video, base) {
    if (video.dataset.base === base) return;
    video.dataset.base = base;

    var sources = video.querySelectorAll('source');
    sources[0].src = base + '.webm';
    sources[1].src = base + '.mp4';
    video.load();
  }

  function pickSources() {
    var landscape = window.matchMedia('(orientation: landscape)').matches
                 && window.innerWidth >= 900;
    var set = landscape ? SOURCES.landscape : SOURCES.portrait;

    setClip(clipIdle, set.idle);
    setClip(clipOpen, set.open);
  }

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */

  var state = 'idle';

  function setState(next) {
    state = next;
    root.setAttribute('data-state', next);
  }

  function show(clip) {
    [clipIdle, clipOpen].forEach(function (c) {
      c.classList.toggle('is-active', c === clip);
    });
  }

  /* ------------------------------------------------------------------ *
   * Hold-to-scan
   * ------------------------------------------------------------------ */

  var holdStart = 0;
  var holdRAF   = null;

  function setRing(pct) {
    scanProgress.style.strokeDashoffset = String(RING_LENGTH * (1 - pct));
  }

  function tickHold() {
    var pct = Math.min((performance.now() - holdStart) / HOLD_MS, 1);
    setRing(pct);

    if (pct >= 1) {
      holdRAF = null;
      unlock();
      return;
    }
    holdRAF = requestAnimationFrame(tickHold);
  }

  function beginHold(e) {
    if (state !== 'idle') return;
    e.preventDefault();

    // Capture the pointer so the hold survives finger drift. Without this the
    // element resizing (the idle animation stops) or a few px of movement
    // fires pointerleave and cancels the scan mid-way.
    if (e.pointerId !== undefined && scanner.setPointerCapture) {
      try { scanner.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }

    setState('scanning');
    $('scanHint').textContent = t.hintHolding;
    holdStart = performance.now();
    holdRAF = requestAnimationFrame(tickHold);
  }

  function cancelHold() {
    if (state !== 'scanning') return;

    if (holdRAF) { cancelAnimationFrame(holdRAF); holdRAF = null; }
    setRing(0);
    setState('idle');
    $('scanHint').textContent = t.hint;
  }

  /* ------------------------------------------------------------------ *
   * Unlock -> reveal
   * ------------------------------------------------------------------ */

  // The opening animation runs once and then holds on its last frame for the
  // rest of the visit. There is no way back to the idle loop short of a reload
  // — the vault is open, and re-locking it would undo the payoff.
  function unlock() {
    setState('unlocking');
    setRing(1);

    if (reduceMotion) { reveal(); return; }

    show(clipOpen);
    clipOpen.currentTime = 0;

    var go = clipOpen.play();
    if (go && go.catch) go.catch(reveal);

    clipOpen.addEventListener('ended', function () {
      clipOpen.pause();
      clipStill.classList.add('is-active');   // pin the final frame
      reveal();
    }, { once: true });
  }

  function reveal() {
    if (state === 'revealing' || state === 'register') return;

    setState('revealing');
    panelIntro.hidden = true;
    panelReveal.hidden = false;
    startLockCountdown();
  }

  /* ------------------------------------------------------------------ *
   * Reservation countdown
   *
   * Persisted so a refresh does not hand the visitor a fresh 15 minutes.
   * An urgency timer that resets on reload is transparently fake.
   * ------------------------------------------------------------------ */

  var lockInterval = null;

  function lockDeadline() {
    var stored = null;
    try { stored = window.localStorage.getItem(LOCK_KEY); } catch (err) { /* private mode */ }

    var ts = stored ? parseInt(stored, 10) : NaN;
    if (!stored || isNaN(ts) || ts < Date.now()) {
      ts = Date.now() + LOCK_MINUTES * 60 * 1000;
      try { window.localStorage.setItem(LOCK_KEY, String(ts)); } catch (err) { /* ignore */ }
    }
    return ts;
  }

  function startLockCountdown() {
    if (lockInterval) return;

    var deadline = lockDeadline();

    var render = function () {
      var left = Math.max(0, deadline - Date.now());
      var mins = Math.floor(left / 60000);
      var secs = Math.floor((left % 60000) / 1000);

      lockTimer.textContent =
        String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

      if (left <= 0) {
        clearInterval(lockInterval);
        lockInterval = null;
        lockBox.classList.add('is-expired');
        $('lockLabel').textContent = t.lockExpired;
      }
    };

    render();
    lockInterval = setInterval(render, 1000);
  }

  /* ------------------------------------------------------------------ *
   * Registration
   * ------------------------------------------------------------------ */

  function toRegister() {
    setState('register');
    panelReg.hidden = false;
    panelReg.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
  }

  function setError(inputId, errId, message) {
    var input = $(inputId);
    $(errId).textContent = message || '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    return !message;
  }

  function validate() {
    var email = $('fEmail').value.trim();
    var pass  = $('fPassword').value;
    var terms = $('fTerms').checked;
    var ok    = true;

    if (!email)                          ok = setError('fEmail', 'errEmail', t.errEmailRequired) && ok;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
                                         ok = setError('fEmail', 'errEmail', t.errEmailInvalid) && ok;
    else                                 ok = setError('fEmail', 'errEmail', '') && ok;

    ok = setError('fPassword', 'errPassword', pass.length >= 8 ? '' : t.errPassword) && ok;

    $('errTerms').textContent = terms ? '' : t.errTerms;
    if (!terms) ok = false;

    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    /* ------------------------------------------------------------------
       INTEGRATION POINT
       Wire this to the Topbet registration endpoint / affiliate postback.
       Deliberately left inert — no endpoint is invented here.
       ------------------------------------------------------------------ */
    var payload = {
      email:    $('fEmail').value.trim(),
      password: $('fPassword').value,
      terms:    $('fTerms').checked
    };
    console.log('[topbet] registration submitted', payload);

    var btn = $('submitBtn');
    btn.disabled = true;
    btn.textContent = '✓';
  });

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  function boot() {
    paint();
    pickSources();
    setRing(0);
    setState('idle');

    if (reduceMotion) {
      clipStill.classList.add('is-active');
      return;
    }

    var go = clipIdle.play();
    if (go && go.catch) {
      go.catch(function () {
        // Muted autoplay refused (iOS Low Power Mode is the usual cause).
        tapStart.hidden = false;
      });
    }
  }

  tapStart.addEventListener('click', function () {
    tapStart.hidden = true;
    clipIdle.play().catch(function () { /* give up gracefully, poster shows */ });
  });

  scanner.addEventListener('pointerdown', beginHold);
  scanner.addEventListener('pointerup', cancelHold);
  scanner.addEventListener('pointercancel', cancelHold);
  scanner.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // Keyboard equivalent of press-and-hold.
  scanner.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) beginHold(e);
  });
  scanner.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter') cancelHold();
  });

  $('toRegister').addEventListener('click', toRegister);

  window.addEventListener('resize', pickSources);
  window.addEventListener('orientationchange', pickSources);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
