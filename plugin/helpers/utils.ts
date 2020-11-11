/* eslint-disable */
/**
 * Returns clone of selected readonly node to apply changes
 * Function grabbed from: https://www.figma.com/plugin-docs/editing-properties/
 * @param {any} node Node to clone
 */
export function clone(node: any): any {
  const type = typeof node;
  if (node === null) {
    return null;
  } else if (
    type === 'undefined' ||
    type === 'number' ||
    type === 'string' ||
    type === 'boolean'
  ) {
    return node;
  } else if (type === 'object') {
    if (node instanceof Array) {
      return node.map(x => clone(x));
    } else if (node instanceof Uint8Array) {
      return new Uint8Array(node);
    } else {
      const o = {};
      for (const key in node) {
        (o as any)[key] = clone(node[key]);
      }
      return o;
    }
  }
  throw 'unknown';
}

/**
 * Checks if node is a geometry with fill
 * Returns false for e.g. slice nodes, component frames etc.
 * @param {any} node Node to check
 */
export function isShape(node: any): node is GeometryMixin {
  return 'fills' in node;
}

/**
 * Checks if fill contains is a gradient (contains gradient stops)
 * @param {Paint} fill Fill layer
 */
export function isGradient(fill: Paint): fill is GradientPaint {
  return 'gradientStops' in fill;
}
