# Roadmap

This is where Drone Box is heading, and the to-do list that keeps it on track. It's a plan, not a promise: items move, merge or get dropped as the instrument takes shape.
- When something ships, tick it here and record it in [CHANGELOG.md](CHANGELOG.md).
- New ideas go in the right section, or in **Ideas parking lot** if they don't fit yet.

**Where we are:** v0.3.0 is out: the Keys and pop-out windows (the first part of Stage 3). **Up next:** test feedback on the Keys, then the rest of Stage 3 (drone performance) and the Setup window.

---

## Now: the test round (v0.2.0, continuing with v0.3.0)

- [ ] Hand out the release zip and the tester checklist (`testing/Drone Box Test Checklist.html`)
- [ ] Collect reports. Log each problem as a GitHub issue (bug or idea).
- [ ] Fix anything that blocks testing, as patch releases (v0.3.x)
- [ ] Hand testers v0.3.0 and its updated checklist (Keys and windows sections)
- [ ] Gather the "what would you want next?" answers, and adjust this roadmap

## Stage 1: Drone box (v0.1.0) ✅

- [x] Six oscillators with just-intonation intervals, detune, drift, level, pan, mute and solo
- [x] Filter, two LFOs, swell envelope
- [x] Delay and reverb
- [x] Meters, scope, spectrum
- [x] Patches: presets, save, randomize, export/import
- [x] Jupiter-style hardware panel (Black / Silver)

## Stage 2: Movement and texture (v0.2.0, part 1 done) ✅

- [x] Oscillators written as AudioWorklets, with band-limited wavetables (no aliasing)
- [x] Ladder filter with drive
- [x] FM between oscillators (each one modulated by its neighbour)
- [x] Wavefolder
- [x] Noise source (white, pink, brown)
- [x] Panel: knob colours by function (Colour or Pointer style), a readout on every control, the 1920×900 layout with fit-to-window scaling
- [x] Stand-alone app-window launchers for Windows, macOS and Linux

## Stage 3: Keys and performance (v0.3.0: Keys and windows done; drone performance next)

Keyboard-style playing, inspired by the Elta Solar 42N's touch plates and drone buttons, designed for a mouse first.

**Touch-strip keyboard**
- [x] 12 tall strips, one per just-intonation interval above the root, plus a 13th for the octave
- [x] A new **Keys** section (1–4 voices, mono legato) to play them: wavetable oscillator, attack/release envelope, filter amount, level and pan, sitting over the drone
- [x] Press a strip to start a note, and release it to stop. A **Latch** button holds notes instead.
- [x] Vertical position inside a strip stands in for **pressure**: it controls level and brightness, and changes continuously while held
- [x] Drag sideways across strips to **glide**, with a Portamento knob for the speed. Shift + drag gives a free pitch slide with no scale.
- [x] **Tune mode:** drag a strip up or down to retune it by ±50 cents (the microtonal mode)
- [x] A **Scale** stepped knob (all 12, pentatonic, raga-like sets and so on). Strips outside the scale go dark.
- [x] Computer-keyboard playing: A S D F G H J K L ; ' play the 12 strips, and Z / X shift the octave
- [ ] On touchscreens, two fingers play two notes, and real pressure is used where the device reports it (built, and pen pressure works; needs testing on a real touchscreen)
- [x] A Keys LFO: wave, rate, and depth to pitch (vibrato), filter and level (tremolo)
- [x] A Keys filter: LPF, BPF, HPF or Ladder, with cutoff, resonance and drive
- [ ] A simple arpeggiator (up, down, random; rate synced to an LFO)
- [ ] Let the drone's LFO 1 / 2 drive the Keys too (a Keys destination, or through the Stage 4 matrix)
- [x] LED glow on each strip that follows the note's pressure

**Pop-out windows**
- [x] Monitor in its own window
- [x] Keys in their own always-on-top window (Document Picture-in-Picture, with a popup fallback)
- [x] Panel / Play view switch, with the Keys docked in the Play view
- [x] Windows remember their size, and last session's windows glow ready to reopen
- [ ] A **Setup** window for set-and-forget settings (A4 tune, glide, swell times, master options)
- [ ] Test the always-on-top window on Windows, macOS and Linux by hand

**Drone performance**
- [ ] A **Swell** trigger button on each oscillator, with its own attack and release (the Solar's drone buttons), plus a latch
- [ ] A **Swarm** knob on each oscillator: up to 5 detuned copies inside one oscillator
- [ ] An **XY pad** that drives two parameters at once (it becomes a matrix source in Stage 4)

## Stage 4: Modulation

- [ ] Random modulators: sample-and-hold, random walk and smooth random, each with a rate
- [ ] Very long envelopes (seconds to many minutes) as modulation sources
- [ ] **Modulation matrix:** any source to any destination, with an amount for each pairing
  - Sources: LFO 1 and 2, random, envelopes, Keys pressure, XY pad
  - Destinations: any knob or fader
- [ ] Free FM routing: any oscillator can modulate any other, replacing the fixed neighbour ring
- [ ] More LFOs, with phase offset, retrigger and tempo or clock sync
- [ ] Modulation shown on the panel: a moving ring around each knob that's being modulated

## Stage 5: Effects and space

- [ ] Better reverb: a feedback delay network with size, damping, modulation and freeze
- [ ] Convolution reverb that loads your own impulse responses (stored locally)
- [ ] Tape delay with wow, flutter, saturation and age
- [ ] Overdrive or saturation before the effects (the Solar has one, and it suits drones)
- [ ] Chorus or ensemble
- [ ] Shimmer: reverb with a pitch-shifted feedback path
- [ ] Master EQ (tilt, low cut, high cut)

## Stage 6: The looper

- [ ] 4–8 loop tracks with record, overdub and undo
- [ ] Half-speed and reverse per track
- [ ] Per-track decay, so overdubs slowly fade away
- [ ] Loops locked to a master length, or free lengths that drift out of phase
- [ ] Recording from the synth and from mic or line input, with latency compensation
- [ ] Per-track mixer
- [ ] WAV export of loops and the whole session

## Stage 7: More ambitious

- [ ] Granular processing of loops and samples
- [ ] A generative **Evolve** mode, where the patch slowly mutates itself within limits you set
- [ ] Scenes or snapshots, with slow morphing between them
- [ ] A patch-cable modular view
- [ ] Web MIDI: MIDI learn for any control, and notes in to the Keys section (Chrome, Edge and Brave only)
- [ ] Multichannel output for audio interfaces with more than two outputs
- [ ] A real installed app (for example a small Tauri wrapper) with its own icon, if the launchers aren't enough

---

## Backlog: panel and usability

- [ ] **Record the output to a WAV file:** a record button for the master output. This would also help testers share what they hear.
- [ ] Undo and redo of control changes
- [ ] A/B compare of two patch states
- [ ] Preset browser with categories, favourites and notes on each patch
- [ ] Randomize per section, and a lock on sections you don't want randomized
- [ ] Initialise one section without touching the rest
- [ ] Mouse-wheel control on knobs (needs a way not to hijack page scrolling, for example only while hovering with a modifier key)
- [ ] An exclusive solo option (one oscillator at a time)
- [ ] An in-app help overlay: what each section does, plus the keyboard shortcuts
- [ ] Better touch support on tablets: bigger hit areas, and no accidental page zoom
- [ ] Accessibility review: screen-reader labels, focus order, contrast
- [ ] Check the knob colours for colour-blind users, and add a shape or label cue if needed
- [ ] Output device selection where the browser allows it

## Backlog: sound engine

- [ ] 2× oversampling for the wavefolder and ladder, to remove aliasing at extreme settings
- [ ] A CPU or audio-load indicator
- [ ] Handle the audio device or sample rate changing while playing
- [ ] Cache generated reverb impulses so decay changes are instant
- [ ] Limiter options: off, soft or hard; show gain reduction on the meter

## Backlog: platform, release and process

- [ ] Test on Firefox and Safari, and note any differences in the README
- [ ] Test on macOS and Linux with the launchers (so far only Windows has been tested by hand)
- [ ] Bring the default-browser and encoded-address launcher fixes to **Spool** (in Spool's own repo)
- [ ] A patch format version field, for future migrations
- [ ] Build the release zip automatically when a version is tagged (a GitHub Action)
- [ ] Keep the tester checklist up to date with each release
- [ ] A user guide (like Spool's `User Guide.txt`) once the panel settles

## Known issues

- High Fold settings can add some harshness (aliasing), because the wavefolder isn't oversampled yet.
- FM always goes from the previous oscillator to the next (OSC 6 modulates OSC 1). Free routing comes with the matrix.
- Firefox and Safari haven't been tested yet.
- Phones aren't supported (desktop, laptop and tablet only). On a tablet in portrait, the panel fits the width and leaves the lower part of the screen empty.
- The macOS and Linux launchers have only been tested by simulation, not on real machines.
- Version tags can't be pushed from the Claude Code session, so releases are tagged on GitHub by hand.

## Ideas parking lot

Ideas that came up but don't have a home yet:
- Per-oscillator envelopes that retrigger on a slow clock (rhythmic drones)
- A "tanpura" pluck mode: a soft repeating attack on chosen oscillators
- Tuning tables beyond just intonation: Pythagorean, meantone, Scala `.scl` file import
- A binaural mode: a small detune between the left and right channels per oscillator
- Linking with Spool: play a recording into the looper or the convolution reverb
