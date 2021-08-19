/**
 * @file Validating the current selection is important because it
 * dictates several ui states and dictates the rendering of in-canvas previews.
 */

import { nodeHasGradientFill, nodeIsGeometryMixin } from './node'

export type SelectionKey =
	| 'VALID'
	| 'INVALID_TYPE'
	| 'MULTIPLE_ELEMENTS'
	| 'NO_GRADIENT_FILL'
	| 'EMPTY'
export type SelectionKeyMap = { [type in SelectionKey]: string }

export function validateSelection(
	selection: ReadonlyArray<SceneNode>
): SelectionKey {
	if (selection.length) {
		if (selection.length > 1) {
			return 'MULTIPLE_ELEMENTS'
		}
		const node: SceneNode = selection[0]
		if (!nodeIsGeometryMixin(node)) {
			return 'INVALID_TYPE'
		} else {
			if (!nodeHasGradientFill(node)) return 'NO_GRADIENT_FILL'
			else return 'VALID'
		}
	} else {
		return 'EMPTY'
	}
}
