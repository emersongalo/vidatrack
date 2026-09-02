"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@/lib/supabase/server";
import { r2, BUCKET_ANEXOS } from "@/lib/r2/client";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_MB = 5;

export async function atualizarPerfil(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) {
    redirect(`/perfil?erro=${encodeURIComponent("Digite um nome")}`);
  }

  const atualizacao: Record<string, string> = { nome };

  const arquivo = formData.get("foto") as File | null;
  if (arquivo && arquivo.size > 0) {
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      redirect(`/perfil?erro=${encodeURIComponent("Use uma imagem JPG, PNG ou WebP")}`);
    }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      redirect(`/perfil?erro=${encodeURIComponent(`Imagem maior que ${TAMANHO_MAXIMO_MB}MB`)}`);
    }

    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const caminho = `perfis/${user!.id}/${randomUUID()}-${arquivo.name}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET_ANEXOS,
        Key: caminho,
        Body: bytes,
        ContentType: arquivo.type,
      })
    );

    // Guarda a "chave" do objeto (não uma URL assinada, que expira) —
    // a URL de exibição é gerada na hora de mostrar, via resolverUrlFoto.
    atualizacao.foto_url = caminho;
  }

  const { error } = await supabase.from("perfis").update(atualizacao).eq("id", user!.id);

  if (error) {
    redirect(`/perfil?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  redirect("/perfil?sucesso=1");
}
