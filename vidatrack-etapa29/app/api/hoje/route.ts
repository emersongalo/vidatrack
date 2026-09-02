import { NextResponse } from "next/server";
import { hojeISO } from "@/lib/habitos/streak";
import { buscarItensDoDia } from "@/lib/agenda/consulta";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data") ?? hojeISO();
  const categoria = searchParams.get("categoria") ?? "";

  const { itens } = await buscarItensDoDia(data, categoria);

  return NextResponse.json({ itens, data });
}
