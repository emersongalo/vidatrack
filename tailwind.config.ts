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
        // Etapa 248 — brilho que passa no "carregando"
        reluzir: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" }, "100%": { transform: "scale(1)" } },
        subir: {
          "0%": { transform: "translateY(0) scale(0.6)", opacity: "0" },
          "15%": { opacity: "1" },
          "100%": { transform: "translateY(-70vh) scale(1.1)", opacity: "0" },
        },
        surgir: { "0%": { transform: "scale(0.85)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        // Etapa 231 — folha que sobe de baixo e fica parada
        folha: { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
        fundo: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        // Etapa 233 — carinhas, plantinha e toque duplo dos hábitos em dupla
        piscar: { "0%, 92%, 100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(0.1)" } },
        pular: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12%)" } },
        lagrima: { "0%": { transform: "translateY(0)", opacity: "0" }, "20%": { opacity: "1" }, "100%": { transform: "translateY(260%)", opacity: "0" } },
        olhar: { "0%, 100%": { transform: "translateX(0)" }, "30%, 60%": { transform: "translateX(18%)" } },
        balancar: { "0%, 100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
        tremer: { "0%, 100%": { transform: "rotate(0)" }, "25%": { transform: "rotate(-12deg)" }, "75%": { transform: "rotate(12deg)" } },
        "mao-esq": { "0%": { transform: "translateX(-60vw) rotate(-20deg)" }, "60%": { transform: "translateX(-8px) rotate(0)" }, "75%": { transform: "translateX(4px)" }, "100%": { transform: "translateX(0)" } },
        "mao-dir": { "0%": { transform: "translateX(60vw) rotate(20deg) scaleX(-1)" }, "60%": { transform: "translateX(8px) rotate(0) scaleX(-1)" }, "75%": { transform: "translateX(-4px) scaleX(-1)" }, "100%": { transform: "translateX(0) scaleX(-1)" } },
        estouro: { "0%": { transform: "scale(0)", opacity: "1" }, "100%": { transform: "scale(2.6)", opacity: "0" } },
        descer: { "0%": { transform: "translateY(-120%)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        // Etapa 234 — cena do "Juntos" no Painel
        nuvem: { "0%": { transform: "translateX(-40px)" }, "100%": { transform: "translateX(calc(100vw))" } },
        boiar: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-5px)" } },
        girar: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        // Etapa 236 — céu do "Juntos" conforme a hora
        cintilar: { "0%, 100%": { opacity: "0.25" }, "50%": { opacity: "1" } },
        vagalume: {
          "0%": { transform: "translate(0, 0)", opacity: "0" },
          "20%": { opacity: "1" },
          "50%": { transform: "translate(14px, -10px)", opacity: "0.4" },
          "80%": { opacity: "1" },
          "100%": { transform: "translate(-6px, -18px)", opacity: "0" },
        },
        passaro: { "0%": { transform: "translateX(-30px) translateY(0)" }, "50%": { transform: "translateX(50vw) translateY(-8px)" }, "100%": { transform: "translateX(100vw) translateY(4px)" } },
        asas: { "0%, 100%": { transform: "scaleY(1)" }, "50%": { transform: "scaleY(-0.6)" } },
        cadente: {
          "0%": { transform: "translate(0, 0)", opacity: "0" },
          "2%": { opacity: "1" },
          "9%": { transform: "translate(-160px, 70px)", opacity: "0" },
          "100%": { transform: "translate(-160px, 70px)", opacity: "0" },
        },
        brilhar: { "0%, 100%": { boxShadow: "0 0 18px 4px rgba(255,244,200,0.35)" }, "50%": { boxShadow: "0 0 30px 10px rgba(255,244,200,0.55)" } },
      },
      animation: {
        reluzir: "reluzir 1.6s ease-in-out infinite",
        pop: "pop 0.35s ease-out",
        subir: "subir 1.8s ease-out forwards",
        surgir: "surgir 0.25s ease-out",
        folha: "folha 0.25s ease-out",
        fundo: "fundo 0.2s ease-out",
        piscar: "piscar 4s ease-in-out infinite",
        pular: "pular 0.9s ease-in-out infinite",
        lagrima: "lagrima 1.6s ease-in infinite",
        olhar: "olhar 3s ease-in-out infinite",
        balancar: "balancar 3.5s ease-in-out infinite",
        tremer: "tremer 0.5s ease-in-out 3",
        "mao-esq": "mao-esq 0.7s cubic-bezier(.2,.9,.3,1.2) forwards",
        "mao-dir": "mao-dir 0.7s cubic-bezier(.2,.9,.3,1.2) forwards",
        estouro: "estouro 0.8s ease-out forwards",
        descer: "descer 0.35s ease-out",
        nuvem: "nuvem 38s linear infinite",
        boiar: "boiar 2.6s ease-in-out infinite",
        girar: "girar 24s linear infinite",
        cintilar: "cintilar 2.4s ease-in-out infinite",
        vagalume: "vagalume 4.5s ease-in-out infinite",
        passaro: "passaro 16s linear infinite",
        asas: "asas 0.5s ease-in-out infinite",
        cadente: "cadente 9s ease-out infinite",
        brilhar: "brilhar 4s ease-in-out infinite",
      },
      borderRadius: {
        // Etapa 250 — cantos iguais aos cartões novos (rounded-3xl) em todo o app
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
