import { describe, it, expect } from "vitest";
import { abrirBauIlha, moedasDoBau } from "@/lib/mascote/rpg/bauIlha";
import { lerMascote, mascotePadrao } from "@/lib/mascote/mascote";
import { caminho, gerarIlha } from "@/lib/mascote/rpg/ilhaRpg";

describe("Etapa 326 — baú da ilha", () => {
  it("só abre com hábito feito e 1 vez por dia; soma no bônus", () => {
    const m = mascotePadrao("Bolota");
    expect(abrirBauIlha(m, 0, "2026-10-17")).toEqual({ ok: false, motivo: "sem-habito" });
    const r = abrirBauIlha(m, 3, "2026-10-17");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.moedas).toBe(moedasDoBau(3));
    expect(r.mascote.bonus).toBe(r.moedas);
    expect(abrirBauIlha(r.mascote, 3, "2026-10-17")).toEqual({ ok: false, motivo: "ja" });
    expect(lerMascote(JSON.parse(JSON.stringify(r.mascote)))?.bauIlha).toBe("2026-10-17");
    expect(moedasDoBau(99)).toBe(15);
  });

  it("dá pra chegar no baú", () => {
    const m = gerarIlha();
    const bau = m.decoracoes.find((d) => d.tipo === "bau")!;
    expect(caminho(m, m.inicio, bau)).not.toBeNull();
  });
});
