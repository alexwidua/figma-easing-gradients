import chroma, { Color } from 'chroma-js'

export function gl(color: any): Color {
    return chroma.gl(color.r, color.g, color.b, color.a)
}

export function rgba(color: Color) {
    const [r, g, b, a] = color.gl()
    return { r, g, b, a }
}
