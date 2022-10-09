import { h, Fragment } from 'preact'
import { useState, useRef, useLayoutEffect, useEffect } from 'preact/hooks'
import { useDrag } from '@use-gesture/react'
import { useSpring, a } from '@react-spring/web'
import { createClassName, normalize } from '../../utils'
import styles from './index.css'

export default function Editor({ matrix, onChange = () => {} }: any) {
	const editorRef = useRef<HTMLDivElement>(null)
	const [editorSize, setEditorSize] = useState(0)
	const [isDragging, setIsDragging] = useState(false)

	useLayoutEffect(() => {
		if (!editorRef.current) return
		const rect = editorRef.current?.getBoundingClientRect()
		const { width } = rect // editor width === height
		const floored = Math.floor(width)
		setEditorSize(floored)
	}, [])

	const handleSingleThumbChange = (evt: any) => {
		const { down, index, x, y } = evt
		setIsDragging(down)
		//onChange(evt)
		const m = [...matrix]
		m[index] = [x, y]
		onChange(m)
	}

	const handleCenterThumbChange = (evt: any) => {
		const { x } = evt
		const m1 = [...matrix[0]]
		const m2 = [...matrix[1]]
		const m = [
			[x, m1[1]],
			[x, m2[1]],
		]
		onChange(m)
	}

	const singleThumbProps = ({ index }: any) => ({
		index,
		matrix,
		onChange: handleSingleThumbChange,
		bounds: editorSize,
	})

	return (
		<div ref={editorRef} className={styles.editor} draggable={false}>
			{editorSize && (
				<Fragment>
					<SingleThumb {...singleThumbProps({ index: 0 })} />
					<SingleThumb {...singleThumbProps({ index: 1 })} />
					<CenterThumb
						index={0}
						matrix={matrix}
						onChange={handleCenterThumbChange}
						bounds={editorSize}
					/>
					<Rest
						editorSize={editorSize}
						matrix={matrix}
						immediate={isDragging}
					/>
				</Fragment>
			)}
		</div>
	)
}

/**
 * Draggable thumbs, used to modify bezier curve
 */
function SingleThumb({ index, matrix, onChange, bounds }: any) {
	const ref = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState(0)
	const [down, setDown] = useState(false)

	useEffect(() => {
		if (!ref.current) return
		const rect = ref.current.getBoundingClientRect()
		const { width } = rect // thumbs are w === h
		setSize(width)
	}, [])

	const { x, y } = useSpring({
		x: matrix[index][0] * bounds,
		y: bounds - matrix[index][1] * bounds,
		immediate: down,
	})

	const handleDrag = useDrag(
		({ down, offset: [ox, oy] }) => {
			const nx = normalize(ox, 0, bounds)
			const ny = 1 - normalize(oy, 0, bounds)
			onChange({ down, index, x: nx, y: ny })
			setDown(down)
		},
		{
			bounds: {
				top: 0,
				right: bounds,
				bottom: bounds,
				left: 0,
			},
			from: () => [x.get(), y.get()],
			rubberband: true,
		}
	)

	const isZero = index === matrix[index][0]

	return (
		<a.div
			ref={ref}
			className={createClassName([
				styles.thumb,
				down ? styles.dragged : null,
				isZero ? styles.zeroed : null,
			])}
			draggable={false}
			style={{
				x: x.to((x) => x - size / 2),
				y: y.to((y) => y - size / 2),
			}}
			{...handleDrag()}
		/>
	)
}

function CenterThumb({ index, matrix, onChange, bounds }: any) {
	const ref = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState(0)
	const [down, setDown] = useState(false)

	useEffect(() => {
		if (!ref.current) return
		const rect = ref.current.getBoundingClientRect()
		const { width } = rect // thumbs are w === h
		setSize(width)
	}, [])

	const { x, y } = useSpring({
		x: (matrix[0][0] * bounds + matrix[1][0] * bounds) / 2,
		y: bounds / 2,
		immediate: down,
	})

	const handleDrag = useDrag(
		({ down, offset: [ox, oy] }) => {
			const nx = normalize(ox, 0, bounds)
			//const ny = 1 - normalize(oy, 0, bounds)
			onChange({ down, index, x: nx })

			setDown(down)
		},
		{
			bounds: {
				top: 0,
				right: bounds,
				bottom: bounds,
				left: 0,
			},
			from: () => [x.get(), y.get()],
			rubberband: true,
		}
	)

	const isZero = index === matrix[index][0]

	return (
		<a.div
			ref={ref}
			className={createClassName([styles.cthumb])}
			draggable={false}
			style={{
				x: x.to((x) => x - size / 2),
				y: y.to((y) => y - size / 2),
			}}
			{...handleDrag()}
		/>
	)
}

/**
 * Rest of editor, including bezier curve, thumb connectors and end points
 */
function Rest({ editorSize, matrix, immediate }: any) {
	const pxToPt = (value: number) => normalize(value, 0, editorSize)

	const { x1, y1, x2, y2, d } = useSpring({
		x1: matrix[0][0],
		y1: 1 - matrix[0][1],
		x2: matrix[1][0],
		y2: 1 - matrix[1][1],
		d: `M0,1 C${matrix[0][0]},${1 - matrix[0][1]} ${matrix[1][0]},${
			1 - matrix[1][1]
		} 1,0`,
		immediate,
	})

	return (
		<svg className={styles.viewbox} viewBox="0 0 1 1" fill="none">
			<g>
				<a.path
					className={createClassName([styles.path, styles.curve])}
					vectorEffect="non-scaling-stroke"
					d={d}
				/>
				<a.line
					className={createClassName([styles.path, styles.connector])}
					vectorEffect="non-scaling-stroke"
					x1={0}
					y1={1}
					x2={x1}
					y2={y1}
				/>
				<a.line
					className={createClassName([styles.path, styles.connector])}
					vectorEffect="non-scaling-stroke"
					x1={1}
					y1={0}
					x2={x2}
					y2={y2}
				/>
				<g>
					<circle
						className={styles.point}
						cx={0}
						cy={1}
						r={pxToPt(4)}
						strokeWidth={pxToPt(1)}
					/>
					<circle
						className={styles.point}
						cx={1}
						cy={0}
						r={pxToPt(4)}
						strokeWidth={pxToPt(1)}
					/>
				</g>
			</g>
		</svg>
	)
}
