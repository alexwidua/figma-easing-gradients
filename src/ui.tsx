import { h, JSX } from 'preact'
import { useState, useEffect, useCallback, useRef, useMemo } from 'preact/hooks'
import {
	render,
	Button,
	Container,
	Columns,
	Textbox,
	TextboxNumeric,
	Dropdown,
	DropdownOption,
	useMouseDownOutside,
	useInitialFocus
} from '@create-figma-plugin/ui'
import { on, emit } from '@create-figma-plugin/utilities'
import { debounce } from './utils/debounce'
import { showDecimals } from './utils/number'
import { getRandomString, getCurveSynonym } from './utils/string'
import { usePreviousState } from './hooks/usePreviousState'

import './vars.css'
import style from './style.css'

import { PresetMenu, Editor } from './components'
import { useFocus } from './hooks/useFocus'

const PLACEHOLDER_BEFORE_INTERACTION = 'Choose preset...'
const PLACEHOLDER_AFTER_INTERACTION = 'Custom'

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
	const [easingType, setEasingType] = useState<string>('CURVE')

	const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
	const [userPresets, setUserPresets] = useState<any>(NO_PRESETS_OPTION)
	const [tempCustomPreset, setTempCustomPreset] = useState<any>(null)
	const [customPresetName, setCustomPresetName] = useState<string>('')
	const [customPresetPlaceholder, setCustomPresetPlaceholder] =
		useState<any>('')
	const [showCustomPresetDialog, setShowCustomPresetDialog] =
		useState<boolean>(false)
	const previousPresets: any = usePreviousState(userPresets)
	const [showManagingPresetsDialog, setShowManagingPresetsDialog] =
		useState(false)
	const [hasInteractedWithPresetMenu, setHasInteractedWithPresetMenu] =
		useState(false)
	const [matrix, setMatrix] = useState<Matrix>(DEFAULT_MATRIX)
	const [steps, setSteps] = useState<number>(2)
	const [jump, setJump] = useState<string>('skip-none')
	const [selectionState, setSelectionState] =
		useState<SelectionState>('INVALID_TYPE')

	// data emitted to plugin
	const messageData = { type: easingType, matrix, steps, skip: jump }

	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		on('INITIALLY_EMIT_PRESETS_TO_UI', (storedPresets) => {
			if (storedPresets.length) {
				setUserPresets([...storedPresets])
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

			const matrix = [...userPresets].find(
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
	 * Debounce message emit
	 */

	const debounceWaitTime = 200 //ms
	const debounceNumItemsChange = useCallback(
		debounce((data) => emit('UPDATE_FROM_UI', data), debounceWaitTime),
		[]
	)

	/**
	 * Refactor editor
	 * TODO: Organize funcs
	 */
	function handlePresetMenuChange(value: string) {
		if (!showManagingPresetsDialog) {
			if (value === 'ADD_PRESET') {
				// TODO: generate unique custom elements
				// let data

				const randStr = getRandomString()
				const newPreset: any = {
					value: randStr,
					matrix: [...matrix]
				}
				const placeholder = getCurveSynonym([...matrix])
				setTempCustomPreset(newPreset)
				setCustomPresetPlaceholder(placeholder)
				setShowCustomPresetDialog(true)
			} else if (value === 'MANAGE_PRESETS') {
				setShowManagingPresetsDialog(true)
				setSelectedPreset(null)
			} else {
				setSelectedPreset(value)
			}
		} else {
			if (value !== 'RESET_DEFAULT') {
				let data: any
				const updatedPresets = [...userPresets].filter(
					(e) => e.value !== value
				)
				if (!updatedPresets.length) {
					data = []
				} else {
					data = [...updatedPresets]
				}
				emitUserPresetUpdate(data)
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

	function handleCustomPresetDialogApply() {
		if (customPresetName.length > 24) return

		let data
		const presetName = customPresetName || customPresetPlaceholder
		const newPreset = { children: presetName, ...tempCustomPreset }
		if ([...userPresets].some((el) => el.header)) {
			data = [newPreset]
		} else {
			data = [...userPresets, newPreset]
		}
		emitUserPresetUpdate(data)
		resetCustomPresetDialog()
	}

	function handleMouseDownOutside(): void {
		setShowManagingPresetsDialog(false)
		resetCustomPresetDialog()
	}

	function resetCustomPresetDialog() {
		setShowCustomPresetDialog(false)
		setTempCustomPreset(null)
		setCustomPresetName('')
	}

	function validateCustomPresetInput(value: string): string | boolean {
		return value !== ''
	}

	function emitUserPresetUpdate(userPresets: Array<DropdownOption>): void {
		emit('EMIT_PRESETS_TO_PLUGIN', userPresets)
	}

	// TODO: Type.
	function handleResponseFromPlugin(response: Array<any> | undefined): void {
		if (response) {
			if (!response.length) {
				console.log('hit')
				setUserPresets(NO_PRESETS_OPTION)
			} else {
				console.log(response)
				if (response.length >= userPresets.length) {
					console.log('Booya')
					setSelectedPreset(response[response.length - 1].value)
				}
				setUserPresets([...response])
			}
		}
	}

	useMouseDownOutside({
		onMouseDownOutside: () => handleMouseDownOutside(),
		ref
	})

	return (
		<Container>
			<Columns>
				<Dropdown
					value={easingType}
					onChange={(e) => setEasingType(e.currentTarget.value)}
					options={EASING_TYPE_OPTIONS}
				/>
				<div ref={ref} style={{ position: 'relative' }}>
					<div
						class={`${style.presetInput} ${
							!showCustomPresetDialog && style.isHidden
						}`}>
						<div class={style.header}>Enter name</div>
						<Textbox
							// FIXME: Textbox doesn't focus after first time
							{...(showCustomPresetDialog &&
								useFocus(showCustomPresetDialog))}
							value={customPresetName}
							onInput={handleCustomPresetInput}
							validateOnBlur={validateCustomPresetInput}
							placeholder={customPresetPlaceholder}
						/>
						<Columns>
							<Button
								fullWidth
								onClick={handleCustomPresetDialogApply}>
								Add
							</Button>
						</Columns>
					</div>

					<PresetMenu
						value={selectedPreset}
						placeholder={
							!hasInteractedWithPresetMenu
								? PLACEHOLDER_BEFORE_INTERACTION
								: PLACEHOLDER_AFTER_INTERACTION
						}
						userPresets={userPresets}
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
