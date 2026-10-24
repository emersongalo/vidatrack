"use client";

// Etapa 352 — contas, cartões, categorias, metas, envelopes, desafios e
// contas fixas sem internet: monta o pedido pra fila + o que muda no
// retrato do aparelho (mesmas regras do servidor). Os itens novos já
// nascem com o id definitivo (o servidor usa o mesmo), então dá pra usar
// uma conta criada offline num lançamento offline, por exemplo.
import type { Patch } from "@/lib/offline/patches";
import type { PedidoOffline } from "@/lib/local/acaoOffline";
import { novoUuid } from "@/lib/local/financas";
import { lerSnapshotOffline } from "@/lib/offline/snapshot";
import { camposConta, camposCategoria } from "@/lib/financas/camposCadastros";
import { camposDesafio } from "@/lib/financas/desafiosQuadrados";
import { esquemaRecorrencia, primeiroErro } from "@/lib/validacao/financas";

const fin = () => (lerSnapshotOffline()?.financas ?? ({} as any)) as any;
const meuId = () => lerSnapshotOffline()?.perfil.id;
const numero = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/\./g, "").replace(",", "."));

// ---------- contas e cartões ----------
export function pedidoCriarConta(fd: FormData): PedidoOffline | string {
  const r = camposConta(fd);
  if ("erro" in r) return r.erro;
  const id = novoUuid();
  fd.set("idCliente", id);
  return {
    acao: "criarConta",
    args: [fd],
    patches: [{ colecao: "financas.contas", op: "upsert", id, valores: { ...r.campos, dono_id: meuId() } }],
    rotulo: `Nova conta "${r.campos.nome}"`,
  };
}

export function pedidoAtualizarConta(id: string, fd: FormData): PedidoOffline | string {
  const r = camposConta(fd);
  if ("erro" in r) return r.erro;
  return { acao: "atualizarConta", args: [id, fd], patches: [{ colecao: "financas.contas", op: "mesclar", id, valores: r.campos }], rotulo: `Editar "${r.campos.nome}"` };
}

export function pedidoArquivarConta(id: string, nome?: string): PedidoOffline {
  return { acao: "arquivarConta", args: [id], patches: [{ colecao: "financas.contas", op: "remover", id }], rotulo: `Arquivar ${nome ?? "conta"}` };
}

/** apaga a conta e tudo dela (lançamentos e contas fixas), igual ao banco */
export function pedidoExcluirConta(id: string, nome?: string): PedidoOffline {
  return {
    acao: "excluirContaDefinitivamente",
    args: [id],
    patches: [
      { colecao: "financas.contas", op: "remover", id },
      { colecao: "financas.transacoes", op: "removerOnde", campo: "conta_id", valor: id },
      { colecao: "financas.recorrencias", op: "removerOnde", campo: "conta_id", valor: id },
    ],
    rotulo: `Excluir ${nome ?? "conta"}`,
  };
}

// ---------- categorias ----------
export function pedidoCriarCategoria(fd: FormData): PedidoOffline | string {
  const r = camposCategoria(fd);
  if ("erro" in r) return r.erro;
  const id = novoUuid();
  fd.set("idCliente", id);
  return {
    acao: "criarCategoria",
    args: [fd],
    patches: [{ colecao: "financas.categorias", op: "upsert", id, valores: { ...r.campos, dono_id: meuId() } }],
    rotulo: `Nova categoria "${r.campos.nome}"`,
  };
}

export function pedidoCategoriaRapida(dados: { nome: string; tipo: "receita" | "despesa"; icone: string }): { pedido: PedidoOffline; categoria: { id: string; nome: string; icone: string; tipo: string } } | string {
  const fd = new FormData();
  fd.set("nome", dados.nome);
  fd.set("tipo", dados.tipo);
  fd.set("icone", dados.icone);
  fd.set("cor", "financa");
  const r = camposCategoria(fd);
  if ("erro" in r) return r.erro;
  const id = novoUuid();
  const categoria = { id, nome: String(r.campos.nome), icone: String(r.campos.icone), tipo: String(r.campos.tipo) };
  return {
    categoria,
    pedido: {
      acao: "criarCategoriaRapida",
      args: [{ ...dados, id }],
      patches: [{ colecao: "financas.categorias", op: "upsert", id, valores: { ...r.campos, dono_id: meuId() } }],
      rotulo: `Nova categoria "${categoria.nome}"`,
    },
  };
}

export function pedidoAtualizarCategoria(id: string, fd: FormData): PedidoOffline | string {
  const r = camposCategoria(fd);
  if ("erro" in r) return r.erro;
  return { acao: "atualizarCategoria", args: [id, fd], patches: [{ colecao: "financas.categorias", op: "mesclar", id, valores: r.campos }], rotulo: `Editar "${r.campos.nome}"` };
}

export function pedidoRemoverCategoria(id: string, nome?: string): PedidoOffline {
  // lançamentos que usavam a categoria ficam sem categoria (igual ao banco)
  const patches: Patch[] = [{ colecao: "financas.categorias", op: "remover", id }];
  for (const t of (fin().transacoes ?? []) as any[]) {
    if (t.categoria_id === id) patches.push({ colecao: "financas.transacoes", op: "mesclar", id: t.id, valores: { categoria_id: null } });
  }
  return { acao: "removerCategoria", args: [id], patches, rotulo: `Apagar categoria ${nome ?? ""}`.trim() };
}

// ---------- metas e envelopes ----------
export function pedidoCriarMeta(fd: FormData): PedidoOffline | string {
  const nome = String(fd.get("nome") ?? "").trim();
  const valorAlvo = numero(fd.get("valorAlvo"));
  const dataAlvo = String(fd.get("dataAlvo") ?? "") || null;
  if (!nome || !valorAlvo || valorAlvo <= 0) return "Dê um nome e um valor alvo válido pra meta";
  const id = novoUuid();
  fd.set("idCliente", id);
  return {
    acao: "criarMeta",
    args: [fd],
    patches: [{ colecao: "financas.metas", op: "upsert", id, valores: { nome, valor_alvo: valorAlvo, data_alvo: dataAlvo, valor_atual: 0, concluida: false } }],
    rotulo: `Nova meta "${nome}"`,
  };
}

function meta(id: string) {
  return ((fin().metas ?? []) as any[]).find((m) => m.id === id);
}

export function pedidoMovimentarMeta(id: string, fd: FormData, sentido: "adicionar" | "retirar"): PedidoOffline | string {
  const valor = numero(fd.get(sentido === "adicionar" ? "valorAdicionar" : "valorRetirar"));
  if (!valor || valor <= 0) return "Informe um valor válido";
  const m = meta(id);
  const patches: Patch[] = [];
  if (m) {
    const atual = Number(m.valor_atual ?? 0);
    const novo = sentido === "adicionar" ? atual + valor : Math.max(0, atual - valor);
    patches.push({ colecao: "financas.metas", op: "mesclar", id, valores: { valor_atual: novo, concluida: novo >= Number(m.valor_alvo) } });
  }
  return {
    acao: sentido === "adicionar" ? "adicionarProgressoMeta" : "retirarDaMeta",
    args: [id, fd],
    patches,
    rotulo: `${sentido === "adicionar" ? "Guardar em" : "Retirar de"} ${m?.nome ?? "meta"}`,
  };
}

export function pedidoEditarMeta(id: string, fd: FormData): PedidoOffline | string {
  const nome = String(fd.get("nome") ?? "").trim();
  const valorAlvo = numero(fd.get("valorAlvo"));
  const dataAlvo = String(fd.get("dataAlvo") ?? "") || null;
  if (!nome || !valorAlvo || valorAlvo <= 0) return "Dê um nome e um valor alvo válido pra meta";
  const m = meta(id);
  return {
    acao: "editarMeta",
    args: [id, fd],
    patches: [{ colecao: "financas.metas", op: "mesclar", id, valores: { nome, valor_alvo: valorAlvo, data_alvo: dataAlvo, concluida: Number(m?.valor_atual ?? 0) >= valorAlvo } }],
    rotulo: `Editar meta "${nome}"`,
  };
}

export function pedidoTirarMeta(id: string, modo: "arquivar" | "excluir"): PedidoOffline {
  return {
    acao: modo === "arquivar" ? "arquivarMeta" : "excluirMetaDefinitivamente",
    args: [id],
    patches: [{ colecao: "financas.metas", op: "remover", id }],
    rotulo: `${modo === "arquivar" ? "Arquivar" : "Excluir"} ${meta(id)?.nome ?? "meta"}`,
  };
}

// ---------- desafios ----------
export function pedidoCriarDesafio(fd: FormData): { pedido: PedidoOffline; id: string } | string {
  const c = camposDesafio(fd);
  if ("erro" in c) return c.erro ?? "Preenche todos os campos certinho";
  const id = novoUuid();
  fd.set("idCliente", id);
  fd.delete("idQuadrado");
  const quadrados = c.quadrados.map((q) => ({ ...q, id: novoUuid() }));
  for (const q of quadrados) fd.append("idQuadrado", q.id);
  const patches: Patch[] = [
    {
      colecao: "financas.desafios",
      op: "upsert",
      id,
      valores: { nome: c.nome, quantidade_quadrados: c.prazoQuantidade, valor_alvo: c.valorAlvo, valor_guardado: 0, concluido: false, conta_origem_id: c.contaOrigemId },
    },
    ...quadrados.map((q) => ({
      colecao: "financas.desafioQuadrados" as const,
      op: "upsert" as const,
      id: q.id,
      valores: { desafio_id: id, numero: q.numero, valor: q.valor, completado: false },
    })),
  ];
  return { id, pedido: { acao: "criarDesafio", args: [fd], patches, rotulo: `Desafio "${c.nome}"` } };
}

export function pedidoCompletarQuadrado(desafioId: string, quadradoId: string): PedidoOffline | string {
  const f = fin();
  const d = ((f.desafios ?? []) as any[]).find((x) => x.id === desafioId);
  const q = ((f.desafioQuadrados ?? []) as any[]).find((x) => x.id === quadradoId);
  if (!d || !q) return "Não encontrei esse desafio no aparelho.";
  if (q.completado) return "Esse quadradinho já foi marcado.";
  const idTransacao = novoUuid();
  const feitos = ((f.desafioQuadrados ?? []) as any[]).filter((x) => x.desafio_id === desafioId && x.completado).length + 1;
  return {
    acao: "completarQuadrado",
    args: [desafioId, quadradoId, idTransacao],
    patches: [
      { colecao: "financas.desafioQuadrados", op: "mesclar", id: quadradoId, valores: { completado: true } },
      {
        colecao: "financas.desafios",
        op: "mesclar",
        id: desafioId,
        valores: { valor_guardado: Number(d.valor_guardado ?? 0) + Number(q.valor), concluido: feitos >= Number(d.quantidade_quadrados) },
      },
      {
        colecao: "financas.transacoes",
        op: "upsert",
        id: idTransacao,
        valores: {
          dono_id: meuId(),
          conta_id: d.conta_origem_id,
          categoria_id: null,
          tipo: "despesa",
          valor: Number(q.valor),
          descricao: `Desafio: ${d.nome}`,
          data: new Date().toLocaleDateString("sv-SE"),
          criado_em: new Date().toISOString(),
        },
      },
    ],
    rotulo: `Desafio "${d.nome}"`,
  };
}

export function pedidoExcluirDesafio(id: string): PedidoOffline {
  return {
    acao: "excluirDesafio",
    args: [id],
    patches: [
      { colecao: "financas.desafios", op: "remover", id },
      { colecao: "financas.desafioQuadrados", op: "removerOnde", campo: "desafio_id", valor: id },
    ],
    rotulo: "Excluir desafio",
  };
}

// ---------- contas fixas (recorrências) ----------
function camposRecorrencia(fd: FormData) {
  const r = esquemaRecorrencia.safeParse({
    tipo: fd.get("tipo"),
    valor: fd.get("valor"),
    contaId: fd.get("contaId"),
    categoriaId: fd.get("categoriaId"),
    descricao: fd.get("descricao"),
    diaMes: fd.get("diaMes"),
    dataFim: fd.get("dataFim"),
  });
  if (!r.success) return { erro: primeiroErro(r) };
  const d = r.data;
  return { d, campos: { tipo: d.tipo, valor: d.valor, conta_id: d.contaId, categoria_id: d.categoriaId, descricao: d.descricao, dia_mes: d.diaMes, data_fim: d.dataFim } };
}

export function pedidoCriarRecorrencia(fd: FormData): PedidoOffline | string {
  const r = camposRecorrencia(fd);
  if ("erro" in r) return r.erro!;
  const id = novoUuid();
  fd.set("idCliente", id);
  return {
    acao: "criarRecorrencia",
    args: [fd],
    patches: [{ colecao: "financas.recorrencias", op: "upsert", id, valores: { ...r.campos, ativo: true, data_inicio: null } }],
    rotulo: `Conta fixa "${r.d.descricao ?? ""}"`.replace(' ""', ""),
  };
}

export function pedidoAtualizarRecorrencia(id: string, fd: FormData): PedidoOffline | string {
  const r = camposRecorrencia(fd);
  if ("erro" in r) return r.erro!;
  const { d, campos } = r;
  const hoje = new Date().toLocaleDateString("sv-SE");
  const patches: Patch[] = [{ colecao: "financas.recorrencias", op: "mesclar", id, valores: campos }];
  // lançamentos ainda a pagar dessa conta fixa recebem o ajuste (igual ao servidor)
  for (const t of (fin().transacoes ?? []) as any[]) {
    if (t.recorrencia_id !== id || !(String(t.data) > hoje) || t.pago_em) continue;
    if (d.dataFim && String(t.data) > d.dataFim) {
      patches.push({ colecao: "financas.transacoes", op: "remover", id: t.id });
      continue;
    }
    const novaData = `${String(t.data).slice(0, 8)}${String(d.diaMes).padStart(2, "0")}`;
    patches.push({
      colecao: "financas.transacoes",
      op: "mesclar",
      id: t.id,
      valores: { tipo: d.tipo, valor: d.valor, conta_id: d.contaId, categoria_id: d.categoriaId, descricao: d.descricao, ...(novaData > hoje ? { data: novaData } : {}) },
    });
  }
  return { acao: "atualizarRecorrencia", args: [id, fd], patches, rotulo: d.descricao || "Conta fixa" };
}

export function pedidoAlternarRecorrencia(id: string): PedidoOffline {
  const r = ((fin().recorrencias ?? []) as any[]).find((x) => x.id === id);
  return {
    acao: "alternarAtivaRecorrencia",
    args: [id],
    patches: r ? [{ colecao: "financas.recorrencias", op: "mesclar", id, valores: { ativo: !(r.ativo ?? true) } }] : [],
    rotulo: r?.descricao ?? "Conta fixa",
  };
}

export function pedidoRemoverRecorrencia(id: string): PedidoOffline {
  return { acao: "removerRecorrencia", args: [id], patches: [{ colecao: "financas.recorrencias", op: "remover", id }], rotulo: "Apagar conta fixa" };
}
