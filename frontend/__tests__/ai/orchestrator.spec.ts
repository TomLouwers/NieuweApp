import * as orch from '@/src/ai/generate/orchestrator';

describe('Orchestrator detectors', () => {
  it('detects incomplete', () => {
    const t = '# 6. Evaluatie en Vervolg\nOnvolledige zin zonder punt';
    expect(orch.isIncomplete(t)).toBe(true);
  });
  it('detects wrong language', () => {
    const t = 'the students will learn and the goals are...';
    expect(orch.isWrongLanguage(t)).toBe(true);
  });
});

