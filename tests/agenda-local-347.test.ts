import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));
vi.mock("@/lib/agenda/actions", () => ({ avisarConvidadosEvento: vi.fn(), avisarRespostaEvento: vi.fn() }));
vi.mock("@/lib/local/financas", () => ({ novoUuid: () => "u", sincronizarAgora: vi.fn() }));
import { comPendentes } from "@/lib/agenda/useAgenda";

const base: any[] = [
  { id: "a", titulo: "Dentista", data: "2026-10-01", dono_id: "eu", excecoes: [], evento_participantes: [] },
  { id: "b", titulo: "Academia", data: "2026-10-02", dono_id: "eu", excecoes: [], evento_participantes: [] },
];

describe("Etapa 347 — agenda local-first", () => {
  it("mostra o criado no aparelho com o id real e ⏳", () => {
    const r = comPendentes(base, "eu", [{ id: "n1", tipo: "criar_evento", dados: { titulo: "Jantar", data: "2026-10-05" }, convidados: ["su"] }] as any);
    const n = r.find((e) => e.id === "n1")!;
    expect(n.pendente).toBe(true);
    expect(n.titulo).toBe("Jantar");
    expect(n.evento_participantes?.[0]).toEqual({ usuario_id: "su", resposta: "pendente" });
  });
  it("aplica edição e exclusão por cima do banco", () => {
    const r = comPendentes(base, "eu", [
      { id: "editar-evento:a", tipo: "editar_evento", eventoId: "a", dados: { titulo: "Dentista 15h" }, convidados: [] },
      { id: "apagar-evento:b:tudo", tipo: "apagar_evento", eventoId: "b", soODia: null },
    ] as any);
    expect(r.map((e) => e.titulo)).toEqual(["Dentista 15h"]);
    expect(r[0].pendente).toBe(true);
  });
  it("pular um dia não duplica a exceção", () => {
    const fila = [{ id: "x", tipo: "apagar_evento", eventoId: "a", soODia: "2026-10-01" }] as any;
    const r = comPendentes(comPendentes(base, "eu", fila), "eu", fila);
    expect(r[0].excecoes).toEqual(["2026-10-01"]);
  });
  it("reenviar o criar não duplica", () => {
    const fila = [{ id: "n1", tipo: "criar_evento", dados: { titulo: "J", data: "2026-10-05" }, convidados: [] }] as any;
    const r = comPendentes(comPendentes(base, "eu", fila), "eu", fila);
    expect(r.filter((e) => e.id === "n1")).toHaveLength(1);
  });
});
