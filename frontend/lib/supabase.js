"use strict";

let createSupabaseClient = null;
try {
  const supabase = require("@supabase/supabase-js");
  // v2: createClient
  createSupabaseClient = supabase.createClient;
} catch (_) {
  createSupabaseClient = null;
}

function createClient(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey = process.env.SUPABASE_SERVICE_KEY,
  options = {}
) {
  if (!createSupabaseClient) {
    const e = new Error("Supabase SDK ontbreekt of is niet geïnstalleerd.");
    e.code = "SUPABASE_SDK_MISSING";
    throw e;
  }
  if (!url || !serviceKey) {
    const e = new Error("Supabase configuratie ontbreekt (URL of service key).");
    e.code = "SUPABASE_CONFIG_MISSING";
    throw e;
  }

  const client = createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(options && options.accessToken
      ? { global: { headers: { Authorization: `Bearer ${options.accessToken}` } } }
      : {}),
  });
  return client;
}

async function getUserFromToken(token) {
  if (!token || typeof token !== "string") return { user: null, error: null };
  let client;
  try {
    client = createClient();
  } catch (e) {
    return { user: null, error: e };
  }
  try {
    const { data, error } = await client.auth.getUser(token);
    return { user: data?.user || null, error };
  } catch (e) {
    return { user: null, error: e };
  }
}

module.exports = { createClient, getUserFromToken };
