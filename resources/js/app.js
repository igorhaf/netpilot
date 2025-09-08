import './bootstrap';
import '../css/app.css';
import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { Ziggy } from './ziggy';
import { route, ZiggyVue } from 'ziggy-js';

// Expor Ziggy e route globalmente
window.Ziggy = Ziggy;
window.route = route;

createInertiaApp({
  resolve: async (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue');
    const importPage = pages[`./Pages/${name}.vue`];
    if (!importPage) {
      console.error(`[Inertia] Page not found: ${name}. Looked for ./Pages/${name}.vue`);
      throw new Error(`Inertia page not found: ${name}`);
    }
    const module = await importPage();
    return module.default;
  },
  setup({ el, App, props, plugin }) {
    const app = createApp({ render: () => h(App, props) })
      .use(plugin)
      .use(ZiggyVue, Ziggy);

    app.mount(el);
  },
});
