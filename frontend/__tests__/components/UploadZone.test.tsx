/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock router for navigation assertions
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import DecisionPoint from '@/app/groepsplan/new/components/DecisionPoint';

describe('Upload Zone (DecisionPoint upload card)', () => {
  beforeEach(() => { jest.useFakeTimers(); (global as any).fetch = undefined; pushMock.mockReset(); });
  afterEach(() => { jest.useRealTimers(); (global as any).fetch = undefined; });

  test('invalid extension shows alert', () => {
    render(<DecisionPoint />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bad = new File(["foo"], "notes.txt", { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [bad] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/Ongeldig bestandstype/i);
  });

  test.skip('happy path: upload success navigates to a2', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true, id: 'doc_1', filename: 'groep5.pdf' }) });
    render(<DecisionPoint />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const good = new File(["pdf"], "groep5.pdf", { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [good] } });
    // Wait for overlay and internal timers to resolve
    await act(async () => { jest.advanceTimersByTime(500); });
    // It should eventually route to a2
    expect(pushMock).toHaveBeenCalledWith('/groepsplan/new?step=a2');
  });

  test('network rejection shows error panel', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('failed to fetch'));
    render(<DecisionPoint />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const good = new File(["pdf"], "groep5.pdf", { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [good] } });
    await act(async () => { jest.advanceTimersByTime(0); });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
