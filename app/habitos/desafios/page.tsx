"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSnapshotOffline } from "@/lib/offline/useSnapshot";
import { hojeISO } from "@/lib/habitos/streak";
import { placarDoHabito } from "@/lib/habitos/desafio";

// Etapa 220 — desafio com amigo: hábito compartilhado vira placar
export default function DesafiosPage() {
  const { snapshot } = useSnapshotOffline();
  const hoje = hojeISO();
  const [convidados, setConvidados] = useState<Map<string, string[]>>(new Map());
  const [nomes, setNomes] = useState<Map<string, string>>(new Map());
  const eu = snapshot?.perfil.id ?? "";

  const habitos = (snapshot?.habitos ?? []) as any[];
  const checkins = (snapshot?.habitoCheckins ?? []) as any[];

  // quem participa de cada hábito (online: convites; offline: quem já marcou)
  useEffect(() => {
    if (!snapshot || !navigator.onLine) return;
    const ids = habitos.map((h) => h.id);
    if (!ids.length) return;
    const supabase = createClient();
    supabase
      .from("compartilhamentos")
      .select("item_id, dono_id, usuario_convidado_id")
      .eq("tipo_item", "habito")
      .in("item_id", ids)
      .then(({ data }) => {
        const mapa = new Map<string, string[]>();
        for (const c of data ?? []) {
          const lista = mapa.get(c.item_id as string) ?? [];
          for (const u of [c.dono_id, c.usuario_convidado_id]) if (u && !lista.includes(u as string)) lista.push(u as string);
          mapa.set(c.item_id as string, lista);
        }
        setConvidados(mapa);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  const desafios = useMemo(() => {
    return habitos
      .map((h) => {
        const pessoas = new Set<string>([eu, ...(convidados.get(h.id) ?? [])]);
        if (h.dono_id) pessoas.add(h.dono_id);
        for (const c of checkins) if (c.habito_id === h.id && c.usuario_id) pessoas.add(c.usuario_id);
        pessoas.delete("");
        return { habito: h, pessoas: [...pessoas] };
      })
      .filter((d) => d.pessoas.length > 1);
  }, [habitos, checkins, convidados, eu]);

  useEffect(() => {
    const faltam = [...new Set(desafios.flatMap((d) => d.pessoas))].filter((u) => u !== eu && !nomes.has(u));
    if (!faltam.length || !navigator.onLine) return;
    const supabase = createClient();
    Promise.all(faltam.map((u) => supabase.rpc("nome_do_usuario", { p_user_id: u }).then(({ data }) => [u, String(data ?? "Amigo")] as const))).then(
      (pares) => setNomes((atual) => new Map([...atual, ...pares.map(([u, n]) => [u, n.split("@")[0].split(" ")[0]] as [string, string])]))
    );
  }, [desafios, eu, nomes]);

  const nome = (u: string) => (u === eu ? "Você" : nomes.get(u) ?? "Amigo");
  const meusHabitos = habitos.filter((h) => !h.dono_id || h.dono_id === eu);

  return (
    <main className="min-h-screen p-6 md:p-12 pagina pb-16">
      <Link href="/habitos/estatisticas" className="text-ink-400 text-sm hover:text-ink-100 transition">
        ← Estatísticas
      </Link>
      <h1 className="text-2xl font-display font-semibold mt-4 mb-1">Desafios</h1>
      <p className="text-ink-400 text-sm mb-6">
        Faça um hábito junto com alguém: cada um marca o seu e vocês veem a sequência um do outro.
      </p>

      {snapshot === undefined ? null : desafios.length === 0 ? (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-6 text-center mb-6">
          <p className="text-3xl mb-2">🤝</p>
          <p className="font-display font-semibold mb-1">Nenhum desafio ainda</p>
          <p className="text-ink-400 text-sm">Escolha um hábito abaixo e convide alguém pelo e-mail.</p>
        </div>
      ) : (
        <ul className="space-y-3 mb-8 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {desafios.map(({ habito, pessoas }) => {
            const placar = placarDoHabito(habito, checkins, pessoas, hoje);
            const lider = placar[0];
            return (
              <li key={habito.id} className="bg-base-800 border border-base-600 rounded-xl2 p-4">
                <p className="font-medium mb-3">{habito.nome}</p>
                <ul className="space-y-2">
                  {placar.map((p) => (
                    <li key={p.usuarioId} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-center">{p === lider && p.sequencia > 0 ? "🏆" : ""}</span>
                      <span className={`flex-1 truncate ${p.usuarioId === eu ? "font-medium" : ""}`}>{nome(p.usuarioId)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${p.hoje ? "bg-habito/15 text-habito" : "bg-base-700 text-ink-400"}`}>
                        {p.hoje ? "✓ hoje" : "○ hoje"}
                      </span>
                      <span className="text-xs text-ink-400 w-16 text-right">{p.semana}/7 sem.</span>
                      <span className="font-mono text-sm w-12 text-right">🔥{p.sequencia}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {meusHabitos.length > 0 && (
        <div className="bg-base-800 border border-base-600 rounded-xl2 p-4">
          <p className="text-sm font-medium mb-2">Começar um desafio</p>
          <div className="flex flex-wrap gap-2">
            {meusHabitos.map((h) => (
              <Link
                key={h.id}
                href={`/habitos/${h.id}/compartilhar`}
                className="text-xs border border-base-600 rounded-full px-3 py-1.5 hover:border-habito hover:text-habito"
              >
                {h.nome} →
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-ink-400 mt-2">A pessoa recebe o hábito na conta dela e vocês passam a ver o placar aqui.</p>
        </div>
      )}
    </main>
  );
}
