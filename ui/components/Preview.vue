<template>
  <div
    class="gradient gradient__wrapper"
    @click="compareGradients = !compareGradients"
  >
    <!-- Transparency backdrop -->
    <div
      class="gradient__container gradient__container__linear gradient__container--transparency"
      :class="isCompare"
    />
    <div
      class="gradient__container gradient__container__eased gradient__container--transparency"
      :class="isCompare"
    />
    <!-- Labels -->
    <div
      class="gradient__container__text gradient__container__text--left"
      :class="isCompare"
    >
      LINEAR
    </div>
    <div
      class="gradient__container__text gradient__container__text--right"
      :class="isCompare"
    >
      EASED
    </div>
    <!-- Linear preview -->
    <div
      class="gradient__container gradient__container__linear"
      :class="isCompare"
      :style="linearGradient"
    ></div>

    <!-- Gradient preview -->
    <div
      class="gradient__container gradient__container__eased"
      :style="easedGradient"
      :class="isCompare"
    />
    <Toast
      v-if="hasNoneSelected || hasMultipleColorStops || hasMultipleElements"
      :isWarning="hasMultipleColorStops || hasMultipleElements"
    >
      <span v-if="hasNoneSelected">No gradient shape selected.</span>
      <span>
        <span v-if="hasMultipleColorStops"
          >Only the first and last color stop is considered.</span
        >
        <br v-if="hasMultipleColorStops && hasMultipleElements" />
        <span v-if="hasMultipleElements"
          >Easing will be applied to multiple elements.</span
        >
      </span>
    </Toast>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import chroma, { Color } from 'chroma-js';
import easingCoordinates from 'easing-coordinates';
import Toast from '@/components/PreviewToast.vue';

// Typings
type ColorStops = {
  stop1: { r: number; g: number; b: number; a: number };
  stop2: { r: number; g: number; b: number; a: number };
  numStops: number;
};

type hexedColorStops = {
  colorStop1: string | Color;
  colorStop2: string | Color;
};

export default Vue.extend({
  /**
   * Contains the preview of the current selected gradient with applied easing.
   * Must be a child of App.vue component.
   */
  name: 'GradientPreview',
  data() {
    return {
      curveSteps: 15, // How many color stops are used for easing. TODO: make this a prop?
      compareGradients: false,
      initColorStops: { stop1: '#000', stop2: '#fff' }
    };
  },
  components: {
    Toast
  },
  props: {
    handles: Object as PropType<Record<string, Record<string, number>>>,
    steps: [Number, String],
    skips: {
      type: String as PropType<string>,
      default: 'skip-none'
    },
    type: String as PropType<string>,
    hasColorStops: Boolean as PropType<boolean>,
    colorStops: Object as PropType<ColorStops>,
    selectionLength: Number as PropType<number>,
    gradientDegree: Number as PropType<number>,
    gradientType: String as PropType<string>
  },
  computed: {
    /**
     * Compute styles if gradient comparison is shown
     */
    isCompare(): string {
      return this.compareGradients ? 'compare' : 'default';
    },
    /**
     * Computed variable to handle warning toasts
     */
    hasNoneSelected(): boolean {
      return this.selectionLength == 0;
    },
    hasMultipleColorStops(): boolean {
      return this.colorStops.numStops > 2 && this.hasColorStops;
    },
    hasMultipleElements(): boolean {
      return this.selectionLength > 1 && this.hasColorStops;
    },
    /**
     * Computes the inline style for EASED gradient preview
     */
    easedGradient(): string {
      const { colorStop1, colorStop2 } = this.getColorStops;

      const ease =
        this.type == 'curve'
          ? easingCoordinates(
              `cubic-bezier(${this.handles.handle1.x},${this.handles.handle1.y},${this.handles.handle2.x},${this.handles.handle2.y})`,
              this.curveSteps
            )
          : easingCoordinates(`steps(${this.steps}, ${this.skips})`); // eslint-disable-line no-mixed-spaces-and-tabs

      // Map colors and position
      const easeGradient = ease.map(position => {
        return {
          color: chroma.mix(colorStop1, colorStop2, position.y, 'rgb').rgba(),
          position: position.x
        };
      });

      const inlineStyle = easeGradient.map(stop => {
        return `rgba(${stop.color[0]},${stop.color[1]},${stop.color[2]},${
          stop.color[3]
        }) ${stop.position * 100}%`;
      });

      // Handle different gradient types
      if (this.gradientType == 'GRADIENT_LINEAR') {
        return `background: linear-gradient(${
          this.offsetDegree
        }deg, ${inlineStyle.toString()});`;
      } else if (
        this.gradientType == 'GRADIENT_RADIAL' ||
        this.gradientType == 'GRADIENT_DIAMOND'
      ) {
        return `background: radial-gradient(50% 50% at 50% 50%, ${inlineStyle.toString()});`;
      } else if (this.gradientType == 'GRADIENT_ANGULAR') {
        return `background: conic-gradient(from ${
          this.offsetDegree
        }deg at 50% 50%, ${inlineStyle.toString()});`;
      }
      // Fallback to linear
      else {
        return `background: linear-gradient(${
          this.offsetDegree
        }deg, ${inlineStyle.toString()});`;
      }
    },
    /**
     * Compute inline style for LINEAR gradient
     */
    linearGradient(): string {
      const { colorStop1, colorStop2 } = this.getColorStops;

      // Handle different gradient types
      if (this.gradientType == 'GRADIENT_LINEAR') {
        return `background: linear-gradient(${this.offsetDegree}deg, ${colorStop1} 0%, ${colorStop2} 100%);`;
      } else if (
        this.gradientType == 'GRADIENT_RADIAL' ||
        this.gradientType == 'GRADIENT_DIAMOND'
      ) {
        return `background: radial-gradient(50% 50% at 50% 50%, ${colorStop1} 0%, ${colorStop2} 100%);`;
      } else if (this.gradientType == 'GRADIENT_ANGULAR') {
        return `background: conic-gradient(from ${this.offsetDegree}deg at 50% 50%, ${colorStop1} 0%, ${colorStop2} 100%);`;
      } else {
        return `background: linear-gradient(${this.offsetDegree}deg, ${colorStop1} 0%, ${colorStop2} 100%);`;
      }
    },
    /**
     * Utility to translate supplied colorstops to hex
     */
    getColorStops(): hexedColorStops {
      const c = this.colorStops;
      const colorStop1 = this.hasColorStops
        ? chroma.gl(c.stop1.r, c.stop1.g, c.stop1.b, c.stop1.a)
        : this.initColorStops.stop1;
      const colorStop2 = this.hasColorStops
        ? chroma.gl(c.stop2.r, c.stop2.g, c.stop2.b, c.stop2.a)
        : this.initColorStops.stop2;

      return { colorStop1, colorStop2 };
    },
    /**
     * The gradient rotation handed over from Figma has a different
     * 0 point than the CSS degree. Add another 90 degrees to offset
     * and match the preview degree with what the user sees in Figma.
     */
    offsetDegree(): number {
      return this.gradientDegree + 90;
    }
  }
});
</script>

<style lang="scss" scoped>
.gradient {
  &__wrapper {
    width: var(--editorWidth);
    height: var(--editorHeight);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-compare);
    background: var(--black);
    overflow: hidden;
    cursor: pointer;
  }
  &__container {
    position: relative;
    border-radius: var(--border-radius-med);
    border: 1px solid var(--white);

    &.default {
      width: calc(var(--editorWidth) - 100px);
      height: calc(var(--editorWidth) - 100px);
    }

    &.compare {
      width: calc(var(--editorWidth) - 150px);
      height: calc(var(--editorWidth) - 150px);
    }

    &__text {
      position: absolute;
      color: rgb(255, 255, 255);
      font-size: 10px;
      transition: transform 0.3s, opacity 0.4s;

      &--left {
        opacity: 1;
        &.compare {
          transform: translateX(-52px) translateY(-67px);
          opacity: 1;
        }

        &.default {
          transform: translateX(-52px) translateY(-44px);
          opacity: 0;
        }
      }

      &--right {
        &.compare {
          transform: translateX(52px) translateY(-67px);
          opacity: 1;
        }

        &.default {
          transform: translateX(52px) translateY(-44px);
          opacity: 0;
        }
      }
    }

    &__eased {
      transition: all 0.3s;

      &.compare {
        transform: translateX(52px);
      }
    }

    &__linear {
      position: absolute;
      transition: all 0.3s;
      &.compare {
        transform: translateX(-52px);
      }
    }

    &--transparency {
      position: absolute;
      border-radius: var(--border-radius-med);
      background: url('./../assets/checkered.svg');
      background-size: 20px;
    }
  }
}
</style>
