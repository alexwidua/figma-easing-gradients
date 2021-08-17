import { h, JSX } from 'preact'
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { on, emit } from '@create-figma-plugin/utilities'
import './base.css'
import {
	render,
	Button,
	Container,
	Columns,
	Textbox,
	TextboxNumeric,
	Dropdown,
	useMouseDownOutside
} from '@create-figma-plugin/ui'
import {
	debounce,
	showDecimals,
	getRandomString,
	getCurveSynonym
} from './utils'
import { Editor, PresetMenu, PresetInput } from './components'

// types
import { DropdownOption } from '@create-figma-plugin/ui'

const PLACEHOLDER_BEFORE_INTERACTION_COPY = 'Choose preset...'
const PLACEHOLDER_AFTER_INTERACTION_COPY = 'Custom'

const NO_PRESETS_OPTION: Array<DropdownOption> = [{ header: 'No presets.' }]
const EASING_TYPE_OPTIONS: Array<DropdownOption> = [
	{ children: 'Curve', value: 'CURVE' },
	{ children: 'Steps', value: 'STEPS' }
]
const JUMP_OPTIONS: Array<DropdownOption> = [
	{ children: 'jump-none', value: 'skip-none' },
	{ children: 'jump-both', value: 'skip-both' },
	{ children: 'jump-start', value: 'start' },
	{ children: 'jump-end', value: 'end' }
]
const BUTTON_MAP: SelectionStateMap = {
	EMPTY: 'No element selected',
	MULTIPLE_ELEMENTS: 'Select only one element',
	INVALID_TYPE: 'Element type not supported',
	NO_GRADIENT_FILL: 'Element has no gradient fill',
	VALID: 'Apply easing'
}

const DEFAULT_MATRIX = [
	[0.42, 0.0],
	[0.58, 1.0]
]

const Plugin = () => {
	/**
	 * States
	 */
	const [easingType, setEasingType] = useState<EasingType>('CURVE')

	const [selectedPreset, setSelectedPreset] =
		useState<PresetOptionKey | null>(null)
	const [presets, setPresets] = useState<any>(NO_PRESETS_OPTION)

	// used as reference for custom preset name input
	const [customPresetRef, setCustomPresetRef] = useState<PresetOption | null>(
		null
	)
	const [customPresetName, setCustomPresetName] = useState<string>('')
	const [customPresetPlaceholder, setCustomPresetPlaceholder] =
		useState<string>('')
	const [showPresetInputDialog, setShowPresetInputDialog] =
		useState<boolean>(false)
	const [showManagingPresetsDialog, setShowManagingPresetsDialog] =
		useState<boolean>(false)
	const [hasInteractedWithPresetMenu, setHasInteractedWithPresetMenu] =
		useState<boolean>(false)
	const [matrix, setMatrix] = useState<Matrix>(DEFAULT_MATRIX)
	const [steps, setSteps] = useState<number>(2)
	const [jump, setJump] = useState<string>('skip-none')
	const [selectionState, setSelectionState] =
		useState<SelectionState>('INVALID_TYPE')

	// data emitted to plugin
	const messageData = { type: easingType, matrix, steps, skip: jump }

	/**
	 * Register event listeners
	 */
	useEffect(() => {
		on('INITIALLY_EMIT_PRESETS_TO_UI', (storedPresets) => {
			if (storedPresets.length) {
				setPresets([...storedPresets])
			}
		})
		on('UPDATE_SELECTION_STATE', (selectionState) => {
			setSelectionState(selectionState)
		})
		on('RESPOND_TO_PRESETS_UPDATE', handleResponseFromPlugin)
	}, [])

	useEffect(() => {
		debounceNumItemsChange(messageData)
	}, [easingType, matrix, steps, jump])

	useEffect(() => {
		if (selectedPreset) {
			// for changing placeholder from 'choose preset...' to 'custom'
			if (!hasInteractedWithPresetMenu)
				setHasInteractedWithPresetMenu(true)

			const matrix = [...presets].find(
				(el) => el.value === selectedPreset
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
				[value[2], value[3]]
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
	 * Debounce gradient updates
	 */
	const debounceWaitTime = 200 //ms
	const debounceNumItemsChange = useCallback(
		debounce((data) => emit('UPDATE_FROM_UI', data), debounceWaitTime),
		[]
	)

	/**
	 * Handle preset menu changes and custom preset input
	 */
	function handlePresetMenuChange(value: PresetOptionKey) {
		if (!showManagingPresetsDialog) {
			if (value === 'ADD_PRESET') {
				const customPresetName: GeneratedCustomPresetKey = `CUSTOM_${getRandomString()}`
				const newPreset: PresetOptionValue = {
					value: customPresetName,
					matrix: [...matrix]
				}
				const placeholder = getCurveSynonym([...matrix])
				setCustomPresetRef(newPreset)
				setCustomPresetPlaceholder(placeholder)
				setShowPresetInputDialog(true)
			} else if (value === 'MANAGE_PRESETS') {
				setShowManagingPresetsDialog(true)
				setSelectedPreset(null)
			} else {
				setSelectedPreset(value)
			}
		} else {
			if (value !== 'RESET_DEFAULT') {
				let data: Array<PresetOption>
				const updatedPresets = [...presets].filter(
					(e) => e.value !== value
				)
				if (!updatedPresets.length) {
					data = []
				} else {
					data = [...updatedPresets]
				}
				emitPresetUpdateToPlugin(data)
			} else {
				emit('EMIT_PRESET_RESET_TO_PLUGIN')
			}
			setShowManagingPresetsDialog(false)
		}
	}

	function handleCustomPresetInput(
		e: JSX.TargetedEvent<HTMLInputElement>
	): void {
		const value = e.currentTarget.value
		setCustomPresetName(value)
	}

	function handleCustomPresetDialogApply(): void {
		if (customPresetName.length > 24) {
			const errorKey: ErrorKey = 'PRESET_INPUT_TOO_MANY_CHARS'
			emitErrorToPlugin(errorKey)
			return
		}

		let data
		const presetName = customPresetName || customPresetPlaceholder
		const newPreset = { children: presetName, ...customPresetRef }
		if ([...presets].some((el) => el.header)) {
			data = [newPreset]
		} else {
			data = [...presets, newPreset]
		}
		emitPresetUpdateToPlugin(data)
		resetCustomPresetDialog()
	}

	function resetCustomPresetDialog(): void {
		setShowPresetInputDialog(false)
		setCustomPresetRef(null)
		setCustomPresetName('')
	}

	function validateCustomPresetInput(value: string): string | boolean {
		//FIXME- Validates on apply and thus no err message is sent
		return value.length < 24
	}

	/**
	 *  Handle emits to plugin and response from plugin
	 */
	function emitPresetUpdateToPlugin(presets: Array<PresetOption>): void {
		emit('EMIT_PRESETS_TO_PLUGIN', presets)
	}

	function emitErrorToPlugin(key: ErrorKey): void {
		//FIXME- Validates on apply and thus no err message is sent
		emit('EMIT_ERROR_TO_PLUGIN', key)
	}

	// TODO: Type.
	function handleResponseFromPlugin(response: Array<any> | undefined): void {
		if (response) {
			if (!response.length) {
				setPresets(NO_PRESETS_OPTION)
			} else {
				//FIXME - get ref to previous value
				if (response.length >= presets.length) {
					setSelectedPreset(response[response.length - 1].value)
				}
				setPresets([...response])
			}
		}
	}

	// Dialogs are cancelled by clicking outside of element
	const ref = useRef<HTMLDivElement>(null)
	useMouseDownOutside({
		onMouseDownOutside: () => handleMouseDownOutside(),
		ref
	})
	function handleMouseDownOutside(): void {
		setShowManagingPresetsDialog(false)
		resetCustomPresetDialog()
	}

	return (
		<Container>
			<Columns>
				<Dropdown
					value={easingType}
					onChange={(e) =>
						setEasingType(e.currentTarget.value as EasingType)
					}
					options={EASING_TYPE_OPTIONS}
				/>
				<div ref={ref} style={{ position: 'relative' }}>
					<PresetInput
						showInputDialog={showPresetInputDialog}
						value={customPresetName}
						placeholder={customPresetPlaceholder}
						onInput={handleCustomPresetInput}
						validateOnBlur={validateCustomPresetInput}
						onApply={handleCustomPresetDialogApply}
					/>
					<PresetMenu
						value={selectedPreset}
						placeholder={
							!hasInteractedWithPresetMenu
								? PLACEHOLDER_BEFORE_INTERACTION_COPY
								: PLACEHOLDER_AFTER_INTERACTION_COPY
						}
						presets={presets}
						showManagingPresetsDialog={showManagingPresetsDialog}
						onValueChange={handlePresetMenuChange}
					/>
				</div>
			</Columns>
			<Editor
				easingType={easingType}
				matrix={matrix}
				steps={steps}
				jump={jump}
				onEditorChange={handleEditorChange}
			/>
			{easingType === 'CURVE' ? (
				<Textbox
					value={[...matrix[0], ...matrix[1]]
						.map((vec) => showDecimals(vec, 2))
						.join(', ')}
					onBlurCapture={handleMatrixInput}
				/>
			) : (
				<Columns>
					<TextboxNumeric
						onInput={handleStepInput}
						value={steps.toString()}
					/>
					<Dropdown
						value={jump}
						onChange={(e) => setJump(e.currentTarget.value)}
						options={JUMP_OPTIONS}
					/>
				</Columns>
			)}
			<Button
				fullWidth
				onClick={() => emit('APPLY_EASING_FUNCTION')}
				disabled={selectionState !== 'VALID'}>
				{BUTTON_MAP[selectionState]}
			</Button>
		</Container>
	)
}

export default render(Plugin)
