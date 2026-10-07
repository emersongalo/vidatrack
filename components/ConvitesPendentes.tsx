"use client";

// Etapa 273 — convites de compartilhamento que chegaram pra você.
// Cada um aparece num cartão com "Aceitar" e "Recusar". O acesso só
// começa quando você aceita.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { responderConvite } from "@/lib/compartilhamento/actions";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { explodirEm } from "@/lib/app/festa";
import { vibrar } from "@/lib/app/vibrar";

export const EVENTO_CONVITES = "vt-convites-atualizar";

export type Convite = {
  id: string;
  tipo_item: "habito" | "tarefa" | "financa" | "nota";
  item_id: string;
  dono_id: string;
  permissao: "leitura" | "edicao";
  nome_item: string | null;
  nome_dono: string | null;
  criado_em: string;
};

const INFO_TIPO: Record<string, { emoji: string; rotulo: string; cor: string }> = {
  habito: { emoji: "🌱", rotulo: "o hábito", cor: "#7FB894" },
  tarefa: { emoji: "✅", rotulo: "a tarefa", cor: "#9C8FD9" },
  financa: { emoji: "💳", rotulo: "a conta", cor: "#D9A24C" },
  nota: { emoji: "📝", rotulo: "a nota", cor: "#4C8FCC" },
};

function linkDoItem(c: Convite): string {
  if (c.tipo_item === "habito") return `/habitos/${c.item_id}`;
  if (c.tipo_item === "tarefa") return `/tarefas/${c.item_id}`;
  if (c.tipo_item === "financa") return "/financas/contas";
  return "/dashboard";
}

/** Busca os convites pendentes que chegaram pra quem está logado. */
export function useConvitesPendentes() {
  const [convites, setConvites] = useState<Convite[] | null>(null);

  const recarregar = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const supabase = createClient();
      const { data: sessao } = await supabase.auth.getSession();
      const eu = sessao.session?.user.id;
      if (!eu) {
        setConvites([]);
        return;
      }
      const { data } = await supabase
        .from("convites_compartilhamento")
        .select("id, tipo_item, item_id, dono_id, permissao, nome_item, nome_dono, criado_em")
        .eq("status", "pendente")
        .neq("dono_id", eu)
        .order("criado_em", { ascending: false });
      setConvites((data ?? []) as Convite[]);
    } catch {
      setConvites((atual) => atual ?? []);
    }
  }, []);

  useEffect(() => {
    void recarregar();
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void recarregar();
    };
    window.addEventListener(EVENTO_CONVITES, recarregar);
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("online", recarregar);
    return () => {
      window.removeEventListener(EVENTO_CONVITES, recarregar);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("online", recarregar);
    };
  }, [recarregar]);

  return { convites, recarregar };
}

export function CartaoConvite({ convite, aoResponder }: { convite: Convite; aoResponder: (id: string) => void }) {
  const [estado, setEstado] = useState<"parado" | "enviando" | "aceito" | "recusado" | "erro">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const refAceitar = useRef<HTMLButtonElement>(null);
  const info = INFO_TIPO[convite.tipo_item] ?? INFO_TIPO.habito;

  async function responder(aceitar: boolean) {
    if (estado === "enviando") return;
    setEstado("enviando");
    setErro(null);
    const r = await responderConvite(convite.id, aceitar).catch(() => ({ ok: false, erro: "Sem conexão — tente de novo" }));
    if (!r.ok) {
      setEstado("erro");
      setErro(r.erro ?? "Não deu certo");
      return;
    }
    if (aceitar) {
      vibrar([15, 40, 25]);
      explodirEm(refAceitar.current, { cor: info.cor, emojis: ["🤝", "✨"] });
      setEstado("aceito");
      void atualizarSnapshotEmTodasAsTelas();
    } else {
      vibrar(10);
      setEstado("recusado");
    }
    setTimeout(() => {
      aoResponder(convite.id);
      window.dispatchEvent(new Event(EVENTO_CONVITES));
    }, aceitar ? 2200 : 900);
  }

  if (estado === "aceito") {
    return (
      <div className="animate-quicar rounded-2xl border border-habito/40 bg-habito/10 px-4 py-4 text-center">
        <p className="text-3xl mb-1">🤝</p>
        <p className="font-semibold">Pronto! Agora vocês compartilham.</p>
        <Link href={linkDoItem(convite)} className="text-sm text-habito hover:underline">
          Abrir {info.rotulo} →
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-base-800 px-4 py-4 transition-all duration-500 ${
        estado === "recusado" ? "opacity-0 -translate-x-6" : "animate-surgir"
      }`}
      style={{ borderColor: `${info.cor}66` }}
    >
      <span aria-hidden className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: info.cor }} />
      <div className="relative flex items-start gap-3">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 animate-boiar"
          style={{ background: `${info.cor}26` }}
        >
          {info.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide" style={{ color: info.cor }}>
            📩 Convite pra compartilhar
          </p>
          <p className="text-[0.95rem] leading-snug mt-0.5">
            <strong>{convite.nome_dono ?? "Alguém"}</strong> quer compartilhar {info.rotulo}{" "}
            {convite.nome_item ? <strong>“{convite.nome_item}”</strong> : null} com você.
          </p>
          <p className="text-xs text-ink-400 mt-1">
            {convite.permissao === "edicao" ? "✏️ Você vai poder ver e editar" : "👀 Você vai poder ver"}
            {convite.tipo_item === "habito" ? " · cada um marca o seu check-in" : ""}
          </p>
        </div>
      </div>
      {erro && <p className="relative text-xs text-red-400 mt-2">{erro}</p>}
      <div className="relative flex gap-2 mt-3.5">
        <button
          type="button"
          onClick={() => responder(false)}
          disabled={estado === "enviando"}
          className="flex-1 rounded-xl border border-base-600 py-2.5 text-sm text-ink-400 hover:text-ink-100 hover:border-ink-400 transition active:scale-95 disabled:opacity-50"
        >
          Recusar
        </button>
        <button
          ref={refAceitar}
          type="button"
          onClick={() => responder(true)}
          disabled={estado === "enviando"}
          className="flex-[1.4] rounded-xl py-2.5 text-sm font-semibold text-base-900 transition active:scale-95 disabled:opacity-60"
          style={{ background: info.cor }}
        >
          {estado === "enviando" ? "Um instante..." : "Aceitar"}
        </button>
      </div>
    </div>
  );
}

/** Lista completa (tela /convites e blocos nas telas). */
export function ConvitesPendentes({ vazio }: { vazio?: React.ReactNode }) {
  const { convites } = useConvitesPendentes();
  const [respondidos, setRespondidos] = useState<string[]>([]);
  if (convites === null) return null;
  const visiveis = convites.filter((c) => !respondidos.includes(c.id));
  if (!visiveis.length) return <>{vazio ?? null}</>;
  return (
    <div className="space-y-3">
      {visiveis.map((c) => (
        <CartaoConvite key={c.id} convite={c} aoResponder={(id) => setRespondidos((r) => [...r, id])} />
      ))}
    </div>
  );
}
