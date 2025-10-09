/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressDots from '@/app/groepsplan/new/components/ProgressDots';

describe('ProgressDots', () => {
  test('renders progressbar with correct aria and count', () => {
    render(<ProgressDots total={5} current={3} />);
    const bar = screen.getByRole('progressbar', { name: /Vraag 3 van 5/i });
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
    expect(bar).toHaveAttribute('aria-valuenow', '3');
  });
});
