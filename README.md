<img src="misc/easing-gradients.gif" width="100%" max-width="600px"/>

Allows easing of gradient fills in Figma using custom cubic-bézier or step easing functions.

This plugin is based on the great [work of Andreas Larsen](https://larsenwork.com/easing-gradients/) and should be seen as a fork of Andreas' [Sketch plugin](https://github.com/larsenwork/sketch-easing-gradient).

[<img src="misc/button.svg">](https://www.figma.com/community/plugin/907899097995668330/Easing-Gradients)

## ✨ Usage

1. Go to _Plugins > Easing Gradients_
1. Select a shape with at least one gradient fill 🎨
1. Use one of the easing function presets or drag the control handles for custom easing 🖐️
1. Apply easing ✨

The plugin is 'gradient-agnostic' in that sense that it doesn't care about the type (linear, radial etc.) and orientation of the gradient. It takes the first and last color stop as parameters and will ease the gradient with the given easing function value. One caveat with this is that all other color steps in between are discarded.

#### Shape with multiple gradient fills

If a shape contains multiple gradient fills the same easing function will be applied to all gradient fill layers.

#### Multiple shapes selected

If multiple shapes are selected the same easing will be applied to all selected shapes (if they have a gradient fill layer).

## 🚧 Development

1. `npm install` — Install dependencies
1. `npm run serve` — Serve the plugin (just serves the frontend) 🔧
1. `npm run watch` — Bundle the plugin and watch for changes (for development in Figma) 👁️
1. `npm run build` — Bundle the plugin for production using Vue-CLI 🚀

## 💭 Motivation

[Matan Kushner](https://github.com/matchai) [existing Figma plugin](https://www.figma.com/community/plugin/781591244449826498) does a great job but lacks an user interface and customizable easing functions. I took this as an opportunity to extend the plugin with this functionality.

I'm grateful for [Andreas Larsen](https://github.com/larsenwork) for putting out his work on [easing gradients](https://larsenwork.com/easing-gradients/) and [Matan Kushner](https://github.com/matchai) for creating the [easing-gradient plugin](https://github.com/matchai/figma-easing-gradient) — his project was a great guidance how to tackle this project.

## 🌀 Misc

This plugin uses the [figma-plugin-ds-vue](https://github.com/alexwidua/figma-plugin-ds-vue) library.

## 📝 License

[MIT](LICENSE)
