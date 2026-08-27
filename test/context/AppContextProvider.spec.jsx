import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider, Context } from '@context/index';
import { en, es } from '@playerstack/core';

const TestConsumer = () => {
  const { state } = React.useContext(Context);
  return (
    <div>
      <span data-testid="play-label">{state.i18n?.play}</span>
      <span data-testid="hiding">{String(state.hiding)}</span>
    </div>
  );
};

describe('Provider', () => {
  test('provides English i18n by default', () => {
    render(
      <Provider language="en">
        <TestConsumer />
      </Provider>,
    );
    expect(screen.getByTestId('play-label').textContent).toBe(en.play);
  });

  test('provides Spanish i18n when language is es', () => {
    render(
      <Provider language="es">
        <TestConsumer />
      </Provider>,
    );
    expect(screen.getByTestId('play-label').textContent).toBe(es.play);
  });

  test('provides initial hiding state as true', () => {
    render(
      <Provider language="en">
        <TestConsumer />
      </Provider>,
    );
    expect(screen.getByTestId('hiding').textContent).toBe('true');
  });

  test('renders children', () => {
    render(
      <Provider language="en">
        <div data-testid="child">child content</div>
      </Provider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
