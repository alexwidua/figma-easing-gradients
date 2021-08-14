import { h, JSX } from 'preact'
import { useState, useMemo, useRef, useEffect } from 'preact/hooks'
import { Dropdown, DropdownOption } from '@create-figma-plugin/ui'
import { useFocus } from '../../hooks/useFocus'

const MENU_OPTIONS: Array<DropdownOption> = [
	{ separator: true },
	{ children: 'Add current as preset', value: 'ADD_PRESET' },
	{
		children: 'Manage userPresets...',
		value: 'MANAGE_PRESETS'
	}
]

const PresetMenu = ({
	value,
	placeholder,
	isManagingPresets,
	userPresets,
	onValueChange
}: any) => {
	const menuOptions = MENU_OPTIONS

	const defaultOptions = useMemo<Array<DropdownOption>>(() => {
		return [...userPresets, ...menuOptions]
	}, [userPresets])

	const managePresetsOptions = useMemo<Array<DropdownOption>>(() => {
		return [
			{ header: 'Which preset to remove?' },
			...userPresets,
			{ separator: true },
			{ children: 'Reset userPresets to default', value: 'RESET_DEFAULT' }
		]
	}, [userPresets])

	function handlePresetInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value

		onValueChange(value)
	}

	//useMouseDownOutside({
	//	onMouseDownOutside: () => setShowManagePresetOptions(false),
	//	ref
	//})

	return (
		<Dropdown
			{...useFocus(isManagingPresets)}
			value={isManagingPresets ? null : value}
			onChange={handlePresetInput}
			options={isManagingPresets ? managePresetsOptions : defaultOptions}
			placeholder={placeholder}
		/>
	)
}

export default PresetMenu
