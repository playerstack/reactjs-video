import React from 'react';
import { COMPOSABLE_SLOTS, DEFAULT_COMPOSITION } from '@playerstack/web-core/adapters/framework';
import { PART_NAME } from '@compound/parts/partName';
import { collectConfig } from '@compound/hooks/collectConfig';

/**
 * resolveComposition — pure transformation from `<Player>`'s children to a declarative
 * composition manifest `{ mode, parts, config, order }`.
 *
 * It answers two questions the skin's orchestrator/layouts need: WHICH composable parts the
 * author included (presence, for gating) and WITH WHAT content (config, for parts whose data
 * has no prior prop channel, e.g. `Title`). It is thin/pure per A8b: no timers, no state
 * machines, no non-trivial computation — just a scan of `React.Children`. Using
 * `React.Children`/`React.isValidElement` is the allowed React glue on the skin side; the
 * agnostic catalog it reads (`COMPOSABLE_SLOTS`/`DEFAULT_COMPOSITION`) lives once in
 * `@playerstack/web-core` and is consumed here, never duplicated (A7, Req 11.6/11.7).
 */

/**
 * Names of the container parts, derived from the agnostic catalog — the single source of
 * truth (Req 11.6). This is the design's `CONTAINER_NAMES`: only `Player` and `ControlBar`
 * carry `container: true` (Req 3.7). Deriving the set from `COMPOSABLE_SLOTS` (rather than
 * reading each part function's own `type.container`) keeps the container definition in one
 * place, so a future container added to the catalog is honored here without touching the scan.
 */
const CONTAINER_NAMES = new Set(COMPOSABLE_SLOTS.filter((slot) => slot.container).map((slot) => slot.name));

/**
 * The top level (Player's direct children) is depth 0; a top-level container's direct children
 * are depth 1. We descend from depth 0 into a container exactly once, so registered parts never
 * sit deeper than one level below the top.
 */
const TOP_LEVEL_DEPTH = 0;

export function resolveComposition(children) {
  // Req 7.1: ONLY `children == null` (null OR undefined) yields the default composition — a DX
  // convenience so a bare `<Player url=… />` shows a sensible control set. `DEFAULT_COMPOSITION`
  // is a readonly array from core, so it is copied into a fresh `Set` (the manifest's `parts` is
  // always a Set; callers gate with O(1) `parts.has(name)`).
  //
  // Reconciling Req 5.7 with Req 7.1: Req 5.7 says "null, undefined OR an empty list" ⇒ empty
  // manifest, while Req 7.1 says `children == null` ⇒ DEFAULT_COMPOSITION. These disagree only on
  // the explicitly-empty-array case. We follow the DESIGN, which makes the split unambiguous:
  // ONLY `children == null` takes the default path; anything non-null (including `[]` or an
  // all-invalid list) falls through to the scan below and legitimately produces an EMPTY custom
  // manifest. So an empty array ⇒ `{ mode: 'custom', parts: ∅, order: [], config: {} }`, which
  // still satisfies Req 5.7's "empty" outcome for that input while honoring Req 7.1 for null.
  if (children == null) {
    // Default composition: all default parts belong to the BottomBar container.
    const defaultContainers = { BottomBar: DEFAULT_COMPOSITION.filter((n) => n !== 'BottomBar') };
    return {
      mode: 'default',
      parts: new Set(DEFAULT_COMPOSITION),
      config: {},
      order: [],
      containers: defaultContainers,
    };
  }

  const parts = new Set();
  const order = [];
  const config = {};
  /** Maps container name → array of child part names found inside it. */
  const containers = {};

  /**
   * Walk `nodes` in author order, registering each recognized composable and, from the top
   * level only, descending one level into container parts.
   */
  const visit = (nodes, depth, parentContainer) => {
    React.Children.forEach(nodes, (child) => {
      // Req 5.3: ignore anything that is not a valid React element or does not carry a
      // `PART_NAME` (foreign nodes, plain text, host elements like <div>), and keep scanning
      // the remaining siblings. Reading a missing key off a string `type` (e.g. 'div') is safe
      // and yields `undefined`, so the guard also covers host components.
      if (!React.isValidElement(child)) {
        return;
      }
      const name = child.type && child.type[PART_NAME];
      if (!name) {
        return;
      }

      // Req 5.2/5.5 (Property 4 — no-duplicado): `parts` de-dups by construction (Set); `order`
      // must de-dup too, so append only on first sighting. Later repeats of the same part are
      // dropped from both structures.
      if (!parts.has(name)) {
        order.push(name);
      }
      parts.add(name);

      // Track which container this part belongs to (if any).
      if (parentContainer && !CONTAINER_NAMES.has(name)) {
        if (!containers[parentContainer]) {
          containers[parentContainer] = [];
        }
        if (!containers[parentContainer].includes(name)) {
          containers[parentContainer].push(name);
        }
      }

      // Req 5.6: collect this part's content props into the shared `config` accumulator,
      // normalized to the downstream engine names (e.g. `Title` → `config.title`). Called for
      // every occurrence (not gated by de-dup): de-dup governs presence/order, not config.
      collectConfig(name, child.props, config);

      // Req 5.4 + 5.8: descend EXACTLY ONE level. We recurse only from the top level
      // (`depth === TOP_LEVEL_DEPTH`) into a container's direct children, so a container nested
      // inside another container is registered but NOT descended into — parts more than one
      // level below the top are never registered. The `children != null` guard just avoids a
      // pointless recursion for an empty container like `<BottomBar />`.
      if (depth === TOP_LEVEL_DEPTH && CONTAINER_NAMES.has(name) && child.props.children != null) {
        visit(child.props.children, depth + 1, name);
      }
    });
  };

  visit(children, TOP_LEVEL_DEPTH, null);

  // Req 7.4: any non-null children list is a `custom` composition. Req 7.5: `parts`/`order`/
  // `config` are derived purely from the children scan (or DEFAULT_COMPOSITION when null),
  // never from `mode` — `mode` is informational only and drives no legacy branch (Req 7.6).
  return { mode: 'custom', parts, config, order, containers };
}
