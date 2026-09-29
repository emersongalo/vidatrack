"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { adicionarPausa, encerrarPausas, pausaAtualOuFutura, pausasDe } from "@/lib/habitos/pausa";
import { hojeISO } from "@/lib/habitos/streak";

// Etapa 218 — pausar um hábito (ou todos: modo férias) sem perder a sequência
function somarDias(iso: string, n: number) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + n)).toISOString().slice(0, 10);
}
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

async function salvarPausas(itens: { id: string; pausas: unknown }[]): Promise<string | null> {
  const supabase = createClient();
  for (const it of itens) {
    const { error } = await supabase.from("habitos").update({ pausas: it.pausas }).eq("id", it.id);
    if (error) return "Não consegui salvar. Verifique a internet.";
  }
  atualizarSnapshotEmTodasAsTelas();
  return null;
}

function EscolherFim({ aoConfirmar, rotulo, desativado }: { aoConfirmar: (fim: string) => void; rotulo: string; desativado?: boolean }) {
  const hoje = hojeISO();
  const [fim, setFim] = useState(somarDias(hoje, 6));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[3, 7, 15].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setFim(somarDias(hoje, n - 1))}
          className={`text-xs rounded-full px-2.5 py-1 border ${fim === somarDias(hoje, n - 1) ? "border-habito text-habito" : "border-base-600 text-ink-400"}`}
        >
          {n} dias
        </button>
      ))}
      <label className="text-xs text-ink-400 flex items-center gap-1">
        até
        <input
          type="date"
          min={hoje}
          value={fim}
          onChange={(e) => e.target.value && setFim(e.target.value)}
          className="bg-base-900 border border-base-600 rounded-lg px-2 py-1 text-ink-100 text-xs"
        />
      </label>
      <button
        type="button"
        disabled={desativado || fim < hoje}
        onClick={() => aoConfirmar(fim)}
        className="text-xs bg-habito text-base-900 font-medium rounded-lg px-3 py-1.5 disabled:opacity-50"
      >
        {rotulo}
      </button>
    </div>
  );
}

/** Na tela de editar hábito */
export function PausarHabito({ habito }: { habito: { id: string; pausas?: unknown } }) {
  const hoje = hojeISO();
  const [pausas, setPausas] = useState(pausasDe(habito));
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const atual = pausaAtualOuFutura({ pausas }, hoje);

  async function aplicar(novas: typeof pausas) {
    setSalvando(true);
    setErro(null);
    const e = await salvarPausas([{ id: habito.id, pausas: novas }]);
    setSalvando(false);
    if (e) return setErro(e);
    setPausas(novas);
    setAberto(false);
  }

  return (
    <section className="mt-10 pt-6 border-t border-base-600 max-w-xl">
      <h2 className="font-display font-semibold">⏸ Pausar hábito</h2>
      <p className="text-xs text-ink-400 mt-1 mb-3">
        Viagem, férias ou doença: durante a pausa o hábito não aparece em Hoje, não manda lembrete e não quebra a sequência.
      </p>
      {atual ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-habito">
            {atual.inicio <= hoje ? "Pausado" : `Pausa marcada de ${ddmm(atual.inicio)}`} até {ddmm(atual.fim)}
          </span>
          <button
            type="button"
            disabled={salvando}
            onClick={() => aplicar(encerrarPausas(pausas, hoje))}
            className="text-xs border border-base-600 rounded-lg px-3 py-1.5"
          >
            Retomar agora
          </button>
        </div>
      ) : aberto ? (
        <EscolherFim rotulo="Pausar" desativado={salvando} aoConfirmar={(fim) => aplicar(adicionarPausa(pausas, hoje, fim))} />
      ) : (
        <button type="button" onClick={() => setAberto(true)} className="text-sm border border-base-600 rounded-lg px-4 py-2">
          Pausar por uns dias
        </button>
      )}
      {erro && <p className="text-sm text-red-400 mt-2">{erro}</p>}
    </section>
  );
}

/** Na lista de hábitos: pausa todos de uma vez */
export function ModoFerias({ habitos }: { habitos: { id: string; pausas?: unknown }[] }) {
  const hoje = hojeISO();
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const pausados = habitos.filter((h) => pausaAtualOuFutura(h, hoje));
  const todosPausados = habitos.length > 0 && pausados.length === habitos.length;
  const fimComum = todosPausados ? pausaAtualOuFutura(habitos[0], hoje)?.fim : null;

  async function pausarTodos(fim: string) {
    setSalvando(true);
    setErro(null);
    const e = await salvarPausas(habitos.map((h) => ({ id: h.id, pausas: adicionarPausa(pausasDe(h), hoje, fim) })));
    setSalvando(false);
    if (e) return setErro(e);
    setAberto(false);
  }
  async function retomarTodos() {
    setSalvando(true);
    setErro(null);
    const e = await salvarPausas(pausados.map((h) => ({ id: h.id, pausas: encerrarPausas(pausasDe(h), hoje) })));
    setSalvando(false);
    if (e) setErro(e);
  }

  if (!habitos.length) return null;
  return (
    <div className="mb-4 bg-base-800 border border-base-600 rounded-xl2 p-3">
      {pausados.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            🏖️ {todosPausados ? `Modo férias até ${fimComum ? ddmm(fimComum) : "—"}` : `${pausados.length} hábito(s) pausado(s)`}
          </span>
          <button type="button" disabled={salvando} onClick={retomarTodos} className="text-xs border border-base-600 rounded-lg px-3 py-1.5">
            Retomar {todosPausados ? "todos" : "os pausados"}
          </button>
        </div>
      ) : aberto ? (
        <div>
          <p className="text-sm mb-2">🏖️ Pausar todos os hábitos até:</p>
          <EscolherFim rotulo="Ativar modo férias" desativado={salvando} aoConfirmar={pausarTodos} />
        </div>
      ) : (
        <button type="button" onClick={() => setAberto(true)} className="text-sm text-ink-400 hover:text-ink-100">
          🏖️ Modo férias — pausar todos sem perder as sequências
        </button>
      )}
      {erro && <p className="text-sm text-red-400 mt-2">{erro}</p>}
    </div>
  );
}
