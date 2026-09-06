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

  // Categoria antiga (de antes desta etapa) ainda guarda um emoji
  // puro — continua mostrando ele normalmente, sem quebrar nada.
  return <span className={className}>{icone}</span>;
}
