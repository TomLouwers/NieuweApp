## Groepsplan API

Endpoint: `POST /api/generate-groepsplan`

Input JSON body:
- `groep`: integer 1–8
- `vak`: one of `rekenen`, `taal`, `lezen`
- `periode`: short string (e.g., `Q2`)

Response JSON:
- `{ success, content, metadata }`
  - `content`: Markdown with sections: Beginsituatie, Doelen (SLO), Aanpak, Differentiatie, Evaluatie
  - `metadata`: includes `model`, `duration_ms`, `length`, and `input`

Environment
- Set `ANTHROPIC_API_KEY` in your environment (e.g., Vercel Project Settings → Environment Variables).
- Uses `@anthropic-ai/sdk` with model `claude-3-5-sonnet-20241022`.

Example
```
curl -s -X POST http://localhost:3000/api/generate-groepsplan \
  -H "Content-Type: application/json" \
  -d '{"groep":5,"vak":"rekenen","periode":"Q2"}'
```

Testing
- Minimal Jest tests cover method guard and input validation.
```
cd frontend
npm install
npm test
```

## Deployment (Vercel)

- Prereqs: Vercel account + CLI (`npm i -g vercel`) and a Supabase project (optional for storage).
- Env vars (Production + Preview):
  - `ANTHROPIC_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (service role; server-side only)

Steps
- Link project and set root to `frontend/` if the monorepo root is one level up:
  - `vercel login`
  - From repo root: `vercel` → when asked, set “Root Directory” to `frontend`
  - Or from `frontend/`: `vercel`
- Add env vars (via UI or CLI):
  - `vercel env add ANTHROPIC_API_KEY production`
  - `vercel env add NEXT_PUBLIC_SUPABASE_URL production`
  - `vercel env add SUPABASE_SERVICE_KEY production`
  - Repeat for `preview` if needed.
- Deploy:
  - `vercel --prod` (run from `frontend/` or with Root Directory set)

Smoke Tests
- Generate (JSON):
  ```
  curl -s -X POST https://<your-app>.vercel.app/api/generate-groepsplan \
    -H "Content-Type: application/json" \
    -d '{"groep":5,"vak":"rekenen","periode":"Q2"}' | jq
  ```
  - Expect: `success: true`, non-empty `content`, and `metadata.duration_ms` present.

- Export (DOCX):
  ```
  curl -s -X POST https://<your-app>.vercel.app/api/export-word \
    -H "Content-Type: application/json" \
    -d '{"content":"# Titel\n\n- Punt 1\n- Punt 2","metadata":{"groep":5,"vak":"rekenen","periode":"Q2"}}' \
    --output groepsplan.docx
  ```
  - Expect: download starts; file opens in Word with headings/bullets.

Notes
- Serverless time limit is set to 60s for generation; the route soft-fails at ~25s with a hint for mobile users.
- Do not store PII: routes avoid logging request bodies; uploads are processed in temp and deleted after parsing.

### Providers & Rate Limits

- Supports OpenAI and Anthropic:
  - Set `OPENAI_API_KEY` to enable OpenAI (default model `gpt-4o-mini`; override via `OPENAI_MODEL`).
  - Set `ANTHROPIC_API_KEY` to enable Anthropic (`claude-3-5-sonnet-20241022`).
- If both keys are set, the API prefers OpenAI and falls back to Anthropic on recoverable errors (HTTP 429/5xx/timeout).
- On 429, the API sets `Retry-After` and the `/test-generate` page auto-retries using that header.

