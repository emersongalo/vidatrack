import { bancoPorId, siglaDoSelo } from "@/lib/financas/bancos";

/**
 * Etapa 222 — selo da conta: sigla + cor do banco (Nubank roxo "NU",
 * Itaú laranja "IT"...). Banco não listado: 2 letras do nome da conta
 * num fundo cinza. Sem logotipo e sem imagem enviada.
 */
export function SeloBanco({
  bancoId,
  nome,
  tipo,
  tamanho = 32,
}: {
  bancoId: string | null | undefined;
  nome?: string | null;
  tipo?: string | null;
  tamanho?: number;
}) {
  const banco = bancoPorId(bancoId);
  const sigla = siglaDoSelo(bancoId, nome, tipo);

  return (
    <span
      className="rounded-lg flex items-center justify-center shrink-0 font-bold tracking-tight select-none"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: banco.cor,
        color: banco.texto,
        fontSize: Math.round(tamanho * (sigla.length > 2 ? 0.3 : 0.38)),
      }}
      title={banco.id === "outro" ? nome ?? banco.nome : banco.nome}
      aria-hidden
    >
      {sigla || (
        <svg width={tamanho * 0.55} height={tamanho * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V9l7-5 7 5v12" />
          <path d="M9 21v-6h6v6" />
        </svg>
      )}
    </span>
  );
}
