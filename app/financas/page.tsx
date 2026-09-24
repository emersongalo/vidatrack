import Link from "next/link";

export default function FinancasPrincipalPage() {
  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">Controle de Capital</span>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Finanças</h1>
        </div>
        <span className="text-xs glass-panel px-3 py-1.5 rounded-full text-neutral-300 font-mono">
          Setembro 2026
        </span>
      </div>

      {/* Card Principal de Saldo (Estilo Cartão Neon) */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 border border-amber-500/25 shadow-2xl shadow-amber-500/5">
        <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 bg-amber-400/15 blur-3xl rounded-full" />

        <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Saldo disponível em contas</span>
        <div className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight mt-1 mb-6">
          R$ 4.684,76
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-800/80">
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Receitas</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 block">R$ 3.500</span>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Despesas</span>
            <span className="text-xs sm:text-sm font-bold text-rose-400 mt-0.5 block">R$ 915,24</span>
          </div>
          <div className="glass-panel rounded-2xl p-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase font-mono block">Investido</span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5 block">R$ 5.000</span>
          </div>
        </div>
      </div>

      {/* Cartões de Contas Bancárias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-neutral-300">Suas Contas</h2>
          <Link href="/financas/contas" className="text-xs text-amber-400 hover:underline">
            Gerenciar →
          </Link>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
              Nu
            </div>
            <div>
              <p className="font-semibold text-sm text-neutral-100">Nubank</p>
              <p className="text-xs text-neutral-400 font-mono">Conta Principal</p>
            </div>
          </div>
          <span className="font-mono font-semibold text-sm text-neutral-100">R$ 4.554,76</span>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
              💵
            </div>
            <div>
              <p className="font-semibold text-sm text-neutral-100">Carteira Física</p>
              <p className="text-xs text-neutral-400 font-mono">Dinheiro Vivo</p>
            </div>
          </div>
          <span className="font-mono font-semibold text-sm text-neutral-100">R$ 130,00</span>
        </div>
      </div>
    </div>
  );
}