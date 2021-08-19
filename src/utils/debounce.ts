/**
 * @file Debounce utility to limit the amount of messages emitted to the plugin.
 */

export const debounce = <T extends (...args: any[]) => any>(
	callback: T,
	wait: number
) => {
	let timeout = 0
	return (...args: Parameters<T>): ReturnType<T> => {
		let result: any
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			result = callback(...args)
		}, wait)
		return result
	}
}
