# Rules

A concise overview of Teomata's rules.

## Overview

Teomata is a grid of single-letter functions. On each beat division, these functions are run to determine the grid's next state, rendering cellular automata for MIDI generation.

Functions fall into three types: `Generators` emit values, `Operators` transform them, and `Outputs` send them as MIDI notes and control changes. Values can be bangs, numbers, or lists of numbers.

`Generators` emit values at a set rate and direction. Directions are compass points (`n`, `e`, `s`, `w`) or axes (`x`, `y`, `xy` for all directions), and a `?` after an axis picks a direction at random.

A `cycle` is one musical bar. Tempo is set in cycles per second (cps) using the control on the left, and `q` (quantize) sets the number of divisions per cycle.

## Functions

- **Generators** (uppercase, green outline): emit values on their own schedule. Values can pass through them unchanged without triggering output.
- **Operators** (lowercase, no outline): transform incoming values.
- **Outputs** (lowercase, blue outline): convert values into MIDI notes and control messages.

Every function takes `mode` as its final argument. Generators and operators can be `on` or `off`, while outputs can also be `thru`.

- **on**: the function works normally.
- **off**: the function is greyed out and inactive. Values pass through unchanged, and a generator emits nothing. Its inputs still function, so a value sent to its `mode` input can switch it back on, which is useful for conditional logic.
- **thru** (outputs only): the function is outlined in dashes. It sends as usual, but passes every value along unchanged rather than absorbing it.

Press Enter on a function to set its arguments, and press Enter or Esc to return to the main view. Press Shift+Enter to cycle through an functions's modes.

## Inputs

Alt+Shift+arrow expands a function to show its arguments on the grid. You can set them by sending values to those squares. Bangs are ignored and pass through. Arguments with fixed options, such as waveforms or directions, are set using an index number.

## Generators

- **B** `bang(rate, direction)`: Emit bangs at a given rate and direction. Defaults: `rate = 1`, `direction = e`. Displayed as `B`.
- **V** `value(value, rate, direction)`: Emit values at a given rate and direction. Defaults: `value = 0`, `rate = 1`, `direction = e`. Displayed as the number.
- **W** `wave(type, freq, rate, direction)`: Emit time varying values between 0 and 1, at a given rate and direction. `type` is a waveform name (`saw`, `sin`, `cos`, `tri`, `sqr`, or `noi`) or a number from `0` (`saw`) to `5` (`noi`). `freq` is the number of waveform cycles per musical cycle. The waveform stays in phase with the transport, starting at the top of the first cycle. Defaults: `type = sin`, `freq = 1`, `rate = 1`, `direction = e`. Displayed as `W`.

## Operators

* **a** `array(...values)`: Store an array of values. A bang outputs all the values, a number outputs the value at that index. Its inputs expand to one per value given, then `mode`. Displayed as `a`.
* **b** `bang()`: Convert any incoming value into a bang.
* **c** `count(reset)`: Count each incoming value, outputting the count so far. `reset` clears the count every n cycles. `0` never resets; a bang on its input resets the count immediately. Default: `reset = 0`. Displayed as `c`.
* **d** `die()`: Nullify incoming values.
* **g** `gate(match)`: Let through values that match a given value, nullify everything else. Bangs are 1. Values equal to `match` pass unchanged, and an array passes only when every one of its numbers matches. Default: `match = 1`. Displayed as `g`.
* **h** `harmony(root, type, octaves)`: Output the notes of a chord or scale. A bang outputs all the notes, a number outputs the note at that index. `root` can be given as semitones above c, from `0` to `11`. Defaults: `root = c`, `type = ma`, `octaves = 1`. Displayed as root and type, cut to 3 letters, e.g. `Cma` or `F#d`.
* **m** `math(operator, num)`: Transform incoming values using math operators. Bangs are 1. Defaults: `operator = +`, `num` empty (the value is left alone). Displayed as the operator.
* **l** `logic(operator, num)`: Test incoming values using logical operators. Outputs 1 if true, 0 if false. Bangs are true. Defaults: `operator = ==`, `num = 0`. Displayed as the operator.
* **o** `loop(record, reset, length)`: Loop incoming values. Each value recorded plays back on the tick of the loop it arrived on, over `length` cycles. `record` is `0` or `1`: While 1, incoming values pass through and are recorded. A bang on its input records for one loop length. `reset` clears the loop every n cycles. A bang on its input clears the loop immediately. The recording is kept when the arguments change, and cleared when the transport stops. Defaults: `record = 0`, `reset = 0`, `length = 1`. Displayed as `o`.
* **p** `print()`: Print incoming values to the console.
* **r** `rotate(direction)`: Turn incoming values to travel in a given direction or directions. An axis splits each value into a copy for each of its directions. Default: `direction = n`. Displayed as the unicode direction.
* **s** `scale(outLo, outHi, inLo, inHi)`: Scale incoming values from one range to another. Bangs are 1. Values are mapped from `inLo` to `inHi` onto `outLo` to `outHi`, and each number of an array is scaled. Defaults: `outLo = 0`, `outHi = 127`, `inLo = 0`, `inHi = 1`. Displayed as `s`.
* **v** `value(value)`: Output a fixed value. Default: `value = 0`. Displayed as the number.
* **w** `wave(type, freq)`: Output the current position of a waveform, from 0 to 1. Any incoming value outputs the waveform's value at that point in time. Defaults: `type = sin`, `freq = 1`. Displayed as the type, by name.

## Outputs

* **n** `note(vel, dur, device, channel)`: Send incoming values as MIDI notes. Bangs are ignored. Notes play at velocity `vel` (0 to 127) for `dur` seconds, absorbing every value unless `mode` is thru. Numbers are rounded and wrapped to 0 to 127. Defaults: `vel = 100`, `dur = .5`, `device = 0`, `channel = 1`. Displayed as `n`.
* **k** `knob(cc, device, channel)`: Send incoming value as MIDI CC messages. Bangs are ignored. Absorbs every value unless `mode` is thru. Numbers are rounded and wrapped to 0 to 127, and an array sends its first number. Defaults: `cc = 1`, `device = 0`, `channel = 1`. Displayed as `cc<number>`, e.g. `cc7`.