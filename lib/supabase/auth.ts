import { cache } from "react";
import { createClient } from "./server";

/**
 * Mesma coisa que `supabase.auth.getUser()`, só que memorizada por
 * requisição (via `cache()` do React). `getUser()` sempre bate no
 * servidor de auth do Supabase pra validar o token — é a chamada mais
 * cara de uma página. Antes, cada page.tsx e cada Server Action
 * chamada durante a renderização (ex: `garantirLancamentosRecorrentes`)
 * fazia essa mesma checagem de novo, do zero, na mesma navegação.
 *
 * Com `cache()`, a primeira chamada dentro de uma requisição faz o
 * round-trip de verdade; qualquer chamada seguinte, ainda dentro da
 * mesma requisição, reaproveita o resultado — não bate no Supabase de
 * novo. Isso NÃO afeta o middleware (que roda numa requisição/runtime
 * separado e continua com sua própria checagem, por segurança) nem
 * troca a validação por algo mais fraco — é a mesma chamada, só sem
 * repetição.
 */
export const getUsuarioAtual = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
