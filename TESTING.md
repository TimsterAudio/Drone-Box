# Testing Drone Box

There are two kinds of testing: **people playing it** (the test round), and an **automated smoke test** that runs before every change is merged.

## For testers: the test round

Thanks for helping! You'll need:
- the release zip (for example `Drone-Box-v0.4.2.zip`)
- a computer with **Chrome, Edge, Brave or Vivaldi** (Firefox and Safari reports are welcome too)
- headphones or speakers. Start at a **low volume**, because drones build up.

Steps:
1. **Extract the zip** (on Windows: right-click, then **Extract All**). Don't run things from inside the zip.
2. Open **`testing/Drone Box Test Checklist.html`** in your browser. It's a single offline page with no sign-up.
3. Fill in **Your setup**. Most of it is filled in for you.
4. Start Drone Box with the launcher for your system (`Launch on Windows.bat`, `Launch on Mac.command` or `Launch on Linux.sh`). The README covers the one-time security prompt.
5. Work through the checks. Mark each **Pass**, **Fail** or **Skip**. For a fail, write what happened instead; screenshots help, so mention if you have one.
6. Click **Copy report** (to paste into an email or message) or **Download report** (a small `.md` file), and send it back.

Your answers are saved in the browser as you go, so you can stop and continue later. **Start over** clears them.

**Found something outside the checklist?** Add it under **Overall impressions**, or as a note on the nearest check. If you use GitHub, you can also open an issue on [TimsterAudio/Drone-Box](https://github.com/TimsterAudio/Drone-Box/issues) using the **Bug report** or **Idea** template.

### What makes a useful report

- **What you did, what you expected, and what happened.** The checklist asks for these.
- **Your system:** OS, browser and version, screen, and audio output.
- **For sound problems:** which patch you were on, roughly when it started, and whether it was clicks, dropouts, distortion or silence.
- **For panel problems:** a screenshot, and your window size.

## For developers: the automated smoke test

`tests/smoke.js` drives `drone-box.html` in headless Chromium using Playwright. It checks:
- **playback and presets:** audio plays, and every factory preset loads and sounds
- **controls:** knob dragging, stepped knobs, fader track clicks, LED buttons, and fine control landing on exact values for all 56 continuous controls
- **mute and solo:** they silence the right oscillators, including solo overriding mute and solo clearing on patch load
- **Stage 2 sound:** worklets loaded, and Fold, FM, the ladder filter and noise measured on the output spectrum
- **old patches:** v0.1 patches still load
- **panel:** readouts on every control, the knob style and panel switches
- **layout:** the 1920 × 900 fit, and scaling at laptop, monitor and tablet sizes (both orientations, both views)
- **Keys:** strips play their intervals (including the octave strip), pressure, glide, latch, computer keys, octave keys, scales, Tune mode, voices and mono legato, the Keys filter, drive and LFO
- **audio health:** silent parts switch off (idle Keys voices, the faded-out drone, unused ladders) and come back when needed; delay echoes ring out after Stop before the audio suspends; the footer audio readout
- **expression plates:** Fold, Bend, Swell (including a muted oscillator), the Filter sweep and the Space throw, measured on the output; Spring returning exactly to the panel; Hold and tap; plate targets saved with patches; older patches getting the defaults
- **windows and views:** Monitor and the Performance window pop out, play, and dock again; the Keys / Expression / Both tabs; the always-on-top window playing Keys and plates

Run it from the repo root:

```sh
npm i -g playwright && npx playwright install chromium   # once
NODE_PATH="$(npm root -g)" node tests/smoke.js
```

Every check prints PASS or FAIL. The script exits non-zero if anything fails. Add a check for any new behaviour, as `CLAUDE.md` requires.

## Before each release

1. The smoke test passes.
2. Headless screenshots at about 1400 px wide and at tablet size (about 1180 × 820) have been looked at.
3. The tester checklist (`testing/Drone Box Test Checklist.html`) covers any new features, and its `VERSION` matches.
4. The release zip contains: `drone-box.html`, `Drone Box User Guide.html`, the three launchers, `README.md`, `CHANGELOG.md`, `TESTING.md`, and the `testing/` folder.
