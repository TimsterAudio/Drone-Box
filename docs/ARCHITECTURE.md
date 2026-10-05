# Architecture

How Drone Box is put together, for whoever works on it next.

## Ground rules

- **One file.** The whole instrument is `drone-box.html`: markup, CSS, embedded fonts and script. There's no build step, package manager or server. You open the file and it runs.
- **Fully offline.** No network requests at runtime: no CDNs, web fonts, analytics or update checks. Fonts are embedded as base64 WOFF2. New assets get embedded the same way.
- **The engine and the UI are separate.** The `Engine` class knows nothing about the DOM. The UI reads and writes the `patch` object, then calls the matching `engine.apply…()` method.

## Script layout

The `<script>` block is split into sections with `/* ---------- Name ---------- */` banners, in this order:

| Section | What it holds |
|---|---|
| Constants | `VERSION`, note names, interval ratios, wave list, LFO targets and shapes, storage keys |
| Patch model | `defaultPatch()`, `normalize()`, `preset()`, the `FACTORY` presets |
| Helpers | `$`, `el`, `store` (safe localStorage), pitch maths (`rootHz`, `oscHz`), formatters |
| Audio engine | `class Engine`: builds the Web Audio graph and applies patch values |
| Panel display | `lcd`: the two-line LED display |
| UI controls | `mapper`, `bindControl`, `knob`, `fader`, `hwButton`, `buttons`, `section` |
| App | the `patch` and `engine` instances, `ui.setStatus`, theme, `render()` |
| Patches | the preset menu, save, delete, export, import, randomize |
| Transport | Play/Stop and the Space bar |
| Visualisers | the scope, spectrum and segmented meters (`draw()` on requestAnimationFrame) |
| Boot | starts everything |

## Audio graph

```
osc ─► level ─► pan ─┐   (× 6, always running; muting sets level to 0)
                     ▼
                    bus (0.22 headroom) ─► filter ─► amp ─┬─► dry ─────────────────────────┐
                                                          ├─► delaySend ─► delay ─► fbTone ─┼─► delayOut ─┐
                                                          │                  ▲         │    │             │
                                                          │                  └── fb ◄──┘    │             │
                                                          └─► revSend ◄───────────────────────────────────┘
                                                                 └─► convolver ────────────►┤
                                                                                           sum ─► env (swell) ─► master ─► limiter ─► out
                                                                                                                              └─► analysers
```

- The **oscillators run continuously** once the context exists. Play and Stop only move the `env` gain, so there are no clicks from starting or stopping oscillators. After a stop, the context is suspended once the fade-out plus effect tails are done.
- **Every parameter change goes through `Engine.T()`** (`setTargetAtTime`), so knob moves never click. Pitch changes use the patch's glide time.
- **LFOs** are oscillators feeding a depth gain, which is connected to the target AudioParam:
  - filter cutoff goes through `filter.detune` (in cents, so the sweep is exponential)
  - pitch goes to each oscillator's `detune`
  - volume goes to `amp.gain`, and `applyAmpBase()` lowers the base gain so tremolo never boosts the level
  - pan goes through an inverting gain, so odd and even oscillators move in opposite directions
- **Drift** is a JavaScript random walk every 150 ms, written to each oscillator's `detune` on top of the patch detune.
- **Mute and solo** both go through `Engine.audible(i)`. If any oscillator is soloed, only soloed ones play; otherwise `osc.on` (mute) decides. `engine.solo` is a `Set` and isn't part of the patch.
- The **reverb impulse** is generated: decaying stereo noise that darkens over time. It's rebuilt, with a debounce, when the decay changes.

## Patch format

A patch is plain JSON. This is what Export writes and what's stored in localStorage:

```jsonc
{
  "name": "Tanpura Fifths",
  "root":   { "note": 0, "octave": 2, "a4": 440, "glide": 0.5 },      // note: 0 = C … 11 = B
  "oscs": [                                                            // always 6
    { "on": true, "wave": "warm", "ratio": "3/2", "oct": 0,           // on = NOT muted
      "detune": 1.5, "level": 0.5, "pan": 0.25, "drift": 3 }
  ],
  "filter": { "type": "lowpass", "cutoff": 1800, "q": 1.2 },
  "lfos":   [ { "target": "filter", "shape": "sine", "rate": 0.07, "depth": 0.3 } ],  // always 2
  "env":    { "attack": 6, "release": 8 },
  "delay":  { "time": 0.45, "feedback": 0.4, "tone": 2500, "mix": 0.2 },
  "reverb": { "decay": 6, "mix": 0.45 },
  "master": { "volume": 0.7 }
}
```

`normalize()` merges any incoming object onto `defaultPatch()`. Missing keys get defaults, unknown keys are dropped, and wrongly typed values are ignored. **That's what keeps old patches loading, so add new fields to `defaultPatch()`. Never rename or repurpose existing ones.** If a breaking change is ever unavoidable, add a format version field first (it's on the backlog).

### Browser storage keys

| Key | Holds |
|---|---|
| `dronebox.last` | the current patch, autosaved 300 ms after any change |
| `dronebox.patches` | your saved patches, as `{ name: patch }` |
| `dronebox.theme` | `"dark"` or `"silver"` |

## UI control system

Every continuous or stepped control goes through `bindControl()`. That gives every control the same dragging, keyboard support, double-click reset, ARIA slider role, tooltip and LED-display behaviour.

```js
knob({ label, name?, min, max, scale?: 'lin'|'log', step?, fmt, short?, get, set, size?: 'sm'|'md'|'lg' })
knob({ label, options: [[value, text], …], fmt, get, set })   // stepped knob, with a small readout display
fader({ label, name?, min, max, scale?, step?, fmt, get, set, tall? })
buttons({ label, name?, options: [[value, text, iconSvg?], …], color, get, set })   // LED radio row
hwButton(text, colorClass, iconSvg?)                                           // single LED button
```

- `get` and `set` read and write the patch. `set` should also call the right `engine.apply…()` and `changed()` (which autosaves).
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

`tests/smoke.js` loads the page in headless Chromium (Playwright). It checks:
- audio plays
- every factory preset loads
- the knobs, faders and buttons change the patch
- mute and solo silence the right oscillators
- the layout doesn't overflow at phone width
- there are no page errors

Run it before every merge (see the README).
