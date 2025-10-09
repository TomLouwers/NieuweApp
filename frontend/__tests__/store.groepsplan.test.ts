/** @jest-environment node */
import { useGroepsplanStore } from '@/lib/stores/groepsplanStore';

describe('Groepsplan store (reducers skeleton)', () => {
  test('initial state', () => {
    const s = useGroepsplanStore.getState();
    expect(s.currentStep).toBeDefined();
    expect(s.answers).toBeDefined();
    expect(s.upload.status).toBe('idle');
    expect(s.generation.status).toBe('idle');
  });

  test('setGroep and setVakgebied', () => {
    useGroepsplanStore.getState().setGroep(5);
    useGroepsplanStore.getState().setVakgebied('rekenen');
    const { answers } = useGroepsplanStore.getState();
    expect(answers.groep).toBe(5);
    expect(answers.vakgebied).toBe('rekenen');
  });

  test('goToNextStep updates step', () => {
    useGroepsplanStore.getState().goToNextStep('b2');
    expect(useGroepsplanStore.getState().currentStep).toBe('b2');
    useGroepsplanStore.getState().goToPreviousStep('scratch');
    expect(useGroepsplanStore.getState().currentStep).toBe('scratch');
  });
});

