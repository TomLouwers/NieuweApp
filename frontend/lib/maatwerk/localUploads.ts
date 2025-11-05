export type LocalUpload = {
  id: string;
  createdAt: number;
  fileName?: string;
  stage: 'upload' | 'ocr' | 'analysis' | 'awaiting_validation' | 'generating' | 'completed' | 'failed';
  recognized?: any;
  worksheets?: any[];
};

const uploads = new Map<string, LocalUpload>();

export function setUpload(u: LocalUpload) { uploads.set(u.id, u); }
export function getUpload(id: string) { return uploads.get(id) || null; }
export function updateUpload(id: string, patch: Partial<LocalUpload>) {
  const cur = uploads.get(id);
  if (!cur) return null;
  const next = { ...cur, ...patch } as LocalUpload;
  uploads.set(id, next);
  return next;
}
