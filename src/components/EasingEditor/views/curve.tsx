import { h } from 'preact'
import style from '../style.css'

const Curve = ({ matrix }: any) => {
	return (
		<svg class="viewbox" viewBox="0 0 1 1" fill="none">
			<g>
				{/* <!-- Diagonal line --> */}
				<line
					class={style.path}
					vector-effect="non-scaling-stroke"
					x1="0"
					y1="1"
					x2="1"
					y2="0"
				/>
			</g>
			{/* If curve */}
			<g>
				{/* <!-- thumb1 connector --> */}
				<line
					class={style.path}
					vector-effect="non-scaling-stroke"
					x1="0"
					y1="1"
					x2={matrix[0][0]}
					y2={1 - matrix[0][1]}
				/>
				<line
					class={style.path}
					vector-effect="non-scaling-stroke"
					x1="1"
					y1="0"
					x2={matrix[1][0]}
					y2={1 - matrix[1][1]}
				/>
				<path
					class={style.path}
					vector-effect="non-scaling-stroke"
					d={`M0,1 C${[matrix[0][0], 1 - matrix[0][1]]}
			                ${[matrix[1][1], 1 - matrix[1][1]]} 1,0`}
				/>
			</g>
		</svg>
	)
}

export default Curve
