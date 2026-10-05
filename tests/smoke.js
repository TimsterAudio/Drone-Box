// Drone Box smoke test: loads drone-box.html in headless Chromium and checks the basics.
//
// Run from the repo root:
//   node tests/smoke.js
// Needs Playwright with Chromium: `npm i -g playwright && npx playwright install chromium`
// (if Playwright is installed globally, run as: NODE_PATH="$(npm root -g)" node tests/smoke.js)

const path = require('path');
const { chromium } = require('playwright');

const FILE = 'file://' + path.resolve(__dirname, '..', 'drone-box.html');
let failures = 0;
function check(name, ok, detail = ''){
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await page.goto(FILE);
  await page.evaluate(() => { localStorage.clear(); loadPatch(FACTORY[0]); });

  const rms = () => page.evaluate(() => {
    const a = engine.analyser, d = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(d);
    let s = 0; for (const v of d) s += v * v;
    return Math.sqrt(s / d.length);
  });
  const gains = () => page.evaluate(() => new Promise(r =>
    setTimeout(() => r(engine.voices.map(v => +v.lvl.gain.value.toFixed(2))), 500)));

  // Playback
  await page.click('#play');
  await page.waitForTimeout(1500);
  check('plays audio', await rms() > 0.005);
  check('status shows PLAY', (await page.textContent('#lcd1b')) === 'PLAY');

  // Every factory preset loads and sounds
  const count = await page.evaluate(() => FACTORY.length);
  for (let i = 0; i < count; i++){
    await page.selectOption('#presetSel', 'f:' + i);
    await page.waitForTimeout(400);
    const name = await page.evaluate(() => patch.name);
    check(`preset "${name}" sounds`, await rms() > 0.001);
  }
  await page.selectOption('#presetSel', 'f:0');

  // Knob drag changes the patch
  const detune0 = await page.evaluate(() => patch.oscs[0].detune);
  const k = (await page.$$('.ostrip .knob'))[3], kb = await k.boundingBox();
  await page.mouse.move(kb.x + kb.width / 2, kb.y + kb.height / 2);
  await page.mouse.down();
  await page.mouse.move(kb.x + kb.width / 2, kb.y - 40, { steps: 5 });
  await page.mouse.up();
  check('knob drag changes detune', await page.evaluate(() => patch.oscs[0].detune) > detune0);

  // Stepped knob via keyboard
  const ik = (await page.$$('.ostrip .knob'))[2];
  await ik.focus(); await page.keyboard.press('ArrowUp');
  check('stepped knob steps interval', await page.evaluate(() => patch.oscs[0].ratio) === '16/15');

  // Fader track click
  const f = (await page.$$('.ostrip .fader'))[0], fb = await f.boundingBox();
  await page.mouse.click(fb.x + fb.width / 2, fb.y + fb.height * 0.25);
  const lvl = await page.evaluate(() => patch.oscs[0].level);
  check('fader track click jumps', lvl > 0.7 && lvl < 0.9, lvl.toFixed(2));

  // LED buttons
  await page.click('#ctrlSlot .sec:nth-child(2) .brow button:nth-child(3)');
  check('LFO destination button', await page.evaluate(() => patch.lfos[0].target) === 'pitch');

  // Mute / solo (Tanpura Fifths: osc 6 is muted)
  await page.evaluate(() => loadPatch(FACTORY[0]));
  const btn = (i, k) => page.click(`.ostrip:nth-child(${i}) .obtns button:nth-child(${k})`);
  let g = await gains();
  check('muted osc is silent', g[5] === 0 && g[0] > 0, g.join(' '));
  await btn(2, 2);
  g = await gains();
  check('solo plays only that osc', g[1] > 0 && g.filter((v, i) => i !== 1).every(v => v === 0), g.join(' '));
  await btn(6, 2);
  g = await gains();
  check('solo overrides mute', g[5] > 0, g.join(' '));
  await btn(1, 1);
  check('mute is saved in patch', await page.evaluate(() => patch.oscs[0].on === false));
  await page.evaluate(() => loadPatch(FACTORY[2]));
  check('patch load clears solo', await page.evaluate(() => engine.solo.size === 0));

  // Theme switch
  await page.click('#themeSlot .brow button:nth-child(2)');
  check('silver panel switch', await page.evaluate(() => document.documentElement.dataset.theme) === 'silver');

  // Stop
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  check('space stops', (await page.textContent('#lcd1b')) !== 'PLAY');

  // Layout
  await page.setViewportSize({ width: 1280, height: 900 });
  const tops = await page.$$eval('.ostrip', a => new Set(a.map(e => Math.round(e.getBoundingClientRect().top))).size);
  check('six strips on one row at 1280px', tops === 1);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(100);
  check('no sideways scroll at phone width', !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));

  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})();
