// Etapa 279 — identidade de cada área: um brilho suave da cor da área no
// topo da tela (verde em Hábitos, lilás em Tarefas, dourado em Finanças).
// Só decoração: não pega toque e some com "reduzir movimento".
const CORES = {
  habito: "var(--c-habito)",
  tarefa: "var(--c-nota)",
  financa: "var(--c-financa)",
} as const;

export function AuroraArea({ area }: { area: keyof typeof CORES }) {
  const c = CORES[area];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 -z-10 overflow-hidden">
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[140%] h-72 rounded-[50%] blur-3xl opacity-70 aurora-respirar"
        style={{ background: `radial-gradient(closest-side, rgb(${c} / 0.22), transparent)` }}
      />
      <div
        className="absolute -top-16 -right-20 w-72 h-56 rounded-full blur-3xl opacity-60"
        style={{ background: `radial-gradient(closest-side, rgb(${c} / 0.16), transparent)` }}
      />
    </div>
  );
}
