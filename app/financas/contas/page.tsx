"use client";

import Link from "next/link";
import { Pencil, Share2, Archive, Trash2, Receipt } from "lucide-react";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { criarConta, arquivarConta, excluirContaDefinitivamente } from "../actions";
import { SeletorTipoConta } from "@/components/SeletorTipoConta";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { MenuAcoes, ItemMenuAcoes } from "@/components/MenuAcoes";
import { LinhaComDeslizar } from "@/components/LinhaComDeslizar";
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
            <li key={conta.id}>
              <LinhaComDeslizar
                acao={arquivarConta.bind(null, conta.id)}
                textoConfirmacao={`Arquivar "${conta.nome}"? Ela some das listas, mas os dados continuam guardados — dá pra restaurar depois.`}
                aoConcluir={recarregar}
                icone={<Archive size={18} className="text-base-900" />}
                corFundo="bg-financa"
              >
              <div className="bg-base-800 border border-base-600 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <SeloBanco bancoId={conta.banco} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{conta.nome}</p>
                    <p className="text-xs text-ink-400">{RÓTULOS_TIPO[conta.tipo]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-sm mr-1">
                    <ValorMonetario valor={Number(conta.saldo)} />
                  </span>
                  <MenuAcoes>
                    {(fecharMenu) => (
                      <>
                        {conta.tipo === "cartao" && conta.dia_fechamento && (
                          <ItemMenuAcoes href={`/financas/contas/${conta.id}/fatura`}>
                            <Receipt size={15} strokeWidth={2} /> Ver fatura
                          </ItemMenuAcoes>
                        )}
                        <ItemMenuAcoes href={`/financas/contas/${conta.id}/editar`}>
                          <Pencil size={15} strokeWidth={2} /> Editar
                        </ItemMenuAcoes>
                        <ItemMenuAcoes href={`/financas/contas/${conta.id}/compartilhar`}>
                          <Share2 size={15} strokeWidth={2} /> Compartilhar
                        </ItemMenuAcoes>
                        <div className="my-1 border-t border-base-600" />
                        <BotaoComConfirmacao
                          acao={arquivarConta.bind(null, conta.id)}
                          textoBotao={
                            <span className="flex items-center gap-2.5">
                              <Archive size={15} strokeWidth={2} /> Arquivar
                            </span>
                          }
                          textoConfirmacao={`Arquivar "${conta.nome}"? Ela some das listas, mas os dados continuam guardados — dá pra restaurar depois.`}
                          classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-ink-100 hover:bg-base-700 transition"
                          aoConcluir={() => {
                            recarregar();
                            fecharMenu();
                          }}
                        />
                        <BotaoComConfirmacao
                          acao={excluirContaDefinitivamente.bind(null, conta.id)}
                          textoBotao={
                            <span className="flex items-center gap-2.5">
                              <Trash2 size={15} strokeWidth={2} /> Excluir de vez
                            </span>
                          }
                          textoConfirmacao={`Excluir "${conta.nome}" de vez? Isso apaga TODOS os lançamentos e recorrências dela, sem volta nenhuma.`}
                          classeBotao="flex items-center w-full px-3.5 py-2 text-sm text-left text-red-400 hover:bg-base-700 transition"
                          aoConcluir={() => {
                            recarregar();
                            fecharMenu();
                          }}
                        />
                      </>
                    )}
                  </MenuAcoes>
                </div>
              </div>
            </div>
              </LinhaComDeslizar>
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
