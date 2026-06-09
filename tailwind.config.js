/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#165DFF",
          50: "#E8F0FF",
          100: "#D1E0FF",
          200: "#A3C1FF",
          300: "#75A2FF",
          400: "#4783FF",
          500: "#165DFF",
          600: "#124ACC",
          700: "#0D3799",
          800: "#092566",
          900: "#041233",
        },
        warning: {
          DEFAULT: "#FF7D00",
          50: "#FFF2E5",
          100: "#FFE5CC",
          200: "#FFCB99",
          300: "#FFB166",
          400: "#FF9733",
          500: "#FF7D00",
          600: "#CC6400",
          700: "#994B00",
          800: "#663200",
          900: "#331900",
        },
        success: {
          DEFAULT: "#00B42A",
          50: "#E5FAEA",
          100: "#CCF5D5",
          200: "#99EBAB",
          300: "#66E181",
          400: "#33D757",
          500: "#00B42A",
          600: "#009022",
          700: "#006C19",
          800: "#004811",
          900: "#002408",
        },
        danger: {
          DEFAULT: "#F53F3F",
          50: "#FDE8E8",
          100: "#FBD1D1",
          200: "#F7A3A3",
          300: "#F37575",
          400: "#EF4747",
          500: "#F53F3F",
          600: "#C43232",
          700: "#932626",
          800: "#621919",
          900: "#310D0D",
        },
        info: {
          DEFAULT: "#14C9C9",
          50: "#E5FAFA",
          100: "#CCF5F5",
          200: "#99EBEB",
          300: "#66E1E1",
          400: "#33D7D7",
          500: "#14C9C9",
          600: "#10A1A1",
          700: "#0C7979",
          800: "#085050",
          900: "#042828",
        },
        slate: {
          950: "#0B1220",
          900: "#0F172A",
          850: "#131C33",
          800: "#1E293B",
          750: "#273449",
          700: "#334155",
          600: "#475569",
        },
      },
      boxShadow: {
        "glow-primary": "0 0 20px rgba(22, 93, 255, 0.35), 0 0 40px rgba(22, 93, 255, 0.15)",
        "glow-success": "0 0 20px rgba(0, 180, 42, 0.35), 0 0 40px rgba(0, 180, 42, 0.15)",
        "glow-warning": "0 0 20px rgba(255, 125, 0, 0.35), 0 0 40px rgba(255, 125, 0, 0.15)",
        "glow-danger": "0 0 20px rgba(245, 63, 63, 0.35), 0 0 40px rgba(245, 63, 63, 0.15)",
        "glow-info": "0 0 20px rgba(20, 201, 201, 0.35), 0 0 40px rgba(20, 201, 201, 0.15)",
        "glow-card": "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 60px rgba(22, 93, 255, 0.08)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(22, 93, 255, 0.35), 0 0 40px rgba(22, 93, 255, 0.15)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(22, 93, 255, 0.5), 0 0 60px rgba(22, 93, 255, 0.25)",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(8px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slide-in-left": {
          "0%": {
            opacity: "0",
            transform: "translateX(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.3s ease-out forwards",
        "scale-in": "scale-in 0.25s ease-out forwards",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
