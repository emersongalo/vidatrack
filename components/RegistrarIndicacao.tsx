"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Etapa 218 — se a pessoa chegou por um link de convite, registra quem
// convidou assim que ela estiver logada (só vale pra conta criada nos
// últimos 7 dias) e apaga o cookie.
export function RegistrarIndicacao() {
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)vt_ref=([A-Za-z0-9]+)/);
    if (!m || !navigator.onLine) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return; // ainda não entrou: guarda o cookie pra depois do cadastro
      supabase.rpc("registrar_indicacao", { p_codigo: m[1] }).then(({ error }) => {
        if (!error) document.cookie = "vt_ref=; Max-Age=0; path=/";
      });
    });
  }, []);
  return null;
}
