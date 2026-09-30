import { describe, it, expect } from "vitest";
import { infoDupla, estagioDaPlanta, fraseDoHumor, primeiroNome, somarDias } from "@/lib/habitos/dupla";
import { NOVIDADES, VERSAO_NOVIDADES } from "@/lib/novidades/lista";

const HOJE = "2026-09-30";
const EU = "eu";
const ANA = { id: "ana", nome: "Ana" };
const h = { id: "h", nome: "Ler", frequencia: "diaria", meta_diaria: 1, criado_em: "2026-01-01" };
const ck = (quem: string, dia: string, q = 1) => ({ habito_id: "h", data: dia, quantidade: q, usuario_id: quem });
const dias = (n: number, desde = 1) => Array.from({ length: n }, (_, i) => somarDias(HOJE, -(i + desde)));

describe("hábito em dupla", () => {
  it("sequência e dias juntos só contam quando os dois fizeram", () => {
    const c = [
      ...dias(5).map((d) => ck(EU, d)),
      ...dias(3).map((d) => ck("ana", d)), // Ana falhou 4 e 5 dias atrás
    ];
    const r = infoDupla(h, c, EU, [ANA], HOJE, 10);
    expect(r.sequencia).toBe(3);
    expect(r.diasJuntos).toBe(3);
    expect(r.recorde).toBe(3);
    expect(r.estagio).toBe(2); // mudinha (3+)
    expect(r.humor).toBe("tranquilo");
  });

  it("carinha muda com quem fez hoje", () => {
    expect(infoDupla(h, [ck(EU, HOJE)], EU, [ANA], HOJE, 10).humor).toBe("esperandoParceiro");
    expect(infoDupla(h, [ck("ana", HOJE)], EU, [ANA], HOJE, 10).humor).toBe("esperandoVoce");
    const festa = infoDupla(h, [ck(EU, HOJE), ck("ana", HOJE), ck(EU, dias(1)[0]), ck("ana", dias(1)[0])], EU, [ANA], HOJE, 10);
    expect(festa.humor).toBe("festa");
    expect(festa.sequencia).toBe(2);
    expect(festa.parceiros[0].feito).toBe(true);
    expect(infoDupla(h, [], EU, [ANA], HOJE, 21).humor).toBe("preocupado");
  });

  it("fica triste quando a sequência quebrou ontem", () => {
    const anteontem = dias(1, 2)[0];
    const r = infoDupla(h, [ck(EU, anteontem), ck("ana", anteontem), ck(EU, dias(1)[0])], EU, [ANA], HOJE, 10);
    expect(r.humor).toBe("triste");
  });

  it("check-in sem dono conta como meu; meta numérica respeitada", () => {
    const agua = { ...h, meta_diaria: 3 };
    const c = [{ habito_id: "h", data: HOJE, quantidade: 3 }, ck("ana", HOJE, 2)];
    const r = infoDupla(agua, c as any, EU, [ANA], HOJE, 10);
    expect(r.euFiz).toBe(true);
    expect(r.parceiros[0].feito).toBe(false);
  });

  it("planta murcha quando ninguém faz e se recupera", () => {
    const murcha = infoDupla(h, [], EU, [ANA], HOJE, 10);
    expect(murcha.saude).toBe(0);
    const viva = infoDupla(h, dias(3).flatMap((d) => [ck(EU, d), ck("ana", d)]), EU, [ANA], HOJE, 10);
    expect(viva.saude).toBe(2);
  });

  it("estágios da planta", () => {
    expect(estagioDaPlanta(0)).toEqual({ estagio: 0, proximoEm: 1 });
    expect(estagioDaPlanta(7)).toEqual({ estagio: 3, proximoEm: 7 });
    expect(estagioDaPlanta(80)).toEqual({ estagio: 6, proximoEm: null });
  });

  it("frases e nomes", () => {
    expect(fraseDoHumor("esperandoVoce", ["Ana"])).toBe("Ana já fez — falta você");
    expect(fraseDoHumor("festa", ["Ana"])).toBe("Você e Ana fizeram hoje!");
    expect(primeiroNome("ana.souza@gmail.com")).toBe("ana.souza");
    expect(primeiroNome("Maria Clara")).toBe("Maria");
    expect(primeiroNome("")).toBe("Seu par");
  });

  it("novidades 233 no topo", () => {
    expect(VERSAO_NOVIDADES).toBe("233");
    expect(NOVIDADES[0].versao).toBe("233");
  });
});
