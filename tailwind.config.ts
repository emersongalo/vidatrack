import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "rgb(var(--c-base-900) / <alpha-value>)", // fundo principal
          800: "rgb(var(--c-base-800) / <alpha-value>)", // superfícies
          700: "rgb(var(--c-base-700) / <alpha-value>)", // cards
          600: "rgb(var(--c-base-600) / <alpha-value>)", // bordas
        },
        ink: {
          100: "rgb(var(--c-ink-100) / <alpha-value>)", // texto principal
          400: "rgb(var(--c-ink-400) / <alpha-value>)", // texto secundário
        },
        habito: {
          DEFAULT: "#7FB894", // sage — trilho de Hábitos
          soft: "#7FB89422",
        },
        nota: {
          DEFAULT: "#9C8FD9", // lavanda — trilho de Notas
          soft: "#9C8FD922",
        },
        financa: {
          DEFAULT: "#D9A24C", // âmbar — trilho de Finanças
          soft: "#D9A24C22",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      // Etapa 226 — letras um pouco maiores no app todo (antes 12px e 14px)
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.15rem" }],
        sm: ["0.9375rem", { lineHeight: "1.4rem" }],
      },
      // Etapa 230 — animações curtas (marcar hábito, comemoração, números)
      keyframes: {
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" }, "100%": { transform: "scale(1)" } },
        subir: {
          "0%": { transform: "translateY(0) scale(0.6)", opacity: "0" },
          "15%": { opacity: "1" },
          "100%": { transform: "translateY(-70vh) scale(1.1)", opacity: "0" },
        },
        surgir: { "0%": { transform: "scale(0.85)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        pop: "pop 0.35s ease-out",
        subir: "subir 1.8s ease-out forwards",
        surgir: "surgir 0.25s ease-out",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
