# Drone Box

Timster's Audio Works · **v0.4.2**

A drone synthesizer that runs entirely in one browser tab. It has no install, server or account, and nothing is sent anywhere.

## Running it

Keep the files together in one folder and double-click the launcher for your system:

| System | Launcher |
|---|---|
| macOS | `Launch on Mac.command` |
| Windows | `Launch on Windows.bat` |
| Linux | `Launch on Linux.sh` |

The launcher opens Drone Box in a **clean, stand-alone window**, with no address bar, tabs, bookmarks or toolbars. It uses the "app mode" built into Chromium-based browsers, so it needs Chrome, Edge, Brave or Vivaldi (Linux also accepts Chromium, including Flatpak and Snap installs). **It uses your default browser if that's one of these**; otherwise it picks the first one installed (Edge, then Chrome, Brave and Vivaldi on Windows; Chrome, then Edge and Brave on macOS). The window opens at 1920 × 930, which leaves about 1920 × 900 for the panel. If no suitable browser is found, it opens in your default browser as a normal tab.

**First run:** the scripts aren't signed, so your system may ask once:
- **macOS:** right-click (or Control-click) the `.command` file and choose **Open**.
- **Windows:** if SmartScreen says "Windows protected your PC", click **More info**, then **Run anyway**.
- **Linux:** you may need to make the script executable first: `chmod +x "Launch on Linux.sh"`.

You can also open `drone-box.html` directly in any browser tab. Chrome, Edge and Brave are tested; Firefox and Safari should work but haven't been tested yet.

**Window size:** the panel scales to fit whatever window it's in, so it never needs scrolling. Resize or maximise the window and the whole instrument grows or shrinks with it. Drone Box is made for desktops, laptops and tablets (landscape works best on a tablet). Phones aren't supported: the panel is too dense for a phone screen.

Press **Play** or hit **Space**. Browsers only allow audio to start after a click or key press, so that's always the first step.

**New to it?** Open **`Drone Box User Guide.html`** ("Drone Box for Dummies"): everything on the panel explained, with recipes, troubleshooting and a fair amount of cheek.

## Features

- **6 oscillators**, running as band-limited wavetable AudioWorklets (alias-free even at high notes). Each one has:
  - waveform: Sine, Triangle, Warm, Saw, Hollow, Square or Organ
  - a just-intonation interval (1/1, 3/2, 5/4, 7/4…) plus an octave shift
  - fine detune (±25 cents) for slow beating between oscillators
  - level and pan
  - Mute and Solo
  - Drift: a slow random pitch wander, like an analog oscillator
  - Fold (wavefolder) and FM (modulated by the previous oscillator)
- **Root:** note, octave, the A4 reference pitch (e.g. 432 Hz) and glide time for pitch changes.
- **Noise:** white, pink or brown, with level and pan.
- **Filter:** low-pass, band-pass, high-pass, notch or a saturating **ladder** low-pass (with Drive), plus cutoff and resonance.
- **2 LFOs.** Each can control filter cutoff, pitch, volume or pan. On pan, odd and even oscillators move in opposite directions.
- **Swell:** fade-in and fade-out times of up to 60 s each.
- **Delay:** repeats get darker each time.
- **Reverb:** a generated impulse response with decay up to 15 s.
- **Output:** master volume, a safety limiter, L/R meters, a scope and a log-frequency spectrum.
- **Keys:** 13 touch strips (the 12 just intervals plus the octave) that play a 1–4 voice synth over the drone, with its own filter (LPF, BPF, HPF, Ladder; cutoff, resonance, drive) and LFO (pitch, filter, level). The height you press at is pressure. Drag sideways to glide. Also: Latch, a microtonal Tune mode, scales, vibrato, and computer-keyboard playing.
- **Expression plates:** nine touch plates that shape the drone as you play: oscillator fold, FM, swell, bend and more; a filter sweep; throws into the delay and reverb; and a Bloom macro. Height and sideways movement each play a control.
- **Sequencer:** record knob moves, button presses, mutes, plate gestures and Keys notes, then play them back, edit them on a timeline, and save them with the patch. Four patterns, Chain, Tempo or Free time.
- **Pop-out windows:** Monitor, and a Performance window (sequencer, plates and Keys, in any combination) that can stay on top of other apps.
- **Patches:** factory presets, Randomize, saving your own patches in browser storage, and Export/Import as JSON.

## Playing the panel

The panel is styled after classic Roland Jupiter-series synths: a black panel (or Silver, switchable on the panel), knurled knobs, slider caps with a white line, and LED buttons.

- **Knobs and faders:** drag up or down. Hold **Shift** while dragging for fine control. Click anywhere on a fader's track to jump there.
- **Keyboard:** click a control to focus it, then use the arrow keys (Shift for finer steps), Page Up/Down, or Home/End.
- **Reset:** double-click any knob or fader to return it to its value when the patch loaded.
- **Mute / Solo:** each oscillator has a Mute button (saved with the patch) and a Solo button. When any oscillator is soloed, only the soloed ones play, even if they're muted. Solo isn't saved and clears when you load a patch.
- **Displays:** the red LED display at the top shows the patch name, play state, and the last control you touched. Every knob and fader also has its own small value readout.
- **Knob colours:** blue for pitch, green for tone, red for modulation. The **Knobs** switch picks tinted knob tops (Colour) or coloured pointers (Pointer).
- **View:** **Panel** shows everything. **Play** swaps the bottom row for the Performance block, whose tabs switch the **Seq**uencer, **Expression** plates and **Keys** on and off. **Perform** floats it in its own window.
- **Keys:** press a strip to play it, higher up for louder and brighter. Drag sideways to glide; hold **Shift** to slide freely. **Latch** holds notes until you press them again. **Tune** lets you drag a strip up or down to retune it (double-click resets it). On the computer keyboard, **A S D F G H J K L ; ' \** play up the scale, and **Z** / **X** change the octave.
- **Expression plates:** press a plate and move up for more; slide sideways for its second control. Let go and it springs back (or choose **Hold**, then tap to let go). The chips at the foot of each plate pick what it plays.
- **Sequencer:** press **Rec** and **Play**, then do things: moves, button presses, plates and notes are recorded into the pattern and play back as it loops. Click the timeline's note grid to add or delete notes; drag on a lane to draw it. **A–D** pick a pattern, **Chain** plays them in order.
- **Windows:** the small **Window** tab on Monitor or the Performance section opens it in its own window; **Dock** (or closing the window) brings it back.
- **Screen size:** the panel is designed at 1920 × 900 and scales as a whole to fit any window, from a tablet or a 1366 × 768 laptop to a 2560 px monitor. It never re-wraps, so it always looks the same.

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
| [ROADMAP.md](ROADMAP.md) | The full plan and to-do list: stages, backlogs, known issues and ideas |
| [TESTING.md](TESTING.md) | How to test: the tester checklist for people, and the automated smoke test |
| `testing/Drone Box Test Checklist.html` | The offline checklist testers work through. It produces a report to send back. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is laid out: audio graph, patch format, UI control system, how to add a parameter |
| [docs/DESIGN.md](docs/DESIGN.md) | Panel design rules: colours, fonts, which control to use for what |
| [CLAUDE.md](CLAUDE.md) | Working conventions for Claude Code sessions on this repo |

## Testing

`tests/smoke.js` drives the page in headless Chromium and checks playback, presets, controls, mute/solo and layout:

```sh
npm i -g playwright && npx playwright install chromium   # once
NODE_PATH="$(npm root -g)" node tests/smoke.js
```
