"use client";

// Etapa 220 — aviso "O que há de novo" no Painel. Aparece uma vez por
// versão pra quem já usa o app; some ao abrir ou ao fechar no X.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { CHAVE_NOVIDADES, NOVIDADES, VERSAO_NOVIDADES, deveMostrarNovidades } from "@/lib/novidades/lista";

export function marcarNovidadesVistas() {
  try {
    localStorage.setItem(CHAVE_NOVIDADES, VERSAO_NOVIDADES);
  } catch {
    /* ignora */
  }
}

export function NovidadesApp({ jaUsa }: { jaUsa: boolean }) {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    let vista: string | null = null;
    try {
      vista = localStorage.getItem(CHAVE_NOVIDADES);
    } catch {
      return;
    }
    // quem acabou de chegar (ou o retrato ainda não carregou) não vê o aviso
    if (!jaUsa) return;
    setMostrar(deveMostrarNovidades(vista, jaUsa));
  }, [jaUsa]);

  if (!mostrar) return null;
  const atual = NOVIDADES[0];

  return (
    <div className="relative flex items-center gap-3 mt-3 mb-1 rounded-xl2 p-4 border border-habito/40 bg-gradient-to-r from-habito/10 to-nota/10">
      <Link href="/novidades" onClick={marcarNovidadesVistas} className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl">🆕</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium">O que há de novo</span>
          <span className="block text-xs text-ink-400 truncate">
            {atual.itens.slice(0, 3).map((i) => i.titulo).join(" · ")}
          </span>
        </span>
        <span className="text-ink-400">→</span>
      </Link>
      <button
        aria-label="Fechar novidades"
        onClick={() => {
          marcarNovidadesVistas();
          setMostrar(false);
        }}
        className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-ink-400 hover:text-ink-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
