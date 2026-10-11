"use client";

// Etapa 295 — convite pro Tempo de tela (só no app Android, só pra quem
// ainda não criou nenhum hábito de tela). Dá pra dispensar.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { lerRegrasTela } from "@/lib/tela/habitoTela";

const CHAVE = "vt-convite-tela-dispensado";

export function CartaoTempoTela({ compacto = false }: { compacto?: boolean }) {
  const [mostrar, setMostrar] = useState(false);
  useEffect(() => {
    try {
      const cap = (window as any).Capacitor;
      const android = cap?.isNativePlatform?.() && cap.getPlatform?.() === "android";
      if (!android) return;
      if (lerRegrasTela().length) return;
      if (localStorage.getItem(CHAVE)) return;
      setMostrar(true);
    } catch {}
  }, []);
  if (!mostrar) return null;

  function dispensar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {}
    setMostrar(false);
  }

  return (
    <Link
      href="/habitos/tela"
      className={`relative flex items-center gap-3 rounded-2xl border border-nota/40 px-4 ${compacto ? "py-3" : "py-4"} mt-3 animate-surgir`}
      style={{ background: "linear-gradient(135deg, rgb(var(--c-nota) / 0.18), rgb(var(--c-nota) / 0.04))" }}
    >
      <span className="text-2xl animate-boiar">📵</span>
      <span className="flex-1 min-w-0">
        <span className="block text-base font-semibold">Quer usar menos o celular?</span>
        <span className="block text-xs text-ink-400">
          Veja seu tempo de tela e crie hábitos como “Instagram até 30 min” — eles se marcam sozinhos.
        </span>
      </span>
      <button type="button" onClick={dispensar} aria-label="Dispensar" className="text-ink-400 hover:text-ink-100 p-1 -mr-1 shrink-0">
        <X size={16} />
      </button>
    </Link>
  );
}
