/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DecisionPoint from '@/app/groepsplan/new/components/DecisionPoint';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

function getRouterPushMock() { return pushMock; }

describe('DecisionPoint interactions', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = jest.fn();
    getRouterPushMock().mockReset?.();
  });

  test('keyboard activation on scratch card triggers navigation', () => {
    render(<DecisionPoint />);
    const scratch = screen.getByTestId('card-scratch');
    scratch.focus();
    fireEvent.keyDown(scratch, { key: 'Enter' });
    expect(getRouterPushMock()).toHaveBeenCalledWith('/groepsplan/new?flow=scratch');
  });

  test('invalid file extension shows inline error (role="alert")', async () => {
    render(<DecisionPoint />);
    const upload = screen.getByTestId('card-upload');
    const input = upload.parentElement!.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'malware.exe', { type: 'application/octet-stream' });
    // trigger change
    await waitFor(() => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/Ongeldig bestandstype/i);
  });

  test('dropping multiple files warns and uploads first valid file', async () => {
    // mock upload success
    // @ts-ignore
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true, id: 'doc_123' }) });
    render(<DecisionPoint />);
    const upload = screen.getByTestId('card-upload');
    const f1 = new File(['a'], 'file1.pdf', { type: 'application/pdf' });
    const f2 = new File(['b'], 'file2.pdf', { type: 'application/pdf' });
    fireEvent.drop(upload, { dataTransfer: { files: [f1, f2] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(/1 bestand tegelijk/i);
    await waitFor(() => {
      expect(getRouterPushMock()).toHaveBeenCalledWith('/groepsplan/edit/doc_123');
    });
  });

  test('sample card opens and closes modal', async () => {
    render(<DecisionPoint />);
    const sample = screen.getByTestId('card-sample');
    fireEvent.click(sample);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    const close = screen.getByText(/sluiten/i);
    fireEvent.click(close);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
