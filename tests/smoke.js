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
  // Spectral centroid of the output, in Hz (a rough "brightness" measure).
  const centroid = () => page.evaluate(() => {
    const a = engine.analyser, d = new Float32Array(a.frequencyBinCount);
    a.getFloatFrequencyData(d);
    const bin = engine.ctx.sampleRate / a.fftSize;
    let num = 0, den = 0;
    for (let i = 1; i < d.length; i++){ const p = Math.pow(10, d[i] / 10); num += p * i * bin; den += p; }
    return den ? num / den : 0;
  });
  const settle = (ms = 900) => page.waitForTimeout(ms);
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
  await page.locator('#ctrlSlot .sec', { has: page.locator('h3', { hasText: /^LFO 1$/ }) }).locator('.brow button').nth(2).click();
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

  // Stage 2 DSP: worklets, fold, FM, ladder, noise (all on the single-sine Init patch)
  check('AudioWorklet DSP active', await page.evaluate(() => engine.dsp && engine.voices[0].src instanceof AudioWorkletNode));
  const loadInit = async (tweak = '') => {
    await page.evaluate(t => { const p = clone(FACTORY.find(x => x.name === 'Init')); p.filter.cutoff = 18000; new Function('p', t)(p); loadPatch(p); }, tweak);
    await settle(1200);
  };
  await loadInit();
  const cSine = await centroid();
  await loadInit('p.oscs[0].fold = 0.8;');
  const cFold = await centroid();
  check('fold brightens the sound', cFold > cSine * 2, `${cSine.toFixed(0)} -> ${cFold.toFixed(0)} Hz`);
  await loadInit('p.oscs[0].fm = 1; p.oscs[5].ratio = "3/2";');   // index ≈ 2.7: centroid ≈ 160 Hz in theory
  const cFm = await centroid();
  check('FM (from muted osc 6) brightens osc 1', cFm > cSine * 1.5, `${cSine.toFixed(0)} -> ${cFm.toFixed(0)} Hz`);
  await loadInit('p.oscs[0].wave = "sawtooth"; p.filter.cutoff = 18000;');
  const cSaw = await centroid();
  await loadInit('p.oscs[0].wave = "sawtooth"; p.filter.type = "ladder"; p.filter.cutoff = 150; p.filter.q = 0.7;');
  const cLad = await centroid();
  check('ladder filter darkens a saw', cLad < cSaw * 0.6 && await rms() > 0.0005, `${cSaw.toFixed(0)} -> ${cLad.toFixed(0)} Hz`);
  await loadInit('p.oscs[0].on = false; p.noise.level = 0.8; p.noise.color = "white";');
  const cNoise = await centroid();
  check('noise source sounds', await rms() > 0.002 && cNoise > 2000, `centroid ${cNoise.toFixed(0)} Hz`);
  await page.click('.ostrip:nth-child(1) .obtns button:nth-child(2)');
  await settle(500);
  check('solo silences noise', await page.evaluate(() => engine.noiseLvl.gain.value < 0.01));
  const old = await page.evaluate(() => {
    const p = normalize({name: 'v0.1 patch', oscs: [{on: true, wave: 'warm', ratio: '3/2', oct: 0, detune: 1, level: 0.5, pan: 0, drift: 2}],
                         filter: {type: 'lowpass', cutoff: 900, q: 2}});
    return p.oscs[0].fold === 0 && p.oscs[0].fm === 0 && p.filter.drive === 0 && p.noise.level === 0 && p.oscs[0].ratio === '3/2';
  });
  check('v0.1 patches load with new settings off', old);

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
