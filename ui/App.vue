<template>
  <div
    id="app"
    ref="app"
    @click="collectEvent"
    :style="
      editor.selectedHandle.length > 0 ? 'cursor: grabbing' : 'cursor: default'
    "
  >
    <div class="flex mt-xxsmall mb-xxsmall">
      <!-- easing function select -->
      <FigSelect
        style="width:50%;"
        :items="[
          { label: 'Curve', key: 'curve', icon: 'ease-in-out' },
          { label: 'Steps', key: 'steps', icon: 'steps' }
        ]"
        :value="editor.type"
        v-on:input="handleEaseTypeSelect"
      />
      <!-- ease timing/steps select -->
      <FigSelect
        v-if="editor.type == 'curve'"
        style="width:50%;"
        :items="[
          {
            label: 'Ease In Out',
            key: 'ease-in-out',
            icon: 'ease-in-out'
          },
          { label: 'Ease In', key: 'ease-in', icon: 'ease-in' },
          { label: 'Ease Out', key: 'ease-out', icon: 'ease-out' },
          { label: 'Ease', key: 'ease', icon: 'ease' },
          { divider: true },
          { label: 'Custom', key: 'custom', icon: 'custom-ease' }
        ]"
        :value="curve.ease"
        v-on:input="handleCurveEaseMapSelect"
      />
      <FigSelect
        v-else
        style="width:50%;"
        :items="[
          { label: 'Skip None', key: 'skip-none', icon: 'steps' },
          {
            label: 'Skip First Step',
            key: 'skip-start',
            icon: 'steps-skip-start'
          },
          { label: 'Skip Last Step', key: 'skip-end', icon: 'steps-skip-end' },
          {
            label: 'Skip Both Steps',
            key: 'skip-both',
            icon: 'steps-skip-both'
          }
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
    <div class="flex align-items-center justify-content-between">
      <div>
        <FigInput
          v-if="editor.type == 'curve'"
          :key="componentKey.curveInput"
          :value="curveGetter"
          @change="curveSetter"
        />
        <FigInput
          v-if="editor.type == 'steps'"
          :key="componentKey.stepInput"
          :value="stepGetter"
          @change="stepSetter"
        />
      </div>
      <div class="flex align-items-center mt-xxsmall mb-xxsmall">
        <FigIconButton
          :icon="showLinear ? 'visible' : 'hidden'"
          @click="toggleLinearPreview"
        />
        <FigText
          size="xsmall"
          class="ml-xxxsmall mr-xxsmall"
          style="cursor:default; user-select: none;"
          @click.native="toggleLinearPreview"
        >
          Linear easing
        </FigText>
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
      <div class="flex" style="width:100%">
        <FigButton
          style="width:30%; margin-right: 3%;"
          @click="cancel"
          secondary
        >
          Cancel
        </FigButton>
        <FigButton
          style="width:67%"
          @click="create"
          primary
          :disabled="!hasColorStops"
        >
          Apply
        </FigButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
//
//
// This is a temporary version which collects the plugins click events to get
// some insights into the UX of Figma plugins.
//
//
import fire from './store/fire';

import Vue from 'vue';
// Helpers
import { easeMap } from './helpers/easeMap';
import { throttle, isNumber } from './helpers/utils';
// Components
import {
  FigInput,
  FigSelect,
  FigButton,
  FigIconButton,
  FigText
} from 'figma-plugin-ds-vue';
import Editor from '@/components/Editor/Editor.vue';
import Preview from '@/components/GradientPreview.vue';

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
      selectionLength: 0,
      componentKey: {
        // since $forceUpdate doesn't update children, we force a re-render
        // by changing the key (e.g. if a wrong value is entered)
        curveInput: 0,
        stepInput: 0
      },
      // For analytics
      heatMap: [],
      sessionID: '0'
    };
  },
  components: {
    FigInput,
    FigSelect,
    FigButton,
    FigIconButton,
    FigText,
    Editor,
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

      // For analytics
      fire
        .database()
        .ref('heatmap-v2')
        .push({
          sessionID: this.sessionID,
          clicks: this.heatMap,
          easing: easeCoords,
          action: 'apply'
        });

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
    // post cancel message ui -> plugin
    cancel() {
      // For analytics
      const easeCoords = {
        x1: this.handles.handle1.x,
        y1: this.handles.handle1.y,
        x2: this.handles.handle2.x,
        y2: this.handles.handle2.y
      };

      fire
        .database()
        .ref('heatmap-v2')
        .push({
          sessionID: this.sessionID,
          clicks: this.heatMap,
          easing: easeCoords,
          action: 'cancel'
        });

      parent.postMessage(
        {
          pluginMessage: {
            type: 'cancel'
          }
        },
        '*'
      );
    },
    /**
     * Input setters
     * Since v-model.lazy isn't supported on child components, we have to
     * seperate getters and setters...
     */
    curveSetter(value: string): void {
      const split = value.split(',');
      if (!split.every(isNumber) || split.length !== 4) {
        // force component re-render by changing key
        this.componentKey.curveInput += 1;
        return;
      }
      // make sure number is between 0,0 .. 1,0
      if (!split.every(el => parseFloat(el) <= 1 && parseFloat(el) >= 0)) {
        this.componentKey.curveInput += 1;
        return;
      }
      this.curve.ease = 'custom';
      this.handles.handle1.x = parseFloat(split[0]);
      this.handles.handle1.y = parseFloat(split[1]);
      this.handles.handle2.x = parseFloat(split[2]);
      this.handles.handle2.y = parseFloat(split[3]);
    },
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    stepSetter(value: any): void {
      if (!isNumber(value)) {
        this.componentKey.stepInput += 1;
        return;
      }
      if (value.split(' ').length > 1) {
        this.componentKey.stepInput += 1;
        return;
      }
      if (value <= 1 || value > 96) {
        this.componentKey.stepInput += 1;
        return;
      }
      this.steps.numSteps = value;
    },
    //
    // For analytics
    //
    collectEvent(event: MouseEvent): void {
      const container = this.$refs.app as Element;
      const clientRect = container.getBoundingClientRect();

      this.heatMap.push({
        // @ts-expect-error
        x: event.clientX - clientRect.x,
        // @ts-expect-error
        y: event.clientY - clientRect.y
      });
    }
  },
  computed: {
    /**
     * Input getters
     * Since v-model.lazy isn't supported on child components, we have to
     * seperate getters and setters...
     */
    curveGetter: {
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
      }
    },
    stepGetter: {
      get(): number {
        return this.steps.numSteps;
      }
    }
  },
  mounted() {
    this.fnThrottle = throttle(15, this.handleMouseMove);
    // eslint-disable-next-line
    document.addEventListener('mousemove', (this as any).fnThrottle);
    document.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('message', this.handleMsg);

    // For analytics to distinguish sessions since I choose not to timestamp them
    this.sessionID = Math.random()
      .toString(36)
      .substring(7);
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
</style>
