// Tab order wraps between the grid and the controls
export const focusGrid = () =>
    document.querySelector<HTMLElement>('[aria-label="Grid"]')?.focus({ preventScroll: true })

export const focusControls = () =>
    document.querySelector<HTMLElement>('[aria-label="Controls"] button')?.focus()
