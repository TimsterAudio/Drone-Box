# Architecture

How Drone Box is put together, for whoever works on it next.

## Ground rules

- **One file.** The whole instrument is `drone-box.html`: markup, CSS, embedded fonts and script. There's no build step, package manager or server. You open the file and it runs.
- **Optional launchers.** `Launch on Mac.command`, `Launch on Windows.bat` and `Launch on Linux.sh` open the page in a Chromium browser's app mode (`--app=… --window-size=1920,930`), giving a clean, stand-alone window. They're conveniences around the one file, adapted from Spool's launchers; the page doesn't depend on them. `.gitattributes` keeps the `.bat` file on CRLF line endings and the shell scripts on LF.
  - **Browser choice:** each launcher first looks up the system default browser and uses it if it's Chromium-based. Windows reads `HKCU\…\UrlAssociations\https\UserChoiceLatest` or `UserChoice` through PowerShell, macOS reads the LaunchServices https handler, and Linux uses `xdg-settings`. Otherwise it falls back to a fixed search order.
  - **Extra flags:** every launch passes `--no-first-run --no-default-browser-check`. Without them, a rarely used browser shows its welcome page and drops the app-mode URL.
  - **Page address on Windows:** PowerShell turns the page's path into a fully %-encoded `file:///` URL (spaces, `'`, `&`, brackets and other characters cmd treats specially are all encoded), and it's passed to the browser **without quotes**. An earlier version stored a quoted address in a variable (`set "ARGS=--app="…""`). On a real Windows machine the quotes reached the browser with the address, and Chrome and Brave opened their home page instead of the app. A Chromium test confirms that a literally quoted `--app` value does exactly that. Spool's launcher, which quotes directly on the `start` line, works even from a folder with a space, so the variable was the problem, not the space. The encoded value is only ever read as `!ARGS!` (delayed expansion), so cmd never re-reads its `%` codes. If PowerShell is missing, the launcher falls back to the quoted form.
  - **Missing page:** if `drone-box.html` isn't next to the `.bat` (for example, it was run from inside the zip without extracting), the launcher says so and stops.
  - **Testing on Windows:** set `DRONEBOX_DRYRUN=1` and the Windows launcher prints the command it would run instead of starting a browser.
- **Fully offline.** No network requests at runtime: no CDNs, web fonts, analytics or update checks. Fonts are embedded as base64 WOFF2. New assets get embedded the same way.
- **The engine and the UI are separate.** The `Engine` class knows nothing about the DOM. The UI reads and writes the `patch` object, then calls the matching `engine.apply…()` method.

## Script layout

The `<script>` block is split into sections with `/* ---------- Name ---------- */` banners, in this order:

| Section | What it holds |
|---|---|
| Constants | `VERSION`, note names, interval ratios, wave list, LFO targets and shapes, storage keys |
| Patch model | `defaultPatch()`, `normalize()`, `preset()`, the `FACTORY` presets |
| Helpers | `$`, `el`, `store` (safe localStorage), pitch maths (`rootHz`, `oscHz`), formatters |
| (DSP worklet) | separate `<script type="text/plain" id="dsp-worklet">`: the `db-osc`, `db-ladder` and `db-noise` processors |
| Audio engine | `class Engine`: loads the worklets, builds the Web Audio graph, applies patch values |
| Panel display | `lcd`: the two-line LED display |
| UI controls | `mapper`, `bindControl`, `knob`, `fader`, `hwButton`, `buttons`, `section` |
| App | the `patch` and `engine` instances, `POPS`, `ui.setStatus`, theme, `render()` |
| Keys | `keysSec` (one persistent section), `renderKeys()`, the strip bed (`bindBed`), computer-keyboard playing (`keysKeyDown`/`keysKeyUp`) |
| Panel / Play view | `view`, `setView()`, `applyView()`: the Play view swaps the bottom row for the Keys |
| Pop-out windows | `POP_SPECS`, `popOut()`, `adopt()`, `popIn()`, the Window/Dock tabs and the reopen glow |
| Patches | the preset menu, save, delete, export, import, randomize |
| Transport | Play/Stop, and `onKeyDown`/`onKeyUp` (Space, plus the Keys), attached to every window |
| Visualisers | the scope, spectrum and segmented meters; `drawLoop(win)` runs one loop per window and draws the canvases that live in it |
| Fit to window | `fitToWindow()`: lays the page out at 1920 px and scales it with CSS `zoom` to fit any window (there is no phone layout) |
| Boot | starts everything |

## Audio graph

```
          ┌──── FM ring: each osc's raw output → next osc's FM input (6 → 1 via a delay) ────┐
osc ─► level ─► pan ─┐   (× 6, always running; muting sets level to 0)
noise ─► level ─► pan ┤
                      ▼
                     bus (0.22 headroom) ─┬─► biquad filter ─► bqOut ─┐
                                          └─► ladder filter ─► ldOut ─┴─► amp ─┬─► dry ─────────────────────────┐
                                                           ├─► delaySend ─► delay ─► fbTone ─┼─► delayOut ─┐
                                                           │                  ▲         │    │             │
                                                           │                  └── fb ◄──┘    │             │
                                                           └─► revSend ◄───────────────────────────────────┘
                                                                  └─► convolver ────────────►┤
                                                                                            sum ─► master ─► limiter ─► out
                                                                                                                 └─► analysers
```

The swell `env` sits on the drone path only (between `amp` and the dry and effect sends), so the delay and reverb tails ring out after Stop, and the Keys are heard whether or not the drone is playing:

```
key voice ×4:  osc ─► pre ─► tanh shaper ─► post ─┬─► biquad ─► bqOut ─┐
                                                  └─► ladder ─► ldOut ─┴─► press ─► vca ─► pan ─┐
                                                                                 keysOut (tremolo) ─┬─► sum
                                                                                                    ├─► delaySend
                                                                                                    └─► revSend
Keys LFO (kLfo) ─┬─► vibDepth ─► each voice's osc detune
                 ├─► kLfoFilt ─► each voice's biquad and ladder detune
                 └─► kLfoAmp  ─► keysOut.gain
```

- The **oscillators run continuously** once the context exists. Play and Stop only move the `env` gain, so there are no clicks from starting or stopping oscillators. After a stop, the context is suspended once the fade-out plus effect tails are done.
- **Every continuous parameter change goes through `Engine.T()`** (`setTargetAtTime`), so knob moves never click. Pitch changes use the patch's glide time.
  - **Discrete selectors** use `Engine.set()` (`setValueAtTime`) instead, so they jump rather than gliding through in-between values. These are the wavetable index and the noise colour.
- **LFOs** are oscillators feeding a depth gain, which is connected to the target AudioParam:
  - filter cutoff goes to the `detune` param of both filters (in cents, so the sweep is exponential)
  - pitch goes to each oscillator's `detune`
  - volume goes to `amp.gain`, and `applyAmpBase()` lowers the base gain so tremolo never boosts the level
  - pan goes through an inverting gain, so odd and even oscillators move in opposite directions
- **Drift** is a JavaScript random walk every 150 ms, written to each oscillator's `detune` on top of the patch detune.
- **Mute and solo** both go through `Engine.audible(i)`. If any oscillator is soloed, only soloed ones play; otherwise `osc.on` (mute) decides. `engine.solo` is a `Set` and isn't part of the patch. The noise source is silent while any solo is active.
- **Both filters always run.** `applyFilter()` crossfades `bqOut` and `ldOut`, so switching to or from Ladder never clicks. Filter Q maps to ladder resonance through `qToRes()`, so one Reso fader drives both filters.
- **Held notes that lose their voice** stay in `keysUI.active` and wait. When a sounding note is released, `noteOff()` gives the freed voice to the latest waiting note, which glides from the released pitch (legato in Mono). A latched note that loses its voice is dropped instead.
- **Keys** have four voices (Voices limits how many are used), separate from the drone and not through its filter. **Drive** is a fixed tanh curve: `pre` scales the signal into it and `post` restores the peak level, so 0% is nearly clean. For Ladder, the shaper stays clean and the ladder's own drive is used; the biquad and ladder outputs crossfade like the drone's. `keyOn(id, hz, p)` takes a free voice or steals the oldest: a silent voice jumps to the new pitch, a sounding one glides (Keys Glide). `keyMove()` slides pitch and pressure, `keyOff()` starts the release. Pressure `p` (0–1) drives `press` (level) and `tone` (cutoff), as the Pressure setting says. `wake()` starts or resumes the context for the Keys, and `scheduleSuspend()` only suspends once the drone is stopped and `keysBusy()` is false.
- The **reverb impulse** is generated: decaying stereo noise that darkens over time. It's rebuilt, with a debounce, when the decay changes.

## DSP worklets

The custom DSP lives in `<script type="text/plain" id="dsp-worklet">`, so the page itself never runs it. `Engine.build()` loads its text into the AudioContext as an AudioWorklet module.
- **Loading:** it tries a `data:` URL first, because Chrome rejects `blob:` worklet modules on pages opened from `file://`, then a `blob:` URL.
- **Fallback:** if neither loads, `engine.dsp` stays `false` and the engine uses native OscillatorNodes and the biquad filter only (the v0.1 sound). Fold, FM, Ladder and Noise then do nothing, and the LED display says "Basic audio mode".
- The engine gets the module text through its constructor, so it still doesn't touch the DOM.

| Processor | What it does | Params |
|---|---|---|
| `db-osc` | Wavetable oscillator. FM comes from audio input 0, and an optional sine wavefolder follows the table read. | `frequency`, `detune` (a-rate); `wave` (index into `WAVE_IDS`), `fold` 0–1, `fm` 0–8 (k-rate) |
| `db-ladder` | Four-pole ladder low-pass with tanh saturation (simplified Huovilainen model), in stereo | `frequency`, `detune` (a-rate); `resonance` 0–1.1, `drive` 0–1 (k-rate) |
| `db-noise` | White, pink (Paul Kellet's filter) or brown (leaky integrator) noise | `color` 0/1/2 (k-rate) |

- **Wavetables** are built once per AudioContext, in the worklet's global scope, and shared by all six oscillators.
  - Each wave gets 11 octave bands (fundamentals from 20 Hz up). Each band holds only the harmonics that stay below Nyquist for the band's highest note.
  - The oscillator crossfades between the two bands around its *instantaneous* frequency (including FM), so it stays alias-free while sweeping.
  - Measured on a sawtooth at 3.5 kHz: aliases are about 107 dB down, against about 21 dB for a naive sawtooth.
- **Wave order** in `WAVE_IDS` (worklet) must match `WAVES` (main script). `WAVE_INDEX` maps from one to the other.
- **FM** is linear and through-zero: `freq × (1 + fm × modulator)`. The UI knob is squared and scaled by 4, so 100% gives a peak deviation of 4× the carrier frequency. The FM ring takes each oscillator's **pre-level** output, so a muted oscillator can act as a pure modulator.
- **Wavefolder:** `x + mix × (sin(π/2 · gain · x) − x)`, with gain from 1 to 8. High fold settings can alias, since there's no oversampling yet.
- **Gating:** every processor has a k-rate `on` param. At 0 it outputs silence and skips its work. The engine (`gateDrone()`, `gateKey()`, `gateParam()`) schedules it:
  - drone oscillators, noise and ladder: on while the drone plays, off once the Stop fade has died away (`droneEnd`); noise only while its level is up; the ladder only while Ladder is selected
  - Keys voices: on while held, off when the release has died away (`v.endAt`); each voice's ladder only while the Keys filter is Ladder
- **Block-rate maths:** the oscillator and ladder compute pitch and cutoff at the start and end of each 128-sample block and interpolate in between, rather than calling `pow`/`exp`/`log2` per sample. The oscillator picks its wavetable band once per block unless FM is on.
- **No allocation in `process()`.** Garbage collection on the audio thread causes dropouts, so processors only use buffers made in their constructors.
- **Sample rate:** if the device runs above 48 kHz, `build()` makes the context at 48 kHz (`engine.deviceRate` keeps the device's rate for the footer readout).
- **Cost:** measured with an offline render of the full graph (drone with drift, FM and fold, both LFOs, Ladder, noise, 8 s reverb, four Keys notes with the Keys LFO and Ladder), at 48 kHz: v0.2.0 18.5% of one core, v0.3.0 30.6%, now 19.5% with Keys held and 16.1% with Keys idle. Keep new DSP gated and block-rate where possible; real-time audio needs plenty of headroom, especially on Windows.

## Patch format

A patch is plain JSON. This is what Export writes and what's stored in localStorage:

```jsonc
{
  "name": "Tanpura Fifths",
  "root":   { "note": 0, "octave": 2, "a4": 440, "glide": 0.5 },      // note: 0 = C … 11 = B
  "oscs": [                                                            // always 6
    { "on": true, "wave": "warm", "ratio": "3/2", "oct": 0,           // on = NOT muted
      "detune": 1.5, "level": 0.5, "pan": 0.25, "drift": 3,
      "fold": 0, "fm": 0 }                                             // 0–1 each (added in 0.2)
  ],
  "noise":  { "color": "pink", "level": 0, "pan": 0 },                // white | pink | brown (added in 0.2)
  "filter": { "type": "lowpass", "cutoff": 1800, "q": 1.2,            // type: lowpass | bandpass | highpass | notch | ladder
              "drive": 0 },                                            // drive: ladder only (added in 0.2)
  "lfos":   [ { "target": "filter", "shape": "sine", "rate": 0.07, "depth": 0.3 } ],  // always 2
  "env":    { "attack": 6, "release": 8 },
  "delay":  { "time": 0.45, "feedback": 0.4, "tone": 2500, "mix": 0.2 },
  "reverb": { "decay": 6, "mix": 0.45 },
  "master": { "volume": 0.7 },
  "keys":   { "wave": "triangle", "octave": 2, "scale": "all",       // added in 0.3; scale: all | penta | major | minor | bhairav | harm
              "glide": 0.15, "vibrato": 0.1, "tone": 0.6, "attack": 0.05, "release": 1.5,
              "level": 0.6, "pan": 0, "pressure": "both",             // pressure: level | tone | both
              "latch": false, "voices": 4,                            // voices: 1 (mono) – 4
              "filter": "lowpass", "reso": 0.7, "drive": 0,           // tone is the cutoff (0–1 → 150 Hz – 19 kHz); filter: lowpass | bandpass | highpass | ladder
              "lfoShape": "sine", "lfoRate": 5.5, "lfoFilter": 0, "lfoLevel": 0,   // vibrato is the LFO's pitch depth
              "tune": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }       // cents per strip (13, the last is the octave), ±50
}
```

`normalize()` merges any incoming object onto `defaultPatch()`. It skips arrays, so `keys.tune` is copied by hand (numbers only, clamped to ±50). Missing keys get defaults, unknown keys are dropped, and wrongly typed values are ignored. **That's what keeps old patches loading, so add new fields to `defaultPatch()`. Never rename or repurpose existing ones.** If a breaking change is ever unavoidable, add a format version field first (it's on the backlog).

### Browser storage keys

| Key | Holds |
|---|---|
| `dronebox.last` | the current patch, autosaved 300 ms after any change |
| `dronebox.patches` | your saved patches, as `{ name: patch }` |
| `dronebox.theme` | `"dark"` or `"silver"` |
| `dronebox.knobs` | `"caps"` (Colour) or `"pointers"` (Pointer) |
| `dronebox.view` | `"panel"` or `"play"` |
| `dronebox.pops` | names of the sections that were in their own window (they glow, ready to reopen) |
| `dronebox.popgeom` | each pop-out window's last size (and position, for popups) |

## UI control system

Every continuous or stepped control goes through `bindControl()`. That gives every control the same dragging, keyboard support, double-click reset, ARIA slider role, tooltip and LED-display behaviour.

```js
knob({ label, name?, fam?, min, max, scale?: 'lin'|'log', step?, fmt, short?, get, set, size?: 'sm'|'md'|'lg', readout? })
knob({ label, fam?, options: [[value, text], …], fmt, get, set })   // stepped knob
fader({ label, name?, fam?, min, max, scale?, step?, fmt, get, set, tall? })
buttons({ label, name?, options: [[value, text, iconSvg?], …], color, get, set })   // LED radio row
hwButton(text, colorClass, iconSvg?)                                           // single LED button
```

- `get` and `set` read and write the patch. `set` should also call the right `engine.apply…()` and `changed()` (which autosaves).
- `fam` is the colour family: `'pitch'`, `'tone'` or `'mod'`, or leave it out for neutral (see DESIGN.md).
- Every knob and fader gets a permanent readout under its label. `short(value)` can give a shorter text for that readout than `fmt`; the Interval knob uses it to show just the ratio.
- `step` sets a control's value grid. Without one, linear controls snap to 0.01 and log controls to 3 significant figures (`mapper().quant`). Shift + arrow calls `mapper().nudge`, which moves exactly one grid step from the current value.
- `name` is what the LED display shows, for example "Osc 3 detune". It defaults to `label`.
- `render()` rebuilds the whole panel from `patch`. It runs on boot and on every patch load, so controls hold no state of their own.

### Adding a new parameter

1. Add it to `defaultPatch()` with a sensible default.
2. Wire it into the engine: build the node in `init()`, and set the value in an `apply…()` method that `applyAll()` calls.
3. Add a control in `render()` that reads and writes the patch and calls the apply method.
4. Give it a value in any factory presets where it matters, and in Randomize if that makes sense.
5. Update the CHANGELOG under **Unreleased**.

## Theming

Colours are CSS custom properties on `:root`. `[data-theme="silver"]` overrides the panel, legend and frame colours. The knobs, displays and coloured keys keep the same colours on both panels, as they would on real hardware. See [DESIGN.md](DESIGN.md) for the visual rules.

## Testing

See [TESTING.md](../TESTING.md). `tests/smoke.js` is the automated check run before every merge. `testing/Drone Box Test Checklist.html` is the manual checklist for human testers. It's a separate offline page, not part of the instrument.

## Pop-out windows

A section can move into a window of its own and back. `POP_SPECS` lists the sections that can: **Monitor** (an ordinary popup) and **Keys** (`pip: true`).
- **Opening:** `popOut(name)` needs a click (browsers allow one new window per click). Keys asks for a Document Picture-in-Picture window first, which stays on top of other windows; only one is allowed per page. If that isn't available, Keys falls back to a `window.open` popup, like Monitor.
- **Adopting:** `adopt()` copies the page's `<style>` blocks and the theme and knob attributes into the new window, leaves a placeholder (`.popholder`, with a Bring back button) where the section was, and moves the **live** section element into the window. Event handlers, controls and state come along, because nothing is rebuilt.
  - Code that touches a moved element must hold a reference to it, never look it up with `$()` on the main document. The visualiser canvases live in `VIS` for this reason, and `keysSec` is created once and refilled by `renderKeys()`.
  - Controls use pointer capture, not document-level listeners, so they work in any window.
  - Each window gets its own `drawLoop(win)` (its own requestAnimationFrame), plus the key handlers and a blur handler that lets go of held computer keys.
- **Closing:** the window's `pagehide` calls `popIn()`, which puts the section back in place of the placeholder. `popIn()` removes the entry from `POPS` first, so closing from either side is safe. Closing the main page closes every pop-out.
- **Next time:** `dronebox.pops` remembers which windows were open. Their Window tab (and View › Keys) glows, and one click reopens each.

## Engine seam (toward a native engine)

The ROADMAP's **Engine pathway** moves the sound engine to Rust, first as WebAssembly in the browser, then natively in a desktop app. It depends on the panel talking to the engine only through a small interface. Keep that interface clean when adding features.

**The panel may call:** `play()`, `stop()`, `wake()`, the `apply…()` methods, `keyOn()` / `keyMove()` / `keyOff()` / `keysAllOff()`, and `audible()`. It may read `running`, `solo` and `p` (the patch).

**Leaks to remove in Phase 1** (the panel reads Web Audio internals directly today):

| Read today | Used for | Replace with |
|---|---|---|
| `engine.ctx` (state, sample rate, latency, playoutStats) | status display, footer readout, visualiser liveness | `status()` |
| `engine.analyser`, `engine.anL`, `engine.anR` | scope, spectrum, meters | `scope(buf)`, `spectrum(buf)`, `levels()` |
| `engine.keyMap` | Keys glow, KEYS status, held-note logic | `notesSounding()` / `isSounding(id)` |
| `engine.ready`, `engine.dsp`, `engine.deviceRate` | various checks, footer | `status()` |

The smoke test also reads internals (voice params, gates) to verify the DSP. That's fine for tests, but those checks will move to an engine-level test suite when the engine moves to Rust.

