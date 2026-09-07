// Evita que o Next.js guarde essa página em cache por muito tempo pra
// um "id" específico — sem isso, uma tela editada corrigia no código
// mas continuava mostrando dado antigo pra quem já tinha visitado
// aquele id específico antes da correção.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarCategoria } from "@/app/financas/actions";
import { FormularioCategoria } from "@/components/FormularioCategoria";

export default async function EditarCategoriaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const { data: categoria } = await supabase
    .from("financa_categorias")
    .select("id, nome, tipo, meta_mensal, icone, cor")
    .eq("id", params.id)
    .single();

  if (!categoria) notFound();

  return (
    <FormularioCategoria
      action={atualizarCategoria.bind(null, categoria.id)}
      titulo="Editar categoria"
      textoBotao="Salvar alterações"
      erro={searchParams.erro}
      valoresIniciais={{
        nome: categoria.nome,
        tipo: categoria.tipo,
        metaMensal: categoria.meta_mensal ? String(categoria.meta_mensal).replace(".", ",") : null,
        icone: categoria.icone,
        cor: categoria.cor,
      }}
    />
  );
}
