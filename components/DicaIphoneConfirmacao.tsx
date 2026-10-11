"use client";

// Etapa 296 — depois de confirmar o e-mail no iPhone, o link abre no
// Safari. Quem usa o ícone da tela de início precisa entrar nele também.
import { useEffect, useState } from "react";
import { ehIphone } from "@/lib/app/appInstalado";

export function DicaIphoneConfirmacao() {
  const [iphone, setIphone] = useState(false);
  useEffect(() => setIphone(ehIphone()), []);
  if (!iphone) return null;
  return (
    <p className="mt-5 text-xs text-ink-400 bg-base-800 border border-base-600 rounded-xl px-3 py-2.5 text-left">
      📱 <strong className="text-ink-100">No iPhone:</strong> o link de confirmação abre no Safari. Se você usa o VidaTrack pelo
      ícone da tela de início, abra ele depois e entre com o mesmo e-mail e senha — é só uma vez.
    </p>
  );
}
