/**
 * @file This file contains interpolateColorStops(), which is the 'main
 * logic behind easing gradient fills.
 */

import easingCoordinates from 'easing-coordinates'
import chroma from 'chroma-js'
import { gl } from './color'
import { EasingType, EasingOptions } from '../main'

/**
 * Checks if given fill is a gradient fill with at least two color stops.
 * @returns false if fill isn't a gradient fill, ex. SolidPaint or ImagePaint
 */
export function isGradientFillWithMultipleStops(
    fill: Paint
): fill is GradientPaint {
    return 'gradientStops' in fill && fill?.gradientStops?.length > 1
}

/**
 * Interpolates the current stops by larger number of easing steps
 * @returns Returns an array of color stops which represents the eased color gradient.
 */
export function interpolateColorStops(
    fill: GradientPaint,
    options: EasingOptions
): ColorStop[] {
    const { type, matrix, steps, skip } = options
    const { gradientStops } = fill

    console.log('interpolating ', { options, gradientStops })

    // How many color stops are used to interpolate between first and last stop
    // TODO: Should this be an user-facing option?
    const granularity = 15

    let stops: ColorStop[] = []
    for (let i = 0; i < gradientStops.length - 1; i++) {
        const start = gradientStops[i]
        const end = gradientStops[i + 1]

        const coordinates =
            type == 'CURVE'
                ? easingCoordinates(
                      `cubic-bezier(
        				${matrix[0][0]},
        				${matrix[0][1]},
        				${matrix[1][0]},
        				${matrix[1][1]})`,
                      granularity
                  )
                : easingCoordinates(`steps(${steps}, ${skip})`)

        // if we're not at the end, drop the last coordinate
        if (i < gradientStops.length - 2) {
            coordinates.pop()
        }

        stops = stops.concat(
            coordinates.map((t) => {
                const [r, g, b, a] = chroma
                    .mix(gl(start), gl(end), t.y, 'rgb')
                    .gl()
                return {
                    color: { r, g, b, a },
                    position:
                        start.position + t.x * (end.position - start.position),
                }
            })
        )
    }
    return stops
}
