<template>
  <div class="wrapper">
    <div
      :class="[
        {
          'hint--visible': visible,
          'hint--minimize': visible && minimize
        },
        isWarning ? 'hint--yellow' : 'hint--blue'
      ]"
      class="hint"
    >
      <span
        class="icon"
        :class="isWarning ? 'icon--hint--black' : 'icon--hint--white'"
      />
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

export default Vue.extend({
  name: 'GradientHint',
  /**
   * Banner for displaying status information
   */
  props: {
    visible: Boolean as PropType<boolean>,
    minimize: {
      type: Boolean as PropType<boolean>,
      default: false
    },
    isWarning: {
      type: Boolean as PropType<boolean>,
      default: false
    }
  }
});
</script>

<style lang="scss" scoped>
// Invisible div to expand hover area for banner
.wrapper {
  height: 50px;
  width: 100%;
  display: block;
  position: absolute;
  top: 0;
  left: 0;

  &:hover .hint--minimize {
    top: 0px;
  }
}
.hint {
  width: 100%;
  height: 40px;
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xsmall);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--font-letter-spacing-pos-xsmall);
  transition: top 0.2s, background-color 0.2s, color 0.2s;
  cursor: default;

  // icon override
  & .icon {
    width: 26px;
    height: 31px;
  }

  &--visible {
    top: 0px;
  }

  &--minimize {
    top: -34px;

    &:hover {
      top: 0px;
    }
  }

  &--blue {
    background-color: var(--blue);
    color: var(--white);
  }

  &--yellow {
    background-color: var(--yellow);
    color: var(--black);
  }
}
</style>
