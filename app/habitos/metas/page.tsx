"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Minus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { progressoMeta, type MetaLonga } from "@/lib/habitos/metasLongas";

// Etapa 218 — metas de longo prazo: "Ler 12 livros no ano", "Correr 500 km"
const STATUS = {
  concluida: { texto: "Concluída 🎉", cor: "text-habito" },
  adiantada: { texto: "Adiantada 🚀", cor: "text-habito" },
  no_ritmo: { texto: "No ritmo ✓", cor: "text-ink-100" },
  atrasada: { texto: "Um pouco atrás", cor: "text-financa" },
  encerrada: { texto: "Prazo acabou", cor: "text-ink-400" },
} as const;

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));

export default function MetasLongasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const hoje = hojeISO();
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const metas = (snapshot?.metasLongas ?? []) as MetaLonga[];
  const habitos = (snapshot?.habitos ?? []) as any[];
  const checkins = (snapshot?.habitoCheckins ?? []).filter((c: any) => !c.usuario_id || c.usuario_id === snapshot?.perfil.id);

  async function executar(acao: () => PromiseLike<{ error: unknown }>) {
    setErro(null);
    const { error } = await acao();
    if (error) {
      setErro("Não consegui salvar. Verifique a internet.");
      return false;
    }
    await atualizarSnapshotEmTodasAsTelas();
    recarregar();
    return true;
  }

  async function criar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const alvo = Number(String(f.get("alvo")).replace(",", "."));
    const nome = String(f.get("nome") ?? "").trim();
    if (!nome || !(alvo > 0)) return setErro("Dê um nome e um alvo maior que zero.");
    setCriando(true);
    const ok = await executar(() =>
      createClient()
        .from("metas_longas")
        .insert({
          dono_id: snapshot?.perfil.id,
          nome,
          emoji: String(f.get("emoji") ?? "").trim() || null,
          alvo,
          unidade: String(f.get("unidade") ?? "").trim() || null,
          data_inicio: String(f.get("inicio")) || hoje,
          data_fim: String(f.get("fim")),
          habito_id: String(f.get("habito") ?? "") || null,
        })
    );
    setCriando(false);
    if (ok) (ev.target as HTMLFormElement).reset();
  }

  const somar = (m: MetaLonga, delta: number) =>
    executar(() => createClient().from("metas_longas").update({ progresso: Math.max(0, Number(m.progresso) + delta) }).eq("id", m.id));
  const arquivar = (m: MetaLonga) => executar(() => createClient().from("metas_longas").update({ arquivada: true }).eq("id", m.id));

  const fimAno = `${hoje.slice(0, 4)}-12-31`;
  const campo = "w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 outline-none focus:border-ink-100";

  return (
    <main className="min-h-screen p-6 md:p-12 pagina pb-16">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Estatísticas
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Metas de longo prazo</h1>
      <p className="text-ink-400 text-sm mb-6">
        Objetivos maiores, tipo “Ler 12 livros no ano” ou “Correr 500 km”. Ligue a um hábito pra contar sozinho, ou some na mão.
      </p>
      {erro && <p className="text-sm text-red-400 mb-3">{erro}</p>}

      {metas.length > 0 && (
        <ul className="space-y-3 mb-8 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {metas.map((m) => {
            const p = progressoMeta(m, checkins as any, hoje);
            const habito = m.habito_id ? habitos.find((h) => h.id === m.habito_id) : null;
            const st = STATUS[p.status];
            const unidade = m.unidade ? ` ${m.unidade}` : "";
            return (
              <li key={m.id} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium">
                    {m.emoji ? `${m.emoji} ` : ""}
                    {m.nome}
                  </p>
                  <span className={`text-xs shrink-0 ${st.cor}`}>{st.texto}</span>
                </div>
                <div className="relative h-2.5 bg-base-600 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-y-0 left-0 bg-habito rounded-full" style={{ width: `${p.pct}%` }} />
                  <div
                    className="absolute inset-y-0 w-0.5 bg-ink-100/60"
                    style={{ left: `${Math.min(100, (p.esperado / Number(m.alvo)) * 100)}%` }}
                    title="Onde deveria estar hoje"
                  />
                </div>
                <p className="text-sm font-mono">
                  {fmt(p.feito)} / {fmt(Number(m.alvo))}
                  {unidade} <span className="text-xs text-ink-400 font-body">({p.pct}%)</span>
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  Até {m.data_fim.split("-").reverse().join("/")}
                  {p.porSemana !== null && ` · ~${fmt(p.porSemana)}${unidade} por semana pra chegar lá`}
                  {habito && ` · conta sozinho pelo hábito "${habito.nome}"`}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {!m.habito_id && (
                    <>
                      <button type="button" aria-label="Menos 1" onClick={() => somar(m, -1)} className="w-9 h-9 rounded-lg border border-base-600 flex items-center justify-center">
                        <Minus size={16} />
                      </button>
                      <button type="button" onClick={() => somar(m, 1)} className="h-9 px-3 rounded-lg bg-habito text-base-900 font-medium text-sm flex items-center gap-1">
                        <Plus size={16} /> 1{unidade}
                      </button>
                    </>
                  )}
                  <button type="button" aria-label="Arquivar meta" onClick={() => arquivar(m)} className="ml-auto text-ink-400 hover:text-red-400 p-2">
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={criar} className="bg-base-800 border border-base-600 rounded-xl2 p-4 space-y-3 max-w-xl">
        <p className="text-sm text-ink-400">Nova meta</p>
        <div className="flex gap-2">
          <input name="emoji" maxLength={4} placeholder="📚" className={`${campo} w-14 text-center`} />
          <input name="nome" required maxLength={80} placeholder="Ex: Ler 12 livros" className={campo} />
        </div>
        <div className="flex gap-2">
          <input name="alvo" required inputMode="decimal" placeholder="Alvo (ex: 12)" className={campo} />
          <input name="unidade" maxLength={30} placeholder="unidade (livros, km...)" className={campo} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-ink-400">
            Começa
            <input name="inicio" type="date" defaultValue={hoje} className={`${campo} mt-1`} />
          </label>
          <label className="text-xs text-ink-400">
            Termina
            <input name="fim" type="date" required defaultValue={fimAno} className={`${campo} mt-1`} />
          </label>
        </div>
        <label className="block text-xs text-ink-400">
          Contar automático por um hábito (opcional)
          <select name="habito" defaultValue="" className={`${campo} mt-1`}>
            <option value="">Não — eu somo na mão</option>
            {habitos
              .filter((h) => !h.eh_negativo)
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nome}
                  {h.meta_diaria > 1 && h.unidade ? ` (soma ${h.unidade})` : " (1 por dia feito)"}
                </option>
              ))}
          </select>
        </label>
        <button type="submit" disabled={criando} className="w-full bg-ink-100 text-base-900 font-medium rounded-2xl py-3.5 disabled:opacity-50">
          {criando ? "Criando..." : "Criar meta"}
        </button>
      </form>
    </main>
  );
}
