import {
	nodeIsGeometryMixin,
	isGradientFillWithMultipleStops,
	interpolateColorStops,
	validateSelection,
	getValueFromStoreOrInit,
	setValueToStorage,
	handleNotificationFromUI,
} from './utils'
import {
	on,
	emit,
	showUI,
	cloneObject,
	insertAfterNode,
	//collapseLayer
} from '@create-figma-plugin/utilities'
import {
	DEFAULT_PRESETS,
	DEFAULT_EASING_TYPE,
	DEFAULT_MATRIX,
	DEFAULT_STEPS,
	DEFAULT_SKIP,
} from './shared/default_values'
import { PresetOptionValue } from './ui'

type UISettings = { width: number; height: number }
type StorageKey = `easing-gradients-${string | number}`

export type EasingType = 'CURVE' | 'STEPS'
export type Matrix = number[][]
export type SkipOption = 'skip-none' | 'skip-both' | 'start' | 'end'
export type EasingOptions = {
	type: EasingType
	matrix: Matrix
	colorSpace?: chroma.InterpolationMode
	steps: number
	skip: string
}

const KEY_PLUGIN_DATA = 'easing-gradients-v2-data'
const KEY_PRESETS: StorageKey = 'easing-gradients-v2-presets'
const KEY_ORIGINAL_FILLS = 'originalFills'
//const PREVIEW_ELEMENT_PREFIX = '[Preview]'

export default async function () {
	const ui: UISettings = { width: 280, height: 388 }

	// See comment L87
	// await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })

	let selectionRef: SceneNode | undefined
	let cloneRef: SceneNode | undefined
	let labelRef: GroupNode | undefined
	let state: EasingOptions = {
		type: DEFAULT_EASING_TYPE,
		matrix: DEFAULT_MATRIX,
		steps: DEFAULT_STEPS,
		skip: DEFAULT_SKIP,
	}

	/**
	 * Functions
	 */
	function updateGradientFill(node: SceneNode, reset: boolean = false): void {
		if (!node) return console.error(`Couldn't get node.`)
		if (!nodeIsGeometryMixin(node))
			return console.warn('Selected node is not a shape.')

		// if we have already been applied to this node, restore the original gradient stops before re-applying
		const origGradients = safeGetPluginData<GradientPaint[]>(
			node,
			KEY_ORIGINAL_FILLS
		)
		if (origGradients !== undefined) {
			console.log(`restored data from "${KEY_ORIGINAL_FILLS}"`)
			// TODO: validate this data
		}
		const fills = node.fills
		if (fills == figma.mixed) {
			return console.warn('Selected node has mixed fills.')
		}

		// Save the gradient fills from before we modified them
		const save = origGradients
			? origGradients
			: fills.filter((f) => isGradientFillWithMultipleStops(f))
		if (reset) {
			node.setPluginData(KEY_ORIGINAL_FILLS, '')
		} else {
			node.setPluginData(KEY_ORIGINAL_FILLS, JSON.stringify(save))
		}

		const tempFills = cloneObject(
			fills
		) as Paint[] /* remove readonly with cast */

		// If gradient fills are mixed with other fills, allow the user to add/remove fills and just assume that the gradient fill indices stay constant
		let gradIndex = 0
		fills.forEach((fillProperty, index) => {
			if (!isGradientFillWithMultipleStops(fillProperty))
				return console.warn(
					'Selected node does not contain gradient fills.'
				)
			if (origGradients && gradIndex < origGradients.length) {
				// Assign a temp variable so type inference knows fillProperty and orig are both GradientFill
				const orig = origGradients[gradIndex]
				if (isGradientFillWithMultipleStops(orig)) {
					fillProperty = orig
				}
			}

			tempFills[index] = {
				...fillProperty,
				gradientStops: reset
					? fillProperty.gradientStops
					: interpolateColorStops(fillProperty, state),
			}
			gradIndex++
		})
		node.fills = tempFills
	}

	/**
	 * ⚠️ The preview label is causing some issues in Version 8,
	 * but right now I don't have capacity to investigate.
	 * Since this feature has no priority, I'll disable it for Version 9.
	 */

	// function createPreviewLabel(): GroupNode | void {
	// 	if (!cloneRef) return
	// 	let elements = []
	// 	const baseHeight = 12
	// 	const baseWidth = 34
	// 	const zoom = figma.viewport.zoom / 1.6 // adjust viewport-relative scaling, guessed value
	// 	const width = baseWidth / zoom
	// 	const height = baseHeight / zoom
	// 	const fontSize = Math.max(8 / zoom, 1)

	// 	// label backdrop
	// 	const rect: RectangleNode = figma.createRectangle()
	// 	rect.resizeWithoutConstraints(width, height)
	// 	const rectColor = { r: 0.094, g: 0.627, b: 0.984 } // #18A0FB aka. Figma blue
	// 	rect.fills = [{ type: 'SOLID', color: rectColor }]
	// 	rect.cornerRadius = height / 8
	// 	// label text
	// 	const text: TextNode = figma.createText()
	// 	text.resizeWithoutConstraints(width, height)
	// 	const textColor = { r: 1, g: 1, b: 1 } //#fff
	// 	text.fills = [{ type: 'SOLID', color: textColor }]
	// 	text.fontSize = fontSize
	// 	text.textAlignHorizontal = 'CENTER'
	// 	text.textAlignVertical = 'CENTER'
	// 	text.characters = 'Preview'

	// 	elements.push(rect, text)
	// 	// label container
	// 	const group: GroupNode = figma.group(elements, figma.currentPage)
	// 	group.name = `${PREVIEW_ELEMENT_PREFIX} Label`
	// 	const margin = 2 / zoom
	// 	group.x = cloneRef.x
	// 	group.y = cloneRef.y - height - margin

	// 	collapseLayer(group)
	// 	return group
	// }

	function updateCanvasPreview(): void {
		if (!selectionRef || !cloneRef) return
		selectionRef.locked = true
		selectionRef.visible = false

		cloneRef.locked = true

		// see L87
		// if (!labelRef) {
		// 	labelRef = createPreviewLabel() || undefined
		// } else {
		// 	labelRef.locked = true

		// 	cloneRef.name = `${PREVIEW_ELEMENT_PREFIX} Easing Gradients`
		// 	insertAfterNode(cloneRef, selectionRef)
		// 	insertAfterNode(labelRef, selectionRef)
		// }

		updateGradientFill(cloneRef)
	}

	function cleanUpCanvasPreview(): void {
		if (!selectionRef || !cloneRef) return
		selectionRef.locked = false
		selectionRef.visible = true
		selectionRef = undefined

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
					cleanUpCanvasPreview()
					figma.notify(`Cannot select the preview element.`)
				} else {
					cleanUpCanvasPreview()
					selectionRef = selection
					cloneRef = selectionRef.clone()
					makeSureClonedNodeIsInPlace()
					updateCanvasPreview()
				}
			} else {
				selectionRef = selection
				cloneRef = selectionRef.clone()
				makeSureClonedNodeIsInPlace()
				updateCanvasPreview()
			}
		}
		const pluginData = checkIfExistingEasingData(selectionRef)
		emit('UPDATE_SELECTION_STATE', { selectionState, pluginData })
	}

	function handleUpdate(options: EasingOptions) {
		state = { ...state, ...options }
		updateCanvasPreview()
	}

	/**
	 * Makes sure that the cloneRef node has the same position as it's selectionRef master.
	 */
	function makeSureClonedNodeIsInPlace(): void {
		if (!selectionRef || !cloneRef) return
		insertAfterNode(cloneRef, selectionRef)
		if (selectionRef.parent?.type === 'GROUP') {
			cloneRef.x = selectionRef.x
			cloneRef.y = selectionRef.y
		}
	}

	/**
	 * Handle preset getting/setting
	 */
	async function handleInitialPresetEmitToUI(): Promise<void> {
		getValueFromStoreOrInit(KEY_PRESETS, DEFAULT_PRESETS)
			.then((response: PresetOptionValue) => {
				emit('INITIALLY_EMIT_PRESETS_TO_UI', response)
			})
			.catch(() => {
				figma.notify(
					`Couldn't load user presets, default presets will be used.`
				)
			})
	}

	async function handleReceivePresetsFromUI(data: any): Promise<void> {
		const { presets, message } = data
		setValueToStorage(KEY_PRESETS, presets)
			.then((response: PresetOptionValue) => {
				emit('RESPOND_TO_PRESETS_UPDATE', { response, message })
				figma.notify(
					message === 'ADD' ? 'Added new preset.' : 'Removed preset.'
				)
			})
			.catch(() => {
				figma.notify(`Couldn't save preset, please try again.`)
			})
	}

	async function handleResetPresetsToDefault(): Promise<void> {
		setValueToStorage(KEY_PRESETS, DEFAULT_PRESETS)
			.then((response: PresetOptionValue) => {
				emit('RESPOND_TO_PRESETS_UPDATE', {
					response,
					message: 'RESET',
				})
				figma.notify(
					'Removed all presets and restored default presets.'
				)
			})
			.catch(() => {
				figma.notify(`Couldn't reset preset, please try again.`)
			})
	}

	function applyEasingFunction(): void {
		if (!selectionRef) return
		selectionRef.setRelaunchData({
			ReapplyEasing: `Adjust gradient easing.`,
			ResetEasing: `Reset gradient to what it was before easing was applied.`,
		})
		selectionRef.setPluginData(KEY_PLUGIN_DATA, JSON.stringify(state))

		updateGradientFill(selectionRef)
		cleanUpCanvasPreview()
		figma.closePlugin()
	}

	// TODO: parse returned data, don't assume it has the correct type
	function safeGetPluginData<T>(
		selection: SceneNode | undefined,
		key: string
	): T | undefined {
		if (!selection) return
		const pluginData = selection.getPluginData(key)
		if (pluginData) {
			try {
				return JSON.parse(pluginData) as T
			} catch {
				return undefined
			}
		}
		return undefined
	}

	function checkIfExistingEasingData(
		selection: SceneNode | undefined
	): EasingOptions | undefined {
		return safeGetPluginData(selection, KEY_PLUGIN_DATA)
	}

	/**
	 * Event listeners
	 */
	on('UPDATE_FROM_UI', handleUpdate)
	on('APPLY_EASING_FUNCTION', applyEasingFunction)
	on('EMIT_PRESETS_TO_PLUGIN', handleReceivePresetsFromUI)
	on('EMIT_PRESET_RESET_TO_PLUGIN', handleResetPresetsToDefault)
	on('EMIT_NOTIFICATION_TO_PLUGIN', handleNotificationFromUI)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', cleanUpCanvasPreview)

	/**
	 * If plugin was launched via RelaunchButton
	 */
	if (figma.command === 'ReapplyEasing') {
		const selection = figma.currentPage.selection[0]
		const pluginData = checkIfExistingEasingData(selection)
		if (pluginData) {
			state = pluginData
			updateGradientFill(selection)
			figma.notify('Re-applied gradient easing.', { timeout: 3 })
		}
		selection.setRelaunchData({
			ReapplyEasing: `Adjust gradient easing.`,
			ResetEasing: `Reset gradient to what it was before easing was applied.`,
		})
		figma.closePlugin()
	} else if (figma.command === 'ResetEasing') {
		const selection = figma.currentPage.selection[0]
		updateGradientFill(selection, true)
		selection.setRelaunchData({
			ReapplyEasing: `Add easing back.`,
		})
		figma.notify('Reset gradient easing.', { timeout: 3 })
		figma.closePlugin()
	} else {
		showUI(ui)
		handleInitialPresetEmitToUI()
		handleSelectionChange()
	}
}
