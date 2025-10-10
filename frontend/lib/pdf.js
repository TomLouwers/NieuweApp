"use strict";

// Prefer puppeteer-core + @sparticuz/chromium on Vercel to keep size small.
// Fall back to full puppeteer locally.

let puppeteer = null;
try { puppeteer = require("puppeteer"); } catch (_) {}

let puppeteerCore = null;
let chromium = null;
try { puppeteerCore = require("puppeteer-core"); } catch (_) {}
try { chromium = require("@sparticuz/chromium"); } catch (_) {}

async function getBrowser() {
  // On Vercel or when chromium is available, prefer puppeteer-core + chromium
  const onVercel = Boolean(process.env.VERCEL);
  if ((onVercel && puppeteerCore && chromium) || (puppeteerCore && chromium)) {
    const execPath = await chromium.executablePath;
    return await puppeteerCore.launch({
      args: chromium.args,
      executablePath: execPath,
      headless: true,
      defaultViewport: chromium.defaultViewport,
    });
  }
  if (puppeteer) {
    return await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  const e = new Error("Puppeteer is not available");
  e.code = "PUPPETEER_MISSING";
  throw e;
}

async function htmlToPdf(html, { format = "A4", printBackground = true, scale = 1, margin } = {}) {
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(String(html || ""), { waitUntil: ["domcontentloaded", "load", "networkidle0"] });
    const pdfBuffer = await page.pdf({
      format,
      printBackground,
      scale,
      preferCSSPageSize: true,
      margin: margin || { top: "16mm", right: "12mm", bottom: "16mm", left: "12mm" },
    });
    await page.close();
    return pdfBuffer;
  } finally {
    try { await browser.close(); } catch (_) {}
  }
}

module.exports = { htmlToPdf };
