<template>
  <div class="h-screen bg-background text-text flex overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'bg-surface border-r border-border transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden h-screen',
        sidebarCollapsed ? 'w-16' : 'w-64'
      ]"
      :aria-expanded="!sidebarCollapsed"
    >
      <!-- Logo e Toggle -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
        <div class="flex items-center">
          <!-- Logo -->
          <div class="flex-shrink-0 text-accent font-bold text-xl transition-all duration-300">
            <span v-if="!sidebarCollapsed" class="opacity-100">NetPilot</span>
            <span v-else class="opacity-100">NP</span>
          </div>
        </div>
        
        <!-- Toggle Button -->
        <button
          @click="toggleSidebar"
          class="p-1 rounded-md hover:bg-elevated text-text-muted hover:text-text transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              v-if="!sidebarCollapsed"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            ></path>
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="mt-4 px-2 space-y-1 flex-1 overflow-y-auto pb-4">
        <a
          v-for="item in navigation"
          :key="item.name"
          :href="item.href"
          :class="[
            isCurrentRoute(item.active) ? 'bg-elevated text-accent' : 'text-text-muted hover:bg-elevated hover:text-text',
            'group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200'
          ]"
          :aria-current="isCurrentRoute(item.active) ? 'page' : null"
        >
          <!-- Dashboard Icon -->
          <svg v-if="item.name === 'Dashboard'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="[
            'flex-shrink-0 w-5 h-5',
            isCurrentRoute(item.active) ? 'text-accent' : 'text-text-muted group-hover:text-text'
          ]" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          
          <!-- Globe Icon -->
          <svg v-else-if="item.name === 'Domínios'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="[
            'flex-shrink-0 w-5 h-5',
            isCurrentRoute(item.active) ? 'text-accent' : 'text-text-muted group-hover:text-text'
          ]" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          
          <!-- Proxy Icon -->
          <svg v-else-if="item.name === 'Proxy Reverso'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="[
            'flex-shrink-0 w-5 h-5',
            isCurrentRoute(item.active) ? 'text-accent' : 'text-text-muted group-hover:text-text'
          ]" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 5v14M8 5v14" />
          </svg>
          
          <!-- SSL Icon -->
          <svg v-else-if="item.name === 'Certificados SSL'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="[
            'flex-shrink-0 w-5 h-5',
            isCurrentRoute(item.active) ? 'text-accent' : 'text-text-muted group-hover:text-text'
          ]" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          
          <!-- Redirect Icon -->
          <svg v-else-if="item.name === 'Redirects'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="[
            'flex-shrink-0 w-5 h-5',
            isCurrentRoute(item.active) ? 'text-accent' : 'text-text-muted group-hover:text-text'
          ]" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          
          <!-- Logs Icon -->
          <svg v-else-if="item.name === 'Logs'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="[
            'flex-shrink-0 w-5 h-5',
            isCurrentRoute(item.active) ? 'text-accent' : 'text-text-muted group-hover:text-text'
          ]" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          
          <span v-if="!sidebarCollapsed" class="ml-3 truncate transition-all duration-300">{{ item.name }}</span>
        </a>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Bar -->
      <header class="bg-surface border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 transition-all duration-300">
        <!-- Page Title -->
        <h1 class="text-lg font-medium">{{ title }}</h1>

        <!-- User Menu -->
        <div class="flex items-center space-x-4">
          <button
            class="p-1 rounded-full text-text-muted hover:text-text"
            aria-label="Notificações"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>

          <div class="relative">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-ring"
              id="user-menu"
              aria-haspopup="true"
              :aria-expanded="userMenuOpen"
            >
              <div class="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white">
                <span class="text-sm font-medium">US</span>
              </div>
              <span v-if="!sidebarCollapsed" class="text-sm font-medium">Usuário</span>
            </button>

            <!-- Dropdown -->
            <div
              v-if="userMenuOpen"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-elevation bg-elevated border border-border py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu"
            >
              <a
                href="#"
                class="block px-4 py-2 text-sm text-text hover:bg-surface"
                role="menuitem"
              >
                Perfil
              </a>
              <a
                href="#"
                class="block px-4 py-2 text-sm text-text hover:bg-surface"
                role="menuitem"
              >
                Configurações
              </a>
              <a
                href="#"
                class="block px-4 py-2 text-sm text-danger hover:bg-surface"
                role="menuitem"
              >
                Sair
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background scrollbar-thin scrollbar-thumb-elevated scrollbar-track-transparent transition-all duration-300">
        <template v-if="$slots && $slots.default">
          <slot />
        </template>
      </main>
    </div>

    <!-- Toast Container removed temporarily for debugging 'ce' error -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Safe route checking function
const isCurrentRoute = (routeName: string): boolean => {
  try {
    if (typeof window !== 'undefined' && window.route && typeof window.route === 'function') {
      const route = window.route();
      return route && typeof route.current === 'function' ? route.current(routeName) : false;
    }
    return false;
  } catch (error) {
    console.warn('Route checking failed:', error);
    return false;
  }
};

interface Props {
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'NetPilot'
});

// Sidebar state
const sidebarCollapsed = ref(false);
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString());
  }
};

// User menu state
const userMenuOpen = ref(false);

// Ensure some client-only components render after mount
const isClient = ref(false);

// Fechar menu ao clicar fora
const closeUserMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (userMenuOpen.value && !target.closest('#user-menu')) {
    userMenuOpen.value = false;
  }
};

// Navegação simplificada (sem componentes dinâmicos)
const navigation = [
  { name: 'Dashboard', href: '/', active: 'dashboard' },
  { name: 'Domínios', href: '/domains', active: 'domains.*' },
  { name: 'Proxy Reverso', href: '/proxy', active: 'proxy.*' },
  { name: 'Certificados SSL', href: '/ssl', active: 'ssl.*' },
  { name: 'Redirects', href: '/redirects', active: 'redirects.*' },
  { name: 'Logs', href: '/logs', active: 'logs.*' },
];

// Lifecycle hooks
onMounted(() => {
  // Mark client-mounted for client-only renders
  isClient.value = true;
  // Restaurar estado do sidebar do localStorage
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState) {
    sidebarCollapsed.value = savedState === 'true';
  }
  
  // Adicionar listener para fechar menu ao clicar fora
  document.addEventListener('click', closeUserMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu);
});
</script>