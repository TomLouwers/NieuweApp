"use strict";
// Do not persist raw uploads or inputs. No PII at rest.

const fs = require("fs");
const path = require("path");
const os = require("os");
const { extractSLOCodes } = require("../../lib/slo-database.js");
const { handleAPIError } = require("../../lib/error-handler.js");

let IncomingForm;
try {
  // Support formidable across versions
  ({ IncomingForm } = require("formidable"));
} catch (_) {
  IncomingForm = null;
}

let pdfParse = null;
try {
  pdfParse = require("pdf-parse");
} catch (_) {}

let mammoth = null;
try {
  mammoth = require("mammoth");
} catch (_) {}

const MAX_MB = 5;
const MAX_FILE_SIZE = MAX_MB * 1024 * 1024;

function friendlyError(res, status, message) {
  return res.status(status).json({ success: false, text: "", metadata: {}, filename: "", error: message });
}

function detectType(file) {
  const mime = (file.mimetype || file.type || "").toLowerCase();
  const ext = path.extname(file.originalFilename || file.newFilename || file.filepath || "").toLowerCase();
  const isPDF = mime === "application/pdf" || ext === ".pdf";
  const isDOCX =
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === ".docx";
  return { isPDF, isDOCX };
}

function extractMetadataFromText(text) {
  if (typeof text !== "string") text = String(text || "");
  const t = text;

  let groep = null;
  const mGroep = t.match(/\bgroep\s*([1-8])\b/i);
  if (mGroep) {
    const g = Number(mGroep[1]);
    if (Number.isInteger(g) && g >= 1 && g <= 8) groep = g;
  }

  let vak = null;
  const mVak = t.match(/\b(rekenen|taal|lezen)\b/i);
  if (mVak) vak = mVak[1].toLowerCase();

  let periode = null;
  const mPeriode = t.match(/\bperiode\s*[:\-]?\s*([A-Za-z]{1,2}\d{1,2})\b/i) || t.match(/\b(Q[1-4]|H[12]|P[1-4])\b/i);
  if (mPeriode) periode = mPeriode[1].toUpperCase();

  const slo_codes = extractSLOCodes(t);

  return { groep, vak, periode, slo_codes };
}

function detectPIIWarnings(text) {
  const warnings = [];
  if (typeof text !== "string" || !text) return warnings;
  const t = text;
  const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  const nameRe = /\b([A-Z][a-z]+)\s+(?:van\s+|de\s+|van\s+der\s+|van\s+den\s+)?([A-Z][a-z]+(?:-[A-Z][a-z]+)?)\b/g;
  // Simple NL-ish phone pattern (06-12345678 or +31 6 1234 5678)
  const phoneRe = /(\+?31\s?6|06)[\s\-]?\d{2,}[\s\-]?\d{2,}[\s\-]?\d{2,}/g;

  if (emailRe.test(t)) warnings.push("Mogelijk e-mailadres aangetroffen. Deel geen PII.");
  if (nameRe.test(t)) warnings.push("Mogelijke persoonsnamen aangetroffen. Deel geen PII.");
  if (phoneRe.test(t)) warnings.push("Mogelijk telefoonnummer aangetroffen. Deel geen PII.");
  return warnings;
}

async function parseMultipart(req) {
  if (!IncomingForm) throw Object.assign(new Error("Bestandsverwerking is niet geconfigureerd."), { code: "FORMIDABLE_MISSING" });
  const form = new IncomingForm({
    multiples: false,
    keepExtensions: true,
    maxFileSize: MAX_FILE_SIZE,
    uploadDir: os.tmpdir(),
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

async function readFileText(file) {
  const filepath = file.filepath || file.path; // v2/v3 compatibility
  if (!filepath) throw new Error("Kan tijdelijk bestand niet vinden.");

  const { isPDF, isDOCX } = detectType(file);

  if (isPDF) {
    if (!pdfParse) throw Object.assign(new Error("PDF-verwerking niet beschikbaar."), { code: "PDF_PARSER_MISSING" });
    const buf = await fs.promises.readFile(filepath);
    const out = await pdfParse(buf);
    return String(out?.text || "").trim();
  }

  if (isDOCX) {
    if (!mammoth) throw Object.assign(new Error("DOCX-verwerking niet beschikbaar."), { code: "DOCX_PARSER_MISSING" });
    const result = await mammoth.extractRawText({ path: filepath });
    return String(result?.value || "").trim();
  }

  throw Object.assign(new Error("Bestandstype wordt niet ondersteund."), { code: "UNSUPPORTED_TYPE" });
}

async function handler(req, res) {
  const reqId = Math.random().toString(36).slice(2, 10);
  try { console.log(`[upload-document] start reqId=${reqId}`); } catch (_) {}
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return friendlyError(res, 405, "Method Not Allowed");
  }

  let file = null;
  try {
    const { files } = await parseMultipart(req);
    const f = files?.document;
    if (!f) return friendlyError(res, 400, "Geen bestand gevonden. Gebruik veldnaam 'document'.");

    // Handle single or array
    file = Array.isArray(f) ? f[0] : f;
    if (!file) return friendlyError(res, 400, "Geen geldig bestand ontvangen.");

    // Enforce size limit
    const size = Number(file.size || file.fileSize || 0);
    if (!Number.isFinite(size) || size <= 0) return friendlyError(res, 400, "Leeg of ongeldig bestand.");
    if (size > MAX_FILE_SIZE) return friendlyError(res, 400, `Bestand is te groot (max ${MAX_MB}MB).`);

    const { isPDF, isDOCX } = detectType(file);
    if (!isPDF && !isDOCX) {
      return friendlyError(res, 400, "Bestandstype wordt niet ondersteund. Upload een PDF of DOCX.");
    }

    const text = await readFileText(file);
    const metadata = extractMetadataFromText(text);
    const filename = file.originalFilename || "document";

    if (!text || text.length < 1) {
      return res.status(200).json({
        success: true,
        text: "",
        metadata,
        filename,
        warnings: ["Het document bevatte geen leesbare tekst."],
      });
    }

    const warnings = detectPIIWarnings(text);
    try { console.log(`[upload-document] done reqId=${reqId} status=200`); } catch (_) {}
    return res.status(200).json({ success: true, text, metadata, filename, ...(warnings.length ? { warnings } : {}) });
  } catch (err) {
    try { console.log(`[upload-document] error reqId=${reqId} code=${err?.code||err?.name||'ERR'}`); } catch (_) {}
    return handleAPIError(err, res, { shape: "upload" });
  } finally {
    // Best-effort cleanup of temp file
    try {
      const fp = file?.filepath || file?.path;
      if (fp && typeof fp === "string") {
        await fs.promises.unlink(fp).catch(() => {});
      }
    } catch (_) {
      // ignore
    }
  }
}

module.exports = handler;
exports.default = handler;
module.exports.config = { api: { bodyParser: false } };
