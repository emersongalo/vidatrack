"use client";

import { useEffect, useRef, useState } from "react";
import { ItemLinhaAgenda, ItemAgenda } from "@/components/ItemLinhaAgenda";
import { adicionarNaFila, salvarCacheHoje } from "@/lib/offline/fila";
import { EVENTO_SINCRONIZACAO_CONCLUIDA } from "@/components/GerenciadorSincronizacaoOffline";
import { agruparItensHoje } from "@/lib/habitos/gruposHoje";
import { ComemoracaoDia } from "@/components/ComemoracaoDia";
import { vibrar } from "@/components/ItemLinhaAgenda";

export function ListaHojeComOffline({
  itensServidor,
  dataISO,
  aoConcluirMutacao,
}: {
  itensServidor: ItemAgenda[];
  dataISO: string;
  /** Etapa 146 — repassado pro ItemLinhaAgenda; ver o comentário lá. */
  aoConcluirMutacao?: () => void;
}) {
  const [itens, setItens] = useState(itensServidor);
  const [offline, setOffline] = useState(false);
  // Etapa 230 — comemoração quando o dia fecha 100% (só quando muda na hora, não ao abrir)
  const [comemorar, setComemorar] = useState(false);
  const tudoFeito = itens.length > 0 && itens.every((i) => i.feito);
  const marcouAgora = useRef(false);
  useEffect(() => {
    if (marcouAgora.current && tudoFeito) {
      setComemorar(true);
      vibrar([20, 60, 20, 60, 40]);
    }
    marcouAgora.current = false;
  }, [tudoFeito, itens]);
  const refLista = useRef<HTMLDivElement>(null);

  // Sempre que os dados do servidor mudam (nova renderização, revalidação),
  // atualiza o cache local pra essa data.
  useEffect(() => {
    setItens(itensServidor);
    salvarCacheHoje(dataISO, itensServidor);
  }, [itensServidor, dataISO]);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function aoFicarOnline() {
      setOffline(false);
    }
    function aoFicarOffline() {
      setOffline(true);
    }
    // O gerenciador global (GerenciadorSincronizacaoOffline) é quem
    // processa a fila de verdade — aqui só escutamos quando ele
    // termina, pra buscar o estado real e atualizado do servidor.
    function aoSincronizar() {
      window.location.reload();
    }

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    window.addEventListener(EVENTO_SINCRONIZACAO_CONCLUIDA, aoSincronizar);

    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
      window.removeEventListener(EVENTO_SINCRONIZACAO_CONCLUIDA, aoSincronizar);
    };
  }, []);

  // Atalho de teclado (só faz sentido no desktop, com teclado de
  // verdade): dígitos 1-9 marcam/desmarcam o item correspondente na
  // lista, na ordem em que aparecem na tela — não ativa se a pessoa
  // estiver digitando em algum campo de texto.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) return;

      const numero = Number(e.key);
      if (!Number.isInteger(numero) || numero < 1 || numero > 9) return;

      const itensDaLista = refLista.current?.querySelectorAll("li[data-item]");
      const itemAlvo = itensDaLista?.[numero - 1];
      const botao = itemAlvo?.querySelector<HTMLButtonElement>("button[aria-pressed], button[aria-label='Aumentar']");
      botao?.click();
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  function atualizarVisualmente(item: ItemAgenda) {
    marcouAgora.current = !item.feito;
    setItens((atual) => atual.map((it) => (it.id === item.id ? { ...it, feito: !it.feito } : it)));
  }

  function ajustarVisualmente(item: ItemAgenda, delta: number) {
    marcouAgora.current = delta > 0;
    setItens((atual) =>
      atual.map((it) => {
        if (it.id !== item.id || !it.meta) return it;
        const novoAtual = Math.max(0, it.meta.atual + delta);
        return { ...it, meta: { ...it.meta, atual: novoAtual }, feito: novoAtual >= it.meta.alvo };
      })
    );
  }

  function enfileirarOffline(item: ItemAgenda) {
    if (item.tipo === "habito") {
      adicionarNaFila({ tipo: "checkin_habito", habitoId: item.id, data: dataISO });
    } else {
      adicionarNaFila({ tipo: "conclusao_tarefa", tarefaId: item.id, data: dataISO });
    }
  }

  function enfileirarAjusteOffline(item: ItemAgenda, delta: number) {
    adicionarNaFila({ tipo: "ajuste_habito", habitoId: item.id, data: dataISO, delta });
  }

  return (
    <div>
      {comemorar && <ComemoracaoDia aoFechar={() => setComemorar(false)} />}
      {offline && (
        <p className="mb-3 text-xs bg-financa-soft text-financa border border-financa/30 rounded-lg px-3 py-2">
          Sem conexão — suas marcações estão sendo guardadas e vão
          sincronizar automaticamente quando a internet voltar.
        </p>
      )}
      <p className="hidden lg:block text-xs text-ink-400 mb-2">
        Dica: teclas 1-9 marcam os itens na ordem da lista
      </p>
      {/* Etapa 227 — agrupado (Manhã / Tarde / Noite / Tarefas), cada grupo num cartão */}
      <div ref={refLista} className="space-y-5">
        {agruparItensHoje(itens).map((g) => (
          <section key={g.id}>
            <div className="flex items-baseline justify-between px-1 mb-2">
              <h3 className="text-base font-semibold">{g.titulo}</h3>
              <span className={`text-sm ${g.feitos === g.itens.length ? "text-habito" : "text-ink-400"}`}>
                {g.feitos}/{g.itens.length}
              </span>
            </div>
            <ul className="bg-base-800 border border-base-600 rounded-2xl overflow-hidden divide-y divide-base-600">
              {g.itens.map((item) => (
                <ItemLinhaAgenda
                  key={`${item.tipo}-${item.id}`}
                  item={item}
                  dataISO={dataISO}
                  aoAlternarLocal={() => atualizarVisualmente(item)}
                  aoAjustarLocal={(delta) => ajustarVisualmente(item, delta)}
                  aoClicarOffline={() => enfileirarOffline(item)}
                  aoAjustarOffline={(delta) => enfileirarAjusteOffline(item, delta)}
                  aoConcluirMutacao={aoConcluirMutacao}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
