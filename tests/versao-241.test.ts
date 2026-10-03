import { describe, it, expect } from "vitest";
import { situacaoDaVersao, podeMostrar, VERSAO_NA_LOJA } from "@/lib/app/versaoApp";

describe("aviso de versão nova", () => {
  it("compara o versionCode instalado com o da loja", () => {
    expect(situacaoDaVersao(VERSAO_NA_LOJA.codigo)).toBe("atualizado");
    expect(situacaoDaVersao(VERSAO_NA_LOJA.codigo + 1)).toBe("atualizado");
    expect(situacaoDaVersao(String(VERSAO_NA_LOJA.codigo - 1))).toBe("opcional");
    expect(situacaoDaVersao(null)).toBe("atualizado");
    expect(situacaoDaVersao("abc")).toBe("atualizado");
  });
  it("'agora não' segura por 3 dias, e volta se sair outra versão", () => {
    const agora = 1_000_000_000_000;
    expect(podeMostrar(null, agora)).toBe(true);
    expect(podeMostrar({ codigo: VERSAO_NA_LOJA.codigo, em: agora - 3600_000 }, agora)).toBe(false);
    expect(podeMostrar({ codigo: VERSAO_NA_LOJA.codigo, em: agora - 4 * 86400_000 }, agora)).toBe(true);
    expect(podeMostrar({ codigo: VERSAO_NA_LOJA.codigo - 1, em: agora }, agora)).toBe(true);
  });
});
