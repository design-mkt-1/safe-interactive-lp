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

  // Where the vault's scanner plate sits WITHIN THE FOOTAGE, as a fraction of
  // the video's own width and height. These are properties of the render, not
  // of any screen — tune them once against the final clips and they hold
  // everywhere. Aspect ratios differ, so each cut gets its own point.
  // Measured off the delivered footage against a coordinate grid: the ring
  // and the scanner plate share a centre at x=969, y=531 of the 1920x1080
  // master, with a ring diameter of ~404px. The portrait cut is cropped 608px
  // wide from x=679, which puts that centre at 0.477 of the crop.
  //
  // Do not derive these from a red-pixel centroid: the floor reflection and
  // the equipment lights drag it badly off, and a search window clipped to
  // avoid them just returns its own boundaries.
  // `d` is the plate's on-screen size as a fraction of the video's WIDTH, so
  // the overlay ring matches the plate instead of floating at some arbitrary
  // size. It differs sharply between the cuts — the portrait crop frames the
  // vault much larger — which is why a single shared value could never fit.
  var SCAN_POINT = {
    portrait:  { x: 0.4635, y: 0.5019, d: 0.1305 },
    landscape: { x: 0.4998, y: 0.5024, d: 0.0387 }
  };

  // Same coordinate system; `d` is the ring's diameter as a fraction of the
  // video's WIDTH, so it differs between the two cuts of the same footage.
  // The neon ring shares the plate's centre — it is the same vault door — so
  // these track SCAN_POINT. This point is also the focus the whole frame is
  // centred on, so a correction here moves the vault, not just the overlay.
  var RING_POINT = {
    portrait:  { x: 0.4635, y: 0.5019, d: 0.664 },
    landscape: { x: 0.4998, y: 0.5024, d: 0.210 }
  };

  // Where the vault should sit on screen, as a fraction of the viewport.
  // Plain object-fit:cover centres the video's FRAME, which only centres the
  // vault if the vault happens to sit dead centre of the footage — it does
  // not, so the vault drifted a few percent off. These pin the vault itself.
  // Portrait puts it slightly above the middle to leave the copy room below.
  var VAULT_TARGET = {
    portrait:  { x: 0.500, y: 0.500 },
    landscape: { x: 0.500, y: 0.500 }
  };

  // 'video'  — idle state plays vault-idle-*; 'still' — idle state is a static
  // poster and the motion comes from CSS. 'auto' picks 'still' when the idle
  // clip is missing or fails to load, so a missing file degrades rather than
  // breaking. A still idle loops perfectly and costs no bandwidth.
  var IDLE_MODE = 'auto';

  // The visitor taps at an arbitrary point in the idle loop, so the opening
  // clip's first frame can never match what is on screen. This blend covers
  // the discontinuity. CSS reads it from --clip-fade so the two cannot drift.
  var CROSSFADE_MS  = 420;

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
  var stage       = $('stage');
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

  function isLandscape() {
    return window.matchMedia('(orientation: landscape)').matches
        && window.innerWidth >= 900;
  }

  function pickSources() {
    var set = isLandscape() ? SOURCES.landscape : SOURCES.portrait;

    setClip(clipIdle, set.idle);
    setClip(clipOpen, set.open);
  }

  /* ------------------------------------------------------------------ *
   * Stage geometry — focal-point cover
   *
   * Sizes and positions the video so a chosen point in the FOOTAGE (the
   * vault) lands on a chosen point on SCREEN, while still covering the
   * viewport with no exposed edges.
   *
   * Plain object-fit:cover cannot do this: it centres the video's FRAME, so
   * the vault only ends up centred if it happens to sit dead centre of the
   * footage. It does not, so the vault drifted a few percent off.
   *
   * The scanner target and ring glow resolve from the same numbers, so
   * overlays stay glued to the footage by construction.
   * ------------------------------------------------------------------ */

  function syncOverlay() {
    var box = stage.getBoundingClientRect();
    if (!box.width || !box.height) return;

    var landscape = isLandscape();
    var video     = clipOpen.classList.contains('is-active') ? clipOpen : clipIdle;

    // Prefer the real intrinsic size once metadata has loaded; fall back to
    // the nominal ratio so the first paint is not wrong.
    var aspect = (video.videoWidth && video.videoHeight)
      ? video.videoWidth / video.videoHeight
      : (landscape ? 16 / 9 : 9 / 16);

    var ring   = landscape ? RING_POINT.landscape   : RING_POINT.portrait;
    var point  = landscape ? SCAN_POINT.landscape   : SCAN_POINT.portrait;
    var target = landscape ? VAULT_TARGET.landscape : VAULT_TARGET.portrait;

    var wantX = target.x * box.width;
    var wantY = target.y * box.height;

    // Smallest size that still reaches every edge with the vault pinned at
    // (wantX, wantY). Pinning off-centre needs MORE size than plain cover,
    // because the longer side of the split has to span further.
    var minW = Math.max(wantX / ring.x, (box.width  - wantX) / (1 - ring.x));
    var minH = Math.max(wantY / ring.y, (box.height - wantY) / (1 - ring.y));

    var w = Math.max(minW, minH * aspect);
    var h = w / aspect;
    if (h < minH) { h = minH; w = h * aspect; }

    var left = wantX - ring.x * w;
    var top  = wantY - ring.y * h;

    var s = root.style;
    s.setProperty('--vid-x', left.toFixed(2) + 'px');
    s.setProperty('--vid-y', top.toFixed(2)  + 'px');
    s.setProperty('--vid-w', w.toFixed(2)    + 'px');
    s.setProperty('--vid-h', h.toFixed(2)    + 'px');

    s.setProperty('--ov-x', (left + point.x * w).toFixed(2) + 'px');
    s.setProperty('--ov-y', (top  + point.y * h).toFixed(2) + 'px');
    s.setProperty('--ov-w', w.toFixed(2) + 'px');
    s.setProperty('--ov-h', h.toFixed(2) + 'px');
    s.setProperty('--ring-x', (left + ring.x * w).toFixed(2) + 'px');
    s.setProperty('--ring-y', (top  + ring.y * h).toFixed(2) + 'px');
    s.setProperty('--ring-d', (ring.d * w).toFixed(2) + 'px');

    // Visual size of the plate. The touch target is derived from this in CSS
    // but floored separately, so the ring can match a small plate without
    // leaving a target too small to hit.
    s.setProperty('--plate-size', (point.d * w).toFixed(2) + 'px');
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

    // Park the opening clip on its first frame and start the blend. Holding it
    // paused through the fade matters: if it played immediately, the bolts and
    // the start of the door's swing would happen while the layer is still
    // semi-transparent, and the visitor would simply miss them.
    try { clipOpen.currentTime = 0; } catch (err) { /* not seekable yet */ }
    show(clipOpen);

    window.setTimeout(function () {
      clipIdle.pause();                      // nothing behind it now
      var go = clipOpen.play();
      if (go && go.catch) go.catch(reveal);
    }, CROSSFADE_MS);

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
    root.style.setProperty('--clip-fade', CROSSFADE_MS + 'ms');
    pickSources();
    syncOverlay();
    setRing(0);
    setState('idle');

    // Intrinsic dimensions arrive asynchronously; re-resolve once they do.
    clipIdle.addEventListener('loadedmetadata', syncOverlay);
    clipOpen.addEventListener('loadedmetadata', syncOverlay);

    if (reduceMotion) {
      clipStill.classList.add('is-active');
      return;
    }

    if (IDLE_MODE === 'still') { useStillIdle(); return; }

    var go = clipIdle.play();
    if (go && go.catch) {
      go.catch(function () {
        // Autoplay refusal (iOS Low Power Mode) is recoverable with a tap;
        // an unplayable clip is not. The readiness check below settles which.
        if (clipIdle.readyState >= 2) tapStart.hidden = false;
      });
    }

    // A <video> with <source> children fires `error` on the sources, not on
    // itself, so there is no single reliable event for "this clip will never
    // play". Give it a deadline and judge by readiness instead — this covers
    // a missing file, a network failure and an unsupported codec alike.
    window.setTimeout(function () {
      if (IDLE_MODE === 'auto' && clipIdle.readyState < 2) useStillIdle();
    }, 2500);
  }

  // Drop the idle clip's sources and let its poster stand in. A <video> with
  // no playable source renders its poster, and object-fit applies to that too,
  // so the framing is identical to the clip it replaces — the CSS effects then
  // carry the motion.
  function useStillIdle() {
    if (root.classList.contains('idle-still')) return;
    root.classList.add('idle-still');

    var sources = clipIdle.querySelectorAll('source');
    for (var i = 0; i < sources.length; i++) sources[i].removeAttribute('src');
    clipIdle.removeAttribute('src');
    clipIdle.load();
    clipIdle.classList.add('is-active');

    tapStart.hidden = true;
    syncOverlay();
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

  function onViewportChange() {
    pickSources();
    syncOverlay();
  }

  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);

  // Catches mobile browser chrome collapsing on scroll, which resizes the
  // stage without always firing a resize event.
  if (window.ResizeObserver) {
    new ResizeObserver(syncOverlay).observe(stage);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
