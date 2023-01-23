import chroma from 'chroma-js'
import { gl } from '../utils/color'
import { cubicCoordinates } from '../utils/easing'

export function interpolateColorStops(fill: GradientPaint, decoratedStops): ColorStop[] {
    const { gradientStops } = fill

    // How many color stops are used to interpolate between first and last stop
    // TODO: Should this be an user-facing option?
    const granularity = 15

    let stops: ColorStop[] = []
    for (let i = 0; i < decoratedStops.length - 1; i++) {
        const start = decoratedStops[i]
        const end = decoratedStops[i + 1]

        const matrix = decoratedStops[i].easing
        const cubic = cubicCoordinates(
            matrix[0][0],
            matrix[0][1],
            matrix[1][0],
            matrix[1][1],
            granularity
        )
        stops = stops.concat(
            cubic.map((t) => {
                const [r, g, b, a] = chroma
                    .mix(gl(start.color), gl(end.color), t.y, 'rgb')
                    .gl()
                return {
                    color: { r, g, b, a },
                    position: start.position + t.x * (end.position - start.position)
                }
            })
        )
    }
    return stops
}
