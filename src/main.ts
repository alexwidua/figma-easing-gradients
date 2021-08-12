import { isGradient, isShape } from './utils/node'
import { interpolateColorStops } from './utils/gradient'
import { validateSelection } from './utils/selection'
import {
	on,
	showUI,
	cloneObject,
	insertBeforeNode
} from '@create-figma-plugin/utilities'

// TODO: Emit selection state to UI to visually update apply button
// TODO: Typings

export default function () {
	const ui: UISettings = { width: 280, height: 538 }
	showUI(ui)

	let selectionRef: any
	let cloneRef: any
	let state: EasingOptions = {
		type: 'CURVE',
		matrix: [
			[0.42, 0.0],
			[0.58, 1.0]
		],
		steps: 8,
		skip: 'skip-none'
	}

	/**
	 * Functions
	 */

	function updateGradientFill(node: GeometryMixin): void {
		if (!node) return console.error('No node.')
		if (!isShape(node)) return console.warn('Node is not a shape.')
		const fills = node.fills as Paint[]

		fills.forEach((fillProperty, index) => {
			if (!isGradient(fillProperty))
				return console.warn('Node does not contain gradient fills.')

			// TODO: Type tempNode
			const tempNode: any = cloneObject(node.fills)
			tempNode[index].gradientStops = interpolateColorStops(
				fillProperty,
				state
			)
			node.fills = tempNode
		})
	}

	function applyEasingFunction() {
		if (!selectionRef) return
		updateGradientFill(selectionRef)
		cleanUpCanvasPreview()
		figma.closePlugin()
	}

	function updateCanvasPreview(node: SceneNode): void {
		if (!selectionRef || !cloneRef) return
		selectionRef.locked = true
		selectionRef.visible = false

		cloneRef.name = '[Preview] Easing Gradients'
		insertBeforeNode(cloneRef, node)
		updateGradientFill(cloneRef)
	}

	function cleanUpCanvasPreview(): Function | void {
		if (!selectionRef || !cloneRef) return
		selectionRef.locked = false
		selectionRef.visible = true

		cloneRef.remove()
		cloneRef = undefined
	}

	/**
	 * Event handlers
	 */

	function handleSelectionChange() {
		const pageSelection = validateSelection(figma.currentPage.selection)
		console.log(pageSelection)

		if (pageSelection.match(/^(EMPTY|INVALID||MULTIPLE)$/)) {
			cleanUpCanvasPreview()
		} else {
			const selection = figma.currentPage.selection[0]
			if (cloneRef) {
				if (selection.id === cloneRef.id) {
					updateCanvasPreview(selection)
				} else {
					cleanUpCanvasPreview()
					selectionRef = selection
					cloneRef = selectionRef.clone()
					updateCanvasPreview(selectionRef)
				}
			} else {
				selectionRef = selection
				cloneRef = selectionRef.clone()
				updateCanvasPreview(selectionRef)
			}
		}
	}

	function handleUpdate(options: EasingOptions) {
		state = { ...state, ...options }
		handleSelectionChange()
	}

	/**
	 * Event listeners
	 */

	on('UPDATE_FROM_UI', handleUpdate)
	on('APPLY_EASING_FUNCTION', applyEasingFunction)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', cleanUpCanvasPreview)
}
