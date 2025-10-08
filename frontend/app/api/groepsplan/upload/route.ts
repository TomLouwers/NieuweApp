import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, message: "Upload route scaffold — not implemented" }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}

