"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { r2, BUCKET_ANEXOS } from "@/lib/r2/client";

export async function criarNota(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const titulo = String(formData.get("titulo") ?? "").trim() || "Sem título";

  const { data, error } = await supabase
    .from("notas")
    .insert({ dono_id: user!.id, titulo, conteudo: "" })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/notas?erro=${encodeURIComponent(error?.message ?? "Não foi possível criar a nota")}`);
  }

  redirect(`/notas/${data!.id}`);
}

/**
 * Mesma coisa que `criarNota`, mas SEM `redirect()` — usada pela fila
 * de sincronização offline (Etapa 44). Rodar `redirect()` de dentro de
 * uma sincronização automática em segundo plano jogaria a pessoa de
 * tela sem ela pedir, então essa versão só devolve um resultado.
 */
export async function criarNotaSilenciosa(
  titulo: string,
  conteudo: string
): Promise<{ id: string } | { erro: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada" };

  const { data, error } = await supabase
    .from("notas")
    .insert({ dono_id: user.id, titulo: titulo.trim() || "Sem título", conteudo })
    .select("id")
    .single();

  if (error || !data) return { erro: error?.message ?? "Não foi possível criar a nota" };
  return { id: data.id };
}

/**
 * Versão silenciosa de editar nota, pra fila offline — mesma ideia da
 * `criarNotaSilenciosa` acima.
 */
export async function atualizarNotaSilenciosa(
  notaId: string,
  titulo: string,
  conteudo: string
): Promise<{ sucesso: boolean }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notas")
    .update({ titulo: titulo.trim() || "Sem título", conteudo })
    .eq("id", notaId);

  revalidatePath(`/notas/${notaId}`);
  revalidatePath("/notas");
  return { sucesso: !error };
}

export async function atualizarNota(notaId: string, formData: FormData) {
  const supabase = createClient();
  const titulo = String(formData.get("titulo") ?? "").trim() || "Sem título";
  const conteudo = String(formData.get("conteudo") ?? "");
  const horarioLembreteRaw = String(formData.get("horarioLembrete") ?? "");

  await supabase
    .from("notas")
    .update({ titulo, conteudo, horario_lembrete: horarioLembreteRaw || null })
    .eq("id", notaId);

  revalidatePath(`/notas/${notaId}`);
  revalidatePath("/notas");
}

export async function arquivarNota(notaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("notas").update({ arquivado: true }).eq("id", notaId);
  revalidatePath("/notas");
  redirect("/notas");
}

export async function alternarFixarNota(notaId: string) {
  "use server";
  const supabase = createClient();

  const { data: nota } = await supabase.from("notas").select("fixada").eq("id", notaId).maybeSingle();
  await supabase.from("notas").update({ fixada: !(nota?.fixada ?? false) }).eq("id", notaId);

  revalidatePath("/notas");
}

const TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
];
const TAMANHO_MAXIMO_MB = 10;

export async function enviarAnexo(notaId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) {
    redirect(`/notas/${notaId}?erro=${encodeURIComponent("Escolha um arquivo")}`);
  }

  if (!TIPOS_PERMITIDOS.includes(arquivo!.type)) {
    redirect(`/notas/${notaId}?erro=${encodeURIComponent("Tipo de arquivo não permitido")}`);
  }

  if (arquivo!.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    redirect(`/notas/${notaId}?erro=${encodeURIComponent(`Arquivo maior que ${TAMANHO_MAXIMO_MB}MB`)}`);
  }

  // Confirma que a nota existe e é acessível (RLS do Supabase já filtra
  // isso na consulta); o R2 em si não tem RLS, então essa checagem aqui
  // é o que protege o upload.
  const { data: nota } = await supabase.from("notas").select("id").eq("id", notaId).maybeSingle();
  if (!nota) redirect(`/notas?erro=${encodeURIComponent("Nota não encontrada ou sem acesso")}`);

  const bytes = Buffer.from(await arquivo!.arrayBuffer());
  const caminho = `notas/${notaId}/${randomUUID()}-${arquivo!.name}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET_ANEXOS,
      Key: caminho,
      Body: bytes,
      ContentType: arquivo!.type,
    })
  );

  const { error } = await supabase.from("nota_anexos").insert({
    nota_id: notaId,
    enviado_por: user!.id,
    nome_arquivo: arquivo!.name,
    caminho_storage: caminho,
    tipo: arquivo!.type,
    tamanho_bytes: arquivo!.size,
  });

  if (error) {
    // Se falhar ao salvar no banco, remove o arquivo órfão do R2
    await r2
      .send(new DeleteObjectCommand({ Bucket: BUCKET_ANEXOS, Key: caminho }))
      .catch(() => {});
    redirect(`/notas/${notaId}?erro=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/notas/${notaId}`);
}

export async function removerAnexo(notaId: string, anexoId: string, caminhoStorage: string) {
  "use server";
  const supabase = createClient();

  await supabase.from("nota_anexos").delete().eq("id", anexoId);
  await r2
    .send(new DeleteObjectCommand({ Bucket: BUCKET_ANEXOS, Key: caminhoStorage }))
    .catch(() => {});

  revalidatePath(`/notas/${notaId}`);
}

/**
 * Gera uma URL temporária (1 hora) para visualizar/baixar um anexo.
 * O bucket é privado, então toda visualização passa por aqui.
 */
export async function gerarUrlAnexo(caminhoStorage: string): Promise<string> {
  const comando = new GetObjectCommand({ Bucket: BUCKET_ANEXOS, Key: caminhoStorage });
  return getSignedUrl(r2, comando, { expiresIn: 3600 });
}

export async function restaurarNota(notaId: string) {
  "use server";
  const supabase = createClient();
  await supabase.from("notas").update({ arquivado: false }).eq("id", notaId);
  revalidatePath("/notas");
  revalidatePath("/notas/lixeira");
}

export async function excluirNotaDefinitivamente(notaId: string) {
  "use server";
  const supabase = createClient();

  // Apaga os arquivos de verdade no R2 antes de excluir os registros,
  // senão eles ficam órfãos ocupando espaço pra sempre.
  const { data: anexos } = await supabase
    .from("nota_anexos")
    .select("caminho_storage")
    .eq("nota_id", notaId);

  for (const anexo of anexos ?? []) {
    await r2
      .send(new DeleteObjectCommand({ Bucket: BUCKET_ANEXOS, Key: anexo.caminho_storage }))
      .catch(() => {});
  }

  await supabase.from("compartilhamentos").delete().eq("tipo_item", "nota").eq("item_id", notaId);
  await supabase.from("notas").delete().eq("id", notaId);
  revalidatePath("/notas/lixeira");
}
