/**
 * @file Chroma utilitiy functions.
 */
import chroma, { Color } from 'chroma-js'

/**
 * Transforms RGBA to GLSL vec3 value (normalizes 0..255 to 0..1)
 * @param {ColorStop} colorStop Figma color stop
 */
export function gl(colorStop: ColorStop): Color {
	return chroma.gl(
		colorStop.color.r,
		colorStop.color.g,
		colorStop.color.b,
		colorStop.color.a
	)
}
