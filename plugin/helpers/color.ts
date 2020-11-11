import chroma, { Color } from 'chroma-js';

/**
 * Returns a RGBA object with the channel range normalized from 0..255 to 0..1
 * See: https://gka.github.io/chroma.js/#chroma-gl
 * @param {ColorStop} colorStop RGBA colorStop object
 */
export function glColor(colorStop: ColorStop): Color {
  return chroma.gl(
    colorStop.color.r,
    colorStop.color.g,
    colorStop.color.b,
    colorStop.color.a
  );
}
