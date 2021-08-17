import { h } from 'preact'
import { Button, Columns, Textbox } from '@create-figma-plugin/ui'
import style from './style.css'

const INPUT_HEAD_COPY = `Enter name`
const INPUT_BUTTON_COPY = `Add`

const PresetInput = ({
	showInputDialog,
	value,
	placeholder,
	onInput,
	validateOnBlur,
	onApply
}: any) => {
	return (
		<div
			class={`${style.presetInput} ${
				!showInputDialog && style.isHidden
			}`}>
			<div class={style.header}>{INPUT_HEAD_COPY}</div>
			<Textbox
				value={value}
				placeholder={placeholder}
				onInput={onInput}
				validateOnBlur={validateOnBlur}
			/>
			<Columns>
				<Button fullWidth onClick={onApply}>
					{INPUT_BUTTON_COPY}
				</Button>
			</Columns>
		</div>
	)
}

export default PresetInput
