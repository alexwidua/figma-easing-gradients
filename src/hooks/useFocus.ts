import { useEffect } from 'preact/hooks'

const FOCUS_DATA_ATTRIBUTE_NAME = 'data-focus'

export type Focus = {
	[FOCUS_DATA_ATTRIBUTE_NAME]: true
}

export function useFocus(shouldFocus: boolean): Focus {
	useEffect(
		function (): void {
			const focusableElements = document.querySelectorAll<HTMLElement>(
				`[${FOCUS_DATA_ATTRIBUTE_NAME}]`
			)
			if (focusableElements.length === 0) {
				throw new Error(
					`No element with attribute \`${FOCUS_DATA_ATTRIBUTE_NAME}\``
				)
			}
			if (shouldFocus) focusableElements[0].focus()
		},
		[shouldFocus]
	)
	return {
		[FOCUS_DATA_ATTRIBUTE_NAME]: true
	}
}
