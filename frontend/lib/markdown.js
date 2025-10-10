"use strict";

// Minimal Markdown -> HTML for headings, lists, and paragraphs.
// Intentionally simple to avoid heavy deps.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mdToHtml(md) {
  if (!md || typeof md !== "string") return "";
  const lines = md.split(/\r?\n/);
  let html = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      if (inList) { html.push("</ul>"); inList = false; }
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${escapeHtml(line.slice(2).trim())}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (inList) { html.push("</ul>"); inList = false; }
    html.push(`<p>${escapeHtml(line)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("\n");
}

function wrapHtmlDoc({ title = "Groepsplan", bodyHtml = "" } = {}) {
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      html, body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; }
      body { margin: 24px; }
      h1 { font-size: 22px; margin: 0 0 12px; }
      h2 { font-size: 16px; margin: 16px 0 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
      p { margin: 8px 0; line-height: 1.45; }
      ul { margin: 8px 0 8px 20px; }
      li { margin: 4px 0; }
      .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
 </html>`;
}

module.exports = { mdToHtml, wrapHtmlDoc };

