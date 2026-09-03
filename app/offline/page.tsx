"use client";

import { useEffect, useState } from "react";
import { lerSnapshotOffline, type SnapshotOffline } from "@/lib/offline/snapshot";
import { diaBateComFrequencia } from "@/lib/agenda/dias";
import { adicionarNaFila } from "@/lib/offline/fila";
import { formatarMoeda } from "@/lib/financas/formatacao";
import { BotaoNovaNotaOffline } from "@/components/BotaoNovaNotaOffline";
import { BotaoNovoHabitoOffline } from "@/components/BotaoNovoHabitoOffline";

type Aba = "hoje" | "notas" | "financas";

export default function OfflinePage() {
  const [snapshot, setSnapshot] = useState<SnapshotOffline | null | undefined>(undefined);
  const [aba, setAba] = useState<Aba>("hoje");
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [notaAberta, setNotaAberta] = useState<any | null>(null);

  useEffect(() => {
    setSnapshot(lerSnapshotOffline());
  }, []);

  // Ainda não sabemos se tem retrato salvo (primeiro instante da
  // página) — evita piscar a mensagem "nunca visitou" à toa.
  if (snapshot === undefined) return null;

  // De verdade nunca abriu o app com internet antes — não tem nada
  // pra mostrar mesmo, não tem mágica possível aqui.
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

  const mapaContas = new Map(snapshot.financas.contas.map((c) => [c.id, c.nome]));
  const mapaCategoriasFinancas = new Map(snapshot.financas.categorias.map((c) => [c.id, c]));
  const saldoTotal =
    snapshot.financas.contas.reduce((a, c) => a + Number(c.saldo_inicial), 0) +
    snapshot.financas.transacoesRecentes.reduce(
      (a, t) => a + (t.tipo === "receita" ? Number(t.valor) : -Number(t.valor)),
      0
    );

  const dataFormatada = new Date(snapshot.baixadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">📡</span>
        <h1 className="text-xl font-display font-semibold">Modo offline</h1>
      </div>
      <p className="text-xs text-ink-400 mb-5">
        Mostrando dados de {dataFormatada} — o que você fizer agora sincroniza sozinho
        quando a internet voltar.
      </p>

      <div className="flex gap-2 mb-5">
        {[
          { id: "hoje" as const, label: "Hoje" },
          { id: "notas" as const, label: "Notas" },
          { id: "financas" as const, label: "Finanças" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`text-sm rounded-full px-3.5 py-1.5 border transition ${
              aba === t.id ? "bg-ink-100 text-base-900 border-ink-100" : "border-base-600 text-ink-400"
            }`}
          >
            {t.label}
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
                    <span className="text-lg">{item.icone}</span>
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

      {aba === "notas" && (
        <div>
          <div className="flex justify-end mb-3">
            <BotaoNovaNotaOffline />
          </div>
          <ul className="space-y-2">
            {snapshot.notas.map((n) => (
              <li
                key={n.id}
                onClick={() => setNotaAberta(n)}
                className="bg-base-800 border border-base-600 rounded-lg p-3 cursor-pointer"
              >
                <p className="text-sm font-medium truncate">{n.titulo || "Sem título"}</p>
                <p className="text-xs text-ink-400 truncate mt-0.5">{n.conteudo || "Sem conteúdo"}</p>
              </li>
            ))}
            {snapshot.notas.length === 0 && <p className="text-sm text-ink-400">Nenhuma nota guardada.</p>}
          </ul>
        </div>
      )}

      {aba === "financas" && (
        <div>
          <div className="bg-base-800 border border-base-600 rounded-xl2 p-4 mb-4">
            <p className="text-xs text-ink-400 mb-1">Saldo (com base nos dados guardados)</p>
            <p className="text-2xl font-mono font-semibold">{formatarMoeda(saldoTotal)}</p>
          </div>
          <div className="flex justify-end mb-3">
            <BotaoLancamentoFinanceiroOffline
              contas={snapshot.financas.contas}
              categorias={snapshot.financas.categorias}
            />
          </div>
          <ul className="space-y-2">
            {snapshot.financas.transacoesRecentes.slice(0, 15).map((t) => {
              const cat = mapaCategoriasFinancas.get(t.categoria_id);
              return (
                <li key={t.id} className="flex items-center gap-3 bg-base-800 border border-base-600 rounded-lg p-3">
                  <span className="text-sm">{cat?.icone ?? (t.tipo === "receita" ? "💰" : "💸")}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.descricao || mapaContas.get(t.conta_id)}</p>
                    <p className="text-xs text-ink-400">{new Date(t.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={`font-mono text-sm shrink-0 ${t.tipo === "receita" ? "text-habito" : "text-red-400"}`}>
                    {t.tipo === "receita" ? "+" : "-"}
                    {formatarMoeda(t.valor)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {notaAberta && (
        <ModalNotaOffline nota={notaAberta} onFechar={() => setNotaAberta(null)} />
      )}
    </main>
  );
}

function ModalNotaOffline({ nota, onFechar }: { nota: any; onFechar: () => void }) {
  const [titulo, setTitulo] = useState(nota.titulo ?? "");
  const [conteudo, setConteudo] = useState(nota.conteudo ?? "");
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    adicionarNaFila({ id: `editar_nota_${nota.id}`, tipo: "editar_nota", notaId: nota.id, titulo, conteudo });
    setSalvo(true);
    setTimeout(onFechar, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60" onClick={onFechar}>
      <div className="bg-base-800 border border-base-600 rounded-xl2 p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {salvo ? (
          <p className="text-sm text-habito">📦 Guardado — sincroniza quando a internet voltar.</p>
        ) : (
          <>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-ink-100 transition"
            />
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={8}
              className="w-full bg-base-900 border border-base-600 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-ink-100 transition resize-none"
            />
            <div className="flex gap-2">
              <button onClick={onFechar} className="flex-1 border border-base-600 rounded-lg py-2 text-sm hover:bg-base-700 transition">
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
