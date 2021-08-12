import { nodeHasGradientFill, nodeIsGeometryMixin } from './node'

export function validateSelection(
	selection: ReadonlyArray<SceneNode>
): SelectionState {
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
