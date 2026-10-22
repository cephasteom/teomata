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
        about: "Populate values() with the notes from a chord or scale.",
        params: {
            type: "A chord (ma, mi, au or di, for major, minor, augmented or diminished) or a scale or mode by its three letter alias, such as dor for dorian. See the <a href=\"https://raw.githubusercontent.com/cephasteom/teomata/refs/heads/main/src/lib/harmony.ts\" target=\"_blank\" rel=\"noopener\">full list</a>.",
            root: "A note from a to g, with an optional # or b, such as c#.",
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
    print: {
        about: "Print incoming values to the console.",
        params: {},
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
    out: {
        about: "Play incoming numbers as MIDI notes. Takes up three squares in a line in its direction: the note's, then amp's and dur's, which set the velocity and length of the notes that follow without playing one.",
        params: {
            device: "The MIDI output by its number, counting from 0.",
            channel: "A MIDI channel from 1 to 16.",
            direction: "n, s, e or w, the way amp's and dur's squares go from the note's.",
        },
    },
    explode: {
        about: "Explode an array's values out in a line in a given direction, or both ways along an axis.",
        params: {
            direction: "n, s, e or w, or x or y to explode both ways along an axis.",
        },
    },
}
