// The text shown for each operation and its params in the instructions,
// gathered here so it can be edited as a whole. It is keyed by letter, as a
// generator and an operator can share a name. Each operation's file takes its
// text from here, by its params' names

const direction = "n, e, s or w, or x, y or xy for a random direction along that axis or either."
const cycles = "Cycles between outputs: 1 is once per cycle, .5 is twice per cycle, etc."
const device = "The MIDI output by its number, counting from 0."
const channel = "A MIDI channel from 1 to 16."
const type = "saw, sin, cos, tri or sqr, or noi (noise) for smoothed randomness."
const freq = "Waveform cycles per cycle: 1 is one complete waveform per cycle, 2 is two, .5 is one every two cycles, etc. For noi, how many new random values it eases between per cycle."

export const about = {
    // Generators
    B: {
        about: "Output a bang every n cycles, in a given direction. Values arriving pass through.",
        params: { n: cycles, direction },
    },
    I: {
        about: "Count from one number to another, outputting each step every n cycles, in a given direction. Wraps around at the ends. Values arriving pass through.",
        params: {
            from: "Any number, the first count.",
            to: "Any number, the last count. Counts down when below from.",
            n: cycles,
            direction,
        },
    },
    V: {
        about: "Output a value every n cycles, in a given direction. Values arriving pass through.",
        params: { value: "Any number.", n: cycles, direction },
    },
    W: {
        about: "Output the value of a waveform, from 0 to 1, every n cycles, in a given direction. Values arriving pass through.",
        params: { type, freq, n: cycles, direction },
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
    v: {
        about: "Output a value for any incoming value.",
        params: { value: "Any number." },
    },
    w: {
        about: "Turn any bang or non zero value arriving into the value of a waveform at that moment, from 0 to 1.",
        params: { type, freq },
    },
    // Outputs
    c: {
        about: "Send incoming numbers as MIDI CC messages, rounded and wrapped to 0 to 127, or the first of several. Bangs are ignored.",
        params: { device, channel, cc: "The controller number, from 0 to 127." },
    },
    n: {
        about: "Send incoming numbers as MIDI notes, rounded and wrapped to 0 to 127, or several as a chord. Bangs are ignored.",
        params: { device, channel },
    },
}
