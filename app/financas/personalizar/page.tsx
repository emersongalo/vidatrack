"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkVoltar } from "@/components/LinkVoltar";
import { ReordenarBlocosFinancas } from "@/components/ReordenarBlocosFinancas";
import { normalizarOrdemBlocos, type BlocoFinancasId } from "@/lib/financas/blocos";

// Etapa 133 — busca direto (preferência pessoal simples, não vale a
// pena guardar no retrato principal). O calendário de gastos ainda
// não voltou pra tela de Início local-first (Etapa 127), então por
// enquanto só a ordem de Gráfico/Lançamentos tem efeito de verdade —
// isso é uma limitação conhecida, não um bug.
export default function PersonalizarFinancasPage() {
  const [ordem, setOrdem] = useState<BlocoFinancasId[] | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: perfil } = await supabase
        .from("perfis")
        .select("ordem_blocos_financas")
        .eq("id", user?.id ?? "")
        .maybeSingle();
      setOrdem(normalizarOrdemBlocos(perfil?.ordem_blocos_financas ?? null));
    })();
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <LinkVoltar href="/financas" texto="Finanças" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Personalizar ordem</h1>
      <p className="text-ink-400 text-sm mb-6">
        Use as setinhas ↑ ↓ pra reorganizar como Gráfico e Lançamentos aparecem na tela de Finanças. Salva
        sozinho a cada troca.
      </p>

      {ordem && <ReordenarBlocosFinancas ordemInicial={ordem} />}
    </main>
  );
}
