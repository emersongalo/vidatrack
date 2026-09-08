"use client";

import { useEffect, useRef, useState } from "react";
import { ItemLinhaAgenda, ItemAgenda } from "@/components/ItemLinhaAgenda";
import { adicionarNaFila, salvarCacheHoje } from "@/lib/offline/fila";
import { EVENTO_SINCRONIZACAO_CONCLUIDA } from "@/components/GerenciadorSincronizacaoOffline";

export function ListaHojeComOffline({
  itensServidor,
  dataISO,
}: {
  itensServidor: ItemAgenda[];
  dataISO: string;
}) {
  const [itens, setItens] = useState(itensServidor);
  const [offline, setOffline] = useState(false);
  const refLista = useRef<HTMLUListElement>(null);

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

      const itensDaLista = refLista.current?.querySelectorAll(":scope > li");
      const itemAlvo = itensDaLista?.[numero - 1];
      const botao = itemAlvo?.querySelector<HTMLButtonElement>("button[aria-pressed], button[aria-label='Aumentar']");
      botao?.click();
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  function alternarOtimista(item: ItemAgenda) {
    if (navigator.onLine) return; // deixa o ItemLinhaAgenda chamar a action normalmente

    if (item.tipo === "habito") {
      adicionarNaFila({ tipo: "checkin_habito", habitoId: item.id, data: dataISO });
    } else {
      adicionarNaFila({ tipo: "conclusao_tarefa", tarefaId: item.id, data: dataISO });
    }
    setItens((atual) => atual.map((it) => (it.id === item.id ? { ...it, feito: !it.feito } : it)));
  }

  function ajustarOtimista(item: ItemAgenda, delta: number) {
    if (navigator.onLine) return;

    adicionarNaFila({ tipo: "ajuste_habito", habitoId: item.id, data: dataISO, delta });
    setItens((atual) =>
      atual.map((it) => {
        if (it.id !== item.id || !it.meta) return it;
        const novoAtual = Math.max(0, it.meta.atual + delta);
        return { ...it, meta: { ...it.meta, atual: novoAtual }, feito: novoAtual >= it.meta.alvo };
      })
    );
  }

  return (
    <div>
      {offline && (
        <p className="mb-3 text-xs bg-financa-soft text-financa border border-financa/30 rounded-lg px-3 py-2">
          Sem conexão — suas marcações estão sendo guardadas e vão
          sincronizar automaticamente quando a internet voltar.
        </p>
      )}
      <p className="hidden lg:block text-xs text-ink-400 mb-2">
        Dica: teclas 1-9 marcam os itens na ordem da lista
      </p>
      <ul ref={refLista} className="space-y-2">
        {itens.map((item) => (
          <ItemLinhaAgenda
            key={`${item.tipo}-${item.id}`}
            item={item}
            dataISO={dataISO}
            aoClicarOffline={() => alternarOtimista(item)}
            aoAjustarOffline={(delta) => ajustarOtimista(item, delta)}
          />
        ))}
      </ul>
    </div>
  );
}
