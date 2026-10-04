"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormularioAcao } from "@/components/FormularioAcao";
import { criarRecorrencia, alternarAtivaRecorrencia, removerRecorrencia } from "./actions";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoComConfirmacao } from "@/components/BotaoComConfirmacao";
import { LinhaComDeslizar } from "@/components/LinhaComDeslizar";
import { BotaoSalvarFormulario } from "@/components/BotaoSalvarFormulario";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { SugestoesRecorrentes } from "@/components/SugestoesRecorrentes";
import { hojeISO } from "@/lib/habitos/streak";

// Etapa 129
export default function RecorrentesPage() {
  return (
    <Suspense fallback={null}>
      <RecorrentesConteudo />
    </Suspense>
  );
}

function RecorrentesConteudo() {
  const searchParams = useSearchParams();
  const erro = searchParams.get("erro");
  const { snapshot, recarregar } = useSnapshotOffline();
  const [, iniciarTransicao] = useTransition();
  // Etapa 258 — só mostra categorias do tipo escolhido (despesa ou receita)
  const [tipoNova, setTipoNova] = useState<"despesa" | "receita">("despesa");

  const recorrencias = [...(snapshot?.financas.recorrencias ?? [])].sort((a: any, b: any) => a.dia_mes - b.dia_mes);
  const contas = snapshot?.financas.contas ?? [];
  const categorias = (snapshot?.financas.categorias ?? []).filter((c: any) => c.dono_id === snapshot?.perfil.id);
  const mapaContas = new Map(contas.map((c: any) => [c.id, c.nome]));
  // Etapa 254 — lançamento deste mês de cada recorrência (pra mostrar ajuste/situação)
  const hoje = hojeISO();
  const desteMes = new Map<string, any>();
  for (const t of (snapshot?.financas.transacoes ?? []) as any[]) {
    if (t.recorrencia_id && t.data.startsWith(hoje.slice(0, 7))) desteMes.set(t.recorrencia_id, t);
  }

  function alternarAtiva(id: string) {
    iniciarTransicao(async () => {
      await alternarAtivaRecorrencia(id);
      recarregar();
    });
  }

  return (
    <main className="min-h-screen p-6 md:p-12 pagina">
      <Link href="/financas" className="text-ink-400 text-base hover:text-ink-100 transition">
        ← Finanças
      </Link>
      <h1 className="text-3xl font-display font-bold mt-4 mb-1">Recorrentes</h1>
      <p className="text-ink-400 text-sm mb-6">Lançamentos que se repetem todo mês, como aluguel ou salário.</p>

      {erro && (
        <p className="mb-4 text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
          {decodeURIComponent(erro)}
        </p>
      )}

      {recorrencias.length > 0 && (
        <ul className="space-y-2 mb-8 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {recorrencias.map((r: any) => (
            <li key={r.id}>
              <LinhaComDeslizar
                acao={removerRecorrencia.bind(null, r.id)}
                textoConfirmacao={`Remover a recorrência "${r.descricao || mapaContas.get(r.conta_id)}"?`}
                aoConcluir={recarregar}
              >
              <div
                className={`flex items-center justify-between bg-base-800 border border-base-600 rounded-2xl p-4 ${!r.ativo ? "opacity-50" : ""}`}
              >
              <Link href={`/financas/recorrentes/${r.id}`} className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.descricao || mapaContas.get(r.conta_id)}</p>
                <p className="text-xs text-ink-400">
                  Todo dia {r.dia_mes} · {mapaContas.get(r.conta_id)}
                  {r.data_fim && <> · até {new Date(r.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}</>}
                </p>
                {desteMes.has(r.id) && (
                  <p className="text-xs mt-0.5">
                    {desteMes.get(r.id).pago_em || desteMes.get(r.id).data <= hoje ? (
                      <span className="text-habito">✓ Pago este mês</span>
                    ) : (
                      <span className="text-financa">A pagar dia {desteMes.get(r.id).data.slice(8, 10)}</span>
                    )}
                    {Number(desteMes.get(r.id).valor) !== Number(r.valor) && (
                      <span className="text-ink-400"> · este mês {formatarMoeda(desteMes.get(r.id).valor)}</span>
                    )}
                  </p>
                )}
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-mono text-sm ${r.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                  {r.tipo === "receita" ? "+" : "-"}
                  {formatarMoeda(r.valor)}
                </span>
                <Link href={`/financas/recorrentes/${r.id}`} className="text-ink-400 hover:text-ink-100 transition text-xs">
                  Editar
                </Link>
                <button onClick={() => alternarAtiva(r.id)} className="text-ink-400 hover:text-ink-100 transition text-xs">
                  {r.ativo ? "Pausar" : "Ativar"}
                </button>
                <BotaoComConfirmacao acao={removerRecorrencia.bind(null, r.id)} textoBotao="Remover" aoConcluir={recarregar} />
              </div>
              </div>
              </LinhaComDeslizar>
            </li>
          ))}
        </ul>
      )}

      {snapshot && <SugestoesRecorrentes snapshot={snapshot} hojeISO={hojeISO()} />}

      {snapshot !== undefined && contas.length === 0 ? (
        <p className="text-ink-400 text-sm">Crie uma conta primeiro para adicionar recorrências.</p>
      ) : (
        <>
          <h2 className="text-lg font-semibold mb-3">Nova recorrência</h2>
          <FormularioAcao acao={criarRecorrencia} aoSucesso={recarregar} mensagemSucesso="Recorrência criada!" className="space-y-3">
            <select
              name="tipo"
              value={tipoNova}
              onChange={(e) => setTipoNova(e.target.value === "receita" ? "receita" : "despesa")}
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </select>
            <input
              name="valor"
              type="text"
              inputMode="decimal"
              required
              placeholder="Valor (ex: 1500,00)"
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
            />
            <select
              name="contaId"
              required
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              {contas.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <select
              name="categoriaId"
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            >
              <option value="">Sem categoria</option>
              {/* Etapa 258 — o ícone é um desenho (nome tipo "Home", "Car"), não emoji: no menu vai só o nome */}
              {categorias
                .filter((c: any) => !c.tipo || c.tipo === tipoNova)
                .map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
            <div>
              <label htmlFor="diaMes" className="block text-sm text-ink-400 mb-1">
                Todo dia (1 a 28)
              </label>
              <input
                id="diaMes"
                name="diaMes"
                type="number"
                min={1}
                max={28}
                defaultValue={5}
                className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition font-mono"
              />
            </div>
            <div>
              <label htmlFor="dataFim" className="block text-sm text-ink-400 mb-1">
                Até quando? (opcional — deixe em branco pra "sempre")
              </label>
              <input
                id="dataFim"
                name="dataFim"
                type="date"
                className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
              />
            </div>
            <input
              name="descricao"
              type="text"
              placeholder="Descrição (ex: Aluguel, Salário)"
              className="w-full bg-base-800 border border-base-600 rounded-2xl px-4 py-3.5 text-ink-100 focus:border-ink-100 outline-none transition"
            />
            <BotaoSalvarFormulario>Criar recorrência</BotaoSalvarFormulario>
          </FormularioAcao>
          <p className="text-xs text-ink-400 mt-3">
            O lançamento do mês aparece no extrato como "a pagar" assim que você abre Finanças no mês — dá pra
            ajustar o valor só daquele mês ou marcar como pago. Toque numa recorrência pra editar daqui pra frente.
          </p>
        </>
      )}
    </main>
  );
}
