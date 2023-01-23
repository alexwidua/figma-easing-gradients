import React, { useState, useRef, useEffect, useCallback } from 'react'
import easingCoordinates from 'easing-coordinates'
import { cubicCoordinates } from '../../utils/easing'
import chroma from 'chroma-js'
import { useDrag } from '@use-gesture/react'
import { useSpring, useSprings, a } from '@react-spring/web'

const mappedPosition = (val, min, max) => val * (max - min) + min
const demap = (val, min, max) => (val - min) / (max - min)

export default function GradientStops({
    gradientStops,
    selectedStopIndex,
    onChangeSelectedStop,
    onGradientStopPositionChange
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    useEffect(() => {
        if (!containerRef.current) return
        const { width } = containerRef.current.getBoundingClientRect()
        setContainerWidth(width)
    }, [containerRef])

    const [stops, setStops] = useState([])

    useEffect(() => {
        const stops = []
        if (!gradientStops.length) return
        gradientStops.forEach((el) => {
            const { color: gl, position } = el
            // const color = glToRgb(el.color)
            const color = chroma.gl(gl.r, gl.g, gl.b, gl.a)
            const stop = { color, position }
            stops.push(stop)
        })
        setStops(stops)
    }, [gradientStops])

    const getBg = () => {
        if (!gradientStops.length) {
            return `linear-gradient(90deg, #000 0%, #fff 100%)`
        }

        let str = []
        for (let i = 0; i < gradientStops.length - 1; i++) {
            const start = gradientStops[i]
            const next = gradientStops[i + 1]

            const matrix =
                selectedStopIndex.length === 1
                    ? gradientStops[i].easing
                    : gradientStops[Math.min(...selectedStopIndex)].easing

            const cubic = cubicCoordinates(
                matrix[0][0],
                matrix[0][1],
                matrix[1][0],
                matrix[1][1],
                16
            )

            str = str.concat(
                cubic.map(
                    (t) =>
                        `${chroma.mix(start.color, next.color, t.y)} ${
                            (start.position + t.x * (next.position - start.position)) *
                            100
                        }%`
                )
            )
        }

        return `linear-gradient(90deg,${str.join(',')})`
    }

    const [springs, api] = useSprings(
        gradientStops.length,
        (i) => ({
            x: mappedPosition(gradientStops[i].position, 0, 240) - 8
        }),
        [gradientStops]
    ) // Create springs, each corresponds to an item, controlling its transform, scale, etc.

    const bind = useDrag(
        ({ args: [index], active, offset: [ox, _] }) => {
            api.start((i) => {
                if (i !== index) return

                onGradientStopPositionChange(index, demap(ox + 8, 0, containerWidth))
                return { x: ox, immediate: true }
            })
        },
        {
            from: ({ args: [index] }) => [springs[index].x.get(), 0],
            bounds: {
                left: 0 - 8,
                right: 240 - 8
            }
        }
    )

    return (
        <div className="gradient-container" ref={containerRef}>
            <div className="color-swatch-container">
                {springs.map(({ x }, i) => (
                    <a.div
                        key={gradientStops[i].id}
                        className="color-swatch"
                        style={{
                            backgroundColor: gradientStops[i].color,
                            // left: `${position * 100}%`
                            x
                        }}
                        {...bind(i)}
                    ></a.div>
                ))}
            </div>
            <div
                className="gradient-stops"
                style={{
                    background: getBg()
                }}
            >
                {stops.map((_, i) => {
                    if (i == stops.length - 1) return null
                    const position = (stops[i].position + stops[i + 1].position) / 2
                    return (
                        <div
                            key={i}
                            className={`stop-dot ${
                                selectedStopIndex.includes(i) ? 'selected' : ''
                            }`}
                            style={{
                                left: `${position * 100}%`,
                                transform: 'translate(-8px, -50%)'
                            }}
                            onClick={(e) => onChangeSelectedStop(e, i)}
                        ></div>
                    )
                })}
            </div>
        </div>
    )
}
