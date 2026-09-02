import { bancoPorId } from "@/lib/financas/bancos";

export function SeloBanco({
  bancoId,
  tamanho = 32,
}: {
  bancoId: string | null | undefined;
  tamanho?: number;
}) {
  const banco = bancoPorId(bancoId);

  return (
    <span
      className="rounded-lg flex items-center justify-center shrink-0"
      style={{ width: tamanho, height: tamanho, backgroundColor: `${banco.cor}26` }}
      title={banco.nome}
    >
      <svg
        width={tamanho * 0.55}
        height={tamanho * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke={banco.cor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21V9l7-5 7 5v12" />
        <path d="M9 21v-6h6v6" />
        <path d="M9 9h.01M15 9h.01" />
      </svg>
    </span>
  );
}
