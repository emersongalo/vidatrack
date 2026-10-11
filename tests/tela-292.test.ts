import { describe, it, expect } from "vitest";
import { categoriaDoApp, formatarMinutos, resumirDia, minutosNasCategorias } from "@/lib/tela/categorias";
import { conferirDias, nomeDoHabitoTela } from "@/lib/tela/habitoTela";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const apps = [
  { pacote: "com.instagram.android", nome: "Instagram", minutos: 42.4 },
  { pacote: "com.zhiliaoapp.musically", nome: "TikTok", minutos: 30 },
  { pacote: "com.whatsapp", nome: "WhatsApp", minutos: 25 },
  { pacote: "com.algum.jogo", nome: "Jogo", minutos: 15, categoria: 0 },
  { pacote: "com.banco.app", nome: "Banco", minutos: 3, categoria: 7 },
];

describe("Etapa 292 — tempo de tela", () => {
  it("categorias", () => {
    expect(categoriaDoApp({ pacote: "com.google.android.youtube" })).toBe("video");
    expect(categoriaDoApp({ pacote: "x.y", categoria: 0 })).toBe("jogos");
    expect(categoriaDoApp({ pacote: "x.y", categoria: 4 })).toBe("redes");
    expect(categoriaDoApp({ pacote: "x.y" })).toBe("outros");
  });
  it("formata minutos", () => {
    expect(formatarMinutos(45)).toBe("45 min");
    expect(formatarMinutos(60)).toBe("1h");
    expect(formatarMinutos(125)).toBe("2h 05min");
  });
  it("resumo do dia", () => {
    const r = resumirDia(apps);
    expect(r.total).toBe(115);
    expect(r.porCategoria[0]).toMatchObject({ id: "redes", minutos: 72 });
    expect(r.topApps[0].nome).toBe("Instagram");
    expect(minutosNasCategorias(apps, ["redes", "jogos"])).toBe(87);
  });
  it("confere só dias fechados, a partir de quando criou e ainda não vistos", () => {
    const cfg = { habitoId: "h", limiteMin: 60, categorias: ["redes" as const], desde: "2026-10-07", conferidos: ["2026-10-07"] };
    const dias = [
      { dia: "2026-10-06", apps },
      { dia: "2026-10-07", apps },
      { dia: "2026-10-08", apps: [{ pacote: "com.instagram.android", nome: "Instagram", minutos: 20 }] },
      { dia: "2026-10-09", apps },
      { dia: "2026-10-10", apps: [] },
    ];
    expect(conferirDias(cfg, dias, "2026-10-10")).toEqual([
      { dia: "2026-10-08", resultado: "marcar", minutos: 20 },
      { dia: "2026-10-09", resultado: "falhou", minutos: 72 },
    ]);
  });
  it("nome do hábito", () => {
    expect(nomeDoHabitoTela(["redes"], 60)).toBe("Redes sociais até 1h");
    expect(nomeDoHabitoTela(["redes", "video"], 90)).toBe("Tempo de tela até 90 min");
  });
  it("novidades 292", () => {
    expect(VERSAO_NOVIDADES).toBe("292");
    expect(NOVIDADES[0].versao).toBe("292");
  });
});
