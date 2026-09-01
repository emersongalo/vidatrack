import { S3Client } from "@aws-sdk/client-s3";

// R2 é compatível com a API do S3 — usamos o SDK da AWS apontando
// para o endpoint da Cloudflare. Isso só roda no servidor.

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_ANEXOS = process.env.R2_BUCKET_NAME!;
