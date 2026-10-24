import type { CellRule, Operation } from "./types"
import { about } from "./instructions"
import { formatValue } from "../stores/console"
import { emit } from "./events"
import { isMoving } from "./shared"

// Prints the value of each moving cell that arrives to the console, leaving the cell alone
const createPrint = (): CellRule => cell => {
    if (isMoving(cell)) emit({ type: "print", text: formatValue(cell.value!) })
    return cell
}

export const print: Operation = {
    name: "print",
    kind: "operator",
    about: about.p.about,
    params: [],
    rule: createPrint,
}
