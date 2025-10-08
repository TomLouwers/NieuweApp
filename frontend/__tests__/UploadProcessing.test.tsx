/** @jest-environment jsdom */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import UploadProcessing from '@/app/groepsplan/new/path-a/UploadProcessing';

describe('UploadProcessing', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  test('progress increments, stalls < 100 until resolve, then completes and calls onDone', async () => {
    const onDone = jest.fn();
    const promise = new Promise((resolve) => setTimeout(() => resolve({ id: 'doc_42' }), 2000));
    render(
      <UploadProcessing
        start={() => promise as any}
        onDone={onDone}
        onRetry={() => {}}
        onStartFromScratch={() => {}}
      />
    );

    // initial
    expect(screen.getByRole('status')).toHaveTextContent(/Bestand uploaden|Document analyseren|Informatie ophalen/);

    // advance 1500ms -> should be < 100
    await act(async () => { jest.advanceTimersByTime(1500); });
    const bar = screen.getByRole('progressbar');
    const now1 = Number(bar.getAttribute('aria-valuenow'));
    expect(now1).toBeGreaterThan(0);
    expect(now1).toBeLessThan(100);

    // finish promise (advance to 2s) and buffer 400ms for onDone delay
    await act(async () => { jest.advanceTimersByTime(1000 + 400); });
    const now2 = Number(bar.getAttribute('aria-valuenow'));
    expect(now2).toBe(100);
    await act(async () => { jest.runOnlyPendingTimers(); });
    expect(onDone).toHaveBeenCalled();
  });

  test('shows long-hint after 30s', async () => {
    render(
      <UploadProcessing
        start={() => new Promise(() => {})}
        onDone={() => {}}
        onRetry={() => {}}
        onStartFromScratch={() => {}}
      />
    );
    expect(screen.queryByText(/Dit duurt iets langer/i)).toBeNull();
    await act(async () => { jest.advanceTimersByTime(30000); });
    expect(screen.getByText(/Dit duurt iets langer/i)).toBeInTheDocument();
  });

  test('error template on rejection and buttons work', async () => {
    const onRetry = jest.fn();
    const onStart = jest.fn();
    render(
      <UploadProcessing
        start={() => Promise.reject(new Error('bad'))}
        onDone={() => {}}
        onRetry={onRetry}
        onStartFromScratch={onStart}
      />
    );
    // allow promise rejection
    await act(async () => { jest.advanceTimersByTime(0); });
    expect(screen.getByRole('alert')).toHaveTextContent(/kan ik niet lezen/i);
    fireEvent.click(screen.getByText(/Probeer opnieuw/i));
    expect(onRetry).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Start toch vanaf nul/i));
    expect(onStart).toHaveBeenCalled();
  });
});
