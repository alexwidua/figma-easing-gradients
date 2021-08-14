import { h, JSX } from 'preact'
import {
	useState,
	useMemo,
	useRef,
	useEffect,
	useImperativeHandle
} from 'preact/hooks'
import {
	Dropdown,
	DropdownOption,
	useMouseDownOutside
} from '@create-figma-plugin/ui'
import { on, once, emit } from '@create-figma-plugin/utilities'
import { useFocus } from '../../hooks/useFocus'

const PRESET_MENU_PLACEHOLDER: string = 'Choose preset...'
const NO_PRESETS_AVAILABLE_OPTION: Array<DropdownOption> = [
	{ header: 'No userPresets.' }
]
const MENU_OPTIONS: Array<DropdownOption> = [
	{ separator: true },
	{ children: 'Add current as preset', value: 'ADD_PRESET' },
	{
		children: 'Manage userPresets...',
		value: 'MANAGE_PRESETS'
	}
]

const PresetMenu = ({ matrix, onChange }: any) => {
	/**
	 * States
	 */
	const [userPresets, setUserPresets] = useState<any>(
		NO_PRESETS_AVAILABLE_OPTION
	)
	const menuOptions = MENU_OPTIONS

	const [selectedOption, setSelectedOption] = useState<string | null>(null)
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

	const [showManagePresetOptions, setShowManagePresetOptions] =
		useState<boolean>(false)

	const ref = useRef<HTMLDivElement>(null)

	/**
	 * Hooks
	 */
	useEffect(() => {
		on('EMIT_PRESETS_TO_UI', (storedPresets) => {
			if (storedPresets.length) {
				setUserPresets([...storedPresets])
			}
		})
		on('RESPOND_TO_PRESETS_UPDATE', handleResponseFromPlugin)
	}, [])

	useEffect(() => {
		if (selectedOption) {
			const temp = [...userPresets]
			const presetMatrix = temp.find(
				(el) => el.value === selectedOption
			).matrix
			onChange(presetMatrix)
		}
	}, [selectedOption])

	// useEffect(() => {
	// 	setSelectedOption(null)
	// }, [matrix])

	/**
	 * Input event handlers
	 */
	function handlePresetInput(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value

		if (value === 'ADD_PRESET') {
			// TODO: generate unique custom elements
			const temp = [...userPresets]
			const newPreset: any = {
				children: 'Custom_1',
				value: 'CUSTOM_1',
				matrix: [...matrix]
			}
			if (temp.some((el) => el.header)) {
				emitUserPresetUpdate([newPreset])
			} else {
				emitUserPresetUpdate([...temp, newPreset])
			}
		} else if (value === 'MANAGE_PRESETS') {
			setShowManagePresetOptions(true)
			setSelectedOption(null)
		} else {
			setSelectedOption(value)
		}
	}

	function handleManagePresets(e: JSX.TargetedEvent<HTMLInputElement>): void {
		const value = e.currentTarget.value
		if (value !== 'RESET_DEFAULT') {
			const temp = [...userPresets]
			const updatedPresets = temp.filter((e) => e.value !== value)
			if (!updatedPresets.length) {
				emitUserPresetUpdate([])
			} else {
				emitUserPresetUpdate([...updatedPresets])
			}
		} else {
			// TODO: Initiate reset here...
		}
		setShowManagePresetOptions(false)
	}

	/**
	 * Handle emits to plugin/store updates
	 */
	function emitUserPresetUpdate(userPresets: Array<DropdownOption>): void {
		emit('EMIT_PRESETS_TO_PLUGIN', userPresets)
	}

	// TODO: Type.
	function handleResponseFromPlugin(response: Array<any> | undefined): void {
		if (response) {
			if (!response.length) {
				setUserPresets(NO_PRESETS_AVAILABLE_OPTION)
			} else {
				// if presets has been added, select it
				if (response.length > userPresets.length) {
					setSelectedOption(response[response.length - 1].value)
				}
				setUserPresets([...response])
			}
		}
	}

	/**
	 * Misc
	 */
	useMouseDownOutside({
		onMouseDownOutside: () => setShowManagePresetOptions(false),
		ref
	})

	return (
		<div ref={ref}>
			<Dropdown
				{...useFocus(showManagePresetOptions)}
				value={showManagePresetOptions ? null : selectedOption}
				onChange={
					showManagePresetOptions
						? handleManagePresets
						: handlePresetInput
				}
				options={
					showManagePresetOptions
						? managePresetsOptions
						: defaultOptions
				}
				placeholder={PRESET_MENU_PLACEHOLDER}
			/>
		</div>
	)
}

export default PresetMenu
