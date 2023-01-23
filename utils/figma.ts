/**
 * Plugin data
 */
export async function getPluginData(node, key) {
    return await node.getPluginData(key)
}

export async function setPluginData(node, key, data) {
    try {
        const stringified = JSON.stringify(data)
        node.setPluginData(key, stringified)
    } catch (e) {
        console.log(e)
    }
}

/**
 * Fills
 */
export function isGradientFillWithMultipleStops(fill: Paint): fill is GradientPaint {
    return 'gradientStops' in fill && fill?.gradientStops?.length > 1
}

export function nodeHasGradientFill(node: SceneNode) {
    const fills = node.fills as Paint[]
    // if (!fills) return -1
    return fills.findIndex((fill) => isGradientFillWithMultipleStops(fill)) > -1
}

/**
 * Geometry
 */
export function nodeIsGeometryMixin(selection: any): selection is GeometryMixin {
    return 'fills' in selection
}
