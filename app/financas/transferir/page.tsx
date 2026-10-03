"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { criarTransferencia } from "../actions";
import { FormularioAcao } from "@/components/FormularioAcao";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { useSnapshotOffline, atualizarSnapshotEmTodasAsTelas } from "@/lib/offline/useSnapshot";
import { CarregandoTela } from "@/components/Esqueleto";

/**
 * Etapa 211 — transferir entre contas (ex: Itaú → Carteira) ou pagar a
 * fatura do cartão (banco → cartão). Aceita ?para=&valor=&data=&descricao=
 * pra vir preenchido do botão "Pagar fatura".
 */
export default function TransferirPage() {
  return (
    <Suspense fallback={null}>
      <TransferirConteudo />
    </Suspense>
  );
}

const classeCampo =
  "w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition";

function TransferirConteudo() {
  const params = useSearchParams();
  const router = useRouter();
  const { snapshot } = useSnapshotOffline();
  if (snapshot === undefined) return <CarregandoTela comTopo={false} linhas={4} />;

  const meuId = snapshot?.perfil.id;
  const contas = ((snapshot?.financas.contas ?? []) as any[]).filter((c) => !c.dono_id || c.dono_id === meuId);
  const para = params.get("para") ?? "";
  const origemPadrao =
    contas.find((c) => c.tipo === "banco" && c.id !== para) ?? contas.find((c) => c.id !== para && c.tipo !== "cartao");
  const hoje = new Date().toLocaleDateString("sv-SE");

  return (
    <main className="min-h-screen p-6 md:p-12 pagina-form">
      <Link href="/financas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Transferir entre contas</h1>
      <p className="text-ink-400 text-sm mb-6">
        Sai de uma conta e entra na outra. Não conta como gasto nem receita — é o mesmo dinheiro mudando de lugar.
      </p>
      <p className="text-sm text-financa bg-financa/10 border border-financa/30 rounded-2xl px-4 py-3 mb-6">
        💳 Pra pagar cartão, use o botão <b>Pagar fatura</b> dentro do cartão — é mais simples.
      </p>

      {contas.length < 2 ? (
        <p className="text-sm text-ink-400">
          Você precisa de pelo menos 2 contas.{" "}
          <Link href="/financas/contas" className="text-financa underline">
            Criar conta
          </Link>
        </p>
      ) : (
        <FormularioAcao
          acao={criarTransferencia}
          aoSucesso={async () => {
            await atualizarSnapshotEmTodasAsTelas();
            router.push("/financas");
          }}
          mensagemSucesso="Transferência feita!"
          className="form-colunas"
        >
          <div className="form-coluna">
            <div>
              <label className="block text-sm text-ink-400 mb-1">De</label>
              {/* Etapa 242 — cartão não "manda" dinheiro: só aparece no Para */}
              <select name="contaOrigemId" defaultValue={origemPadrao?.id} className={classeCampo}>
                {contas.filter((c) => c.tipo !== "cartao").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-center text-ink-400">
              <ArrowDown size={18} />
            </div>
            <div>
              <label className="block text-sm text-ink-400 mb-1">Para</label>
              <select name="contaDestinoId" defaultValue={para || contas.find((c) => c.id !== origemPadrao?.id)?.id} className={classeCampo}>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {c.tipo === "cartao" ? " (cartão)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-coluna">
            <div>
              <label className="block text-sm text-ink-400 mb-1">Valor</label>
              <CampoValorMonetario name="valor" required valorInicial={params.get("valor") ?? undefined} className={`${classeCampo} font-mono`} />
            </div>
            <div>
              <label className="block text-sm text-ink-400 mb-1">Data</label>
              <input name="data" type="date" required defaultValue={params.get("data") ?? hoje} className={classeCampo} />
            </div>
            <div>
              <label className="block text-sm text-ink-400 mb-1">Descrição (opcional)</label>
              <input name="descricao" maxLength={200} defaultValue={params.get("descricao") ?? ""} className={classeCampo} />
            </div>
          </div>
          <div className="form-rodape lg:col-span-2">
            <BotaoSalvarFormulario textoEnviando="Transferindo...">Transferir</BotaoSalvarFormulario>
          </div>
        </FormularioAcao>
      )}
    </main>
  );
}
