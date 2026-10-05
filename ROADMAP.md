# Roadmap

This is where Drone Box is heading. It's a plan, not a promise: items move, merge or get dropped as the instrument takes shape. When something ships, tick it here and record it in [CHANGELOG.md](CHANGELOG.md).

## Stage 1: Drone box (v0.1) ✅

- [x] Six oscillators with just-intonation intervals, detune, drift, level, pan, mute and solo
- [x] Filter, two LFOs, swell envelope
- [x] Delay and reverb
- [x] Meters, scope, spectrum
- [x] Patches: presets, save, randomize, export/import
- [x] Jupiter-style hardware panel (Black / Silver)

## Stage 2: Movement and texture (in progress)

- [x] Oscillators written as AudioWorklets (the browser's custom audio-processing code), with band-limited waveforms
- [x] A ladder filter as an AudioWorklet, with drive
- [x] FM between oscillators (each one modulated by its neighbour)
- [x] A wavefolder
- [x] A noise source (white, pink, brown)
- [ ] Sample-and-hold and random-walk modulators
- [ ] Very long envelopes (minutes)
- [ ] A modulation matrix (any source to any destination), including free FM routing between any oscillators
- [ ] A better reverb (feedback delay network, or convolution with your own impulse responses)
- [ ] A tape delay with wow and flutter

## Stage 3: The looper

- [ ] 4–8 loop tracks with record, overdub and undo
- [ ] Half-speed and reverse per track
- [ ] Per-track decay, so overdubs slowly fade away
- [ ] Loops locked to a master length, or free lengths that drift out of phase
- [ ] Recording from the synth and from mic or line input, with latency compensation
- [ ] Per-track mixer
- [ ] WAV export of loops and the whole session

## Stage 4: More ambitious

- [ ] Granular processing of loops and samples
- [ ] A generative "evolve" mode, where the patch slowly mutates itself
- [ ] A patch-cable modular interface
- [ ] MIDI learn and Web MIDI controller support
- [ ] Scenes or snapshots, with morphing between them

## Backlog (small items, any time)

- [ ] Test on Safari and Firefox, and note any differences
- [ ] An option for exclusive solo (one oscillator at a time)
- [ ] Mouse-wheel control on knobs (needs a way to avoid hijacking page scroll)
- [ ] A patch format version field, for future migrations
- [ ] 2× oversampling for the wavefolder and ladder, to remove aliasing at extreme settings
