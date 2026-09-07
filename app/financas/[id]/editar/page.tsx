import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarTransacao } from "../../actions";
import { FormularioTransacao } from "@/components/FormularioTransacao";

// Sem isso, o Next.js pode guardar em cache a resposta da consulta
// pra um "id" específico (a URL dessa página muda por lançamento) —
// se alguém visitou essa tela ANTES de uma correção no código, ela
// podia ficar "presa" numa versão antiga pra sempre, mesmo com o
// código já corrigido (foi exatamente isso que intermitentemente
// quebrava o campo de valor: uns funcionavam, outros não, dependendo
// de quando cada um foi visitado pela última vez).
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Sem isso, o Next.js pode guardar em cache a versão renderizada
// dessa página (é dinâmica por natureza — muda pra cada lançamento —
// mas nada aqui força isso de propósito). Mesmo tipo de causa que já
// resolvemos antes na rota de lembretes.
export const dynamic = "force-dynamic";
export const revalidate = 0;


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
    supabase.from("financa_categorias").select("id, nome, tipo, icone").order("nome"),
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
        valor: String(transacao.valor),
        contaId: transacao.conta_id,
        categoriaId: transacao.categoria_id,
        data: transacao.data,
        descricao: transacao.descricao,
      }}
    />
  );
}
