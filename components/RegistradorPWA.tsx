"use client";

import { useEffect } from "react";

export function RegistradorPWA() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Falha silenciosa: o app funciona normalmente sem PWA.
      });
    }
  }, []);

  return null;
}
