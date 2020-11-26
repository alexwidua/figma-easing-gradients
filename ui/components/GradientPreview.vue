<template>
  <div class="gradient gradient__wrapper">
    <!-- indicator that multiple gradients are selected -->
    <div
      class="gradient__container--multiple"
      :style="
        selectionLength > 1
          ? 'left: calc(50% + 12px); bottom: calc(50% - 12px)'
          : 'left: 50%; bottom:50%'
      "
    />
    <div
      class="gradient__container--multiple"
      :style="
        selectionLength > 1
          ? 'left: calc(50% + 6px); bottom: calc(50% - 6px)'
          : 'left: 50%; bottom:50%'
      "
    />
    <!-- transparency backdrop -->
    <div class="gradient__container--transparency" />
    <!-- gradient preview -->
    <div
      class="gradient__container"
      :class="{ 'gradient__container--trim': showLinear }"
      :style="easedGradient"
    >
      <!-- linear-easing comparison -->
      <div
        v-if="showLinear"
        class="gradient__container--linear"
        :style="linearGradient"
      />
    </div>
    <Hint :visible="!hasColorStops">No gradient shape selected.</Hint>
    <Hint
      v-if="colorStops.numStops > 2 && hasColorStops"
      :visible="colorStops.numStops > 2"
      isWarning
      minimize
      >Only the first and last color stop is considered.</Hint
    >
    <Hint
      v-if="selectionLength > 1"
      :visible="selectionLength > 1"
      isWarning
      minimize
      >Easing will be applied to multiple shapes.</Hint
    >
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
// Packages
import chroma from 'chroma-js';
import easingCoordinates from 'easing-coordinates';
// Components
import Hint from '@/components/GradientHint.vue';

// Typings
type ColorStops = {
  stop1: { r: number; g: number; b: number; a: number };
  stop2: { r: number; g: number; b: number; a: number };
  numStops: number;
};

export default Vue.extend({
  name: 'GradientPreview',
  /**
   * Contains the preview of the current selected gradient with applied easing.
   * Must be a child of App.vue component.
   */
  data() {
    return {
      curveSteps: 15
    };
  },
  components: {
    Hint
  },
  props: {
    handles: Object as PropType<Record<string, Record<string, number>>>,
    steps: [Number, String],
    skips: {
      type: String as PropType<string>,
      default: 'skip-none'
    },
    type: String as PropType<string>,
    showLinear: Boolean as PropType<boolean>,
    hasColorStops: Boolean as PropType<boolean>,
    colorStops: Object as PropType<ColorStops>,
    selectionLength: Number as PropType<number>
  },
  computed: {
    // applies cubic-bèzier-eased gradient inline-style
    easedGradient(): string {
      const c = this.colorStops;
      // check if gradient is selected and handed over from plugin
      const colorStop1 = this.hasColorStops
        ? chroma.gl(c.stop1.r, c.stop1.g, c.stop1.b, c.stop1.a)
        : '#000';
      const colorStop2 = this.hasColorStops
        ? chroma.gl(c.stop2.r, c.stop2.g, c.stop2.b, c.stop2.a)
        : '#fff';
      // ease coordinates using cubic-bézier easing
      const ease =
        this.type == 'curve'
          ? easingCoordinates(
              `cubic-bezier(${this.handles.handle1.x},${this.handles.handle1.y},${this.handles.handle2.x},${this.handles.handle2.y})`,
              this.curveSteps
            ) // eslint-disable-line no-mixed-spaces-and-tabs
          : easingCoordinates(`steps(${this.steps}, ${this.skips})`); // eslint-disable-line no-mixed-spaces-and-tabs

      // map colors and position
      const easeGradient = ease.map(position => {
        return {
          color: chroma.mix(colorStop1, colorStop2, position.y, 'rgb').rgba(),
          position: position.x
        };
      });

      // compute inline style for gradient container
      const inlineStyle = easeGradient.map(stop => {
        return `rgba(${stop.color[0]},${stop.color[1]},${stop.color[2]},${
          stop.color[3]
        }) ${stop.position * 100}%`;
      });

      return `background: linear-gradient(90deg, ${inlineStyle.toString()});`;
    },
    // linear gradient comparison
    linearGradient(): string {
      const c = this.colorStops;
      const colorStop1 = this.hasColorStops
        ? chroma.gl(c.stop1.r, c.stop1.g, c.stop1.b, c.stop1.a)
        : '#000';
      const colorStop2 = this.hasColorStops
        ? chroma.gl(c.stop2.r, c.stop2.g, c.stop2.b, c.stop2.a)
        : '#fff';
      return `background: linear-gradient(90deg, ${colorStop1} 0%, ${colorStop2} 100%)`;
    }
  }
});
</script>

<style lang="scss" scoped>
.gradient {
  &__wrapper {
    width: var(--editorWidth);
    height: calc(var(--editorHeight) / 2);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-small);
    background: var(--black);
    overflow: hidden;
  }
  &__container {
    width: calc(var(--editorWidth) - 100px);
    height: calc(var(--editorHeight) / 4);
    position: relative;
    border-radius: var(--border-radius-med);
    border: 1px solid var(--white);

    &--trim {
      background-size: 100% calc((var(--editorHeight) / 4) / 2) !important;
      background-repeat: no-repeat !important;
    }

    // transparent backdrop
    &--transparency {
      width: calc(var(--editorWidth) - 100px);
      height: calc(var(--editorHeight) / 4);
      position: absolute;
      border-radius: var(--border-radius-med);
      background: url('./../assets/checkered.svg');
      background-size: 20px;
    }

    &--linear {
      width: calc(var(--editorWidth) - 100px);
      height: calc((var(--editorHeight) / 4) / 2);
      position: absolute;
      // offset the parent 1px border
      bottom: -1px;
      left: -1px;
      border-top: 1px dashed var(--black);
      border-left: 1px solid var(--white);
      border-right: 1px solid var(--white);
      border-bottom: 1px solid var(--white);
      border-radius: 0px 0px var(--border-radius-med) var(--border-radius-med);
    }

    // indicator multiple gradient selected
    &--multiple {
      width: calc(var(--editorWidth) - 100px);
      height: calc(var(--editorHeight) / 4);
      position: absolute;
      border-radius: var(--border-radius-med);
      border: 1px solid var(--white);
      background: var(--black);
      transform: translateX(-50%) translateY(50%);
      transition: left 0.2s, bottom 0.2s;
    }
  }
}
</style>
