/**
 * Tries to read value from figma.clientStorage, initializes and sets store
 * if no value has been set.
 * @param key
 * @param initValue
 * @returns
 */
export async function getValueFromStoreOrInit(key: string, initValue: any) {
	let value = initValue
	try {
		const tryFromClientStorage = await figma.clientStorage.getAsync(key)
		if (typeof tryFromClientStorage === 'undefined') {
			await figma.clientStorage.setAsync(key, value)
		} else {
			value = tryFromClientStorage
		}
	} catch (e) {
		console.error(`Couldn't get value from store.`, e)
	}
	return value
}

/**
 * Writes value to figma.clientStorage.
 * @param key
 * @param value
 * @returns supplied value if successful, returns undefined if failed
 */
export async function setValueToStorage(key: string, value: any) {
	let response = undefined
	try {
		await figma.clientStorage.setAsync(key, value)
		response = value
	} catch (e) {
		console.error(`Couldn't set user presets.`, e)
	}
	return response
}
