"use client";

import { useEffect, useMemo, useState } from "react";
import { lerSnapshotOffline, type SnapshotOffline } from "@/lib/offline/snapshot";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { adicionarNaFila } from "@/lib/offline/fila";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { calcularPeriodo, type PresetPeriodo } from "@/lib/financas/formatacao";
import { calcularStreak, calcularStreakNegativo, calcularMelhorStreak } from "@/lib/habitos/streak";
import { IconeHabito } from "@/components/IconeHabito";
import { BotaoNovoHabitoOffline } from "@/components/BotaoNovoHabitoOffline";
import { GraficoPatrimonioLazy as GraficoPatrimonio } from "@/components/GraficoPatrimonioLazy";

// Etapa 123/124: cobertura cada vez mais próxima de "o app inteiro
// funciona offline". Fica de fora, por enquanto, só o que precisa de
// uma ESCRITA mais delicada de sincronizar direito (marcar um
// quadradinho de desafio já mexe em conta + progresso ao mesmo tempo,
// contribuir pra uma meta idem) — essas telas ficam de LEITURA aqui;
// pra alterar, precisa estar online.
type Aba = "hoje" | "habitos" | "financas" | "extrato" | "contas" | "metas" | "desafios" | "patrimonio";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "habitos", rotulo: "Hábitos" },
  { id: "financas", rotulo: "Início" },
  { id: "extrato", rotulo: "Extrato" },
  { id: "contas", rotulo: "Contas" },
  { id: "metas", rotulo: "Metas" },
  { id: "desafios", rotulo: "Desafios" },
  { id: "patrimonio", rotulo: "Patrimônio" },
];

export default function OfflinePage() {
  const [snapshot, setSnapshot] = useState<SnapshotOffline | null | undefined>(undefined);
  const [aba, setAba] = useState<Aba>("hoje");
  const [feitos, setFeitos] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSnapshot(lerSnapshotOffline());
  }, []);

  if (snapshot === undefined) return null;

  if (snapshot === null) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-3xl mb-3">📡</p>
          <h1 className="text-xl font-display font-semibold mb-2">Sem conexão</h1>
          <p className="text-ink-400 text-sm max-w-xs mx-auto">
            Ainda não deu tempo de guardar seus dados pra uso offline. Abra o
            app pelo menos uma vez com internet e espere alguns segundos —
            da próxima vez, isso funciona mesmo sem conexão.
          </p>
        </div>
      </main>
    );
  }

  const hoje = new Date().toLocaleDateString("sv-SE");
  const habitosHoje = snapshot.habitos.filter((h) => diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], hoje));
  const tarefasHoje = snapshot.tarefas.filter(
    (t) => !t.data || t.data === hoje || (t.repetir !== "nenhuma" && diaBateComFrequencia(t.repetir, t.dias_semana ?? [], hoje))
  );

  function marcarFeito(tipo: "habito" | "tarefa", id: string) {
    const chave = `${tipo}-${id}`;
    setFeitos((atual) => {
      const novo = new Set(atual);
      novo.has(chave) ? novo.delete(chave) : novo.add(chave);
      return novo;
    });
    if (tipo === "habito") {
      adicionarNaFila({ tipo: "checkin_habito", habitoId: id, data: hoje });
    } else {
      adicionarNaFila({ tipo: "conclusao_tarefa", tarefaId: id, data: hoje });
    }
  }

  const mapaCategoriasFinancas = new Map(snapshot.financas.categorias.map((c) => [c.id, c]));
  const saldoTotal = snapshot.financas.contas.reduce((a, c) => a + Number(c.saldo), 0);

  const dataFormatada = new Date(snapshot.baixadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-lg mx-auto pb-24">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📡</span>
        <h1 className="text-xl font-display font-semibold">Modo offline</h1>
      </div>
      <p className="text-xs text-ink-400 mb-5">
        Mostrando dados de {dataFormatada} — o que você fizer agora sincroniza sozinho
        quando a internet voltar.
      </p>

      <div className="flex gap-2 mb-5 overflow-x-auto -mx-1 px-1 pb-1">
        {ABAS.map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
              aba === t.id ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400"
            }`}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      {aba === "hoje" && (
        <div>
          <div className="flex justify-end mb-3">
            <BotaoNovoHabitoOffline />
          </div>
          <ul className="space-y-2">
            {[...habitosHoje.map((h) => ({ ...h, _tipo: "habito" as const })), ...tarefasHoje.map((t) => ({ ...t, _tipo: "tarefa" as const }))].map(
              (item) => {
                const chave = `${item._tipo}-${item.id}`;
                const feito = feitos.has(chave) || (item._tipo === "tarefa" && item.concluida);
                return (
                  <li
                    key={chave}
                    onClick={() => marcarFeito(item._tipo, item.id)}
                    className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3 cursor-pointer"
                  >
                    <span className="text-lg"><IconeHabito icone={item.icone} /></span>
                    <p className={`flex-1 text-sm ${feito ? "line-through text-ink-400" : ""}`}>
                      {item._tipo === "habito" ? item.nome : item.titulo}
                    </p>
                    <span
                      className={`w-5 h-5 rounded-full border-2 shrink-0 ${
                        feito ? "bg-habito border-habito" : "border-base-600"
                      }`}
                    />
                  </li>
                );
              }
            )}
            {habitosHoje.length === 0 && tarefasHoje.length === 0 && (
              <p className="text-sm text-ink-400">Nada marcado pra hoje.</p>
            )}
          </ul>
        </div>
      )}

      {aba === "habitos" && <AbaHabitos snapshot={snapshot} />}

      {aba === "financas" && (
        <div>
          <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-4">
            <p className="text-xs text-ink-400 mb-1">Saldo em contas</p>
            <p className="text-2xl font-mono font-semibold">{formatarMoeda(saldoTotal)}</p>
          </div>
          <div className="flex justify-end mb-3">
            <BotaoLancamentoFinanceiroOffline
              contas={snapshot.financas.contas}
              categorias={snapshot.financas.categorias}
            />
          </div>
          <p className="text-xs text-ink-400 mb-2">Lançamentos recentes</p>
          <ul className="space-y-2">
            {snapshot.financas.transacoes.slice(0, 15).map((t) => (
              <ItemTransacao key={t.id} t={t} mapaCategorias={mapaCategoriasFinancas} contas={snapshot.financas.contas} />
            ))}
          </ul>
        </div>
      )}

      {aba === "extrato" && <AbaExtrato snapshot={snapshot} mapaCategorias={mapaCategoriasFinancas} />}

      {aba === "contas" && (
        <div>
          <p className="text-xs text-ink-400 mb-3">
            Saldo calculado com todo o histórico — pode ficar levemente desatualizado
            se você lançou algo offline que ainda não sincronizou.
          </p>
          <ul className="space-y-2">
            {snapshot.financas.contas.map((c) => (
              <li key={c.id} className="flex items-center justify-between bg-base-800 border border-base-600 rounded-lg p-3.5">
                <div>
                  <p className="text-sm font-medium">{c.nome}</p>
                  <p className="text-xs text-ink-400">{c.banco || c.tipo}</p>
                </div>
                <span className="font-mono text-sm">{formatarMoeda(c.saldo)}</span>
              </li>
            ))}
            {snapshot.financas.contas.length === 0 && (
              <p className="text-sm text-ink-400">Nenhuma conta cadastrada.</p>
            )}
          </ul>
        </div>
      )}

      {aba === "metas" && (
        <div>
          <p className="text-xs text-ink-400 mb-3">
            Só consulta aqui — pra guardar dinheiro numa meta, precisa estar online.
          </p>
          <BarraDeProgressoLista
            itens={snapshot.financas.metas.map((m) => ({
              id: m.id,
              nome: m.nome,
              atual: Number(m.valor_atual),
              alvo: Number(m.valor_alvo),
              concluida: m.concluida,
            }))}
            vazio="Nenhuma meta cadastrada."
          />
        </div>
      )}

      {aba === "desafios" && (
        <div>
          <p className="text-xs text-ink-400 mb-3">
            Só consulta aqui — pra marcar um quadradinho, precisa estar online (isso também
            lança uma transação na conta de origem).
          </p>
          <BarraDeProgressoLista
            itens={snapshot.financas.desafios.map((d) => ({
              id: d.id,
              nome: d.nome,
              atual: Number(d.valor_guardado),
              alvo: Number(d.valor_alvo),
              concluida: d.concluido,
            }))}
            vazio="Nenhum desafio cadastrado."
          />
        </div>
      )}

      {aba === "patrimonio" && (
        <div>
          <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-4">
            <p className="text-xs text-ink-400 mb-1">Patrimônio atual</p>
            <p className="text-2xl font-mono font-semibold">
              {formatarMoeda(snapshot.financas.patrimonio.at(-1)?.patrimonio ?? 0)}
            </p>
          </div>
          <GraficoPatrimonio dados={snapshot.financas.patrimonio} />
        </div>
      )}
    </main>
  );
}

function ItemTransacao({ t, mapaCategorias, contas }: { t: any; mapaCategorias: Map<string, any>; contas: any[] }) {
  const cat = mapaCategorias.get(t.categoria_id);
  const nomeConta = contas.find((c) => c.id === t.conta_id)?.nome;
  return (
    <li className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3">
      <span className="text-sm">{cat?.icone ?? (t.tipo === "receita" ? "💰" : "💸")}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{t.descricao || nomeConta}</p>
        <p className="text-xs text-ink-400">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
      </div>
      <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
        {t.tipo === "receita" ? "+" : "-"}
        {formatarMoeda(t.valor)}
      </span>
    </li>
  );
}

/**
 * Extrato completo — todas as transações guardadas no retrato
 * (Etapa 124), com os mesmos filtros de tipo e período da tela
 * online (lib/financas/formatacao.ts, mesma função calcularPeriodo).
 */
function AbaExtrato({ snapshot, mapaCategorias }: { snapshot: SnapshotOffline; mapaCategorias: Map<string, any> }) {
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "receita" | "despesa">("todos");
  const [preset, setPreset] = useState<PresetPeriodo>("este_mes");

  const { inicio, fim } = calcularPeriodo(preset);

  const filtradas = useMemo(() => {
    return snapshot.financas.transacoes.filter((t) => {
      if (t.data < inicio || t.data > fim) return false;
      if (filtroTipo !== "todos" && t.tipo !== filtroTipo) return false;
      return true;
    });
  }, [snapshot.financas.transacoes, inicio, fim, filtroTipo]);

  const receitas = filtradas.filter((t) => t.tipo === "receita").reduce((a, t) => a + Number(t.valor), 0);
  const despesas = filtradas.filter((t) => t.tipo === "despesa").reduce((a, t) => a + Number(t.valor), 0);

  const presets: { id: PresetPeriodo; rotulo: string }[] = [
    { id: "este_mes", rotulo: "Este mês" },
    { id: "mes_passado", rotulo: "Mês passado" },
    { id: "ultimos_30", rotulo: "Últimos 30 dias" },
    { id: "este_ano", rotulo: "Este ano" },
    { id: "tudo", rotulo: "Tudo" },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["todos", "receita", "despesa"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroTipo(f)}
            className={`text-sm rounded-full px-3 py-1 border ${
              filtroTipo === f ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400"
            }`}
          >
            {f === "todos" ? "Todos" : f === "receita" ? "Receitas" : "Despesas"}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto -mx-1 px-1 pb-1">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`shrink-0 text-xs rounded-full px-3 py-1 border ${
              preset === p.id ? "border-financa text-financa" : "border-base-600 text-ink-400"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-base-800 border border-base-600 rounded-lg p-3">
          <p className="text-xs text-ink-400">Receitas</p>
          <p className="font-mono text-sm text-habito">{formatarMoeda(receitas)}</p>
        </div>
        <div className="flex-1 bg-base-800 border border-base-600 rounded-lg p-3">
          <p className="text-xs text-ink-400">Despesas</p>
          <p className="font-mono text-sm text-red-400">{formatarMoeda(despesas)}</p>
        </div>
      </div>

      <ul className="space-y-2">
        {filtradas.map((t) => (
          <ItemTransacao key={t.id} t={t} mapaCategorias={mapaCategorias} contas={[]} />
        ))}
        {filtradas.length === 0 && <p className="text-sm text-ink-400">Nada nesse período.</p>}
      </ul>
      {snapshot.financas.transacoes.length >= 3000 && (
        <p className="text-xs text-ink-400 mt-4">
          Mostrando as 3.000 transações mais recentes guardadas offline.
        </p>
      )}
    </div>
  );
}

function BarraDeProgressoLista({
  itens,
  vazio,
}: {
  itens: { id: string; nome: string; atual: number; alvo: number; concluida: boolean }[];
  vazio: string;
}) {
  return (
    <ul className="space-y-3">
      {itens.map((item) => {
        const percentual = item.alvo > 0 ? Math.min(100, Math.round((item.atual / item.alvo) * 100)) : 0;
        return (
          <li key={item.id} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-medium text-sm">{item.nome}</span>
              {item.concluida && <span className="text-xs text-habito font-medium">Concluída 🎉</span>}
            </div>
            <div className="h-2 bg-base-600 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-financa rounded-full" style={{ width: `${percentual}%` }} />
            </div>
            <p className="text-xs text-ink-400">
              {formatarMoeda(item.atual)} de {formatarMoeda(item.alvo)} ({percentual}%)
            </p>
          </li>
        );
      })}
      {itens.length === 0 && <p className="text-sm text-ink-400">{vazio}</p>}
    </ul>
  );
}

function AbaHabitos({ snapshot }: { snapshot: SnapshotOffline }) {
  const datasPorHabito = new Map<string, string[]>();
  for (const c of snapshot.habitoCheckins) {
    if (!datasPorHabito.has(c.habito_id)) datasPorHabito.set(c.habito_id, []);
    datasPorHabito.get(c.habito_id)!.push(c.data);
  }

  const habitosComStreak = snapshot.habitos.map((h) => {
    const datas = datasPorHabito.get(h.id) ?? [];
    if (h.eh_negativo) {
      return {
        ...h,
        streakAtual: calcularStreakNegativo(datas, (h.criado_em as string).slice(0, 10)),
        melhorStreak: null as number | null,
      };
    }
    return {
      ...h,
      streakAtual: calcularStreak(datas),
      melhorStreak: calcularMelhorStreak(datas),
    };
  });

  return (
    <div>
      <div className="flex justify-end mb-3">
        <BotaoNovoHabitoOffline />
      </div>
      <ul className="space-y-2">
        {habitosComStreak.map((h) => (
          <li key={h.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3">
            <span className="text-lg"><IconeHabito icone={h.icone} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{h.nome}</p>
              <p className="text-xs text-ink-400">
                {h.eh_negativo ? `${h.streakAtual} dias sem recaída` : `Sequência: ${h.streakAtual}`}
                {h.melhorStreak !== null && !h.eh_negativo && ` · Recorde: ${h.melhorStreak}`}
              </p>
            </div>
          </li>
        ))}
        {habitosComStreak.length === 0 && <p className="text-sm text-ink-400">Nenhum hábito ainda.</p>}
      </ul>
    </div>
  );
}

function BotaoLancamentoFinanceiroOffline({ contas, categorias }: { contas: any[]; categorias: any[] }) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [valor, setValor] = useState("");
  const [contaId, setContaId] = useState(contas[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    if (!valor || !contaId) return;
    adicionarNaFila({
      id: crypto.randomUUID(),
      tipo: "criar_transacao",
      dados: {
        tipo,
        valor,
        contaId,
        categoriaId: "",
        descricao,
        data: new Date().toLocaleDateString("sv-SE"),
      },
    });
    setSalvo(true);
    setTimeout(() => {
      setAberto(false);
      setSalvo(false);
      setValor("");
      setDescricao("");
    }, 1500);
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="bg-financa text-base-900 text-sm font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition"
      >
        + Lançamento
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={() => setAberto(false)}>
      <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {salvo ? (
          <p className="text-sm text-habito">📦 Guardado — sincroniza quando a internet voltar.</p>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTipo("despesa")}
                className={`flex-1 rounded-lg py-2 text-sm border ${tipo === "despesa" ? "border-red-400 text-red-400" : "border-base-600 text-ink-400"}`}
              >
                Despesa
              </button>
              <button
                onClick={() => setTipo("receita")}
                className={`flex-1 rounded-lg py-2 text-sm border ${tipo === "receita" ? "border-habito text-habito" : "border-base-600 text-ink-400"}`}
              >
                Receita
              </button>
            </div>
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              inputMode="decimal"
              placeholder="Valor (ex: 25,90)"
              autoFocus
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-ink-100 transition font-mono"
            />
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-ink-100 transition"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-ink-100 transition"
            />
            <div className="flex gap-2">
              <button onClick={() => setAberto(false)} className="flex-1 border border-base-600 rounded-lg py-2 text-sm hover:bg-base-700 transition">
                Cancelar
              </button>
              <button onClick={salvar} className="flex-1 bg-ink-100 text-base-900 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition">
                Guardar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
