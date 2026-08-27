import { createRef } from 'react';
import { render } from '@testing-library/react';

import {
  PlayerstackElements,
  PlayerstackMediaController,
  PlayerstackPlayButton,
  PlayerstackTimeSlider,
  PlayerstackVolume,
} from '@adapter/elements';

describe('adapter/elements', () => {
  test('exports a component map keyed by PascalCase tag names', () => {
    expect(typeof PlayerstackElements).toBe('object');
    expect(PlayerstackElements).toHaveProperty('PlayerstackPlayButton');
    expect(PlayerstackElements).toHaveProperty('PlayerstackMediaController');
    expect(PlayerstackElements).toHaveProperty('PlayerstackTimeSlider');
  });

  test('every entry in the map is a React component (forwardRef object or function)', () => {
    const values = Object.values(PlayerstackElements);
    expect(values.length).toBeGreaterThan(0);
    values.forEach((component) => {
      const isFunction = typeof component === 'function';
      const isForwardRef = typeof component === 'object' && component !== null && '$$typeof' in component;
      expect(isFunction || isForwardRef).toBe(true);
    });
  });

  test('named exports for representative tags are defined components', () => {
    [PlayerstackMediaController, PlayerstackPlayButton, PlayerstackTimeSlider, PlayerstackVolume].forEach(
      (component) => {
        expect(component).toBeDefined();
        const isFunction = typeof component === 'function';
        const isForwardRef = typeof component === 'object' && component !== null && '$$typeof' in component;
        expect(isFunction || isForwardRef).toBe(true);
      },
    );
  });

  test('renders a representative element component to its custom element tag', () => {
    const ref = createRef();
    render(<PlayerstackPlayButton ref={ref} aria-label="Play" />);
    const el = ref.current;
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('playerstack-play-button');
    expect(el.getAttribute('aria-label')).toBe('Play');
  });

  test('named exports reference the same components as the map', () => {
    expect(PlayerstackPlayButton).toBe(PlayerstackElements.PlayerstackPlayButton);
    expect(PlayerstackMediaController).toBe(PlayerstackElements.PlayerstackMediaController);
  });
});
