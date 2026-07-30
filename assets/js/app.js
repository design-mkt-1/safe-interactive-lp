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
    uz: {
      // idle
      offerLine1: 'SEYFDA',
      offerLine2: '150 000 UZS BOR',
      offerSub:   'Yutug\u2018ingizni ko\u2018paytiring',
      openVault:  'SEYFNI OCHISH',
      hint:        'Skanerni bosib turing',
      hintHolding: 'Ushlab turing\u2026',
      granted:     'Ruxsat berildi',

      // reveal
      revealKicker:   'SEYF OCHILDI!',
      offerPrimary:   '55 000 UZS',
      offerSecondary: 'Yutug\u2018ingizni ko\u2018paytiring',
      lockLabel:   'Sizda 10 daqiqa bor',
      lockSub:     '55 000 UZSni olish uchun ro\u2018yxatdan o\u2018ting',
      lockExpired: 'Muddat tugadi',
      toRegister:  'DAVOM ETISH',

      // register
      regAmount: '55 000 UZS.',
      regClaim:  'ALLAQACHON SIZNIKI!',
      regNote:   'Faqat ro\u2018yxatdan o\u2018tish qoldi',
      tabPhone:  'Mobil telefon',
      tabEmail:  'Elektron pochta',
      phonePlaceholder: '90-000-00-00',
      emailPlaceholder: 'email@example.com',
      bonusOptions: ['Casino bonusi', 'Sport bonusi', 'Bonussiz'],
      submit:   'DAVOM ETISH',
      formNote: 'Hisobingiz bormi? <a href="#login">Kirish</a>',

      errPhone: 'Telefon raqamingizni kiriting.',
      errEmail: 'Elektron pochtangizni kiriting.',
      errEmailInvalid: 'Elektron pochta manzili noto\u2018g\u2018ri.',

      tapStart: 'Boshlash uchun bosing',

      footerLegal:
        'Topbet. Qimor o\u2018yinlari qaramlik keltirishi mumkin \u2014 mas\u2019uliyat bilan o\u2018ynang. ' +
        'Faqat 18+. <a href="#responsible">Mas\u2019uliyatli o\u2018yin</a> \u00b7 ' +
        '<a href="#terms">Shartlar amal qiladi</a>'
    }    ,
    ru: {
      offerLine1: '\u0412 \u0421\u0415\u0419\u0424\u0415',
      offerLine2: '150 000 UZS',
      offerSub:   '\u0423\u043c\u043d\u043e\u0436\u044c\u0442\u0435 \u0441\u0432\u043e\u0439 \u0432\u044b\u0438\u0433\u0440\u044b\u0448',
      openVault:  '\u041e\u0422\u041a\u0420\u042b\u0422\u042c \u0421\u0415\u0419\u0424',
      hint:        '\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0438 \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439\u0442\u0435',
      hintHolding: '\u0423\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0439\u0442\u0435\u2026',
      granted:     '\u0414\u043e\u0441\u0442\u0443\u043f \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043d',

      revealKicker:   '\u0421\u0415\u0419\u0424 \u041e\u0422\u041a\u0420\u042b\u0422!',
      offerPrimary:   '55 000 UZS',
      offerSecondary: '\u0423\u043c\u043d\u043e\u0436\u044c\u0442\u0435 \u0441\u0432\u043e\u0439 \u0432\u044b\u0438\u0433\u0440\u044b\u0448',
      lockLabel:   '\u0423 \u0432\u0430\u0441 \u0435\u0441\u0442\u044c 10 \u043c\u0438\u043d\u0443\u0442',
      lockSub:     '\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c 55 000 UZS',
      lockExpired: '\u0412\u0440\u0435\u043c\u044f \u0438\u0441\u0442\u0435\u043a\u043b\u043e',
      toRegister:  '\u041f\u0420\u041e\u0414\u041e\u041b\u0416\u0418\u0422\u042c',

      regAmount: '55 000 UZS.',
      regClaim:  '\u0423\u0416\u0415 \u0412\u0410\u0428\u0418!',
      regNote:   '\u041e\u0441\u0442\u0430\u043b\u043e\u0441\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f',
      tabPhone:  '\u041c\u043e\u0431\u0438\u043b\u044c\u043d\u044b\u0439 \u0442\u0435\u043b\u0435\u0444\u043e\u043d',
      tabEmail:  '\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0430\u044f \u043f\u043e\u0447\u0442\u0430',
      phonePlaceholder: '90-000-00-00',
      emailPlaceholder: 'email@example.com',
      bonusOptions: ['\u0411\u043e\u043d\u0443\u0441 \u043a\u0430\u0437\u0438\u043d\u043e', '\u0421\u043f\u043e\u0440\u0442\u0438\u0432\u043d\u044b\u0439 \u0431\u043e\u043d\u0443\u0441', '\u0411\u0435\u0437 \u0431\u043e\u043d\u0443\u0441\u0430'],
      submit:   '\u041f\u0420\u041e\u0414\u041e\u041b\u0416\u0418\u0422\u042c',
      formNote: '\u0423\u0436\u0435 \u0435\u0441\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442? <a href="#login">\u0412\u043e\u0439\u0442\u0438</a>',

      errPhone: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430.',
      errEmail: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u0443\u044e \u043f\u043e\u0447\u0442\u0443.',
      errEmailInvalid: '\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0430\u0434\u0440\u0435\u0441 \u044d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u043e\u0439 \u043f\u043e\u0447\u0442\u044b.',

      tapStart: '\u041d\u0430\u0436\u043c\u0438\u0442\u0435, \u0447\u0442\u043e\u0431\u044b \u043d\u0430\u0447\u0430\u0442\u044c',

      footerLegal:
        'Topbet. \u0410\u0437\u0430\u0440\u0442\u043d\u044b\u0435 \u0438\u0433\u0440\u044b \u043c\u043e\u0433\u0443\u0442 \u0432\u044b\u0437\u0432\u0430\u0442\u044c \u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0441\u0442\u044c \u2014 \u0438\u0433\u0440\u0430\u0439\u0442\u0435 \u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u043e. ' +
        '\u0422\u043e\u043b\u044c\u043a\u043e 18+. <a href="#responsible">\u041e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u0438\u0433\u0440\u0430</a> \u00b7 ' +
        '<a href="#terms">\u0423\u0441\u043b\u043e\u0432\u0438\u044f</a>'
    }
  };

  // Only the two locales the campaign ships. The header control switches
  // between them at runtime; nothing is baked into the video, so the swap is
  // pure text.
  var LOCALES = ['uz', 'ru'];
  var LOCALE_KEY = 'topbet.vault.locale';

  var ACTIVE_LOCALE = 'uz';
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
  // Landscape puts the vault left of centre so the content card has the right
  // half to itself, per the Figma desktop layout. Portrait stacks instead, so
  // it stays centred with the copy below.
  var VAULT_TARGET = {
    portrait:  { x: 0.500, y: 0.500 },
    landscape: { x: 0.300, y: 0.500 }
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
  var LOCK_MINUTES  = 10;                 // bonus reservation window
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
  var openVault   = $('openVault');
  var tabPhone    = $('tabPhone');
  var tabEmail    = $('tabEmail');
  var rowPhone    = $('rowPhone');
  var rowEmail    = $('rowEmail');

  var contactMode = 'phone';   // which of the two the visitor is filling in
  var lang        = $('lang');
  var langBtn     = $('langBtn');
  var langMenu    = $('langMenu');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ *
   * Copy injection
   * ------------------------------------------------------------------ */

  function paint() {
    $('offerLine1').textContent = t.offerLine1;
    $('offerLine2').textContent = t.offerLine2;
    $('offerSub').textContent   = t.offerSub;
    openVault.textContent       = t.openVault;
    $('scanHint').textContent   = t.hint;
    $('grantedText').textContent = t.granted;

    $('revealKicker').textContent   = t.revealKicker;
    $('offerPrimary').textContent   = t.offerPrimary;
    $('offerSecondary').textContent = t.offerSecondary;
    $('lockLabel').textContent      = t.lockLabel;
    $('lockSub').textContent        = t.lockSub;
    $('toRegister').textContent     = t.toRegister;

    $('regAmount').textContent = t.regAmount;
    $('regClaim').textContent  = t.regClaim;
    $('regNote').textContent   = t.regNote;
    $('tabPhoneText').textContent = t.tabPhone;
    $('tabEmailText').textContent = t.tabEmail;
    $('fPhone').placeholder = t.phonePlaceholder;
    $('fEmail').placeholder = t.emailPlaceholder;

    var sel = $('fBonus');
    sel.innerHTML = '';
    t.bonusOptions.forEach(function (label, i) {
      var o = document.createElement('option');
      o.value = String(i); o.textContent = label;
      sel.appendChild(o);
    });

    $('submitBtn').textContent = t.submit;
    $('formNote').innerHTML    = t.formNote;
    $('tapStartText').textContent = t.tapStart;
    $('footerLegal').innerHTML = t.footerLegal;

    scanner.setAttribute('aria-label', t.hint);
    openVault.setAttribute('aria-label', t.openVault);
  }

  /* ------------------------------------------------------------------ *
   * Language
   *
   * Only the copy changes — the footage carries no text, which is what makes
   * switching locales this cheap.
   * ------------------------------------------------------------------ */

  function setLocale(code) {
    if (!COPY[code]) return;
    ACTIVE_LOCALE = code;
    t = COPY[code];

    document.documentElement.lang = code;
    $('langCurrent').textContent = code.toUpperCase();

    Array.prototype.forEach.call(langMenu.children, function (li) {
      var btn = li.firstChild;
      btn.setAttribute('aria-selected', String(btn.dataset.lang === code));
    });

    try { window.localStorage.setItem(LOCALE_KEY, code); } catch (err) { /* private mode */ }

    paint();
    setContactMode(contactMode);   // re-apply the tab labels and placeholders
  }

  function buildLangMenu() {
    langMenu.innerHTML = '';
    LOCALES.forEach(function (code) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang__option';
      btn.dataset.lang = code;
      btn.textContent = code.toUpperCase();
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(code === ACTIVE_LOCALE));
      btn.addEventListener('click', function () {
        setLocale(code);
        closeLang();
      });
      li.appendChild(btn);
      langMenu.appendChild(li);
    });
  }

  function openLang()  { lang.classList.add('is-open');  langMenu.hidden = false;
                         langBtn.setAttribute('aria-expanded', 'true'); }
  function closeLang() { lang.classList.remove('is-open'); langMenu.hidden = true;
                         langBtn.setAttribute('aria-expanded', 'false'); }

  /* ------------------------------------------------------------------ *
   * Contact method tabs
   * ------------------------------------------------------------------ */

  function setContactMode(mode) {
    contactMode = mode;
    var phone = mode === 'phone';

    tabPhone.classList.toggle('is-active', phone);
    tabEmail.classList.toggle('is-active', !phone);
    tabPhone.setAttribute('aria-selected', String(phone));
    tabEmail.setAttribute('aria-selected', String(!phone));

    rowPhone.hidden = !phone;
    rowEmail.hidden = phone;

    // Clear the hidden field's error so a stale message cannot block submit.
    $(phone ? 'errEmail' : 'errPhone').textContent = '';
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

    // Published so tooling can assert the vault landed where it was asked to,
    // rather than assuming it should be centred — on desktop it deliberately
    // is not.
    s.setProperty('--vault-target-x', String(target.x));
    s.setProperty('--vault-target-y', String(target.y));
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
    var ok = true;

    if (contactMode === 'phone') {
      var digits = $('fPhone').value.replace(/\D/g, '');
      ok = setError('fPhone', 'errPhone', digits.length >= 7 ? '' : t.errPhone) && ok;
    } else {
      var email = $('fEmail').value.trim();
      var msg = !email ? t.errEmail
              : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : t.errEmailInvalid;
      ok = setError('fEmail', 'errEmail', msg) && ok;
    }

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
      method:  contactMode,
      contact: contactMode === 'phone'
        ? '+998' + $('fPhone').value.replace(/\D/g, '')
        : $('fEmail').value.trim(),
      bonus:   $('fBonus').options[$('fBonus').selectedIndex].text
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
    var saved = null;
    try { saved = window.localStorage.getItem(LOCALE_KEY); } catch (err) { /* ignore */ }

    buildLangMenu();
    paint();
    setContactMode('phone');
    if (saved && COPY[saved] && saved !== ACTIVE_LOCALE) setLocale(saved);
    else $('langCurrent').textContent = ACTIVE_LOCALE.toUpperCase();
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

  // CTA #2 — the tap alternative to holding the scanner. Same destination, so
  // the interaction is discoverable for anyone who does not try a long press.
  openVault.addEventListener('click', function () {
    if (state !== 'idle' && state !== 'scanning') return;
    if (holdRAF) { cancelAnimationFrame(holdRAF); holdRAF = null; }
    unlock();
  });

  langBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (lang.classList.contains('is-open')) closeLang(); else openLang();
  });
  document.addEventListener('click', function (e) {
    if (!lang.contains(e.target)) closeLang();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLang();
  });

  tabPhone.addEventListener('click', function () { setContactMode('phone'); });
  tabEmail.addEventListener('click', function () { setContactMode('email'); });

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
