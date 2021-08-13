import { h, JSX } from 'preact'
import { useState, useMemo, useRef, useEffect } from 'preact/hooks'
import {
	Dropdown,
	DropdownOption,
	useMouseDownOutside
} from '@create-figma-plugin/ui'
import { on, once, emit } from '@create-figma-plugin/utilities'
import { useFocus } from '../../hooks/useFocus'

const PresetMenu = () => {
	/**
	 * States
	 */
	const dropdownRef = useRef<HTMLDivElement>(null)
	const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
	const [presets, setPresets] = useState<any>([{ header: 'No presets.' }])
	const options = [
		{ separator: true },
		{ children: 'Add current as preset', value: 'ADD_PRESET' },
		{
			children: 'Manage presets...',
			value: 'MANAGE_PRESETS'
		}
	]
	const defaultOptions = useMemo<any>(() => {
		return [...presets, ...options]
	}, [presets])
	const manageOptions = useMemo(() => {
		return [
			{ header: 'Which preset to remove?' },
			...presets,
			{ separator: true },
			{ children: 'Reset presets to default', value: 'RESET_DEFAULT' }
		]
	}, [presets])
	const [showManageOptions, setShowManageOptions] = useState(false)

	useEffect(() => {
		once('EMIT_PRESETS_TO_UI', (storedPresets) => {
			if (storedPresets.length) {
				setPresets([...storedPresets])
			}
		})
		on('RESPOND_TO_PRESETS_UPDATE', handleResponseFromPlugin)
	}, [])

	function handlePresetInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value

		if (value === 'ADD_PRESET') {
			// TODO: generate unique custom elements
			const temp = [...presets]
			const newPreset: any = { children: 'Custom_1', value: 'CUSTOM_1' }
			if (temp.some((el) => el.header)) {
				emitPresetsUpdate([newPreset])
			} else {
				emitPresetsUpdate([...temp, newPreset])
			}
		} else if (value === 'MANAGE_PRESETS') {
			setShowManageOptions(true)
			setSelectedPreset(null)
		} else {
			setSelectedPreset(value)
		}
	}

	function handleManagePresets(e: JSX.TargetedEvent<HTMLInputElement>) {
		const value = e.currentTarget.value
		if (value !== 'RESET_DEFAULT') {
			const temp = [...presets]
			const updatedPresets = temp.filter((e) => e.value !== value)
			if (!updatedPresets.length) {
				emitPresetsUpdate([])
			} else {
				emitPresetsUpdate([...updatedPresets])
			}
		} else {
			// Initiate reset here...
		}
		setShowManageOptions(false)
	}

	/**
	 * Handle emits to plugin/store updates
	 */

	function emitPresetsUpdate(presets: any) {
		emit('EMIT_PRESETS_TO_PLUGIN', presets)
	}

	function handleResponseFromPlugin(response: any) {
		if (response) {
			if (!response.length) {
				setPresets([{ header: 'No presets.' }])
			} else {
				setPresets([...response])
				setSelectedPreset(response[response.length - 1].value)
			}
		}
	}

	/**
	 * Misc
	 */

	useMouseDownOutside({
		onMouseDownOutside: () => setShowManageOptions(false),
		ref: dropdownRef
	})

	return (
		<div ref={dropdownRef}>
			<Dropdown
				{...useFocus(showManageOptions)}
				value={showManageOptions ? null : selectedPreset}
				onChange={
					showManageOptions ? handleManagePresets : handlePresetInput
				}
				//options={showManageOptions ? manageOptions : defaultOptions}
				options={showManageOptions ? manageOptions : defaultOptions}
				placeholder="Choose preset..."
			/>
		</div>
	)
}

export default PresetMenu
