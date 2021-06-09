<template>
  <div class="editor__wrapper">
    <div
      class="editor__container"
      :class="{ scrubbing: editor.type == 'steps' }"
      draggable="false"
      @mousedown="handleScrubbingDown"
    >
      <!-- to avoid emitting events more than one parent up,
      the handle components live outside the editor component-->
      <Handle
        handle="handle1"
        :selectedHandle="editor.selectedHandle"
        :handleCoords="handles"
        :curveType="editor.type"
        @onHandleDown="(event, handle) => $emit('onHandleDown', event, handle)"
      />
      <Handle
        handle="handle2"
        :selectedHandle="editor.selectedHandle"
        :handleCoords="handles"
        :curveType="editor.type"
        @onHandleDown="(event, handle) => $emit('onHandleDown', event, handle)"
      />
      <svg class="viewbox" viewBox="0 0 1 1" fill="none">
        <g>
          <!-- Diagonal line -->
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
          <!-- Handle1 connector -->
          <line
            class="path"
            vector-effect="non-scaling-stroke"
            x1="0"
            y1="1"
            :x2="this.handles.handle1.x"
            :y2="1 - this.handles.handle1.y"
          />
          <!-- Handle2 connector -->
          <line
            class="path"
            vector-effect="non-scaling-stroke"
            x1="1"
            y1="0"
            :x2="this.handles.handle2.x"
            :y2="1 - this.handles.handle2.y"
          />
          <!-- Bézier curve -->
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
            x="-0.015"
            y="0.985"
            width="0.03"
            height="0.03"
            rx="0.015"
            ry="0.015"
          />
          <rect
            :fill="
              this.hasColorStops ? this.glColor(this.colorStops.stop2) : `#fff`
            "
            class="rect"
            vector-effect="non-scaling-stroke"
            x="0.985"
            y="-0.015"
            width="0.03"
            height="0.03"
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
import easingCoordinates from 'easing-coordinates';
import chroma from 'chroma-js';
import Handle from '@/components/Editor/EditorHandle.vue';

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
  stop1: { color: { r: number; g: number; b: number; a: number }; position: number };
  stop2: { color: { r: number; g: number; b: number; a: number }; position: number };
};

export default Vue.extend({
  name: 'Editor',
  data() {
    return {
      initialValue: 0,
      // Step scrubbing utils
      isMouseDown: false,
      initialMousePos: { x: 0, y: 0 },
      min: 2,
      max: 100
    };
  },
  props: {
    editor: Object as PropType<Editor>,
    handles: Object as PropType<Handles>,
    steps: Object as PropType<Steps>,
    hasColorStops: Boolean as PropType<boolean>,
    colorStops: Object as PropType<ColorStops>,
    value: Number as PropType<number>
  },
  components: {
    Handle
  },
  methods: {
    /**
     * Normalize rgba value from 0..255 to 0..1
     */
    glColor(stop: Record<string, number>): string {
      return chroma.gl(stop.r, stop.g, stop.b, stop.a).hex();
    },
    /**
     * Handle mouse down event for step scrubbing
     */
    handleScrubbingDown(e: MouseEvent) {
      this.isMouseDown = true;

      this.initialMousePos = {
        x: e.clientX,
        y: e.clientY
      };
      this.initialValue = +this.steps.numSteps;
      document.addEventListener('mousemove', this.handleScrubbingMove);
      document.addEventListener('mouseup', this.handleScrubbingUp);
    },
    handleScrubbingMove(e: MouseEvent) {
      if (this.isMouseDown && this.editor.type == 'steps') {
        const newVal = Math.floor(
          this.initialValue + (e.clientX - this.initialMousePos.x) * 0.03
        );
        this.$emit('onStepChange', this.clamp(newVal, this.min, this.max));
      }
    },
    handleScrubbingUp() {
      this.isMouseDown = false;
      document.removeEventListener('mousemove', this.handleScrubbingMove);
      document.removeEventListener('mouseup', this.handleScrubbingUp);
    },
    /**
     * Utility to clamp value to range
     */
    clamp(value: number, min: number, max: number): number {
      if (min != undefined && max != undefined) {
        return Math.floor(Math.min(Math.max(value, min), max));
      } else return value;
    }
  },
  computed: {
    /**
     * Compute steps for SVG polyline
     */
    getSteps(): string {
      const coords = easingCoordinates(
        `steps(${this.steps.numSteps}, ${this.steps.skipSteps})`
      );
      return coords.map(pos => `${pos.x},${1 - pos.y}`).join(' ');
    }
  },
  mounted() {
    this.initialValue = this.steps.numSteps;
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
    border: 1px var(--black1) solid;
    border-radius: var(--border-radius-med);
  }

  &__container {
    width: 100%;
    height: 100%;
    position: relative;
    border: 2px var(--bg-grey) solid;
    border-radius: var(--border-radius-small);
    user-select: none;

    &.scrubbing {
      cursor: ew-resize !important;
    }
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
    stroke: var(--bg-grey);
  }
}

.rect {
  stroke: var(--bg-silver);
  stroke-width: 1px;
}
</style>
