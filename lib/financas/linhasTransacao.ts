// Etapa 351 — monta as linhas de um lançamento (simples, parcelado ou
// "repetir todo mês") a partir do formulário. O servidor usa pra gravar e
// o app usa pra mostrar na hora, sem internet — mesma regra nos dois.
// Os ids podem vir do aparelho (campos idCliente, idParcela, grupoCliente,
// idRecorrenciaCliente): assim o mesmo lançamento não duplica se for
// enviado de novo, e dá pra editar antes mesmo de chegar no banco.
import { esquemaTransacao, primeiroErro } from "@/lib/validacao/financas";
import { normalizarEtiquetas } from "@/lib/financas/etiquetas";
import { dividirParcelas, somarMesesISO } from "@/lib/financas/parcelas";

type Campos = { get(n: string): FormDataEntryValue | null; getAll(n: string): FormDataEntryValue[] };

export const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuidOuNulo = (v: unknown) => (typeof v === "string" && RE_UUID.test(v) ? v : null);

export function etiquetasDoFormulario(formData: Campos): string[] | null {
  const lista = normalizarEtiquetas(formData.getAll("etiquetas").map(String));
  return lista.length ? lista : null;
}

export function dadosTransacaoDoFormulario(formData: Campos) {
  return {
    tipo: formData.get("tipo"),
    valor: formData.get("valor"),
    contaId: formData.get("contaId"),
    categoriaId: formData.get("categoriaId"),
    descricao: formData.get("descricao"),
    data: formData.get("data") || new Date().toLocaleDateString("sv-SE"),
    recorrente: formData.get("recorrente"),
    diaMes: formData.get("diaMes"),
    dataFimRecorrencia: formData.get("dataFimRecorrencia"),
  };
}

export type LinhasTransacao = {
  linhas: Record<string, unknown>[];
  recorrencia: Record<string, unknown> | null;
  parcelado: boolean;
  /** pro aviso de conta compartilhada */
  resumo: { tipo: string; valor: number; descricao: string | null; categoriaId: string | null; contaId: string; data: string; parcelas?: number };
};

/**
 * `novoId` gera um id quando o aparelho não mandou (servidor: randomUUID;
 * app: crypto.randomUUID). Devolve { erro } se o formulário não passa.
 */
export function linhasTransacao(formData: Campos, donoId: string, novoId: () => string): { erro: string } | LinhasTransacao {
  const r = esquemaTransacao.safeParse(dadosTransacaoDoFormulario(formData));
  if (!r.success) return { erro: primeiroErro(r) };
  const d = r.data;
  const etiquetas = etiquetasDoFormulario(formData);

  if (formData.get("parcelado") === "on") {
    const valores = dividirParcelas(d.valor, Number(formData.get("numParcelas")), formData.get("modoParcela") === "parcela" ? "parcela" : "total");
    const n = valores.length;
    const grupo = uuidOuNulo(formData.get("grupoCliente")) ?? novoId();
    const idsDoAparelho = formData.getAll("idParcela").map(String);
    const usarIds = idsDoAparelho.length === n && idsDoAparelho.every((x) => RE_UUID.test(x));
    const nomeBase = d.descricao || "Compra parcelada";
    const linhas = Array.from({ length: n }, (_, i) => ({
      id: usarIds ? idsDoAparelho[i] : novoId(),
      dono_id: donoId,
      conta_id: d.contaId,
      categoria_id: d.categoriaId,
      tipo: d.tipo,
      valor: valores[i],
      descricao: `${nomeBase} (${i + 1}/${n})`,
      etiquetas,
      data: somarMesesISO(d.data, i),
      parcela_grupo: grupo,
      parcela_numero: i + 1,
      parcela_total: n,
    }));
    return {
      linhas,
      recorrencia: null,
      parcelado: true,
      resumo: { tipo: d.tipo, valor: valores.reduce((s, v) => s + v, 0), descricao: nomeBase, categoriaId: d.categoriaId, contaId: d.contaId, data: d.data, parcelas: n },
    };
  }

  const idTransacao = uuidOuNulo(formData.get("idCliente")) ?? novoId();
  // "Repetir todo mês": a recorrência começa na data do lançamento e o
  // primeiro lançamento fica ligado a ela (Etapa 205)
  const recorrencia =
    d.recorrente && d.diaMes
      ? {
          id: uuidOuNulo(formData.get("idRecorrenciaCliente")) ?? novoId(),
          dono_id: donoId,
          conta_id: d.contaId,
          categoria_id: d.categoriaId,
          tipo: d.tipo,
          valor: d.valor,
          descricao: d.descricao,
          dia_mes: d.diaMes,
          data_fim: d.dataFimRecorrencia,
          data_inicio: d.data,
        }
      : null;
  return {
    linhas: [
      {
        id: idTransacao,
        dono_id: donoId,
        conta_id: d.contaId,
        categoria_id: d.categoriaId,
        tipo: d.tipo,
        valor: d.valor,
        descricao: d.descricao,
        data: d.data,
        etiquetas,
        ...(recorrencia ? { recorrencia_id: recorrencia.id } : {}),
      },
    ],
    recorrencia,
    parcelado: false,
    resumo: { tipo: d.tipo, valor: Number(d.valor), descricao: d.descricao, categoriaId: d.categoriaId, contaId: d.contaId, data: d.data },
  };
}
