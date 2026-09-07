"use client";

import { useState } from "react";

/**
 * Formata uma sequência de dígitos digitados como valor monetário,
 * sempre tratando os 2 últimos como centavos — assim a pessoa nunca
 * precisa digitar a vírgula manualmente. "255954" vira "2.559,54",
 * do mesmo jeito que a maioria dos apps de banco/finanças já faz.
 */
export function formatarValorDigitado(bruto: string): string {
  const digitos = bruto.replace(/\D/g, "");
  if (!digitos) return "";
  const numero = Number(digitos) / 100;
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CampoValorMonetario({
  name,
  id,
  valorInicial,
  placeholder = "0,00",
  required,
  className,
}: {
  name: string;
  id?: string;
  valorInicial?: string | number;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [valor, setValor] = useState(() =>
    valorInicial !== undefined && valorInicial !== ""
      ? formatarValorDigitado(Number(valorInicial).toFixed(2).replace(".", ""))
      : ""
  );

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      value={valor}
      onChange={(e) => setValor(formatarValorDigitado(e.target.value))}
      className={className}
    />
  );
}
