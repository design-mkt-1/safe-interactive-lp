const { chromium } = require('playwright');
const SIZES = [
  [320,568,'iPhone SE'],[360,640,'Android sm'],[375,812,'iPhone X'],
  [390,844,'iPhone 14'],[414,896,'iPhone Plus'],[430,932,'Pro Max'],
  [360,780,'Pixel'],[768,1024,'iPad port'],[820,1180,'iPad Air'],
  [1024,768,'iPad land'],[1280,800,'laptop'],[1440,900,'desktop'],
  [1600,1200,'4:3 mon'],[1920,1080,'FHD'],[2560,1440,'QHD'],[3440,1440,'ultrawide'],
];
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--autoplay-policy=no-user-gesture-required'] });
  console.log('viewport      label        anchorX_vid%  anchorY_vid%   scanPx   drift');
  let base = null, worst = 0;
  for (const [w,h,label] of SIZES) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8000/index.html', { waitUntil:'domcontentloaded' });
    await p.waitForTimeout(450);
    const m = await p.evaluate(() => {
      const stage = document.getElementById('stage').getBoundingClientRect();
      const s = document.getElementById('scanner').getBoundingClientRect();
      const v = document.getElementById('clipIdle');
      const land = window.matchMedia('(orientation: landscape)').matches && innerWidth>=900;
      const aspect = (v.videoWidth&&v.videoHeight) ? v.videoWidth/v.videoHeight : (land?16/9:9/16);
      // recompute cover geometry independently, then express the scanner
      // centre as a fraction of the VIDEO's own rendered area
      let vw,vh;
      if (stage.width/stage.height > aspect){ vw=stage.width; vh=stage.width/aspect; }
      else { vh=stage.height; vw=stage.height*aspect; }
      const ox=(stage.width-vw)/2, oy=(stage.height-vh)/2;
      const cx = (s.x + s.width/2  - stage.x - ox) / vw;
      const cy = (s.y + s.height/2 - stage.y - oy) / vh;
      return {cx, cy, size:s.width, land};
    });
    const key = m.land ? 'L' : 'P';
    if (!base) base = {};
    if (base[key] === undefined) base[key] = [m.cx, m.cy];
    const dx = Math.abs(m.cx - base[key][0])*100, dy = Math.abs(m.cy - base[key][1])*100;
    const drift = Math.max(dx,dy); if (drift>worst) worst=drift;
    console.log(
      String(w+'x'+h).padEnd(13), label.padEnd(12),
      (m.cx*100).toFixed(3).padStart(11), (m.cy*100).toFixed(3).padStart(13),
      m.size.toFixed(0).padStart(8), (drift.toFixed(4)+'%').padStart(10));
    await ctx.close();
  }
  console.log('\n>>> WORST DRIFT IN VIDEO COORDINATES: ' + worst.toFixed(4) + '%');
  await b.close();
})();
