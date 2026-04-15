/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0A0A0A",
                accent: "#3B82F6",
                "accent-hover": "#2563EB",
                "accent-light": "#172554",
                text: "#F9F9F8",
                surface: "#1A1A1A",
                "surface-raised": "#222222",
                void: "#050505",
                border: "#2A2A2A",
                t2: "#A3A3A3",
                t3: "#737373",
                t4: "#525252",
            },
            fontFamily: {
                sans: ['Sora', 'sans-serif'],
                serif: ['"Instrument Serif"', 'serif'],
                mono: ['"Fira Code"', 'monospace'],
            },
        },
    },
    plugins: [],
}
