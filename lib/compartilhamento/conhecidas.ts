"use client";

// Etapa 303 — pessoas com quem você já compartilhou algo (ou que
// compartilharam com você). Usado no "Compartilhar com…" dos formulários.
import { createClient } from "@/lib/supabase/client";

export type PessoaConhecida = { chave: string; usuarioId: string | null; email: string | null; nome: string };

export async function buscarPessoasConhecidas(): Promise<PessoaConhecida[]> {
  const supabase = createClient();
  const { data: sessao } = await supabase.auth.getSession();
  const eu = sessao.session?.user.id;
  if (!eu) return [];
  const { data } = await supabase.from("compartilhamentos").select("email_convidado, usuario_convidado_id, dono_id");
  const mapa = new Map<string, PessoaConhecida>();
  for (const c of data ?? []) {
    if (c.dono_id === eu) {
      const chave = (c.usuario_convidado_id as string) ?? `email:${c.email_convidado}`;
      if (!mapa.has(chave)) mapa.set(chave, { chave, usuarioId: c.usuario_convidado_id, email: c.email_convidado, nome: String(c.email_convidado ?? "").split("@")[0] });
    } else if (c.usuario_convidado_id === eu && c.dono_id) {
      const chave = c.dono_id as string;
      if (!mapa.has(chave)) mapa.set(chave, { chave, usuarioId: c.dono_id, email: null, nome: "..." });
    }
  }
  const lista = [...mapa.values()];
  await Promise.all(
    lista
      .filter((p) => p.usuarioId)
      .map(async (p) => {
        const { data: nome } = await supabase.rpc("nome_do_usuario", { p_user_id: p.usuarioId });
        if (nome) p.nome = String(nome).split("@")[0].split(" ")[0];
      })
  );
  return lista;
}
