/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StepFlowOpp from '@/app/opp/new/components/StepFlow';

let mockParams = new URLSearchParams("");
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (k: string) => mockParams.get(k),
    entries: () => mockParams.entries(),
  }),
}));

describe('OPP StepFlow basics', () => {
  beforeEach(() => { mockParams = new URLSearchParams(""); pushMock.mockReset(); });

  test('shows decision by default', () => {
    render(<StepFlowOpp />);
    expect(screen.getByText(/Nieuw OPP/i)).toBeInTheDocument();
    expect(screen.getByText(/Start vanaf nul/i)).toBeInTheDocument();
  });

  test('scratch path starts at StudentBasics', () => {
    mockParams = new URLSearchParams('flow=scratch');
    render(<StepFlowOpp />);
    expect(screen.getByText(/Voor wie maak je een OPP\?/i)).toBeInTheDocument();
  });
});

