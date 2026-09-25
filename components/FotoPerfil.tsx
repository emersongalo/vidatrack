"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Etapa 182 — foto de perfil com fallback pro ícone padrão sempre
 * que a URL falhar (link do Google expirado, sem internet, conta de
 * demonstração com foto antiga...). Usada em todo lugar que mostra a
 * foto da pessoa, pra não repetir essa proteção 5 vezes.
 */
export function FotoPerfil({
  url,
  tamanho = 36,
  className = "rounded-lg",
  fallback,
}: {
  url: string | null;
  tamanho?: number;
  className?: string;
  /** Etapa 182 — por padrão cai no ícone do app, mas a tela de
   *  Perfil usa um círculo com a inicial do nome em vez disso. */
  fallback?: React.ReactNode;
}) {
  const [quebrada, setQuebrada] = useState(false);
  useEffect(() => setQuebrada(false), [url]);

  if (!url || quebrada) {
    return fallback ?? <Image src="/icons/icon-192.png" alt="" width={tamanho} height={tamanho} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={tamanho}
      height={tamanho}
      style={{ width: tamanho, height: tamanho }}
      className={`${className} object-cover`}
      onError={() => setQuebrada(true)}
    />
  );
}
