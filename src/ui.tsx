import { h, JSX } from 'preact'
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
	MiddleAlign
} from '@create-figma-plugin/ui'
import {
	debounce,
	showDecimals,
	getRandomString,
	getCurveSynonym
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
	StepIcon
} from './icons'

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
const JUMP_ICON: any = {
	'skip-none': DropdownJumpNoneIcon,
	'skip-both': DropdownJumpBothIcon,
	start: DropdownJumpStartIcon,
	end: DropdownJumpEndIcon
}

const HINT_MAP: SelectionStateMap = {
	EMPTY: 'No element selected.',
	MULTIPLE_ELEMENTS: 'Do not select more than one element.',
	INVALID_TYPE: 'Selected element type is not supported.',
	NO_GRADIENT_FILL: 'Selected element must have at least one gradient fill.',
	VALID: 'Applies the current easing function to the selected element.'
}

const DEFAULT_MATRIX = [
	[0.65, 0.0],
	[0.35, 1.0]
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
	const [tempCustomPresetStore, setTempCustomPresetStore] =
		useState<PresetOption | null>(null)
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
	const [steps, setSteps] = useState<number>(8)
	const [jump, setJump] = useState<string>('skip-none')
	const [selectionState, setSelectionState] =
		useState<SelectionState>('INVALID_TYPE')

	const test = useRef<any>(presets)

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
	const debounceWaitTime = 100 //ms
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
				setTempCustomPresetStore(newPreset)
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
				emitPresetUpdateToPlugin(data, 'REMOVE')
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
		const newPreset = { children: presetName, ...tempCustomPresetStore }
		if ([...presets].some((el) => el.header)) {
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
		setCustomPresetName('')
	}

	/**
	 *  Handle emits to plugin and response from plugin
	 */
	function emitPresetUpdateToPlugin(
		presets: Array<PresetOption>,
		message: PresetMessage
	): void {
		emit('EMIT_PRESETS_TO_PLUGIN', { presets, message })
	}

	function emitErrorToPlugin(key: ErrorKey): void {
		//FIXME- Validates on apply and thus no err message is sent
		emit('EMIT_ERROR_TO_PLUGIN', key)
	}

	// TODO: Type.
	function handleResponseFromPlugin(data: any): void {
		const { response, message } = data
		if (response) {
			if (!response.length) {
				setPresets(NO_PRESETS_OPTION)
			} else {
				setPresets([...response])
				if (message === 'ADD') {
					setSelectedPreset(response[response.length - 1].value)
				}
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
			<VerticalSpace space="extraSmall" />
			<Columns space="extraSmall">
				<Dropdown
					value={easingType}
					onChange={(e) =>
						setEasingType(e.currentTarget.value as EasingType)
					}
					icon={
						easingType === 'CURVE' ? (
							<CurveIcon size={12} matrix={matrix} />
						) : (
							<StepIcon size={12} steps={steps} jump={jump} />
						)
					}
					options={EASING_TYPE_OPTIONS}
				/>
				<div
					ref={ref}
					style={{
						position: 'relative',
						visibility:
							easingType === 'CURVE' ? 'visible' : 'hidden',
						pointerEvents: easingType === 'CURVE' ? 'all' : 'none'
					}}>
					<PresetInput
						showInputDialog={showPresetInputDialog}
						value={customPresetName}
						placeholder={customPresetPlaceholder}
						onInput={handleCustomPresetInput}
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
			<VerticalSpace space="extraSmall" />
			<Editor
				easingType={easingType}
				matrix={matrix}
				steps={steps}
				jump={jump}
				onEditorChange={handleEditorChange}
			/>
			<VerticalSpace space="extraSmall" />
			{easingType === 'CURVE' ? (
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
						onChange={(e) => setJump(e.currentTarget.value)}
						options={JUMP_OPTIONS}
					/>
				</Columns>
			)}
			<VerticalSpace space="extraSmall" />
			<Button
				fullWidth
				onClick={() => emit('APPLY_EASING_FUNCTION')}
				disabled={selectionState !== 'VALID'}>
				Apply
			</Button>
			<VerticalSpace space="extraSmall" />
			<div style={{ height: 36 }}>
				<MiddleAlign>
					<Text style={{ textAlign: 'center' }} muted>
						{HINT_MAP[selectionState]}
					</Text>
				</MiddleAlign>
			</div>
		</Container>
	)
}

export default render(Plugin)
