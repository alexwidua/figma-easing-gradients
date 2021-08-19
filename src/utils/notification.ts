/**
 * All-purpose handler to display notifications emitted from the ui.
 */

const NOTIFICATION_KEY_MAP: NotificationKeyMap = {
	PRESET_INPUT_TOO_MANY_CHARS: 'Enter a name with less than 24 characters.'
}
export type NotificationKey = 'PRESET_INPUT_TOO_MANY_CHARS'
export type NotificationKeyMap = { [type in NotificationKey]: string }

export function handleNotificationFromUI(
	key: NotificationKey
): NotificationHandler {
	return figma.notify(NOTIFICATION_KEY_MAP[key])
}
