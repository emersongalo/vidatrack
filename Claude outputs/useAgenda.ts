"use client";

// Etapa 341 — carrega a Agenda (meus eventos + os que fui convidado),
// guarda uma cópia no aparelho pra abrir na hora (e sem internet) e
// expõe salvar / apagar / responder.
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Evento, Resposta } from "@/lib/agenda/eventos";
import { avisarConvidadosEvento, avisarRespostaEvento } from "@/lib/agenda/actions";
import { adicionarNaFila, lerFila } from "@/lib/offline/fila";

export type Participante = { usuario_id: string; resposta: Resposta };
export type EventoAgenda = Evento & { evento_participantes?: Participante[] };
export type Pessoa = { usuarioId: string; nome: string };

const CHAVE = "vt-agenda-cache";
const SEM_REDE = "Sem internet: dá pra criar compromissos offline; editar, apagar e responder precisam de conexão.";
const offline = () => typeof navigator !== "undefined" && navigator.onLine === false;

/** Etapa 343 — compromissos criados sem internet (ainda na fila) aparecem na agenda com ⏳ */
function pendentesDaFila(eu: string | null): EventoAgenda[] {
  return lerFila()
    .filter((a: any) => a.tipo === "criar_evento")
    .map((a: any) => ({ ...(a.dados as any), id: `offline-${a.id}`, dono_id: eu ?? "eu", evento_participantes: [] }));
}

function lerCache(): EventoAgenda[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
  } catch {
    return [];
  }
}

export function useAgenda() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [eu, setEu] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semTabela, setSemTabela] = useState(false);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const nomes = useRef(new Map<string, string>());
  const [, forcar] = useState(0);

  const buscar = useCallback(async () => {
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getSession();
    const id = sessao.session?.user.id ?? null;
    setEu(id);
    const { data, error } = await supabase
      .from("eventos")
      .select("*, evento_participantes(usuario_id, resposta)")
      .order("data", { ascending: true })
      .limit(2000);
    if (error) {
      if (/relation .*eventos|schema cache/i.test(error.message)) setSemTabela(true);
      else {
        setErro("Sem conexão — mostrando o que está salvo no aparelho.");
        setEventos([...lerCache(), ...pendentesDaFila(id)]);
      }
    } else {
      setErro(null);
      setSemTabela(false);
      setEventos([...((data ?? []) as EventoAgenda[]), ...pendentesDaFila(id)]);
      try {
        localStorage.setItem(CHAVE, JSON.stringify(data ?? []));
      } catch {}
      // nomes de quem aparece nos eventos
      const ids = new Set<string>();
      for (const e of (data ?? []) as EventoAgenda[]) {
        ids.add(e.dono_id);
        for (const p of e.evento_participantes ?? []) ids.add(p.usuario_id);
      }
      await Promise.all(
        [...ids]
          .filter((x) => x !== id && !nomes.current.has(x))
          .map(async (x) => {
            const { data: n } = await supabase.rpc("nome_do_usuario", { p_user_id: x });
            nomes.current.set(x, String(n ?? "Alguém").split("@")[0].split(" ")[0]);
          })
      );
      forcar((n) => n + 1);
    }
    setCarregando(false);
  }, []);

  // pessoas com quem eu já compartilho algo (pra convidar sem digitar e-mail)
  const buscarPessoas = useCallback(async () => {
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getSession();
    const id = sessao.session?.user.id;
    if (!id) return;
    const { data } = await supabase.from("compartilhamentos").select("usuario_convidado_id, dono_id");
    const ids = new Set<string>();
    for (const c of data ?? []) {
      if (c.dono_id === id && c.usuario_convidado_id) ids.add(c.usuario_convidado_id as string);
      else if (c.usuario_convidado_id === id && c.dono_id) ids.add(c.dono_id as string);
    }
    const lista: Pessoa[] = [];
    for (const x of ids) {
      if (!nomes.current.has(x)) {
        const { data: n } = await supabase.rpc("nome_do_usuario", { p_user_id: x });
        nomes.current.set(x, String(n ?? "Alguém").split("@")[0].split(" ")[0]);
      }
      lista.push({ usuarioId: x, nome: nomes.current.get(x)! });
    }
    setPessoas(lista);
  }, []);

  useEffect(() => {
    setEventos([...lerCache(), ...pendentesDaFila(null)]);
    void buscar();
    void buscarPessoas();
    const aoVoltar = () => document.visibilityState === "visible" && buscar();
    document.addEventListener("visibilitychange", aoVoltar);
    // Etapa 343 — a fila offline subiu (internet voltou): busca de novo
    const aoSincronizar = () => void buscar();
    window.addEventListener("vidatrack:sincronizacao-concluida", aoSincronizar);
    window.addEventListener("online", aoSincronizar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("vidatrack:sincronizacao-concluida", aoSincronizar);
      window.removeEventListener("online", aoSincronizar);
    };
  }, [buscar, buscarPessoas]);

  const nomeDe = useCallback((id: string) => (id === eu ? "Você" : nomes.current.get(id) ?? "Alguém"), [eu]);

  /** cria ou altera; `convidados` = lista final de quem participa */
  const salvar = useCallback(
    async (dados: Partial<Evento> & { id?: string }, convidados: string[]): Promise<string | null> => {
      const supabase = createClient();
      const { id, ...campos } = dados as any;
      delete campos.evento_participantes;
      delete campos.dono_id;
      delete campos.convidados;
      // Etapa 343 — sem internet: novo compromisso vai pra fila e já aparece
      if (offline()) {
        if (id) return SEM_REDE;
        const idFila = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
        adicionarNaFila({ id: idFila, tipo: "criar_evento", dados: campos, convidados });
        setEventos((l) => [...l, { ...campos, id: `offline-${idFila}`, dono_id: eu ?? "eu", evento_participantes: [] } as EventoAgenda]);
        return null;
      }
      let eventoId = id as string | undefined;
      const antes = eventoId ? eventos.find((e) => e.id === eventoId) : undefined;
      if (eventoId) {
        const { error } = await supabase.from("eventos").update({ ...campos, atualizado_em: new Date().toISOString() }).eq("id", eventoId);
        if (error) return error.message;
      } else {
        const { data, error } = await supabase.from("eventos").insert(campos).select("id").single();
        if (error) return error.message;
        eventoId = data.id as string;
      }
      // participantes: entra quem é novo, sai quem foi tirado
      const atuais = (antes?.evento_participantes ?? []).map((p) => p.usuario_id);
      const novos = convidados.filter((c) => !atuais.includes(c));
      const saiu = atuais.filter((c) => !convidados.includes(c));
      if (novos.length) await supabase.from("evento_participantes").insert(novos.map((u) => ({ evento_id: eventoId, usuario_id: u })));
      if (saiu.length) await supabase.from("evento_participantes").delete().eq("evento_id", eventoId).in("usuario_id", saiu);
      if (novos.length) void avisarConvidadosEvento(eventoId!, novos);
      const mudouQuando =
        antes && (antes.data !== campos.data || (antes.hora_inicio ?? null)?.slice(0, 5) !== (campos.hora_inicio ?? null)?.slice?.(0, 5));
      const ficaram = convidados.filter((c) => atuais.includes(c));
      if (mudouQuando && ficaram.length) void avisarConvidadosEvento(eventoId!, ficaram, true);
      await buscar();
      return null;
    },
    [eventos, buscar, eu]
  );

  const apagar = useCallback(
    async (evento: EventoAgenda, soODia?: string): Promise<string | null> => {
      if (offline() || evento.id.startsWith("offline-")) return SEM_REDE;
      const supabase = createClient();
      const { error } = soODia
        ? await supabase
            .from("eventos")
            .update({ excecoes: [...(evento.excecoes ?? []), soODia] })
            .eq("id", evento.id)
        : await supabase.from("eventos").delete().eq("id", evento.id);
      if (error) return error.message;
      await buscar();
      return null;
    },
    [buscar]
  );

  const responder = useCallback(
    async (eventoId: string, resposta: Resposta): Promise<string | null> => {
      if (!eu) return "Entre de novo na sua conta";
      if (offline()) return SEM_REDE;
      const supabase = createClient();
      const { error } = await supabase
        .from("evento_participantes")
        .update({ resposta, respondido_em: new Date().toISOString() })
        .eq("evento_id", eventoId)
        .eq("usuario_id", eu);
      if (error) return error.message;
      void avisarRespostaEvento(eventoId, resposta);
      await buscar();
      return null;
    },
    [eu, buscar]
  );

  /** convidado: sair do evento (não aparece mais pra mim) */
  const sair = useCallback(
    async (eventoId: string) => {
      if (!eu) return;
      const supabase = createClient();
      await supabase.from("evento_participantes").delete().eq("evento_id", eventoId).eq("usuario_id", eu);
      await buscar();
    },
    [eu, buscar]
  );

  return { eventos, eu, carregando, erro, semTabela, pessoas, nomeDe, salvar, apagar, responder, sair, recarregar: buscar };
}
