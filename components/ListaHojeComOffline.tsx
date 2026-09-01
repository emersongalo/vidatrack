"use client";

import { useEffect, useState, useCallback } from "react";
import { ItemLinhaAgenda, ItemAgenda } from "@/components/ItemLinhaAgenda";
import {
  adicionarNaFila,
  lerFila,
  limparFila,
  salvarCacheHoje,
  lerCacheHoje,
} from "@/lib/offline/fila";
import { alternarCheckin, ajustarQuantidadeHabito } from "@/app/habitos/actions";
import { alternarConclusaoTarefa } from "@/app/habitos/tarefas/actions";

export function ListaHojeComOffline({
  itensServidor,
  dataISO,
}: {
  itensServidor: ItemAgenda[];
  dataISO: string;
}) {
  const [itens, setItens] = useState(itensServidor);
  const [offline, setOffline] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Sempre que os dados do servidor mudam (nova renderização, revalidação),
  // atualiza o cache local pra essa data.
  useEffect(() => {
    setItens(itensServidor);
    salvarCacheHoje(dataISO, itensServidor);
  }, [itensServidor, dataISO]);

  const sincronizarFila = useCallback(async () => {
    const fila = lerFila();
    if (fila.length === 0) return;

    setSincronizando(true);
    for (const acao of fila) {
      try {
        if (acao.tipo === "checkin_habito") {
          await alternarCheckin(acao.habitoId, acao.data);
        } else if (acao.tipo === "ajuste_habito") {
          await ajustarQuantidadeHabito(acao.habitoId, acao.data, acao.delta);
        } else if (acao.tipo === "conclusao_tarefa") {
          await alternarConclusaoTarefa(acao.tarefaId, acao.data);
        }
      } catch {
        // Se uma ação falhar, para por aqui — tenta de novo na próxima vez
        // que a conexão for detectada, pra não perder a ordem.
        setSincronizando(false);
        return;
      }
    }
    limparFila();
    setSincronizando(false);
    window.location.reload(); // busca o estado real do servidor após sincronizar
  }, []);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function aoFicarOnline() {
      setOffline(false);
      sincronizarFila();
    }
    function aoFicarOffline() {
      setOffline(true);
    }

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);

    // Se já tem algo pendente da última vez (ex: fechou o app sem sincronizar)
    if (navigator.onLine) sincronizarFila();

    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, [sincronizarFila]);

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
      {sincronizando && (
        <p className="mb-3 text-xs text-ink-400">Sincronizando alterações feitas offline...</p>
      )}
      <ul className="space-y-2">
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
