import type { CellRule, Operation } from "./types"
import { about } from "./instructions"
import { printValue } from "../stores/console"
import { isMoving } from "./shared"

// Prints the value of each moving cell that arrives to the console, leaving the cell alone
const createPrint = (): CellRule => cell => {
    if (isMoving(cell)) printValue(cell.value!)
    return cell
}

export const print: Operation = {
    name: "print",
    kind: "operator",
    about: about.p.about,
    params: [],
    rule: createPrint,
}
