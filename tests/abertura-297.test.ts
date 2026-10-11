import { describe, it, expect } from "vitest";
import { SCRIPT_ABERTURA } from "@/lib/app/abertura";

function rodar(caminho: string, standalone: boolean) {
  const attrs: Record<string, string> = {};
  let destino: string | null = null;
  const ses: Record<string, string> = {};
  const g: any = {
    document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
    location: { pathname: caminho, replace: (u: string) => (destino = u) },
    navigator: { standalone },
    window: { matchMedia: () => ({ matches: false }) },
    matchMedia: () => ({ matches: false }),
    sessionStorage: { getItem: (k: string) => ses[k] ?? null, setItem: (k: string, v: string) => (ses[k] = v) },
    setTimeout: () => 0,
  };
  new Function(...Object.keys(g), SCRIPT_ABERTURA)(...Object.values(g));
  return { attrs, destino, ses };
}

describe("Etapa 297 — abertura no app da tela de início", () => {
  it("iPhone pelo ícone na apresentação: vai pro app sem mostrar a apresentação", () => {
    const r = rodar("/apresentacao", true);
    expect(r.destino).toBe("/dashboard");
    expect(r.attrs["data-abertura"]).toBeUndefined(); // logo continua cobrindo
  });
  it("no navegador a apresentação continua normal", () => {
    const r = rodar("/apresentacao", false);
    expect(r.destino).toBeNull();
    expect(r.attrs["data-abertura"]).toBe("vista");
  });
  it("no app, outras telas mostram o logo normalmente", () => {
    const r = rodar("/dashboard", true);
    expect(r.destino).toBeNull();
    expect(r.ses["vt-abertura"]).toBe("1");
  });
});
