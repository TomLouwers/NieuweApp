/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SlideContainer from '@/app/groepsplan/new/components/SlideContainer';

describe('SlideContainer', () => {
  test('renders children', () => {
    render(
      <SlideContainer direction="forward">
        <div data-testid="child">Hello</div>
      </SlideContainer>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });
});

