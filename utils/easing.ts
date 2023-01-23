export function cubicCoordinates(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    steps = 10
): any {
    const increment = 1 / steps
    let coordinates: any = []
    for (let i = 0; i <= 1; i += increment) {
        coordinates.push({
            x: bezier(i, x1, x2),
            y: bezier(i, y1, y2)
        })
    }
    return coordinates.map((obj: any) => coordinate(obj.x, obj.y))
}

function coordinate(x: number, y: number) {
    return {
        x: x.toFixed(10), // round to max ten decimals
        y: y.toFixed(10)
    }
}

function bezier(t: number, n1: number, n2: number): number {
    return (
        (1 - t) * (1 - t) * (1 - t) * 0 +
        3 * ((1 - t) * (1 - t)) * t * n1 +
        3 * (1 - t) * (t * t) * n2 +
        t * t * t * 1
    )
}
