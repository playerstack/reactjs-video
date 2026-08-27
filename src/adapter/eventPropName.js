/**
 * Pure helpers that translate between the DOM request-event names used by the
 * Core UI_Elements (kebab-case, e.g. `playerstack-play-request`) and the React
 * callback prop names consumers expect (camelCase `on*`, e.g. `onPlayRequest`).
 *
 * Kept pure and colocated with the adapter so the mapping is deterministic and
 * unit-testable in isolation, and so `createReactElement` can drive the whole
 * `on*` prop surface straight from `UI_ELEMENT_BINDINGS` (Req 7.3).
 */

const PLAYERSTACK_PREFIX = 'playerstack-';

/**
 * Converts a request-event name into its React callback prop name.
 *
 * The leading `playerstack-` prefix is dropped (it is redundant on the React
 * side) and the remaining kebab-case segments are PascalCased and prefixed with
 * `on`. Example: `playerstack-play-request` -> `onPlayRequest`.
 *
 * @param {string} eventName - The DOM request-event name.
 * @returns {string} The camelCase `on*` callback prop name.
 */
export function eventNameToPropName(eventName) {
  const withoutPrefix = eventName.startsWith(PLAYERSTACK_PREFIX)
    ? eventName.slice(PLAYERSTACK_PREFIX.length)
    : eventName;

  const pascal = withoutPrefix
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');

  return `on${pascal}`;
}

/**
 * Builds a lookup mapping each request-event name of a binding to its callback
 * prop name. Precomputed once per binding so the subscription effect can resolve
 * consumer callbacks without recomputing string transforms per render.
 *
 * @param {readonly string[]} requestEvents - The binding's request-event names.
 * @returns {Array<{ eventName: string, propName: string }>} Event/prop pairs.
 */
export function buildEventPropMap(requestEvents) {
  return requestEvents.map((eventName) => ({
    eventName,
    propName: eventNameToPropName(eventName),
  }));
}
