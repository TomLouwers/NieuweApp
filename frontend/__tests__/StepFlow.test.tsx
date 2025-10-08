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

  test('initializing with flow=scratch shows ScratchStep', () => {
    mockParams = new URLSearchParams('flow=scratch');
    render(<StepFlow />);
    expect(screen.getByText(/Stap 1 — Start vanaf nul/i)).toBeInTheDocument();
    // Summary list items should carry --index style
    const items = screen.getAllByRole('listitem');
    expect(items[0].getAttribute('style') || '').toMatch(/--index: 0/);
  });

  test('clicking Volgende from scratch pushes to summary step', () => {
    mockParams = new URLSearchParams('flow=scratch');
    render(<StepFlow />);
    fireEvent.click(screen.getByText(/Volgende/i));
    expect(pushMock).toHaveBeenCalled();
    const url = String(pushMock.mock.calls.at(-1)?.[0] || '');
    expect(url).toMatch(/\/groepsplan\/new\?(.+&)?step=summary/);
  });

  test('backwards change transitions summary -> scratch', async () => {
    mockParams = new URLSearchParams('step=summary');
    const { container, rerender } = render(<StepFlow />);
    expect(await screen.findByText(/Samenvatting/i)).toBeInTheDocument();

    // now change to previous step (scratch) and verify back-enter class appears
    mockParams = new URLSearchParams('step=scratch');
    rerender(<StepFlow />);
    expect(await screen.findByText(/Stap 1 — Start vanaf nul/i)).toBeInTheDocument();
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
