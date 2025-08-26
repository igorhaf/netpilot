/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.vue',
        './resources/js/**/*.js',
        './resources/js/**/*.ts',
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--bg)',
                surface: 'var(--surface)',
                elevated: 'var(--elevated)',
                border: 'var(--border)',
                text: {
                    DEFAULT: 'var(--text)',
                    muted: 'var(--muted)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    light: 'var(--accent-light)',
                    dark: 'var(--accent-dark)',
                },
                info: {
                    DEFAULT: 'var(--info)',
                    light: 'var(--info-light)',
                },
                warning: {
                    DEFAULT: 'var(--warning)',
                    light: 'var(--warning-light)',
                },
                danger: {
                    DEFAULT: 'var(--danger)',
                    light: 'var(--danger-light)',
                },
                success: {
                    DEFAULT: 'var(--success)',
                    light: 'var(--success-light)',
                },
                ring: 'var(--ring)',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'elevation': '0 6px 24px rgba(0,0,0,0.30)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ],
}
