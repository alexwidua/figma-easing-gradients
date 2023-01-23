import React, { useState, useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import CurveEditor from './components/CurveEditor'
import GradientStops from './components/GradientStops'
import './base.css'
import './app.css'
import { on, emit } from '../utils/events'
import { gl, rgba } from '../utils/color'
import { debounce } from 'lodash'

const glToRgba = (stops) => stops.map((stop) => ({ ...stop, color: gl(stop.color) }))
const rgbaToGl = (stops) => stops.map((stop) => ({ ...stop, color: rgba(stop.color) }))

function App() {
    const [gradientStops, setGradientStops] = useState([])
    useEffect(() => {
        on('GRADIENT_STOPS', (stops) => {
            // const glToRgba = e.map((el) => ({ ...el, color: gl(el.color) }))
            setGradientStops(glToRgba(stops))
        })
    }, [])

    const [selectedStopIndex, setSelectedStopIndex] = useState([0])

    const handleMatrixChange = useCallback(
        (updatedMatrix) => {
            setGradientStops((prev) => {
                const stops = [...prev]
                if (selectedStopIndex.length === 1) {
                    stops[selectedStopIndex[0]].easing = updatedMatrix
                } else {
                    for (let i = 0; i < selectedStopIndex.length; i++) {
                        stops[selectedStopIndex[i]].easing = updatedMatrix
                    }
                }
                emit('UPDATED_GRADIENT_STOPS', rgbaToGl(stops)) // emit here?
                return stops
            })
        },
        [gradientStops, selectedStopIndex]
    )

    const handleStopSelectionChange = (e, index) => {
        if (e.shiftKey) {
            setSelectedStopIndex((prev) => {
                if (prev.includes(index)) {
                    return prev.filter((i) => i !== index)
                } else {
                    return [...prev, index]
                }
            })
        } else {
            setSelectedStopIndex([index])
        }
    }

    const handleGradientStopPositionChange = (index, value) => {
        setGradientStops((prev) => {
            let stops = [...prev]
            stops[index].position = value
            stops.sort((a, b) => a.position - b.position)
            debouncedPositionEmit(stops)
            return stops
        })
    }

    const debouncedPositionEmit = useCallback(
        debounce((stops) => emit('UPDATED_GRADIENT_STOPS', rgbaToGl(stops)), 500),
        []
    )

    return (
        <div>
            {gradientStops.length && (
                <React.Fragment>
                    <GradientStops
                        gradientStops={gradientStops}
                        selectedStopIndex={selectedStopIndex}
                        onChangeSelectedStop={handleStopSelectionChange}
                        onGradientStopPositionChange={handleGradientStopPositionChange}
                    />
                    <CurveEditor
                        matrix={
                            selectedStopIndex.length === 1
                                ? gradientStops[selectedStopIndex[0]].easing
                                : gradientStops[Math.min(...selectedStopIndex)].easing
                        }
                        onChange={handleMatrixChange}
                    />
                </React.Fragment>
            )}
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
