// Works out arithmetic typed into an argument, such as 1/8 or (3+1)*2, with
// +, -, *, /, % and ^ (power), brackets and signs, the usual way round.
// Null when the text isn't arithmetic or doesn't come out a finite number
export const calculate = (text: string): number | null => {
    const tokens = text.match(/\d*\.?\d+(?:e[+-]?\d+)?|\d+\.|[-+*/%^()]|\S/gi) ?? []
    let at = 0
    const peek = () => tokens[at]
    const take = () => tokens[at++]

    // sum: product (("+" | "-") product)*
    const sum = (): number => {
        let value = product()
        while (peek() === "+" || peek() === "-") value = take() === "+" ? value + product() : value - product()
        return value
    }
    // product: power (("*" | "/" | "%") power)*
    const product = (): number => {
        let value = power()
        while (peek() === "*" || peek() === "/" || peek() === "%") {
            const operator = take()
            const right = power()
            value = operator === "*" ? value * right : operator === "/" ? value / right : value % right
        }
        return value
    }
    // power: sign ("^" power)?, so 2^3^2 is 2^9
    const power = (): number => {
        const base = sign()
        return peek() === "^" ? (take(), base ** power()) : base
    }
    // sign: ("+" | "-") sign | number | "(" sum ")"
    const sign = (): number => {
        const token = take()
        if (token === "-") return -sign()
        if (token === "+") return sign()
        if (token === "(") {
            const value = sum()
            if (take() !== ")") throw new Error("unclosed bracket")
            return value
        }
        if (token === undefined || !/^[\d.]/.test(token)) throw new Error("not a number")
        return Number(token)
    }

    try {
        const value = sum()
        if (at < tokens.length || !Number.isFinite(value)) return null
        // Tidy away floating point noise, such as 0.1+0.2 giving 0.30000000000000004
        return Number(value.toPrecision(12))
    } catch {
        return null
    }
}

// A number as an argument, as short as it goes, so 0.125 is .125
export const formatArg = (value: number) => String(value).replace(/^(-?)0\./, "$1.")

// A number argument as it shows, a whole number as it is and any other with 2
// decimal places, filled with 0s, so .5 shows as .50, as a wave's value can
// run to many. The argument itself keeps every place
export const shortened = (text: string) => {
    if (text === "" || !Number.isFinite(Number(text))) return text
    const n = Number(text)
    return Number.isInteger(n) ? formatArg(n) : n.toFixed(2).replace(/^(-?)0\./, "$1.")
}
