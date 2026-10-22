// The text shown for each operation and its params in the instructions,
// gathered here so it can be edited as a whole. Each operation's file
// takes its text from here, by its params' names
export const about = {
    bang: {
        about: "Output a bang every n cycles, in a given direction.",
        params: {
            n: "1 is once per cycle, .5 is twice per cycle, etc.",
            direction: "n, s, e, w, x or y.",
        },
    },
    counter: {
        about: "Count from one number to another, outputting the count for each incoming value. Wraps around at the ends.",
        params: {
            from: "Any number, the first count.",
            to: "Any number, the last count. Counts down when below from.",
        },
    },
    harmony: {
        about: "Populate values() with the notes from a chord.",
        params: {
            root: "A note from a to g, with an optional # or b, such as c#.",
            triad: "ma, mi, au or di, for major, minor, augmented or diminished.",
            inversion: "0, 1 or 2. Other whole numbers wrap around.",
        },
    },
    die: {
        about: "Nullify value.",
        params: {},
    },
    logic: {
        about: "Test incoming values using logical operators. Bangs if true, null if false.",
        params: {
            operator: "<, >, <=, >=, == (also ===), != (also !==), && (and), || (or) and ^ (xor) take the value and n. ! (not) takes the value alone. "
                + "A number is true when it isn't 0.",
            n: "Any number, for the operators that take one.",
        },
    },
    math: {
        about: "Transform incoming values using math operators.",
        params: {
            operator: "Any operator from the JS Math object.",
            n: "Any number, for the operators that take one. Left empty, they leave the value alone.",
        },
    },
    rotate: {
        about: "Rotate moving cell.",
        params: {
            direction: "Rotates cells n, s, e, w, x or y.",
        },
    },
    values: {
        about: "Output one of more values. A bang outputs all values, an integer output the value at that index.",
        params: {
            value: "Any number, one per square. Empty squares are skipped.",
        },
    },
    explode: {
        about: "Explode an array's values out in a line in a given direction, or both ways along an axis.",
        params: {
            direction: "n, s, e or w, or x or y to explode both ways along an axis.",
        },
    },
}
