import { describe, it, expect } from "vitest";
import { missoesDoDia, resgatarMissao, semanaDe, semanaDoBau, abrirBau, MISSOES_POR_DIA } from "@/lib/mascote/missoes";
import { mascotePadrao, moedasDisponiveis, lerMascote, comprarConsumivel } from "@/lib/mascote/mascote";
import { lerLayoutHoje, BLOCOS_HOJE_PADRAO } from "@/lib/habitos/blocosHoje";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-10-12"; // segunda
const s = (feitos: string[]) => ({
  perfil: { id: "u" },
  habitos: [
    { id: "a", nome: "Água", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
    { id: "b", nome: "Ler", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
    { id: "c", nome: "Academia", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
    { id: "d", nome: "Meditar", meta_diaria: 1, frequencia: "diaria", criado_em: "2026-01-01" },
  ],
  habitoCheckins: feitos.map((id) => ({ habito_id: id, data: HOJE, quantidade: 1 })),
  tarefas: [],
  conclusoesTarefas: [],
  diario: [],
});

describe("Etapa 309 — missões e baú", () => {
  it("3 missões fixas pro dia, a primeira é fazer N hábitos", () => {
    const m = mascotePadrao("Bolota");
    const a = missoesDoDia(s([]), HOJE, m);
    const b = missoesDoDia(s([]), HOJE, m);
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id)); // mesmo dia = mesmas missões
    expect(a).toHaveLength(MISSOES_POR_DIA);
    expect(a[0]).toMatchObject({ id: "feitos", meta: 3, feita: false });
    expect(new Set(a.map((x) => x.id)).size).toBe(3);
    const feito = missoesDoDia(s(["a", "b", "c"]), HOJE, m);
    expect(feito[0].feita).toBe(true);
    expect(missoesDoDia({ ...s([]), habitos: [] }, HOJE, m)).toEqual([]);
  });

  it("resgatar soma no saldo (uma vez só) e entra nas compras", () => {
    let m = mascotePadrao("Bolota");
    const ms = missoesDoDia(s(["a", "b", "c"]), HOJE, m);
    const r = resgatarMissao(m, ms[0], HOJE)!;
    expect(r.bonus).toBe(20);
    expect(resgatarMissao(r, ms[0], HOJE)).toBeNull();
    expect(moedasDisponiveis(0, 0, r.bonus)).toBe(20);
    expect(comprarConsumivel(r, 0, "maca").ok).toBe(true); // 15 🪙 só do bônus
    m = lerMascote({ ...r, missoes: { ...r.missoes, lixo: ["x"] }, baus: ["2026-10-05", 3] })!;
    expect(m.bonus).toBe(20);
    expect(Object.keys(m.missoes!)).toEqual([HOJE]);
    expect(m.baus).toEqual(["2026-10-05"]);
  });

  it("baú: 5 dias completos na semana, abre uma vez", () => {
    expect(semanaDe("2026-10-15")).toBe("2026-10-12");
    expect(semanaDe("2026-10-18")).toBe("2026-10-12");
    const dias = ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"];
    const m = { ...mascotePadrao("Bolota"), missoes: Object.fromEntries(dias.map((d) => [d, ["x", "y", "z"]])) };
    expect(semanaDoBau(m, "2026-10-16").disponivel).toBe(false);
    const m5 = { ...m, missoes: { ...m.missoes, "2026-10-16": ["x", "y", "z"] } };
    const info = semanaDoBau(m5, "2026-10-16");
    expect(info.completos).toBe(5);
    expect(info.disponivel).toBe(true);
    const r = abrirBau(m5, "2026-10-16")!;
    expect(r.premio.texto).toBeTruthy();
    expect(r.mascote.baus).toEqual(["2026-10-12"]);
    expect(abrirBau(r.mascote, "2026-10-16")).toBeNull();
  });

  it("missões entram logo depois do mascote na aba Hábitos", () => {
    expect(BLOCOS_HOJE_PADRAO.indexOf("missoes")).toBe(1);
    expect(lerLayoutHoje(["lista", "!mascote"]).map((b) => b.id).slice(0, 3)).toEqual(["lista", "mascote", "missoes"]);
  });

  it("novidades 309", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(309);
    expect(NOVIDADES.some((g) => g.versao === "309")).toBe(true);
  });
});
