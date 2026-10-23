# Rules

A formal specification of Teomata's rules.

## Types and definitions

Value: bang | number
Direction: n | e | s | w | x | y | xy
Compass points are displayed as arrows (e.g. `←`), `↕` for x, `↔` for y, and `⤡` for xy.

cycle - name for a musical bar without having to specify beats/divisions

Directions are used by generators and the rotate operator. The compass points are fixed. `x`, `y`, and `xy` pick a random direction along the given axis or axes.

## Objects

There are three kinds of object:

- **Generators** (uppercase, green outline): output values on their own schedule. Values may pass through unchanged without triggering output.
- **Operators** (lowercase, no outline): transform incoming values.
- **Outputs** (lowercase, blue outline): translate values as MIDI notes and control messages.

A generator and an operator may share a letter. The generator emits values on its own; the operator emits only when it receives one.

## Generators

Shown as a green outlined square.

* **B** `bang(n, direction)`: output a bang every `n` cycles, in `direction`. Defaults: `n = 1`, `direction = e`. Displayed as e.g. `b↕`
* **V** `value(value, n, direction)`: output `value` every `n` cycles, in `direction`. Defaults: `n = 1`, `direction = e`. Displayed as the number and the unicode direction
* **I** `increment(from, to)`: count from `from` to `to`, outputting each step every `n` cycles, in `direction`. Displayed as the next count and direction.

## Operators

* **b** `bang()`: convert any incoming value into a bang.
* **i** `increment(from, to)`: output the next count each time a value is received. Displayed as the next count.
* **d** `die()`: nullify incoming values.
* **h** `harmony(root, type, octaves)`: populate `values()` with the notes of a chord or scale. A bang outputs all notes; a number outputs the note at that index. Displayed as root and type, e.g. `Cma`.
* **m** `math(operator, n)`: transform incoming values using math operators. Bangs are 1. Displayed as the operator.
* **l** `logic(operator, n)`: transform incoming values using logical operators. Bangs are true. Displayed as the operator.
* **p** `print()`: print to console.
* **r** `rotate(direction)`: turn the incoming value in `direction`. Displayed as the unicode direction.
* **v** `value(value)`: uses `values()`. Any incoming number or bang outputs the value. Displayed as the number.

## Outputs

* **n** `note(device, channel)`: send incoming numbers as MIDI notes. Bangs are ignored; numbers are rounded and wrapped. Displayed as `n`.
* **c** `cc(device, channel, cc)`: send incoming numbers as CC messages. Bangs are ignored; numbers are rounded and wrapped. Displayed as `cc<number>`, e.g. `cc7`.