"use client";

import Link from "next/link";
import { FormularioAcao } from "@/components/FormularioAcao";
import { useState } from "react";
import { criarMeta, adicionarProgressoMeta, arquivarMeta, excluirMetaDefinitivamente, retirarDaMeta, editarMeta } from "./actions";
import { planoDaMeta, ritmoDaMeta, quandoChega, sugestaoSemanal } from "@/lib/financas/metas";
import { hojeISO } from "@/lib/habitos/streak";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { CampoValorMonetario } from "@/components/CampoValorMonetario";
import { Trash2, Archive, Pencil } from "lucide-react";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { PoteMeta } from "@/components/PoteMeta";
import { EstadoVazio } from "@/components/EstadoVazio";
import { Dica } from "@/components/Dica";
import { CabecalhoPagina } from "@/components/CabecalhoPagina";

// Etapa 127: a lista abre com o que já tinha salvo. Guardar progresso
// numa meta, criar, arquivar ou excluir continuam precisando de
// internet — mexer em dinheiro de verdade merece confirmação síncrona
// com o servidor, não uma fila que pode dar errado.
export default function MetasPage() {
  const { snapshot, recarregar } = useSnapshotOffline();
  const metas = snapshot?.financas.metas ?? [];

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <CabecalhoPagina
        voltarHref="/financas"
        voltarTexto="Finanças"
        emoji="🎯"
        titulo="Metas de economia"
        subtitulo={`Separe um valor pra alcançar, tipo "Viagem" ou "Reserva de emergência", e vá guardando aos poucos.`}
      />
      <Dica contexto="metas" />

      {metas.length === 0 && snapshot && (
        <EstadoVazio tom="financa" emoji="🎯" titulo="Nenhuma meta ainda" texto="Crie a primeira aqui embaixo — viagem, reserva, um celular novo…" />
      )}

      {metas.length > 0 && (
        <ul className="space-y-3 mb-8 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {metas.map((meta: any) => (
            <CartaoMeta key={meta.id} meta={meta} aoMudar={recarregar} />
          ))}
        </ul>
      )}

      <div className="bg-base-800 border border-base-600 rounded-xl2 shadow-lg shadow-black/20 p-4">
        <h2 className="text-lg font-semibold mb-3">Nova meta</h2>
        <FormularioAcao acao={criarMeta} aoSucesso={recarregar} mensagemSucesso="Meta criada!" className="space-y-3">
          <input
            name="nome"
            type="text"
            placeholder="Nome (ex: Viagem, Reserva de emergência)"
            required
            className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
          />
          <CampoValorMonetario
            name="valorAlvo"
            placeholder="Valor alvo (ex: 5.000,00)"
            required
            className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 font-mono focus:border-ink-100 outline-none transition"
          />
          <div>
            <label className="block text-xs text-ink-400 mb-1.5">Data alvo (opcional)</label>
            <input
              name="dataAlvo"
              type="date"
              className="w-full bg-base-900 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
          </div>
          <BotaoSalvarFormulario>Criar meta</BotaoSalvarFormulario>
        </FormularioAcao>
      </div>
    </main>
  );
}

// Etapa 215 — cartão da meta com plano mensal, guardar/retirar e editar
function CartaoMeta({ meta, aoMudar }: { meta: any; aoMudar: () => void }) {
  const [modo, setModo] = useState<"guardar" | "retirar">("guardar");
  const [editando, setEditando] = useState(false);
  const plano = planoDaMeta(meta, hojeISO());
  // Etapa 278 — ritmo por semana/dia e projeção sem prazo
  const ritmo = ritmoDaMeta(meta, hojeISO());
  const [semanal, setSemanal] = useState(() => sugestaoSemanal(plano.falta));
  const chegaEm = quandoChega(meta, semanal, hojeISO());
  const classeCampo =
    "w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm text-ink-100 focus:border-ink-100 outline-none transition";

  return (
    <li className="bg-base-800 border border-base-600 rounded-3xl p-5">
      {/* Etapa 230 — anel com a % no meio, quanto falta e o ritmo pra chegar */}
      <div className="flex items-center gap-4 mb-4">
        {/* Etapa 286 — pote que enche (e moedas caindo ao guardar) */}
        <PoteMeta percentual={plano.percentual} tamanho={92} concluida={!!meta.concluida} />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">{meta.nome}</p>
          <p className="font-mono text-base">
            {formatarMoeda(Number(meta.valor_atual))}
            <span className="text-ink-400"> de {formatarMoeda(Number(meta.valor_alvo))}</span>
          </p>
          {meta.concluida ? (
            <p className="text-sm text-habito font-medium mt-0.5">Concluída 🎉</p>
          ) : (
            <p className="text-sm text-ink-400 mt-0.5">
              Faltam <span className="text-ink-100 font-mono">{formatarMoeda(plano.falta)}</span>
            </p>
          )}
        </div>
      </div>

      {!meta.concluida && (
        <div className="text-sm rounded-2xl bg-base-900/60 border border-base-600 px-3 py-2.5 mb-4">
          {plano.prazoPassou ? (
            <span className="text-red-400">O prazo passou — que tal ajustar a data?</span>
          ) : plano.porMes !== null && meta.data_alvo ? (
            <>
              Guarde <span className="text-financa font-mono font-semibold">{formatarMoeda(plano.porMes)}/mês</span> até{" "}
              {new Date(meta.data_alvo + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
              <span className="text-ink-400"> ({plano.meses} {plano.meses === 1 ? "mês" : "meses"})</span>
              {ritmo.porSemana !== null && ritmo.porDia !== null && (
                <span className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs rounded-full bg-financa/15 text-financa px-2.5 py-0.5 font-mono">
                    ≈ {formatarMoeda(ritmo.porSemana)}/semana
                  </span>
                  <span className="text-xs rounded-full bg-financa/15 text-financa px-2.5 py-0.5 font-mono">
                    ≈ {formatarMoeda(ritmo.porDia)}/dia
                  </span>
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-ink-400">Sem prazo. Simule: guardando </span>
              <span className="inline-flex items-center gap-1 align-middle">
                <button
                  type="button"
                  aria-label="Menos"
                  onClick={() => setSemanal((v) => Math.max(5, v - 5))}
                  className="w-6 h-6 rounded-full border border-base-600 text-ink-400 hover:text-ink-100"
                >
                  −
                </button>
                <span className="font-mono font-semibold text-financa">{formatarMoeda(semanal)}</span>
                <button
                  type="button"
                  aria-label="Mais"
                  onClick={() => setSemanal((v) => v + 5)}
                  className="w-6 h-6 rounded-full border border-base-600 text-ink-400 hover:text-ink-100"
                >
                  +
                </button>
              </span>
              <span className="text-ink-400"> por semana, </span>
              {chegaEm && (
                <span>
                  chega em{" "}
                  <strong>{new Date(chegaEm + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>.
                </span>
              )}
            </>
          )}
        </div>
      )}

      {editando ? (
        <FormularioAcao
          acao={editarMeta.bind(null, meta.id)}
          aoSucesso={() => {
            setEditando(false);
            aoMudar();
          }}
          className="space-y-2 mb-3"
        >
          <input name="nome" defaultValue={meta.nome} required className={classeCampo} />
          <CampoValorMonetario
            name="valorAlvo"
            valorInicial={meta.valor_alvo}
            required
            className={classeCampo + " font-mono"}
          />
          <input name="dataAlvo" type="date" defaultValue={meta.data_alvo ?? ""} className={classeCampo} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditando(false)} className="flex-1 border border-base-600 rounded-lg py-1.5 text-xs">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-ink-100 text-base-900 rounded-lg py-1.5 text-xs font-medium">
              Salvar
            </button>
          </div>
        </FormularioAcao>
      ) : (
        <>
          <div className="flex gap-1 mb-2 text-xs">
            {(["guardar", "retirar"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={`px-2.5 py-1 rounded-full border transition ${
                  modo === m ? "border-financa text-financa bg-financa/10" : "border-base-600 text-ink-400"
                }`}
              >
                {m === "guardar" ? "Guardar" : "Retirar"}
              </button>
            ))}
          </div>
          <FormularioAcao
            key={modo}
            acao={(modo === "guardar" ? adicionarProgressoMeta : retirarDaMeta).bind(null, meta.id)}
            aoSucesso={aoMudar}
            className="flex gap-2 mb-3"
          >
            <CampoValorMonetario
              name={modo === "guardar" ? "valorAdicionar" : "valorRetirar"}
              placeholder={modo === "guardar" ? "Guardar mais..." : "Quanto tirar..."}
              className={"flex-1 " + classeCampo + " font-mono"}
            />
            <button
              type="submit"
              className={`text-sm font-medium rounded-lg px-3 hover:opacity-90 transition ${
                modo === "guardar" ? "bg-financa text-base-900" : "bg-base-700 border border-base-600 text-ink-100"
              }`}
            >
              {modo === "guardar" ? "+" : "−"}
            </button>
          </FormularioAcao>
        </>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditando((e) => !e)} aria-label="Editar meta" className="text-ink-400 hover:text-ink-100 transition">
          <Pencil size={14} strokeWidth={2} />
        </button>
        <BotaoComConfirmacao
          acao={arquivarMeta.bind(null, meta.id)}
          textoBotao={<Archive size={14} strokeWidth={2} />}
          textoConfirmacao={`Arquivar "${meta.nome}"?`}
          classeBotao="text-ink-400 hover:text-ink-100 transition"
          aoConcluir={aoMudar}
        />
        <BotaoComConfirmacao
          acao={excluirMetaDefinitivamente.bind(null, meta.id)}
          textoBotao={<Trash2 size={14} strokeWidth={2} />}
          textoConfirmacao={`Excluir "${meta.nome}" de vez?`}
          classeBotao="text-ink-400 hover:text-red-400 transition"
          aoConcluir={aoMudar}
        />
      </div>
    </li>
  );
}
