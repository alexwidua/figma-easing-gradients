/**
 * Rounds number to show trailing decimals.
 */
export function showDecimals(number: number, decimals: number): string {
	return (Math.round(number * 100) / 100).toFixed(decimals)
}
