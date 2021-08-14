import { h } from 'preact'
import style from '../style.css'

import easingCoordinates from 'easing-coordinates'

const Curve = ({ steps = 6, jump = 'skip-none', onMouseDown }: any) => {
	const getPolyPoints = (): string => {
		const coords = easingCoordinates(`steps(${steps}, ${jump})`)
		return coords.map((pos) => `${pos.x},${1 - pos.y}`).join(' ')
	}

	// display dashed line as visual guide for jump/skip values
	const getJumpHelper = [
		`${easingCoordinates(`steps(${steps}, ${jump})`)[0].x}, ${
			1 - easingCoordinates(`steps(${steps}, ${jump})`)[0].y
		}`,
		`${easingCoordinates(`steps(${steps}, ${jump})`)[steps * 2 - 1].x}, ${
			1 - easingCoordinates(`steps(${steps}, ${jump})`)[steps * 2 - 1].y
		}`
	]

	return (
		<svg
			class={`${style.viewbox}`}
			style={{ cursor: 'ew-resize' }}
			viewBox="0 0 1 1"
			fill="none"
			onMouseDown={onMouseDown}>
			{/* stepped polyline */}
			<g>
				<polyline
					class={style.path}
					vector-effect="non-scaling-stroke"
					points={getPolyPoints()}
				/>
			</g>

			<polyline
				class={`${style.path} ${style.dashed}`}
				vector-effect="non-scaling-stroke"
				points={`0,1 ${getJumpHelper[0]}`}
			/>
			<polyline
				class={`${style.path} ${style.dashed}`}
				vector-effect="non-scaling-stroke"
				points={`1,0 ${getJumpHelper[1]}`}
			/>
			{/* terminal points */}
			<g>
				<circle class={style.point} cx="0" cy="1" r="0.015" />
				<circle class={style.point} cx="1" cy="0" r="0.015" />
			</g>
		</svg>
	)
}

export default Curve
