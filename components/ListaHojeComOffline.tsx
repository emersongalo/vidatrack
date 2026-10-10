"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { movimentoReduzido } from "@/lib/app/festa";
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

  // Etapa 285 — os feitos descem pra "Feitos hoje" (depois de um
  // instantinho, pra dar tempo de ver o ✓) e a lista desliza suave.
  const [segurando, setSegurando] = useState<Set<string>>(new Set());
  const [comNota, setComNota] = useState<Set<string>>(new Set());
  const [mostrarFeitos, setMostrarFeitos] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("vt-hoje-feitos") === "0") setMostrarFeitos(false);
    } catch {}
  }, []);
  function alternarFeitos() {
    setMostrarFeitos((v) => {
      try {
        localStorage.setItem("vt-hoje-feitos", v ? "0" : "1");
      } catch {}
      return !v;
    });
  }
  function segurar(id: string) {
    setSegurando((s) => new Set(s).add(id));
    setTimeout(() => {
      setSegurando((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, 750);
  }

  // FLIP: guarda onde cada linha estava e anima até onde ela foi parar
  const posicoes = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const raiz = refLista.current;
    if (!raiz) return;
    const base = raiz.getBoundingClientRect().top;
    const novas = new Map<string, number>();
    const animar = !movimentoReduzido();
    raiz.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const id = el.dataset.flip!;
      const topo = el.getBoundingClientRect().top - base;
      novas.set(id, topo);
      const antes = posicoes.current.get(id);
      if (animar && antes !== undefined && Math.abs(antes - topo) > 2 && typeof el.animate === "function") {
        el.style.zIndex = "5";
        const a = el.animate([{ transform: `translateY(${antes - topo}px)` }, { transform: "translateY(0)" }], {
          duration: 420,
          easing: "cubic-bezier(.2,.8,.2,1)",
        });
        a.onfinish = () => (el.style.zIndex = "");
      }
    });
    posicoes.current = novas;
  });

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
    if (!item.feito) segurar(item.id);
    setItens((atual) => atual.map((it) => (it.id === item.id ? { ...it, feito: !it.feito } : it)));
  }

  function ajustarVisualmente(item: ItemAgenda, delta: number) {
    marcouAgora.current = delta > 0;
    if (item.meta && !item.feito && item.meta.atual + delta >= item.meta.alvo) segurar(item.id);
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

  const fica = (i: ItemAgenda) => segurando.has(i.id) || comNota.has(i.id);
  const pendentes = itens.filter((i) => !i.feito || fica(i));
  const feitosLista = itens.filter((i) => i.feito && !fica(i));
  type Bloco =
    | { tipo: "titulo"; chave: string; titulo: string; detalhe: string }
    | { tipo: "feitos"; chave: string }
    | { tipo: "item"; chave: string; item: ItemAgenda; primeiro: boolean; ultimo: boolean };
  const blocos: Bloco[] = [];
  for (const g of agruparItensHoje(pendentes)) {
    const falta = g.itens.length - g.feitos;
    blocos.push({ tipo: "titulo", chave: `t-${g.id}`, titulo: g.titulo, detalhe: falta > 0 ? `${falta} pra fazer` : "✓" });
    g.itens.forEach((it, k) =>
      blocos.push({ tipo: "item", chave: `${it.tipo}-${it.id}`, item: it, primeiro: k === 0, ultimo: k === g.itens.length - 1 })
    );
  }
  if (feitosLista.length > 0) {
    blocos.push({ tipo: "feitos", chave: "t-feitos" });
    if (mostrarFeitos)
      feitosLista.forEach((it, k) =>
        blocos.push({ tipo: "item", chave: `${it.tipo}-${it.id}`, item: it, primeiro: k === 0, ultimo: k === feitosLista.length - 1 })
      );
  }
  const linha = (item: ItemAgenda) => (
    <ItemLinhaAgenda
      key={`${item.tipo}-${item.id}`}
      item={item}
      dataISO={dataISO}
      aoAlternarLocal={() => atualizarVisualmente(item)}
      aoAjustarLocal={(delta) => ajustarVisualmente(item, delta)}
      aoClicarOffline={() => enfileirarOffline(item)}
      aoAjustarOffline={(delta) => enfileirarAjusteOffline(item, delta)}
      aoConcluirMutacao={aoConcluirMutacao}
      aoNotaAberta={(aberta) =>
        setComNota((s) => {
          if (aberta === s.has(item.id)) return s;
          const n = new Set(s);
          if (aberta) n.add(item.id);
          else n.delete(item.id);
          return n;
        })
      }
    />
  );

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
      {/* Etapa 227 — agrupado (Manhã / Tarde / Noite), cada grupo num cartão.
         Etapa 285 — os feitos vão pro cartão "Feitos hoje" no fim. */}
      {/* Um contêiner só, com chave em cada linha: a linha muda de grupo
         sem ser recriada (não perde a comemoração nem a anotação). */}
      <div ref={refLista}>
        {pendentes.length === 0 && feitosLista.length > 0 && (
          <div className="mb-5 text-center rounded-2xl border border-habito/30 bg-habito/10 px-4 py-4 animate-surgir">
            <p className="text-2xl mb-1">🌿</p>
            <p className="text-base font-semibold">Tudo feito por aqui</p>
            <p className="text-sm text-ink-400">Seus hábitos do dia estão em dia.</p>
          </div>
        )}
        {blocos.map((b) =>
          b.tipo === "titulo" ? (
            <div key={b.chave} className="flex items-baseline justify-between px-1 mb-2">
              <h3 className="text-base font-semibold">{b.titulo}</h3>
              <span className="text-sm text-ink-400">{b.detalhe}</span>
            </div>
          ) : b.tipo === "feitos" ? (
            <button key={b.chave} type="button" onClick={alternarFeitos} className="w-full flex items-center gap-2 px-1 mb-2 text-left">
              <h3 className="text-base font-semibold text-habito">✓ Feitos</h3>
              <span key={feitosLista.length} className="text-xs text-habito bg-habito/15 rounded-full px-2 py-0.5 animate-pop">
                {feitosLista.length}
              </span>
              <ChevronDown size={16} className={`ml-auto text-ink-400 transition-transform duration-300 ${mostrarFeitos ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <ul
              key={b.chave}
              data-flip={b.chave}
              className={`relative bg-base-800 border-x border-t border-base-600 overflow-hidden ${b.primeiro ? "rounded-t-2xl" : ""} ${
                b.ultimo ? "rounded-b-2xl border-b mb-5" : ""
              }`}
            >
              {linha(b.item)}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
