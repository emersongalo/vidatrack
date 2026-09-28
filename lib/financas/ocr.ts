// Etapa 214 — OCR no próprio aparelho com tesseract.js (carregado sob demanda
// da CDN, só quando a pessoa toca em "Ler cupom"). Precisa de internet na 1ª vez.
const URL_TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

type TesseractGlobal = {
  recognize: (
    imagem: File | Blob | string,
    idioma: string,
    opcoes?: { logger?: (m: { status: string; progress: number }) => void }
  ) => Promise<{ data: { text: string } }>;
};

let carregando: Promise<TesseractGlobal> | null = null;

function carregarTesseract(): Promise<TesseractGlobal> {
  const w = window as unknown as { Tesseract?: TesseractGlobal };
  if (w.Tesseract) return Promise.resolve(w.Tesseract);
  if (carregando) return carregando;
  carregando = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = URL_TESSERACT;
    s.async = true;
    s.onload = () => (w.Tesseract ? resolve(w.Tesseract) : reject(new Error("OCR indisponível")));
    s.onerror = () => {
      carregando = null;
      reject(new Error("Não consegui baixar o leitor de cupom. Verifique a internet."));
    };
    document.head.appendChild(s);
  });
  return carregando;
}

// Reduz a foto (câmeras de celular geram imagens enormes → OCR lento)
async function reduzirImagem(arquivo: File, larguraMax = 1600): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, larguraMax / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;
    ctx.filter = "grayscale(1) contrast(1.4)";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? arquivo), "image/jpeg", 0.9));
  } catch {
    return arquivo;
  }
}

export async function lerTextoDaImagem(arquivo: File, aoProgredir?: (pct: number) => void): Promise<string> {
  const T = await carregarTesseract();
  const imagem = await reduzirImagem(arquivo);
  const r = await T.recognize(imagem, "por", {
    logger: (m) => {
      if (m.status === "recognizing text" && aoProgredir) aoProgredir(Math.round(m.progress * 100));
    },
  });
  return r.data.text ?? "";
}
