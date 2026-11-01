// The text shown for each operation and its params in the instructions,
// gathered here so it can be edited as a whole. It is keyed by letter, as a
// generator and an operator can share a name. Each operation's file takes its
// text from here, by its params' names

const direction = "n, e, s or w. x, y or xy randomly choose a direction on the axis/axes. Or a number from 0 (n) to 6 (xy)."
const rate = "Outputs per cycle. 1 outputs once per cycle, 2 twice per cycle, 0.5 every other cycle, etc."
const device = "The MIDI output by its number, counting from 0."
const channel = "A MIDI channel from 1 to 16."
const type = "saw, sin, cos, tri, sqr, or noi, or a number from 0 (saw) to 5 (noi)."
const freq = "Waveform frequency relative to cps."
export const mode = "on or off, or a number, 0 (on) or 1 (off). Off lets values pass unchanged. Shift+Enter toggles the mode."
export const outputMode = "on, off or thru, or a number from 0 (on) to 2 (thru). Off sends no output. Thru sends as usual, but lets values through. Shift+Enter steps through the modes."

export const about = {
    // Generators
    B: {
        about: "Output a bang rate times per cycle, in a given direction. Values arriving pass through.",
        params: { rate, direction },
    },
    V: {
        about: "Output a value rate times per cycle, in a given direction. Values arriving pass through.",
        params: { value: "Any number.", rate, direction },
    },
    W: {
        about: "Output the current position of a waveform, from 0 to 1, rate times per cycle, in a given direction. Values arriving pass through.",
        params: { type, freq, rate, direction },
    },
    // Operators
    b: {
        about: "Convert any incoming value into a bang.",
        params: {},
    },
    c: {
        about: "Count each incoming value, outputting the count so far.",
        params: { reset: "0 or 1. While 1, the count is held at 0." },
    },
    d: {
        about: "Nullify incoming values.",
        params: {},
    },
    g: {
        about: "Only let through values that match. Nullifies everything else. Bangs are 1.",
        params: { match: "Any number." },
    },
    h: {
        about: "Output the notes of a chord or scale. A bang outputs all the notes, a number outputs the note at that index.",
        params: {
            root: "A note from a to g, with an optional # or b, such as c#, in the octave from middle C.",
            type: "A chord (ma, mi, au or di, for major, minor, augmented or diminished) or a scale or mode by its three letter alias, such as dor for dorian. See the <a href=\"https://raw.githubusercontent.com/cephasteom/teomata/refs/heads/main/src/lib/harmony.ts\" target=\"_blank\" rel=\"noopener\">full list</a>.",
            octaves: "How many octaves the notes span upwards, from 1 to 8.",
        },
    },
    l: {
        about: "Test incoming values using logical operators. Outputs 1 if true, 0 if false. Bangs are true.",
        params: {
            operator: "<, >, <=, >=, ==, !=, &&, || and ^ compare the value with num. ! (not) uses the value alone. "
                + "A number is true when it isn't 0.",
            num: "Any number.",
        },
    },
    m: {
        about: "Transform incoming values using math operators. Bangs are 1.",
        params: {
            operator: "+, -, *, /, %, ^, & or |, or any function from the JS Math object, such as min or sqrt.",
            num: "Any number.",
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
        params: { type, freq },
    },
    // Outputs
    k: {
        about: "Send incoming numbers as MIDI CC messages, rounded and wrapped to 0 to 127, or the first of several. Bangs are ignored. Absorbs every value, unless thru.",
        params: { cc: "The controller number, from 0 to 127.", device, channel },
    },
    n: {
        about: "Send incoming numbers as MIDI notes, rounded and wrapped to 0 to 127, or several as a chord. Bangs are ignored. Absorbs every value, unless thru.",
        params: {
            vel: "The velocity, from 0 to 127.",
            dur: "How long each note lasts, in seconds.",
            device,
            channel,
        },
    },
}
