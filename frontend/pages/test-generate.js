"use strict";

import { useState } from "react";

export default function TestGeneratePage() {
  const [groep, setGroep] = useState(5);
  const [vak, setVak] = useState("rekenen");
  const [periode, setPeriode] = useState("Q2");
  const [previousContent, setPreviousContent] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureBypassCookie(tok) {
    if (!tok) return;
    try {
      // Set bypass cookie once for the domain
      await fetch(`/?x-vercel-protection-bypass=${encodeURIComponent(tok)}&x-vercel-set-bypass-cookie=true`, {
        method: "GET",
        credentials: "include",
      });
    } catch (_) {
      // ignore; header bypass may still work
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("Sending...");
    setResult(null);
    try {
      await ensureBypassCookie(token.trim());

      const body = {
        groep: Number(groep),
        vak: String(vak || "").trim().toLowerCase(),
        periode: String(periode || "").trim(),
        ...(previousContent ? { previousContent } : {}),
      };

      const res = await fetch("/api/generate-groepsplan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-vercel-protection-bypass": token.trim() } : {}),
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      setStatus(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));
      setResult(json);
    } catch (err) {
      setStatus("Request failed");
      setResult({ error: String(err && err.message ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleQueryFallback(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("Sending (query fallback)...");
    setResult(null);
    try {
      await ensureBypassCookie(token.trim());
      const qs = new URLSearchParams({
        groep: String(groep),
        vak: String(vak),
        periode: String(periode),
      });
      const res = await fetch(`/api/generate-groepsplan?${qs.toString()}`, {
        method: "POST",
        headers: { ...(token ? { "x-vercel-protection-bypass": token.trim() } : {}) },
        credentials: "include",
      });
      setStatus(`HTTP ${res.status}`);
      const json = await res.json().catch(() => ({}));
      setResult(json);
    } catch (err) {
      setStatus("Request failed");
      setResult({ error: String(err && err.message ? err.message : err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Test Generate Groepsplan</h1>
      <p>Use this page to call the production API from the browser.</p>
      <ul>
        <li>Optional: Provide a Vercel protection bypass token to avoid auth prompts.</li>
        <li>The request first sets the bypass cookie, then posts JSON to the API.</li>
      </ul>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          Bypass token (optional)
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="VERCEL_AUTOMATION_BYPASS_SECRET"
            style={{ width: "100%", padding: 8 }}
            autoComplete="off"
          />
        </label>

        <label>
          Groep (1–8)
          <input type="number" min={1} max={8} value={groep} onChange={(e) => setGroep(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </label>

        <label>
          Vak
          <select value={vak} onChange={(e) => setVak(e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="rekenen">rekenen</option>
            <option value="taal">taal</option>
            <option value="lezen">lezen</option>
          </select>
        </label>

        <label>
          Periode
          <input value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="Q2" style={{ width: "100%", padding: 8 }} />
        </label>

        <label>
          Previous content (optional)
          <textarea value={previousContent} onChange={(e) => setPreviousContent(e.target.value)} rows={4} style={{ width: "100%", padding: 8 }} />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: "10px 16px" }}>{loading ? "Sending..." : "POST JSON"}</button>
          <button onClick={handleQueryFallback} disabled={loading} style={{ padding: "10px 16px" }}>POST (query fallback)</button>
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <div><b>Status:</b> {status || ""}</div>
        <pre style={{ background: "#f5f5f5", padding: 12, overflow: "auto", whiteSpace: "pre-wrap" }}>
{result ? JSON.stringify(result, null, 2) : "(no response yet)"}
        </pre>
      </div>
    </div>
  );
}

