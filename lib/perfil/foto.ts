/**
 * `foto_url` no banco guarda uma de duas coisas:
 * - Uma URL completa (http...) quando veio do Google — já é pública,
 *   usa direto.
 * - Uma "chave" de objeto no R2 (ex: "perfis/uuid/foto.jpg") quando a
 *   pessoa trocou a foto manualmente — o bucket é privado, então
 *   precisa gerar um link assinado toda vez que for exibir.
 *
 * O SDK da AWS (usado pra falar com o R2) só é carregado de verdade
 * no segundo caso (import dinâmico) — a maioria das pessoas não tem
 * foto customizada, ou usa a do Google, então a maioria das vezes
 * essa função nem chega a carregar esse SDK, que é relativamente
 * pesado. Isso ajuda o "primeiro carregamento" de cada tela (Painel,
 * Finanças, Contas, Perfil) a ficar mais leve.
 */
export async function resolverUrlFoto(fotoUrl: string | null): Promise<string | null> {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith("http")) return fotoUrl;

  try {
    const [{ GetObjectCommand }, { getSignedUrl }, { r2, BUCKET_ANEXOS }] = await Promise.all([
      import("@aws-sdk/client-s3"),
      import("@aws-sdk/s3-request-presigner"),
      import("@/lib/r2/client"),
    ]);
    const comando = new GetObjectCommand({ Bucket: BUCKET_ANEXOS, Key: fotoUrl });
    return await getSignedUrl(r2, comando, { expiresIn: 3600 });
  } catch {
    return null;
  }
}
