/**
 * @file Event utility that provides on(), once() and emit() handlers for both
 *       the plugin and UI layer.
 *
 * @author Yuan Qing Lim
 * @url https://github.com/yuanqing/create-figma-plugin/blob/main/packages/utilities/src/events.ts
 * @license MIT
 */

export type EventHandler = {
    name: string
    handler: (...args: any) => void
}

const eventHandlers: Record<string, EventHandler> = {}

let currentId = 0

/**
 * Registers an event `handler` for the given event `name`.
 *
 * @returns Returns a function for deregistering the `handler`.
 * @category Events
 */
export function on<Handler extends EventHandler>(
    name: Handler['name'],
    handler: Handler['handler']
): () => void {
    const id = `${currentId}`
    currentId += 1
    eventHandlers[id] = { handler, name }
    return function (): void {
        delete eventHandlers[id]
    }
}

/**
 * Registers an event `handler` that will run at most once for the given
 * event `name`.
 *
 * @returns Returns a function for deregistering the `handler`.
 * @category Events
 */
export function once<Handler extends EventHandler>(
    name: Handler['name'],
    handler: Handler['handler']
): () => void {
    let done = false
    return on(name, function (...args): void {
        if (done === true) {
            return
        }
        done = true
        handler(...args)
    })
}

/**
 * Calling `emit` in the [main context](https://figma.com/plugin-docs/how-plugins-run/) invokes the event
 * handler for the matching event `name` in your UI. Correspondingly, calling
 * `emit` in your UI invokes the event handler for the matching event `name`
 * in the main context.
 *
 * All `args` passed after `name` will be directly
 * [applied](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)
 * on the event handler.
 *
 * See the [recipe for passing data between the main and UI contexts](<%- query('page', 'recipes').url %>#passing-data-between-the-plugin-widgets-main-and-ui-contexts).
 *
 * @category Events
 */
export const emit =
    typeof window === 'undefined'
        ? function <Handler extends EventHandler>(
              name: Handler['name'],
              ...args: Parameters<Handler['handler']>
          ): void {
              figma.ui.postMessage([name, ...args])
          }
        : function <Handler extends EventHandler>(
              name: Handler['name'],
              ...args: Parameters<Handler['handler']>
          ): void {
              window.parent.postMessage(
                  {
                      pluginMessage: [name, ...args]
                  },
                  '*'
              )
          }

function invokeEventHandler(name: string, args: Array<unknown>): void {
    for (const id in eventHandlers) {
        if (eventHandlers[id].name === name) {
            eventHandlers[id].handler.apply(null, args)
        }
    }
}

if (typeof window === 'undefined') {
    figma.ui.onmessage = function ([name, ...args]: [string, Array<unknown>]): void {
        invokeEventHandler(name, args)
    }
} else {
    window.onmessage = function (event: MessageEvent): void {
        const [name, ...args]: [string, Array<unknown>] = event.data.pluginMessage
        invokeEventHandler(name, args)
    }
}
