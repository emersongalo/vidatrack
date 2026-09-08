import Link from "next/link";

export function MenuLateralDesktop({
  corAtiva,
  submenu,
}: {
  corAtiva: "habito" | "financa";
  submenu: React.ReactNode;
}) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-base-800 border-r border-base-600 px-4 py-6 overflow-y-auto">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 mb-8">
        <svg width="26" height="26" viewBox="0 0 100 100" className="shrink-0">
          <line x1="26" y1="73" x2="73" y2="26" stroke={corAtiva === "habito" ? "#7FB894" : "#D9A24C"} strokeWidth="9" strokeLinecap="round" />
          <circle cx="38" cy="61" r="6" fill="#7FB894" />
          <circle cx="61" cy="38" r="6" fill="#D9A24C" />
        </svg>
        <span className="font-display font-bold text-lg text-ink-100">VidaTrack</span>
      </Link>

      <Link
        href="/dashboard"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400 hover:text-ink-100 hover:bg-base-700 transition mb-4"
      >
        ← Painel
      </Link>

      {submenu}

      <div className="flex-1" />

      <Link
        href="/perfil"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400 hover:text-ink-100 hover:bg-base-700 transition"
      >
        Perfil
      </Link>
    </aside>
  );
}
