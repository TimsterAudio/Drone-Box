# Drone Box

Timster's Audio Works

A drone synthesizer that runs entirely in one browser tab. It has no install, server or account, and nothing is sent anywhere.

## Running it

Open `drone-box.html` in a Chromium-based browser (Chrome, Edge or Brave). Firefox works too. Safari should work but hasn't been tested yet.

Press **Play** or hit **Space**. Browsers only allow audio to start after a click or key press, so that's always the first step.

## What's in stage 1

- **6 oscillators.** Each one has:
  - waveform: Sine, Triangle, Warm, Saw, Hollow, Square or Organ
  - a just-intonation interval (1/1, 3/2, 5/4, 7/4…) plus an octave shift
  - fine detune (±25 cents) for slow beating between oscillators
  - level and pan
  - Drift: a slow random pitch wander, like an analog oscillator
- **Root:** note, octave, the A4 reference pitch (e.g. 432 Hz) and glide time for pitch changes.
- **Filter:** low-pass, band-pass, high-pass or notch, with cutoff and resonance.
- **2 LFOs.** Each can control filter cutoff, pitch, volume or pan. On pan, odd and even oscillators move in opposite directions.
- **Swell:** fade-in and fade-out times of up to 60 s each.
- **Delay:** repeats get darker each time.
- **Reverb:** a generated impulse response with decay up to 15 s.
- **Output:** master volume, a safety limiter, L/R meters, a scope and a log-frequency spectrum.
- **Patches:** factory presets, Randomize, saving your own patches in browser storage, and Export/Import as JSON.

Double-click any slider to reset it.

## Signal flow

```
6 × osc → level → pan ─┐
                       bus → filter → amp (tremolo) ─┬─ dry ─────────────┐
                                                     ├─ delay ⟲ tone ────┤
                                                     └─ reverb ──────────┤
                                                                         sum → swell → master → limiter → out
```

## Roadmap

**Stage 2: movement and texture**
- Oscillators and a ladder filter written as AudioWorklets (the browser's custom audio-processing code), for analog-style character.
- Cross-modulation, FM and a wavefolder.
- A noise source and sample-and-hold or random-walk modulators.
- Very long envelopes.
- A modulation matrix so any source can control any destination.
- A better reverb (feedback delay network or convolution with your own impulse responses).
- A tape delay with wow and flutter.

**Stage 3: the looper**
- 4–8 tracks with record, overdub, undo, half-speed and reverse.
- Per-track decay, so overdubs slowly fade away.
- Loops locked to a master length, or each with its own length so they drift out of phase.
- Recording from the synth and from mic or line input, with latency compensation.
- WAV export.

**Stage 4: more ambitious**
- Granular processing.
- A generative "evolve" mode.
- A patch-cable modular interface.
- MIDI learn.
- Scenes with morphing between them.
