<template>
  <div class="wrapper">
    <div class="hint" :class="[isWarning ? 'hint--yellow' : 'hint--blue']">
      <!-- <span
        class="fig-icon"
        :class="isWarning ? 'fig-icon--hint--black' : 'fig-icon--hint--white'"
      /> -->
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

export default Vue.extend({
  /**
   * Banner for displaying status information
   */
  name: 'GradientHint',
  props: {
    visible: Boolean as PropType<boolean>,
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
  height: 100%;
  width: 100%;
  display: block;
  position: absolute;
  top: 0;
  left: 0;

  &:hover .hint {
    top: 0px;
  }
}
.hint {
  width: 100%;
  height: 40px;
  position: absolute;
  padding: 0 16px;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xsmall);
  font-weight: var(--font-weight-normal);
  letter-spacing: var(--font-letter-spacing-pos-xsmall);
  transition: top 0.2s, background-color 0.2s, color 0.2s;
  user-select: none;
  cursor: default;

  // icon override
  & .fig-icon {
    width: 26px;
    height: 31px;
  }

  &--visible {
    top: 0px;
  }

  &--blue {
    background-color: var(--blue);
    color: var(--white);
  }

  &--yellow {
    background-color: var(--yellow);
    color: var(--black);

    & .icon {
      width: 48px;
    }
  }
}
</style>
