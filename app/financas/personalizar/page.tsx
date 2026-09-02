import { createClient } from "@/lib/supabase/server";
import { LinkVoltar } from "@/components/LinkVoltar";
import { ReordenarBlocosFinancas } from "@/components/ReordenarBlocosFinancas";
import { normalizarOrdemBlocos } from "@/lib/financas/blocos";

export default async function PersonalizarFinancasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("ordem_blocos_financas")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const ordem = normalizarOrdemBlocos(perfil?.ordem_blocos_financas ?? null);

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <LinkVoltar href="/financas" texto="Finanças" />
      <h1 className="text-2xl font-display font-semibold mt-4 mb-2">Personalizar ordem</h1>
      <p className="text-ink-400 text-sm mb-6">
        Use as setinhas ↑ ↓ pra reorganizar como os blocos aparecem na
        tela de Finanças, a partir do calendário pra baixo. Salva
        sozinho a cada troca.
      </p>

      <ReordenarBlocosFinancas ordemInicial={ordem} />
    </main>
  );
}
