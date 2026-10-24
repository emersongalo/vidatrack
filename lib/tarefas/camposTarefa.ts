// Etapa 350 — leitura do formulário de tarefa num lugar só (servidor e
// app usam a mesma regra; o app mostra na hora, mesmo sem internet).
import { hojeISO } from "@/lib/habitos/streak";

type Campos = { get(n: string): FormDataEntryValue | null; getAll(n: string): FormDataEntryValue[] };

// Etapa 193 — lê os campos de repetição/prioridade do formulário e
// devolve já no formato das colunas.
const REPETICOES_VALIDAS = ["nenhuma", "diaria", "dias_semana", "mensal", "anual", "intervalo"];

export function camposRepeticao(formData: Campos) {
  const repetirRaw = String(formData.get("repetir") ?? "nenhuma");
  const repetir = REPETICOES_VALIDAS.includes(repetirRaw) ? repetirRaw : "nenhuma";
  const diasSemana = formData.getAll("diasSemana").map(Number);
  const dataRaw = String(formData.get("data") ?? "");
  const limitar = (v: number, min: number, max: number) => (Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : null);
  const diaMes = limitar(Number(formData.get("diaMes")), 1, 31);
  const mes = limitar(Number(formData.get("mes")), 1, 12);
  const intervaloDias = limitar(Number(formData.get("intervaloDias")), 1, 365);
  const prioridade = limitar(Number(formData.get("prioridade") ?? 0), 0, 3) ?? 0;

  return {
    repetir,
    dias_semana: repetir === "dias_semana" ? diasSemana : [],
    // "data" = dia da tarefa única, ou o dia de início do "a cada N dias"
    data: repetir === "nenhuma" || repetir === "intervalo" ? dataRaw || hojeISO() : null,
    dia_mes: repetir === "mensal" || repetir === "anual" ? diaMes : null,
    mes: repetir === "anual" ? mes : null,
    intervalo_dias: repetir === "intervalo" ? intervaloDias : null,
    prioridade,
  };
}

// Etapa 194 — tarefa ligada a finanças. Ao concluir, o banco (trigger
// lancar_transacao_da_tarefa) cria o lançamento sozinho; desmarcar remove.
export function camposFinanca(formData: Campos): { erro?: string; campos: Record<string, unknown> } {
  const vazio = { financa_tipo: null, financa_valor: null, financa_conta_id: null, financa_categoria_id: null };
  if (formData.get("financaVinculado") !== "on") return { campos: vazio };
  const tipo = formData.get("financaTipo") === "receita" ? "receita" : "despesa";
  const valor = Number(String(formData.get("financaValor") ?? "").replace(/\./g, "").replace(",", "."));
  const contaId = String(formData.get("financaContaId") ?? "");
  const categoriaId = String(formData.get("financaCategoriaId") ?? "");
  if (!valor || valor <= 0) return { erro: "Informe o valor que será lançado ao concluir a tarefa", campos: vazio };
  if (!contaId) return { erro: "Escolha a conta do lançamento", campos: vazio };
  return {
    campos: {
      financa_tipo: tipo,
      financa_valor: Math.round(valor * 100) / 100,
      financa_conta_id: contaId,
      financa_categoria_id: categoriaId || null,
    },
  };
}

/** campos da edição (o que atualizarTarefa grava) — ou o erro de validação */
export function camposEdicaoTarefa(formData: Campos): { erro?: string; campos?: Record<string, unknown> } {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return { erro: "Dê um título para a tarefa" };
  const financa = camposFinanca(formData);
  if (financa.erro) return { erro: financa.erro };
  return {
    campos: {
      titulo,
      icone: String(formData.get("icone") ?? "NotebookPen"),
      categoria_id: String(formData.get("categoriaId") ?? "") || null,
      ...camposRepeticao(formData),
      horario_lembrete: String(formData.get("horarioLembrete") ?? "") || null,
      observacoes: String(formData.get("observacoes") ?? "").trim() || null,
      ...financa.campos,
    },
  };
}
