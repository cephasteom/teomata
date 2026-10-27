# Rules

A formal specification of Teomata's rules.

## Types and definitions

Value: bang | number
A bang into `h` gives a chord, an array of numbers, which operators work on number by number and `n` plays as a chord.

Direction: n | e | s | w | x | y | xy
Compass points are displayed as arrows (e.g. `←`), `↔` for x, `↕` for y, and `⤡` for xy.

cycle - name for a musical bar without having to specify beats/divisions

Directions are used by generators and the rotate operator. The compass points are fixed. `x`, `y`, and `xy` pick a random direction along the given axis or axes.

## Objects

There are three kinds of object:

- **Generators** (uppercase, green outline): output values on their own schedule. Values may pass through unchanged without triggering output.
- **Operators** (lowercase, no outline): transform incoming values.
- **Outputs** (lowercase, blue outline): translate values as MIDI notes and control messages.

A generator and an operator may share a letter. The generator emits values on its own; the operator emits only when it receives one.

Shift+Enter mutes the selected objects, or unmutes them when they are all muted. A muted object is greyed out, its label and outline alike, and does nothing: values pass through it unchanged. It keeps its arguments and whatever it remembers (such as an increment's count), and is unmuted when its square is given a different object.

## Generators

Shown as a green outlined square.

* **B** `bang(n, direction)`: output a bang every `n` cycles, in `direction`. Defaults: `n = 1`, `direction = e`. Displayed as `B`.
* **V** `value(value, n, direction)`: output `value` every `n` cycles, in `direction`. Defaults: `value = 0`, `n = 1`, `direction = e`. Displayed as the number.
* **I** `increment(from, to, n, direction)`: count from `from` to `to`, outputting each step every `n` cycles, in `direction`. Wraps around at the ends, and counts down when `to` is below `from`. Defaults: `from = 0`, `to = 7`, `n = 1`, `direction = e`. Displayed as `I`.
* **W** `waveform(type, freq, n, direction)`: output the value of a waveform, from 0 to 1, every `n` cycles, in `direction`. `type` is `saw`, `sin`, `cos`, `tri`, `sqr` or `noi` (ignoring case), and `freq` is waveform cycles per cycle, so `1` is one complete waveform per cycle and `2` is two. `noi` (noise) is smoothed randomness: a new random value at the start of each of its cycles, eased into the next, different for each square and each run. The waveform is in phase with the transport, starting at the top of the first cycle. Defaults: `type = sin`, `freq = 1`, `n = 1`, `direction = e`. Displayed as `W`.

## Operators

* **b** `bang()`: convert any incoming value into a bang.
* **i** `increment(from, to)`: output the next count each time a value is received, counting as **I** does. Defaults: `from = 0`, `to = 7`. Displayed as the next count.
* **d** `die()`: nullify incoming values.
* **h** `harmony(root, type, octaves)`: populate `values()` with the notes of a chord or scale. A bang outputs all notes; a number outputs the note at that index, wrapped. The root sits in the octave from middle C, and `octaves` repeats the notes in each octave above. Defaults: `root = c`, `type = ma`, `octaves = 1`. Displayed as root and type, cut to 3 letters, e.g. `Cma` or `F#d`.
* **m** `math(operator, n)`: transform incoming values using math operators. Bangs are 1. Defaults: `operator = +`, `n` empty (the value is left alone). Displayed as the operator.
* **l** `logic(operator, n)`: transform incoming values using logical operators. Bangs are true. Passing values become bangs, failing ones are nullified. Defaults: `operator = ==`, `n = 0`. Displayed as the operator.
* **p** `print()`: print to console.
* **r** `rotate(direction)`: turn the incoming value in `direction`. Default: `direction = x`. Displayed as the unicode direction.
* **v** `value(value)`: uses `values()`. Any incoming number or bang outputs the value. Default: `value = 0`. Displayed as the number.
* **w** `waveform(type, freq)`: transform any bang or non-zero value into the value of a waveform, from 0 to 1, at that point in time, as **W** does. Zero passes unchanged. Defaults: `type = sin`, `freq = 1`. Displayed as the type.

## Outputs

* **n** `note(device, channel)`: send incoming numbers as MIDI notes. Bangs are ignored; numbers are rounded and wrapped to 0 to 127. Defaults: `device = 0`, `channel = 1`. Displayed as `n`.
* **c** `cc(device, channel, cc)`: send incoming numbers as CC messages. Bangs are ignored; numbers are rounded and wrapped to 0 to 127, and a chord sends its first number. Defaults: `device = 0`, `channel = 1`, `cc = 1`. Displayed as `cc<number>`, e.g. `cc7`.