import { describe, it, expect } from "vitest";
import {
  TRILHAS,
  modeloPorId,
  estadoDoDesafio,
  comecarDesafio,
  pegarMedalha,
  desistirDesafio,
  recomecarDesafio,
  medalhas,
  desafioAtivo,
  habitoDoModelo,
} from "@/lib/habitos/trilhas";
import { mascotePadrao, lerMascote, somarDiasISO, moedasDisponiveis } from "@/lib/mascote/mascote";
import { comprarTema, TEMAS_ILHA, temTema, usarTema } from "@/lib/mascote/temasIlha";
import { COMODOS, MOVEIS, NOMES_CATEGORIA, ESTILOS, desbloquearComodo, casaPadrao, lerCasa } from "@/lib/mascote/casa";
import { MAPA_ICONES_HABITO } from "@/lib/agenda/icones-habito";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-20";
const h = { id: "h1", nome: "Ler 10 páginas", meta_diaria: 1 };
const neg = { id: "h2", nome: "Sem doce", meta_diaria: 1, eh_negativo: true };
const ck = (id: string, d: string) => ({ habito_id: id, data: d, quantidade: 1 });

describe("Etapa 312 — trilhas, desafios, temas e lazer", () => {
  it("catálogo: ids únicos e ícones que existem", () => {
    const ids = TRILHAS.flatMap((t) => t.modelos.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TRILHAS) for (const m of t.modelos) expect(MAPA_ICONES_HABITO.has(m.icone)).toBe(true);
    expect(modeloPorId("agua")?.meta).toBe(8);
    expect(modeloPorId("nada")).toBeNull();
    expect(habitoDoModelo([{ id: "x", nome: "LER 10 paginas" }], modeloPorId("ler")!)?.id).toBe("x");
  });

  it("desafio de 7 dias: ativo, folga, pronto e medalha", () => {
    const inicio = somarDiasISO(HOJE, -6);
    let m = comecarDesafio(mascotePadrao("Bolota"), "h1", 7, inicio)!;
    expect(comecarDesafio(m, "h1", 7, inicio)).toBeNull(); // um por hábito
    const d = desafioAtivo(m, "h1")!;
    const seis = Array.from({ length: 6 }, (_, i) => ck("h1", somarDiasISO(inicio, i)));
    const e1 = estadoDoDesafio(d, h, seis, HOJE);
    expect(e1).toMatchObject({ status: "ativo", feitos: 6, dias: 7 });
    expect(e1.grade[6]).toBe("hoje");
    const e2 = estadoDoDesafio(d, h, [...seis, ck("h1", HOJE)], HOJE);
    expect(e2.status).toBe("pronto");
    const r = pegarMedalha(m, d, e2, HOJE)!;
    expect(r.bonus).toBe(70);
    expect(medalhas(r)).toMatchObject({ bronze: 1, total: 1 });
    expect(desafioAtivo(r, "h1")).toBeNull();
    expect(pegarMedalha(r, r.desafios![0], e2, HOJE)).toBeNull();
    // entra nas moedas
    expect(moedasDisponiveis(0, 0, r.bonus)).toBe(70);
  });

  it("faltou mais que a folga = perdido; recomeçar abre outro", () => {
    const inicio = somarDiasISO(HOJE, -3);
    const m = comecarDesafio(mascotePadrao("Bolota"), "h1", 7, inicio)!;
    const d = m.desafios![0];
    const e = estadoDoDesafio(d, h, [ck("h1", inicio)], HOJE); // faltou 2 dias, folga 1
    expect(e.status).toBe("perdido");
    const r = recomecarDesafio(m, d, HOJE);
    expect(r.desafios).toHaveLength(2);
    expect(r.desafios![0].resultado).toBe("perdeu");
    expect(desafioAtivo(r, "h1")?.inicio).toBe(HOJE);
    expect(desistirDesafio(r, desafioAtivo(r, "h1")!, HOJE).desafios![1].resultado).toBe("desistiu");
  });

  it("hábito de parar: conta os dias sem escorregar (hoje só ao acabar)", () => {
    const inicio = somarDiasISO(HOJE, -3);
    const m = comecarDesafio(mascotePadrao("Bolota"), "h2", 7, inicio)!;
    const e = estadoDoDesafio(m.desafios![0], neg, [ck("h2", somarDiasISO(HOJE, -1))], HOJE);
    expect(e.feitos).toBe(2);
    expect(e.grade.slice(0, 4)).toEqual(["ok", "ok", "falta", "hoje"]);
  });

  it("lerMascote guarda desafios e temas", () => {
    const m = lerMascote({
      ...mascotePadrao("Bolota"),
      desafios: [{ id: "a", habitoId: "h1", dias: 21, inicio: HOJE }, { id: "b", habitoId: "h1", dias: 5, inicio: HOJE }],
      temasIlha: ["inverno"],
      temaIlha: "inverno",
    })!;
    expect(m.desafios).toHaveLength(1);
    expect(m.temaIlha).toBe("inverno");
    expect(lerMascote({ ...mascotePadrao("B"), temaIlha: "outono" })!.temaIlha).toBeUndefined();
  });

  it("temas da ilha: comprar, usar e voltar pro tropical", () => {
    const m = mascotePadrao("Bolota");
    expect(temTema(m, "tropical")).toBe(true);
    expect("erro" in comprarTema(m, "inverno", 100)).toBe(true);
    const r = comprarTema(m, "inverno", 5000);
    if ("erro" in r) throw new Error(r.erro);
    expect(r.mascote.temaIlha).toBe("inverno");
    expect(r.mascote.gastos).toBe(TEMAS_ILHA.find((t) => t.id === "inverno")!.preco);
    expect(usarTema(r.mascote, "tropical")!.temaIlha).toBeUndefined();
    expect(usarTema(m, "cerejeira")).toBeNull();
  });

  it("área de lazer: cômodo, móveis e pisos de fora", () => {
    expect(COMODOS.find((c) => c.id === "lazer")?.externo).toBe(true);
    expect(MOVEIS.filter((x) => x.cat === "verao").length).toBeGreaterThanOrEqual(7);
    expect(NOMES_CATEGORIA.verao).toBeTruthy();
    expect(ESTILOS.filter((e) => e.externo).length).toBeGreaterThanOrEqual(4);
    const r = desbloquearComodo(casaPadrao(), "lazer", 5000);
    if ("erro" in r) throw new Error(r.erro);
    expect(r.casa.comodos.lazer?.piso).toBe("grama");
    expect(lerCasa(r.casa)?.comodos.lazer).toBeTruthy();
  });

  it("novidades 312", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(312);
    expect(NOVIDADES.some((g) => g.versao === "312")).toBe(true);
  });
});
