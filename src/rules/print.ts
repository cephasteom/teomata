import type { CellRule, Operation } from "./types"
import { about } from "./instructions"
import { printValue } from "../stores/console"

// Prints the value of each moving cell that arrives to the console, leaving the cell alone
const createPrint = (): CellRule => cell => {
    if (cell.direction && cell.value !== undefined) printValue(cell.value)
    return cell
}

export const print: Operation = {
    name: "print",
    about: about.print.about,
    params: [],
    rule: createPrint,
}
