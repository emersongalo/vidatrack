import { criarClienteAdmin } from "@/lib/supabase/admin";
import { diaBateComFrequencia } from "@/lib/agenda/dias";

/**
 * Versão para uso no cron (cliente administrativo, sem sessão de
 * usuário) — filtra explicitamente por dono_id já que o admin client
 * ignora RLS.
 */
export async function buscarHabitosDoDiaAdmin(usuarioId: string, dataISO: string) {
  const supabase = criarClienteAdmin("resumo_diario_telegram", "Montar o resumo diário de hábitos pro Telegram");

  const { data: habitos } = await supabase
    .from("habitos")
    .select("id, nome, icone, frequencia, dias_semana")
    .eq("dono_id", usuarioId)
    .eq("arquivado", false);

  const doDia = (habitos ?? []).filter((h) =>
    diaBateComFrequencia(h.frequencia, h.dias_semana ?? [], dataISO)
  );

  if (doDia.length === 0) return [];

  const { data: checkins } = await supabase
    .from("habito_checkins")
    .select("habito_id, quantidade")
    .eq("usuario_id", usuarioId)
    .eq("data", dataISO)
    .in(
      "habito_id",
      doDia.map((h) => h.id)
    );

  const feitos = new Set((checkins ?? []).filter((c) => c.quantidade > 0).map((c) => c.habito_id));

  return doDia.map((h) => ({ nome: h.nome, icone: h.icone, feito: feitos.has(h.id) }));
}
