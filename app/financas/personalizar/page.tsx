"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkVoltar } from "@/components/LinkVoltar";
import { ReordenarBlocosFinancas } from "@/components/ReordenarBlocosFinancas";
import { lerLayoutBlocos, type BlocoFinancas } from "@/lib/financas/blocos";

// Etapa 133 — busca direto (preferência pessoal, por login).
// Etapa 222 — vale pra todos os blocos da tela, e dá pra esconder.
export default function PersonalizarFinancasPage() {
  const [ordem, setOrdem] = useState<BlocoFinancas[] | null>(null);

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
      setOrdem(lerLayoutBlocos(perfil?.ordem_blocos_financas ?? null));
    })();
  }, []);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-curta">
      <LinkVoltar href="/financas" texto="Finanças" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Personalizar ordem</h1>
      <p className="text-ink-400 text-sm mb-6">
        Organize os blocos da tela de Finanças: 📌 fixa no topo, ↑ ↓ muda a ordem e 👁 esconde. Vale só pro seu login e salva sozinho a cada troca. Também dá pra fazer direto na tela, em “Personalizar início”.
      </p>

      {ordem && <ReordenarBlocosFinancas layoutInicial={ordem} />}
    </main>
  );
}
