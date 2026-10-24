import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { TODAS_AS_TELAS, ID_MODELO, caminhoModelo, trocarId } from "@/lib/offline/rotasOffline";

function arquivoDaTela(rota: string) {
  return "app" + rota.replace(ID_MODELO, "[id]") + "/page.tsx";
}

describe("Etapa 348 — todas as telas abrem sem internet", () => {
  it("toda tela da lista existe de verdade", () => {
    const faltando = TODAS_AS_TELAS.filter((r) => !existsSync(arquivoDaTela(r)));
    expect(faltando).toEqual([]);
  });
  it("telas com id viram modelo e voltam com o id certo", () => {
    const id = "3f2a9c1e-7b4d-4e8a-9c3f-1a2b3c4d5e6f";
    expect(caminhoModelo(`/financas/${id}/editar`)).toEqual({ modelo: `/financas/${ID_MODELO}/editar`, id });
    expect(caminhoModelo("/habitos/lista")).toBeNull();
    expect(caminhoModelo(`/habitos/${ID_MODELO}`)).toBeNull();
    const html = `<a href="/habitos/${ID_MODELO}">["id","${ID_MODELO}","d"]</a>`;
    const trocado = trocarId(html, ID_MODELO, id);
    expect(trocado).not.toContain(ID_MODELO);
    expect(trocado.length).toBe(html.length); // nada desalinha no HTML do Next
  });
  it("sw.js e offline-app.html usam o mesmo id de modelo", () => {
    expect(readFileSync("public/sw.js", "utf8")).toContain(`const ID_MODELO = "${ID_MODELO}"`);
    expect(readFileSync("public/offline-app.html", "utf8")).toContain(`var ID_MODELO = "${ID_MODELO}"`);
  });
});
