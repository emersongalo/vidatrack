import { describe, it, expect } from "vitest";
import { nomeDaRegra, minutosDaRegra, conferirDias, SUGESTOES_TELA } from "@/lib/tela/habitoTela";
import { VERSAO_NA_LOJA, situacaoDaVersao } from "@/lib/app/versaoApp";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const apps = [
  { pacote: "com.instagram.android", nome: "Instagram", minutos: 42 },
  { pacote: "com.zhiliaoapp.musically", nome: "TikTok", minutos: 30 },
  { pacote: "com.whatsapp", nome: "WhatsApp", minutos: 25 },
];

describe("Etapa 295 — vários hábitos de tela", () => {
  it("nomes", () => {
    expect(nomeDaRegra({ categorias: [], apps: [{ pacote: "a", nome: "Instagram" }], limiteMin: 30 })).toBe("Instagram até 30 min");
    expect(nomeDaRegra({ categorias: [], apps: [{ pacote: "a", nome: "A" }, { pacote: "b", nome: "B" }, { pacote: "c", nome: "C" }], limiteMin: 60 })).toBe("A, B +1 até 1h");
    expect(nomeDaRegra({ categorias: [], tudo: true, limiteMin: 180 })).toBe("Celular até 3h");
    expect(SUGESTOES_TELA.map((s) => nomeDaRegra(s.regra))).toContain("Redes sociais até 1h");
  });
  it("minutos por apps escolhidos, por tipo e no total", () => {
    expect(minutosDaRegra(apps, { categorias: [], apps: [{ pacote: "com.instagram.android", nome: "Instagram" }] })).toBe(42);
    expect(minutosDaRegra(apps, { categorias: ["redes"] })).toBe(72);
    expect(minutosDaRegra(apps, { categorias: [], tudo: true })).toBe(97);
  });
  it("confere por app", () => {
    const r = { habitoId: "h", limiteMin: 30, categorias: [], apps: [{ pacote: "com.instagram.android", nome: "Instagram" }], desde: "2026-10-01", conferidos: [] };
    expect(conferirDias(r, [{ dia: "2026-10-09", apps }], "2026-10-10")).toEqual([{ dia: "2026-10-09", resultado: "falhou", minutos: 42 }]);
  });
  it("aviso de versão nova aponta pra 43", () => {
    expect(VERSAO_NA_LOJA.codigo).toBe(43);
    expect(situacaoDaVersao(42)).toBe("opcional");
    expect(situacaoDaVersao(43)).toBe("atualizado");
  });
  it("novidades 295", () => {
    expect(Number(VERSAO_NOVIDADES)).toBeGreaterThanOrEqual(295);
    expect(NOVIDADES.some((g) => g.versao === "295")).toBe(true);
  });
});
