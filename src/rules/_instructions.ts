const dir = "n, e, s, w, x, y, xy, x?, y? or xy?. Or a number from 0 (n) to 9 (xy?)."
const rate = "Number of values emitted per cycle."
const device = "The MIDI output by its number, counting from 0."
const ch = "A MIDI channel from 1 to 16, or 0 for all channels."
const input = "The MIDI input by its number, counting from 0."
const delay = "Delay output, in cycles. Useful for MIDI note and CC in as it make possible quantization to the nearest tick, rather than the next tick."
const type = "saw, sin, cos, tri, sqr, or noi, or a number from 0 (saw) to 5 (noi)."
const freq = "Waveform frequency, relative to global cps."
export const mode = "on or off, or a number, 0 (on) or 1 (off). Off lets values pass unchanged. Shift+Enter toggles the mode."
export const destinationMode = "on, off or thru, or a number from 0 (on) to 2 (thru). Off sends no output. Thru sends as usual, but lets values through. Shift+Enter steps through the modes."

export const about = {
    // Generators
    B: {
        about: "Emit bangs at a given rate and direction.",
        params: { rate, dir },
    },
    K: {
        about: "Emit MIDI CC values.",
        params: { cc: "The controller number, from 0 to 127.", device: input, ch, delay, dir },
    },
    N: {
        about: "Emit MIDI notes played.",
        params: { device: input, ch, delay, dir },
    },
    V: {
        about: "Emit values at a given rate and direction.",
        params: { value: "Any number.", rate, dir },
    },
    W: {
        about: "Emit time varying values between 0 and 1, at a given rate and direction.",
        params: { type, freq, rate, dir },
    },

    // Operators
    a: {
        about: "Store an array of values. A bang outputs all the values, a number outputs the value at that index.",
        params: { values: "Any numbers, one per square. Empty ones are left out." },
    },
    b: {
        about: "Convert any incoming value into a bang.",
        params: {},
    },
    c: {
        about: "Count each incoming value, outputting the count so far.",
        params: { 
            reset: "Reset the count every n cycles. A bang on its input resets the count." 
        },
    },
    d: {
        about: "Nullify incoming values.",
        params: {},
    },
    e: {
        about: "Clone another square: its functionality, its arguments, and the cells passing over it.",
        params: {
            x: "The square's column.",
            y: "The square's row.",
        },
    },
    g: {
        about: "Let through values that match a given value, nullify everything else. Bangs are 1.",
        params: { match: "Any number." },
    },
    h: {
        about: "Output the notes of a chord or scale. A bang outputs all the notes, a number outputs the note at that index.",
        params: {
            root: "A note from a to g, with an optional # or b, e.g. c#.",
            type: "A chord by its two letter alias (ma, mi, au or di) or a scale or mode by its three letter alias (ion, dor, phrm lyd...). See the <a href=\"https://raw.githubusercontent.com/cephasteom/teomata/refs/heads/main/src/lib/harmony.ts\" target=\"_blank\" rel=\"noopener\">full list</a>.",
            deg: "The degree to start on, from 0 (the root) to 32, like an inversion. Degree 1 of ma plays 3, 5, 8.",
            oct: "The octave of the root, from 0 to 8, so 3 is C3.",
            len: "The number of notes, from 0 to 32, carrying on into the octaves above. 0 plays as many as the chord or scale has.",
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
    o: {
        about: "Loop incoming values.",
        params: {
            record: "0 or 1. While 1, incoming values pass through and are recorded. A bang on its input records for one loop length.",
            reset: "Clear the loop every n cycles. A bang on its input clears the loop immediately.",
            length: "The length of the loop, in cycles.",
        },
    },
    p: {
        about: "Print incoming values to the console.",
        params: {},
    },
    r: {
        about: "Turn incoming values to travel in a given direction or directions.",
        params: { dir },
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
    
    // Destinations
    k: {
        about: "Send incoming value as MIDI CC messages. Bangs are ignored.",
        params: { cc: "The controller number, from 0 to 127.", device, ch },
    },
    n: {
        about: "Send incoming values as MIDI notes. Bangs are ignored.",
        params: {
            vel: "The velocity, from 0 to 127.",
            dur: "Note duration, in cycles: 1 is a whole cycle, .25 a quarter.",
            device,
            ch,
        },
    },
    q: {
        about: "Set the global q (divisions per cycle) to incoming values, rounded and clamped from 1 to 64. Bangs are ignored.",
        params: {},
    },
    t: {
        about: "Set the global tempo (cps) to incoming values, clamped from 0.05 to 2. Bangs are ignored.",
        params: {},
    },
}
