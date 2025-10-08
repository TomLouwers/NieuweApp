import { NextResponse } from "next/server";

export async function POST() {
  // Placeholder: in future we can proxy to /pages/api/generate-groepsplan
  return NextResponse.json({ ok: false, error: "Not implemented yet" }, { status: 501 });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method Not Allowed" }, { status: 405 });
}

