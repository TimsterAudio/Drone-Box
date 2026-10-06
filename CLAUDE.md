# Drone Box: working conventions

Drone Box is a browser drone synthesizer by Timster's Audio Works. The whole instrument is one file, `drone-box.html`. Read `docs/ARCHITECTURE.md` before changing code, and `docs/DESIGN.md` before changing the panel.

## Hard rules

- **Keep it one self-contained file.** No build step, no bundler, no npm dependencies for the app itself. The three `Launch on …` scripts are optional wrappers that open it in a clean app-mode window; keep their window size in step with the design size.
- **No network requests at runtime.** No CDNs, remote fonts, analytics or fetches. Embed assets (base64) if they're truly needed.
- **Never break saved patches.** Add new patch fields to `defaultPatch()`. Never rename or repurpose existing ones (see "Patch format" in ARCHITECTURE).
- **Keep the engine free of DOM code.** The UI changes `patch`, then calls `engine.apply…()`.
- **Route every continuous audio parameter change through `Engine.T()`** (smoothed), so nothing clicks. Discrete selectors (wave index, noise colour) use `Engine.set()`.
- **DSP lives in the `dsp-worklet` script block.** Keep `WAVE_IDS` there in step with `WAVES` in the main script, and keep the basic (non-worklet) fallback working.

## Workflow

- Do work on a feature branch. `main` always holds a working version.
- Open a pull request when the user asks, or merge when they ask.
- For every user-visible change, add a line under **Unreleased** in `CHANGELOG.md`.
- When the user calls for a release:
  - move Unreleased into a new version section, with the date
  - bump `VERSION` in `drone-box.html` and the version in `README.md`
  - tick off anything finished in `ROADMAP.md`
  - update the tester checklist (`testing/Drone Box Test Checklist.html`): its `VERSION`, plus checks for new features
  - tag the merge commit `vX.Y.Z`. This session can't push tags, so ask the user to create the release on GitHub.
  - build the release zip described in `TESTING.md`
- Until 1.0, a minor bump (0.x.0) means a new stage or feature set, and a patch bump (0.x.y) means fixes and tweaks.
- Run the smoke test before pushing, and add checks to it for new behaviour:
  `NODE_PATH="$(npm root -g)" node tests/smoke.js`
- For UI changes, take a headless screenshot at about 1400 px and 390 px wide, and look at it before calling the work done.
