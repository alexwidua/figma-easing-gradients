import easingCoordinates from 'easing-coordinates';
import chroma from 'chroma-js';
import { glColor } from './color';

/**
 * Returns array containing the bezier-eased gradient.
 * @param {GradientPaint} fill Gradient object with fill properties
 * @param {number} steps Number of steps to draw the Bézier curve
 */
export function easeGradient(
  fill: GradientPaint,
  type: string,
  coords: Record<string, number>,
  steps: number,
  skip: string
): Array<ColorStop> {
  // get first and last color stop
  const colorStops = [
    glColor(fill.gradientStops[0]),
    glColor(fill.gradientStops[fill.gradientStops.length - 1])
  ];

  const colorStopPositions = [
    fill.gradientStops[0].position,
    fill.gradientStops[fill.gradientStops.length - 1].position
  ];

  // cubic-bézier or step easing with timing values handed from ui
  const ease =
    type == 'curve'
      ? easingCoordinates(
          `cubic-bezier(${coords.x1},${coords.y1},${coords.x2},${coords.y2})`,
          15
        )
      : easingCoordinates(`steps(${steps}, ${skip})`);

  // map easing to Figma ColorStop object
  return ease.map(position => {
    const [r, g, b, a] = chroma
      .mix(colorStops[0], colorStops[1], position.y, 'rgb')
      .gl();
    return {
      color: { r, g, b, a },
      position:
        colorStopPositions[0] +
        position.x * (colorStopPositions[1] - colorStopPositions[0])
    };
  });
}
