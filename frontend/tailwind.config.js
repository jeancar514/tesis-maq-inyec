/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": {
                    DEFAULT: "#0d7ff2",
                    50: "#eef6ff",
                    100: "#d9ebff",
                    200: "#bcdcff",
                    300: "#8ec6ff",
                    400: "#5aa6f8",
                    500: "#0d7ff2",
                    600: "#0a63c4",
                    700: "#084d99",
                    800: "#0a3f78",
                    900: "#0c2f56",
                },
                "accent": {
                    DEFAULT: "#06b6d4",
                    400: "#22d3ee",
                    500: "#06b6d4",
                    600: "#0891b2",
                },
                "background-light": "#e9eef5",
                "background-dark": "#0a111c",
                "surface-light": "#ffffff",
                "surface-dark": "#0f1a28",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
            boxShadow: {
                "soft": "0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.06)",
                "card": "0 1px 3px rgba(15,23,42,0.06), 0 8px 24px -8px rgba(13,127,242,0.12)",
                "elevated": "0 4px 12px rgba(15,23,42,0.08), 0 20px 40px -16px rgba(13,127,242,0.18)",
                "glow": "0 0 0 1px rgba(13,127,242,0.20), 0 8px 24px -6px rgba(13,127,242,0.35)",
                "inner-top": "inset 0 1px 0 rgba(255,255,255,0.06)",
            },
            backgroundImage: {
                "app-light": "radial-gradient(1200px 600px at 12% -10%, rgba(13,127,242,0.10), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(6,182,212,0.08), transparent 55%), linear-gradient(180deg, #eef2f8 0%, #e3e9f2 100%)",
                "app-dark": "radial-gradient(1200px 600px at 12% -10%, rgba(13,127,242,0.18), transparent 60%), radial-gradient(900px 500px at 110% 10%, rgba(6,182,212,0.10), transparent 55%), linear-gradient(180deg, #0b1320 0%, #070d16 100%)",
                "grid-light": "linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)",
                "grid-dark": "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
                "card-light": "linear-gradient(180deg, #ffffff 0%, #f6f9fe 100%)",
                "card-dark": "linear-gradient(180deg, #111d2c 0%, #0d1722 100%)",
            },
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0", transform: "translateY(6px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "shimmer": {
                    "100%": { transform: "translateX(100%)" },
                },
            },
            animation: {
                "fade-in": "fade-in 0.4s ease-out both",
            },
        },
    },
    plugins: [],
}
