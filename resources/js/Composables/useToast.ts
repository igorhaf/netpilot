import { ref, markRaw } from 'vue';
import type { Component } from 'vue';

interface Toast {
    id: number;
    title: string;
    message?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration: number;
    timeout?: number;
}

// Singleton para gerenciar toasts globalmente
const toasts = ref<Toast[]>([]);
let counter = 0;

export function useToast() {
    // Adicionar um novo toast
    const add = (options: {
        title: string;
        message?: string;
        type?: 'success' | 'error' | 'warning' | 'info';
        duration?: number;
    }) => {
        const id = counter++;
        const toast: Toast = {
            id,
            title: options.title,
            message: options.message,
            type: options.type || 'info',
            duration: options.duration || 5000,
        };

        toasts.value.push(toast);

        // Configurar timeout para remover o toast automaticamente
        toast.timeout = window.setTimeout(() => {
            remove(id);
        }, toast.duration);

        return id;
    };

    // Remover um toast pelo ID
    const remove = (id: number) => {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) {
            clearTimeout(toasts.value[index].timeout);
            toasts.value.splice(index, 1);
        }
    };

    // Helpers para tipos específicos de toast
    const success = (title: string, message?: string, duration?: number) => {
        return add({ title, message, type: 'success', duration });
    };

    const error = (title: string, message?: string, duration?: number) => {
        return add({ title, message, type: 'error', duration });
    };

    const warning = (title: string, message?: string, duration?: number) => {
        return add({ title, message, type: 'warning', duration });
    };

    const info = (title: string, message?: string, duration?: number) => {
        return add({ title, message, type: 'info', duration });
    };

    return {
        toasts,
        add,
        remove,
        success,
        error,
        warning,
        info
    };
}

// Exportar um singleton para uso global
export const toast = useToast();
