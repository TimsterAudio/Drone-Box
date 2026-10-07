# Changelog

All notable changes to Drone Box are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and version numbers follow [Semantic Versioning](https://semver.org/). Until 1.0, a minor bump (0.x.0) marks a new stage or feature set, and a patch bump (0.x.y) marks fixes and small tweaks.

## [Unreleased]

### Added
- **Keys (Stage 3).** Twelve touch strips, one per just-intonation interval above the root, play a new two-voice Keys section over the drone.
  - Press a strip to play it. The height you press at is pressure: it sets the level, the tone or both (**Pressure** switch). A pen's real pressure is used.
  - Drag sideways to glide to the next strip; Shift + drag slides freely between them.
  - **Latch** holds notes until you press them again. **Tune** mode lets you drag a strip up or down to retune it by up to ±50 cents (double-click resets it).
  - Knobs: Wave, Octave, Scale (all 12, pentatonic, major, minor, Bhairav, harmonic), Glide, Vibrato, Tone, Attack, Release, Level and Pan. Strips outside the scale go dark.
  - Computer keys A S D F G H J K L ; ' \ play up the scale, and Z / X change the octave.
  - Each strip glows up to the pressure while it plays.
  - The Keys go through the delay and reverb, not the drone's filter, and play even while the drone is stopped (the display shows KEYS).
- **View switch** in the top strip. **Play** swaps the LFO, filter and effects row for the Keys; **Panel** brings it back.
- **Pop-out windows.** Monitor and Keys can each move into a window of their own (the **Window** tab on the section's top edge, or **View › Keys**), and come back with **Dock**, **Bring back** or by closing the window.
  - The Keys window stays on top of other windows where the browser supports it (Chrome, Edge and Brave), so you can play while you work in another app. Elsewhere it's an ordinary window.
  - Windows remember their size. A section that was in its own window last time glows, ready to reopen with one click.

### Changed
- The swell fade now applies to the drone only, so delay and reverb tails ring out naturally after Stop.
- The top strip is slightly tighter to make room for the View switch.

## [0.2.0] — 2026-10-06

The first part of Stage 2 plus a big panel update. Drone Box gets a new alias-free oscillator engine with Fold, FM, a ladder filter and noise; a 1920 × 900 panel that scales to any window; colour-coded knobs; and stand-alone app-window launchers. This is the release for the first round of outside testing.

### Added
- Timster's Audio Works maker wordmark ("Timster's Audio Works - **Drone Box**") in the panel header, in the same style and font (Space Grotesk) as Spool's.
- App icon (an amber sine wave on a dark rounded square, matching Spool's icon style) and the page title "Timster's Audio Works - Drone Box".
- **New oscillator engine (Stage 2).** The oscillators now run as AudioWorklets, playing band-limited wavetables, so high notes and pitch sweeps stay free of aliasing.
- **Fold** knob on each oscillator: a sine wavefolder that adds bright, metallic overtones.
- **FM** knob on each oscillator. Each one is frequency-modulated by the previous one (OSC 6 modulates OSC 1). A muted oscillator still works as a modulator.
- **Ladder** filter type: a four-pole ladder low-pass with saturation, plus a **Drive** knob for it.
- **Noise** section: white, pink or brown noise with level and pan, running through the filter. It's silent while any oscillator is soloed.
- Factory presets showing off the new features: **Folded Fifths**, **Metallic FM** and **Ladder Wind**.
- If the browser can't run AudioWorklets, the synth falls back to the v0.1 sound and the display says "Basic audio mode".
- **Knob colours by function:** blue for pitch, green for tone, red for modulation, and black for level and space. A new **Knobs** switch picks **Colour** (tinted knob tops, the default) or **Pointer** (black knobs with coloured pointers and scales). The choice is remembered.
- **Stand-alone window launchers:** `Launch on Mac.command`, `Launch on Windows.bat` and `Launch on Linux.sh` open Drone Box in a clean app window, with no address bar, tabs or toolbars, at 1920 × 930. They use your default browser when it's Chromium-based (Chrome, Edge, Brave, Vivaldi, or Chromium on Linux), otherwise the first one installed, and they skip the browser's first-run and default-browser prompts. If none is found, they fall back to a normal browser tab. On Windows the page address is passed fully encoded and unquoted, so folders with spaces, apostrophes, `&` or brackets work.
- **Testing kit:** `TESTING.md`, an offline tester checklist (`testing/Drone Box Test Checklist.html`) that produces a report to send back, and GitHub issue templates for bugs and ideas.
- **Full roadmap:** `ROADMAP.md` now lists every planned stage (Keys and performance next, then Modulation, Effects, the Looper and more), plus backlogs, known issues and an ideas parking lot.
- **Fit to window:** on desktop-sized windows, the whole panel scales to fit the window, so it never scrolls or wraps, whether in the app window, on a 1366 × 768 laptop or on a large monitor. Phone-width windows keep the stacked layout.

### Changed
- **The panel is laid out for a 1920 × 900 window** and fits it without scrolling:
  - Memory moves into the top strip.
  - The oscillators sit beside a column with Monitor, Root and Noise.
  - The LFOs, Filter, Swell, Delay and Reverb share one row.
  - The scope and spectrum are taller.
  - Smaller windows still wrap, down to phone width.
- **Value readouts are consistent:** every knob and fader now has a permanent red readout, and the hover pop-ups are gone. Before, only some knobs had a permanent readout and all of them showed a pop-up on hover.
- Delay's four knobs sit in one row, and Reverb's two sit side by side.
- The oscillator Level faders are taller, to match the extra row of knobs.
- Patches gain new fields (`oscs[].fold`, `oscs[].fm`, `filter.drive`, `noise`). Older patches load with all of them off and sound as they did.

### Fixed
- **Fine control lands on exact values.** Shift + arrow now moves exactly one step: 0.1 Hz on A4 Tune, 0.1¢ on Detune, 1% on levels and amounts, 1 unit on Pan, and 3 significant figures on log controls such as Cutoff, Glide and Rate. Before, it moved by a fraction of the travel, which rounded to uneven 0.1 and 0.2 jumps and could skip values such as 440.0 Hz.
- Dragging and plain arrow keys also land on that same grid, so stored values are exact (50%, not 49.73%). Arrow steps are measured from the current value, so they no longer drift.

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

[Unreleased]: https://github.com/TimsterAudio/Drone-Box/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/TimsterAudio/Drone-Box/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/TimsterAudio/Drone-Box/releases/tag/v0.1.0
