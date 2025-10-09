export type GroepsplanDoc = {
  id: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
};

// Placeholder in-memory store for scaffold
const seed: GroepsplanDoc[] = [
  // intentionally start empty
];

export async function getRecentDocuments(): Promise<GroepsplanDoc[]> {
  return seed.slice(0, 5);
}

export async function addDocument(d: GroepsplanDoc): Promise<void> {
  seed.unshift(d);
}

// Simple UI state store (in-memory) for current path and selection context
type PathKey = 'upload' | 'scratch' | null;
let currentPath: PathKey = null;
let selectedFileName: string | null = null;
let selectedChallenge: string | null = null;
let selectedGroep: number | null = null;
let selectedVak: string | null = null;
let summaryPeriode: string | null = null;
let summaryAantalLeerlingen: string | null = null; // keep as string for easy input handling
let summaryGroepsindeling: string | null = null; // 'basis' | 'intensief' | 'meer'
// Path B specific
let bTotalStudents: number = 28;
let bPercBasis: number = 70;
let bPercSupport: number = 15;
let bPercMore: number = 15;
let bUnknown: boolean = false;
let bStartPoint: string | null = null; // 'begin' | 'midden' | 'toets'
let bLevelBasis: string | null = null; // 'A'..'F'
let bLevelIntensief: string | null = null; // 'A'..'F'

export function setCurrentPath(p: PathKey) { currentPath = p; }
export function getCurrentPath(): PathKey { return currentPath; }
export function setSelectedFileName(name: string | null) { selectedFileName = name; }
export function getSelectedFileName(): string | null { return selectedFileName; }
export function setSelectedChallenge(val: string | null) { selectedChallenge = val; }
export function getSelectedChallenge(): string | null { return selectedChallenge; }

export function setSelectedGroep(val: number | null) { selectedGroep = val; }
export function getSelectedGroep(): number | null { return selectedGroep; }
export function setSelectedVak(val: string | null) { selectedVak = val; }
export function getSelectedVak(): string | null { return selectedVak; }

export function setSummaryPeriode(val: string | null) { summaryPeriode = val; }
export function getSummaryPeriode(): string | null { return summaryPeriode; }
export function setSummaryAantalLeerlingen(val: string | null) { summaryAantalLeerlingen = val; }
export function getSummaryAantalLeerlingen(): string | null { return summaryAantalLeerlingen; }
export function setSummaryGroepsindeling(val: string | null) { summaryGroepsindeling = val; }
export function getSummaryGroepsindeling(): string | null { return summaryGroepsindeling; }

// Path B getters/setters
export function getBTotalStudents(): number { return bTotalStudents; }
export function setBTotalStudents(n: number) { bTotalStudents = Math.min(35, Math.max(15, Math.round(n))); }
export function getBComposition(): { basis: number; support: number; more: number } { return { basis: bPercBasis, support: bPercSupport, more: bPercMore }; }
export function setBComposition(next: { basis: number; support: number; more: number }) {
  const sum = Math.round(next.basis) + Math.round(next.support) + Math.round(next.more);
  if (sum !== 100) {
    // normalize rudimentarily; trust caller to ensure sum=100
  }
  bPercBasis = Math.round(next.basis);
  bPercSupport = Math.round(next.support);
  bPercMore = Math.round(next.more);
}
export function getBUnknown(): boolean { return bUnknown; }
export function setBUnknown(v: boolean) { bUnknown = v; }
export function getBStartPoint(): string | null { return bStartPoint; }
export function setBStartPoint(v: string | null) { bStartPoint = v; }
export function getBLevelBasis(): string | null { return bLevelBasis; }
export function setBLevelBasis(v: string | null) { bLevelBasis = v; }
export function getBLevelIntensief(): string | null { return bLevelIntensief; }
export function setBLevelIntensief(v: string | null) { bLevelIntensief = v; }

// Zustand store for new unified state & actions
import { create } from 'zustand';
import { saveDraftLocal, loadLatestDraftLocal, clearDraftLocal } from '../utils/persistence';

// Internal debounce timer for autosaving answers
let __draftSaveTimer: any = null;
function scheduleDraftSave(cb: () => Promise<void>, delay = 500) {
  if (__draftSaveTimer) clearTimeout(__draftSaveTimer);
  __draftSaveTimer = setTimeout(() => {
    cb().catch(() => {});
  }, delay);
}

type Path = 'A' | 'B' | null;
type Answers = {
  groep: number | null;
  vakgebied: string | null;
  challenge: string | null;
  composition: { total: number; basis: number; support: number; more: number; unknown: boolean };
  start: { point: string | null; basisLevel: string | null; intensiefLevel: string | null };
  summary: { periode: string | null; aantalLeerlingen: string | null; groepsindeling: string | null };
};

type UploadState = { status: 'idle'|'uploading'|'done'|'error'; id?: string|null; filename?: string; size?: number; mime?: string; storagePath?: string };
type GenerationState = { status: 'idle'|'loading'|'done'|'error'; content?: string; model?: string; id?: string|null };
type ErrorState = { code?: string; message?: string; recovery?: string } | null;

type StoreState = {
  currentStep: string; // e.g., 'decision', 'a2', 'b1', numeric mapping elsewhere
  path: Path;
  answers: Answers;
  upload: UploadState;
  generation: GenerationState;
  error: ErrorState;
  lastSavedAt: number | null;
  // actions
  goToNextStep: (next: string) => void;
  goToPreviousStep: (prev: string) => void;
  setGroep: (n: number) => void;
  setVakgebied: (v: string) => void;
  setChallenge: (v: string) => void;
  updateGroepsindeling: (partial: Partial<Answers['composition']>) => void;
  uploadFile: (file: File) => Promise<void>;
  generateGroepsplan: (body?: { groep?: number; vak?: string; periode?: string }) => Promise<void>;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<boolean>;
  clearDraft: () => Promise<void>;
};

const initialState: Omit<StoreState, 'goToNextStep'|'goToPreviousStep'|'setGroep'|'setVakgebied'|'setChallenge'|'updateGroepsindeling'|'uploadFile'|'generateGroepsplan'|'saveDraft'|'loadDraft'|'clearDraft'> = {
  currentStep: 'decision',
  path: null,
  answers: {
    groep: null,
    vakgebied: null,
    challenge: null,
    composition: { total: 28, basis: 70, support: 15, more: 15, unknown: false },
    start: { point: null, basisLevel: null, intensiefLevel: null },
    summary: { periode: null, aantalLeerlingen: null, groepsindeling: null },
  },
  upload: { status: 'idle', id: null },
  generation: { status: 'idle', id: null },
  error: null,
  lastSavedAt: null,
};

export const useGroepsplanStore = create<StoreState>((set, get) => ({
  ...initialState,
  goToNextStep: (next) => { set({ currentStep: next }); get().saveDraft().catch(() => {}); },
  goToPreviousStep: (prev) => { set({ currentStep: prev }); get().saveDraft().catch(() => {}); },
  setGroep: (n) => { set((s) => ({ answers: { ...s.answers, groep: n } })); scheduleDraftSave(() => get().saveDraft()); },
  setVakgebied: (v) => { set((s) => ({ answers: { ...s.answers, vakgebied: v } })); scheduleDraftSave(() => get().saveDraft()); },
  setChallenge: (v) => { set((s) => ({ answers: { ...s.answers, challenge: v } })); scheduleDraftSave(() => get().saveDraft()); },
  updateGroepsindeling: (partial) => { set((s) => ({ answers: { ...s.answers, composition: { ...s.answers.composition, ...partial } } })); scheduleDraftSave(() => get().saveDraft()); },
  uploadFile: async (file: File) => {
    set({ upload: { status: 'uploading' } });
    const fd = new FormData(); fd.append('file', file);
    try {
      const resp = await fetch('/api/groepsplan/upload', { method: 'POST', body: fd });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.ok) throw new Error(String(json?.error || 'Upload mislukt'));
      set({ upload: { status: 'done', id: json.id || null, filename: json.filename, size: json.size, mime: json.mime, storagePath: json.storagePath } });
    } catch (e: any) {
      set({ upload: { status: 'error' }, error: { message: e?.message || 'Upload mislukt' } });
    }
  },
  generateGroepsplan: async (body) => {
    const s = get();
    const groep = body?.groep ?? s.answers.groep ?? undefined;
    const vak = body?.vak ?? s.answers.vakgebied ?? undefined;
    const periode = body?.periode ?? s.answers.summary.periode ?? undefined;
    if (!groep || !vak || !periode) return;
    set({ generation: { status: 'loading', id: null }, error: null });
    try {
      const resp = await fetch('/api/groepsplan/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ groep, vak, periode }) });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) throw new Error(String(json?.metadata?.error || 'Genereren mislukt'));
      set({ generation: { status: 'done', id: json?.metadata?.storage?.id || null, content: json.content, model: json?.metadata?.model || null } });
    } catch (e: any) {
      set({ generation: { status: 'error' }, error: { message: e?.message || 'Genereren mislukt' } });
    }
  },
  saveDraft: async () => {
    const { currentStep, path, answers, upload, generation } = get();
    const data = { currentStep, path, answers, upload, generation, timestamp: Date.now() };
    const key = await saveDraftLocal(data).catch(() => null as any);
    set({ lastSavedAt: Date.now() });
    return;
  },
  loadDraft: async () => {
    const draft = await loadLatestDraftLocal().catch(() => null);
    if (!draft) return false;
    const d = draft.data || {};
    set({ currentStep: d.currentStep || 'decision', path: d.path ?? null, answers: d.answers || initialState.answers, upload: d.upload || initialState.upload, generation: d.generation || initialState.generation });
    return true;
  },
  clearDraft: async () => { await clearDraftLocal(); set({ ...initialState }); },
}));
