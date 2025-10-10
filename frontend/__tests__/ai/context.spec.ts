import { challengeKeys, getChallengeGuidance } from '@/src/ai/context/challenges';
import { vakgebiedGroepExpectations, getExpectations } from '@/src/ai/context/expectations';
import { startingPointDescriptions, getStartingPointDescription } from '@/src/ai/context/startingPoint';

describe('Context maps', () => {
  it('all challenge keys present and non-empty', () => {
    for (const k of challengeKeys) {
      const txt = getChallengeGuidance(k);
      expect(typeof txt).toBe('string');
      expect(txt.length).toBeGreaterThan(50);
    }
  });
  it('expectations exist for spelling groep 5', () => {
    expect(getExpectations('spelling', 5)).toContain('werkwoordspelling');
  });
  it('starting point descriptions exist', () => {
    expect(getStartingPointDescription('begin')).toMatch(/begin van het schooljaar/i);
  });
});

