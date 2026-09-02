import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, BUCKET_ANEXOS } from "@/lib/r2/client";

/**
 * `foto_url` no banco guarda uma de duas coisas:
 * - Uma URL completa (http...) quando veio do Google — já é pública,
 *   usa direto.
 * - Uma "chave" de objeto no R2 (ex: "perfis/uuid/foto.jpg") quando a
 *   pessoa trocou a foto manualmente — o bucket é privado, então
 *   precisa gerar um link assinado toda vez que for exibir.
 */
export async function resolverUrlFoto(fotoUrl: string | null): Promise<string | null> {
  if (!fotoUrl) return null;
  if (fotoUrl.startsWith("http")) return fotoUrl;

  try {
    const comando = new GetObjectCommand({ Bucket: BUCKET_ANEXOS, Key: fotoUrl });
    return await getSignedUrl(r2, comando, { expiresIn: 3600 });
  } catch {
    return null;
  }
}
