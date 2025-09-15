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

    // Global error handlers to surface detailed context
    app.config.errorHandler = (err, instance, info) => {
      // Provide more context in console to locate the source component and hook
      const comp = instance?.type || instance;
      const compName = (comp && (comp.name || comp.__name)) || undefined;
      const compFile = comp && comp.__file ? comp.__file : undefined;
      // eslint-disable-next-line no-console
      console.error('[Vue Global Error]', { err, info, component: compName || comp, file: compFile });
    };

    app.config.warnHandler = (msg, instance, trace) => {
      // eslint-disable-next-line no-console
      console.warn('[Vue Warning]', msg, { component: instance?.type?.name || instance?.type || instance, trace });
    };

    // Also capture unhandled promise rejections for extra context
    window.addEventListener('unhandledrejection', (event) => {
      // eslint-disable-next-line no-console
      console.error('[Unhandled Promise Rejection]', event.reason);
    });

    window.addEventListener('error', (event) => {
      // eslint-disable-next-line no-console
      console.error('[Window Error]', event.message, {
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
      });
    });

    app.mount(el);
  },
});
