import { h } from 'preact'
import { stepsCoordinates } from '../utils/coordinates'
import { SkipOption } from '../main'

const StepIcon = ({
	size = 12,
	steps = 6,
	jump = 'skip-none'
}: {
	size: number
	steps: number
	jump: SkipOption
}) => {
	const getPolyPoints = (): string => {
		const coords = stepsCoordinates(steps, jump)
		return coords.map((pos) => `${pos.x},${1 - pos.y}`).join(' ')
	}

	// display dashed line as visual guide for jump/skip values
	const getJumpHelper = [
		`${stepsCoordinates(steps, jump)[0].x}, ${
			1 - stepsCoordinates(steps, jump)[0].y
		}`,
		`${stepsCoordinates(steps, jump)[steps * 2 - 1].x}, ${
			1 - stepsCoordinates(steps, jump)[steps * 2 - 1].y
		}`
	]

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

	const dashed = {
		strokeDasharray: 4
	}

	return (
		<svg style={viewbox} viewBox='0 0 1 1' fill='none'>
			{/* stepped polyline */}
			<g>
				<polyline
					style={path}
					vector-effect='non-scaling-stroke'
					points={getPolyPoints()}
				/>
			</g>
			<polyline
				style={{ ...path, ...dashed }}
				vector-effect='non-scaling-stroke'
				points={`0,1 ${getJumpHelper[0]}`}
			/>
			<polyline
				style={{ ...path, ...dashed }}
				vector-effect='non-scaling-stroke'
				points={`1,0 ${getJumpHelper[1]}`}
			/>
		</svg>
	)
}

export default StepIcon
