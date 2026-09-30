// Etapa 233 — o que acontece no servidor quando alguém faz, cutuca ou
// reage num hábito em dupla: grava a interação (com a sessão da pessoa,
// então as regras de acesso do banco valem) e avisa o(s) outro(s).
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { avisarUsuario } from "@/lib/push/avisarUsuario";
import { dataAtualNoFuso } from "@/lib/tempo/fuso";
import { primeiroNome, REACOES } from "@/lib/habitos/dupla";

export type AcaoDupla = "feito" | "cutucar" | "reacao";

type Resultado = { ok: boolean; tipo?: string; avisados?: number; todosFizeram?: boolean; jaFeito?: boolean; erro?: string };

const CHAVE_UNICA = "habito_id,de_usuario,para_usuario,tipo,data";

export async function processarDupla(
  supabase: any,
  usuarioId: string,
  pedido: { acao: AcaoDupla; habitoId: string; data?: string; emoji?: string }
): Promise<Resultado> {
  const data = pedido.data && /^\d{4}-\d{2}-\d{2}$/.test(pedido.data) ? pedido.data : dataAtualNoFuso();

  const { data: habito } = await supabase.from("habitos").select("id, nome, meta_diaria, dono_id").eq("id", pedido.habitoId).maybeSingle();
  if (!habito) return { ok: false, erro: "Hábito não encontrado" };

  const admin = criarClienteAdmin("habitos_dupla", "Avisar o parceiro de um hábito compartilhado (fez, cutucou, reagiu)");

  // quem participa: dono + convidados
  const { data: convites } = await admin
    .from("compartilhamentos")
    .select("usuario_convidado_id")
    .eq("tipo_item", "habito")
    .eq("item_id", habito.id);
  const pessoas = new Set<string>([habito.dono_id, ...(convites ?? []).map((c: any) => c.usuario_convidado_id)].filter(Boolean));
  if (!pessoas.has(usuarioId)) return { ok: false, erro: "Sem acesso" };
  pessoas.delete(usuarioId);
  const outros = [...pessoas];
  if (!outros.length) return { ok: true, avisados: 0 };

  // quem já bateu a meta nesse dia
  const meta = Math.max(1, Number(habito.meta_diaria) || 1);
  const { data: checkins } = await admin
    .from("habito_checkins")
    .select("usuario_id, quantidade")
    .eq("habito_id", habito.id)
    .eq("data", data);
  const soma = new Map<string, number>();
  for (const c of checkins ?? []) soma.set(c.usuario_id, (soma.get(c.usuario_id) ?? 0) + Number(c.quantidade ?? 1));
  const fez = (u: string) => (soma.get(u) ?? 0) >= meta;

  const { data: perfilEu } = await admin.from("perfis").select("nome").eq("id", usuarioId).maybeSingle();
  let meuNome = perfilEu?.nome as string | null;
  if (!meuNome) {
    const { data: n } = await admin.rpc("nome_do_usuario", { p_user_id: usuarioId });
    meuNome = (n as string) ?? null;
  }
  const deNome = primeiroNome(meuNome);
  const habitoNome = String(habito.nome).slice(0, 80);
  const base = { habito_id: habito.id, de_usuario: usuarioId, data, de_nome: deNome, habito_nome: habitoNome };

  let tipo: "feito" | "dupla" | "cutucar" | "reacao";
  let alvos: string[];
  let emoji: string | null = null;
  let substituir = false;

  if (pedido.acao === "feito") {
    if (!fez(usuarioId)) return { ok: false, erro: "Ainda não está feito" };
    const todos = outros.every(fez);
    tipo = todos ? "dupla" : "feito";
    alvos = outros;
  } else if (pedido.acao === "cutucar") {
    tipo = "cutucar";
    alvos = outros.filter((u) => !fez(u));
    if (!alvos.length) return { ok: true, avisados: 0, jaFeito: true };
  } else {
    emoji = REACOES.includes(pedido.emoji as any) ? (pedido.emoji as string) : "❤️";
    tipo = "reacao";
    const quemFez = outros.filter(fez);
    alvos = quemFez.length ? quemFez : outros;
    substituir = true;
  }

  const linhas = alvos.map((para) => ({ ...base, para_usuario: para, tipo, emoji, criado_em: new Date().toISOString(), visto_em: null }));
  const { data: gravadas, error } = await supabase
    .from("habito_interacoes")
    .upsert(linhas, { onConflict: CHAVE_UNICA, ignoreDuplicates: !substituir })
    .select("para_usuario");
  if (error) return { ok: false, erro: error.message };

  // avisa só quem ganhou uma interação nova (não repete o mesmo aviso no dia)
  const novos = [...new Set((gravadas ?? []).map((g: any) => g.para_usuario as string))];
  const { data: prefs } = novos.length
    ? await admin.from("perfis").select("id, avisos_dupla").in("id", novos)
    : { data: [] as any[] };
  const desligados = new Set((prefs ?? []).filter((p: any) => p.avisos_dupla === false).map((p: any) => p.id));

  const [titulo, corpo] =
    tipo === "dupla"
      ? [`🙌 Vocês fizeram ${habitoNome}!`, `${deNome} acabou de fazer também. Mais um dia juntos 🔥`]
      : tipo === "feito"
        ? [`💚 ${deNome} fez ${habitoNome}`, "Agora é sua vez! Bora manter a dupla em dia?"]
        : tipo === "cutucar"
          ? [`👉 ${deNome} te cutucou`, `Bora ${habitoNome}? Tô te esperando 💪`]
          : [`${emoji} ${deNome} reagiu`, `Ao seu ${habitoNome} de hoje`];

  let avisados = 0;
  for (const u of novos as string[]) {
    if (desligados.has(u)) continue;
    try {
      avisados += await avisarUsuario(admin, u, titulo, corpo, "/habitos");
    } catch {
      /* aviso é bônus: nunca derruba a marcação */
    }
  }
  return { ok: true, tipo, avisados, todosFizeram: tipo === "dupla" };
}
