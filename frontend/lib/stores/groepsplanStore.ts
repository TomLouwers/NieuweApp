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

export function setCurrentPath(p: PathKey) { currentPath = p; }
export function getCurrentPath(): PathKey { return currentPath; }
export function setSelectedFileName(name: string | null) { selectedFileName = name; }
export function getSelectedFileName(): string | null { return selectedFileName; }
