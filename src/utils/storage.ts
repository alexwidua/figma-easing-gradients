/**
 * Handle storage
 */

const STORAGE_KEY = 'easing-presets-1'

const defaultPresets = [
	{ children: 'Ease example 1', value: 'EASE_1' },
	{ children: 'Ease example 2', value: 'EASE_2' }
]

export async function getPresets() {
	let presets = defaultPresets
	try {
		const fromClientStorage = await figma.clientStorage.getAsync(
			STORAGE_KEY
		)
		if (typeof fromClientStorage === 'undefined') {
			figma.clientStorage.setAsync(STORAGE_KEY, presets)
		} else presets = fromClientStorage
	} catch {
		console.error(`Couldn't retrieve user presets.`)
	}
	return presets
}

export async function setPresets(presets: any) {
	let response
	try {
		await figma.clientStorage.setAsync(STORAGE_KEY, presets)
		response = presets
	} catch {
		console.error(`Couldn't set user presets.`)
		response = undefined
	}
	return response
}
