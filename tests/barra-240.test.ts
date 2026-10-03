import { describe, it, expect, vi } from "vitest";
vi.mock("@capacitor/core", () => ({ registerPlugin: () => ({}) }));
import { rotaTemCorPropria } from "@/lib/app/barraStatus";

describe("rotas com topo colorido", () => {
  const id = "3f2b8c1a-1234-4abc-9def-0123456789ab";
  it("só lançamento e hábito pintam a barra", () => {
    expect(rotaTemCorPropria("/financas/nova")).toBe(true);
    expect(rotaTemCorPropria(`/financas/${id}/editar`)).toBe(true);
    expect(rotaTemCorPropria("/habitos/novo")).toBe(true);
    expect(rotaTemCorPropria(`/habitos/${id}`)).toBe(true);
    expect(rotaTemCorPropria(`/habitos/${id}/editar`)).toBe(true);
    expect(rotaTemCorPropria("/financas")).toBe(false);
    expect(rotaTemCorPropria("/financas/extrato")).toBe(false);
    expect(rotaTemCorPropria("/habitos/lista")).toBe(false);
    expect(rotaTemCorPropria("/habitos/timer")).toBe(false);
    expect(rotaTemCorPropria("/dashboard")).toBe(false);
  });
});
