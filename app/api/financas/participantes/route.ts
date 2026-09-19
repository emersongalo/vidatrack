import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { resolverUrlFoto } from "@/lib/perfil/foto";

/**
 * Etapa 144 — voltou a mostrar quem compartilha suas contas na tela
 * de Início (tinha ficado de fora na conversão pra local-first,
 * Etapa 127, porque foto de perfil precisa de uma chave que só pode
 * ficar no servidor). Busca direto (não entra no retrato local) e só
 * roda com internet — offline, a tela de Início simplesmente não
 * mostra os avatares, sem quebrar nada.
 */
export async function GET() {
  const supabase = createClient();
  const user = await getUsuarioAtual();
  if (!user) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { data: minhasContas } = await supabase.from("financa_contas").select("id").eq("dono_id", user.id);
  const idsMinhasContas = (minhasContas ?? []).map((c) => c.id);

  // Duas direções: gente que EU convidei pras minhas contas, e o dono
  // de uma conta que ALGUÉM compartilhou comigo. "item_id" é genérico
  // (serve pra hábito/tarefa/conta, conforme "tipo_item"), então não
  // dá pra usar join automático do Supabase aqui — busca em 2 passos.
  const [{ data: convidadosPorMim }, { data: contasCompartilhadasComigo }] = await Promise.all([
    idsMinhasContas.length
      ? supabase
          .from("compartilhamentos")
          .select("usuario_convidado_id")
          .eq("tipo_item", "financa")
          .in("item_id", idsMinhasContas)
          .not("usuario_convidado_id", "is", null)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from("compartilhamentos")
      .select("item_id")
      .eq("tipo_item", "financa")
      .eq("usuario_convidado_id", user.id),
  ]);

  const idsOutraPessoa = new Set<string>();
  for (const c of convidadosPorMim ?? []) {
    if (c.usuario_convidado_id) idsOutraPessoa.add(c.usuario_convidado_id);
  }

  const idsContasDeOutros = (contasCompartilhadasComigo ?? []).map((c) => c.item_id);
  if (idsContasDeOutros.length > 0) {
    const { data: contasDeOutros } = await supabase
      .from("financa_contas")
      .select("dono_id")
      .in("id", idsContasDeOutros);
    for (const c of contasDeOutros ?? []) {
      if (c.dono_id) idsOutraPessoa.add(c.dono_id);
    }
  }

  if (idsOutraPessoa.size === 0) {
    return NextResponse.json({ pessoas: [] });
  }

  const { data: perfis } = await supabase
    .from("perfis")
    .select("id, nome, foto_url")
    .in("id", Array.from(idsOutraPessoa));

  const { data: meuPerfil } = await supabase.from("perfis").select("nome, foto_url").eq("id", user.id).maybeSingle();

  const pessoas = await Promise.all(
    [{ nome: meuPerfil?.nome ?? "Você", foto_url: meuPerfil?.foto_url ?? null }, ...(perfis ?? [])].map(
      async (p) => ({
        nome: p.nome ?? "Alguém",
        urlFoto: await resolverUrlFoto(p.foto_url),
      })
    )
  );

  return NextResponse.json({ pessoas });
}
