"use client";

// Etapa 330 — saldo de cada conta separado, logo abaixo do saldo total
// (só aparece pra quem tem 2 contas ou mais; dá pra esconder).
import { useEffect, useState } from "react";
import Link from "next/link";
import { SeloBanco } from "@/components/SeloBanco";
import { ValorMonetario } from "@/components/ValorMonetario";

const CHAVE = "vt-saldo-por-conta";

export function SaldoPorConta({ contas }: { contas: any[] }) {
  const lista = contas.filter((c) => c.tipo !== "cartao" && c.tipo !== "investimento");
  const [aberto, setAberto] = useState(true);
  useEffect(() => {
    try {
      setAberto(localStorage.getItem(CHAVE) !== "0");
    } catch {}
  }, []);
  const mudar = (v: boolean) => {
    setAberto(v);
    try {
      localStorage.setItem(CHAVE, v ? "1" : "0");
    } catch {}
  };
  if (lista.length < 2) return null;

  if (!aberto)
    return (
      <div className="flex justify-end -mt-3 mb-4">
        <button type="button" onClick={() => mudar(true)} className="text-xs text-ink-400 hover:text-ink-100 transition">
          Ver saldo por conta ›
        </button>
      </div>
    );

  return (
    <section className="-mt-2 mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs uppercase tracking-wide text-ink-400">Saldo por conta</p>
        <button type="button" onClick={() => mudar(false)} className="text-xs text-ink-400 hover:text-ink-100 transition">
          Ocultar
        </button>
      </div>
      <ul className="flex gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1 snap-x">
        {lista.map((c) => (
          <li key={c.id} className="snap-start shrink-0">
            <Link href="/financas/contas" className="flex items-center gap-2.5 rounded-2xl bg-base-800 border border-base-600 pl-2.5 pr-4 py-2.5 min-w-[9.5rem] active:scale-[0.98] transition">
              <SeloBanco bancoId={c.banco} nome={c.nome} tipo={c.tipo} tamanho={32} />
              <span className="min-w-0">
                <span className="block text-xs text-ink-400 truncate max-w-[7rem]">{c.nome}</span>
                <span className={`block font-mono text-sm font-semibold ${Number(c.saldo) < 0 ? "text-red-400" : "text-ink-100"}`}>
                  <ValorMonetario valor={Number(c.saldo)} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
