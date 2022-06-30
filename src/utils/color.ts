/**
 * @file Chroma utilitiy functions.
 */
import chroma, { Color } from 'chroma-js'

/**
 * Transforms RGBA to GLSL vec3 value (normalizes 0..255 to 0..1)
 * @param {ColorStop} colorStop Figma color stop
 */
export function gl({ color: { r, g, b, a } }: ColorStop): Color {
	return chroma.gl(r, g, b, a)
}
