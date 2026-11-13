# Teomata

Teomata is a grid of single-letter functions; run on each tick to determine the grid's next state.

A `cycle` is a musical bar. `cps` sets the tempo. `q` sets the quantization value (ticks per cycle).

There are three types of function: 

- **Generators** (uppercase, green outline): emit values
- **Operators** (lowercase, no outline): transform values
- **Destinations** (lowercase, blue outline): output MIDI and set global parameters

Values can be bangs, numbers, or lists of numbers.

`Generators` emit values with trajectories: either compass points (`n`, `e`, `s`, `w`) or axes (`x`, `y`, `xy`). `?` after an axis picks a direction at random.

Every function takes `mode` as its final argument. Most functions can be `on` or `off`; some can also be `thru`.

- **on**: the function works normally.
- **thru**: the function is outlined in dashes, works normally and passes values through unchanged.
- **off**: the function is greyed out and inactive, passes values through unchanged, emits nothing.

Press Shift+Enter to cycle through a functions's modes. Press Enter on a function to open and close its arguments. Alt+Shift+arrow exposes arguments to the grid.

Ctrl/Cmd+S saves a patch and Ctrl/Cmd+O opens one.