import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { BLOCOS, lerBlocosInicio, MODELOS } from "@/lib/painel/blocos";
import { VERSAO_NOVIDADES, NOVIDADES } from "@/lib/novidades/lista";

describe("Etapa 303 — mascote no Início e compartilhar", () => {
  it("mascote é um bloco opcional do Início", () => {
    expect(BLOCOS.find((b) => b.id === "mascote")?.area).toBe("habitos");
    expect(lerBlocosInicio(["mascote", "saldo"])).toEqual(["mascote", "saldo"]);
    expect(MODELOS.habitos.blocos).toContain("mascote");
    // quem já tinha o Início organizado não ganha nada à força
    expect(lerBlocosInicio(["saldo"])).toEqual(["saldo"]);
  });

  it("formulários de criar têm o 'Compartilhar com…' opcional", () => {
    expect(readFileSync("app/habitos/novo/page.tsx", "utf8")).toContain("comCompartilhar");
    expect(readFileSync("app/habitos/tarefas/nova/page.tsx", "utf8")).toContain("comCompartilhar");
    const comp = readFileSync("components/EscolherCompartilhar.tsx", "utf8");
    for (const n of ["compartilharUsuario", "compartilharEmail", "compartilharPermissao"]) expect(comp).toContain(n);
    expect(readFileSync("app/habitos/actions.ts", "utf8")).toContain('convidarAoCriar("habito"');
    expect(readFileSync("app/habitos/tarefas/actions.ts", "utf8")).toContain('convidarAoCriar("tarefa"');
  });

  it("descompartilhar pede confirmação e avisa o outro", () => {
    const b = readFileSync("components/BotaoDescompartilhar.tsx", "utf8");
    expect(b).toContain("Tem certeza?");
    const a = readFileSync("lib/compartilhamento/actions.ts", "utf8");
    expect(a).toContain("descompartilhar_habito");
    expect(a).toContain("avisarUsuario");
  });

  it("novidades 303", () => {
    expect(VERSAO_NOVIDADES).toBe("303");
    expect(NOVIDADES[0].versao).toBe("303");
  });
});
