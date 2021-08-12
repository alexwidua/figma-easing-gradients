/**
 * Checks if selection is a valid geometry node by looking for fill properties.
 * @param selection
 * @returns false invalid nodes, ex. SlideNodes
 */
export function isShape(selection: any): selection is GeometryMixin {
	return 'fills' in selection
}

/**
 * Checks if given fill layer is a gradient fill by looking for color stops.
 * @param fill : Figma paint layer
 * @returns false if fill doesn't contains gradient fills, ex. SolidPaint or ImagePaint
 */
export function isGradient(fill: Paint): fill is GradientPaint {
	return 'gradientStops' in fill
}
