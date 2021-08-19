import { gl } from './color'
import { debounce } from './debounce'
import {
	isGradientFillWithMultipleStops,
	interpolateColorStops
} from './gradient'
import { nodeIsGeometryMixin, nodeHasGradientFill } from './node'
import { showDecimals } from './number'
import { validateSelection, SelectionKey, SelectionKeyMap } from './selection'
import { getValueFromStoreOrInit, setValueToStorage } from './storage'
import { getRandomString, describeCurveInAdjectives } from './string'
import { handleNotificationFromUI, NotificationKey } from './notification'

export {
	gl,
	debounce,
	isGradientFillWithMultipleStops,
	interpolateColorStops,
	nodeIsGeometryMixin,
	nodeHasGradientFill,
	showDecimals,
	validateSelection,
	getValueFromStoreOrInit,
	setValueToStorage,
	getRandomString,
	describeCurveInAdjectives,
	handleNotificationFromUI
}

export type { SelectionKey, SelectionKeyMap, NotificationKey }
