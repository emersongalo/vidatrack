// Etapa 350 — "o que muda no retrato do aparelho" quando uma ação é feita
// sem internet. Cada ação da fila genérica carrega a lista de mudanças;
// o retrato aplica na hora e REAPLICA sempre que chega um retrato novo do
// servidor antes da ação subir (senão a mudança "sumiria" e voltaria).
// Tudo aqui é idempotente: aplicar duas vezes dá o mesmo resultado.

export type Colecao =
  | "habitos"
  | "tarefas"
  | "categoriasProdutividade"
  | "financas.contas"
  | "financas.categorias"
  | "financas.transacoes"
  | "financas.metas"
  | "financas.desafios"
  | "financas.desafioQuadrados"
  | "financas.recorrencias"
  | "financas.divisoes"
  | "diario"
  | "metasLongas"
  | "blocosTempo";

export type Patch =
  /** cria (ou substitui os campos, se já existir). `chave` = campo que identifica (padrão "id") */
  | { colecao: Colecao; op: "upsert"; id: string; valores: Record<string, unknown>; chave?: string }
  /** muda só alguns campos de um item que já existe */
  | { colecao: Colecao; op: "mesclar"; id: string; valores: Record<string, unknown> }
  /** tira da lista */
  | { colecao: Colecao; op: "remover"; id: string }
  /** tira da lista todos com campo = valor (ex.: parcelas de um grupo) */
  | { colecao: Colecao; op: "removerOnde"; campo: string; valor: unknown }
  /** Etapa 353 — muda campos de um objeto (perfil, finanças) */
  | { op: "mesclarObjeto"; caminho: "perfil" | "financas"; valores: Record<string, unknown> }
  /** Etapa 353 — reordena uma lista pela ordem dos ids */
  | { colecao: Colecao; op: "ordenar"; ids: string[] };

function lerLista(dados: any, colecao: Colecao): any[] | null {
  const [a, b] = colecao.split(".");
  const v = b ? dados?.[a]?.[b] : dados?.[a];
  return Array.isArray(v) ? v : v == null ? [] : null;
}

function gravarLista(dados: any, colecao: Colecao, lista: any[]) {
  const [a, b] = colecao.split(".");
  if (b) return { ...dados, [a]: { ...(dados?.[a] ?? {}), [b]: lista } };
  return { ...dados, [a]: lista };
}

export function aplicarPatches<T>(dados: T, patches: Patch[] | undefined | null): T {
  if (!dados || !Array.isArray(patches) || !patches.length) return dados;
  let out: any = dados;
  for (const p of patches) {
    if (!p || typeof p !== "object") continue;
    if (p.op === "mesclarObjeto") {
      out = { ...out, [p.caminho]: { ...(out?.[p.caminho] ?? {}), ...(p.valores ?? {}) } };
      continue;
    }
    const lista = lerLista(out, p.colecao);
    if (!lista) continue;
    let nova = lista;
    if (p.op === "upsert") {
      const chave = p.chave ?? "id";
      const existe = lista.some((x) => x?.[chave] === p.id);
      const item = { ...(p.valores ?? {}), [chave]: p.id, pendente_sync: true };
      if (existe) nova = lista.map((x) => (x?.[chave] === p.id ? { ...x, ...item } : x));
      else nova = p.colecao === "financas.transacoes" ? [item, ...lista] : [...lista, item];
    } else if (p.op === "mesclar") {
      nova = lista.map((x) => (x?.id === p.id ? { ...x, ...(p.valores ?? {}), pendente_sync: true } : x));
    } else if (p.op === "remover") {
      nova = lista.filter((x) => x?.id !== p.id);
    } else if (p.op === "ordenar") {
      const pos = new Map(p.ids.map((id, i) => [id, i]));
      nova = lista.map((x) => (pos.has(x?.id) ? { ...x, ordem: pos.get(x.id) } : x));
      nova = [...nova].sort((a, b) => (pos.get(a?.id) ?? 1e9) - (pos.get(b?.id) ?? 1e9));
    } else if (p.op === "removerOnde") {
      nova = lista.filter((x) => x?.[p.campo] !== p.valor);
    }
    out = gravarLista(out, p.colecao, nova);
  }
  return out;
}
