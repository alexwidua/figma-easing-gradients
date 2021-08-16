export function getRandomString(): string {
	return (Math.random() + 1).toString(36).substring(7)
}

export function getCurveSynonym(matrix: Matrix): string {
	const { x1, y1, x2, y2 } = {
		x1: matrix[0][0],
		y1: matrix[0][1],
		x2: matrix[1][0],
		y2: matrix[1][1]
	}

	if (x1 == 0 && y1 == 0 && x2 == 1 && y2 == 1) {
		return `${getRandStrFromArr(LINEAR)} `
	} else if (Math.abs(x1 - y1) < 0.5 && Math.abs(x2 - y2) < 0.5) {
		return `${getRandStrFromArr(GENTLE)} ${getRandStrFromArr(CURVE)}`
	} else if (x1 >= y1 && x2 >= y2) {
		return `${getRandStrFromArr(CONCAVE)} ${getRandStrFromArr(CURVE)}`
	} else if (x1 <= y1 && x2 <= y2) {
		return `${getRandStrFromArr(CONVEX)} ${getRandStrFromArr(CURVE)}`
	} else if (x1 < y1 && x2 > y2) {
		return `${getRandStrFromArr(PLANAR)} ${getRandStrFromArr(CURVE)}`
	} else if (x1 > y1 && x2 < y2) {
		return `${getRandStrFromArr(STEEP)} ${getRandStrFromArr(CURVE)}`
	} else {
		return `eased ${getRandStrFromArr(CURVE)}`
	}
}

function getRandStrFromArr(arr: Array<string>): string {
	return arr[Math.floor(Math.random() * arr.length)]
}

const CURVE = ['curve', 'slope', 'incline', 'bézier', 'descent']
const LINEAR = ['linear', 'straight']
const GENTLE = ['gentle', 'mellow', 'tame', 'soft', 'calm', 'serene']
const CONCAVE = [
	'gradual',
	'concave',
	'half-pipey',
	'acclivous',
	'ascending',
	'indented',
	'hollow'
]

const CONVEX = [
	'extened',
	'expanded',
	'bulbous',
	'inflated',
	'bloated',
	'protuberant',
	'bulged'
]
const PLANAR = ['smooth', 'flattened', 'planar', 'eased']
const STEEP = ['steep', 'scarped', 'precipitous', 'vertiginous', 'sheer']
