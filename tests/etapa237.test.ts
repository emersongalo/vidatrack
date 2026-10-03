import { describe, it, expect } from "vitest";
import { timerInicial, iniciar, pausar, restante, proximaFase, formatarTempo, focoDaSemana, lerTimer, POMODORO } from "@/lib/habitos/timer";
import { resumoCartao, textoVencimento } from "@/lib/financas/cartaoResumo";

describe("timer de foco", () => {
  it("conta pela hora de término, pausa e retoma", () => {
    let t = timerInicial("pomodoro");
    expect(restante(t, 0)).toBe(25 * 60);
    t = iniciar(t, 1_000_000);
    expect(restante(t, 1_000_000 + 60_000)).toBe(24 * 60);
    t = pausar(t, 1_000_000 + 60_000);
    expect(restante(t, 9_999_999)).toBe(24 * 60); // pausado não anda
    t = iniciar(t, 2_000_000);
    expect(restante(t, 2_000_000 + 24 * 60_000 + 5000)).toBe(0);
  });
  it("pomodoro alterna foco e pausa, pausa longa no 4º", () => {
    let t = timerInicial("pomodoro");
    const fases: string[] = [];
    for (let i = 0; i < 8; i++) {
      t = proximaFase(t);
      fases.push(t.fase);
    }
    expect(fases).toEqual(["pausa", "foco", "pausa", "foco", "pausa", "foco", "pausaLonga", "foco"]);
    expect(proximaFase({ ...timerInicial("pomodoro"), ciclo: 3 }).total).toBe(POMODORO.pausaLonga * 60);
  });
  it("tempo livre e formato", () => {
    expect(proximaFase(timerInicial("livre", 10), 45).total).toBe(45 * 60);
    expect(formatarTempo(65)).toBe("01:05");
    expect(formatarTempo(3725)).toBe("1:02:05");
  });
  it("semana de foco e leitura do salvo", () => {
    const s = focoDaSemana([{ dia: "2026-10-02", minutos: 25, habito: null }, { dia: "2026-10-02", minutos: 5, habito: null }, { dia: "2026-09-27", minutos: 10, habito: null }], "2026-10-02");
    expect(s[6]).toEqual({ dia: "2026-10-02", minutos: 30 });
    expect(s[1]).toEqual({ dia: "2026-09-27", minutos: 10 });
    expect(lerTimer("lixo")).toBeNull();
    expect(lerTimer(JSON.stringify({ modo: "livre", total: 600, fimEm: 5 }))?.fimEm).toBe(5);
  });
});

describe("cartão de crédito", () => {
  const cartao = { id: "c", tipo: "cartao", saldo: -450, dia_fechamento: 25, dia_vencimento: 5 };
  const t = [
    { conta_id: "c", tipo: "despesa", valor: 300, data: "2026-09-20" }, // fatura que fechou 25/09
    { conta_id: "c", tipo: "despesa", valor: 150, data: "2026-09-28" }, // fatura aberta
  ];
  it("próxima a pagar é a fechada, e mostra a aberta separada", () => {
    const r = resumoCartao(cartao, t, "2026-10-02");
    expect(r.proxima).toEqual({ valor: 300, vencimento: "2026-10-05", fechada: true });
    expect(r.faturaAberta).toBe(150);
    expect(r.devendo).toBe(450);
  });
  it("sem fechamento configurado usa o total devido", () => {
    const r = resumoCartao({ ...cartao, dia_fechamento: null }, t, "2026-10-02");
    expect(r).toMatchObject({ configurado: false, devendo: 450, proxima: null });
  });
  it("texto do vencimento", () => {
    expect(textoVencimento("2026-10-02", "2026-10-02")).toBe("vence hoje");
    expect(textoVencimento("2026-10-03", "2026-10-02")).toBe("vence amanhã");
    expect(textoVencimento("2026-10-05", "2026-10-02")).toBe("vence em 3 dias (05/10)");
    expect(textoVencimento("2026-09-30", "2026-10-02")).toBe("venceu dia 30/09");
  });
});
