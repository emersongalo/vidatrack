import { MAPA_ICONES_CATEGORIA } from "@/lib/financas/icones-categoria";

export function IconeCategoria({
  icone,
  tamanho = 16,
  className,
}: {
  icone: string | null | undefined;
  tamanho?: number;
  className?: string;
}) {
  const Icone = icone ? MAPA_ICONES_CATEGORIA.get(icone) : undefined;

  if (Icone) {
    return <Icone size={tamanho} strokeWidth={2} className={className} />;
  }

  // Categoria antiga ou com emoji (Etapa 272): mostra o emoji no mesmo
  // tamanho que o ícone ocuparia, pra não ficar miúdo nem estourar o círculo.
  return (
    <span
      className={`inline-flex items-center justify-center select-none ${className ?? ""}`}
      style={{ fontSize: Math.round(tamanho * 1.15), lineHeight: 1, width: tamanho, height: tamanho }}
      aria-hidden="true"
    >
      {icone}
    </span>
  );
}
