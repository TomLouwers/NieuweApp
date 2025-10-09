/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GroupCompositionSlider from '@/app/groepsplan/new/components/GroupCompositionSlider';

describe('GroupCompositionSlider', () => {
  test('renders percentage and count', () => {
    const onChange = jest.fn();
    render(<GroupCompositionSlider label="Basisniveau" value={50} onChange={onChange} total={20} />);
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/10 leerlingen/)).toBeInTheDocument();
  });

  test('calls onChange when range moved', () => {
    const onChange = jest.fn();
    render(<GroupCompositionSlider label="Basisniveau" value={20} onChange={onChange} total={30} />);
    const slider = screen.getByRole('slider', { name: /percentage/i });
    fireEvent.change(slider, { target: { value: '35' } });
    expect(onChange).toHaveBeenCalledWith(35);
  });
});

