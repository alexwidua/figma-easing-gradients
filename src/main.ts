import {
	nodeIsGeometryMixin,
	isGradientFill,
	interpolateColorStops,
	validateSelection,
	getValueFromStoreOrInit,
	setValueToStorage,
	clampNumber
} from './utils'
import {
	on,
	emit,
	showUI,
	cloneObject,
	insertBeforeNode,
	insertAfterNode,
	collapseLayer
} from '@create-figma-plugin/utilities'

const STORAGE_KEY_PRESETS = 'easing-gradients-dev-210818'
const DEFAULT_PRESETS = [
	{
		children: 'Ease-in-out',
		value: 'EASE_IN_OUT',
		matrix: [
			[0.42, 0.0],
			[0.58, 1.0]
		]
	},
	{
		children: 'Ease-in',
		value: 'EASE_IN',
		matrix: [
			[0.42, 0.0],
			[1.0, 1.0]
		]
	},
	{
		children: 'Ease-out',
		value: 'EASE_OUT',
		matrix: [
			[0.0, 0.0],
			[0.58, 1.0]
		]
	},
	{
		children: 'Ease',
		value: 'EASE',
		matrix: [
			[0.25, 0.1],
			[0.25, 1.0]
		]
	}
]

const ERROR_MAP: ErrorMap = {
	PRESET_INPUT_TOO_MANY_CHARS: 'Enter a name with less than 24 characters.'
}

// TODO: Typings

export default async function () {
	const ui: UISettings = { width: 280, height: 432 }
	await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
	showUI(ui)
	handleInitialPresetEmitToUI()

	let selectionRef: any
	let cloneRef: SceneNode | undefined
	let labelRef: GroupNode | undefined
	let state: EasingOptions = {
		type: 'CURVE',
		matrix: [
			[0.65, 0.0],
			[0.35, 1.0]
		],
		steps: 8,
		skip: 'skip-none'
	}

	/**
	 * Functions
	 */
	function updateGradientFill(node: SceneNode): void {
		if (!node) return console.error(`Couldn't get node.`)
		if (!nodeIsGeometryMixin(node))
			return console.warn('Selected node is not a shape.')
		const fills = node.fills as Paint[]

		fills.forEach((fillProperty, index) => {
			if (!isGradientFill(fillProperty))
				return console.warn(
					'Selected node does not contain gradient fills.'
				)

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

	// TODO: Clamp number to avoid >0.1 sizes
	function createPreviewLabel(): GroupNode | void {
		if (!cloneRef) return
		let arr = []
		const baseHeight = 12
		const baseWidth = 34
		const zoom = figma.viewport.zoom / 1.6 // adjust viewport-relative scaling, guessed value
		const width = baseWidth / zoom
		const height = baseHeight / zoom
		const fontSize = 8 / zoom

		const rect = figma.createRectangle()
		rect.resizeWithoutConstraints(width, height)
		rect.fills = [
			{ type: 'SOLID', color: { r: 0.094, g: 0.627, b: 0.984 } }
		] // #18A0FB aka. Figma blue
		rect.cornerRadius = height / 8

		const text = figma.createText()
		text.resizeWithoutConstraints(width, height)
		text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }] //#fff
		text.fontSize = fontSize
		text.textAlignHorizontal = 'CENTER'
		text.textAlignVertical = 'CENTER'
		text.characters = 'Preview'

		arr.push(rect, text)

		const group = figma.group(arr, figma.currentPage)
		group.name = '[Preview] Label'
		const padding = 4
		group.x = cloneRef.x
		group.y = cloneRef.y - height - padding

		collapseLayer(group)
		return group
	}

	function updateCanvasPreview(node: SceneNode): void {
		if (!selectionRef || !cloneRef) return
		selectionRef.locked = true
		selectionRef.visible = false

		cloneRef.locked = true

		labelRef = createPreviewLabel() || undefined
		if (labelRef) {
			labelRef.locked = true

			cloneRef.name = '[Preview] Easing Gradients'
			insertAfterNode(cloneRef, node)
			insertAfterNode(labelRef, node)
		}
		updateGradientFill(cloneRef)
	}

	function cleanUpCanvasPreview(): void {
		if (!selectionRef || !cloneRef) return
		selectionRef.locked = false
		selectionRef.visible = true

		cloneRef.remove()
		cloneRef = undefined

		if (labelRef) {
			labelRef.remove()
			labelRef = undefined
		}
	}

	/**
	 * Event handlers
	 */

	function handleSelectionChange() {
		const selectionState = validateSelection(figma.currentPage.selection)
		if (selectionState !== 'VALID') {
			cleanUpCanvasPreview()
		} else {
			const selection = figma.currentPage.selection[0]
			if (cloneRef) {
				// handle user selecting preview node via layer menu
				if (selection.id === cloneRef.id) {
					//updateCanvasPreview(selection)
					cleanUpCanvasPreview()
					figma.notify(`Cannot select the preview element.`)
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
	async function handleInitialPresetEmitToUI() {
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

	async function handleReceivePresetsFromUI(data: any) {
		console.log(data)
		const { presets, message } = data
		setValueToStorage(STORAGE_KEY_PRESETS, presets)
			.then((response) => {
				emit('RESPOND_TO_PRESETS_UPDATE', { response, message })
			})
			.catch(() => {
				figma.notify(`Couldn't save preset, please try again.`)
			})
	}

	async function handleResetPresetsToDefault() {
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
	on('EMIT_PRESETS_TO_PLUGIN', handleReceivePresetsFromUI)
	on('EMIT_PRESET_RESET_TO_PLUGIN', handleResetPresetsToDefault)
	on('EMIT_ERROR_TO_PLUGIN', handleErrorMessage)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', cleanUpCanvasPreview)
}
