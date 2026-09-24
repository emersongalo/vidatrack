import { Suspense } from "react";
import { HojeLocalFirst } from "@/components/HojeLocalFirst";

// Etapa 126: essa página não busca mais nada no servidor — todo o
// carregamento e a atualização dos dados acontecem dentro de
// HojeLocalFirst, no navegador. Isso é o que permite essa tela abrir
// (com o que já estava salvo) mesmo com zero conexão.
//
// O Suspense aqui é exigência do Next para qualquer componente que
// usa useSearchParams — não tem relação com o carregamento de dados
// em si (que já é tratado dentro do próprio HojeLocalFirst).
export default function HojePage() {
  return (
    <Suspense fallback={null}>
      <HojeLocalFirst />
    </Suspense>
  );
}
