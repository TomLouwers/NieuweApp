"use strict";

const { startRequest, endRequest } = require("../../../lib/logger.js");

async function handler(req, res) {
  const started = Date.now();
  const reqId = Math.random().toString(36).slice(2, 10);
  const path = "/api/v1/health";
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ status: "error", error: "Method Not Allowed" });
    }
    startRequest({ reqId, path, method: req.method, userId: null, ip: (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").toString() });
    const uptime = process.uptime ? Math.round(process.uptime()) : null;
    const payload = {
      status: "ok",
      version: "v1",
      time: new Date().toISOString(),
      uptime_s: uptime,
      checks: {
        node: process.version || null,
        openai: Boolean(process.env.OPENAI_API_KEY) || false,
        anthropic: Boolean(process.env.ANTHROPIC_API_KEY) || false,
      },
    };
    endRequest({ reqId, path, status: 200, durMs: Date.now() - started });
    return res.status(200).json(payload);
  } catch (err) {
    endRequest({ reqId, path, status: 500, durMs: Date.now() - started });
    return res.status(500).json({ status: "error" });
  }
}

module.exports = handler;
module.exports.default = module.exports;

