<template>
  <div
    v-if="curveType == 'curve'"
    @mousedown="event => $emit('onHandleDown', event, this.handle)"
    class="handle"
    :class="handleState"
    :style="
      `left: ${handleCoords[this.handle].x * 100}%; top: ${100 -
        handleCoords[this.handle].y * 100}%`
    "
  />
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

interface Handles {
  [key: string]: { x: number; y: number };
}

export default Vue.extend({
  /**
   * Contains the curve handles to drag and alter the Bézier-curve.
   * Must be child of Editor.vue component.
   */
  name: 'EditorHandle',
  props: {
    handle: String as PropType<string>,
    selectedHandle: String as PropType<string>,
    handleCoords: Object as PropType<Handles>,
    curveType: String as PropType<string>
  },
  computed: {
    /**
     * Compute handle styles
     */
    handleState(): Record<string, boolean> {
      return {
        // handle active/clicked
        'handle--active': this.selectedHandle == this.handle,
        // scale handle when handle is 0,0 || 1,1
        'handle--zero':
          (this.handleCoords[this.handle].x == 0 &&
            this.handleCoords[this.handle].y == 0 &&
            this.handle == 'handle1') ||
          (this.handleCoords[this.handle].x == 1 &&
            this.handleCoords[this.handle].y == 1 &&
            this.handle == 'handle2'),
        // display no border when handle is 0,0 || 1,1
        'handle--border-override':
          (this.handleCoords[this.handle].x == 0 &&
            this.handleCoords[this.handle].y == 0 &&
            this.handle == 'handle1' &&
            this.selectedHandle == this.handle) ||
          (this.handleCoords[this.handle].x == 1 &&
            this.handleCoords[this.handle].y == 1 &&
            this.handle == 'handle2' &&
            this.selectedHandle == this.handle)
      };
    }
  }
});
</script>

<style lang="scss">
.handle {
  width: 16px;
  height: 16px;
  position: absolute;
  background: var(--black);
  border: 2px solid var(--white);
  border-radius: 100%;
  cursor: grab;
  transform: translate(-50%, -50%);

  &--zero {
    background: var(--white);
    border: 1px solid var(--black);
  }

  &--active {
    background: var(--blue);
    cursor: grabbing;
  }

  &--border-override {
    border: none !important;
  }
}
</style>
