# Teomata

Teomata is a grid of single-letter functions. On each tick, each function is run to determine the grid's next state.

## Types

There are three types of functions: `Generators` emit values, `Operators` transform them, and `Destinations` are MIDI devices and global parameters. Values can be bangs, numbers, or lists of numbers.

`Generators` emit values at a set rate and direction. Directions are compass points (`n`, `e`, `s`, `w`) or axes (`x`, `y`, `xy` for all directions), and a `?` after an axis picks a direction at random.

A `cycle` is one musical bar. `cps` sets the cycles per second. `q`, or quantize, sets the number of divisions per cycle.

## Functions

- **Generators** (uppercase, green outline)
- **Operators** (lowercase, no outline)
- **Destinations** (lowercase, blue outline)

Every function takes `mode` as its final argument. Generators and operators can be `on` or `off`, while destinations can also be `thru`.

- **on**: the function works normally.
- **off**: the function is greyed out and inactive. Values pass through unchanged, and a generator emits nothing.
- **thru**: the function is outlined in dashes. It sends as usual, and passes every value along unchanged.

Press Enter on a function to show its arguments. Press Enter or Esc to return to the grid. Press Shift+Enter to cycle through a functions's modes.

Alt+Shift+arrow expands a function to reveal and set its arguments on the grid.

## Save and Load

Ctrl/Cmd+S saves the patch and Ctrl/Cmd+O opens one.

## Generators

- **B** `bang(rate, dir)`: Emit bangs at a given rate and direction. Displayed as `B`.
- **K** `knob(cc, device, ch, delay, dir)`: Emit the value of a MIDI CC when it moves, at most once per tick, from MIDI input `device`. `ch` `0` listens on all channels. `delay` works as for `N`. Displayed as `K<number>`, e.g. `K7`.
- **N** `note(device, ch, delay, dir)`: Emit MIDI notes played on input `device`, on the next tick. `ch` `0` listens on all channels. Several notes in one tick are emitted as an array. A `delay` above `0` snaps notes to the nearest tick instead, and emits them `delay` cycles later. Beware feedback when the same device is used for output by `n`. Displayed as `N`.
- **V** `value(value, rate, dir)`: Emit values at a given rate and direction. Displayed as the number.
- **W** `wave(type, freq, rate, dir)`: Emit time varying values between 0 and 1, at a given rate and direction. `type` is a waveform name (`saw`, `sin`, `cos`, `tri`, `sqr`, or `noi`) or a number from `0` (`saw`) to `5` (`noi`). `freq` is the number of waveform cycles per bar. The waveform stays in phase with the transport, starting at the top of the first cycle. Displayed as `W`.

## Operators

* **a** `array(...values)`: Store an array of values. A bang outputs all the values, a number outputs the value at that index. Its inputs expand to one per value given, then `mode`. Displayed as `a`.
* **b** `bang()`: Convert any incoming value into a bang.
* **c** `count(reset)`: Count each incoming value, outputting the count so far. `reset` clears the count every n cycles. `0` never resets; a bang on its input resets the count immediately. Displayed as `c`.
* **d** `die()`: Nullify incoming values.
* **e** `entangle(x, y)`: Clone another square: including its functionality (generator, operator or destination), arguments, and the cells moving over it. Values arriving pass unchanged while the square is empty. Displayed as the entangled square if populated, or `e` while it's empty.
* **g** `gate(match)`: Let through values that match a given value, nullify everything else. Bangs are 1. Values equal to `match` pass unchanged, and an array passes only when every one of its numbers matches. Displayed as `g`.
* **h** `harmony(root, type, deg, oct, len)`: Output the notes of a chord or scale. A bang outputs all the notes, a number outputs the note at that index. `root` can be given as semitones above c, from `0` to `11`. `deg` (default `0`) is the degree to start on, like an inversion, so degree 1 of `ma` plays 3, 5, 8. `oct` (default `3`) is the root's octave, so 3 is C3. `len` is the number of notes, carrying on into the octaves above; `0` (default) plays as many as the chord or scale has. Displayed as root and type, cut to 3 letters, e.g. `Cma` or `F#d`.
* **m** `math(operator, num)`: Transform incoming values using math operators. Bangs are 1. Displayed as the operator.
* **l** `logic(operator, num)`: Test incoming values using logical operators. Outputs 1 if true, 0 if false. Bangs are true. Displayed as the operator.
* **o** `loop(record, reset, length)`: Loop incoming values. Each value recorded plays back on the tick of the loop it arrived on, over `length` cycles. `record` is `0` or `1`: While 1, incoming values pass through and are recorded. A bang on its input records for one loop length. `reset` clears the loop every n cycles. A bang on its input clears the loop immediately. The recording is kept when the arguments change, when the transport stops and when the page reloads, and is saved in patches. Displayed as `o`.
* **p** `print()`: Print incoming values to the console.
* **r** `rotate(dir)`: Turn incoming values to travel in a given direction or directions. An axis splits each value into a copy for each of its directions. Displayed as the direction in italics, e.g. *`n`* or *`x?`*.
* **s** `scale(outLo, outHi, inLo, inHi)`: Scale incoming values from one range to another. Bangs are 1. Values are mapped from `inLo` to `inHi` onto `outLo` to `outHi`, and each number of an array is scaled. Displayed as `s`.
* **v** `value(value)`: Output a fixed value. Displayed as the number.
* **w** `wave(type, freq)`: Output the current position of a waveform, from 0 to 1. Any incoming value outputs the waveform's value at that point in time. Displayed as the type, by name.

## Destinations

* **n** `note(vel, dur, device, ch)`: Send incoming values as MIDI notes. `ch` `0` sends on all channels. Bangs are ignored. Notes play at velocity `vel` (0 to 127) for `dur` cycles, so `1` holds for a whole cycle and `.25` for a quarter. Numbers are rounded and wrapped to 0 to 127. Displayed as `n`.
* **k** `knob(cc, device, ch)`: Send incoming value as MIDI CC messages. `ch` `0` sends on all channels. Bangs are ignored. Numbers are rounded and wrapped to 0 to 127, and an array sends its first number. Displayed as `cc<number>`, e.g. `cc7`.
* **q** `q()`: Set the global q, rounded and clamped from 1 to 64.
* **t** `tempo()`: Set the global tempo (cps), clamped from 0.05 to 2. Bangs are ignored, and an array sets its first number.
