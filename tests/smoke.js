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

  // Fine control: Shift+arrow moves exactly one grid step, and every control lands on exact values
  await page.evaluate(() => { loadPatch(FACTORY.find(x => x.name === 'Init')); });
  const ctl = (sec, label) => page.locator('.sec', { has: page.locator('h3', { hasText: new RegExp('^' + sec + '$') }) })
    .locator('.cw', { has: page.locator('.cl', { hasText: new RegExp('^' + label + '$') }) }).locator('.knob, .fader').first();
  await ctl('Root', 'A4 Tune').focus();
  const a4 = [];
  for (let i = 0; i < 5; i++){ await page.keyboard.press('Shift+ArrowUp'); a4.push(await page.evaluate(() => patch.root.a4)); }
  for (let i = 0; i < 5; i++){ await page.keyboard.press('Shift+ArrowDown'); a4.push(await page.evaluate(() => patch.root.a4)); }
  check('A4 fine steps are exactly 0.1 Hz', a4.join(' ') === '440.1 440.2 440.3 440.4 440.5 440.4 440.3 440.2 440.1 440', a4.join(' '));
  await ctl('Filter', 'Cutoff').focus();
  await page.keyboard.press('Shift+ArrowUp');
  check('log control fine step is 3 significant figures', await page.evaluate(() => patch.filter.cutoff) === 4010);
  // Every continuous knob and fader: Shift+Up then Shift+Down returns exactly to where it was.
  const roundTrip = await page.evaluate(async () => {
    const bad = [];
    const nodes = [...document.querySelectorAll('.knob:not(.step), .fader')];
    for (const n of nodes){
      const label = n.closest('.cw').querySelector(':scope > .cl').textContent;
      const read = () => n.getAttribute('aria-valuetext');
      const key = (k) => n.dispatchEvent(new KeyboardEvent('keydown', {key: k, shiftKey: true, bubbles: true}));
      const before = read();
      key('ArrowDown'); key('ArrowUp');    // move off and back (handles controls sitting at their maximum)
      const mid = read();
      key('ArrowUp'); key('ArrowDown');
      if (read() !== mid) bad.push(label + ': ' + mid + ' -> ' + read());
    }
    return {count: nodes.length, bad};
  });
  check('every control returns exactly after fine up/down', roundTrip.bad.length === 0, `${roundTrip.count} controls ${roundTrip.bad.slice(0, 4).join('; ')}`);
  const onGrid = await page.evaluate(() => {
    const vals = [...patch.oscs.flatMap(o => [o.level, o.pan, o.fold, o.fm]), patch.master.volume, patch.delay.mix, patch.reverb.mix, patch.lfos[0].depth];
    return vals.every(v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9);
  });
  check('percent and pan values sit on the 1% grid', onGrid);
  const fold0 = page.locator('.ostrip').first().locator('.cw', { has: page.locator('.cl', { hasText: /^Fold$/ }) }).locator('.knob');
  await fold0.scrollIntoViewIfNeeded();
  const fb0 = await fold0.boundingBox();
  await page.mouse.move(fb0.x + fb0.width / 2, fb0.y + fb0.height / 2); await page.mouse.down();
  await page.mouse.move(fb0.x + fb0.width / 2, fb0.y - 37, { steps: 7 }); await page.mouse.up();
  const foldV = await page.evaluate(() => patch.oscs[0].fold);
  check('dragged values land on the grid', foldV > 0.2 && Math.abs(foldV * 100 - Math.round(foldV * 100)) < 1e-9, String(foldV));

  // Readouts: every knob and fader has a permanent value display, and there are no hover pop-ups
  const ro = await page.evaluate(() => ({
    controls: document.querySelectorAll('.knob, .fader').length,
    withReadout: [...document.querySelectorAll('.knob, .fader')].filter(n => n.closest('.cw').querySelector(':scope > .mlcd')).length,
    tips: document.querySelectorAll('.tip').length }));
  check('every knob and fader has a readout', ro.controls > 0 && ro.withReadout === ro.controls && ro.tips === 0, `${ro.withReadout}/${ro.controls}`);

  // Knob colours: Colour (caps) by default, Pointer as the alternate; families tagged
  check('knob colour default is Colour', await page.evaluate(() => document.documentElement.dataset.knobs) === 'caps');
  await page.click('#knobSlot .brow button:nth-child(2)');
  check('knob style switch to Pointer', await page.evaluate(() => document.documentElement.dataset.knobs === 'pointers' && localStorage.getItem('dronebox.knobs') === '"pointers"'));
  const fams = await page.evaluate(() => ['pitch', 'tone', 'mod'].map(f => document.querySelectorAll('.fam-' + f).length));
  check('knob families tagged (pitch, tone, mod)', fams.every(n => n > 0), fams.join('/'));
  await page.click('#knobSlot .brow button:nth-child(1)');

  // Theme switch
  await page.click('#themeSlot .brow button:nth-child(2)');
  check('silver panel switch', await page.evaluate(() => document.documentElement.dataset.theme) === 'silver');

  // Stop
  await page.keyboard.press('Space');
  await page.waitForTimeout(200);
  check('space stops', (await page.textContent('#lcd1b')) !== 'PLAY');

  // Layout
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.waitForTimeout(100);
  const hd = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth,
    strips: new Set([...document.querySelectorAll('.ostrip')].map(e => Math.round(e.getBoundingClientRect().top))).size,
    ctrl: new Set([...document.querySelectorAll('#ctrlSlot > .sec')].map(e => Math.round(e.getBoundingClientRect().top))).size }));
  check('whole panel fits 1920x900', hd.h <= 900 && hd.w <= 1920 && hd.strips === 1 && hd.ctrl === 1, JSON.stringify(hd));
  // Fit to window: laptop and app-window sizes scale the whole panel, never scroll, never wrap
  for (const [w, h] of [[1366, 768], [1920, 825], [2560, 1400]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(150);
    const f = await page.evaluate(() => ({
      fitted: document.documentElement.classList.contains('fitted'),
      scroll: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth,
      strips: new Set([...document.querySelectorAll('.ostrip')].map(e => Math.round(e.getBoundingClientRect().top))).size,
      ctrl: new Set([...document.querySelectorAll('#ctrlSlot > .sec')].map(e => Math.round(e.getBoundingClientRect().top))).size,
      zoom: document.body.style.zoom }));
    check(`panel scales to fit ${w}x${h}`, f.fitted && f.scroll && f.strips === 1 && f.ctrl === 1, `zoom ${f.zoom}`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const tops = await page.$$eval('.ostrip', a => new Set(a.map(e => Math.round(e.getBoundingClientRect().top))).size);
  check('six strips on one row at 1280px', tops === 1);
  // Tablets (and small laptop windows) scale the whole panel too, in both views and orientations
  for (const [w, h, name] of [[820, 1180, 'tablet portrait'], [1180, 820, 'tablet landscape'], [1024, 768, '1024x768']]) {
    await page.setViewportSize({ width: w, height: h });
    for (const v of ['panel', 'play']) {
      await page.evaluate(v => setView(v), v);
      await page.waitForTimeout(100);
      const f = await page.evaluate(() => ({
        fitted: document.documentElement.classList.contains('fitted'),
        scroll: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth,
        strips: new Set([...document.querySelectorAll('.ostrip')].map(e => Math.round(e.getBoundingClientRect().top))).size,
        zoom: document.body.style.zoom }));
      check(`${name}: ${v} view scales to fit`, f.fitted && f.scroll && f.strips === 1, `zoom ${f.zoom}`);
    }
  }
  await page.evaluate(() => setView('panel'));

  // Header: everything on one row, including the View switch
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.waitForTimeout(100);
  const hdrRows = await page.evaluate(() => Math.abs($('#play').getBoundingClientRect().top - $('#lcd').getBoundingClientRect().top) < 60);
  check('top strip stays on one row', hdrRows);

  // Keys (Stage 3). Played with the drone stopped, so this also checks they sound without it.
  await page.evaluate(() => { if (engine.running) toggle(); loadPatch(FACTORY[0]); setView('play'); });
  await page.waitForTimeout(200);
  const pv = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight, ctrlHidden: $('#ctrlSlot').hidden,
    keys: !!$('#playSlot .keys-sec'), strips: document.querySelectorAll('.kstrip').length }));
  check('Play view shows Keys and fits 1920x900', pv.h <= 900 && pv.ctrlHidden && pv.keys && pv.strips === 13, JSON.stringify(pv));
  const stripPt = (i, frac, pg = page) => pg.evaluate(([i, frac]) => {
    const q = keysUI.strips[i].el.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height * frac };
  }, [i, frac]);
  const voice = () => page.evaluate(() => {
    const v = engine.keyVoices.find(v => v.id);
    return v ? { hz: v.freq.value, gain: v.vca.gain.value, press: v.press.gain.value, n: engine.keyMap.size } : { n: 0 };
  });
  let pt = await stripPt(7, 0.2);
  await page.mouse.move(pt.x, pt.y); await page.mouse.down();
  await page.waitForTimeout(600);
  let v1 = await voice();
  const want7 = await page.evaluate(() => keyHz(patch, 7));
  check('strip plays its interval (drone stopped)', v1.n === 1 && Math.abs(v1.hz - want7) < 0.5 && v1.gain > 0.1 && !(await page.evaluate(() => engine.running)),
    `${v1.hz && v1.hz.toFixed(2)} Hz, want ${want7.toFixed(2)}, gain ${v1.gain && v1.gain.toFixed(3)}`);
  check('Keys sound comes out', (await rms()) > 0.005);
  check('status shows KEYS', (await page.textContent('#lcd1b')) === 'KEYS');
  pt = await stripPt(7, 0.9);
  await page.mouse.move(pt.x, pt.y); await page.waitForTimeout(300);
  const v2 = await voice();
  check('height in the strip changes pressure', v2.press < v1.press - 0.3, `${v1.press.toFixed(2)} -> ${v2.press.toFixed(2)}`);
  pt = await stripPt(9, 0.5);
  await page.mouse.move(pt.x, pt.y, { steps: 6 }); await page.waitForTimeout(600);
  const v3 = await voice(), want9 = await page.evaluate(() => keyHz(patch, 9));
  check('dragging sideways glides to the next strip', v3.n === 1 && Math.abs(v3.hz - want9) < 1, `${v3.hz.toFixed(2)} Hz, want ${want9.toFixed(2)}`);
  await page.mouse.up(); await page.waitForTimeout(800);
  const v4 = await page.evaluate(() => ({ n: engine.keyMap.size, g: Math.max(...engine.keyVoices.map(v => v.vca.gain.value)) }));
  check('releasing a strip lets the note go', v4.n === 0 && v4.g < v3.gain * 0.8, `gain ${v4.g.toFixed(3)}`);

  // Latch
  await page.evaluate(() => { patch.keys.latch = true; renderKeys(); });
  pt = await stripPt(0, 0.3);
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(300);
  const latched = (await voice()).n;
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(200);
  check('Latch holds a note until pressed again', latched === 1 && (await voice()).n === 0, `held ${latched}`);
  await page.evaluate(() => { patch.keys.latch = false; renderKeys(); });

  // Computer keyboard and octave keys
  await page.keyboard.down('a'); await page.waitForTimeout(300);
  const ka = await voice(), want0 = await page.evaluate(() => keyHz(patch, 0));
  await page.keyboard.up('a'); await page.waitForTimeout(100);
  check('computer key A plays the first strip', ka.n === 1 && Math.abs(ka.hz - want0) < 0.5 && (await voice()).n === 0, `${ka.hz && ka.hz.toFixed(2)} Hz`);
  const oct0 = await page.evaluate(() => patch.keys.octave);
  await page.keyboard.press('x');
  check('X raises the Keys octave', (await page.evaluate(() => patch.keys.octave)) === Math.min(4, oct0 + 1));
  await page.keyboard.press('z');

  // Scale: strips outside it go dark and don't play
  await page.evaluate(() => { patch.keys.scale = 'penta'; renderKeys(); });
  const dark = await page.$$eval('.kstrip.off', a => a.length);
  pt = await stripPt(1, 0.3);
  await page.mouse.down(); await page.mouse.up();
  await page.mouse.move(pt.x, pt.y); await page.mouse.down(); await page.waitForTimeout(200);
  const offPlays = (await voice()).n;
  await page.mouse.up();
  check('Scale darkens strips outside it, and they stay silent', dark === 7 && offPlays === 0, `${dark} dark`);
  await page.evaluate(() => { patch.keys.scale = 'all'; renderKeys(); });

  // Tune mode: drag a strip up to retune it
  await page.click('.keys-sec .kbtns .hwb:nth-child(2)');
  pt = await stripPt(4, 0.5);
  await page.mouse.move(pt.x, pt.y); await page.mouse.down();
  await page.mouse.move(pt.x, pt.y - 40, { steps: 4 }); await page.mouse.up();
  const tuned = await page.evaluate(() => patch.keys.tune[4]);
  check('Tune mode retunes a strip by dragging', tuned === 10, `${tuned} cents`);
  await page.click('.keys-sec .kbtns .hwb:nth-child(2)');
  await page.evaluate(() => { patch.keys.tune[4] = 0; renderKeys(); });

  // Older patches gain the Keys defaults
  const oldKeys = await page.evaluate(() => { const p = clone(FACTORY[0]); delete p.keys; const n = normalize(p); return n.keys.tune.length === 13 && n.keys.wave === defaultPatch().keys.wave; });
  check('v0.2 patches get the Keys defaults', oldKeys);

  // Octave strip, voices, mono legato, the Keys filter and LFO
  const oct = await page.evaluate(() => ({ n: document.querySelectorAll('.kstrip').length, r: keyHz(patch, 12) / keyHz(patch, 0) }));
  check('13th strip plays the octave', oct.n === 13 && Math.abs(oct.r - 2) < 1e-9, JSON.stringify(oct));
  const held = async (keys, voices) => {
    await page.evaluate(v => { patch.keys.voices = v; renderKeys(); engine.applyKeys(); }, voices);
    for (const k of keys){ await page.keyboard.down(k); await page.waitForTimeout(60); }
    await page.waitForTimeout(150);
    const n = await page.evaluate(() => engine.keyMap.size);
    for (const k of keys) await page.keyboard.up(k);
    await page.waitForTimeout(100);
    return n;
  };
  const n4 = await held(['a', 's', 'd', 'f', 'g'], 4), n2 = await held(['a', 's', 'd'], 2);
  check('Voices sets how many notes sound together', n4 === 4 && n2 === 2, `4 -> ${n4}, 2 -> ${n2}`);
  await page.evaluate(() => { patch.keys.voices = 1; renderKeys(); });
  await page.keyboard.down('a'); await page.waitForTimeout(200);
  await page.keyboard.down('g'); await page.waitForTimeout(500);
  const m1 = await voice();
  await page.keyboard.up('g'); await page.waitForTimeout(600);
  const m2 = await voice();
  await page.keyboard.up('a'); await page.waitForTimeout(100);
  const hzA = await page.evaluate(() => keyHz(patch, 0)), hzG = await page.evaluate(() => keyHz(patch, 4));
  check('Mono glides back to the note still held', m1.n === 1 && Math.abs(m1.hz - hzG) < 1 && m2.n === 1 && Math.abs(m2.hz - hzA) < 1,
    `${m1.hz && m1.hz.toFixed(1)} -> ${m2.hz && m2.hz.toFixed(1)} Hz`);

  const holdCentroid = async setup => {
    await page.evaluate(s => { Object.assign(patch.keys, s); engine.applyKeys(); }, setup);
    await page.keyboard.down('a'); await page.waitForTimeout(500);
    const c = await centroid();
    await page.keyboard.up('a'); await page.waitForTimeout(50);
    return c;
  };
  await page.evaluate(() => { patch.keys.voices = 4; patch.keys.pressure = 'level'; patch.keys.release = 0.05;
    patch.reverb.mix = 0; patch.delay.mix = 0; engine.applyAll(); });    // no effect tails between measurements
  const cLp = await holdCentroid({ wave: 'sawtooth', tone: 0.3, filter: 'lowpass', drive: 0 });
  const cHp = await holdCentroid({ filter: 'highpass' });
  check('Keys filter type changes the tone', cHp > cLp * 2, `LPF ${cLp.toFixed(0)} Hz, HPF ${cHp.toFixed(0)} Hz`);
  const cLd = await holdCentroid({ filter: 'ladder' });
  check('Keys ladder filter sounds', cLd > 0 && cLd < cHp && await page.evaluate(() => engine.keyVoices[0].ldOut.gain.value > 0.9), `${cLd.toFixed(0)} Hz`);
  // Drive: the level of the 3rd harmonic on a sine, relative to the fundamental (with the filter open)
  const h3 = async drive => {
    await page.evaluate(d => { Object.assign(patch.keys, { wave: 'sine', filter: 'lowpass', tone: 1, drive: d }); engine.applyKeys(); }, drive);
    await page.keyboard.down('a'); await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const a = engine.analyser, d = new Float32Array(a.frequencyBinCount); a.getFloatFrequencyData(d);
      const bin = engine.ctx.sampleRate / a.fftSize, f = keyHz(patch, 0);
      const at = h => Math.max(...[-1, 0, 1].map(o => d[Math.round(h * f / bin) + o]));
      return at(3) - at(1);
    });
    await page.keyboard.up('a'); await page.waitForTimeout(50);
    return r;
  };
  const d0 = await h3(0), d1 = await h3(1);
  check('Keys drive adds harmonics', d1 > d0 + 20, `3rd harmonic ${d0.toFixed(0)} -> ${d1.toFixed(0)} dB`);
  await page.evaluate(() => { Object.assign(patch.keys, { lfoRate: 1, lfoLevel: 1, drive: 0 }); engine.applyKeys(); });
  await page.keyboard.down('a'); await page.waitForTimeout(400);
  const levels = await page.evaluate(async () => {           // the analyser window is ~1/3 s, so a slow LFO
    const out = [];
    for (let i = 0; i < 20; i++){
      const a = engine.analyser, d = new Float32Array(a.fftSize); a.getFloatTimeDomainData(d);
      let s = 0; for (const v of d) s += v * v; out.push(Math.sqrt(s / d.length));
      await new Promise(r => setTimeout(r, 50));
    }
    return out;
  });
  await page.keyboard.up('a');
  check('Keys LFO makes tremolo', Math.max(...levels) > Math.min(...levels) * 3, `${Math.min(...levels).toFixed(3)} .. ${Math.max(...levels).toFixed(3)}`);
  check('Keys LFO filter depth reaches the filter', await page.evaluate(() => { patch.keys.lfoFilter = 0.5; engine.applyKeys(); return true; })
    && (await page.waitForTimeout(300), await page.evaluate(() => Math.abs(engine.kLfoFilt.gain.value - 1200) < 5)));
  await page.evaluate(() => loadPatch(FACTORY[0]));
  await page.waitForTimeout(300);

  // Gating: DSP nobody can hear is switched off (this is what keeps slower machines from breaking up)
  const onv = () => page.evaluate(() => ({
    drone: engine.voices.map(v => v.on.value), droneLadder: engine.ladder.parameters.get('on').value,
    keys: engine.keyVoices.map(v => v.on.value), keyLadders: engine.keyVoices.map(v => v.ladder.parameters.get('on').value) }));
  await page.evaluate(async () => { patch.env.release = 0.1; patch.env.attack = 0.05; patch.keys.release = 0.05; patch.filter.type = 'lowpass'; engine.applyAll(); await engine.play(); });
  await page.waitForTimeout(300);
  let gs = await onv();
  check('playing drone runs its oscillators, not the unused ladder', gs.drone.every(x => x === 1) && gs.droneLadder === 0, JSON.stringify(gs));
  await page.evaluate(() => engine.stop());
  await page.waitForTimeout(800);
  gs = await onv();
  check('stopped drone switches its DSP off after the fade', gs.drone.every(x => x === 0) && gs.droneLadder === 0, JSON.stringify(gs.drone));
  check('idle Keys voices are switched off', gs.keys.every(x => x === 0) && gs.keyLadders.every(x => x === 0), JSON.stringify(gs.keys));
  await page.keyboard.down('a'); await page.waitForTimeout(300);
  gs = await onv();
  const keyOnSound = await rms();
  check('a Keys note switches its voice on and sounds', gs.keys.filter(x => x === 1).length === 1 && keyOnSound > 0.003, `rms ${keyOnSound.toFixed(4)}`);
  await page.evaluate(() => { patch.keys.filter = 'ladder'; engine.applyKeys(); });
  await page.waitForTimeout(100);
  check('Keys ladder runs only on a sounding voice', (await onv()).keyLadders.filter(x => x === 1).length === 1);
  await page.keyboard.up('a'); await page.waitForTimeout(500);
  check('released Keys voice switches off after its release', (await onv()).keys.every(x => x === 0));
  await page.evaluate(async () => { patch.filter.type = 'ladder'; engine.applyFilter(); await engine.play(); });
  await page.waitForTimeout(400);
  gs = await onv();
  check('drone comes back on Play, with its ladder when selected', gs.drone.every(x => x === 1) && gs.droneLadder === 1 && (await rms()) > 0.003);
  check('footer shows the audio engine', /Audio: \d+(\.\d)? kHz/.test(await page.textContent('#audioInfo')), await page.textContent('#audioInfo'));
  await page.evaluate(() => { engine.stop(); loadPatch(FACTORY[0]); });
  await page.waitForTimeout(200);

  {
  // Expression plates (0.4)
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.evaluate(() => { setView('play'); setStrips('both'); });
  await page.waitForTimeout(200);
  const ev = await page.evaluate(() => ({ plates: document.querySelectorAll('#playSlot .eplate').length, h: document.documentElement.scrollHeight }));
  check('Play view shows nine expression plates and fits 1920x900', ev.plates === 9 && ev.h <= 900, JSON.stringify(ev));
  await page.evaluate(() => setStrips('expr'));
  const sx = await page.evaluate(() => [exprSec.hidden, keysSec.hidden, store('dronebox.strips')]);
  await page.evaluate(() => setStrips('keys'));
  const sk = await page.evaluate(() => [exprSec.hidden, keysSec.hidden]);
  await page.evaluate(() => setStrips('both'));
  check('Keys / Expression / Both switch shows the right banks', sx[0] === false && sx[1] === true && sx[2] === 'expr' && sk[0] === true && sk[1] === false);
  // A test patch: OSC 1 alone, a sine at C4, filter wide open, no effects
  await page.evaluate(async () => {
    const p = clone(FACTORY[0]);
    p.root.octave = 4; p.filter = {type: 'lowpass', cutoff: 18000, q: 0.7, drive: 0};
    p.delay.mix = 0; p.reverb.mix = 0; p.lfos.forEach(l => l.depth = 0); p.noise.level = 0;
    p.oscs.forEach((o, i) => { o.on = i === 0; o.wave = 'sine'; o.fold = 0; o.fm = 0; o.drift = 0; o.detune = 0; o.ratio = '1/1'; o.oct = 0; o.level = 0.6; });
    p.env.attack = 0.05; p.env.release = 0.1;
    p.expr.attack = 0.02; p.expr.ret = 0.1;
    loadPatch(p); await engine.play();
  });
  await page.waitForTimeout(700);
  const platePt = (i, fy, dx = 0) => page.evaluate(([i, fy, dx]) => {
    const q = exprUI.plates[i].el.getBoundingClientRect(); return { x: q.left + q.width / 2 + dx * q.width, y: q.top + q.height * fy, w: q.width };
  }, [i, fy, dx]);
  const h3rel = (n = 3) => page.evaluate(n => {
    const a = engine.analyser, d = new Float32Array(a.frequencyBinCount); a.getFloatFrequencyData(d);
    const bin = engine.ctx.sampleRate / a.fftSize, f = oscHz(patch, 0);
    const at = h => Math.max(...[-1, 0, 1].map(o => d[Math.round(h * f / bin) + o]));
    return at(n) - at(1);
  }, n);
  const peakHz = () => page.evaluate(() => {
    const a = engine.analyser, d = new Float32Array(a.frequencyBinCount); a.getFloatFrequencyData(d);
    const bin = engine.ctx.sampleRate / a.fftSize, f = oscHz(patch, 0), lo = Math.floor(f * 0.9 / bin), hi = Math.ceil(f * 1.1 / bin);
    let k = lo; for (let i = lo; i <= hi; i++) if (d[i] > d[k]) k = i;
    const y0 = d[k - 1], y1 = d[k], y2 = d[k + 1], off = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2);
    return (k + off) * bin;
  });
  const fold0 = await h3rel();
  let pp = await platePt(0, 0.05);
  await page.mouse.move(pp.x, pp.y); await page.mouse.down(); await page.waitForTimeout(600);
  const fold1 = await h3rel();
  check('OSC plate height folds its oscillator', fold1 > fold0 + 20, `3rd harmonic ${fold0.toFixed(0)} -> ${fold1.toFixed(0)} dB`);
  const hz0 = await page.evaluate(() => oscHz(patch, 0));
  await page.mouse.move(pp.x + pp.w * 1.2, pp.y, { steps: 5 }); await page.waitForTimeout(600);
  const bent = await peakHz();
  const cents = 1200 * Math.log2(bent / hz0);
  check('sliding sideways bends the pitch', cents > 35 && cents < 65, `${cents.toFixed(1)} cents`);
  await page.mouse.up(); await page.waitForTimeout(800);
  const fold2 = await h3rel(), back = await peakHz();
  check('Spring: letting go returns to the panel settings', fold2 < fold0 + 6 && Math.abs(1200 * Math.log2(back / hz0)) < 5, `${fold2.toFixed(0)} dB, ${(1200 * Math.log2(back / hz0)).toFixed(1)} cents`);
  // Hold: stays after letting go; a tap lets it go
  await page.evaluate(() => { patch.expr.release = 'hold'; });
  await page.mouse.move(pp.x, pp.y); await page.mouse.down(); await page.waitForTimeout(300); await page.mouse.up(); await page.waitForTimeout(600);
  const held = await h3rel(), led = await page.evaluate(() => exprUI.plates[0].el.classList.contains('latched'));
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(700);
  const freed = await h3rel();
  check('Hold keeps a plate until it is tapped again', held > fold0 + 20 && led && freed < fold0 + 6, `${held.toFixed(0)} -> ${freed.toFixed(0)} dB`);
  await page.evaluate(() => { patch.expr.release = 'spring'; });
  // Swell: a muted oscillator comes in while its plate is held
  await page.evaluate(() => { patch.oscs[0].on = false; engine.applyOsc(0); });
  await page.waitForTimeout(500);
  const quiet = await rms();
  pp = await platePt(0, 0.7);
  await page.mouse.move(pp.x, pp.y); await page.mouse.down(); await page.waitForTimeout(500);
  const swelled = await rms();
  await page.mouse.up(); await page.waitForTimeout(600);
  check('Swell brings a muted oscillator in while its plate is held', swelled > 0.02 && quiet < swelled / 5 && (await rms()) < swelled / 3, `${quiet.toFixed(4)} -> ${swelled.toFixed(4)}`);
  // Filter plate opens a closed filter
  await page.evaluate(() => { patch.oscs[0].on = true; patch.oscs[0].wave = 'sawtooth'; patch.filter.cutoff = 300; engine.applyOsc(0); engine.applyFilter(); });
  await page.waitForTimeout(500);
  const cClosed = await h3rel(8);
  pp = await platePt(6, 0.05);
  await page.mouse.move(pp.x, pp.y); await page.mouse.down(); await page.waitForTimeout(500);
  const cOpen = await h3rel(8);
  await page.mouse.up();
  check('Filter plate sweeps the cutoff open', cOpen > cClosed + 20, `8th harmonic ${cClosed.toFixed(0)} -> ${cOpen.toFixed(0)} dB`);
  // Plate targets are saved with the patch; older patches get the defaults
  const tg = await page.evaluate(() => {
    patch.expr.plates[2].y = 'fm'; patch.expr.plates[2].x = 'pan';
    const back = normalize(JSON.parse(JSON.stringify(patch)));
    const old = clone(FACTORY[0]); delete old.expr;
    const n = normalize(old);
    return { kept: back.expr.plates[2].y === 'fm' && back.expr.plates[2].x === 'pan', old: n.expr.plates.length === 9 && n.expr.release === 'spring' };
  });
  check('plate targets are saved; older patches get the plate defaults', tg.kept && tg.old, JSON.stringify(tg));
  await page.evaluate(() => { engine.stop(); setView('panel'); loadPatch(FACTORY[0]); });
  await page.waitForTimeout(300);
  }

  // Pop-out windows. Headless Chromium has no Picture-in-Picture window, so Keys falls back to a popup too.
  await page.evaluate(() => setView('panel'));
  await page.evaluate(() => engine.play());
  await page.waitForTimeout(500);
  const [mon] = await Promise.all([page.context().waitForEvent('page'), page.click('.monitor .popbtn')]);
  await mon.setViewportSize({ width: 900, height: 420 });
  await page.waitForTimeout(600);
  const monState = await mon.evaluate(() => {
    const c = document.querySelector('#scope'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let red = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 140) red++;
    return { here: !!document.querySelector('.monitor'), red, w: c.width };
  });
  const holder = await page.evaluate(() => !!$('.popholder') && !$('.monitor'));
  check('Monitor pops out and keeps drawing', monState.here && monState.red > 50 && holder, JSON.stringify(monState));
  await mon.close(); await page.waitForTimeout(300);
  check('closing the window docks Monitor again', await page.evaluate(() => !!$('.side .monitor') && !$('.popholder')));

  await page.evaluate(() => engine.stop());
  // Headless Chromium gives Keys a real always-on-top (Picture-in-Picture) window, which Playwright can't
  // drive as a page, so events are sent into it directly.
  await page.click('#viewSlot .hwb:nth-child(3)');             // View > Keys, from the Panel view
  await page.waitForTimeout(500);
  const kp = await page.evaluate(async () => {
    const P = POPS.keys; if (!P) return { open: false };
    const d = P.win.document, strips = d.querySelectorAll('.kstrip'), bed = d.querySelector('.kbed');
    const q = strips[5].getBoundingClientRect();
    const ev = (type, y) => bed.dispatchEvent(new P.win.PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'mouse', button: 0,
      clientX: q.left + q.width / 2, clientY: q.top + q.height * y }));
    ev('pointerdown', 0.3);
    await new Promise(r => setTimeout(r, 400));
    const n1 = engine.keyMap.size, hz = engine.keyVoices.find(v => v.id)?.freq.value;
    ev('pointerup', 0.3);
    d.dispatchEvent(new P.win.KeyboardEvent('keydown', { code: 'KeyS', key: 's', bubbles: true }));
    await new Promise(r => setTimeout(r, 300));
    const n2 = engine.keyMap.size;
    d.dispatchEvent(new P.win.KeyboardEvent('keyup', { code: 'KeyS', key: 's', bubbles: true }));
    return { open: true, pip: P.pip, strips: strips.length, n1, n2, ok: Math.abs(hz - keyHz(patch, 5)) < 0.5 };
  });
  check('Keys open in an always-on-top window and play from it', kp.open && kp.pip && kp.strips === 13 && kp.n1 === 1 && kp.n2 === 1 && kp.ok, JSON.stringify(kp));
  const pw = await page.evaluate(async () => {
    const P = POPS.keys, d = P.win.document, plate = d.querySelectorAll('.eplate')[0], bed = d.querySelector('.ebed');
    const q = plate.getBoundingClientRect();
    const ev = type => plate.dispatchEvent(new P.win.PointerEvent(type, { bubbles: true, pointerId: 9, pointerType: 'mouse', button: 0, clientX: q.left + q.width / 2, clientY: q.top + q.height * 0.3 }));
    ev('pointerdown');
    await new Promise(r => setTimeout(r, 100));
    const on = plate.classList.contains('on'), keys = engine.exprSrc ? [...engine.exprSrc.keys()] : [];
    ev('pointerup');
    return { plates: d.querySelectorAll('.eplate').length, on, fold: keys.includes('o0.fold') };
  });
  check('expression plates play from the Performance window', pw.plates === 9 && pw.on && pw.fold, JSON.stringify(pw));
  await page.evaluate(() => setView('play'));
  check('Play view leaves Keys in their window', await page.evaluate(() => !$('#playSlot .keys-sec') && !!$('#playSlot .popholder')));
  await page.click('.popholder button'); await page.waitForTimeout(300);
  check('Bring back docks Keys in the Play view', await page.evaluate(() => !POPS.keys) && await page.evaluate(() => !!$('#playSlot .keys-sec')));
  await page.evaluate(() => setView('panel'));

  // A window that was open last time lights its tab, ready to reopen with one click
  await page.evaluate(() => localStorage.setItem('dronebox.pops', JSON.stringify(['monitor'])));
  await page.reload(); await page.waitForTimeout(300);
  check('last session\'s windows light their tab', await page.evaluate(() => $('.monitor .popbtn').classList.contains('pending')));
  await page.evaluate(() => localStorage.removeItem('dronebox.pops'));
  await page.setViewportSize({ width: 1400, height: 900 });

  // Release hygiene: the panel shows VERSION, and the tester checklist is for the same version
  const fs = require('fs');
  const ver = f => (fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8').match(/const VERSION = '([\d.]+)'/) || [])[1];
  const appVer = ver('drone-box.html'), listVer = ver('testing/Drone Box Test Checklist.html');
  check('tester checklist version matches the app', appVer && appVer === listVer, `app ${appVer}, checklist ${listVer}`);
  check('panel shows the version', (await page.textContent('#ver')) === 'v' + appVer);

  check('no page errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})();
