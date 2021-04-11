import { clone, isGradient, findGradient, getRotation } from './helpers/utils';
import { easeGradient } from './helpers/gradient';

figma.showUI(__html__, {
  width: 266,
  height: 641
});

/**
 * Functions
 */

/**
 * Post MessageEvent to the UI containing fill params
 * @param {boolean} hasGradient If shape contains gradient; used for resetting ui onSelectionChange
 * @param {Paint[]} fill
 * @param {number} selectionLength Length of currentPage.selection
 */
function postFills(
  hasGradient: boolean,
  fill = {},
  selectionLength = 0,
  degree = 0
) {
  figma.ui.postMessage({
    type: 'colorStops',
    hasGradient,
    fill,
    selectionLength,
    degree
  });
}

// check page selection on plugin startup
if (figma.currentPage.selection.length) {
  !findGradient(figma.currentPage.selection)
    ? postFills(false)
    : postFills(
        true,
        findGradient(figma.currentPage.selection),
        figma.currentPage.selection.length,
        getRotation(figma.currentPage.selection)
      );
}

// check page selection on selectionChange callback
figma.on('selectionchange', () => {
  !findGradient(figma.currentPage.selection)
    ? postFills(false)
    : postFills(
        true,
        findGradient(figma.currentPage.selection),
        figma.currentPage.selection.length,
        getRotation(figma.currentPage.selection)
      );
});

// listen to messages from ui
figma.ui.onmessage = msg => {
  const selection = figma.currentPage.selection;

  if (msg.type === 'ease-gradient') {
    // iterate through every selected node
    selection.forEach(item => {
      const node = item as GeometryMixin;
      const fills = node.fills as Paint[];

      // check if selected geometry contains atleast one gradient fill
      if (fills.findIndex(isGradient) < 0) {
        figma.notify('Atleast one shape does not contain a gradient fill.');
        return;
      }

      // iterate through fill layers
      fills.forEach((fillProperty, index) => {
        if (!isGradient(fillProperty)) return;

        // clone node to apply properties
        // See: https://www.figma.com/plugin-docs/editing-properties/
        const tempNode = clone(node.fills);
        tempNode[index].gradientStops = easeGradient(
          fillProperty,
          msg.easeType,
          msg.easeCoords,
          msg.steps,
          msg.skip
        );
        node.fills = tempNode;
      });
    });
  }
};
