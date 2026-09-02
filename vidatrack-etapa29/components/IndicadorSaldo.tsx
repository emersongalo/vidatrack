import { formatarMoeda } from "@/lib/financas/formatacao";

export function IndicadorSaldo({ saldo }: { saldo: number }) {
  const positivo = saldo >= 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl2 p-5 border ${
        positivo ? "bg-habito-soft border-habito/40" : "bg-red-400/10 border-red-400/40"
      }`}
    >
      {positivo && (
        <>
          <span className="particula-saldo text-sm" style={{ left: "18%", animationDelay: "0s" }}>✨</span>
          <span className="particula-saldo text-sm" style={{ left: "45%", animationDelay: "0.6s" }}>🎉</span>
          <span className="particula-saldo text-sm" style={{ left: "72%", animationDelay: "1.2s" }}>✨</span>
        </>
      )}

      <div className="flex items-center gap-3 relative">
        <span className={`text-3xl ${positivo ? "emoji-saldo-positivo" : "emoji-saldo-negativo"}`}>
          {positivo ? "🎉" : "📉"}
        </span>
        <div>
          <p className={`text-xs ${positivo ? "text-habito" : "text-red-400"}`}>
            {positivo ? "Saldo positivo" : "Saldo negativo"}
          </p>
          <p className="text-2xl font-display font-semibold font-mono">{formatarMoeda(saldo)}</p>
          <p className="text-xs text-ink-400 mt-0.5">
            {positivo ? "Continue assim! 💪" : "Vale dar uma olhada nos gastos deste mês."}
          </p>
        </div>
      </div>
    </div>
  );
}
