"use strict";

const { getUserFromToken } = require("./supabase.js");

async function requireAuth(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || "";
  const token = typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    const e = new Error("Missing bearer token");
    e.status = 401;
    e.code = "NO_TOKEN";
    throw e;
  }
  const { user, error } = await getUserFromToken(token);
  if (error || !user) {
    const e = new Error("Invalid or expired token");
    e.status = 401;
    e.code = "BAD_TOKEN";
    throw e;
  }
  return { token, user };
}

module.exports = { requireAuth };

