import { describe, it, expect } from "vitest";
import {
  comprarConsumivel,
  usarConsumivel,
  mascotePadrao,
  lerMascote,
  frutosProduzidos,
  frutosParaColher,
  colherFrutos,
  adubosNaPlanta,
  frutaDaPlanta,
  CONSUMIVEIS,
  MAX_FRUTOS_ESPERANDO,
} from "@/lib/mascote/mascote";
import { calcularVida, razaoDoDia } from "@/lib/mascote/vida";
import { humorComVida } from "@/lib/mascote/useMascote";
import { periodoDaHora, climaDoHumor } from "@/components/mascote/Mascote";
import { crescimentoDaPlanta } from "@/components/mascote/JardimDupla";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-11";
const dia = (n: number) => new Date(Date.UTC(2026, 9, 11 + n)).toISOString().slice(0, 10);
function retrato(feitosPorDia: Record<string, number>) {
  const habitos = [
    { id: "a", nome: "Água", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
    { id: "b", nome: "Ler", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
  ];
  const habitoCheckins: any[] = [];
  for (const [d, n] of Object.entries(feitosPorDia)) for (let i = 0; i < n; i++) habitoCheckins.push({ habito_id: habitos[i].id, data: d, quantidade: 1 });
  return { habitos, habitoCheckins };
}

describe("Etapa 302 — bichinho virtual", () => {
  it("razão do dia ignora hábito criado depois", () => {
    const s = retrato({ [dia(-1)]: 1 });
    expect(razaoDoDia(s, dia(-1))).toBe(0.5);
    expect(razaoDoDia({ habitos: [{ id: "x", meta_diaria: 1, criado_em: HOJE }], habitoCheckins: [] }, dia(-1))).toBeNull();
  });

  it("bem cuidado fica cheio e forte", () => {
    const todos: Record<string, number> = {};
    for (let i = -14; i < 0; i++) todos[dia(i)] = 2;
    const v = calcularVida(retrato(todos), HOJE, 12);
    expect(v.estado).toBe("bem");
    expect(v.saude).toBeGreaterThanOrEqual(90);
    expect(v.barriga).toBeGreaterThan(70);
  });

  it("3 dias sem nada: doente; com remédio melhora; nunca abaixo de 0", () => {
    const s = retrato({});
    const v = calcularVida(s, HOJE, 12, [], dia(-3));
    expect(v.estado).toBe("doente");
    expect(v.diasSemCuidar).toBe(3);
    const curado = calcularVida(s, HOJE, 12, [{ d: HOJE, t: "remedio" }, { d: HOJE, t: "sopa" }, { d: HOJE, t: "sanduiche" }], dia(-3));
    expect(curado.saude).toBeGreaterThan(v.saude);
    const longe = calcularVida(s, HOJE, 23, []);
    expect(longe.saude).toBeGreaterThanOrEqual(0);
    expect(longe.barriga).toBeGreaterThanOrEqual(0);
  });

  it("humor: doente vence tudo; fome não acorda quem dorme", () => {
    const base = { barriga: 50, saude: 80, diasSemCuidar: 0, petiscosHoje: 0 };
    expect(humorComVida("radiante", { ...base, estado: "doente" })).toBe("doente");
    expect(humorComVida("neutro", { ...base, estado: "fome" })).toBe("fome");
    expect(humorComVida("dormindo", { ...base, estado: "fome" })).toBe("dormindo");
    expect(humorComVida("feliz", null)).toBe("feliz");
  });

  it("comprar e dar comidinha (estoque, saldo, adubo 1x por dia)", () => {
    let m = mascotePadrao();
    expect(comprarConsumivel(m, 1, "remedio").ok).toBe(false);
    const r = comprarConsumivel(m, 20, "maca", 2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    m = r.mascote;
    expect(m.estoque).toEqual({ maca: 2 });
    expect(m.gastos).toBe(30);
    const u = usarConsumivel(m, "maca", HOJE);
    expect(u.ok && u.mascote.estoque).toEqual({ maca: 1 });
    expect(usarConsumivel(mascotePadrao(), "maca", HOJE).ok).toBe(false);
    let p = { ...mascotePadrao(), estoque: { adubo: 2 } };
    const a1 = usarConsumivel(p, "adubo", HOJE, "h1");
    expect(a1.ok).toBe(true);
    if (a1.ok) p = a1.mascote;
    expect(usarConsumivel(p, "adubo", HOJE, "h1").ok).toBe(false);
    expect(adubosNaPlanta(p, "h1")).toBe(1);
    expect(CONSUMIVEIS.find((c) => c.id === "fruta")!.preco).toBe(0);
    expect(comprarConsumivel(mascotePadrao(), 999, "fruta").ok).toBe(false);
  });

  it("frutos: a partir da flor, um a cada 3 dias, no máximo 5 esperando", () => {
    expect(frutosProduzidos(29)).toBe(0);
    expect(frutosProduzidos(30)).toBe(1);
    expect(frutosProduzidos(36)).toBe(3);
    const m = mascotePadrao();
    expect(frutosParaColher(m, "h", 90)).toBe(MAX_FRUTOS_ESPERANDO);
    const c = colherFrutos(m, "h", 36);
    expect(c.colhidos).toBe(3);
    expect(c.mascote.estoque?.fruta).toBe(3);
    expect(frutosParaColher(c.mascote, "h", 36)).toBe(0);
    expect(frutosParaColher(c.mascote, "h", 39)).toBe(1);
    expect(frutaDaPlanta("abc")).toBe(frutaDaPlanta("abc"));
  });

  it("planta cresce com dias juntos + adubo dos dois", () => {
    const meu = { ...mascotePadrao(), consumos: [{ d: HOJE, t: "adubo", h: "h" }] };
    const dele = { ...mascotePadrao(), consumos: [{ d: dia(-1), t: "adubo", h: "h" }, { d: dia(-2), t: "adubo", h: "outro" }] };
    expect(crescimentoDaPlanta(10, "h", meu, [dele])).toEqual({ crescimento: 14, adubos: 2 });
  });

  it("lerMascote guarda despensa, histórico e colhidos; joga fora lixo", () => {
    const m = lerMascote({
      nome: "X",
      cor: "verde",
      inventario: [],
      estoque: { maca: 3, xyz: 2, bolo: -1 },
      consumos: [{ d: HOJE, t: "maca" }, { d: "ontem", t: "maca" }, { d: HOJE, t: "nada" }, { d: HOJE, t: "adubo", h: "h" }],
      colhidos: { h: 2, z: 0 },
    })!;
    expect(m.estoque).toEqual({ maca: 3 });
    expect(m.consumos).toEqual([{ d: HOJE, t: "adubo", h: "h" }, { d: HOJE, t: "maca" }]);
    expect(m.colhidos).toEqual({ h: 2 });
  });

  it("lugares vivos: período pela hora e tempo pelo humor", () => {
    expect(periodoDaHora(7)).toBe("manha");
    expect(periodoDaHora(14)).toBe("tarde");
    expect(periodoDaHora(18)).toBe("entardecer");
    expect(periodoDaHora(2)).toBe("noite");
    expect(climaDoHumor("triste")).toBe("chuva");
    expect(climaDoHumor("doente")).toBe("cinza");
    expect(climaDoHumor("radiante")).toBe("sol");
  });

  it("novidades 302", () => {
    expect(VERSAO_NOVIDADES).toBe("302");
    expect(NOVIDADES[0].versao).toBe("302");
  });
});
