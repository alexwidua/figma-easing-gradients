import { h, JSX } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import {
	render,
	Button,
	Container,
	Columns,
	Textbox,
	TextboxNumeric,
	Dropdown,
	DropdownOption
} from '@create-figma-plugin/ui'
import { on, emit } from '@create-figma-plugin/utilities'
import { debounce } from './utils/debounce'
import { showDecimals } from './utils/number'

import { PresetMenu, Editor } from './components'

const Plugin = () => {
	// ui-exposed states
	const [easingType, setEasingType] = useState<string>('CURVE')

	const [matrix, setMatrix] = useState<Matrix>([
		[0.42, 0.0],
		[0.58, 1.0]
	])
	const [steps, setSteps] = useState<number>(2)
	const [jump, setJump] = useState<string>('skip-none')
	const [selectionState, setSelectionState] =
		useState<SelectionState>('INVALID_TYPE')

	// data emitted to plugin
	const messageData = { type: easingType, matrix, steps, skip: jump }

	// dropdown options
	const easingTypeOptions: Array<DropdownOption> = [
		{ children: 'Curve', value: 'CURVE' },
		{ children: 'Steps', value: 'STEPS' }
	]

	const jumpOptions: Array<DropdownOption> = [
		{ children: 'jump-none', value: 'skip-none' },
		{ children: 'jump-both', value: 'skip-both' },
		{ children: 'jump-start', value: 'start' },
		{ children: 'jump-end', value: 'end' }
	]

	const buttonMap: SelectionStateMap = {
		EMPTY: 'No element selected',
		MULTIPLE_ELEMENTS: 'Select only one element',
		INVALID_TYPE: 'Element type not supported',
		NO_GRADIENT_FILL: 'Element has no gradient fill',
		VALID: 'Apply easing'
	}

	useEffect(() => {
		on('UPDATE_SELECTION_STATE', (selectionState) => {
			setSelectionState(selectionState)
		})
	}, [])

	useEffect(() => {
		debounceNumItemsChange(messageData)
	}, [easingType, matrix, steps, jump])

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
			//setCurrentPreset(null)
		}
	}

	function handleStepInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseFloat(value) > 1) {
			setSteps(parseFloat(value))
		}
	}

	function handleThumbChange(data: any): void {
		if (data.type === 'CURVE') {
			const { thumb } = data
			const prev = [...matrix]
			prev[thumb.index] = thumb.vector
			setMatrix(prev)
			//setCurrentPreset(null)
		} else if (data.type === 'STEPS') {
			setSteps(data.steps)
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

	return (
		<Container>
			<Columns>
				<Dropdown
					value={easingType}
					onChange={(e) => setEasingType(e.currentTarget.value)}
					options={easingTypeOptions}
				/>
				{/* <Dropdown
					value={currentPreset}
					onChange={handlePresetInput}
					options={presetOptions}
					placeholder="Custom"
				/> */}
				<PresetMenu />
			</Columns>
			<Editor
				easingType={easingType}
				matrix={matrix}
				steps={steps}
				jump={jump}
				onThumbChange={handleThumbChange}
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
						options={jumpOptions}
					/>
				</Columns>
			)}
			<Button
				fullWidth
				onClick={() => emit('APPLY_EASING_FUNCTION')}
				disabled={selectionState !== 'VALID'}>
				{buttonMap[selectionState]}
			</Button>
		</Container>
	)
}

export default render(Plugin)
