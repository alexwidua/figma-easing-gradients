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
