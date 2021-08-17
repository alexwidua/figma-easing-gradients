import { nodeIsGeometryMixin } from './utils/node'
import { isGradientFill, interpolateColorStops } from './utils/gradient'
import { validateSelection } from './utils/selection'
import { getValueFromStoreOrInit, setValueToStorage } from './utils/storage'
import {
	on,
	emit,
	showUI,
	cloneObject,
	insertBeforeNode
} from '@create-figma-plugin/utilities'

const STORAGE_KEY_PRESETS = 'easing-gradients-11'
const DEFAULT_PRESETS = [
	{
		children: 'Ease example 1',
		value: 'EASE_1',
		matrix: [
			[0.22, 0.0],
			[0.18, 1.0]
		]
	},
	{
		children: 'Ease example 2',
		value: 'EASE_2',
		matrix: [
			[0.82, 0.0],
			[0.68, 1.0]
		]
	}
]

const ERROR_MAP: ErrorMap = {
	PRESET_INPUT_TOO_MANY_CHARS: 'Enter a name with less than 24 characters.'
}

// TODO: Typings

export default function () {
	const ui: UISettings = { width: 280, height: 538 }
	showUI(ui)
	initiallyEmitPresetsToUI()

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
		if (!nodeIsGeometryMixin(node))
			return console.warn('Node is not a shape.')
		const fills = node.fills as Paint[]

		fills.forEach((fillProperty, index) => {
			if (!isGradientFill(fillProperty))
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

	function applyEasingFunction(): void {
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
		const selectionState = validateSelection(figma.currentPage.selection)
		if (
			selectionState.match(
				/^(EMPTY|MULTIPLE_ELEMENTS|NO_GRADIENT_FILL|INVALID_TYPE)$/
			)
		) {
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

		emit('UPDATE_SELECTION_STATE', selectionState)
	}

	function handleUpdate(options: EasingOptions) {
		state = { ...state, ...options }
		handleSelectionChange()
	}

	function handleErrorMessage(key: ErrorKey) {
		const errorMsg = ERROR_MAP[key]
		figma.notify(errorMsg)
	}

	/**
	 * Handle preset getting/setting
	 */
	async function initiallyEmitPresetsToUI() {
		getValueFromStoreOrInit(STORAGE_KEY_PRESETS, DEFAULT_PRESETS)
			.then((response) => {
				emit('INITIALLY_EMIT_PRESETS_TO_UI', response)
			})
			.catch(() => {
				figma.notify(
					`Couldn't load user presets, default presets will be used.`
				)
			})
	}

	async function receivePresetsFromUI(presets: any) {
		setValueToStorage(STORAGE_KEY_PRESETS, presets)
			.then((response) => {
				emit('RESPOND_TO_PRESETS_UPDATE', response)
			})
			.catch(() => {
				figma.notify(`Couldn't save preset, please try again.`)
			})
	}

	async function resetPresetsToDefault() {
		setValueToStorage(STORAGE_KEY_PRESETS, DEFAULT_PRESETS)
			.then((response) => {
				emit('RESPOND_TO_PRESETS_UPDATE', response)
			})
			.catch(() => {
				figma.notify(`Couldn't reset preset, please try again.`)
			})
	}

	/**
	 * Event listeners
	 */
	on('UPDATE_FROM_UI', handleUpdate)
	on('APPLY_EASING_FUNCTION', applyEasingFunction)
	on('EMIT_PRESETS_TO_PLUGIN', receivePresetsFromUI)
	on('EMIT_PRESET_RESET_TO_PLUGIN', resetPresetsToDefault)
	on('EMIT_ERROR_TO_PLUGIN', handleErrorMessage)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', cleanUpCanvasPreview)
}
