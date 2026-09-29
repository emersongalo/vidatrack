"use client";

// Etapa 221 — rotina da manhã / da noite: os hábitos um de cada vez.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, SkipForward } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { NOMES_ROTINA, itensDaRotina, rotinaDoMomento, type Rotina } from "@/lib/habitos/rotina";

export default function RotinaPage() {
  return (
    <Suspense fallback={null}>
      <RotinaConteudo />
    </Suspense>
  );
}

function RotinaConteudo() {
  const params = useSearchParams();
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [rotina, setRotina] = useState<Rotina>("manha");
  const [editando, setEditando] = useState(false);
  const [pulados, setPulados] = useState<Set<string>>(new Set());
  const [feitosAgora, setFeitosAgora] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const r = params.get("r");
    setRotina(r === "manha" || r === "noite" ? r : rotinaDoMomento(new Date().getHours()));
  }, [params]);

  if (!snapshot) return <main className="min-h-screen p-6 pagina" />;

  const meuId = snapshot.perfil.id;
  const habitos = snapshot.habitos as any[];
  const itens = itensDaRotina(habitos, snapshot.habitoCheckins, rotina, hoje).map((i) =>
    feitosAgora.has(i.id) ? { ...i, feito: true } : i
  );
  const naRotina = habitos.filter((h) => h.rotina === rotina);
  const proximo = itens.find((i) => !i.feito && !pulados.has(i.id));
  const feitos = itens.filter((i) => i.feito).length;
  const info = NOMES_ROTINA[rotina];

  async function marcar(id: string) {
    setErro(null);
    setOcupado(true);
    try {
      const r = await fetch("/api/widget/marcar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitoId: id, data: hoje, acao: "completar" }),
      });
      if (!r.ok) throw new Error();
      setFeitosAgora((s) => new Set(s).add(id));
      atualizarSnapshotEmTodasAsTelas();
    } catch {
      setErro("Não consegui marcar. Verifique a internet.");
    }
    setOcupado(false);
  }

  async function definirRotina(id: string, valor: Rotina | null) {
    setErro(null);
    const { error } = await createClient().from("habitos").update({ rotina: valor }).eq("id", id);
    if (error) setErro("Não consegui salvar. Verifique a internet.");
    else atualizarSnapshotEmTodasAsTelas();
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/habitos" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Hoje
      </Link>
      <div className="flex gap-2 mt-3 mb-4">
        {(["manha", "noite"] as Rotina[]).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRotina(r);
              setPulados(new Set());
            }}
            className={`text-sm rounded-full px-3.5 py-1.5 border ${
              rotina === r ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400"
            }`}
          >
            {NOMES_ROTINA[r].emoji} {r === "manha" ? "Manhã" : "Noite"}
          </button>
        ))}
      </div>
      <h1 className="text-3xl font-display font-bold mb-1">
        {info.emoji} {info.nome}
      </h1>

      {erro && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 my-3">{erro}</p>}

      {editando || naRotina.length === 0 ? (
        <div className="mt-3">
          <p className="text-sm text-ink-400 mb-3">
            {naRotina.length === 0 ? "Escolha os hábitos que fazem parte dessa rotina:" : "Hábitos dessa rotina:"}
          </p>
          <ul className="space-y-1.5">
            {habitos
              .filter((h) => !h.eh_negativo)
              .map((h) => {
                const minha = h.dono_id === meuId;
                const outra = h.rotina && h.rotina !== rotina;
                return (
                  <li key={h.id}>
                    <label className={`flex items-center gap-3 bg-base-800 border border-base-600 rounded-2xl p-4 ${minha ? "cursor-pointer" : "opacity-50"}`}>
                      <input
                        type="checkbox"
                        disabled={!minha}
                        checked={h.rotina === rotina}
                        onChange={(e) => definirRotina(h.id, e.target.checked ? rotina : null)}
                      />
                      <span className="text-sm flex-1 truncate">{h.nome}</span>
                      {outra && <span className="text-xs text-ink-400">{NOMES_ROTINA[h.rotina as Rotina].emoji} na outra</span>}
                    </label>
                  </li>
                );
              })}
          </ul>
          {naRotina.length > 0 && (
            <button onClick={() => setEditando(false)} className="mt-4 w-full bg-habito text-base-900 font-medium rounded-2xl py-3.5">
              Começar a rotina
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-400 mb-5">
            {itens.length === 0 ? "Nenhum hábito dessa rotina cai hoje." : `${feitos} de ${itens.length} feitos`}
          </p>
          {itens.length > 0 && (
            <div className="h-2 bg-base-700 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-habito rounded-full transition-all" style={{ width: `${(feitos / itens.length) * 100}%` }} />
            </div>
          )}

          {proximo ? (
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-6 text-center">
              <p className="text-xs text-ink-400 mb-2">Agora</p>
              <p className="text-xl font-display font-semibold mb-1">{proximo.nome}</p>
              {proximo.meta > 1 && (
                <p className="text-xs text-ink-400">
                  {proximo.atual}/{proximo.meta} — marcar completa a meta do dia
                </p>
              )}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setPulados((s) => new Set(s).add(proximo.id))}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-base-600 rounded-lg py-3 text-sm text-ink-400"
                >
                  <SkipForward size={16} /> Pular
                </button>
                <button
                  disabled={ocupado}
                  onClick={() => marcar(proximo.id)}
                  className="flex-[2] flex items-center justify-center gap-1.5 bg-habito text-base-900 font-semibold rounded-lg py-3 disabled:opacity-50"
                >
                  <Check size={18} /> Feito
                </button>
              </div>
            </div>
          ) : itens.length > 0 ? (
            <div className="bg-base-800 border border-habito/40 rounded-xl2 p-6 text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-medium">
                {feitos === itens.length ? "Rotina completa!" : `Fim da rotina — ${itens.length - feitos} ficou pra depois.`}
              </p>
              {pulados.size > 0 && (
                <button onClick={() => setPulados(new Set())} className="text-xs text-ink-400 mt-3">
                  Rever os que pulei
                </button>
              )}
            </div>
          ) : null}

          <ul className="mt-6 space-y-1">
            {itens.map((i) => (
              <li key={i.id} className={`text-sm flex items-center gap-2 ${i.feito ? "text-ink-400 line-through" : ""}`}>
                <span>{i.feito ? "✓" : pulados.has(i.id) ? "↷" : "○"}</span> {i.nome}
              </li>
            ))}
          </ul>
          <button onClick={() => setEditando(true)} className="text-xs text-ink-400 hover:text-ink-100 mt-6">
            Escolher hábitos da rotina
          </button>
        </>
      )}
    </main>
  );
}
