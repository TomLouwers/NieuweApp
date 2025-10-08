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
