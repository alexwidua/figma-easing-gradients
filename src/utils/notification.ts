/**
 * All-purpose handler to display notifications emitted from the ui.
 */

export function handleNotificationFromUI(message: string): NotificationHandler {
	return figma.notify(message)
}
