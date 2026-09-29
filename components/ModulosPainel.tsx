"use client";

// Etapa 224 — as áreas do app como blocos lado a lado (substitui o
// "trilho" vertical, que deixava a tela vazia no celular).
import Link from "next/link";
import { Bot, ListChecks, Wallet } from "lucide-react";

const MODULOS = [
  { href: "/habitos", titulo: "Hábitos", texto: "Hoje, rotinas e metas", Icone: ListChecks, cor: "text-habito bg-habito/15", borda: "hover:border-habito" },
  { href: "/financas", titulo: "Finanças", texto: "Contas, gastos e previsão", Icone: Wallet, cor: "text-financa bg-financa/15", borda: "hover:border-financa" },
  { href: "/financas/assistente", titulo: "Assistente", texto: "Pergunte ou lance falando", Icone: Bot, cor: "text-nota bg-nota/15", borda: "hover:border-nota" },
];

export function ModulosPainel() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MODULOS.map(({ href, titulo, texto, Icone, cor, borda }) => (
        <Link key={href} href={href} className={`bg-base-800 border border-base-600 rounded-2xl p-3.5 transition ${borda}`}>
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${cor}`}>
            <Icone size={20} />
          </span>
          <p className="text-base font-semibold mt-2.5">{titulo}</p>
          <p className="text-xs text-ink-400 leading-snug mt-0.5">{texto}</p>
        </Link>
      ))}
    </div>
  );
}
