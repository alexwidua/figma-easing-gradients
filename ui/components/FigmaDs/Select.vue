<template>
  <div class="select-menu">
    <button class="select-menu__button" @click="openSelect()">
      <span
        v-if="buttonIcon"
        class="icon"
        :class="`icon--${this.buttonIcon}`"
      />
      <span class="select-menu__label">{{ buttonLabel }}</span>
      <span class="select-menu__caret"></span>
    </button>
    <ul
      class="select-menu__menu"
      :class="{ 'select-menu__menu--active': isOpen }"
    >
      <template v-for="(item, itemIndex) in items">
        <div
          v-if="item.divider == true"
          :key="itemIndex"
          class="select-menu__divider"
        />

        <li
          v-else
          :key="itemIndex"
          class="select-menu__item"
          :class="{
            'select-menu__item--selected': item.key === selectedKey
          }"
          @click="selectItem(item.key)"
        >
          <span class="select-menu__item-icon" />
          <span class="select-menu__item-label">{{ item && item.text }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script lang="ts">
// MIT License
//
// Copyright (c) 2019 berezadev
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import Vue, { PropType } from 'vue';

type Item =
  | {
      key: string;
      text: string;
      icon: string;
    }
  | {
      divider: boolean;
    };

export default Vue.extend({
  name: 'FigmaDSSelect',
  data() {
    return {
      openState: false,
      selectedKeyState: ''
    };
  },
  props: {
    items: {
      type: Array as PropType<Item[]>,
      default: []
    },
    placeholder: String as PropType<string>,
    value: {
      type: String as PropType<string>,
      default: undefined
    },
    open: {
      type: Boolean as PropType<boolean>,
      default: undefined
    }
  },

  computed: {
    selectedKey(): string {
      return this.value !== undefined ? this.value : this.selectedKeyState;
    },
    isOpen(): boolean {
      return this.open !== undefined ? this.open : this.openState;
    },
    firstGroupItemIndex(): number {
      return this.items.findIndex(x => 'group' in x);
    },
    buttonLabel(): string {
      if (this.selectedKey) {
        const item = this.items.find(
          x => 'key' in x && x.key === this.selectedKey
        );
        if (item && 'key' in item) return item.text;
      }
      return this.placeholder;
    },
    buttonIcon(): string | boolean {
      if (this.selectedKey) {
        const item = this.items.find(
          x => 'key' in x && x.key === this.selectedKey
        );
        if (item && 'key' in item) return item.icon;
      }
      return false;
    }
  },
  methods: {
    selectItem(itemKey: string) {
      this.selectedKeyState = itemKey;
      this.$emit('input', itemKey);
      this.closeSelect();
    },
    closeSelect() {
      this.openState = false;
      this.$emit('open', false);
      document.removeEventListener('click', this.handleDocumentClick);
    },
    openSelect() {
      this.openState = true;
      this.$emit('open', true);
      document.addEventListener('click', this.handleDocumentClick);
    },
    handleDocumentClick(evt: MouseEvent) {
      if (!this.$el.contains(evt.target as HTMLElement)) {
        this.closeSelect();
      }
    }
  }
});
</script>

<style lang="scss">
.select-menu .icon {
  background-size: 24px;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
