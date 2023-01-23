import { on, emit } from '../utils/events'
import {
    setPluginData,
    getPluginData,
    nodeIsGeometryMixin,
    nodeHasGradientFill
} from '../utils/figma'
import { interpolateColorStops } from './interpolate-color-stops'

const NEW_KEY = 'grad-refactor-123'
let selectedNode
let originalFills
let fillIndex = 0

figma.showUI(__html__, { width: 256, height: 512, themeColors: true })

figma.on('selectionchange', async () => {
    const selection = figma.currentPage.selection
    if (selection.length > 1) return
    const node = selection[0]
    if (!node) return
    if (!nodeHasGradientFill(node))
        return console.warn('Selected node does not contain gradient fills.')
    if (!nodeIsGeometryMixin(node))
        return console.warn('Selected node is not a valid shape.')
    selectedNode = node
    const { fills } = node

    // 1. Store original gradient stops in pluginData or retrieve previously stored stops
    await getPluginData(node, NEW_KEY).then((pluginData) => {
        if (!pluginData) {
            setPluginData(node, NEW_KEY, fills)
            originalFills = fills
        } else {
            originalFills = JSON.parse(pluginData)
        }
    })

    let gradientFills = originalFills.filter((fill) => fill.type === 'GRADIENT_LINEAR')
    const { gradientStops } = gradientFills[fillIndex]
    const decoratedGradientStops = gradientStops.map((stop) => ({
        ...stop,
        id: Math.random().toString(16).slice(2),
        easing: [
            [0, 1],
            [1, 0]
        ]
    }))

    // 3. Emit selected fill index to UI and apply default easing
    emit('GRADIENT_STOPS', decoratedGradientStops)
    updateGradientFill(decoratedGradientStops)
})

on('UPDATED_GRADIENT_STOPS', (updatedStops) => {
    if (!selectedNode) return
    updateGradientFill(updatedStops)
})

async function updateGradientFill(stops) {
    if (!selectedNode) return
    const updatedFills = [...originalFills]

    let gradientIndex = 0
    for (let i = 0; i < updatedFills.length; i++) {
        if (updatedFills[i].type !== 'GRADIENT_LINEAR') continue
        if (gradientIndex !== fillIndex) {
            gradientIndex++
            continue
        }
        updatedFills[i] = {
            ...updatedFills[i],
            gradientStops: interpolateColorStops(updatedFills[i], stops)
        }
    }
    selectedNode.fills = updatedFills
}
