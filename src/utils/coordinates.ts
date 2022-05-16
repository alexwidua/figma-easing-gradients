import { SkipOption } from '../main'

export type Vector = { x: number; y: number }

export function curveCoordinates(colorSteps: number): number[] {
	const coordinates = []
	let n = 0
	const stepSize = 1 / colorSteps
	while (n < colorSteps) {
		coordinates.push(n * stepSize)
		n += 1
	}
	return coordinates
}

export function stepsCoordinates(steps: number, skip: SkipOption): Vector[] {
	const coordinates: Vector[] = []
	let n = 0
	while (n < steps) {
		const x1 = n / steps
		const x2 = (n + 1) / steps
		let y = 0
		switch (skip) {
			case 'skip-none':
				y = n / (steps - 1)
				break
			case 'skip-both':
				y = (n + 1) / (steps + 1)
				break
			case 'skip-start':
				y = (n + 1) / steps
				break
			case 'skip-end':
				y = n / steps
				break
			default:
				throw new Error(`Unrecognized skip: "${skip}"`)
		}
		coordinates.push({ x: x1, y })
		coordinates.push({ x: x2, y })
		n += 1
	}
	return coordinates
}
