import chroma, { Color } from 'chroma-js'

/**
 * Utility that returns an RGBA object with the channel range normalized from 0..255 to 0..1
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
