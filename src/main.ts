import {
	on,
	emit,
	showUI
} from '@create-figma-plugin/utilities'

export default function () {
	/**
	 * Initial data that is sent to UI on plugin startup
	 */
	const ui: UISettings = { width: 280, height: 538 }
	const initialData: { ui: UISettings } = {
		ui
	}

	showUI(ui, initialData)
}
