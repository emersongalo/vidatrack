// Etapa 350 — leitura do formulário de hábito num lugar só: o servidor
// usa pra salvar e o app usa pra mostrar na hora (sem internet) o mesmo
// resultado que vai ficar no banco.
import { normalizarHorarios } from "@/lib/habitos/horariosLembrete";

type Campos = { get(n: string): FormDataEntryValue | null; getAll(n: string): FormDataEntryValue[] };

export function camposHabito(formData: Campos, habitoId?: string) {
  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "habito");
  const icone = String(formData.get("icone") ?? "Droplet");
  const frequencia = String(formData.get("frequencia") ?? "diaria");
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const vezesSemana = Math.max(1, Math.min(7, Math.round(Number(formData.get("vezesSemana")) || 3)));
  const categoriaIdRaw = String(formData.get("categoriaId") ?? "");
  // Etapa 216 — vários horários (o primeiro continua em horario_lembrete)
  const horariosEnviados = formData.getAll("horariosLembrete").map(String);
  const horarios = normalizarHorarios(horariosEnviados.length ? horariosEnviados : [String(formData.get("horarioLembrete") ?? "")]);
  const metaDiaria = Math.max(1, Number(formData.get("metaDiaria") ?? "1") || 1);
  const unidade = String(formData.get("unidade") ?? "").trim() || null;
  const ehNegativo = formData.get("ehNegativo") === "true";
  // Etapa 249 — economia por dia (hábito de parar) e "fazer logo depois de"
  const economiaBruta = String(formData.get("economiaDia") ?? "").replace(/\./g, "").replace(",", ".").trim();
  const economiaDia = ehNegativo && Number(economiaBruta) > 0 ? Math.round(Number(economiaBruta) * 100) / 100 : null;
  const depoisDeBruto = String(formData.get("depoisDe") ?? "");
  const depoisDe = !ehNegativo && /^[0-9a-f-]{36}$/i.test(depoisDeBruto) && depoisDeBruto !== habitoId ? depoisDeBruto : null;

  return {
    nome,
    cor,
    icone,
    frequencia,
    dias_semana: frequencia === "dias_semana" ? diasSemana : [],
    vezes_semana: frequencia === "semanal" ? vezesSemana : null,
    categoria_id: categoriaIdRaw || null,
    horario_lembrete: horarios[0] || null,
    horarios_lembrete: horarios.length ? horarios : null,
    meta_diaria: metaDiaria,
    unidade,
    eh_negativo: ehNegativo,
    economia_dia: economiaDia,
    depois_de: depoisDe,
  };
}
