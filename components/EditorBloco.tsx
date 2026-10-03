"use client";

// Etapa 245 — editar/criar bloco do Planejador numa folha (funciona no
// celular: toque, sem precisar arrastar nem clicar duas vezes).
import { useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { CORES_DISPONIVEIS, hexDaCor } from "@/lib/agenda/estilo";
import { criarBloco, atualizarBloco, removerBloco } from "@/app/habitos/planejador/actions";
import { horaParaMinutosDoDia, minutosParaHora } from "@/lib/planejador/tempo";

export type RascunhoBloco = { id?: string; titulo: string; inicio: string; fim: string; cor: string };

const SUGESTOES = ["Trabalho", "Estudo", "Treino", "Leitura", "Almoço", "Família", "Descanso", "Oração"];

export function EditorBloco({
  rascunho,
  dataISO,
  aoFechar,
  aoSalvar,
}: {
  rascunho: RascunhoBloco;
  dataISO: string;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [titulo, setTitulo] = useState(rascunho.titulo);
  const [inicio, setInicio] = useState(rascunho.inicio.slice(0, 5));
  const [fim, setFim] = useState(rascunho.fim.slice(0, 5));
  const [cor, setCor] = useState(rascunho.cor);
  const [salvando, setSalvando] = useState(false);
  const tocouNoFundo = useRef(false);
  const [erro, setErro] = useState<string | null>(null);
  const novo = !rascunho.id;

  function ajustarDuracao(min: number) {
    setFim(minutosParaHora(Math.min(24 * 60, horaParaMinutosDoDia(inicio) + min)));
  }

  async function salvar() {
    if (horaParaMinutosDoDia(fim) <= horaParaMinutosDoDia(inicio)) return setErro("O fim precisa ser depois do começo");
    setSalvando(true);
    setErro(null);
    try {
      if (novo) await criarBloco({ data: dataISO, horaInicio: inicio, horaFim: fim, titulo: titulo.trim() || "Bloco", cor });
      else {
        const r = await atualizarBloco(rascunho.id!, { titulo, horaInicio: inicio, horaFim: fim, cor });
        if (r.erro) throw new Error(r.erro);
      }
      aoSalvar();
      aoFechar();
    } catch {
      setErro("Não salvou — confira a internet");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!rascunho.id) return;
    setSalvando(true);
    await removerBloco(rascunho.id);
    setSalvando(false);
    aoSalvar();
    aoFechar();
  }

  const campo = "w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3 text-base text-ink-100 outline-none focus:border-ink-100";

  return (
    <div
      className="animate-fundo fixed inset-0 z-[65] bg-black/60 flex items-end sm:items-center justify-center"
      // Etapa 246 — só fecha se o toque COMEÇOU no fundo (o toque que abriu
      // o editor não pode fechá-lo)
      onPointerDown={(e) => (tocouNoFundo.current = e.target === e.currentTarget)}
      onClick={(e) => {
        if (e.target === e.currentTarget && tocouNoFundo.current) aoFechar();
        tocouNoFundo.current = false;
      }}
    >
      <div
        className="animate-folha w-full max-w-md bg-base-800 border border-base-600 rounded-t-3xl sm:rounded-3xl p-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">{novo ? "Novo bloco" : "Editar bloco"}</h2>
          <button onClick={aoFechar} aria-label="Fechar" className="text-ink-400 p-1">
            <X size={22} />
          </button>
        </div>

        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="O que você vai fazer?" maxLength={60} autoFocus={novo} className={campo} />
        <div className="flex gap-2 overflow-x-auto mt-2 pb-1 -mx-1 px-1" data-gesto-proprio="1">
          {SUGESTOES.map((s) => (
            <button key={s} type="button" onClick={() => setTitulo(s)} className="shrink-0 text-sm rounded-full border border-base-600 px-3 py-1.5 text-ink-400">
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <label className="text-sm text-ink-400">
            Começa
            <input type="time" step={900} value={inicio} onChange={(e) => setInicio(e.target.value)} className={`${campo} mt-1`} />
          </label>
          <label className="text-sm text-ink-400">
            Termina
            <input type="time" step={900} value={fim} onChange={(e) => setFim(e.target.value)} className={`${campo} mt-1`} />
          </label>
        </div>
        <div className="flex gap-2 mt-2">
          {[15, 30, 60, 90, 120].map((m) => (
            <button key={m} type="button" onClick={() => ajustarDuracao(m)} className="flex-1 text-sm rounded-xl border border-base-600 py-2 text-ink-400">
              {m < 60 ? `${m}min` : `${m / 60}h`.replace(".5", "h30").replace("hh", "h")}
            </button>
          ))}
        </div>

        <p className="text-sm text-ink-400 mt-4 mb-2">Cor</p>
        <div className="flex gap-2 flex-wrap">
          {CORES_DISPONIVEIS.map((c) => (
            <button
              key={c.valor}
              type="button"
              onClick={() => setCor(c.valor)}
              aria-label={c.valor}
              className={`w-9 h-9 rounded-full ${c.classe} ${cor === c.valor ? "ring-2 ring-offset-2 ring-offset-base-800 ring-ink-100" : ""}`}
            />
          ))}
        </div>

        {erro && <p className="text-sm text-red-400 mt-3">{erro}</p>}
        <div className="flex gap-2 mt-5">
          {!novo && (
            <button type="button" onClick={excluir} disabled={salvando} aria-label="Excluir bloco" className="w-14 rounded-2xl border border-red-400/40 text-red-400 flex items-center justify-center">
              <Trash2 size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="flex-1 rounded-2xl py-3.5 text-base font-semibold text-base-900 disabled:opacity-50"
            style={{ background: hexDaCor(cor) }}
          >
            {salvando ? "Salvando..." : novo ? "Criar bloco" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
