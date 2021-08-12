import { isShape } from './node'

export function validateSelection(selection: ReadonlyArray<SceneNode>): any {
	if (selection.length) {
		if (selection.length > 1) {
			return 'MULTIPLE'
		}
		const node: SceneNode = selection[0]
		if (!isShape(node)) {
			return 'INVALID'
		} else {
			return 'VALID'
		}
	} else {
		return 'EMPTY'
	}
}
