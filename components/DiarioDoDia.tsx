"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { HUMORES } from "@/lib/habitos/diario";
import type { SnapshotOffline } from "@/lib/offline/snapshot";

// Etapa 215 — "Como foi seu dia?" na tela Hoje: um toque no humor e,
// se quiser, uma frase. Um registro por dia.
export function DiarioDoDia({ snapshot, dataISO, hojeISO }: { snapshot: SnapshotOffline; dataISO: string; hojeISO: string }) {
  const salvo = (snapshot.diario ?? []).find((d) => d.data === dataISO) ?? null;
  const [humor, setHumor] = useState<number | null>(salvo?.humor ?? null);
  const [texto, setTexto] = useState(salvo?.texto ?? "");
  const [mostrarTexto, setMostrarTexto] = useState(!!salvo?.texto);
  const [estado, setEstado] = useState<"parado" | "salvando" | "salvo" | "erro">("parado");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setHumor(salvo?.humor ?? null);
    setTexto(salvo?.texto ?? "");
    setMostrarTexto(!!salvo?.texto);
    setEstado("parado");
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataISO, salvo?.humor, salvo?.texto]);

  if (dataISO > hojeISO) return null;

  async function salvar(novoHumor: number, novoTexto: string) {
    if (!navigator.onLine) {
      setEstado("erro");
      setErro("Sem internet — o diário salva quando a conexão voltar. Tente de novo daqui a pouco.");
      return;
    }
    setEstado("salvando");
    setErro(null);
    const { error } = await createClient()
      .from("diario_dias")
      .upsert(
        {
          dono_id: snapshot.perfil.id,
          data: dataISO,
          humor: novoHumor,
          texto: novoTexto.trim() ? novoTexto.trim().slice(0, 1000) : null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "dono_id,data" }
      );
    if (error) {
      setEstado("erro");
      setErro("Não consegui salvar. Tente de novo.");
      return;
    }
    setEstado("salvo");
    atualizarSnapshotEmTodasAsTelas();
  }

  const ehHoje = dataISO === hojeISO;

  return (
    <section className="mt-6 bg-base-800 border border-base-600 rounded-xl2 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">{ehHoje ? "Como está seu dia?" : "Como foi esse dia?"}</p>
        <Link href="/habitos/diario" className="text-xs text-ink-400 hover:text-ink-100 transition">
          Diário →
        </Link>
      </div>
      <div className="flex justify-between gap-1">
        {HUMORES.map((h) => (
          <button
            key={h.valor}
            type="button"
            aria-label={h.nome}
            aria-pressed={humor === h.valor}
            onClick={() => {
              setHumor(h.valor);
              salvar(h.valor, texto);
            }}
            className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 transition border ${
              humor === h.valor ? "border-nota bg-nota-soft scale-105" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-2xl leading-none">{h.emoji}</span>
            <span className="text-[10px] text-ink-400">{h.nome}</span>
          </button>
        ))}
      </div>

      {humor !== null && !mostrarTexto && (
        <button type="button" onClick={() => setMostrarTexto(true)} className="text-xs text-nota mt-3 hover:underline">
          + Escrever uma frase sobre o dia
        </button>
      )}
      {humor !== null && mostrarTexto && (
        <div className="mt-3">
          {/* Etapa 232 — caixa maior pra escrever sobre o dia (até 1000 letras) */}
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => texto !== (salvo?.texto ?? "") && salvar(humor, texto)}
            maxLength={1000}
            rows={4}
            placeholder="Ex: treinei cedo e rendi muito no trabalho"
            className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3 text-base outline-none focus:border-ink-100 resize-y min-h-[6.5rem] max-h-72"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs ${texto.length > 950 ? "text-red-400" : "text-ink-400"}`}>{texto.length}/1000</span>
            <button
              type="button"
              onClick={() => salvar(humor, texto)}
              className="text-sm px-4 py-2 rounded-xl bg-nota text-base-900 font-semibold"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
      <p className="text-xs mt-2 h-4 text-ink-400">
        {estado === "salvando" ? "Salvando…" : estado === "salvo" ? "✓ Guardado no seu diário" : estado === "erro" ? <span className="text-red-400">{erro}</span> : ""}
      </p>
    </section>
  );
}
