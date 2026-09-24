import Link from "next/link";

const DIAS = [
  { diaSemana: "Seg", dia: 21, ativo: false },
  { diaSemana: "Ter", dia: 22, ativo: false },
  { diaSemana: "Qua", dia: 23, ativo: false },
  { diaSemana: "Qui", dia: 24, ativo: true },
  { diaSemana: "Sex", dia: 25, ativo: false },
  { diaSemana: "Sáb", dia: 26, ativo: false },
];

const HABITOS_EXEMPLO = [
  { id: "1", titulo: "Beber água", categoria: "Saúde", streak: 12, concluido: true, icone: "💧" },
  { id: "2", titulo: "Exercitar-se", categoria: "Corpo", streak: 5, concluido: false, icone: "⚡" },
  { id: "3", titulo: "Meditar", categoria: "Mente", streak: 9, concluido: false, icone: "🧘" },
  { id: "4", titulo: "Não fumar", categoria: "Controle", streak: 28, concluido: true, icone: "🛡️" },
];

export default function HabitosHojePage() {
  return (
    <div className="space-y-6">
      {/* Header Superior */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">Rotina & Foco</span>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Hoje</h1>
        </div>
        <Link
          href="/habitos/planejador"
          className="text-xs glass-panel px-3 py-1.5 rounded-full text-neutral-300 hover:text-white transition"
        >
          ⏱️ Blocos de tempo
        </Link>
      </div>

      {/* Calendário de Pílulas Futurista */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
        {DIAS.map((item) => (
          <button
            key={item.dia}
            className={`flex flex-col items-center py-2.5 px-3 rounded-2xl transition-all ${
              item.ativo
                ? "bg-emerald-400 text-neutral-950 font-bold shadow-lg shadow-emerald-500/25 scale-105"
                : "glass-panel text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span className="text-[10px] uppercase font-mono">{item.diaSemana}</span>
            <span className="text-sm mt-0.5">{item.dia}</span>
          </button>
        ))}
      </div>

      {/* Lista de Hábitos */}
      <div className="space-y-3">
        {HABITOS_EXEMPLO.map((habito) => (
          <div
            key={habito.id}
            className={`glass-panel glass-panel-hover rounded-2xl p-4 flex items-center justify-between border transition-all ${
              habito.concluido ? "border-emerald-500/30 bg-emerald-950/15" : "border-neutral-800"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-lg">
                {habito.icone}
              </div>
              <div>
                <h2 className={`font-semibold text-sm ${habito.concluido ? "text-white line-through opacity-70" : "text-neutral-100"}`}>
                  {habito.titulo}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-400">
                    {habito.categoria}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">
                    🔥 {habito.streak} dias
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox Circular Estilizado */}
            <button
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                habito.concluido
                  ? "bg-emerald-400 border-emerald-400 text-neutral-950 font-bold shadow-[0_0_12px_#34d399]"
                  : "border-neutral-700 hover:border-emerald-400/60"
              }`}
            >
              {habito.concluido && "✓"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}