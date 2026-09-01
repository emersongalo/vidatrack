import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PainelCompartilhamento } from "@/components/PainelCompartilhamento";

export default async function CompartilharHabitoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: habito } = await supabase
    .from("habitos")
    .select("id, nome")
    .eq("id", params.id)
    .single();

  if (!habito) notFound();

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md mx-auto">
      <Link href="/habitos/lista" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Hábitos
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Compartilhar</h1>
      <p className="text-ink-400 text-sm mb-6">{habito.nome}</p>

      <PainelCompartilhamento
        tipoItem="habito"
        itemId={habito.id}
        caminhoRetorno={`/habitos/${habito.id}/compartilhar`}
        erro={searchParams.erro}
      />
    </main>
  );
}
