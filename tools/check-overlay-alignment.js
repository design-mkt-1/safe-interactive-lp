/**
 * Verify the overlays stay locked to the same point of the FOOTAGE as the
 * viewport changes, and that the vault lands on the target position declared in VAULT_TARGET
 * — which is deliberately off-centre on desktop, so this checks against the
 * declared value rather than assuming the middle.
 *
 *   npm i playwright                       # once
 *   python3 -m http.server 8000 &
 *   node tools/check-overlay-alignment.js  # exits non-zero on failure
 *
 * Reads the geometry app.js actually published (--vid-*) rather than
 * recomputing it. Recomputing would only prove the page agrees with a copy of
 * its own maths — and it silently went stale the moment the placement model
 * changed from plain cover to focal-point cover.
 *
 * This cannot prove the anchor sits on the vault, only that it is stable and
 * centred. For that, screenshot with the overlay hidden and check the plate
 * against a coordinate grid; see docs/asset-pipeline.md.
 */

const { chromium } = require('playwright');

const URL = process.env.URL || 'http://localhost:8000/index.html';
const CHROME = process.env.CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const SIZES = [
  [320, 568, 'iPhone SE'],  [360, 640, 'Android sm'],  [375, 812, 'iPhone X'],
  [390, 844, 'iPhone 14'],  [414, 896, 'iPhone Plus'], [430, 932, 'Pro Max'],
  [360, 780, 'Pixel'],      [768, 1024, 'iPad port'],  [820, 1180, 'iPad Air'],
  [1024, 768, 'iPad land'], [1280, 800, 'laptop'],     [1440, 900, 'desktop'],
  [1600, 1200, '4:3 mon'],  [1920, 1080, 'FHD'],       [2560, 1440, 'QHD'],
  [3440, 1440, 'ultrawide'],
];

const TOLERANCE = 0.05;   // percent, in video coordinates

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });

  console.log('viewport      label         anchor_vid%      vault_screen%     size');
  const seen = {};
  let worstDrift = 0, worstCentre = 0;

  for (const [w, h, label] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(450);

    const m = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const num = n => parseFloat(cs.getPropertyValue(n));
      const stage = document.getElementById('stage').getBoundingClientRect();
      const s = document.getElementById('scanner').getBoundingClientRect();

      // where the video actually is, as published by app.js
      const vx = num('--vid-x'), vy = num('--vid-y');
      const vw = num('--vid-w'), vh = num('--vid-h');

      const cx = s.x + s.width / 2 - stage.x;
      const cy = s.y + s.height / 2 - stage.y;

      return {
        fx: (cx - vx) / vw,          // anchor as a fraction of the footage
        fy: (cy - vy) / vh,
        sx: cx / stage.width,        // and as a fraction of the screen
        sy: cy / stage.height,
        tx: num('--vault-target-x'), // where app.js was asked to put it
        ty: num('--vault-target-y'),
        size: s.width,
        landscape: matchMedia('(orientation: landscape)').matches && innerWidth >= 900,
      };
    });

    const key = m.landscape ? 'landscape' : 'portrait';
    if (!seen[key]) seen[key] = [m.fx, m.fy];

    const drift = Math.max(Math.abs(m.fx - seen[key][0]),
                           Math.abs(m.fy - seen[key][1])) * 100;
    const offTarget = Math.max(Math.abs(m.sx - m.tx), Math.abs(m.sy - m.ty)) * 100;
    worstDrift = Math.max(worstDrift, drift);
    worstCentre = Math.max(worstCentre, offTarget);

    console.log(
      `${w}x${h}`.padEnd(13), label.padEnd(13),
      `${(m.fx * 100).toFixed(2)}, ${(m.fy * 100).toFixed(2)}`.padEnd(16),
      `${(m.sx * 100).toFixed(2)}, ${(m.sy * 100).toFixed(2)}`.padEnd(17),
      m.size.toFixed(0).padStart(5));

    await ctx.close();
  }

  await browser.close();

  console.log(`\nworst drift in video coordinates : ${worstDrift.toFixed(4)}%`);
  console.log(`worst deviation from target       : ${worstCentre.toFixed(4)}%`);

  let failed = false;

  // NaN fails every comparison, so an unreadable measurement would slip past
  // both checks below and report PASS having verified nothing.
  if (!Number.isFinite(worstDrift) || !Number.isFinite(worstCentre)) {
    console.error('\nFAIL: measurement produced NaN — the page did not publish ' +
                  'the expected custom properties');
    process.exit(1);
  }

  if (worstDrift > TOLERANCE) {
    console.error(`\nFAIL: overlays are not tracking the footage (> ${TOLERANCE}%)`);
    failed = true;
  }
  if (worstCentre > TOLERANCE) {
    console.error(`FAIL: the vault is not landing on its declared target (> ${TOLERANCE}%)`);
    failed = true;
  }
  if (failed) process.exit(1);
  console.log('\nPASS');
})();
