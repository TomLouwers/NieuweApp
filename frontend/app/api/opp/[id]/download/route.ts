import { NextResponse } from "next/server";

interface Ctx { params: { id: string } }

export async function GET(req: Request, ctx: Ctx) {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "docx").toLowerCase();
  if (format !== "docx") {
    return NextResponse.json({ ok: false, error: "Unsupported format" }, { status: 400 });
  }
  const id = ctx.params.id;
  const filename = `OPP_${id}.docx`;
  // Placeholder binary content (not a real DOCX)
  const data = Buffer.from("Mock OPP content for " + id, "utf-8");
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=${filename}`,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
    },
  });
}

