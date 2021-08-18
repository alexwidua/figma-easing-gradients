import { h } from 'preact'
import {
	Button,
	Columns,
	Textbox,
	VerticalSpace
} from '@create-figma-plugin/ui'
import style from './style.css'

const INPUT_HEAD_COPY = `Enter a name`
const INPUT_BUTTON_COPY = `Add`

const PresetInput = ({
	showInputDialog,
	value,
	placeholder,
	onInput,
	onApply
}: any) => {
	return (
		<div
			class={`${style.presetInput} ${
				!showInputDialog && style.isHidden
			}`}>
			<div class={style.header}>{INPUT_HEAD_COPY}</div>
			<VerticalSpace space="extraSmall" />
			<Textbox
				value={value}
				placeholder={placeholder}
				onInput={onInput}
			/>
			<VerticalSpace space="small" />
			<Columns>
				<Button fullWidth onClick={onApply}>
					{INPUT_BUTTON_COPY}
				</Button>
			</Columns>
		</div>
	)
}

export default PresetInput
