/**
 * Rounds number to show trailing decimals.
 */
export function showDecimals(number: number, decimals: number): string {
	return (Math.round(number * 100) / 100).toFixed(decimals)
}

/**
 * Clamp number between a minimum and maximum value.
 */
export function clampNumber(number: number, min: number, max: number): number {
	return Math.min(Math.max(number, min), max)
}
