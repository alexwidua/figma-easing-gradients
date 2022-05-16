/**
 * @file Easing default values, shared across plugin and ui.
 * Eventhough plugin and ui state should always be in sync, there would
 * be a brief flash of value changes before the initial event handler is
 * emitted.
 */

import { PresetOptionValue } from '../ui'
import { EasingOptions, EasingType, Matrix, SkipOption } from '../main'

export const DEFAULT_PRESETS: PresetOptionValue[] = [
	{
		children: 'Ease-in-out',
		value: 'DEFAULT_EASE_IN_OUT',
		matrix: [
			[0.42, 0.0],
			[0.58, 1.0]
		]
	},
	{
		children: 'Ease-in',
		value: 'DEFAULT_EASE_IN',
		matrix: [
			[0.42, 0.0],
			[1.0, 1.0]
		]
	},
	{
		children: 'Ease-out',
		value: 'DEFAULT_EASE_OUT',
		matrix: [
			[0.0, 0.0],
			[0.58, 1.0]
		]
	},
	{
		children: 'Ease',
		value: 'DEFAULT_EASE',
		matrix: [
			[0.25, 0.1],
			[0.25, 1.0]
		]
	}
]

export const DEFAULT_EASING_TYPE: EasingType = 'CURVE'
export const DEFAULT_MATRIX: Matrix = [
	[0.42, 0.0],
	[0.58, 1.0]
]
export const DEFAULT_STEPS: number = 8
export const DEFAULT_SKIP: SkipOption = 'skip-none'
