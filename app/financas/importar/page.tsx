import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ImportadorExtrato } from "@/components/ImportadorExtrato";

export default async function ImportarExtratoPage() {
  const supabase = createClient();
  const { data: contas } = await supabase
    .from("financa_contas")
    .select("id, nome")
    .eq("arquivado", false)
    .order("criado_em", { ascending: true });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-2xl mx-auto">
      <Link href="/financas/mais" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Mais
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Importar extrato</h1>
      <p className="text-ink-400 text-sm mb-6">
        Sobe um arquivo OFX (o formato padrão da maioria dos bancos) ou CSV com Data, Descrição e Valor.
      </p>

      {!contas || contas.length === 0 ? (
        <p className="text-ink-400 text-sm">Crie uma conta antes de importar um extrato.</p>
      ) : (
        <ImportadorExtrato contas={contas} />
      )}
    </main>
  );
}
