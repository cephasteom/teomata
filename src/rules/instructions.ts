// The text shown for each operation and its params in the instructions,
// gathered here so it can be edited as a whole. It is keyed by letter, as a
// generator and an operator can share a name. Each operation's file takes its
// text from here, by its params' names

const direction = "n, e, s or w. x, y or xy randomly chooses a direction on the axis/axes. Or a number: 0 n, 1 e, 2 s, 3 w, 4 x, 5 y, 6 xy."
const cycles = "Bangs per cycle: 1 is once per cycle, .5 is twice per cycle, etc."
const device = "The MIDI output by its number, counting from 0."
const channel = "A MIDI channel from 1 to 16."
const type = "saw, sin, cos, tri or sqr, or noi (noise) for smoothed randomness, or its number from 0 (saw) to 5 (noi)."
const freq = "Frequency of the waveform relative to cps."

export const about = {
    // Generators
    B: {
        about: "Output a bang every n cycles, in a given direction. Values arriving pass through.",
        params: { n: cycles, direction },
    },
    V: {
        about: "Output a value every n cycles, in a given direction. Values arriving pass through.",
        params: { value: "Any number.", n: cycles, direction },
    },
    W: {
        about: "Output the current position of a waveform, from 0 to 1, every n cycles, in a given direction. Values arriving pass through.",
        params: { freq, type, n: cycles, direction },
    },
    // Operators
    b: {
        about: "Convert any incoming value into a bang.",
        params: {},
    },
    d: {
        about: "Nullify incoming values.",
        params: {},
    },
    h: {
        about: "Output the notes of a chord or scale. A bang outputs all the notes, a number outputs the note at that index.",
        params: {
            root: "A note from a to g, with an optional # or b, such as c#, in the octave from middle C.",
            type: "A chord (ma, mi, au or di, for major, minor, augmented or diminished) or a scale or mode by its three letter alias, such as dor for dorian. See the <a href=\"https://raw.githubusercontent.com/cephasteom/teomata/refs/heads/main/src/lib/harmony.ts\" target=\"_blank\" rel=\"noopener\">full list</a>.",
            octaves: "How many octaves the notes span upwards, from 1 to 8.",
        },
    },
    i: {
        about: "Count from one number to another, outputting the next count each time a value arrives. Wraps around at the ends.",
        params: {
            from: "Any number, the first count.",
            to: "Any number, the last count. Counts down when below from.",
        },
    },
    l: {
        about: "Test incoming values using logical operators. Bangs if true, nullifies if false. Bangs are true.",
        params: {
            operator: "<, >, <=, >=, ==, !=, &&, || and ^ compare the value with n. ! (not) uses the value alone. "
                + "A number is true when it isn't 0.",
            n: "Any number.",
        },
    },
    m: {
        about: "Transform incoming values using math operators. Bangs are 1.",
        params: {
            operator: "+, -, *, /, %, ^, & or |, or any function from the JS Math object, such as min or sqrt.",
            n: "Any number.",
        },
    },
    p: {
        about: "Print incoming values to the console.",
        params: {},
    },
    r: {
        about: "Turn incoming values to travel in a given direction.",
        params: { direction },
    },
    s: {
        about: "Scale incoming values from one range to another. Bangs are 1.",
        params: {
            outLo: "Any number, output low value.",
            outHi: "Any number, output high value.",
            inLo: "Any number, the bottom of the incoming range.",
            inHi: "Any number, the top of the incoming range.",
        },
    },
    v: {
        about: "Output a value for any incoming value.",
        params: { value: "Any number." },
    },
    w: {
        about: "Output the current position of a waveform, from 0 to 1.",
        params: { freq, type },
    },
    // Outputs
    c: {
        about: "Send incoming numbers as MIDI CC messages, rounded and wrapped to 0 to 127, or the first of several. Bangs are ignored.",
        params: { cc: "The controller number, from 0 to 127.", device, channel },
    },
    n: {
        about: "Send incoming numbers as MIDI notes, rounded and wrapped to 0 to 127, or several as a chord. Bangs are ignored.",
        params: {
            vel: "The velocity, from 0 to 127.",
            dur: "How long each note lasts, in seconds.",
            device,
            channel,
        },
    },
}
