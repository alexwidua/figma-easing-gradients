import { h } from 'preact'
import style from './style.css'

const Thumb = ({ index, isDragged, matrix, onMouseDown }: any) => {
	const inlineThumb = {
		left: `${matrix[index][0] * 100}%`,
		top: `${100 - matrix[index][1] * 100}%`
	}

	return (
		<div
			class={`
			${style.thumb}
			${isDragged && style.thumbDragged}
			${matrix[index][0] === 0 && matrix[index][1] === 0 && style.thumbZero}
			`}
			style={inlineThumb}
			onMouseDown={onMouseDown}
		/>
	)
}

export default Thumb
