export type LocalJob = { id: string; createdAt: number; body: any };
const jobs = new Map<string, LocalJob>();
export function setJob(job: LocalJob) { jobs.set(job.id, job); }
export function getJob(id: string) { return jobs.get(id) || null; }
