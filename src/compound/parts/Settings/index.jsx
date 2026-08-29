import { PART_NAME } from '@compound/parts/partName';

/**
 * Settings marker -> `playerstack-settings` (speed + quality + captions).
 * Declarative marker: returns null, no DOM, no state, no effects (A8b).
 */
export function Settings() {
  return null;
}

Settings[PART_NAME] = 'Settings';
Settings.displayName = 'Settings';
Settings.propTypes = {};
