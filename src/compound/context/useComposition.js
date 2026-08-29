import React from 'react';
import { CompositionContext } from '@compound/context/CompositionContext';

export function useComposition() {
  const ctx = React.useContext(CompositionContext);
  if (ctx === null) {
    throw new Error('[playerstack] Composable parts must be rendered inside <Player>.');
  }
  return ctx;
}
