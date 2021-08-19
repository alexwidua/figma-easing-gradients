import { h } from 'preact'
import { Matrix } from '../main'

const CurveIcon = ({ size = 12, matrix }: { size: number; matrix: Matrix }) => {
	const viewbox = {
		overflow: 'visible',
		height: size,
		width: size
	}
	const path = {
		fill: 'none',
		strokeWidth: '1px',
		strokeLinecap: 'round',
		stroke: 'currentColor'
	}
	return (
		<svg style={viewbox} viewBox="0 0 1 1" fill="none">
			<path
				style={path}
				vector-effect="non-scaling-stroke"
				d={`M0,1 C${[matrix[0][0], 1 - matrix[0][1]]}
			                ${[matrix[1][0], 1 - matrix[1][1]]} 1,0`}
			/>
		</svg>
	)
}

export default CurveIcon
