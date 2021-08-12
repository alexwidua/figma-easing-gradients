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

type SelectionState =
	| 'VALID'
	| 'INVALID_TYPE'
	| 'MULTIPLE_ELEMENTS'
	| 'NO_GRADIENT_FILL'
	| 'EMPTY'
type SelectionStateMap = { [type in SelectionState]: string }
