"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { hojeISO } from "@/lib/habitos/streak";
import { buscarItensDoDiaCliente, buscarCategoriasProdutividadeCliente } from "@/lib/agenda/consultaCliente";
import { lerCacheHoje, salvarCacheHoje } from "@/lib/offline/fila";
import { TiraDeDiasAgenda } from "@/components/TiraDeDiasAgenda";
import { SugestoesHabito } from "@/components/SugestoesHabito";
import { ListaHojeComOffline } from "@/components/ListaHojeComOffline";
import type { ItemAgenda } from "@/components/ItemLinhaAgenda";

const CHAVE_CATEGORIAS = "categorias-produtividade";

function chaveCache(data: string, categoria: string) {
  return `hoje:${data}:${categoria || "tudo"}`;
}

/**
 * Etapa 126 — primeira tela convertida pra "local-first" de verdade:
 * em vez de a página do servidor buscar tudo antes de existir (o que
 * falha por completo sem internet), ESSE componente roda inteiramente
 * no navegador. Ele mostra o que tiver guardado localmente na hora —
 * mesmo com zero conexão, mesmo na primeira renderização — e só
 * depois tenta buscar dado fresco do Supabase pra atualizar,
 * silenciosamente, se houver internet.
 *
 * A troca de dia e o filtro de categoria não navegam mais pra uma URL
 * nova (isso exigiria o servidor) — viram só estado local.
 */
export function HojeLocalFirst() {
  const hoje = hojeISO();
  const searchParams = useSearchParams();
  // Só usado pra honrar um link direto (ex: MiniCalendario) que aponte
  // pra um dia específico — depois disso, a navegação entre dias é
  // toda local (TiraDeDiasAgenda via aoSelecionarData), sem depender
  // do servidor de novo.
  const [dataSelecionada, setDataSelecionada] = useState(searchParams.get("data") || hoje);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categorias, setCategorias] = useState<{ id: string; nome: string; cor: string }[]>([]);
  const [itens, setItens] = useState<ItemAgenda[] | null>(null);
  const [temAlgumItemCadastrado, setTemAlgumItemCadastrado] = useState(true);
  const [usandoCache, setUsandoCache] = useState(false);

  // Categorias: mesma ideia, cache local + atualização em segundo plano.
  useEffect(() => {
    const cache = lerCacheHoje(CHAVE_CATEGORIAS) as { id: string; nome: string; cor: string }[] | null;
    if (cache) setCategorias(cache);

    buscarCategoriasProdutividadeCliente()
      .then((dados) => {
        setCategorias(dados);
        salvarCacheHoje(CHAVE_CATEGORIAS, dados);
      })
      .catch(() => {
        // Sem internet — fica só com o que já tinha em cache (se tinha).
      });
  }, []);

  useEffect(() => {
    const chave = chaveCache(dataSelecionada, categoriaFiltro);
    const cache = lerCacheHoje(chave) as { itens: ItemAgenda[]; temAlgumItemCadastrado: boolean } | null;

    if (cache) {
      setItens(cache.itens);
      setTemAlgumItemCadastrado(cache.temAlgumItemCadastrado);
      setUsandoCache(true);
    } else {
      setItens(null); // ainda não sabemos — evita mostrar "nada aqui" errado antes da hora
    }

    let cancelado = false;
    buscarItensDoDiaCliente(dataSelecionada, categoriaFiltro)
      .then((resultado) => {
        if (cancelado) return;
        setItens(resultado.itens);
        setTemAlgumItemCadastrado(resultado.temAlgumItemCadastrado);
        setUsandoCache(false);
        salvarCacheHoje(chave, resultado);
      })
      .catch(() => {
        // Sem internet: se não tinha cache nenhum pra essa combinação
        // de dia+categoria, fica mesmo sem nada pra mostrar — não tem
        // como inventar dado que nunca chegou a ser baixado.
        if (!cancelado && !cache) {
          setItens([]);
          setTemAlgumItemCadastrado(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [dataSelecionada, categoriaFiltro]);

  // Usado depois de criar um hábito pela sugestão (Etapa 126) — sem
  // isso, a lista ficaria congelada mostrando "Vamos começar?" mesmo
  // depois de criar o primeiro hábito, já que não existe mais um
  // servidor revalidando essa página sozinho por trás.
  function recarregar() {
    buscarItensDoDiaCliente(dataSelecionada, categoriaFiltro).then((resultado) => {
      setItens(resultado.itens);
      setTemAlgumItemCadastrado(resultado.temAlgumItemCadastrado);
      setUsandoCache(false);
      salvarCacheHoje(chaveCache(dataSelecionada, categoriaFiltro), resultado);
    });
  }

  const carregando = itens === null;
  const feitos = itens?.filter((i) => i.feito).length ?? 0;
  const total = itens?.length ?? 0;

  return (
    <main className="max-w-2xl lg:max-w-5xl mx-auto px-6 md:px-12 pt-2">
      <div className="flex items-center justify-end mb-1">
        <Link
          href={`/habitos/planejador?data=${dataSelecionada}`}
          className="text-sm text-ink-400 hover:text-ink-100 transition"
        >
          🕐 Blocos de tempo
        </Link>
      </div>
      <h1 className="text-2xl font-display font-semibold mb-4">Hoje</h1>

      <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-6 lg:items-start">
        <div>
          <TiraDeDiasAgenda dataSelecionada={dataSelecionada} hojeISO={hoje} aoSelecionarData={setDataSelecionada} />

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mt-4 mb-5 scrollbar-none">
            <button
              onClick={() => setCategoriaFiltro("")}
              className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
                !categoriaFiltro
                  ? "bg-ink-100 text-base-900 border-ink-100"
                  : "border-base-600 text-ink-400 hover:text-ink-100"
              }`}
            >
              Tudo
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id)}
                className={`shrink-0 text-sm rounded-full px-3.5 py-1.5 border transition ${
                  categoriaFiltro === cat.id
                    ? "bg-ink-100 text-base-900 border-ink-100"
                    : "border-base-600 text-ink-400 hover:text-ink-100"
                }`}
              >
                {cat.nome}
              </button>
            ))}
            <Link
              href="/habitos/categorias/nova"
              className="shrink-0 text-sm rounded-full px-3.5 py-1.5 border border-dashed border-base-600 text-ink-400 hover:text-ink-100 transition"
            >
              + Nova lista
            </Link>
          </div>

          {usandoCache && (
            <p className="mb-3 text-xs bg-financa-soft text-financa border border-financa/30 rounded-lg px-3 py-2">
              Mostrando dados salvos no aparelho — atualizando...
            </p>
          )}

          {carregando ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-base-800 border border-base-600 rounded-xl2" />
              ))}
            </div>
          ) : itens!.length === 0 && !temAlgumItemCadastrado ? (
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
              <p className="font-display font-semibold mb-1">Vamos começar?</p>
              <p className="text-ink-400 text-sm">Toque em uma sugestão pra criar seu primeiro hábito:</p>
              <SugestoesHabito aoCriar={recarregar} />
              <p className="text-ink-400 text-xs mt-5">ou</p>
              <div className="flex gap-2 justify-center mt-4">
                <Link
                  href="/habitos/novo"
                  className="text-sm bg-ink-100 text-base-900 font-medium rounded-lg px-3.5 py-2 hover:opacity-90 transition"
                >
                  + Hábito
                </Link>
                <Link
                  href="/habitos/tarefas/nova"
                  className="text-sm border border-base-600 rounded-lg px-3.5 py-2 hover:bg-base-700 transition"
                >
                  + Tarefa
                </Link>
              </div>
            </div>
          ) : itens!.length === 0 ? (
            <div className="bg-base-800 border border-base-600 rounded-xl2 p-8 text-center">
              <p className="font-display font-semibold mb-1">Nada por aqui</p>
              <p className="text-ink-400 text-sm">Nenhum hábito ou tarefa cai neste dia.</p>
            </div>
          ) : (
            <ListaHojeComOffline itensServidor={itens!} dataISO={dataSelecionada} />
          )}
        </div>

        {total > 0 && (
          <div className="hidden lg:block bg-base-800 border border-base-600 rounded-xl2 p-4 sticky top-6">
            <p className="text-xs text-ink-400 mb-1">Hoje</p>
            <p className="text-3xl font-display font-bold mb-1">
              {feitos}
              <span className="text-ink-400 text-xl">/{total}</span>
            </p>
            <div className="h-1.5 bg-base-600 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-habito rounded-full"
                style={{ width: `${total > 0 ? Math.round((feitos / total) * 100) : 0}%` }}
              />
            </div>
            <Link href="/habitos/estatisticas" className="text-xs text-ink-400 hover:text-ink-100 transition">
              Ver estatísticas →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
