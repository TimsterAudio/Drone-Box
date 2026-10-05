# Changelog

All notable changes to Drone Box are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/). Until 1.0, a minor bump (0.x.0) marks a new stage or feature set, and a patch bump (0.x.y) marks fixes and small tweaks.

## [Unreleased]

_Nothing yet._

## [0.1.0] — 2026-10-05

The foundation release: a complete six-oscillator drone synth with a Jupiter-style hardware panel, in a single offline HTML file.

### Sound
- Six oscillators, each with:
  - waveform: Sine, Triangle, Warm, Saw, Hollow, Square or Organ (the last three are custom harmonic recipes)
  - just-intonation interval (12 ratios from 1/1 to 15/8) and octave shift (−2 to +3)
  - fine detune (±25 cents)
  - level and pan
  - Drift: a slow random pitch wander of up to ±20 cents
- Root note, octave (0–4), A4 reference (400–480 Hz) and glide time (10 ms to 10 s).
- Filter: low-pass, band-pass, high-pass or notch, with cutoff and resonance.
- Two LFOs with sine, triangle, square or saw shapes, rate from 0.005 Hz to 12 Hz, and destinations: filter cutoff (±4 oct), pitch (±30 ¢), volume (tremolo) or pan. On pan, odd and even oscillators move in opposite directions.
- Swell envelope: fade in and fade out, 50 ms to 60 s each.
- Delay of up to 4 s, with tone-filtered feedback.
- Generated stereo reverb, 0.5–15 s decay, fed by both the dry signal and the delay.
- Master volume and a safety limiter.
- The audio context suspends itself once the fade-out and effect tails have finished, to save CPU.

### Panel
- Hardware-style panel inspired by Roland Jupiter-series synths, with a Black / Silver panel switch.
- Rotary knobs that turn as you drag them. Stepped knobs for wave, interval, octave and note show their setting in a small red display.
- Faders with slider caps, for levels, filter, LFO rate and depth, and swell times.
- LED radio buttons for filter type, LFO destination and LFO wave.
- Per-oscillator **Mute** (saved with the patch) and **Solo**. Solo isn't saved, overrides mute, allows several solos at once, and clears when you load a patch.
- Red two-line LED display showing the patch name, play state and the last control touched.
- Segmented L/R output meters with peak hold, an oscilloscope, and a log-frequency spectrum.
- Controls:
  - drag up or down (Shift for fine)
  - click a fader's track to jump there
  - arrow keys, Page Up/Down and Home/End on a focused control
  - double-click to reset
  - Space plays and stops
- Fonts (Michroma, Barlow Semi Condensed, Share Tech Mono) are embedded, so the page makes no network requests.

### Patches
- Factory presets: Tanpura Fifths, Dark Cathedral, Beating Sines, Harmonic Seventh and Init.
- Randomize, which keeps to consonant intervals.
- Save and delete your own patches in browser storage. The current patch is autosaved and restored on reload.
- Export and import patches as `.dronebox.json` files. Imports are merged onto defaults, so partial or older files still load.

[Unreleased]: https://github.com/TimsterAudio/Drone-Box/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/TimsterAudio/Drone-Box/releases/tag/v0.1.0
