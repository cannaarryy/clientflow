/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          950: "#050505",
          900: "#080808",
          850: "#0D0D0D",
          800: "#111111",
          700: "#181818",
          600: "#222222",
        },
        ink: {
          DEFAULT: "#FFFFFF",
          soft: "#F5F5F5",
          muted: "#A1A1A1",
          faint: "#737373",
        },
        accent: {
          DEFAULT: "#7C6CFF",
          hover: "#6A5AF5",
          muted: "rgba(124,108,255,0.12)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderColor: {
        DEFAULT: "#222222",
      },
    },
  },
  plugins: [],
};
