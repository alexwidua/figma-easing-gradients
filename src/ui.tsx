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
import Editor from './components/editor'

/**
 * Types
 */

/* import { DropdownOption } from '@create-figma-plugin/ui'
import { SelectionKey, SelectionKeyMap } from './utils/'
import { EasingOptions, EasingType, Matrix, SkipOption } from './main'
import { EditorChange } from './_components/editor/editor' */

/* export type PresetOption =
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
export type PresetMessage = 'ADD' | 'REMOVE' */

const Plugin = () => {
	const [easingMatrix, setEasingMatrix] = useState([
		[0.35, 0],
		[0.65, 1.0],
	])

	const handleMatrixChange = ({ index, x, y }: any) => {
		setEasingMatrix((matrix) => {
			const arr = [...matrix]
			arr[index] = [x, y]
			return arr
		})
	}
	return (
		<Container space="medium">
			<VerticalSpace space="large" />
			<Editor matrix={easingMatrix} onChange={handleMatrixChange} />
		</Container>
	)
}

export default render(Plugin)
