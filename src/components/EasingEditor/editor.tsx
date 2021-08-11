import { h, JSX } from 'preact'
import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import style from './style.css'

import Thumb from './thumb'
import Curve from './views/curve'
import Steps from './views/steps'

const EasingEditor = ({ width, easingType, matrix, onThumbChange }: any) => {
	const [currentIndex, setCurrentIndex] = useState(-1)
	const container = useRef<HTMLDivElement>(null)

	function handleMouseDown(index: number): void {
		setCurrentIndex(index)
	}

	function handleMouseMove(e: MouseEvent): void {
		if (currentIndex === -1 || !container.current) return

		const rect: ClientRect = container.current.getBoundingClientRect()
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

		const data: { index: number; vector: Array<number> } = {
			index: currentIndex,
			vector: [x, y]
		}
		onThumbChange(data)
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
							index={0}
							matrix={matrix}
							onMouseDown={() => handleMouseDown(0)}
						/>
						<Thumb
							index={1}
							matrix={matrix}
							onMouseDown={() => handleMouseDown(1)}
						/>
						<Curve matrix={matrix} />
					</div>
				)}
				{easingType === 'STEPS' && <Steps />}
			</div>
		</div>
	)
}

export default EasingEditor
