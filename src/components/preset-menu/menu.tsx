import { h, JSX } from 'preact'
import { Dropdown, DropdownOption } from '@create-figma-plugin/ui'
import { useFocus } from '../../hooks/useFocus'

const DEFAULT_OPTIONS_H1_COPY = `Select a preset`
const DEFAULT_OPTIONS_H2_COPY = `Options`
const MANAGE_PRESETS_H1_COPY = `Select a preset to remove`
const MANAGE_PRESETS_H2_COPY = `Dangerzone`
const MANAGE_PRESETS_RESET_COPY = `Remove all and reset to default`
const MANAGE_PRESETS_ADD_PRESET_COPY = `Save current as preset`
const MANAGE_PRESETS_ACTION_COPY = `Remove presets...`

const MENU_OPTIONS: Array<PresetOption> = [
	{ separator: true },
	{ header: DEFAULT_OPTIONS_H2_COPY },
	{ children: MANAGE_PRESETS_ADD_PRESET_COPY, value: 'ADD_PRESET' },
	{
		children: MANAGE_PRESETS_ACTION_COPY,
		value: 'MANAGE_PRESETS'
	}
]

const PresetMenu = ({
	value,
	placeholder,
	showManagingPresetsDialog,
	presets,
	onValueChange
}: any) => {
	const defaultOptions: Array<PresetOption> = [
		{ header: DEFAULT_OPTIONS_H1_COPY },
		...presets,
		...MENU_OPTIONS
	]
	const managePresetsOptions: Array<PresetOption> = [
		{ header: MANAGE_PRESETS_H1_COPY },
		...presets,
		{ separator: true },
		{ header: MANAGE_PRESETS_H2_COPY },
		{ children: MANAGE_PRESETS_RESET_COPY, value: 'RESET_DEFAULT' }
	]

	function handlePresetInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		onValueChange(value)
	}

	return (
		<Dropdown
			{...useFocus(showManagingPresetsDialog)}
			value={showManagingPresetsDialog ? null : value}
			onChange={handlePresetInput}
			options={
				(showManagingPresetsDialog
					? managePresetsOptions
					: defaultOptions) as Array<DropdownOption>
			}
			placeholder={placeholder}
		/>
	)
}

export default PresetMenu
