"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { createClient } from "@/lib/supabase/client";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { GradeDia } from "@/components/GradeDia";

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

  useEffect(() => {
    let cancelado = false;
    const supabase = createClient();
    supabase
      .from("blocos_tempo")
      .select("id, titulo, hora_inicio, hora_fim, cor")
      .eq("data", dataSelecionada)
      .order("hora_inicio")
      .then(({ data }) => {
        if (!cancelado) setBlocos(data ?? []);
      });
    return () => {
      cancelado = true;
    };
  }, [dataSelecionada]);

  return (
    <main className="max-w-2xl lg:max-w-4xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/habitos" className="text-ink-400 text-sm hover:text-ink-100 transition">
            ← Hoje
          </Link>
          <h1 className="text-2xl font-display font-semibold mt-2">Planejador</h1>
        </div>
      </div>

      <TiraDeDiasAgenda
        dataSelecionada={dataSelecionada}
        hojeISO={hoje}
        caminhoBase="/habitos/planejador"
        aoSelecionarData={setDataSelecionada}
      />

      <p className="text-xs text-ink-400 my-4">
        Arraste na grade pra criar um bloco. Arraste um bloco existente pra mover, ou puxe a base pra redimensionar.
        Clique duas vezes no título pra renomear.
      </p>

      <GradeDia blocos={blocos} dataISO={dataSelecionada} ehHoje={dataSelecionada === hoje} />
    </main>
  );
}
