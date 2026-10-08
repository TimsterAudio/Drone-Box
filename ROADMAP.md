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

## Engine pathway: from browser audio to a native engine

**Decision (October 2026):** Drone Box will move its sound engine out of the browser in stages, toward a desktop app with a native (Rust) audio engine, keeping the current panel as the UI. It's mainly for one player (the author), so the goal is the best instrument, not the widest reach: project rules ("one file, no build step") may change on the way, as noted below.

**Why:** browser audio limits buffer size, drivers (no ASIO), thread priority and device choice, and its garbage collector can cause dropouts. v0.3.0 showed how close to those limits the roadmap's heavier features (looper, granular, Swarm, oversampling) would run. A native engine removes them.

**The seam it builds on:** the panel never makes sound itself. It changes `patch` and calls `engine.apply…()`, `play()`, `stop()` and `keyOn()`/`keyOff()`. Each phase keeps that seam and makes it cleaner, so the engine can be swapped without rebuilding the panel.

### Phase 0: Harden the browser engine (v0.3.x, now)
- [x] Gate silent DSP, block-rate maths, no allocation in worklets, a 48 kHz cap, and the footer audio readout (v0.3.1)
- [ ] A **performance budget** in the smoke test: render a worst-case patch offline and fail if it costs more than an agreed share of a core, measured against a reference task so it works on any machine
- [ ] Rules for new DSP in `CLAUDE.md`: gated when silent, block-rate parameters, no allocation, benchmark before and after
- [ ] **Audio buffer** choice (Low / Normal / Safe), and an **Eco mode** offered when dropouts are detected
- [ ] A "Check performance" button (Setup window): renders the current patch offline and reports its cost on this machine

*Exit check:* the heaviest factory patch with four Keys runs clean on the reference Windows machine, and the smoke test guards the budget.

### Phase 1: A clean engine interface (small; do soon)
- [ ] Document the **engine API** in `ARCHITECTURE.md`: everything the panel may call or read
- [ ] Stop the panel reaching into Web Audio internals. Today it reads `engine.ctx`, the three analysers, `keyMap`, `ready` and `dsp` directly. Replace them with engine methods:
  - `status()`: running / fading / stopped, sample rate, latency, dropouts, mode
  - `scope(buf)`, `spectrum(buf)` and `levels()` for the Monitor and meters
  - `notesSounding()` for the Keys glow and the KEYS status
- [ ] A **patch format version** field (from the backlog), ahead of any changes the new engine needs
- [ ] **Golden renders:** offline renders of the factory patches saved as reference spectra, so a new engine can be checked against the current sound

*Exit check:* the panel uses only the documented API; the smoke test and golden renders pass.

### Phase 2: DSP in Rust, running in the browser as WebAssembly (before Stage 5)
- [ ] Set up a Rust DSP crate, compiled to WebAssembly and run inside one AudioWorklet
- [ ] Port the custom processors first (oscillator, ladder, noise), behind the same parameters; check them against the golden renders
- [ ] Then move the built-in Web Audio parts (filters, delay, reverb, panning, mixing) into Rust as well, so the whole sound engine is one Rust graph in one worklet
- [ ] New DSP from here on (Stage 5 effects, Swarm, oversampling) is written once, in Rust
- [ ] **Rule change:** the *source* gets a build step (Rust and wasm-pack, plus a script that embeds the compiled engine as base64). The *shipped* browser version stays one self-contained, offline HTML file. CI builds it on every push.
- [ ] Retire the "basic mode" fallback (non-worklet browsers), or keep a minimal one; decide then

*Exit check:* the browser version runs the Rust engine, sounds the same (golden renders), and costs less than the JavaScript engine.

*Why before Stage 5:* Stage 5 is the DSP-heavy stage (new reverb, tape delay, shimmer, chorus). Doing Phase 2 first means writing those once, in Rust, instead of in JavaScript and again later. Stage 4 (modulation) is mostly control-rate, so it can come first.

### Phase 3: Desktop app (Tauri + native engine)
- [ ] A Tauri app for Windows, macOS and Linux: the existing panel as the UI, the same Rust engine running natively, connected through Tauri commands and events in place of Web Audio
- [ ] Native audio I/O (`cpal`): choice of device and **buffer size**; **ASIO** on Windows, CoreAudio on Mac, ALSA / PipeWire / JACK on Linux; multichannel outputs
- [ ] Audio **inputs** with known latency (needed by the Stage 6 looper)
- [ ] Installers built by GitHub Actions for all three systems
- [ ] Code signing: optional while it's for personal use (unsigned apps can be allowed on your own machines); revisit if it's ever shared widely
- [ ] The browser version continues from the same Rust engine (WebAssembly), as a no-install option

*Exit check:* all factory patches play on the desktop app at a lower latency than in the browser, on Windows and one other system.

### Phase 4: Optional extras once native
- [ ] Drone Box as a **plugin** (VST3 / CLAP, via nih-plug) inside a DAW
- [ ] Use more than one CPU core for heavy parts (granular, many loop tracks)

---

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
- [ ] **Expression plates** (for review after playing with the Keys): touch plates that shape the drone itself, growing the Solar-style per-oscillator Swell buttons into something more playable. Mock-ups: [Play view](docs/mockups/expression-play-view.png), [Performance window](docs/mockups/expression-performance-window.png), [(a) vs (c)](docs/mockups/expression-a-vs-c.png).
  - Plates: OSC 1–6, plus Filter (sweep), Space (throw into delay and reverb) and Bloom (a per-patch macro). They're brushed metal with an amber glow, so they read differently from the note Keys.
  - Each plate is a small XY surface:
    - **Press / release** starts and ends the gesture (an oscillator plate can swell its oscillator in)
    - **↕ height** is the main amount, absolute (top is full)
    - **↔ sideways** is a second amount, relative to where you pressed, so it's good for bipolar controls like bend, detune or pan; it can be set to Off
    - **Pressure** where a pen or touchscreen reports it
    - Two chips on each plate pick the ↕ and ↔ targets; they're saved with the patch.
  - **Release behaviour:** Spring (return on release) is the default, Hold is the option, and Latch holds a plate. Attack and Return times apply to the whole bank.
  - **Layout (preferred):** a **Keys / Expr / Both** switch in the Play view, and the same switch in a single **Performance** pop-out window. The browser allows only one always-on-top window, so Keys and plates share it. Plates on each oscillator strip of the main panel (option c) is not preferred, because it grows the panel.
  - Possibly a compact Keys mode for Both, keeping only Latch and Voices so the strips get more width.
  - Audio cost: negligible. Each plate is a smoothed value added to existing settings, through `Engine.T()`.
  - In the Stage 4 Patch view, each plate becomes patchable sources: Gate, X, Y and Pressure.
  - **To decide after playing:** the default target of each plate (does an oscillator plate swell the level, or only shape it?), and whether Bloom stays a macro.
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

**Patch view (for later review)**

A semi-modular patch bay: the modulation matrix drawn as cables. Mock-up: [docs/mockups/patch-view.png](docs/mockups/patch-view.png).
- A third View option: Panel / Play / **Patch**
- **Audio lane:** Oscillators (Pitch, FM, Fold in; Out), Noise, Filter, Swell, Delay, Reverb, Output
- **Modulation lane:** LFO 1 and 2 (with Rate inputs), Random, Slow Envelope, Keys (Pitch, Pressure, Gate), XY pad
- Built-in (normalled) connections shown dotted, so it plays with no cables; a cable into the same input replaces its dotted line
- Orange cables for audio, blue for modulation; output sockets have an inverted label plate
- A **Cables / Matrix** switch: the same connections as a list or a grid, with a cable limit (24?) to keep the audio cost bounded
- Builds on the modulation matrix above: the matrix does the sound, this view draws it
- Open questions:
  - Which sockets? The mock-up has about 40 musically useful ones, not every knob.
  - Where's the amount set: on a small knob at the destination socket (as in the mock-up), or on the cable?
  - What's the cable limit?
  - How do busy patches stay readable: fade all but the hovered cable, or a "hide cables" toggle?

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
- [ ] A fully free modular (add any number of modules, patch anything): **parked**. It's a different instrument with open-ended audio cost; the Stage 4 Patch view covers patching within fixed modules.
- [ ] Web MIDI: MIDI learn for any control, and notes in to the Keys section (Chrome, Edge and Brave only)
- [ ] Multichannel output for audio interfaces with more than two outputs
- [ ] A real installed app: now planned as the **Engine pathway, Phase 3** (Tauri + native engine), above

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
- [x] An audio readout: sample rate, latency, and dropouts where the browser reports them
- [ ] A real audio-load meter (how close the audio thread is to running out of time)
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
