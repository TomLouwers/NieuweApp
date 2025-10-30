import { create } from 'zustand';
import { saveOppDraftLocal, loadLatestOppDraftLocal, clearOppDraftLocal } from '@/lib/utils/persistence-opp';

export type OppPath = 'upload' | 'scratch' | null;
export type OppStep =
  | 'decision'
  | 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8'
  | 'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8'
  | 'summary' | 'result';

export type CurrentLevels = {
  technischLezen?: string;
  spelling?: string;
  rekenen?: string;
  begrijpendLezen?: string;
  sociaalEmotioneel?: string;
  beschrijving_gedrag?: string;
};

export type Uitstroomprofiel = { type: string; rationale?: string };

export type OppAnswers = {
  studentName: string | null;
  age: number | null;
  groep: number | null;
  gender: 'jongen' | 'meisje' | 'anders' | null;
  reasonForOpp: string | null;
  currentLevels: CurrentLevels;
  uitstroomprofiel: Uitstroomprofiel | null;
  externalSupport: string[];
  parentInvolvement: string | null;
  additionalContext: string | null;
  teacherFocusArea: string | null;
  changesSinceLast: string | null; // for upload path
  uploadedText: string | null;
};

export type OppStore = {
  currentStep: OppStep;
  path: OppPath;
  answers: OppAnswers;
  upload: { status: 'idle' | 'uploading' | 'done' | 'error'; filename?: string; warnings?: string[]; text?: string };
  generation: { status: 'idle' | 'loading' | 'done' | 'error'; content?: string };
  error: { message: string } | null;
  lastSavedAt: number | null;
  // navigation & actions
  setPath: (p: OppPath) => void;
  setStep: (s: OppStep) => void;
  updateAnswers: (partial: Partial<OppAnswers>) => void;
  uploadDocument: (file: File) => Promise<void>;
  generateOpp: () => Promise<void>;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<boolean>;
  clearDraft: () => Promise<void>;
};

const initialAnswers: OppAnswers = {
  studentName: null,
  age: null,
  groep: null,
  gender: null,
  reasonForOpp: null,
  currentLevels: {},
  uitstroomprofiel: null,
  externalSupport: [],
  parentInvolvement: null,
  additionalContext: null,
  teacherFocusArea: null,
  changesSinceLast: null,
  uploadedText: null,
};

export const useOppStore = create<OppStore>((set, get) => ({
  currentStep: 'decision',
  path: null,
  answers: initialAnswers,
  upload: { status: 'idle' },
  generation: { status: 'idle' },
  error: null,
  lastSavedAt: null,
  setPath: (p) => set({ path: p }),
  setStep: (s) => set({ currentStep: s }),
  updateAnswers: (partial) => set((st) => ({ answers: { ...st.answers, ...partial } })),
  uploadDocument: async (file: File) => {
    set({ upload: { status: 'uploading' } });
    const fd = new FormData();
    fd.append('document', file);
    try {
      const resp = await fetch('/api/upload-document', { method: 'POST', body: fd });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) throw new Error(String(json?.error || 'Upload mislukt'));
      set((st) => ({
        upload: { status: 'done', filename: json.filename, warnings: json.warnings || [], text: json.text },
        answers: { ...st.answers, uploadedText: json.text || null },
      }));
    } catch (e: any) {
      set({ upload: { status: 'error' }, error: { message: e?.message || 'Upload mislukt' } });
    }
  },
  generateOpp: async () => {
    const { answers } = get();
    if (!answers.studentName || !answers.age || !answers.groep || !answers.gender) {
      set({ error: { message: 'Vul naam, leeftijd, groep en geslacht in.' } });
      return;
    }
    set({ generation: { status: 'loading' }, error: null });
    try {
      const resp = await fetch('/api/opp/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.success) throw new Error(String(json?.metadata?.error || 'Genereren mislukt'));
      set({ generation: { status: 'done', content: json.content } });
    } catch (e: any) {
      set({ generation: { status: 'error' }, error: { message: e?.message || 'Genereren mislukt' } });
    }
  },
  saveDraft: async () => {
    const { currentStep, path, answers, upload, generation } = get();
    const data = { currentStep, path, answers, upload, generation, timestamp: Date.now() };
    await saveOppDraftLocal(data).catch(() => {});
    set({ lastSavedAt: Date.now() });
  },
  loadDraft: async () => {
    const d = await loadLatestOppDraftLocal().catch(() => null);
    if (!d) return false;
    const data = d.data || {};
    set({
      currentStep: data.currentStep || 'decision',
      path: data.path ?? null,
      answers: data.answers || initialAnswers,
      upload: data.upload || { status: 'idle' },
      generation: data.generation || { status: 'idle' },
    });
    return true;
  },
  clearDraft: async () => {
    await clearOppDraftLocal();
    set({ currentStep: 'decision', path: null, answers: initialAnswers, upload: { status: 'idle' }, generation: { status: 'idle' }, error: null });
  },
}));

