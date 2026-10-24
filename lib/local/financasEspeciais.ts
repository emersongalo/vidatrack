"use client";

// Etapa 351 — lançamentos "especiais" sem internet: parcelado, repetir
// todo mês, editar parcela/conta fixa, apagar, transferência e pagar
// fatura. Monta o pedido pra fila + o que muda no retrato do aparelho,
// com as MESMAS regras que o servidor usa.
import type { Patch } from "@/lib/offline/patches";
import type { PedidoOffline } from "@/lib/local/acaoOffline";
import { novoUuid } from "@/lib/local/financas";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { linhasTransacao, dadosTransacaoDoFormulario, etiquetasDoFormulario } from "@/lib/financas/linhasTransacao";
import { esquemaTransacao, primeiroErro } from "@/lib/validacao/financas";

const transacoes = () => ((lerSnapshotOffline()?.financas.transacoes ?? []) as any[]);

/** criar (parcelado / repetir todo mês / simples) — ids nascem aqui */
export function pedidoCriarTransacao(fd: FormData): PedidoOffline | string {
  const snap = lerSnapshotOffline();
  const r = linhasTransacao(fd, snap?.perfil.id ?? "", novoUuid);
  if ("erro" in r) return r.erro;
  // o servidor vai usar exatamente esses ids
  fd.delete("idParcela");
  if (r.parcelado) {
    fd.set("grupoCliente", String(r.linhas[0].parcela_grupo));
    for (const l of r.linhas) fd.append("idParcela", String(l.id));
  } else {
    fd.set("idCliente", String(r.linhas[0].id));
    if (r.recorrencia) fd.set("idRecorrenciaCliente", String(r.recorrencia.id));
  }
  const agora = new Date().toISOString();
  const patches: Patch[] = r.linhas.map((l) => ({
    colecao: "financas.transacoes",
    op: "upsert",
    id: String(l.id),
    valores: { ...l, criado_em: agora },
  }));
  if (r.recorrencia) {
    patches.push({ colecao: "financas.recorrencias", op: "upsert", id: String(r.recorrencia.id), valores: { ...r.recorrencia, ativo: true } });
  }
  const nome = r.resumo.descricao || (r.resumo.tipo === "receita" ? "Receita" : "Despesa");
  return { acao: "criarTransacao", args: [fd], patches, rotulo: r.parcelado ? `${nome} (${r.linhas.length}×)` : nome };
}

/** editar (inclusive parcela "aplicar nas próximas" e conta fixa "este/próximos") */
export function pedidoAtualizarTransacao(id: string, fd: FormData): PedidoOffline | string {
  const r = esquemaTransacao.safeParse(dadosTransacaoDoFormulario(fd));
  if (!r.success) return primeiroErro(r);
  const d = r.data;
  const patches: Patch[] = [
    {
      colecao: "financas.transacoes",
      op: "mesclar",
      id,
      valores: {
        conta_id: d.contaId,
        categoria_id: d.categoriaId,
        tipo: d.tipo,
        valor: d.valor,
        descricao: d.descricao,
        data: d.data,
        ...(fd.get("etiquetasPresente") ? { etiquetas: etiquetasDoFormulario(fd) } : {}),
      },
    },
  ];
  const lista = transacoes();
  // parcela: aplicar valor/conta/categoria às próximas
  const grupo = String(fd.get("parcelaGrupo") ?? "");
  const numero = Number(fd.get("parcelaNumero") ?? 0);
  if (grupo && fd.get("aplicarParcelas") === "on") {
    for (const t of lista.filter((t) => t.parcela_grupo === grupo && Number(t.parcela_numero) > numero)) {
      patches.push({ colecao: "financas.transacoes", op: "mesclar", id: t.id, valores: { conta_id: d.contaId, categoria_id: d.categoriaId, tipo: d.tipo, valor: d.valor } });
    }
  }
  // conta fixa: este / próximos / parar
  const recorrenciaId = String(fd.get("recorrenciaId") ?? "");
  if (recorrenciaId) {
    const escopo = fd.get("escopoRecorrencia") === "so_este" ? "so_este" : "proximos";
    const parar = fd.get("pararRecorrencia") === "on";
    const mudancas: Record<string, unknown> = {};
    if (escopo === "proximos") {
      Object.assign(mudancas, { conta_id: d.contaId, categoria_id: d.categoriaId, tipo: d.tipo, valor: d.valor, descricao: d.descricao, dia_mes: Math.min(28, Number(d.data.slice(8, 10)) || 1) });
    }
    if (parar) mudancas.data_fim = d.data;
    if (Object.keys(mudancas).length) patches.push({ colecao: "financas.recorrencias", op: "mesclar", id: recorrenciaId, valores: mudancas });
    const depois = lista.filter((t) => t.recorrencia_id === recorrenciaId && String(t.data) > d.data);
    for (const t of depois) {
      if (parar) patches.push({ colecao: "financas.transacoes", op: "remover", id: t.id });
      else if (escopo === "proximos")
        patches.push({ colecao: "financas.transacoes", op: "mesclar", id: t.id, valores: { conta_id: d.contaId, categoria_id: d.categoriaId, tipo: d.tipo, valor: d.valor, descricao: d.descricao } });
    }
  }
  return { acao: "atualizarTransacao", args: [id, fd], patches, rotulo: d.descricao || "Editar lançamento" };
}

/** apagar (transferência apaga as duas pontas) */
export function pedidoRemoverTransacao(idOuItem: string | { id: string; descricao?: string | null; transferencia_grupo?: string | null }): PedidoOffline {
  const t =
    typeof idOuItem === "string" ? transacoes().find((x) => x.id === idOuItem) ?? { id: idOuItem } : idOuItem;
  const patches: Patch[] = t.transferencia_grupo
    ? [{ colecao: "financas.transacoes", op: "removerOnde", campo: "transferencia_grupo", valor: t.transferencia_grupo }]
    : [{ colecao: "financas.transacoes", op: "remover", id: t.id }];
  return { acao: "removerTransacao", args: [t.id], patches, rotulo: `Apagar ${t.descricao || "lançamento"}` };
}

/** apagar esta parcela e as seguintes */
export function pedidoRemoverParcelasDaqui(id: string): PedidoOffline {
  const lista = transacoes();
  const t = lista.find((x) => x.id === id);
  const alvo = t?.parcela_grupo ? lista.filter((x) => x.parcela_grupo === t.parcela_grupo && Number(x.parcela_numero) >= Number(t.parcela_numero ?? 1)) : [{ id }];
  return {
    acao: "removerParcelasDaqui",
    args: [id],
    patches: alvo.map((x) => ({ colecao: "financas.transacoes" as const, op: "remover" as const, id: x.id })),
    rotulo: "Apagar parcelas",
  };
}

/** transferência entre contas / pagar fatura */
export function pedidoTransferencia(fd: FormData): PedidoOffline | string {
  const origem = String(fd.get("contaOrigemId") ?? "");
  const destino = String(fd.get("contaDestinoId") ?? "");
  const valor = Number(String(fd.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  const data = String(fd.get("data") ?? "") || new Date().toLocaleDateString("sv-SE");
  const descricao = String(fd.get("descricao") ?? "").trim().slice(0, 200);
  if (!origem || !destino) return "Escolha as duas contas";
  if (origem === destino) return "A conta de origem e a de destino precisam ser diferentes";
  if (!valor || valor <= 0) return "Informe um valor válido";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return "Data inválida";
  const snap = lerSnapshotOffline();
  const nome = (id: string) => ((snap?.financas.contas ?? []) as any[]).find((c) => c.id === id)?.nome ?? "conta";
  const grupo = novoUuid();
  const idOrigem = novoUuid();
  const idDestino = novoUuid();
  fd.set("grupoCliente", grupo);
  fd.set("idOrigemCliente", idOrigem);
  fd.set("idDestinoCliente", idDestino);
  const base = { dono_id: snap?.perfil.id, valor: Math.round(valor * 100) / 100, data, transferencia_grupo: grupo, categoria_id: null, criado_em: new Date().toISOString() };
  return {
    acao: "criarTransferencia",
    args: [fd],
    patches: [
      { colecao: "financas.transacoes", op: "upsert", id: idOrigem, valores: { ...base, conta_id: origem, tipo: "despesa", descricao: descricao || `Transferência para ${nome(destino)}` } },
      { colecao: "financas.transacoes", op: "upsert", id: idDestino, valores: { ...base, conta_id: destino, tipo: "receita", descricao: descricao || `Transferência de ${nome(origem)}` } },
    ],
    rotulo: descricao || "Transferência",
  };
}

/** Etapa 354 — guardar em investimento (sai de uma conta, entra na de investimento) */
export function pedidoInvestir(fd: FormData): PedidoOffline | string {
  const origem = String(fd.get("contaOrigemId") ?? "");
  const destino = String(fd.get("contaInvestimentoId") ?? "");
  const valor = Number(String(fd.get("valor") ?? "").replace(/\./g, "").replace(",", "."));
  const data = String(fd.get("data") ?? "") || new Date().toLocaleDateString("sv-SE");
  if (!origem || !destino || !valor || valor <= 0) return "Preencha a conta de origem, a conta de investimento e um valor válido";
  if (origem === destino) return "A conta de origem precisa ser diferente da de investimento";
  const snap = lerSnapshotOffline();
  const eu = snap?.perfil.id;
  const cat = ((snap?.financas.categorias ?? []) as any[]).find((c) => c.dono_id === eu && c.nome === "Investimento" && c.tipo === "despesa");
  const idSaida = novoUuid();
  const idEntrada = novoUuid();
  fd.set("idOrigemCliente", idSaida);
  fd.set("idDestinoCliente", idEntrada);
  const base = { dono_id: eu, valor: Math.round(valor * 100) / 100, data, criado_em: new Date().toISOString() };
  return {
    acao: "transferirParaInvestimento",
    args: [fd],
    patches: [
      { colecao: "financas.transacoes", op: "upsert", id: idSaida, valores: { ...base, conta_id: origem, categoria_id: cat?.id ?? null, tipo: "despesa", descricao: "Transferência pra investimento" } },
      { colecao: "financas.transacoes", op: "upsert", id: idEntrada, valores: { ...base, conta_id: destino, categoria_id: null, tipo: "receita", descricao: "Transferência recebida" } },
    ],
    rotulo: "Guardar em investimento",
  };
}
