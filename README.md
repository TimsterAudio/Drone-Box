# Drone Box

Timster's Audio Works · **v0.1.0**

A drone synthesizer that runs entirely in one browser tab. It has no install, server or account, and nothing is sent anywhere.

## Running it

Open `drone-box.html` in a Chromium-based browser (Chrome, Edge or Brave). Firefox and Safari should work but haven't been tested yet.

Press **Play** or hit **Space**. Browsers only allow audio to start after a click or key press, so that's always the first step.

## What's in v0.1

- **6 oscillators.** Each one has:
  - waveform: Sine, Triangle, Warm, Saw, Hollow, Square or Organ
  - a just-intonation interval (1/1, 3/2, 5/4, 7/4…) plus an octave shift
  - fine detune (±25 cents) for slow beating between oscillators
  - level and pan
  - Mute and Solo
  - Drift: a slow random pitch wander, like an analog oscillator
- **Root:** note, octave, the A4 reference pitch (e.g. 432 Hz) and glide time for pitch changes.
- **Filter:** low-pass, band-pass, high-pass or notch, with cutoff and resonance.
- **2 LFOs.** Each can control filter cutoff, pitch, volume or pan. On pan, odd and even oscillators move in opposite directions.
- **Swell:** fade-in and fade-out times of up to 60 s each.
- **Delay:** repeats get darker each time.
- **Reverb:** a generated impulse response with decay up to 15 s.
- **Output:** master volume, a safety limiter, L/R meters, a scope and a log-frequency spectrum.
- **Patches:** factory presets, Randomize, saving your own patches in browser storage, and Export/Import as JSON.

## Playing the panel

The panel is styled after classic Roland Jupiter-series synths: a black panel (or Silver, switchable on the panel), knurled knobs, slider caps with a white line, and LED buttons.

- **Knobs and faders:** drag up or down. Hold **Shift** while dragging for fine control. Click anywhere on a fader's track to jump there.
- **Keyboard:** click a control to focus it, then use the arrow keys (Shift for finer steps), Page Up/Down, or Home/End.
- **Reset:** double-click any knob or fader to return it to its value when the patch loaded.
- **Mute / Solo:** each oscillator has a Mute button (saved with the patch) and a Solo button. When any oscillator is soloed, only the soloed ones play, even if they're muted. Solo isn't saved and clears when you load a patch.
- **Displays:** the red LED display at the top shows the patch name, play state, and the last control you touched.

## Fonts

These fonts are embedded in the file (base64 WOFF2), so it never fetches anything from the network. All four are under the SIL Open Font License 1.1:

- [Michroma](https://fonts.google.com/specimen/Michroma) (Vernon Adams)
- [Barlow Semi Condensed](https://fonts.google.com/specimen/Barlow+Semi+Condensed) (Jeremy Tribby)
- [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) (Carrois Apostrophe)
- [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (Florian Karsten), the Timster's Audio Works wordmark, shared with Spool

## Signal flow

```
6 × osc → level → pan ─┐
                       bus → filter → amp (tremolo) ─┬─ dry ─────────────┐
                                                     ├─ delay ⟲ tone ────┤
                                                     └─ reverb ──────────┤
                                                                         sum → swell → master → limiter → out
```

## Project docs

| File | What it's for |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | What changed in each version |
| [ROADMAP.md](ROADMAP.md) | Where it's heading, stage by stage, plus a backlog of small items |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is laid out: audio graph, patch format, UI control system, how to add a parameter |
| [docs/DESIGN.md](docs/DESIGN.md) | Panel design rules: colours, fonts, which control to use for what |
| [CLAUDE.md](CLAUDE.md) | Working conventions for Claude Code sessions on this repo |

## Testing

`tests/smoke.js` drives the page in headless Chromium and checks playback, presets, controls, mute/solo and layout:

```sh
npm i -g playwright && npx playwright install chromium   # once
NODE_PATH="$(npm root -g)" node tests/smoke.js
```
