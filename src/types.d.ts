// import {
// 	DropdownOptionHeader,
// 	DropdownOptionValue,
// 	DropdownOptionSeparator
// } from '@create-figma-plugin/ui'
// import { ComponentChildren } from 'preact'

/**
 * Data that is applied to the plugin's UI window.
 */
interface UISettings {
	readonly height: number
	readonly width: number
}

type Matrix = number[][]

type EasingType = 'CURVE' | 'STEPS'

type EasingOptions = {
	type: EasingType
	matrix: Matrix
	steps: number
	skip: string
}

type EditorChange = {
	type: EasingType
	thumb?: { index: EditorInputIndex; vector: Array<number> }
	steps?: number
}

type EditorInputIndex = -1 | 0 | 1 | 2

// type PresetOption = {
// 	children: import('preact').ComponentChildren
// 	value: string
// 	matrix: Matrix
// }

type SelectionState =
	| 'VALID'
	| 'INVALID_TYPE'
	| 'MULTIPLE_ELEMENTS'
	| 'NO_GRADIENT_FILL'
	| 'EMPTY'
type SelectionStateMap = { [type in SelectionState]: string }

type ErrorKey = 'PRESET_INPUT_TOO_MANY_CHARS'
type ErrorMap = { [type in ErrorKey]: string }

//

type PresetOption =
	| PresetOptionHeader
	| PresetOptionValue
	| PresetOptionSeparator

type PresetOptionHeader = {
	header: string
}
type PresetOptionValue = {
	children?: string
	value: PresetOptionKey
	matrix?: Matrix
}

type PresetOptionSeparator = {
	separator: boolean
}

type PresetOptionKey =
	| 'ADD_PRESET'
	| 'MANAGE_PRESETS'
	| 'RESET_DEFAULT'
	| GeneratedCustomPresetKey

type GeneratedCustomPresetKey = `CUSTOM_${string}`
