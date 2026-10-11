"use client";

// Etapa 296 — no app da tela de início (principalmente iPhone), o login é
// separado do navegador. Explica isso na tela de login pra ninguém achar
// que a conta "não salvou".
import { useEffect, useState } from "react";
import { ehAppDaTelaInicial, ehIphone } from "@/lib/app/appInstalado";

export function AvisoLoginApp() {
  const [mostrar, setMostrar] = useState<null | "iphone" | "outro">(null);
  useEffect(() => {
    if (ehAppDaTelaInicial()) setMostrar(ehIphone() ? "iphone" : "outro");
  }, []);
  if (!mostrar) return null;
  return (
    <div className="mb-5 rounded-2xl border border-habito/30 bg-habito/10 px-4 py-3 text-sm animate-surgir">
      <p className="font-semibold text-ink-100">📱 Sua conta está salva — é só entrar aqui uma vez</p>
      <p className="text-ink-400 mt-1">
        {mostrar === "iphone"
          ? "No iPhone, o app da tela de início tem um login separado do Safari. Entre com o mesmo e-mail e senha (ou Google) que você usou no cadastro — depois ele lembra de você."
          : "O app da tela de início tem um login separado do navegador. Entre com o mesmo e-mail e senha do cadastro — depois ele lembra de você."}
      </p>
    </div>
  );
}
