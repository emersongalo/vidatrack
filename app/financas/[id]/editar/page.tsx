import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarTransacao } from "../../actions";
import { FormularioTransacao } from "@/components/FormularioTransacao";

export default async function EditarTransacaoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  const [{ data: transacao }, { data: contas }, { data: categorias }] = await Promise.all([
    supabase
      .from("financa_transacoes")
      .select("id, tipo, valor, conta_id, categoria_id, descricao, data")
      .eq("id", params.id)
      .single(),
    supabase.from("financa_contas").select("id, nome").eq("arquivado", false).order("criado_em"),
    supabase.from("financa_categorias").select("id, nome, tipo").order("nome"),
  ]);

  if (!transacao) notFound();

  return (
    <FormularioTransacao
      contas={contas ?? []}
      categorias={categorias ?? []}
      erro={searchParams.erro}
      action={atualizarTransacao.bind(null, transacao.id)}
      titulo="Editar lançamento"
      textoBotao="Salvar alterações"
      voltarHref="/financas"
      valoresIniciais={{
        tipo: transacao.tipo,
        valor: String(transacao.valor).replace(".", ","),
        contaId: transacao.conta_id,
        categoriaId: transacao.categoria_id,
        data: transacao.data,
        descricao: transacao.descricao,
      }}
    />
  );
}
