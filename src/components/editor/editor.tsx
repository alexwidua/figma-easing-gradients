import { h } from 'preact'
import { useState, useRef } from 'preact/hooks'
import style from './style.css'
import Thumb from './thumb'
import { Curve, Steps } from './views'
import { EasingType, Matrix, SkipOption } from '../../main'

export type EditorChange = {
	type: EasingType
	thumb?: { index: EditorInputIndex; vector: number[] }
	steps?: number
}
type EditorInputIndex = -1 | 0 | 1 | 2

const EasingEditor = ({
	easingType,
	matrix,
	steps,
	jump,
	onEditorChange
}: {
	easingType: EasingType
	matrix: Matrix
	steps: number
	jump: SkipOption
	onEditorChange: (change: EditorChange) => void
}) => {
	// empty -1, thumbs 0..1, steps scrubbing 2
	const [currentIndex, setCurrentIndex] = useState<EditorInputIndex>(-1)
	const [initX, setInitX] = useState<number>(0)
	const [initSteps, setInitSteps] = useState<number>(steps)
	const scrubSensitivity: number = 0.1 // 1 => 1 step increase per 1 pixel

	const container = useRef<HTMLDivElement>(null)

	function handleMouseDown(index: EditorInputIndex, e?: MouseEvent): void {
		setCurrentIndex(index)
		if (e && index === 2) {
			// hold onto reference values for scrubbing
			setInitSteps(steps)
			setInitX(e.clientX)
		}
	}

	function handleMouseMove(e: MouseEvent): void {
		if (currentIndex === -1 || !container.current) return

		let value: EditorChange

		// dragging bézier thumbs
		if (currentIndex < 2) {
			const rect: ClientRect = container.current.getBoundingClientRect()

			// keep handles in viewbox bounds
			const x: number =
				e.clientX <= rect.left
					? 0
					: e.clientX >= rect.right
					? 1
					: (e.clientX - rect.left) / (rect.right - rect.left)
			const y: number =
				e.clientY <= rect.top
					? 1
					: e.clientY >= rect.bottom
					? 0
					: 1 - (e.clientY - rect.top) / (rect.bottom - rect.top)

			value = {
				type: 'CURVE',
				thumb: { index: currentIndex, vector: [x, y] }
			}
		}
		// scrubbing the step polyline
		else {
			const deltaX = e.clientX - initX
			const addFriction = Math.floor(deltaX * scrubSensitivity)
			const minSteps = Math.max(initSteps + addFriction, 2)

			value = {
				type: 'STEPS',
				steps: minSteps
			}
		}
		onEditorChange(value)
	}

	function cancelDragEvent(): void {
		setCurrentIndex(-1)
	}

	return (
		<div
			class={style.wrapper}
			onMouseMove={handleMouseMove}
			onMouseUp={cancelDragEvent}
			onMouseLeave={cancelDragEvent}>
			<div class={style.container} ref={container}>
				{easingType === 'CURVE' && (
					<div>
						<Thumb
							isDragged={currentIndex === 0}
							index={0}
							matrix={matrix}
							onMouseDown={() => handleMouseDown(0)}
						/>
						<Thumb
							isDragged={currentIndex === 1}
							index={1}
							matrix={matrix}
							onMouseDown={() => handleMouseDown(1)}
						/>
						<Curve matrix={matrix} />
					</div>
				)}
				{easingType === 'STEPS' && (
					<Steps
						steps={steps}
						jump={jump}
						onMouseDown={(e: MouseEvent) => handleMouseDown(2, e)}
					/>
				)}
			</div>
		</div>
	)
}

export default EasingEditor
