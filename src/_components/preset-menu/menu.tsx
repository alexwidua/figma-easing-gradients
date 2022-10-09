import { h, JSX } from 'preact'
import { Dropdown, DropdownOption } from '@create-figma-plugin/ui'
import { useFocus } from '../../hooks/useFocus'
import { PresetOption, PresetOptionKey } from '../../ui'

const COPY_DEFAULT_OPTIONS_H1 = `Select a preset`
const COPY_DEFAULT_OPTIONS_H2 = `Options`
const COPY_MANAGE_PRESETS_H1 = `Select a preset to remove`
const COPY_MANAGE_PRESETS_H2 = `Dangerzone`
const COPY_MANAGE_PRESETS_RESET = `Remove all and reset to default`
const COPY_MANAGE_PRESETS_ADD_PRESET = `Save current as preset`
const COPY_MANAGE_PRESETS_ACTION = `Remove presets...`

const MENU_OPTIONS: PresetOption[] = [
	{ separator: true },
	{ header: COPY_DEFAULT_OPTIONS_H2 },
	{ children: COPY_MANAGE_PRESETS_ADD_PRESET, value: 'ADD_PRESET' },
	{
		children: COPY_MANAGE_PRESETS_ACTION,
		value: 'MANAGE_PRESETS'
	}
]

const PresetMenu = ({
	value,
	placeholder,
	showManagingPresetsDialog,
	presets,
	onValueChange
}: {
	value: PresetOptionKey | null
	placeholder: string
	showManagingPresetsDialog: boolean
	presets: PresetOption[]
	onValueChange: Function
}) => {
	const defaultOptions: PresetOption[] = [
		{ header: COPY_DEFAULT_OPTIONS_H1 },
		...presets,
		...MENU_OPTIONS
	]
	const managePresetsOptions: PresetOption[] = [
		{ header: COPY_MANAGE_PRESETS_H1 },
		...presets,
		{ separator: true },
		{ header: COPY_MANAGE_PRESETS_H2 },
		{ children: COPY_MANAGE_PRESETS_RESET, value: 'RESET_DEFAULT' }
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
					: defaultOptions) as DropdownOption[]
			}
			placeholder={placeholder}
		/>
	)
}

export default PresetMenu
