# Panel design

The visual language of the Drone Box panel. New controls should follow these rules so the instrument keeps looking like one piece of hardware.

## Inspiration

Roland Jupiter-series synths (Jupiter-8 and Jupiter-X), in these details:
- a black panel with thin outlined sections and spaced uppercase section titles
- black slider caps with a white line, and knurled black knobs
- rows of coloured rectangular keys with a red LED above each
- red LED displays
- the red, orange, yellow and cream stripe

## Panels

| | Black (default) | Silver |
|---|---|---|
| Panel | `#171717` | `#d5d2ca`, with a faint brushed texture |
| Legends | cream `#ece8dd` | near-black `#1b1a18` |
| Section frames | cream at 30% | near-black at 42% |

Things that stay the same on both panels, as on real hardware: the black knobs and fader caps, the red displays, the coloured keys and the LEDs.

## Type

| Use | Font | Treatment |
|---|---|---|
| Maker wordmark ("Timster's Audio Works - **Drone Box**") | Space Grotesk 500/700 | same badge treatment as Spool: 13px in a thin 3px-radius frame, product name bold |
| Logo, oscillator numbers | Michroma | wide; the logo is slanted −12° like the Jupiter badge |
| Panel legends, section titles, key labels | Barlow Semi Condensed 600/700 | uppercase, letter-spaced 0.1–0.2em, 10.5–12px |
| Displays and value readouts | Share Tech Mono | uppercase, red with a soft glow |

## Which control to use

| Kind of parameter | Control |
|---|---|
| Levels, envelope times, filter cutoff and resonance, LFO rate and depth | **Fader**, as on the Jupiter-8 |
| Continuous settings such as detune, pan, drift, effects and master | **Knob** |
| A list of more than 5 choices (wave, interval, octave, note) | **Stepped knob**: it clicks between settings |
| Up to about 5 choices (filter type, LFO destination and wave, noise colour) | **LED button row** |
| On/off state (mute, solo, play) | **Single LED button**: the LED lit means engaged |

## Value readouts

**Every knob and fader has a permanent small red readout under its label.** There are no hover pop-ups. The main LED display also shows the name and value of the last control touched. LED buttons don't need a readout, because their lit LED shows the state.

## Knob colours

Knob colour shows **what a control does**, and each colour means the same thing everywhere on the panel. Colours are muted so they read on both panels.

| Family | Colour | Controls |
|---|---|---|
| Pitch (`fam: 'pitch'`) | blue `#4f8cc9` | Interval, Octave, Detune, Drift; Root Note, Octave, A4, Glide; Keys Octave, Scale, Glide |
| Tone (`fam: 'tone'`) | green `#5aa86f` | Wave, Fold, FM; Filter Cutoff, Reso, Drive; Keys Wave, Cutoff, Reso, Drive |
| Modulation (`fam: 'mod'`) | red `#d24b33` | LFO Rate and Depth; Keys LFO Rate, Pitch, Filter, Level |
| Level and space (no family) | black | Level, Pan, Noise, Swell, Delay, Reverb, Volume; Keys Attack, Release, Level, Pan |

The **Knobs** switch in the top strip picks between two styles, and the choice is remembered:
- **Colour** (default): the knob top is tinted with the family colour, and the pointer is white.
- **Pointer:** the knob stays black, and only the pointer and its tick scale take the family colour.

In both styles, a fader's cap line takes the family colour.

## Key colours

| Colour | Used for |
|---|---|
| Red `k-red` | Play / Stop (transport) |
| Orange `k-orange` | Mute, filter type (drone and Keys), Keys Tune |
| Yellow `k-yellow` | Solo, LFO destination, Random, Keys Latch |
| Cream `k-cream` | LFO wave (drone and Keys), noise colour, Keys Voices and Pressure, Save, Export, Import |
| Grey `k-grey` | Delete, and the Panel, Knobs and View switches (utility) |

## Layout

- **Design target: a 1920 × 900 window.** At that size the whole instrument fits without scrolling (the smoke test checks this).
- The top strip holds the logo, the LED display, Memory (patch menu and buttons), the meters, master volume, the Panel, Knobs and View switches (grouped tightly in `.switches`), and Play/Stop. It has almost no room to spare at 1920 px; the smoke test checks it stays on one row.
- Row 2: the six oscillator strips on the left, and a side column with Monitor (the scope and spectrum, which stretch to fill it) above Root and Noise.
- Row 3: LFO 1, LFO 2, Filter, Swell, Delay and Reverb.
- **View › Play** swaps row 3 for the **Performance** block: the expression plates and/or the Keys, chosen by the Keys / Expression / Both tabs on its top edge. **View › Perform** floats the block in its own always-on-top window from either view.
- **Fit to window:** the page is always laid out at the 1920 px design width, and the whole page is scaled with CSS `zoom` to fit the window (`fitToWindow()`). It never scrolls and never re-wraps, so the panel looks the same on a laptop, in the app window and on a large monitor; only the size changes.
- **Devices:** desktops, laptops and tablets. A tablet in landscape gets the same panel at about 60% scale; portrait works, but leaves the lower part of the screen empty. **Phones aren't supported**, so there's no stacked or wrapping layout to maintain.
- **Width budget:** the bottom row (LFO 1, LFO 2, Filter, Swell, Delay, Reverb) has only about 40 px to spare at 1920 px. Widen anything there with care; the smoke test checks that it stays on one row at several zoom levels.
- Each oscillator strip has a 2-column grid of small knobs: Wave and Octave, Interval and Detune, Pan and Drift, Fold and FM. A tall Level fader runs beside them, as tall as the grid.
- Oscillator strips are a fixed 182 px wide, so all six line up evenly. They sit on one row from about 1,200 px wide and wrap below that.

## Interaction

- **Knobs** turn through 270° (−135° to +135°). Drag up or right to increase, and use Shift for fine control.
- **Faders:** dragging the cap moves it relative to where you grabbed it. Clicking the track jumps to that point.
- **Feedback:** each control's own readout always shows its value, and every change also shows on the main LED display.
- **Keyboard:** controls can be focused, with an orange focus ring.
  - Arrow keys move 1% of the travel. **Shift + arrow** moves exactly one step of the control's value grid.
  - Page Up/Down move 10%, and Home/End jump to the ends.
- **Value grid:** every continuous control snaps to exact values, so whatever the readout shows is exactly what's stored:
  - an explicit step where one is set, such as 0.1 Hz (A4) or 0.1¢ (Detune, Drift)
  - otherwise 1% for linear controls (levels, amounts, pan)
  - otherwise 3 significant figures for log controls (Cutoff, Reso, Glide, Rate, times)

## Keys

- **13 touch strips**, one per just-intonation interval above the root plus the octave (2/1), labelled with the ratio, its name, its frequency and its computer key. They're dark, rounded plates (like the Solar's touch plates); a centre hairline marks the pressure axis.
- A held strip lights from the bottom with a red glow up to the pressure height, with a white dot at the top of the glow.
- Strips outside the current Scale dim to 30% and don't play. In Tune mode every strip gets an orange outline, and its readout shows its tuning in cents instead of Hz.
- Controls, left to right: Latch and Tune (single LED buttons), Voices and Pressure (LED rows), then three groups divided by a thin rule, each with a small title: **Voice** (two rows of four knobs), **Filter** (type buttons over Cutoff, Reso, Drive) and **LFO** (wave buttons over Rate, Pitch, Filter, Level).
- **Playing:** press to play; the height in the strip is pressure (top is full), or a pen's real pressure. Drag sideways to glide between strips in the scale; Shift + drag slides freely. Computer keys A S D F G H J K L ; ' \ walk up the scale, Z and X change octave.

## Expression plates

- **Nine plates:** OSC 1–6, a thin divider, then Filter, Space and Bloom. They're **brushed metal** with an **amber** glow, so they never look like the black note Keys with their red glow.
- Each plate shows its name and (for oscillators) its interval at the top. Readouts sit above the two chips at the foot: ↕ for height, ↔ for sideways. A chip opens the browser's own list. A dotted chip has only one choice.
- While played: an amber glow up to the height, a white dot under the finger, and a faint vertical line through it. A held plate (Hold) lights its corner LED.
- The bank's controls sit on the left in a compact block: Swell and Clear (single LED buttons), Release (Spring / Hold), Attack and Return knobs.
- **Keys / Expression / Both** are tabs on the top edge of the Performance block, next to its Window tab. The same tabs travel with it into the Performance window.

## Sequencer

- The **Sequencer** block has its controls on the left, packed into four rows, and the timeline on the right:
  - row 1: Play and Rec (red, the transport colour), Pattern A–D (orange), Chain (yellow), Keep (grey)
  - row 2: Time (Tempo / Free) and the Tempo and Bars (or Length) knobs
  - row 3: Quantise notes
  - row 4: Snap, Copy, Paste, Clear (grey), and the "+ Add lane…" menu (an LED-display style select)
- A pattern key shows a dot when the pattern has content, and blinks while it's queued.
- **The timeline** is an LED screen, like Monitor: dark red background, red-orange ink.
  - A ruler with bar numbers (Tempo) or times (Free), and the pattern, length and tempo in its corner.
  - The note grid: one row per Keys strip (2/1 at the top), each note a bar whose brightness follows its pressure; notes in another octave show +1 / −1.
  - One lane per recorded control, named on the left with a × to delete it. Lanes are drawn red, plates amber (their glow colour); the selected lane is tinted orange.
  - The playhead is white, or red while recording.

## Pop-out windows

- A section that can float has a small **Window** tab on its top frame edge, at the right (opposite the title). In its window, the tab reads **Dock**.
- The section's place in the panel shows a slim placeholder: the title, "In its own window" and a **Bring back** button.
- A window looks exactly like the section in the panel: same styles and theme, and the theme and knob switches follow live.
- The Performance window holds the expression plates above the Keys (or either alone).
- A narrow Keys window keeps the strips playable: the LFO group hides below 1500 px, Voice below 1250 px, Filter below 1000 px, and the side buttons below 640 px (the same controls are on the panel).
- A tab that glows orange was in its own window last time; one click reopens it.

