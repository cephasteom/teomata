# Rules

A formal specification of Teomata's rules.

## Types and definitions

Value: bang | number
A bang into `h` gives a chord, an array of numbers, which operators work on number by number and `n` plays as a chord.

Direction: n | e | s | w | x | y | xy, or its number, from 0 (n) to 6 (xy) in that order, which is kept as its name once the editor leaves it
Compass points are displayed as arrows (e.g. `←`), `↔` for x, `↕` for y, and `⤡` for xy.

cycle - name for a musical bar without having to specify beats/divisions

In the editor, up and down step an argument that takes one of a list of names (a direction, a wave `type`, a harmony `root` or `type`, or a math or logic `operator`) to the next or previous name, wrapping around.

Wherever an argument takes a number, it can be typed as arithmetic, with `+`, `-`, `*`, `/`, `%`, `^` (power) and brackets, and is kept as the result when the editor leaves it, so `B(1/8, e)` is kept as `B(.125, e)`. In the editor, a number that isn't whole shows with 2 decimal places, such as `.50`, apart from the argument under the cursor, which shows in full.

Directions are used by generators and the rotate operator. The compass points are fixed. `x`, `y`, and `xy` pick a random direction along the given axis or axes.

## Objects

There are three kinds of object:

- **Generators** (uppercase, green outline): output values on their own schedule. Values may pass through unchanged without triggering output.
- **Operators** (lowercase, no outline): transform incoming values.
- **Outputs** (lowercase, blue outline): translate values as MIDI notes and control messages, absorbing every value that arrives. An absorbed value still shows on the square for the tick it arrives, as it does on an input.

A generator and an operator may share a letter. The generator emits values on its own; the operator emits only when it receives one.

Shift+Enter mutes the selected objects, or unmutes them when they are all muted. A muted object is greyed out, its label and outline alike, and does nothing: values pass through it unchanged. It keeps its arguments and whatever it remembers (such as a count's next number), and is unmuted when its square is given a different object.

Cmd/Ctrl+Z undoes the last change to the objects (typing, deleting, cutting, pasting, moving, muting or expanding them, or editing their arguments, which counts as one change from opening them to closing them), and Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redoes it. The last 4 changes can be undone. Undoing puts the selection back where it was before the change.

## Inputs

Alt+Shift+arrow on an object with arguments reaches it out into an input square that way, one more each time, up to one per argument that takes an input; Alt+Shift with the opposite arrow draws one back, and Alt+Shift with an arrow to either side turns the inputs that way, starting again from one. The inputs run in a straight line from the object and stand for its arguments in order, so `W` reached out east twice has `freq` then `type` inputs to its right. Math's and logic's `operator` changes what the object is, so it has no input and is only set in the editor: `m` and `l` reach out to one input, for `n`. Each input shows its argument (a number that isn't whole with 2 decimal places, such as `.50`), and the object itself shows its letter while it has inputs (`V` shows `V` rather than its value), apart from `m` and `l`, which still show their operator. The object and its inputs are outlined together in one border, in the object's colour (white for an operator). Inputs only reach onto empty squares, and an object typed, moved or pasted onto one cuts its line short. They move, copy and paste with their object, and go when its square is given a different object.

A number arriving on an input is absorbed and sets that argument, without any output, showing on the input for the tick it arrives; only a value arriving on the object itself does what the object does. A chord gives its first number, and a bang is ignored, passing over the input. A number argument takes the number, rounded when it only takes whole numbers, and ignores one it can't take (such as a `channel` of 17). An argument that takes a name takes a number as the name's index in its list, rounded and wrapped: a direction from `0` (n) to `6` (xy), a wave `type` from `0` (saw) to `5` (noi), a harmony `root` as semitones above c, from `0` (c) to `11` (b), and harmony `type` by its order in the code. A name typed as a whole number in the editor is kept as the name too, which math's and logic's `operator` take as well, by their order in the code. An argument set this way stays set, and the object carries on from what it remembers, as a count carries on counting within its new range. A muted object's inputs let values pass through.

## Generators

Shown as a green outlined square. A generator puts each value it outputs on the square next to it in `direction`, where the object on that square (or the input) acts on it on the same tick, so a generator beside an output plays as it fires. A value that would go past the edge of the grid isn't output. Values arriving on a generator pass through.

* **B** `bang(n, direction)`: output a bang every `n` cycles, in `direction`. Defaults: `n = 1`, `direction = e`. Displayed as `B`.
* **V** `value(value, n, direction)`: output `value` every `n` cycles, in `direction`. Defaults: `value = 0`, `n = 1`, `direction = e`. Displayed as the number.
* **W** `wave(freq, type, n, direction)`: output the value of a waveform, from 0 to 1, every `n` cycles, in `direction`. `type` is `saw`, `sin`, `cos`, `tri`, `sqr` or `noi` (ignoring case), or its number, from `0` (`saw`) to `5` (`noi`), kept as its name, and `freq` is waveform cycles per cycle, so `1` is one complete waveform per cycle and `2` is two. `noi` (noise) is smoothed randomness: a new random value at the start of each of its cycles, eased into the next, different for each square and each run. The waveform is in phase with the transport, starting at the top of the first cycle. Defaults: `freq = 1`, `type = sin`, `n = 1`, `direction = e`. Displayed as `W`.

## Operators

* **b** `bang()`: convert any incoming value into a bang.
* **i** `increment(from, to)`: output the next count each time a value is received, counting from `from` to `to` by 1. Wraps around at the ends, and counts down when `to` is below `from`. Defaults: `from = 0`, `to = 7`. Displayed as `i`.
* **d** `die()`: nullify incoming values.
* **h** `harmony(root, type, octaves)`: populate `values()` with the notes of a chord or scale. `root` can be given as semitones above c, from `0` to `11`. A bang outputs all notes; a number outputs the note at that index, wrapped. The root sits in the octave from middle C, and `octaves` repeats the notes in each octave above. Defaults: `root = c`, `type = ma`, `octaves = 1`. Displayed as root and type, cut to 3 letters, e.g. `Cma` or `F#d`.
* **m** `math(operator, n)`: transform incoming values using math operators. Bangs are 1. Defaults: `operator = +`, `n` empty (the value is left alone). Displayed as the operator.
* **l** `logic(operator, n)`: transform incoming values using logical operators. Bangs are true. Passing values become bangs, failing ones are nullified. Defaults: `operator = ==`, `n = 0`. Displayed as the operator.
* **p** `print()`: print to console.
* **r** `rotate(direction)`: turn the incoming value in `direction`. Default: `direction = x`. Displayed as the unicode direction.
* **s** `scale(lo, hi, inLo, inHi)`: map incoming values from `inLo` to `inHi` onto `lo` to `hi`. Bangs are 1, and each number of an array is scaled. Values outside the incoming range carry on past the ends. Defaults: `lo = 0`, `hi = 127`, `inLo = 0`, `inHi = 1`. Displayed as `s`.
* **v** `value(value)`: uses `values()`. Any incoming number or bang outputs the value. Default: `value = 0`. Displayed as the number.
* **w** `wave(freq, type)`: transform any bang or non-zero value into the value of a waveform, from 0 to 1, at that point in time, as **W** does. Zero passes unchanged. Defaults: `freq = 1`, `type = sin`. Displayed as the type, by name.

## Outputs

* **n** `note(vel, dur, device, channel)`: send incoming numbers as MIDI notes at velocity `vel` (0 to 127), lasting `dur` seconds, absorbing every value. Bangs are ignored; numbers are rounded and wrapped to 0 to 127. Defaults: `vel = 100`, `dur = .5`, `device = 0`, `channel = 1`. Displayed as `n`.
* **c** `cc(cc, device, channel)`: send incoming numbers as CC messages, absorbing every value. Bangs are ignored; numbers are rounded and wrapped to 0 to 127, and a chord sends its first number. Defaults: `cc = 1`, `device = 0`, `channel = 1`. Displayed as `cc<number>`, e.g. `cc7`.