import { h, JSX, ComponentChildren } from 'preact'
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { on, emit } from '@create-figma-plugin/utilities'
import './base.css'
import {
	render,
	Button,
	Container,
	Columns,
	Text,
	Textbox,
	TextboxNumeric,
	Dropdown,
	useMouseDownOutside,
	VerticalSpace,
	MiddleAlign,
} from '@create-figma-plugin/ui'
import {
	debounce,
	showDecimals,
	getRandomString,
	describeCurveInAdjectives,
} from './utils'
import { Editor, PresetMenu, PresetInput } from './components'
import {
	TextboxMatrixIcon,
	TextboxStepIcon,
	DropdownJumpNoneIcon,
	DropdownJumpBothIcon,
	DropdownJumpStartIcon,
	DropdownJumpEndIcon,
	CurveIcon,
	StepIcon,
} from './icons'
import {
	DEFAULT_EASING_TYPE,
	DEFAULT_MATRIX,
	DEFAULT_STEPS,
	DEFAULT_SKIP,
} from './shared/default_values'

/**
 * Types
 */
import { DropdownOption } from '@create-figma-plugin/ui'
import { SelectionKey, SelectionKeyMap } from './utils/'
import { EasingOptions, EasingType, Matrix, SkipOption } from './main'
import { EditorChange } from './components/editor/editor'
import chroma from 'chroma-js'

export type PresetOption =
	| PresetOptionHeader
	| PresetOptionValue
	| PresetOptionSeparator
export type PresetOptionHeader = {
	header: string
}
export type PresetOptionValue = {
	children?: string
	value: PresetOptionKey
	matrix?: Matrix
}
export type PresetOptionSeparator = {
	separator: boolean
}
export type PresetOptionKey =
	| 'ADD_PRESET'
	| 'MANAGE_PRESETS'
	| 'RESET_DEFAULT'
	| CustomPresetKey

export type CustomPresetKey = `CUSTOM_${string}` | `DEFAULT_${string}`
export type PresetMessage = 'ADD' | 'REMOVE'

/**
 * Global constants
 */
const COPY_PLACEHOLDER_BEFORE_INTERACTION: string = 'Choose preset...'
const COPY_PLACEHOLDER_AFTER_INTERACTION: string = 'Custom'
const OPTION_NO_PRESETS: PresetOptionHeader[] = [{ header: 'No presets.' }]
const OPTION_EASING_TYPE: DropdownOption[] = [
	{ children: 'Curve', value: 'CURVE' },
	{ children: 'Steps', value: 'STEPS' },
]

const OPTION_COLOR_SPACE: DropdownOption[] = [
	{ children: 'RGB', value: 'rgb' },
	{ children: 'LRGB', value: 'lrgb' },
	{ children: 'HSL', value: 'hsl' },
	{ children: 'LAB', value: 'lab' },
	{ children: 'LCH', value: 'lch' },
]
const OPTIONS_JUMPS: { children: string; value: SkipOption }[] = [
	{ children: 'jump-none', value: 'skip-none' },
	{ children: 'jump-both', value: 'skip-both' },
	{ children: 'jump-start', value: 'start' },
	{ children: 'jump-end', value: 'end' },
]
const JUMP_ICON: { [type in SkipOption]: ComponentChildren } = {
	'skip-none': DropdownJumpNoneIcon,
	'skip-both': DropdownJumpBothIcon,
	start: DropdownJumpStartIcon,
	end: DropdownJumpEndIcon,
}
const BUTTON_STATE: SelectionKeyMap = {
	EMPTY: 'No element selected',
	MULTIPLE_ELEMENTS: 'Multiple elements',
	INVALID_TYPE: 'Invalid element',
	NO_GRADIENT_FILL: 'No gradient fill',
	VALID: 'Apply',
}

const Plugin = () => {
	/**
	 * States
	 */

	const [presets, setPresets] = useState<
		PresetOptionValue[] | PresetOptionHeader[]
	>(OPTION_NO_PRESETS)

	// preset menu states
	const [showPresetInputDialog, setShowPresetInputDialog] =
		useState<boolean>(false)
	const [showManagingPresetsDialog, setShowManagingPresetsDialog] =
		useState<boolean>(false)
	const [hasInteractedWithPresetMenu, setHasInteractedWithPresetMenu] =
		useState<boolean>(false)

	// temporary states that are passed between the different dialogs
	const [tempCustomPresetStore, setTempCustomPresetStore] =
		useState<PresetOption | null>(null)
	const [tempCustomPresetName, setTempCustomPresetName] = useState<string>('')
	const [tempCustomPresetPlaceholder, setTempCustomPresetPlaceholder] =
		useState<string>('')

	// ui exposed states
	const [easingType, setEasingType] =
		useState<EasingType>(DEFAULT_EASING_TYPE)
	const [selectedPreset, setSelectedPreset] =
		useState<PresetOptionKey | null>(null)
	const [matrix, setMatrix] = useState<Matrix>(DEFAULT_MATRIX)
	const [steps, setSteps] = useState<number>(DEFAULT_STEPS)
	const [jump, setJump] = useState<SkipOption>(DEFAULT_SKIP)
	const [colorSpace, setColorSpace] =
		useState<chroma.InterpolationMode>('rgb')
	const [selectionState, setSelectionState] =
		useState<SelectionKey>('INVALID_TYPE')

	// data emitted to plugin
	const messageData: EasingOptions = {
		type: easingType,
		matrix,
		steps,
		colorSpace,
		skip: jump,
	}

	/**
	 * Register event listeners
	 */
	useEffect(() => {
		on('INITIALLY_EMIT_PRESETS_TO_UI', (storedPresets) => {
			if (storedPresets.length) {
				setPresets([...storedPresets])
			}
		})
		on('UPDATE_SELECTION_STATE', ({ selectionState, pluginData }) => {
			setSelectionState(selectionState)
			if (pluginData) {
				const { type, matrix, steps, skip, colorSpace } = pluginData
				if (!type || !matrix || !steps || !skip) return
				setEasingType(type)
				setMatrix(matrix)
				setSteps(steps)
				if (colorSpace) setColorSpace(colorSpace)
				setJump(skip)
				emitNotificationToPlugin('Restored previous easing settings.')
			}
		})
		on('RESPOND_TO_PRESETS_UPDATE', handleResponseFromPlugin)
	}, [])

	useEffect(() => {
		if (selectedPreset) {
			if (!hasInteractedWithPresetMenu)
				setHasInteractedWithPresetMenu(true)

			const matrix = ([...presets] as any).find(
				(el: PresetOptionValue) => el.value === selectedPreset
			).matrix
			if (matrix) setMatrix(matrix)
		}
	}, [selectedPreset])

	/**
	 * Handle input events
	 */
	function handleMatrixInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value.split(', ').map(Number)
		const isValidValue = value.every((e) => e >= 0 && e <= 1)

		if (value.length === 4 && isValidValue) {
			setMatrix([
				[value[0], value[1]],
				[value[2], value[3]],
			])
			setSelectedPreset(null)
		}
	}

	function handleStepInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseFloat(value) > 1) {
			setSteps(parseFloat(value))
		}
	}

	function handleEditorChange(value: EditorChange): void {
		if (value.type === 'CURVE' && value.thumb) {
			const { thumb } = value
			const prev = [...matrix]
			prev[thumb.index] = thumb.vector
			setMatrix(prev)
			setSelectedPreset(null)
		} else if (value.type === 'STEPS' && value.steps) {
			setSteps(value.steps)
		}
	}

	/**
	 * Handle preset menu changes and custom preset input
	 */
	function handlePresetMenuChange(value: PresetOptionKey) {
		// page 2: remove or reset presets
		if (showManagingPresetsDialog) {
			if (value === 'RESET_DEFAULT') {
				emit('EMIT_PRESET_RESET_TO_PLUGIN')
			}
			// else remove preset
			else {
				let data: PresetOption[]
				const updatedPresets = ([...presets] as any).filter(
					(el: PresetOptionValue) => el.value !== value
				)
				if (!updatedPresets.length) {
					data = []
				} else {
					data = [...updatedPresets]
				}
				emitPresetUpdateToPlugin(data, 'REMOVE')
			}
			setShowManagingPresetsDialog(false)
		}
		// page 1: select or add preset
		else {
			if (value === 'ADD_PRESET') {
				const tempCustomPresetName: CustomPresetKey = `CUSTOM_${getRandomString()}`
				const newPreset: PresetOptionValue = {
					value: tempCustomPresetName,
					matrix: [...matrix],
				}
				const placeholder = describeCurveInAdjectives([...matrix])
				setTempCustomPresetStore(newPreset)
				setTempCustomPresetPlaceholder(placeholder)
				setShowPresetInputDialog(true)
			}
			// switch to page 2
			else if (value === 'MANAGE_PRESETS') {
				setShowManagingPresetsDialog(true)
				setSelectedPreset(null)
			}
			// select existing preset
			else {
				setSelectedPreset(value)
			}
		}
	}

	function handleCustomPresetInput(
		e: JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		setTempCustomPresetName(value)
	}

	function handleCustomPresetDialogApply(): void {
		if (tempCustomPresetName.length > 24) {
			emitNotificationToPlugin(
				'Enter a name with less than 24 characters.'
			)
			return
		}

		let data: any
		const presetName = tempCustomPresetName || tempCustomPresetPlaceholder
		const newPreset = { children: presetName, ...tempCustomPresetStore }
		if (([...presets] as any).some((el: PresetOptionHeader) => el.header)) {
			data = [newPreset]
		} else {
			data = [...presets, newPreset]
		}
		emitPresetUpdateToPlugin(data, 'ADD')
		resetCustomPresetDialog()
	}

	function resetCustomPresetDialog(): void {
		setShowPresetInputDialog(false)
		setTempCustomPresetStore(null)
		setTempCustomPresetName('')
	}

	/**
	 *  Handle emits to plugin and response from plugin
	 */
	function emitPresetUpdateToPlugin(
		presets: PresetOption[],
		message: PresetMessage
	): void {
		emit('EMIT_PRESETS_TO_PLUGIN', { presets, message })
	}

	function emitNotificationToPlugin(message: string): void {
		emit('EMIT_NOTIFICATION_TO_PLUGIN', message)
	}

	function handleResponseFromPlugin(data: {
		response: PresetOptionValue[]
		message: PresetMessage
	}): void {
		const { response, message } = data
		if (response) {
			if (!response.length) {
				setPresets(OPTION_NO_PRESETS)
			} else {
				setPresets([...response])
				if (message === 'ADD') {
					setSelectedPreset(response[response.length - 1].value)
				}
			}
		}
	}

	/**
	 * Cancel dialogs by clicking outside the dropdown field
	 */
	const ref = useRef<HTMLDivElement>(null)
	useMouseDownOutside({
		onMouseDownOutside: () => handleMouseDownOutside(),
		ref,
	})
	function handleMouseDownOutside(): void {
		setShowManagingPresetsDialog(false)
		resetCustomPresetDialog()
	}
	function handlePresetMenuKeyDown(
		e: JSX.TargetedKeyboardEvent<HTMLDivElement>
	) {
		if (e.key === 'Escape' || e.key === 'Tab') {
			setShowManagingPresetsDialog(false)
			resetCustomPresetDialog()
			return
		}
	}

	/**
	 * Debounce gradient updates that are emitted to the plugin
	 */
	const debounceWaitTime = 100 //ms

	useEffect(() => {
		debouncedUpdate(messageData)
	}, [easingType, colorSpace, matrix, steps, jump])

	const debouncedUpdate = useCallback(
		debounce((data) => emit('UPDATE_FROM_UI', data), debounceWaitTime),
		[]
	)

	return (
		<Container>
			<VerticalSpace space="extraSmall" />
			<Columns space="extraSmall">
				<Dropdown
					value={easingType}
					onChange={(e) =>
						setEasingType(e.currentTarget.value as EasingType)
					}
					icon={
						(easingType as EasingType) === 'CURVE' ? (
							<CurveIcon size={12} matrix={matrix} />
						) : (
							<StepIcon size={12} steps={steps} jump={jump} />
						)
					}
					options={OPTION_EASING_TYPE}
				/>
				<Dropdown
					value={colorSpace}
					onChange={(e) =>
						setColorSpace(
							e.currentTarget.value as chroma.InterpolationMode
						)
					}
					options={OPTION_COLOR_SPACE}
				/>
				<div
					ref={ref}
					style={{
						position: 'relative',
						visibility:
							(easingType as EasingType) === 'CURVE'
								? 'visible'
								: 'hidden',
						pointerEvents:
							(easingType as EasingType) === 'CURVE'
								? 'all'
								: 'none',
					}}
					onKeyDown={handlePresetMenuKeyDown}
				>
					<PresetInput
						showInputDialog={showPresetInputDialog}
						value={tempCustomPresetName}
						placeholder={tempCustomPresetPlaceholder}
						onInput={handleCustomPresetInput}
						onApply={handleCustomPresetDialogApply}
					/>
					<PresetMenu
						value={selectedPreset}
						placeholder={
							!hasInteractedWithPresetMenu
								? COPY_PLACEHOLDER_BEFORE_INTERACTION
								: COPY_PLACEHOLDER_AFTER_INTERACTION
						}
						presets={presets}
						showManagingPresetsDialog={showManagingPresetsDialog}
						onValueChange={handlePresetMenuChange}
					/>
				</div>
			</Columns>
			<VerticalSpace space="extraSmall" />
			<Editor
				easingType={easingType}
				matrix={matrix}
				steps={steps}
				jump={jump}
				onEditorChange={handleEditorChange}
			/>
			<VerticalSpace space="extraSmall" />
			{(easingType as EasingType) === 'CURVE' ? (
				<Textbox
					value={[...matrix[0], ...matrix[1]]
						.map((vec) => showDecimals(vec, 2))
						.join(', ')}
					icon={TextboxMatrixIcon}
					onBlurCapture={handleMatrixInput}
				/>
			) : (
				<Columns space="extraSmall">
					<TextboxNumeric
						icon={TextboxStepIcon}
						onInput={handleStepInput}
						value={steps.toString()}
					/>
					<Dropdown
						value={jump}
						icon={JUMP_ICON[jump]}
						onChange={(e) =>
							setJump(e.currentTarget.value as SkipOption)
						}
						options={OPTIONS_JUMPS}
					/>
				</Columns>
			)}
			<VerticalSpace space="extraSmall" />
			<Button
				fullWidth
				onClick={() => emit('APPLY_EASING_FUNCTION')}
				disabled={(selectionState as SelectionKey) !== 'VALID'}
			>
				{BUTTON_STATE[selectionState]}
			</Button>
		</Container>
	)
}

export default render(Plugin)
