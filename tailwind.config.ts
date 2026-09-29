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
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
