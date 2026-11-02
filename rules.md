# Rules

A formal specification of Teomata's rules.

## Overview

Objects accept and emit values: either bangs, numbers, or arrays (lists) of numbers.

Objects can be `Generators`, `Operators`, or `Outputs`. `Generators` emit values, `Operators` transform them, and `Outputs` send them as MIDI notes and control changes.

`Generators` emit values at a given rate and direction. Directions are compass points - `n`, `e`, `s`, and `w` - or axes - `x`, `y`, or `xy` for all directions. A `?` after an axis randomly chooses a direction. Compass points are displayed as arrows (e.g. `←`), `↔` for x, `↕` for y, and `⤡` for xy.

A `cycle` is a single musical bar. Tempo is set as cycles per second (cps) in the control on the left. `q` stands for quantize, and sets the number of divisions per cycle.

## Objects

There are three kinds of object:

- **Generators** (uppercase, green outline): output values on their own schedule. Values may pass through unchanged without triggering output.
- **Operators** (lowercase, no outline): transform incoming values.
- **Outputs** (lowercase, blue outline): translate values as MIDI notes and control messages, absorbing every value that arrives unless thru. An absorbed value still shows on the square for the tick it arrives, as it does on an input.

Every object takes `mode` as its final argument. Generators and operators can be `on` or `off`. Outputs also take `thru`.

- **on**: does what it does.
- **off**: greyed out, and does nothing: values pass through it unchanged, and a generator outputs nothing. Its inputs still work, so a value on its `mode` input can turn it back on. Useful for conditional logic.
- **thru** (outputs only): outlined in dashes, and sends as usual, but lets every value carry on unchanged instead of absorbing it.

Press Enter on an object to set its arguments. Press Enter or Esc to return to the main view. 

Press Shift+Enter to step though an object's modes.

## Inputs

Alt+Shift+arrow expands the object to show its arguments on the grid. These can be set by sending values to those squares. Bangs and are ignored and pass through. Arguments with options - e.g. waveforms or directions - are set using an index number.

## Generators

* **B** `bang(rate, direction)`: Emit bangs at a given rate and direction. Defaults: `rate = 1`, `direction = e`. Displayed as `B`.
* **V** `value(value, rate, direction)`: Emit values at a given rate and direction. Defaults: `value = 0`, `rate = 1`, `direction = e`. Displayed as the number.
* **W** `wave(type, freq, rate, direction)`: Emit time varying values between 0 and 1, at a given rate and direction. `type` is `saw`, `sin`, `cos`, `tri`, `sqr` or `noi`, or a number, from `0` (`saw`) to `5` (`noi`). `freq` is waveform cycles per cycle. The waveform is in phase with the transport, starting at the top of the first cycle. Defaults: `type = sin`, `freq = 1`, `rate = 1`, `direction = e`. Displayed as `W`.

## Operators

* **a** `array(...values)`: creates an array of the values, each any number, one per argument; empty ones are left out. A bang or an array outputs all the values; a number outputs the value at that index, rounded and wrapped. A single value is output as it is. Its inputs expand to one per value given, then `mode`. Default: no values (values pass unchanged). Displayed as `a`.
* **b** `bang()`: convert any incoming value into a bang.
* **c** `count(reset)`: count each value received, outputting the count so far. `reset` is `0` or `1`: while it's `1` the count is held at `0`, and values received output `0`. Default: `reset = 0`. Displayed as `c`.
* **d** `die()`: nullify incoming values.
* **g** `gate(match)`: let through values equal to `match`, unchanged, and nullify everything else. Bangs are 1, and an array passes only when every one of its numbers matches. Default: `match = 1`. Displayed as `g`.
* **h** `harmony(root, type, octaves)`: creates an array of notes of a chord or scale. `root` can be given as semitones above c, from `0` to `11`. A bang outputs all notes; a number outputs the note at that index. Defaults: `root = c`, `type = ma`, `octaves = 1`. Displayed as root and type, cut to 3 letters, e.g. `Cma` or `F#d`.
* **m** `math(operator, num)`: transform incoming values using math operators. Bangs are 1. Defaults: `operator = +`, `num` empty (the value is left alone). Displayed as the operator.
* **l** `logic(operator, num)`: transform incoming values using logical operators. Bangs are true. Passing values become `1`, failing ones `0`. Defaults: `operator = ==`, `num = 0`. Displayed as the operator.
* **p** `print()`: print to console.
* **r** `rotate(direction)`: turn the incoming value in `direction`. An axis splits it into a copy for each of its directions. Default: `direction = x`. Displayed as the unicode direction.
* **s** `scale(lo, hi, inLo, inHi)`: map incoming values from `inLo` to `inHi` onto `lo` to `hi`. Bangs are 1, and each number of an array is scaled. Values outside the incoming range carry on past the ends. Defaults: `lo = 0`, `hi = 127`, `inLo = 0`, `inHi = 1`. Displayed as `s`.
* **v** `value(value)`: Any incoming number or bang outputs the value. Default: `value = 0`. Displayed as the number.
* **w** `wave(type, freq)`: transform any bang or non-zero value into the value of a waveform, from 0 to 1, at that point in time, as **W** does. Zero passes unchanged. Defaults: `type = sin`, `freq = 1`. Displayed as the type, by name.

## Outputs

* **n** `note(vel, dur, device, channel)`: send incoming numbers as MIDI notes at velocity `vel` (0 to 127), lasting `dur` seconds, absorbing every value unless thru. Bangs are ignored; numbers are rounded and wrapped to 0 to 127. Defaults: `vel = 100`, `dur = .5`, `device = 0`, `channel = 1`. Displayed as `n`.
* **k** `knob(cc, device, channel)`: send incoming numbers as CC messages, absorbing every value unless thru. Bangs are ignored; numbers are rounded and wrapped to 0 to 127, and an array sends its first number. Defaults: `cc = 1`, `device = 0`, `channel = 1`. Displayed as `cc<number>`, e.g. `cc7`.