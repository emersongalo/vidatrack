"use client";

// Etapa 367 — conta compartilhada x particular. "Compartilhada" = conta
// que outra pessoa também vê (minha compartilhada ou de quem compartilha
// comigo); "Meu" = conta só minha. O filtro Tudo/Compartilhada/Meu vale pra tela
// de Finanças e pro Extrato e fica guardado no aparelho.
import { useEffect, useState } from "react";

export type Escopo = "tudo" | "compartilhada" | "meu";
const CHAVE = "vt-escopo-financas";
const EVENTO = "vt-escopo-financas";

type ContaEscopo = { id: string; dono_id?: string | null; compartilhada?: boolean | null };

export function contaEhCompartilhada(c: ContaEscopo, meuId: string | null | undefined): boolean {
  return !!c.compartilhada || (!!meuId && !!c.dono_id && c.dono_id !== meuId);
}

/** só faz sentido separar quando tem conta dos dois jeitos */
export function temOsDoisTipos(contas: ContaEscopo[], meuId: string | null | undefined) {
  let comp = false;
  let meu = false;
  for (const c of contas) {
    if (contaEhCompartilhada(c, meuId)) comp = true;
    else meu = true;
    if (comp && meu) return true;
  }
  return false;
}

export function idsDoEscopo(contas: ContaEscopo[], meuId: string | null | undefined, escopo: Escopo): Set<string> | null {
  if (escopo === "tudo") return null;
  return new Set(contas.filter((c) => (escopo === "compartilhada") === contaEhCompartilhada(c, meuId)).map((c) => c.id));
}

/** o retrato do aparelho só com as contas do escopo (contas, lançamentos e contas fixas) */
export function filtrarPorEscopo<T extends { financas?: any; perfil?: any } | null | undefined>(snapshot: T, escopo: Escopo): T {
  if (!snapshot || escopo === "tudo" || !snapshot.financas) return snapshot;
  const meuId = snapshot.perfil?.id;
  const contas = (snapshot.financas.contas ?? []) as ContaEscopo[];
  if (!temOsDoisTipos(contas, meuId)) return snapshot;
  const ids = idsDoEscopo(contas, meuId, escopo)!;
  return {
    ...snapshot,
    financas: {
      ...snapshot.financas,
      contas: snapshot.financas.contas.filter((c: any) => ids.has(c.id)),
      transacoes: (snapshot.financas.transacoes ?? []).filter((t: any) => ids.has(t.conta_id)),
      recorrencias: (snapshot.financas.recorrencias ?? []).filter((r: any) => ids.has(r.conta_id)),
    },
  };
}

function ler(): Escopo {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "compartilhada" || v === "meu" ? v : "tudo";
  } catch {
    return "tudo";
  }
}

export function useEscopoFinancas(): [Escopo, (e: Escopo) => void] {
  const [escopo, setEscopo] = useState<Escopo>("tudo");
  useEffect(() => {
    setEscopo(ler());
    const ouvir = () => setEscopo(ler());
    window.addEventListener(EVENTO, ouvir);
    return () => window.removeEventListener(EVENTO, ouvir);
  }, []);
  const mudar = (e: Escopo) => {
    try {
      localStorage.setItem(CHAVE, e);
    } catch {}
    setEscopo(e);
    try {
      window.dispatchEvent(new Event(EVENTO));
    } catch {}
  };
  return [escopo, mudar];
}
