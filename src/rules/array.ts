import { createValues } from "./value"
import type { Operation, Param } from "./_types"
import { isNumber } from "./_shared"
import { about } from "./_instructions"

// One of the values, which may be left empty, when it's left out of the array
const values: Param = {
    name: "values",
    about: about.a.params.values,
    fallback: "",
    accepts: text => text === "" || isNumber(text),
}

// The numbers given, leaving out the mode, which comes last, and any left empty
const numbersOf = (args: string[]) => args.slice(0, -1).filter(isNumber).map(Number)

export const array: Operation = {
    name: "array",
    kind: "operator",
    about: about.a.about,
    params: [],
    rest: values,
    shown: args => args.slice(0, -1).findLastIndex(text => text !== "") + 2,
    rule: (...args) => createValues(numbersOf(args)),
}
