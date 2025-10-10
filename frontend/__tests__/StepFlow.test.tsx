/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, rerender as rtlRerender } from '@testing-library/react';
import StepFlow from '@/app/groepsplan/new/components/StepFlow';

// Mock next/navigation with controllable search params
let mockParams = new URLSearchParams("");
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (k: string) => mockParams.get(k),
    entries: () => mockParams.entries(),
  }),
}));

describe('StepFlow transitions', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams("");
    pushMock.mockReset();
  });

  test('renders DecisionPoint by default (no params)', () => {
    render(<StepFlow />);
    expect(screen.getByText(/Kies een startpunt/i)).toBeInTheDocument();
  });

  test('initializing with flow=scratch shows B1 (Groep/Vak)', () => {
    mockParams = new URLSearchParams('flow=scratch');
    render(<StepFlow />);
    expect(screen.getByText(/Voor welke groep\?/i)).toBeInTheDocument();
  });

  test('clicking Volgende from scratch pushes to B2', () => {
    mockParams = new URLSearchParams('flow=scratch');
    render(<StepFlow />);
    // preselect groep and vak for Path B
    fireEvent.click(screen.getByText(/^1$/));
    fireEvent.click(screen.getByText(/Rekenen/i));
    fireEvent.click(screen.getByText(/Volgende/i));
    expect(pushMock).toHaveBeenCalled();
    const url = String(pushMock.mock.calls.at(-1)?.[0] || '');
    expect(url).toMatch(/\/groepsplan\/new\?(.+&)?step=b2/);
  });

  test('backwards change transitions summary -> scratch', async () => {
    mockParams = new URLSearchParams('step=summary');
    const { container, rerender } = render(<StepFlow />);
    expect(await screen.findByText(/Samenvatting/i)).toBeInTheDocument();

    // now change to previous step (scratch)
    mockParams = new URLSearchParams('step=scratch');
    rerender(<StepFlow />);
    expect(await screen.findByText(/Voor welke groep\?/i)).toBeInTheDocument();
  });

  test('from summary clicking Terug pushes to scratch', () => {
    mockParams = new URLSearchParams('step=summary');
    render(<StepFlow />);
    fireEvent.click(screen.getByText(/Terug/i));
    expect(pushMock).toHaveBeenCalled();
    const url = String(pushMock.mock.calls.at(-1)?.[0] || '');
    expect(url).toMatch(/\/groepsplan\/new\?(.+&)?step=scratch/);
  });
});




