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

/**
 * Returns gradient color stops
 * @param {ReadonlyArray<SceneNode>} selection Current page selection
 */
export function findGradient(selection: ReadonlyArray<SceneNode>) {
  if (selection.length) {
    const node = selection[0] as GeometryMixin;
    const fills = node.fills as Paint[];

    if (!isShape(node)) {
      return false;
    }

    const gradientIndex = fills.findIndex(el => isGradient(el));
    return gradientIndex < 0 ? false : fills[gradientIndex];
  } else {
    return false;
  }
}

/**
 * Returns gradient transform
 * @param {ReadonlyArray<SceneNode>} selection Current page selection
 */
export function findTransform(selection: ReadonlyArray<SceneNode>) {
  if (selection.length) {
    const node = selection[0] as GeometryMixin;
    const fills = node.fills as Paint[];

    if (!isShape(node)) {
      return false;
    }

    const gradientIndex = fills.findIndex(el => isGradient(el));

    if (gradientIndex < 0) {
      return false;
    }

    const firstGradient = fills[gradientIndex] as GradientPaint;
    return firstGradient.gradientTransform;
  } else {
    return false;
  }
}

/**
 * Returns gradient rotation in degrees
 * @param {ReadonlyArray<SceneNode>} selection Current page selection
 */
export function getRotation(selection: ReadonlyArray<SceneNode>) {
  if (!findTransform(selection)) {
    return 0;
  }
  const gradientTransform = findTransform(selection) as Transform;

  // type Figma.Transform = [
  // [a, c, tx] // [0][0]  [0][1]  [0][2]
  // [b, d, ty] // [1][0]  [1][1]  [1][2]
  // See: https://www.figma.com/plugin-docs/api/Transform/

  const a = gradientTransform[0][0];
  const c = gradientTransform[0][1];
  return Math.round(Math.atan2(c, a) * (180 / Math.PI));
}
