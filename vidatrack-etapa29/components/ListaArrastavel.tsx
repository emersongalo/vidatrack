"use client";

import { useState, useTransition } from "react";

export function ListaArrastavel<T extends { id: string }>({
  itens,
  renderItem,
  aoReordenar,
}: {
  itens: T[];
  renderItem: (item: T, arrastando: boolean) => React.ReactNode;
  aoReordenar: (idsEmOrdem: string[]) => Promise<void>;
}) {
  const [ordemLocal, setOrdemLocal] = useState(itens);
  const [indiceArrastado, setIndiceArrastado] = useState<number | null>(null);
  const [, iniciarTransicao] = useTransition();

  // Mantém sincronizado se os itens mudarem por fora (ex: revalidação)
  if (
    itens.length !== ordemLocal.length ||
    itens.some((it, i) => it.id !== ordemLocal[i]?.id)
  ) {
    if (indiceArrastado === null) setOrdemLocal(itens);
  }

  function soltar(indiceDestino: number) {
    if (indiceArrastado === null || indiceArrastado === indiceDestino) return;

    const nova = [...ordemLocal];
    const [movido] = nova.splice(indiceArrastado, 1);
    nova.splice(indiceDestino, 0, movido);

    setOrdemLocal(nova);
    setIndiceArrastado(null);
    iniciarTransicao(() => {
      aoReordenar(nova.map((it) => it.id));
    });
  }

  return (
    <ul className="space-y-2">
      {ordemLocal.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={() => setIndiceArrastado(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => soltar(i)}
          onDragEnd={() => setIndiceArrastado(null)}
          className="cursor-grab active:cursor-grabbing"
        >
          {renderItem(item, indiceArrastado === i)}
        </li>
      ))}
    </ul>
  );
}
