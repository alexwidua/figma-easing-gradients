import easingCoordinates from 'easing-coordinates'
import chroma from 'chroma-js'
import { gl } from './color'

/**
 * Checks if given fill is a gradient fill by searching for color stops.
 * @param fill : Figma paint layer
 * @returns false if fill isn't a gradient fill, ex. SolidPaint or ImagePaint
 */
export function isGradientFill(fill: Paint): fill is GradientPaint {
	return 'gradientStops' in fill
}

/**
 * Interpolates two color stops with a given set of coordinates or number fo steps.
 * @param fill - The to-be-eased Figma gradient fill layer
 * @param options
 * @returns Returns an array of color stops which represents the eased color gradient.
 */
export function interpolateColorStops(
	fill: GradientPaint,
	options: EasingOptions
): Array<ColorStop> {
	const { type, matrix, steps, skip } = options

	const stops = [
		fill.gradientStops[0],
		fill.gradientStops[fill.gradientStops.length - 1]
	]
	const stopColor = [gl(stops[0]), gl(stops[1])]
	const stopPosition = [stops[0].position, stops[1].position]

	// How many color stops are used to interpolate between first and last stop
	// TODO: Should this be an user-facing option?
	const granularity = 15

	const coordinates =
		(type as EasingType) == 'CURVE'
			? easingCoordinates(
					`cubic-bezier(
						${matrix[0][0]},
						${matrix[0][1]},
						${matrix[1][0]},${matrix![0][0]})`,
					granularity
			  )
			: easingCoordinates(`steps(${steps}, ${skip})`)

	return coordinates.map((position) => {
		const [r, g, b, a] = chroma
			.mix(stopColor[0], stopColor[1], position.y, 'rgb')
			.gl()
		return {
			color: { r, g, b, a },
			position:
				stopPosition[0] +
				position.x * (stopPosition[1] - stopPosition[0])
		}
	})
}
