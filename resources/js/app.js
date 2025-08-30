import './bootstrap';
import '../css/app.css';
import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

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
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el);
  },
});
