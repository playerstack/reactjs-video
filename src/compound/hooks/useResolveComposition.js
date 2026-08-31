import React from 'react';
import {
  COMPOSABLE_SLOTS,
  DEFAULT_COMPOSITION,
  validateSlotPlacement,
  acceptsKeepVisible,
} from '@playerstack/web-core/adapters/framework';
import { PART_NAME } from '@compound/parts/partName';
import { collectConfig } from '@compound/hooks/collectConfig';

/**
 * resolveComposition — pure transformation from `<Player>`'s children to a declarative
 * composition manifest `{ mode, parts, config, order, containers, desktop, mobile }`.
 *
 * It answers two questions the skin's orchestrator/layouts need: WHICH composable parts the
 * author included (presence, for gating) and WITH WHAT content (config, for parts whose data
 * has no prior prop channel, e.g. `Title`). It is thin/pure per A8b: no timers, no state
 * machines, no non-trivial computation — just a scan of `React.Children`. Using
 * `React.Children`/`React.isValidElement` is the allowed React glue on the skin side; the
 * agnostic catalog it reads (`COMPOSABLE_SLOTS`/`DEFAULT_COMPOSITION`) lives once in
 * `@playerstack/web-core` and is consumed here, never duplicated (A7, Req 11.6/11.7).
 *
 * Per-mode composition (Req 15): the author may split desktop and mobile with `<DesktopUI>` and
 * `<MobileUI>` wrappers. When present, each wrapper's subtree is scanned into a DEDICATED branch
 * (`manifest.desktop` / `manifest.mobile`), used ONLY for per-mode PLACEMENT — which container
 * each control sits in. Feature activation (config, presence) still flows to the SHARED `parts`/
 * `config` regardless of which mode branch a part lives in, so `deriveEngineProps`/the engine
 * activate features identically in both modes (Req 15.12).
 */

/**
 * Names of the container parts, derived from the agnostic catalog — the single source of
 * truth (Req 11.6). This now includes `DesktopUI`/`MobileUI`/`CenterControls` automatically
 * (they carry `container: true` in `COMPOSABLE_SLOTS`). Deriving the set from `COMPOSABLE_SLOTS`
 * (rather than reading each part function's own `type.container`) keeps the container definition
 * in one place, so a future container added to the catalog is honored here without touching the
 * scan.
 */
const CONTAINER_NAMES = new Set(COMPOSABLE_SLOTS.filter((slot) => slot.container).map((slot) => slot.name));

/**
 * The per-mode wrappers need SPECIAL handling: instead of the normal one-level descent that
 * flattens into the shared `containers`, each wrapper gets its own nested scan into a dedicated
 * branch object. This set flags them within the shared scan (Req 15.3/15.4).
 */
const MODE_WRAPPER_NAMES = new Set(['DesktopUI', 'MobileUI']);

/**
 * The top level (Player's direct children) is depth 0; a top-level container's direct children
 * are depth 1. We descend from depth 0 into a container exactly once, so registered parts never
 * sit deeper than one level below the top.
 */
const TOP_LEVEL_DEPTH = 0;

/**
 * Enforce the agnostic container-placement rule (Req 16) at RESOLVE time — which runs both when
 * the player renders (run-time) and when a bundler pre-transforms/executes the module graph
 * (build-time). `validateSlotPlacement` (core, single source of truth) decides; a violation
 * throws a descriptive `Error` naming the offending part and its required container. Restricted
 * parts today: `Timeline`/`Chapters`/`Heatmap` → only inside `<BottomBar>`.
 */
const assertPlacement = (partName, containerName) => {
  const { ok, reason } = validateSlotPlacement(partName, containerName);
  if (!ok) {
    throw new Error(`[playerstack] Invalid composition: ${reason}`);
  }
};

/**
 * Scan a mode wrapper's subtree (the children of `<DesktopUI>`/`<MobileUI>`) into a dedicated
 * branch `{ parts, containers, config }`, used ONLY for per-mode placement. This is the "extra"
 * descent scoped to mode wrappers: the wrapper's direct children are its containers
 * (`TopBar`/`BottomBar`/`SidebarLeft`/`SidebarRight`/`CenterControls`), and we descend ONE more
 * level into each to record `branch.containers[containerName] = [childPartNames]`.
 *
 * Every leaf part found also feeds the SHARED `parts`/`config` (passed in) so feature activation
 * reaches the engine no matter which mode branch a part is in (Req 15.12). Pure: mutates only the
 * accumulators it is handed.
 */
const scanModeBranch = (wrapperChildren, branch, sharedParts, sharedConfig, keepVisibleParts) => {
  React.Children.forEach(wrapperChildren, (containerChild) => {
    if (!React.isValidElement(containerChild)) {
      return;
    }
    const containerName = containerChild.type && containerChild.type[PART_NAME];
    if (!containerName) {
      return;
    }

    // A control placed directly under the wrapper (not inside a container) has no placement
    // container, so a restricted part here (e.g. `<Timeline>` straight under `<DesktopUI>`) is
    // invalid — validate it against `null` (Req 16). Container markers themselves are unrestricted.
    assertPlacement(containerName, null);

    // A control placed directly under the wrapper (not inside a container) still activates its
    // feature via the shared accumulators, but has no placement container to record.
    branch.parts.add(containerName);
    sharedParts.add(containerName);
    collectConfig(containerName, containerChild.props, sharedConfig);
    collectConfig(containerName, containerChild.props, branch.config);

    // Descend one level into a container to populate its placement list. Mode wrappers may not
    // nest inside a mode wrapper, so containers here are the visual containers only.
    if (
      CONTAINER_NAMES.has(containerName) &&
      !MODE_WRAPPER_NAMES.has(containerName) &&
      containerChild.props.children != null
    ) {
      // Collect presentational props from the container (e.g. align for sidebars).
      if (containerChild.props.align != null) {
        if (!branch.containerProps[containerName]) branch.containerProps[containerName] = {};
        branch.containerProps[containerName].align = containerChild.props.align;
      }
      // Req 17: `keepVisible` on a container inside a mode wrapper keeps that container's subtree
      // visible in that mode.
      if (containerChild.props.keepVisible) {
        if (!branch.containerProps[containerName]) branch.containerProps[containerName] = {};
        branch.containerProps[containerName].keepVisible = true;
      }
      React.Children.forEach(containerChild.props.children, (leaf) => {
        if (!React.isValidElement(leaf)) {
          return;
        }
        const leafName = leaf.type && leaf.type[PART_NAME];
        if (!leafName) {
          return;
        }
        // Req 16: a restricted leaf must sit in an allowed container even inside a mode wrapper
        // (e.g. `<Timeline>` inside `<MobileUI><TopBar>` is invalid; inside `<MobileUI><BottomBar>`
        // is fine).
        assertPlacement(leafName, containerName);
        // Record placement: which container this control belongs to in this mode.
        if (!branch.containers[containerName]) {
          branch.containers[containerName] = [];
        }
        if (!branch.containers[containerName].includes(leafName)) {
          branch.containers[containerName].push(leafName);
        }
        // Presence + config flow to BOTH the branch (placement) and the shared accumulators
        // (feature activation), so e.g. a `<Title>` inside a mode wrapper still activates.
        branch.parts.add(leafName);
        sharedParts.add(leafName);
        // Req 17: a `keepVisible` leaf inside a mode wrapper opts itself out of auto-hide — but
        // only parts that ACCEPT keepVisible. Timeline riders (`Chapters`/`Heatmap`) ride the
        // Timeline slider and follow its keep-visible, so a `keepVisible` on them is inert; core's
        // `acceptsKeepVisible` is the single source of truth for that rule (A6/A7).
        if (leaf.props.keepVisible && acceptsKeepVisible(leafName)) {
          keepVisibleParts.add(leafName);
        }
        collectConfig(leafName, leaf.props, sharedConfig);
        collectConfig(leafName, leaf.props, branch.config);
      });
    }
  });
};

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
    // Default composition: all default parts belong to the BottomBar container. No mode wrappers,
    // so `desktop`/`mobile` are null and each layout uses its default positions (Req 15.5).
    const defaultContainers = { BottomBar: DEFAULT_COMPOSITION.filter((n) => n !== 'BottomBar') };
    return {
      mode: 'default',
      parts: new Set(DEFAULT_COMPOSITION),
      // No mode wrappers in the default composition: every default part lives at the shared level,
      // so `sharedParts` mirrors `parts`. Each layout renders all of them (Req 15.5/15.11).
      sharedParts: new Set(DEFAULT_COMPOSITION),
      // No `keepVisible` opt-outs in the default composition (auto-hide behaves as before, Req 17).
      keepVisibleParts: new Set(),
      config: {},
      order: [],
      containers: defaultContainers,
      containerProps: {},
      desktop: null,
      mobile: null,
    };
  }

  const parts = new Set();
  // Parts explicitly marked `keepVisible` — they must stay on-screen when auto-hide fades the
  // chrome (Req 17). Leaf parts land here; containers carry the flag on `containerProps` instead
  // (so a whole container/subtree can opt out). The layout reflects this to `data-keep-visible`.
  const keepVisibleParts = new Set();
  // Parts scanned at the SHARED level — i.e. OUTSIDE any `<DesktopUI>`/`<MobileUI>` wrapper. These
  // must render in BOTH modes (Req 15.11): a control placed in the shared zone belongs to desktop
  // AND mobile. Parts found ONLY inside a mode wrapper are recorded in that branch (`desktop`/
  // `mobile`) and NOT here, so they stay exclusive to their mode.
  const sharedParts = new Set();
  const order = [];
  const config = {};
  /** Maps container name → array of child part names found inside it (SHARED, no mode wrapper). */
  const containers = {};
  /** Maps container name → object of presentational props on the container (e.g. { align }). */
  const containerProps = {};
  // Per-mode branches — stay `null` unless a `<DesktopUI>`/`<MobileUI>` wrapper is found (Req
  // 15.3/15.4). When populated, each holds `{ parts, containers, config }` for per-mode placement.
  let desktop = null;
  let mobile = null;

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

      // Req 16: reject a container-restricted part placed in the wrong spot. In the shared scan the
      // part's container is `parentContainer` (null at the top level). A mode wrapper is handled in
      // its own branch below, so restricted parts there are validated by `scanModeBranch`.
      assertPlacement(name, parentContainer);

      // Req 15.3/15.4: a mode wrapper at the top level gets a DEDICATED nested scan into its own
      // branch, NOT the normal shared-container flatten. The wrapper itself is NOT added to the
      // shared `parts`/`order`/`containers` (it is a mode selector, not a visual container).
      if (depth === TOP_LEVEL_DEPTH && MODE_WRAPPER_NAMES.has(name)) {
        const branch = {
          parts: new Set(),
          containers: {},
          containerProps: {},
          config: {},
          // Req 17: `keepVisible` on the mode wrapper itself keeps the ENTIRE mode's chrome on
          // screen (that layout ignores auto-hide). Container/leaf-level flags still apply below.
          keepVisible: child.props.keepVisible === true,
        };
        if (child.props.children != null) {
          scanModeBranch(child.props.children, branch, parts, config, keepVisibleParts);
        }
        if (name === 'DesktopUI') {
          desktop = branch;
        } else {
          mobile = branch;
        }
        return;
      }

      // Req 5.2/5.5 (Property 4 — no-duplicado): `parts` de-dups by construction (Set); `order`
      // must de-dup too, so append only on first sighting. Later repeats of the same part are
      // dropped from both structures.
      if (!parts.has(name)) {
        order.push(name);
      }
      parts.add(name);
      // This node was reached through the NORMAL (non-mode-wrapper) scan, so it lives at the
      // shared level and must appear in both modes (Req 15.11).
      sharedParts.add(name);

      // Req 17: a `keepVisible` LEAF part opts itself out of auto-hide. (Containers collect the
      // flag on `containerProps` below so a whole subtree can opt out.) Timeline riders
      // (`Chapters`/`Heatmap`) are excluded: they ride the `Timeline` slider (no element of their
      // own), so their visibility follows the Timeline's keep-visible and an independent
      // `keepVisible` is inert. Core's `acceptsKeepVisible` is the single source of truth (A6/A7).
      if (child.props.keepVisible && !CONTAINER_NAMES.has(name) && acceptsKeepVisible(name)) {
        keepVisibleParts.add(name);
      }

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
        // Collect presentational props (e.g. `align`) from the container marker element so the
        // layout can use them for positioning (flex alignment). Only non-children props that are
        // not `undefined` are stored.
        if (child.props.align != null) {
          if (!containerProps[name]) containerProps[name] = {};
          containerProps[name].align = child.props.align;
        }
        // Req 17: `keepVisible` on a container keeps the WHOLE container (its subtree) on screen
        // when auto-hide runs. Stored on `containerProps` next to `align`.
        if (child.props.keepVisible) {
          if (!containerProps[name]) containerProps[name] = {};
          containerProps[name].keepVisible = true;
        }
        visit(child.props.children, depth + 1, name);
      }
    });
  };

  visit(children, TOP_LEVEL_DEPTH, null);

  // Req 7.4: any non-null children list is a `custom` composition. Req 7.5: `parts`/`order`/
  // `config` are derived purely from the children scan (or DEFAULT_COMPOSITION when null),
  // never from `mode` — `mode` is informational only and drives no legacy branch (Req 7.6).
  return {
    mode: 'custom',
    parts,
    sharedParts,
    keepVisibleParts,
    config,
    order,
    containers,
    containerProps,
    desktop,
    mobile,
  };
}
