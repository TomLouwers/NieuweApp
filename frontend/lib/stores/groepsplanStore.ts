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
