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
			${isDragged && style.dragged}
			${matrix[index][0] === index && matrix[index][1] === index && style.zeroed}
			`}
			style={inlineThumb}
			onMouseDown={onMouseDown}
		/>
	)
}

export default Thumb
