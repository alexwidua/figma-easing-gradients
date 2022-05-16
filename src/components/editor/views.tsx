import { h } from 'preact'
import style from './style.css'
import { stepsCoordinates } from '../../utils/coordinates'
import { Matrix, SkipOption } from '../../main'
import { createClassName } from '../../utils/create-class-name'

const Curve = ({
	matrix = [
		[0.0, 0.0],
		[0.0, 0.0]
	]
}: {
	matrix: Matrix
}) => {
	return (
		<svg class={style.viewbox} viewBox='0 0 1 1' fill='none'>
			<g>
				{/* thumb[0] connector */}
				<line
					class={createClassName([style.path, style.connector])}
					vector-effect='non-scaling-stroke'
					x1='0'
					y1='1'
					x2={matrix[0][0]}
					y2={1 - matrix[0][1]}
				/>
				{/* thumb[1] connector --> */}
				<line
					class={createClassName([style.path, style.connector])}
					vector-effect='non-scaling-stroke'
					x1='1'
					y1='0'
					x2={matrix[1][0]}
					y2={1 - matrix[1][1]}
				/>
				{/* bézier curve */}
				<path
					class={style.path}
					vector-effect='non-scaling-stroke'
					d={`M0,1 C${[matrix[0][0], 1 - matrix[0][1]]}
			                ${[matrix[1][0], 1 - matrix[1][1]]} 1,0`}
				/>
				{/* terminal points */}
				<g>
					<circle class={style.point} cx='0' cy='1' r='0.015' />
					<circle class={style.point} cx='1' cy='0' r='0.015' />
				</g>
			</g>
		</svg>
	)
}

const Steps = ({
	steps = 6,
	jump = 'skip-none',
	onMouseDown
}: {
	steps: number
	jump: SkipOption
	onMouseDown: h.JSX.MouseEventHandler<SVGSVGElement>
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

	return (
		<svg
			class={style.viewbox}
			style={{ cursor: 'ew-resize' }}
			viewBox='0 0 1 1'
			fill='none'
			onMouseDown={onMouseDown}>
			{/* stepped polyline */}
			<g>
				<polyline
					class={style.path}
					vector-effect='non-scaling-stroke'
					points={getPolyPoints()}
				/>
			</g>

			<polyline
				class={`${style.path} ${style.dashed}`}
				vector-effect='non-scaling-stroke'
				points={`0,1 ${getJumpHelper[0]}`}
			/>
			<polyline
				class={`${style.path} ${style.dashed}`}
				vector-effect='non-scaling-stroke'
				points={`1,0 ${getJumpHelper[1]}`}
			/>
			{/* terminal points */}
			<g>
				<circle class={style.point} cx='0' cy='1' r='0.01' />
				<circle class={style.point} cx='1' cy='0' r='0.01' />
			</g>
		</svg>
	)
}

export { Curve, Steps }
