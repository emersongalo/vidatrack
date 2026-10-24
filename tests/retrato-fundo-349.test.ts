import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const sw = readFileSync("public/sw.js", "utf8");
const snap = readFileSync("lib/offline/snapshot.ts", "utf8");
const java = "android/app/src/main/java/com/vidatrack/app/";

describe("Etapa 349 — dados em dia sem abrir o app", () => {
  it("o Service Worker grava no mesmo lugar e na mesma versão que o app lê", () => {
    const versaoApp = snap.match(/const VERSAO_SNAPSHOT = (\d+);/)![1];
    expect(sw).toContain(`const VERSAO_SNAPSHOT = ${versaoApp};`);
    expect(snap).toContain('const NOME_BANCO = "vidatrack"');
    expect(snap).toContain('const LOJA = "retrato"');
    expect(snap).toContain('const CHAVE_SNAPSHOT = "vidatrack-snapshot-offline"');
    expect(sw).toContain('indexedDB.open("vidatrack", 1)');
    expect(sw).toContain('"vidatrack-snapshot-offline"');
  });
  it("notificação e periodicsync atualizam o retrato", () => {
    expect(sw).toMatch(/periodicsync[\s\S]*atualizarRetratoNoFundo/);
    expect(sw).toMatch(/showNotification\(dados\.titulo, opcoes\),\s*\/\/[^\n]*\n\s*atualizarRetratoNoFundo/);
  });
  it("o app reaplica a fila ao ler um retrato gravado por trás", () => {
    expect(snap).toContain("normalizar(aplicarPendentes(await lerDoBanco()))");
  });
  it("Android: plugin registrado, trabalho agendado e push atualiza", () => {
    const main = readFileSync(java + "MainActivity.java", "utf8");
    expect(main).toContain("registerPlugin(RetratoFundoPlugin.class)");
    expect(main).toContain("RetratoFundo.agendar(this)");
    expect(readFileSync(java + "VidaTrackMessagingService.java", "utf8")).toContain("RetratoFundo.baixarAgora");
    expect(readFileSync(java + "RetratoFundoPlugin.java", "utf8")).toContain('@CapacitorPlugin(name = "RetratoFundo")');
    expect(snap).toContain('registerPlugin<{ ler: () => Promise<{ json?: string | null }>; apagar: () => Promise<void> }>("RetratoFundo")');
    expect(readFileSync("android/app/build.gradle", "utf8")).toContain("androidx.work:work-runtime");
  });
});
