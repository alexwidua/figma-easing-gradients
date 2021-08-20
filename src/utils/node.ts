/**
 * Utility functions that raverse nodes or node properties.
 */

import { isGradientFillWithMultipleStops } from './gradient'

/**
 * Checks if selection is a valid geometry node by looking for fill properties.
 * @returns false if node is not a geometry node, ex. SlideNodes
 */
export function nodeIsGeometryMixin(
	selection: any
): selection is GeometryMixin {
	return 'fills' in selection
}

/**
 * Traverses all fills and searches for atleast one gradient fill.
 * @returns true if node has atleast one gradient fill
 */
export function nodeHasGradientFill(node: GeometryMixin) {
	const fills = node.fills as Paint[]
	return fills.findIndex(fill => isGradientFillWithMultipleStops(fill)) > -1
}
