import Vue from 'vue';
import App from './App.vue';

// global app styling
import './assets/app.scss';
// import figma design system
import 'figma-plugin-ds-vue/dist/figma-plugin-ds-vue.css';

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount('#app');
