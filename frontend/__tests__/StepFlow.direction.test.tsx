/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Control URL params and router
let mockParams = new URLSearchParams("");
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (k: string) => mockParams.get(k),
    entries: () => mockParams.entries(),
  }),
}));

// Mock SlideContainer to expose the computed direction
jest.mock('@/app/groepsplan/new/components/SlideContainer', () => ({
  __esModule: true,
  default: ({ direction, children }: any) => (
    <div data-testid="slide" data-direction={direction}>{children}</div>
  ),
}));

import StepFlow from '@/app/groepsplan/new/components/StepFlow';

describe('StepFlow direction prop', () => {
  beforeEach(() => { mockParams = new URLSearchParams(""); pushMock.mockReset(); });

  test('initial default -> direction forward', () => {
    render(<StepFlow />);
    const slide = screen.getByTestId('slide');
    expect(slide.getAttribute('data-direction')).toBe('forward');
  });

  test('summary -> scratch yields back', () => {
    mockParams = new URLSearchParams('step=summary');
    const { rerender } = render(<StepFlow />);
    expect(screen.getByTestId('slide').getAttribute('data-direction')).toBe('forward');

    mockParams = new URLSearchParams('step=scratch');
    rerender(<StepFlow />);
    expect(screen.getByTestId('slide').getAttribute('data-direction')).toBe('back');
  });

  test('scratch -> summary yields forward', () => {
    mockParams = new URLSearchParams('step=scratch');
    const { rerender } = render(<StepFlow />);
    expect(screen.getByTestId('slide').getAttribute('data-direction')).toBe('forward');

    mockParams = new URLSearchParams('step=summary');
    rerender(<StepFlow />);
    expect(screen.getByTestId('slide').getAttribute('data-direction')).toBe('forward');
  });
});

