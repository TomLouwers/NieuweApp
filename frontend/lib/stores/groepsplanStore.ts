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

