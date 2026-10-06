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
| Pitch (`fam: 'pitch'`) | blue `#4f8cc9` | Interval, Octave, Detune, Drift; Root Note, Octave, A4, Glide |
| Tone (`fam: 'tone'`) | green `#5aa86f` | Wave, Fold, FM; Filter Cutoff, Reso, Drive |
| Modulation (`fam: 'mod'`) | red `#d24b33` | LFO Rate and Depth |
| Level and space (no family) | black | Level, Pan, Noise, Swell, Delay, Reverb, Volume |

The **Knobs** switch in the top strip picks between two styles, and the choice is remembered:
- **Colour** (default): the knob top is tinted with the family colour, and the pointer is white.
- **Pointer:** the knob stays black, and only the pointer and its tick scale take the family colour.

In both styles, a fader's cap line takes the family colour.

## Key colours

| Colour | Used for |
|---|---|
| Red `k-red` | Play / Stop (transport) |
| Orange `k-orange` | Mute, filter type |
| Yellow `k-yellow` | Solo, LFO destination, Random |
| Cream `k-cream` | LFO wave, Save, Export, Import |
| Grey `k-grey` | Delete, panel switch (utility) |

## Layout

- **Design target: a 1920 × 900 window.** At that size the whole instrument fits without scrolling (the smoke test checks this).
- The top strip holds the logo, the LED display, Memory (patch menu and buttons), the meters, master volume, the Panel and Knobs switches, and Play/Stop.
- Row 2: the six oscillator strips on the left, and a side column with Monitor (the scope and spectrum, which stretch to fill it) above Root and Noise.
- Row 3: LFO 1, LFO 2, Filter, Swell, Delay and Reverb.
- On narrower windows, rows wrap: the side column drops below the oscillators, and the sections flow onto more rows.
- Each oscillator strip has a 2-column grid of small knobs: Wave and Octave, Interval and Detune, Pan and Drift, Fold and FM. A tall Level fader runs beside them, as tall as the grid.
- Oscillator strips are a fixed 182 px wide, so all six line up evenly. They sit on one row from about 1,200 px wide and wrap below that.
- At phone width, sections stack and the page never scrolls sideways.

## Interaction

- **Knobs** turn through 270° (−135° to +135°). Drag up or right to increase, and use Shift for fine control.
- **Faders:** dragging the cap moves it relative to where you grabbed it. Clicking the track jumps to that point.
- **Feedback:** each control's own readout always shows its value, and every change also shows on the main LED display.
- **Keyboard:** controls can be focused. Arrow keys, Page Up/Down and Home/End adjust them, and there's an orange focus ring.
