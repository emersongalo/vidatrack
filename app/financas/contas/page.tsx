"use client";

import Link from "next/link";
import { Pencil, Share2, Archive, Trash2, Receipt } from "lucide-react";
<<<<<<< HEAD
=======
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
>>>>>>> 663b0203d7e9f7910d0b3535498533049780d40e
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { criarConta, arquivarConta, excluirContaDefinitivamente } from "../actions";
import { SeletorTipoConta } from "@/components/SeletorTipoConta";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { SeloBanco } from "@/components/SeloBanco";
import { ValorMonetario } from "@/components/ValorMonetario";
import { BANCOS } from "@/lib/financas/bancos";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";

const RÓTULOS_TIPO: Record<string, string> = {
  carteira: "Carteira",
  banco: "Banco",
  cartao: "Cartão",
  investimento: "Investimento",
};

<<<<<<< HEAD
// Etapa 127: a LISTA abre com o que estiver salvo localmente (então
// dá pra pelo menos ver suas contas e saldos sem internet). Criar,
// editar, arquivar ou excluir uma conta continua precisando de
// conexão — são ações de gerenciamento, não algo que alguém
// normalmente faz no meio do dia sem sinal. Os avatares de quem
// compartilha uma conta também ficam de fora por enquanto (a foto
// depende de um link assinado gerado no servidor).
export default function ContasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const contas = snapshot?.financas.contas ?? [];
=======
export default async function ContasPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const supabase = createClient();

  // auth.getUser() e a busca de contas não dependem uma da outra —
  // rodam juntas em vez de uma esperando a outra terminar. E como
  // getUsuarioAtual() é memorizado por requisição, se essa mesma
  // checagem já tiver rodado em outro ponto desta navegação (ex: no
  // layout), essa chamada não bate no Supabase de novo.
  const [user, { data: contas }] = await Promise.all([
    getUsuarioAtual(),
    supabase
      .from("financa_contas")
      .select("id, nome, tipo, banco, saldo_inicial, dono_id, dia_fechamento")
      .eq("arquivado", false)
      .order("criado_em", { ascending: true }),
  ]);

  const idsContas = (contas ?? []).map((c) => c.id);

  const { data: compartilhamentos } = idsContas.length
    ? await supabase
        .from("compartilhamentos")
        .select("item_id, usuario_convidado_id, email_convidado")
        .eq("tipo_item", "financa")
        .in("item_id", idsContas)
    : { data: [] as any[] };

  const idsConvidados = Array.from(
    new Set((compartilhamentos ?? []).map((c) => c.usuario_convidado_id).filter(Boolean))
  );

  // Já busca você (se houver algum compartilhamento) junto com as
  // outras pessoas, numa única consulta — antes isso era uma consulta
  // à parte só pra pegar a sua própria foto, redundante com essa aqui.
  const idsPerfisNecessarios = Array.from(
    new Set([...(idsConvidados.length > 0 && user?.id ? [user.id] : []), ...idsConvidados])
  );

  const { data: perfisNecessarios } = idsPerfisNecessarios.length
    ? await supabase.from("perfis").select("id, nome, foto_url").in("id", idsPerfisNecessarios)
    : { data: [] as any[] };

  const mapaPerfis = new Map((perfisNecessarios ?? []).map((p) => [p.id, p]));

  // Resolve as URLs de foto (algumas podem ser chave do R2, que
  // precisa de link assinado) todas ao mesmo tempo, não uma de cada vez.
  const idsParaResolverFoto = (perfisNecessarios ?? []).map((p) => p.id);
  const urlsResolvidas = await Promise.all(
    idsParaResolverFoto.map((id) => resolverUrlFoto(mapaPerfis.get(id)?.foto_url ?? null))
  );
  const mapaUrlFoto = new Map(idsParaResolverFoto.map((id, i) => [id, urlsResolvidas[i]]));

  function pessoasDaConta(contaId: string, donoId: string) {
    const idsConvidadosDaConta = (compartilhamentos ?? [])
      .filter((c) => c.item_id === contaId && c.usuario_convidado_id)
      .map((c) => c.usuario_convidado_id as string);

    if (idsConvidadosDaConta.length === 0) return [];

    const pessoas = idsConvidadosDaConta.map((id) => {
      const perfil = mapaPerfis.get(id);
      return { nome: perfil?.nome ?? "Alguém", urlFoto: mapaUrlFoto.get(id) ?? null };
    });

    // Inclui você também na pilha de avatares, se a conta for sua
    if (donoId === user?.id) {
      pessoas.unshift({ nome: "Você", urlFoto: user?.id ? mapaUrlFoto.get(user.id) ?? null : null });
    }

    return pessoas;
  }
>>>>>>> 663b0203d7e9f7910d0b3535498533049780d40e

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-md lg:max-w-3xl mx-auto">
      <Link href="/financas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <div className="flex items-center justify-between mt-4 mb-6">
        <h1 className="text-2xl font-display font-semibold">Contas</h1>
        <Link href="/financas/contas/lixeira" className="text-ink-400 text-xs hover:text-ink-100 transition">
          Lixeira
        </Link>
      </div>

      {contas.length > 0 && (
        <ul className="space-y-2 mb-8 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {contas.map((conta: any) => (
            <li key={conta.id} className="bg-base-800 border border-base-600 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <SeloBanco bancoId={conta.banco} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conta.nome}</p>
                    <p className="text-xs text-ink-400">
                      {RÓTULOS_TIPO[conta.tipo]} · saldo <ValorMonetario valor={Number(conta.saldo)} />
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-base-600">
                {conta.tipo === "cartao" && conta.dia_fechamento && (
                  <Link href={`/financas/contas/${conta.id}/fatura`} aria-label="Ver fatura" className="text-ink-400 hover:text-financa transition">
                    <Receipt size={15} strokeWidth={2} />
                  </Link>
                )}
                <Link href={`/financas/contas/${conta.id}/editar`} aria-label="Editar" className="text-ink-400 hover:text-ink-100 transition">
                  <Pencil size={15} strokeWidth={2} />
                </Link>
                <Link href={`/financas/contas/${conta.id}/compartilhar`} aria-label="Compartilhar" className="text-ink-400 hover:text-ink-100 transition">
                  <Share2 size={15} strokeWidth={2} />
                </Link>
                <span className="flex-1" />
                <BotaoComConfirmacao
                  acao={arquivarConta.bind(null, conta.id)}
                  textoBotao={<Archive size={15} strokeWidth={2} />}
                  textoConfirmacao={`Arquivar "${conta.nome}"? Ela some das listas, mas os dados continuam guardados — dá pra restaurar depois.`}
                  classeBotao="text-ink-400 hover:text-ink-100 transition"
                  aoConcluir={recarregar}
                />
                <BotaoComConfirmacao
                  acao={excluirContaDefinitivamente.bind(null, conta.id)}
                  textoBotao={<Trash2 size={15} strokeWidth={2} />}
                  textoConfirmacao={`Excluir "${conta.nome}" de vez? Isso apaga TODOS os lançamentos e recorrências dela, sem volta nenhuma.`}
                  classeBotao="text-ink-400 hover:text-red-400 transition"
                  aoConcluir={recarregar}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-ink-400 mb-3">Nova conta</p>
      <form action={criarConta} className="space-y-3">
        <input
          name="nome"
          type="text"
          required
          placeholder="Ex: Carteira, Nubank, Cartão Inter"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
        />
        <SeletorTipoConta />
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Banco (pra mostrar o selo certo)</label>
          <select
            name="banco"
            className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition"
          >
            {BANCOS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
        <input
          name="saldoInicial"
          type="text"
          inputMode="decimal"
          placeholder="Saldo inicial (opcional, ex: 150,00)"
          className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
        />
        <BotaoSalvarFormulario>Criar conta</BotaoSalvarFormulario>
      </form>
    </main>
  );
}
