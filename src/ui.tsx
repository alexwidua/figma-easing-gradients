import { h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import {
	render,
	Container,
	Columns,
	Textbox,
	TextboxNumeric,
	Dropdown,
	DropdownOption,
} from '@create-figma-plugin/ui'
import { showDecimals } from './utils/number'

import { Editor } from './components'

const Plugin = ({ ui }: any) => {
	const easingTypeOptions: Array<DropdownOption> = [
		{ children: 'Curve', value: 'CURVE' },
		{ children: 'Steps', value: 'STEPS' }
	]
	const [easingType, setEasingType] = useState<string>('CURVE')
	const [matrix, setMatrix] = useState<Matrix>([
		[0.42, 0.0],
		[0.58, 1.0]
	])
	const [steps, setSteps] = useState<number>(2)

	const mapMatrixToString: string = [...matrix[0], ...matrix[1]]
		.map((vec) => showDecimals(vec, 2))
		.join(', ')

	/**
	 * Handle input events
	 */

	function handleEasingTypeDropdown(
		e: JSX.TargetedEvent<HTMLInputElement>
	): void {
		setEasingType(e.currentTarget.value as string)
	}

	function handleStepInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (parseFloat(value) > 1) {
			setSteps(parseFloat(value))
		}
	}

	function handleMatrixInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value.split(', ').map(Number)
		const isValidValue = value.every((e) => e >= 0 && e <= 1)

		if (value.length === 4 && isValidValue) {
			setMatrix([
				[value[0], value[1]],
				[value[2], value[3]]
			])
		}
	}

	function handleThumbChange(data: {
		index: number
		vector: Array<number>
	}): void {
		const prev = [...matrix]
		prev[data.index] = data.vector
		setMatrix(prev)
	}

	const easingInput =
		easingType === 'CURVE' ? (
			<Textbox
				value={mapMatrixToString}
				onBlurCapture={handleMatrixInput}
			/>
		) : (
			<TextboxNumeric
				onInput={handleStepInput}
				value={steps.toString()}
			/>
		)

	return (
		<Container>
			<Columns>
				<Dropdown
					value={easingType}
					onChange={handleEasingTypeDropdown}
					options={easingTypeOptions}
				/>
				<div>TODO: Presets</div>
			</Columns>
			<Editor
				width={ui.width}
				easingType={easingType}
				matrix={matrix}
				onThumbChange={handleThumbChange}
			/>
			{easingInput}
		</Container>
	)
}

export default render(Plugin)
