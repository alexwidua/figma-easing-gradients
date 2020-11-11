<template>
  <div id="app">
    <div class="grid fr-fr mt-xxsmall mb-xxsmall">
      <!-- easing function select -->
      <Select
        :items="[
          { text: 'Curve', key: 'curve', icon: 'ease-in-out' },
          { text: 'Steps', key: 'steps', icon: 'steps' }
        ]"
        :value="editor.type"
        v-on:input="handleEaseTypeSelect"
      />
      <!-- ease timing/steps select -->
      <Select
        v-if="editor.type == 'curve'"
        :items="[
          {
            text: 'Ease In Out',
            key: 'ease-in-out',
            icon: 'ease-in-out'
          },
          { text: 'Ease In', key: 'ease-in', icon: 'ease-in' },
          { text: 'Ease Out', key: 'ease-out', icon: 'ease-out' },
          { text: 'Ease', key: 'ease', icon: 'ease' },
          { divider: true },
          { text: 'Custom', key: 'custom', icon: 'custom-ease' }
        ]"
        :value="curve.ease"
        v-on:input="handleCurveEaseMapSelect"
      />
      <Select
        v-else
        :items="[
          { text: 'Skip None', key: 'skip-none', icon: 'steps' },
          {
            text: 'Skip First Step',
            key: 'skip-start',
            icon: 'steps-skip-start'
          },
          { text: 'Skip Last Step', key: 'skip-end', icon: 'steps-skip-end' },
          { text: 'Skip Both Steps', key: 'skip-both', icon: 'steps-skip-both' }
        ]"
        :value="steps.skipSteps"
        v-on:input="handleSkipSelect"
      />
    </div>
    <Editor
      :editor="editor"
      :handles="handles"
      :steps="steps"
      :hasColorStops="hasColorStops"
      :colorStops="colorStops"
      v-on:onEmitChild="handleMouseDown"
    />
    <!-- value input + hint toggle -->
    <div class="flex justify-content-between">
      <div class="input">
        <input
          v-if="editor.type == 'curve'"
          class="input input__field mt-xxsmall mb-xxsmall"
          v-model.lazy="curveInput"
        />
        <input
          v-if="editor.type == 'steps'"
          class="input input__field mt-xxsmall mb-xxsmall"
          v-model.lazy="stepInput"
        />
      </div>
      <div class="toggle-container">
        <div class="toggle" @click="toggleLinearPreview">
          <span v-if="showLinear" class="icon icon--visible" />
          <span v-else class="icon icon--hidden" />
        </div>
        <span class="label" v-html="`Linear easing`" />
      </div>
    </div>
    <Preview
      :type="editor.type"
      :handles="handles"
      :steps="steps.numSteps"
      :skips="steps.skipSteps"
      :showLinear="showLinear"
      :hasColorStops="hasColorStops"
      :colorStops="colorStops"
      :selectionLength="selectionLength"
    />
    <!-- Toggle linear comparison + buttons -->
    <div class="flex justify-content-end mt-xxsmall">
      <div class="flex">
        <button
          class="button button--secondary"
          type="button"
          @click="cancel"
          v-html="`Cancel`"
        />
        <button
          class="button button--primary ml-xxsmall"
          type="button"
          @click="create"
          v-html="`Apply`"
          :disabled="!hasColorStops"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// Helpers
import { easeMap } from './helpers/easeMap';
import { throttle } from './helpers/utils';
import { isNumber } from './helpers/utils';
// Components
import Editor from '@/components/Editor/Editor.vue';
import Preview from '@/components/GradientPreview.vue';
// Figma-DS
import Select from '@/components/FigmaDs/Select.vue';

// Typings
interface Handles {
  [key: string]: { x: number; y: number };
}

export default Vue.extend({
  data() {
    return {
      fnThrottle: Function,
      editor: {
        parent: {} as ClientRect,
        selectedHandle: '' as string,
        type: 'curve'
      },
      curve: {
        ease: 'ease-in-out',
        easeMap: easeMap
      },
      steps: {
        numSteps: 5,
        skipSteps: 'skip-none'
      },
      handles: {
        handle1: { x: 0.42, y: 0 },
        handle2: { x: 0.58, y: 1 }
      } as Handles,
      // show linear easing preview
      showLinear: false,
      // stuff handed back from plugin
      hasColorStops: false,
      colorStops: {
        stop1: { r: 0, g: 0, b: 0, a: 0 },
        stop2: { r: 0, g: 0, b: 0, a: 0 },
        numStops: 2
      },
      selectionLength: 0
    };
  },
  components: {
    Editor,
    Select,
    Preview
  },
  methods: {
    /**
     * Misc functions
     */
    toggleLinearPreview() {
      this.showLinear = !this.showLinear;
    },
    /**
     * Document event handlers
     */
    // de-select curve handles
    handleMouseUp(): void {
      this.editor.selectedHandle = '';
    },
    // deal with curve handle select
    handleMouseDown(event: MouseEvent, handle: string) {
      const target = event.target as HTMLElement;
      if (target.parentElement !== null) {
        this.editor.parent = target.parentElement.getBoundingClientRect();
        this.editor.selectedHandle = handle;
      } else {
        return;
      }
    },
    // deal with curve handle drag
    // borrowed from https://github.com/larsenwork/sketch-easing-gradient/
    handleMouseMove(event: MouseEvent) {
      if (this.editor.selectedHandle) {
        event.preventDefault();

        const cursorX = event.clientX;
        const cursorY = event.clientY;
        const boundingLeft = this.editor.parent.left;
        const boundingRight = this.editor.parent.right;
        const boundingTop = this.editor.parent.top;
        const boundingBottom = this.editor.parent.bottom;

        const posX =
          cursorX <= boundingLeft
            ? 0
            : cursorX >= boundingRight
            ? 1
            : (cursorX - boundingLeft) / (boundingRight - boundingLeft);
        const posY =
          cursorY <= boundingTop
            ? 1
            : cursorY >= boundingBottom
            ? 0
            : 1 - (cursorY - boundingTop) / (boundingBottom - boundingTop);

        this.curve.ease = 'custom';
        this.handles[this.editor.selectedHandle].x = posX;
        this.handles[this.editor.selectedHandle].y = posY;
      }
    },
    /**
     * $emit handlers
     */
    // cubic-bézier or step easing
    handleEaseTypeSelect(val: string): void {
      this.editor.type = val;
    },
    // bézier-curve presets, from ./helpers/easeMap.ts
    handleCurveEaseMapSelect(val: string): void {
      this.curve.ease = val;
      if (val !== 'custom') {
        this.handles.handle1.x = easeMap[val].x1;
        this.handles.handle1.y = easeMap[val].y1;
        this.handles.handle2.x = easeMap[val].x2;
        this.handles.handle2.y = easeMap[val].y2;
      }
    },
    // skip steps @ step-easing
    handleSkipSelect(val: string): void {
      this.steps.skipSteps = val;
    },
    /**
     * Figma plugin
     */
    // handle message from plugin -> ui
    async handleMsg(e: MessageEvent) {
      if (e.data.pluginMessage) {
        const msg = e.data.pluginMessage;
        if (msg.hasGradient) {
          const fills = msg.fill.gradientStops;
          const c1 = fills[0];
          const c2 = fills[fills.length - 1];
          this.colorStops = {
            stop1: c1.color,
            stop2: c2.color,
            numStops: fills.length
          };
          this.hasColorStops = true;
          this.selectionLength = msg.selectionLength;
        } else {
          this.hasColorStops = false;
          this.selectionLength = msg.selectionLength;
        }
      }
    },
    // apply easing, post message ui -> plugin
    create() {
      const easeType = this.editor.type;
      const easeCoords = {
        x1: this.handles.handle1.x,
        y1: this.handles.handle1.y,
        x2: this.handles.handle2.x,
        y2: this.handles.handle2.y
      };
      const steps = this.steps.numSteps;
      const skip = this.steps.skipSteps;

      parent.postMessage(
        {
          pluginMessage: {
            type: 'ease-gradient',
            easeType,
            easeCoords,
            steps,
            skip
          }
        },
        '*'
      );
    },
    // for debugging reason
    debug() {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'debug'
          }
        },
        '*'
      );
    },
    // post cancel message ui -> plugin
    cancel() {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'cancel'
          }
        },
        '*'
      );
    }
  },
  computed: {
    /**
     * V-models
     */
    // handle curve value input
    curveInput: {
      // handles what is being displayed back in the input field
      get(): string {
        // format the curve ease values for better legibility
        return (
          this.handles.handle1.x.toFixed(2) +
          ', ' +
          this.handles.handle1.y.toFixed(2) +
          ', ' +
          this.handles.handle2.x.toFixed(2) +
          ', ' +
          this.handles.handle2.y.toFixed(2)
        );
      },
      // handles what gets entered in the input field
      set(value: string): void {
        const split = value.split(',');
        // make sure the entered value is a number
        if (!split.every(isNumber) || split.length !== 4) {
          // TODO: Error notify message here
          this.$forceUpdate();
          return;
        }
        // make sure number is between 0,0 .. 1,0
        if (!split.every(el => parseFloat(el) <= 1 && parseFloat(el) >= 0)) {
          // TODO: Error notify message here
          this.$forceUpdate();
          return;
        }
        this.handles.handle1.x = parseFloat(split[0]);
        this.handles.handle1.y = parseFloat(split[1]);
        this.handles.handle2.x = parseFloat(split[2]);
        this.handles.handle2.y = parseFloat(split[3]);
      }
    },
    // handle step value input
    stepInput: {
      get(): number {
        return this.steps.numSteps;
      },
      set(value: number): void {
        // make sure the entered value is a number
        if (!isNumber(value)) {
          // TODO: Error notify message here
          this.$forceUpdate();
          return;
        }
        if (value <= 1 || value > 96) {
          // TODO: Error notify message here
          this.$forceUpdate();
          return;
        }
        this.steps.numSteps = value;
      }
    }
  },
  mounted() {
    this.fnThrottle = throttle(15, this.handleMouseMove);
    // eslint-disable-next-line
    document.addEventListener('mousemove', (this as any).fnThrottle);
    document.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('message', this.handleMsg);
  },
  beforeDestroy() {
    // eslint-disable-next-line
    document.removeEventListener('mousemove', (this as any).fnThrottle);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
});
</script>

<style lang="scss" scoped>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: var(--editorWidth);
  margin: 0 auto;
}

/**
 *  misc
 */

.--inactive {
  opacity: 0.3;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

// linear easing preview toggle
.toggle {
  border-radius: var(--border-radius-small);

  &-container {
    height: 46px;
    display: flex;
    align-items: center;

    & .label {
      padding-left: 2px;
      padding-right: 10px;
    }
  }
  & .icon {
    background-position: center !important;
  }

  &:hover {
    background: var(--grey);
  }
}
</style>
