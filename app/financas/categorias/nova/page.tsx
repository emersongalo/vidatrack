import { FormularioCategoria } from "@/components/FormularioCategoria";

export default function NovaCategoriaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  return <FormularioCategoria erro={searchParams.erro} />;
}
