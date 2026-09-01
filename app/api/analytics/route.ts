import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { pagina } = await request.json();
    if (typeof pagina !== "string" || pagina.length > 200) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createClient();
    await supabase.from("analytics_eventos").insert({ pagina });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
