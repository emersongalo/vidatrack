"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { createClient } from "@/lib/supabase/client";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { GradeDia } from "@/components/GradeDia";
import { EditorBloco, type RascunhoBloco } from "@/components/EditorBloco";
import { Plus } from "lucide-react";

// Etapa 128 — feature mais de planejamento do que de uso no meio do
// dia sem sinal, então não entrou no retrato offline principal: busca
// direto no navegador pro dia selecionado. Sem internet, simplesmente
// abre a grade vazia (dá pra criar blocos assim que a conexão voltar)
// em vez de travar a página inteira.
export default function PlanejadorPage() {
  return (
    <Suspense fallback={null}>
      <PlanejadorConteudo />
    </Suspense>
  );
}

function PlanejadorConteudo() {
  const searchParams = useSearchParams();
  const hoje = hojeISO();
  const [dataSelecionada, setDataSelecionada] = useState(searchParams.get("data") || hoje);
  const [blocos, setBlocos] = useState<any[]>([]);
  const [rascunho, setRascunho] = useState<RascunhoBloco | null>(null);

  // Etapa 245 — antes a lista só era buscada uma vez: criar/editar um bloco
  // salvava no banco mas não aparecia na tela (parecia que "não fazia nada").
  const recarregar = useCallback(() => {
    createClient()
      .from("blocos_tempo")
      .select("id, titulo, hora_inicio, hora_fim, cor")
      .eq("data", dataSelecionada)
      .order("hora_inicio")
      .then(({ data }) => setBlocos(data ?? []));
  }, [dataSelecionada]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  function novoAgora() {
    const agora = new Date();
    const min = Math.max(5 * 60, Math.ceil((agora.getHours() * 60 + agora.getMinutes()) / 15) * 15);
    const hh = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    setRascunho({ titulo: "", inicio: hh(Math.min(min, 23 * 60)), fim: hh(Math.min(min + 60, 24 * 60 - 1)), cor: "habito" });
  }

  return (
    <main className="pagina px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/habitos" className="text-ink-400 text-base hover:text-ink-100 transition">
            ← Hoje
          </Link>
          <h1 className="text-3xl font-display font-bold mt-2">Planejador</h1>
        </div>
        <button
          type="button"
          onClick={novoAgora}
          className="flex items-center gap-1.5 bg-habito text-base-900 font-semibold rounded-2xl px-4 py-2.5"
        >
          <Plus size={18} /> Bloco
        </button>
      </div>

      <TiraDeDiasAgenda
        dataSelecionada={dataSelecionada}
        hojeISO={hoje}
        caminhoBase="/habitos/planejador"
        aoSelecionarData={setDataSelecionada}
      />

      <p className="text-sm text-ink-400 my-4">
        Separe seu dia em blocos de tempo. <b className="text-ink-100">Toque num horário</b> pra criar um bloco ali, ou toque num bloco
        pra mudar nome, horário, cor ou apagar. No computador também dá pra arrastar.
      </p>
      {blocos.length > 0 && (
        <p className="text-sm text-ink-400 mb-3">
          {blocos.length} {blocos.length === 1 ? "bloco" : "blocos"} ·{" "}
          {(() => {
            const m = blocos.reduce((t, b) => {
              const [h1, m1] = String(b.hora_inicio).split(":").map(Number);
              const [h2, m2] = String(b.hora_fim).split(":").map(Number);
              return t + Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1));
            }, 0);
            return `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""} planejadas`;
          })()}
        </p>
      )}

      <GradeDia blocos={blocos} dataISO={dataSelecionada} ehHoje={dataSelecionada === hoje} aoAbrir={setRascunho} aoMudar={recarregar} />
      <div className="h-8" />

      {rascunho && (
        <EditorBloco
          key={rascunho.id ?? rascunho.inicio}
          rascunho={rascunho}
          dataISO={dataSelecionada}
          aoFechar={() => setRascunho(null)}
          aoSalvar={recarregar}
        />
      )}
    </main>
  );
}
