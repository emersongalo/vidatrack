import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/habitos/streak";
import { FormularioTarefa } from "@/components/FormularioTarefa";

export default async function NovaTarefaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();
  const { data: categorias } = await supabase
    .from("categorias_produtividade")
    .select("id, nome")
    .order("nome");

  return (
    <FormularioTarefa categorias={categorias ?? []} erro={searchParams.erro} hoje={hojeISO()} />
  );
}
