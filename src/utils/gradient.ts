/**
 * @file This file contains interpolateColorStops(), which is the 'main
 * logic behind easing gradient fills.
 */
import chroma from 'chroma-js'
import bezierEasing from 'bezier-easing'
import { gl } from './color'
import { stepsCoordinates, curveCoordinates } from './coordinates'
import { EasingOptions, SkipOption } from '../main'

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
 * Interpolates two color stops with a given set of coordinates or number fo steps.
 * @returns Returns an array of color stops which represents the eased color gradient.
 */
export function interpolateColorStops(
	fill: GradientPaint,
	options: EasingOptions
): any[] {
	const { type, matrix, steps, skip } = options
	const firstColor = gl(fill.gradientStops[0])
	const lastColor = gl(fill.gradientStops[fill.gradientStops.length - 1])
	const scale = chroma.scale([firstColor, lastColor])

	if (type === 'STEPS') {
		const coords = stepsCoordinates(steps, skip as SkipOption)
		return coords.map((position) => {
			const [r, g, b, a] = scale(position.y).gl()
			return {
				color: { r, g, b, a },
				position: position.x
			}
		})
	}
	// else if 'CURVE'
	const colorSteps = 15
	const coords = curveCoordinates(colorSteps)
	const ease = bezierEasing(
		matrix[0][0],
		matrix[0][1],
		matrix[1][0],
		matrix[1][1]
	)
	return coords.map((position) => {
		const [r, g, b, a] = scale(ease(position)).gl()
		return {
			color: { r, g, b, a },
			position
		}
	})
}
