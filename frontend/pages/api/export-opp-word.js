"use strict";
const { Document, Packer, Paragraph, HeadingLevel, TextRun } = (() => {
  try { return require("docx"); } catch (_) { return {}; }
})();

const CONTENT_TYPE_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function error(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

function sanitizePart(val) {
  if (val === undefined || val === null) return "";
  return String(val).replace(/[^A-Za-z0-9_-]+/g, "").slice(0, 50);
}

function safeFilename(metadata = {}) {
  const name = sanitizePart(metadata.studentName || metadata.name || "leerling").toLowerCase() || "leerling";
  const groep = sanitizePart(metadata.groep ?? "");
  const parts = ["opp", name, groep && `g${groep}`].filter(Boolean);
  return `${parts.join("_")}.docx`;
}

function parseMarkdownLines(md) {
  const lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    if (!line.trim()) { blocks.push(new Paragraph({ text: "" })); continue; }
    let m = line.match(/^#\s+(.+)/);
    if (m) { blocks.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: m[1].trim() })] })); continue; }
    m = line.match(/^##\s+(.+)/);
    if (m) { blocks.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: m[1].trim() })] })); continue; }
    m = line.match(/^[-*]\s+(.+)/);
    if (m) { blocks.push(new Paragraph({ text: m[1].trim(), bullet: { level: 0 } })); continue; }
    blocks.push(new Paragraph({ children: [new TextRun({ text: line })] }));
  }
  return blocks;
}

function buildDoc({ content, metadata }) {
  if (!Document || !Packer) {
    const e = new Error("DOCX export is niet geconfigureerd op de server.");
    e.code = "DOCX_LIB_MISSING";
    throw e;
  }
  const titleText = `Ontwikkelingsperspectief Plan — ${metadata?.studentName || "[Leerling]"} — Groep ${metadata?.groep || "?"}`;
  const title = new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: titleText })] });
  const doc = new Document({ sections: [{ properties: {}, children: [title, new Paragraph({ text: "" }), ...parseMarkdownLines(content)] }] });
  return doc;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return error(res, 405, "Method Not Allowed");
  }
  const body = req.body || {};
  const content = body.content;
  const metadata = body.metadata || {};
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return error(res, 400, "Ontbrekende of lege 'content' (Markdown).");
  }
  try {
    const doc = buildDoc({ content, metadata });
    const buffer = await Packer.toBuffer(doc);
    const filename = safeFilename(metadata);
    res.setHeader("Content-Type", CONTENT_TYPE_DOCX);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    const code = err?.code || err?.name || "EXPORT_ERROR";
    const message = code === "DOCX_LIB_MISSING" ? "DOCX-export is niet beschikbaar." : "Er ging iets mis bij het exporteren naar Word.";
    return error(res, 500, message);
  }
}

module.exports = handler;
exports.default = handler;

