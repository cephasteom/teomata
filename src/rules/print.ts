import type { CellRule, Operation } from "./_types"
import { about } from "./_instructions"
import { formatValue } from "../stores/console"
import { emit } from "./_events"
import { isMoving } from "./_shared"

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
