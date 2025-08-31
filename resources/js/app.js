import './bootstrap';
import '../css/app.css';
import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { Ziggy } from './ziggy';

// Criar função route localmente
const route = (name, params, absolute) => {
  if (!Ziggy.routes[name]) {
    throw new Error(`Route [${name}] not found.`);
  }

  let url = Ziggy.routes[name].uri;

  if (params) {
    Object.keys(params).forEach(key => {
      url = url.replace(`{${key}}`, params[key]);
    });
  }

  if (absolute) {
    return `${Ziggy.url}/${url}`.replace(/\/+/g, '/');
  }

  return `/${url}`;
};

// Tornar route globalmente disponível
window.route = route;
window.Ziggy = Ziggy;

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
      .use(plugin);

    // Expor helpers globalmente para uso em templates/script-setup
    app.config.globalProperties.route = route;
    app.config.globalProperties.Ziggy = Ziggy;

    app.mount(el);
  },
});
