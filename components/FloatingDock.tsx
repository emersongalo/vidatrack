"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ItemMenu {
  href: string;
  rotulo: string;
  icone: string;
}

interface FloatingDockProps {
  modulo: "habitos" | "financas";
  itens: ItemMenu[];
  onAdicionar?: () => void;
  acaoTexto?: string;
}

export function FloatingDock({ modulo, itens, onAdicionar, acaoTexto = "Novo" }: FloatingDockProps) {
  const pathname = usePathname();
  const isHabito = modulo === "habitos";
  const corAtiva = isHabito ? "text-emerald-400" : "text-amber-400";
  const bgBotaoAcao = isHabito
    ? "bg-emerald-400 text-neutral-950 shadow-emerald-500/30"
    : "bg-amber-400 text-neutral-950 shadow-amber-500/30";

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
      <div className="glass-panel rounded-3xl px-3 py-2 flex items-center justify-between shadow-2xl shadow-black/80">
        <div className="flex items-center gap-1 sm:gap-2">
          {itens.slice(0, 2).map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  ativo ? corAtiva : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span className="text-base leading-none">{item.icone}</span>
                <span>{item.rotulo}</span>
                {ativo && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isHabito ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Botão de Ação Central Flutuante */}
        {onAdicionar ? (
          <button
            onClick={onAdicionar}
            title={acaoTexto}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${bgBotaoAcao}`}
          >
            ＋
          </button>
        ) : (
          <Link
            href={isHabito ? "/habitos/novo" : "/financas/nova"}
            title={acaoTexto}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 ${bgBotaoAcao}`}
          >
            ＋
          </Link>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          {itens.slice(2, 4).map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 rounded-2xl flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
                  ativo ? corAtiva : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <span className="text-base leading-none">{item.icone}</span>
                <span>{item.rotulo}</span>
                {ativo && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      isHabito ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}