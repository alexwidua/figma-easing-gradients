import { h } from 'preact'
import style from '../style.css'

import easingCoordinates from 'easing-coordinates'

const Curve = ({ steps = 6, jump = 'skip-none', onMouseDown }: any) => {
	const getPolyPoints = (): string => {
		const coords = easingCoordinates(`steps(${steps}, ${jump})`)
		return coords.map((pos) => `${pos.x},${1 - pos.y}`).join(' ')
	}

	return (
		<svg
			class={`${style.viewbox} ${style.steps}`}
			viewBox="0 0 1 1"
			fill="none"
			onMouseDown={onMouseDown}>
			<g>
				<polyline
					class={style.path}
					vector-effect="non-scaling-stroke"
					points={getPolyPoints()}
				/>
			</g>
			{/* <!-- 0,0 and 1,1 points --> */}
			<g>
				<rect
					fill="#000"
					class={style.rect}
					vector-effect="non-scaling-stroke"
					x="-0.015"
					y="0.985"
					width="0.03"
					height="0.03"
					rx="0.015"
					ry="0.015"
				/>
				<rect
					fill="#fff"
					class={style.rect}
					vector-effect="non-scaling-stroke"
					x="0.985"
					y="-0.015"
					width="0.03"
					height="0.03"
					rx="0.015"
					ry="0.015"
				/>
			</g>
		</svg>
	)
}

export default Curve
