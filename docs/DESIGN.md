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
| Displays, tooltips, readouts | Share Tech Mono | uppercase, red with a soft glow |

## Which control to use

| Kind of parameter | Control |
|---|---|
| Levels, envelope times, filter cutoff and resonance, LFO rate and depth | **Fader**, as on the Jupiter-8 |
| Continuous settings such as detune, pan, drift, effects and master | **Knob** |
| A list of more than 5 choices (wave, interval, octave, note) | **Stepped knob**, orange pointer, with a small readout display |
| Up to about 5 choices (filter type, LFO destination and wave, noise colour) | **LED button row** |
| On/off state (mute, solo, play) | **Single LED button**: the LED lit means engaged |

## Key colours

| Colour | Used for |
|---|---|
| Red `k-red` | Play / Stop (transport) |
| Orange `k-orange` | Mute, filter type |
| Yellow `k-yellow` | Solo, LFO destination, Random |
| Cream `k-cream` | LFO wave, Save, Export, Import |
| Grey `k-grey` | Delete, panel switch (utility) |

## Layout

- The top strip holds the logo, the LED display, the meters, master volume, the panel switch and Play/Stop.
- Then rows of outlined sections: Monitor and Memory, then Oscillators, then Root, Noise, LFO 1, LFO 2, Filter, Swell, Delay and Reverb.
- Each oscillator strip has a 2-column grid of small knobs: Wave and Octave, Interval and Detune, Pan and Drift, Fold and FM. A tall Level fader runs beside them, as tall as the grid.
- Oscillator strips are a fixed 182 px wide, so all six line up evenly. They sit on one row from about 1,200 px wide and wrap below that.
- At phone width, sections stack and the page never scrolls sideways.

## Interaction

- **Knobs** turn through 270° (−135° to +135°). Drag up or right to increase, and use Shift for fine control.
- **Faders:** dragging the cap moves it relative to where you grabbed it. Clicking the track jumps to that point.
- **Feedback:** while a control is hovered, dragged or focused, a tooltip shows its value. Every change also shows on the main LED display.
- **Keyboard:** controls can be focused. Arrow keys, Page Up/Down and Home/End adjust them, and there's an orange focus ring.
