export type PersistDriver = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  keysWithPrefix(prefix: string): Promise<string[]>;
};

export function createBrowserStorage(): PersistDriver {
  if (typeof window === "undefined") {
    return {
      async getItem() { return null; },
      async setItem() {},
      async removeItem() {},
      async keysWithPrefix() { return []; },
    };
  }
  return {
    async getItem(key) { return window.localStorage.getItem(key); },
    async setItem(key, value) { window.localStorage.setItem(key, value); },
    async removeItem(key) { window.localStorage.removeItem(key); },
    async keysWithPrefix(prefix: string) {
      const out: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(prefix)) out.push(k);
      }
      return out;
    }
  };
}

// Draft persistence for trial users
export const DRAFT_PREFIX = 'groepsplan_draft_';
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function saveDraftLocal(data: any, now = Date.now()): Promise<string> {
  const storage = createBrowserStorage();
  const key = `${DRAFT_PREFIX}${now}`;
  const payload = JSON.stringify({ savedAt: now, data });
  await storage.setItem(key, payload);
  // Also set/update pointer to latest
  await storage.setItem(`${DRAFT_PREFIX}latest`, key);
  return key;
}

export async function loadLatestDraftLocal(maxAgeMs = DRAFT_MAX_AGE_MS): Promise<{ key: string; savedAt: number; data: any } | null> {
  const storage = createBrowserStorage();
  const latestKey = await storage.getItem(`${DRAFT_PREFIX}latest`);
  if (latestKey) {
    const raw = await storage.getItem(latestKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.savedAt && Date.now() - parsed.savedAt <= maxAgeMs) {
          return { key: latestKey, savedAt: parsed.savedAt, data: parsed.data };
        }
      } catch {}
    }
  }
  // Fallback: scan
  const keys = await storage.keysWithPrefix(DRAFT_PREFIX);
  const drafts = [] as Array<{ key: string; savedAt: number; data: any }>;
  for (const k of keys) {
    if (k.endsWith('latest')) continue;
    const raw = await storage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      drafts.push({ key: k, savedAt: parsed.savedAt, data: parsed.data });
    } catch {}
  }
  drafts.sort((a,b) => b.savedAt - a.savedAt);
  const best = drafts.find(d => Date.now() - d.savedAt <= maxAgeMs) || null;
  return best || null;
}

export async function clearDraftLocal(key?: string) {
  const storage = createBrowserStorage();
  if (key) {
    await storage.removeItem(key);
    return;
  }
  const keys = await storage.keysWithPrefix(DRAFT_PREFIX);
  for (const k of keys) await storage.removeItem(k);
}
