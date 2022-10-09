import { h } from 'preact'
import {
	Button,
	Columns,
	Textbox,
	VerticalSpace
} from '@create-figma-plugin/ui'
import style from './style.css'

const COPY_INPUT_H1 = `Enter a name`
const COPY_ADD_BUTTON = `Add`

const PresetInput = ({
	showInputDialog,
	value,
	placeholder,
	onInput,
	onApply
}: {
	showInputDialog: boolean
	value: string
	placeholder: string
	onInput:
		| ((event: h.JSX.TargetedEvent<HTMLInputElement, Event>) => void)
		| undefined
	onApply: h.JSX.MouseEventHandler<HTMLButtonElement> | undefined
}) => {
	return (
		<div
			class={`${style.presetInput} ${!showInputDialog && style.isHidden}`}
		>
			<div class={style.header}>{COPY_INPUT_H1}</div>
			<VerticalSpace space="extraSmall" />
			<Textbox
				value={value}
				placeholder={placeholder}
				onInput={onInput}
			/>
			<VerticalSpace space="small" />
			<Columns>
				<Button fullWidth onClick={onApply}>
					{COPY_ADD_BUTTON}
				</Button>
			</Columns>
		</div>
	)
}

export default PresetInput
