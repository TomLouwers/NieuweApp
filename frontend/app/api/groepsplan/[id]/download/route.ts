import { NextResponse } from "next/server";

interface Ctx { params: { id: string } }

export async function GET(_req: Request, ctx: Ctx) {
  return new NextResponse(`Download for ${ctx.params.id} komt hier…`, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

