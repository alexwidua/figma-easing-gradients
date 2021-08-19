import {
	nodeIsGeometryMixin,
	isGradientFillWithMultipleStops,
	interpolateColorStops,
	validateSelection,
	getValueFromStoreOrInit,
	setValueToStorage,
	handleNotificationFromUI
} from './utils'
import {
	on,
	emit,
	showUI,
	cloneObject,
	insertAfterNode,
	collapseLayer
} from '@create-figma-plugin/utilities'

import {
	DEFAULT_PRESETS,
	DEFAULT_EASING_TYPE,
	DEFAULT_MATRIX,
	DEFAULT_STEPS,
	DEFAULT_SKIP
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
	steps: number
	skip: string
}

const STORAGE_KEY_PRESETS: StorageKey = 'easing-gradients-dev-210818'
const PREVIEW_ELEMENT_PREFIX = '[Preview]'

export default async function () {
	const ui: UISettings = { width: 280, height: 432 }
	await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' })
	showUI(ui)
	handleInitialPresetEmitToUI()

	let selectionRef: SceneNode | undefined
	let cloneRef: SceneNode | undefined
	let labelRef: GroupNode | undefined
	let state: EasingOptions = {
		type: DEFAULT_EASING_TYPE,
		matrix: DEFAULT_MATRIX,
		steps: DEFAULT_STEPS,
		skip: DEFAULT_SKIP
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
			if (!isGradientFillWithMultipleStops(fillProperty))
				return console.warn(
					'Selected node does not contain gradient fills.'
				)

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

	function createPreviewLabel(): GroupNode | void {
		if (!cloneRef) return
		let elements = []
		const baseHeight = 12
		const baseWidth = 34
		const zoom = figma.viewport.zoom / 1.6 // adjust viewport-relative scaling, guessed value
		const width = baseWidth / zoom
		const height = baseHeight / zoom
		const fontSize = Math.max(8 / zoom, 1)

		// label backdrop
		const rect: RectangleNode = figma.createRectangle()
		rect.resizeWithoutConstraints(width, height)
		const rectColor = { r: 0.094, g: 0.627, b: 0.984 } // #18A0FB aka. Figma blue
		rect.fills = [{ type: 'SOLID', color: rectColor }]
		rect.cornerRadius = height / 8
		// label text
		const text: TextNode = figma.createText()
		text.resizeWithoutConstraints(width, height)
		const textColor = { r: 1, g: 1, b: 1 } //#fff
		text.fills = [{ type: 'SOLID', color: textColor }]
		text.fontSize = fontSize
		text.textAlignHorizontal = 'CENTER'
		text.textAlignVertical = 'CENTER'
		text.characters = 'Preview'

		elements.push(rect, text)
		// label container
		const group: GroupNode = figma.group(elements, figma.currentPage)
		group.name = `${PREVIEW_ELEMENT_PREFIX} Label`
		const margin = 2 / zoom
		group.x = cloneRef.x
		group.y = cloneRef.y - height - margin

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

			cloneRef.name = `${PREVIEW_ELEMENT_PREFIX} Easing Gradients`
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

	/**
	 * Handle preset getting/setting
	 */
	async function handleInitialPresetEmitToUI(): Promise<void> {
		getValueFromStoreOrInit(STORAGE_KEY_PRESETS, DEFAULT_PRESETS)
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
		setValueToStorage(STORAGE_KEY_PRESETS, presets)
			.then((response: PresetOptionValue) => {
				emit('RESPOND_TO_PRESETS_UPDATE', { response, message })
			})
			.catch(() => {
				figma.notify(`Couldn't save preset, please try again.`)
			})
	}

	async function handleResetPresetsToDefault(): Promise<void> {
		setValueToStorage(STORAGE_KEY_PRESETS, DEFAULT_PRESETS)
			.then((response: PresetOptionValue) => {
				emit('RESPOND_TO_PRESETS_UPDATE', {
					response,
					message: 'RESET'
				})
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
	on('EMIT_NOTIFICATION_TO_PLUGIN', handleNotificationFromUI)
	figma.on('selectionchange', handleSelectionChange)
	figma.on('close', cleanUpCanvasPreview)
}
