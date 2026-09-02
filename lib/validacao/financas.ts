import { z } from "zod";

// Aceita "45,90" (formato brasileiro) ou "45.90" e converte pra número
const valorMonetario = z
  .string()
  .trim()
  .min(1, "Informe um valor")
  .transform((v) => Number(v.replace(",", ".")))
  .pipe(z.number({ invalid_type_error: "Valor inválido" }).positive("O valor precisa ser maior que zero"));

const valorMonetarioOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v.replace(",", ".")) : null))
  .pipe(z.number().positive("O valor precisa ser maior que zero").nullable());

const uuidObrigatorio = (mensagem: string) => z.string().uuid(mensagem);
const uuidOpcional = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .pipe(z.string().uuid().nullable());

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

export const esquemaTransacao = z.object({
  tipo: z.enum(["receita", "despesa"], { errorMap: () => ({ message: "Escolha receita ou despesa" }) }),
  valor: valorMonetario,
  contaId: uuidObrigatorio("Escolha uma conta"),
  categoriaId: uuidOpcional,
  descricao: z.string().trim().max(200, "Descrição muito longa").optional().transform((v) => v || null),
  data: dataISO,
  recorrente: z.string().nullable().optional().transform((v) => v === "on"),
  diaMes: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(1).max(28).nullable()),
  dataFimRecorrencia: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || null),
});

export const esquemaConta = z.object({
  nome: z.string().trim().min(1, "Dê um nome para a conta").max(60, "Nome muito longo"),
  tipo: z.enum(["carteira", "banco", "cartao"]),
  banco: z.string().trim().optional().transform((v) => v || "outro"),
  saldoInicial: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v.replace(",", ".")) : 0))
    .pipe(z.number({ invalid_type_error: "Saldo inicial inválido" })),
});

export const esquemaCategoria = z.object({
  nome: z.string().trim().min(1, "Dê um nome para a categoria").max(40, "Nome muito longo"),
  tipo: z.enum(["receita", "despesa"]),
  metaMensal: valorMonetarioOpcional,
  icone: z.string().trim().min(1).max(8).optional().transform((v) => v || "💰"),
  cor: z.enum(["financa", "habito", "nota", "neutro"]).optional().transform((v) => v || "financa"),
});

export const esquemaRecorrencia = z.object({
  tipo: z.enum(["receita", "despesa"]),
  valor: valorMonetario,
  contaId: uuidObrigatorio("Escolha uma conta"),
  categoriaId: uuidOpcional,
  descricao: z.string().trim().max(200, "Descrição muito longa").optional().transform((v) => v || null),
  diaMes: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1, "Dia entre 1 e 28").max(28, "Dia entre 1 e 28")),
  dataFim: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || null),
});

/**
 * Extrai o primeiro erro de um resultado do Zod, em português — pra
 * usar direto na mensagem de redirect das server actions.
 */
export function primeiroErro(resultado: z.SafeParseReturnType<any, any>): string {
  if (resultado.success) return "";
  return resultado.error.issues[0]?.message ?? "Dados inválidos";
}
