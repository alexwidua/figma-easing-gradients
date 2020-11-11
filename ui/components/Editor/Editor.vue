<template>
  <div class="editor__wrapper">
    <div class="editor__container" draggable="false">
      <!-- to avoid emitting events more than one parent up,
      the handle components live outside the editor component-->
      <Handle
        handle="handle1"
        :selectedHandle="editor.selectedHandle"
        :handleCoords="handles"
        :curveType="editor.type"
        v-on:onEmitGrandchild="handleEmitGrandchild"
      />
      <Handle
        handle="handle2"
        :selectedHandle="editor.selectedHandle"
        :handleCoords="handles"
        :curveType="editor.type"
        v-on:onEmitGrandchild="handleEmitGrandchild"
      />
      <svg class="viewbox" viewBox="0 0 1 1" fill="none">
        <g>
          <!-- diagonal line -->
          <line
            class="path path--backdrop"
            vector-effect="non-scaling-stroke"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          />
        </g>
        <g v-if="this.editor.type == 'curve'">
          <!-- handle1 connector -->
          <line
            class="path"
            vector-effect="non-scaling-stroke"
            x1="0"
            y1="1"
            :x2="this.handles.handle1.x"
            :y2="1 - this.handles.handle1.y"
          />
          <!-- handle2 connector -->
          <line
            class="path"
            vector-effect="non-scaling-stroke"
            x1="1"
            y1="0"
            :x2="this.handles.handle2.x"
            :y2="1 - this.handles.handle2.y"
          />
          <!-- bézier curve -->
          <path
            class="path"
            vector-effect="non-scaling-stroke"
            :d="
              `M0,1 C${[this.handles.handle1.x, 1 - this.handles.handle1.y]}
			${[this.handles.handle2.x, 1 - this.handles.handle2.y]} 1,0`
            "
          />
        </g>
        <g v-if="this.editor.type == 'steps'">
          <polyline
            class="path"
            vector-effect="non-scaling-stroke"
            :points="getSteps"
          />
        </g>
        <!-- 0,0 and 1,1 points -->
        <g>
          <rect
            :fill="
              this.hasColorStops ? this.glColor(this.colorStops.stop1) : `#000`
            "
            class="rect"
            vector-effect="non-scaling-stroke"
            x="-0.03"
            y="0.97"
            width="0.06"
            height="0.06"
            rx="0.015"
            ry="0.015"
          />
          <rect
            :fill="
              this.hasColorStops ? this.glColor(this.colorStops.stop2) : `#fff`
            "
            class="rect"
            vector-effect="non-scaling-stroke"
            x="0.97"
            y="-0.03"
            width="0.06"
            height="0.06"
            rx="0.015"
            ry="0.015"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
// Packages
import easingCoordinates from 'easing-coordinates';
import chroma from 'chroma-js';
// Components
import Handle from '@/components/Editor/CurveHandle.vue';

// Typings
type Editor = {
  parent: Record<string, HTMLElement>;
  selectedHandle: string;
  type: string;
};

type Handles = {
  handle1: { x: number; y: number };
  handle2: { x: number; y: number };
};

type Steps = {
  numSteps: number;
  skipSteps: number;
};

type ColorStops = {
  stop1: { r: number; g: number; b: number; a: number };
  stop2: { r: number; g: number; b: number; a: number };
};

export default Vue.extend({
  name: 'Editor',
  /**
   * Contains all svg elements and the curve handle child components.
   */
  props: {
    editor: Object as PropType<Editor>,
    handles: Object as PropType<Handles>,
    steps: Object as PropType<Steps>,
    hasColorStops: Boolean as PropType<boolean>,
    colorStops: Object as PropType<ColorStops>
  },
  components: {
    Handle
  },
  methods: {
    // handle emits passed up from handle child component
    handleEmitGrandchild(event: MouseEvent, handle: string): void {
      this.$emit('onEmitChild', event, handle);
    },
    // normalize rgba value from 0..255 to 0..1 using chroma-js
    glColor(stop: Record<string, number>): string {
      return chroma.gl(stop.r, stop.g, stop.b, stop.a).hex();
    }
  },
  computed: {
    // get steps for svg polyline
    getSteps(): string {
      const coords = easingCoordinates(
        `steps(${this.steps.numSteps}, ${this.steps.skipSteps})`
      );
      return coords.map(pos => `${pos.x},${1 - pos.y}`).join(' ');
    }
  }
});
</script>

<style lang="scss" scoped>
.editor {
  &__wrapper {
    width: var(--editorWidth);
    height: var(--editorHeight);
    padding: calc(var(--editorWidth) / 6);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px var(--black2) solid;
    border-radius: var(--border-radius-med);
  }

  &__container {
    width: 100%;
    height: 100%;
    position: relative;
    border: 2px var(--grey) solid;
    border-radius: var(--border-radius-small);
    user-select: none;
  }
}

/** svg */

.viewbox {
  overflow: visible;
}

.path {
  fill: none;
  stroke-width: 2px;
  stroke-linecap: round;
  stroke: var(--black);

  &--backdrop {
    stroke: var(--grey);
  }
}

.rect {
  stroke: var(--silver);
  stroke-width: 1px;
}
</style>
