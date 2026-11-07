# Teomata

Teomata is a grid of single-letter functions. On each step, each functions is run to determine the grid's next state, generating cellular automata for MIDI.

## Overview

There are three types of functions: `Generators` emit values, `Operators` transform them, and `Outputs` send them as MIDI notes and control changes. Values can be bangs, numbers, or lists of numbers.

`Generators` emit values at a set rate and direction. Directions are compass points (`n`, `e`, `s`, `w`) or axes (`x`, `y`, `xy` for all directions), and a `?` after an axis picks a direction at random.

A `cycle` is one musical bar. Tempo is set in cycles per second (cps) using the control on the left, and `q` (quantize) sets the number of divisions per cycle.

## Functions

- **Generators** (uppercase, green outline)
- **Operators** (lowercase, no outline)
- **Outputs** (lowercase, blue outline)

Every function takes `mode` as its final argument. Generators and operators can be `on` or `off`, while outputs can also be `thru`.

- **on**: the function works normally.
- **off**: the function is greyed out and inactive. Values pass through unchanged, and a generator emits nothing.
- **thru**: the function is outlined in dashes. It sends as usual, and passes every value along unchanged.

Press Enter on a function to set its arguments. Arguments with fixed options can be cycled through using the cursor keys. Press Enter or Esc to return to the main view. Press Shift+Enter to cycle through a functions's modes.

## Inputs

Alt+Shift+arrow expands a function to reveal its arguments on the grid. Set an argument by sending a value to its input.

## Saving

Ctrl/Cmd+S saves the patch (its functions, arguments, inputs, cps and q) as a `.txt` file, and Ctrl/Cmd+O opens one. Opening replaces the grid's functions and empties its cells, and can be undone.

## Generators

- **B** `bang(rate, direction)`: Emit bangs at a given rate and direction. Displayed as `B`.
- **V** `value(value, rate, direction)`: Emit values at a given rate and direction. Displayed as the number.
- **W** `wave(type, freq, rate, direction)`: Emit time varying values between 0 and 1, at a given rate and direction. `type` is a waveform name (`saw`, `sin`, `cos`, `tri`, `sqr`, or `noi`) or a number from `0` (`saw`) to `5` (`noi`). `freq` is the number of waveform cycles per musical cycle. The waveform stays in phase with the transport, starting at the top of the first cycle. Displayed as `W`.

## Operators

* **a** `array(...values)`: Store an array of values. A bang outputs all the values, a number outputs the value at that index. Its inputs expand to one per value given, then `mode`. Displayed as `a`.
* **b** `bang()`: Convert any incoming value into a bang.
* **c** `count(reset)`: Count each incoming value, outputting the count so far. `reset` clears the count every n cycles. `0` never resets; a bang on its input resets the count immediately. Displayed as `c`.
* **d** `die()`: Nullify incoming values.
* **g** `gate(match)`: Let through values that match a given value, nullify everything else. Bangs are 1. Values equal to `match` pass unchanged, and an array passes only when every one of its numbers matches. Displayed as `g`.
* **h** `harmony(root, type, octaves)`: Output the notes of a chord or scale. A bang outputs all the notes, a number outputs the note at that index. `root` can be given as semitones above c, from `0` to `11`. Displayed as root and type, cut to 3 letters, e.g. `Cma` or `F#d`.
* **m** `math(operator, num)`: Transform incoming values using math operators. Bangs are 1. Displayed as the operator.
* **l** `logic(operator, num)`: Test incoming values using logical operators. Outputs 1 if true, 0 if false. Bangs are true. Displayed as the operator.
* **o** `loop(record, reset, length)`: Loop incoming values. Each value recorded plays back on the tick of the loop it arrived on, over `length` cycles. `record` is `0` or `1`: While 1, incoming values pass through and are recorded. A bang on its input records for one loop length. `reset` clears the loop every n cycles. A bang on its input clears the loop immediately. The recording is kept when the arguments change, and cleared when the transport stops. Displayed as `o`.
* **p** `print()`: Print incoming values to the console.
* **r** `rotate(direction)`: Turn incoming values to travel in a given direction or directions. An axis splits each value into a copy for each of its directions. Displayed as the unicode direction.
* **s** `scale(outLo, outHi, inLo, inHi)`: Scale incoming values from one range to another. Bangs are 1. Values are mapped from `inLo` to `inHi` onto `outLo` to `outHi`, and each number of an array is scaled. Displayed as `s`.
* **v** `value(value)`: Output a fixed value. Displayed as the number.
* **w** `wave(type, freq)`: Output the current position of a waveform, from 0 to 1. Any incoming value outputs the waveform's value at that point in time. Displayed as the type, by name.

## Outputs

* **n** `note(vel, dur, device, channel)`: Send incoming values as MIDI notes. Bangs are ignored. Notes play at velocity `vel` (0 to 127) for `dur` seconds, absorbing every value unless `mode` is thru. Numbers are rounded and wrapped to 0 to 127. Displayed as `n`.
* **k** `knob(cc, device, channel)`: Send incoming value as MIDI CC messages. Bangs are ignored. Absorbs every value unless `mode` is thru. Numbers are rounded and wrapped to 0 to 127, and an array sends its first number. Displayed as `cc<number>`, e.g. `cc7`.