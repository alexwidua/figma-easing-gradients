import { h, JSX } from 'preact'
import { Dropdown, DropdownOption } from '@create-figma-plugin/ui'
import { useFocus } from '../../hooks/useFocus'

const MANAGE_PRESETS_HEAD_COPY = `Which preset to remove?`
const MANAGE_PRESETS_RESET_COPY = `Reset presets to default`
const MANAGE_PRESETS_ADD_PRESET_COPY = `Add current as preset`
const MANAGE_PRESETS_ACTION_COPY = `Manage presets...`

const MENU_OPTIONS: Array<PresetOption> = [
	{ separator: true },
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
	const defaultOptions: Array<PresetOption> = [...presets, ...MENU_OPTIONS]
	const managePresetsOptions: Array<PresetOption> = [
		{ header: MANAGE_PRESETS_HEAD_COPY },
		...presets,
		{ separator: true },
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
