import { h } from 'preact'
import style from '../style.css'

const Curve = ({ matrix }: any) => {
	return (
		<svg class={style.viewbox} viewBox="0 0 1 1" fill="none">
			{/* diagonal line */}
			<line
				class={`${style.path} ${style.diagonal}`}
				vector-effect="non-scaling-stroke"
				x1="0"
				y1="1"
				x2="1"
				y2="0"
			/>
			<g>
				{/* thumb[0] connector */}
				<line
					class={style.path}
					vector-effect="non-scaling-stroke"
					x1="0"
					y1="1"
					x2={matrix[0][0]}
					y2={1 - matrix[0][1]}
				/>
				{/* thumb[1] connector --> */}
				<line
					class={style.path}
					vector-effect="non-scaling-stroke"
					x1="1"
					y1="0"
					x2={matrix[1][0]}
					y2={1 - matrix[1][1]}
				/>
				{/* bézier curve */}
				<path
					class={style.path}
					vector-effect="non-scaling-stroke"
					d={`M0,1 C${[matrix[0][0], 1 - matrix[0][1]]}
			                ${[matrix[1][0], 1 - matrix[1][1]]} 1,0`}
				/>
				{/* terminal points */}
				<g>
					<circle class={style.point} cx="0" cy="1" r="0.015" />
					<circle class={style.point} cx="1" cy="0" r="0.015" />
				</g>
			</g>
		</svg>
	)
}

export default Curve
