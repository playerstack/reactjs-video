import { forwardRef, createElement, useRef, useMemo, useEffect } from 'react';

import { domFrameworkAdapter } from '@playerstack/core/adapters/framework';

import { useDeepCompareMemoize } from '@hooks/useDeepCompareMemoize';
import { buildEventPropMap } from '@adapter/eventPropName';

/**
 * React_Adapter primitive (Req 7, Req 16).
 *
 * `createReactElement(binding)` turns a single `UiElementBinding` from Core's
 * `UI_ELEMENT_BINDINGS` into a thin React component that renders the underlying
 * Custom Element (`binding.tagName`) and wires it up through the shared
 * `domFrameworkAdapter`:
 *
 * - Attributes declared in `binding.attributes` are reflected via `syncAttribute`
 *   (Req 7.2); rich object/array/function props that are not attributes and not
 *   request-event callbacks are assigned via `syncProperty` (Req 7.2).
 * - Each `binding.requestEvents` entry is exposed as a camelCase `on*` callback
 *   prop; the component subscribes once per element/event and reads the latest
 *   consumer callback from a ref, so subscriptions do not churn per render
 *   (Req 7.3, 16.4, 16.5).
 * - Object/array props are stabilized with `useDeepCompareMemoize` before they
 *   feed the sync effects, so effects only re-run on real content changes
 *   (Req 7.5, 16.1).
 * - All DOM mutation happens inside effects; the render body has no side effects
 *   (Req 16.2). The element ref drives the effects so sync runs when the memoized
 *   prop values change (Req 16.3), and every subscription is torn down on cleanup
 *   (Req 16.5).
 *
 * The component is generic and fully driven by the binding, so the per-element
 * React components (tasks 14.3/14.7) can be produced by mapping over
 * `UI_ELEMENT_BINDINGS` without bespoke logic.
 *
 * @param {import('@playerstack/core/adapters/framework').UiElementBinding} binding
 * @returns {React.ForwardRefExoticComponent} A React component for the element.
 */
export function createReactElement(binding) {
  const { tagName, attributes, requestEvents } = binding;

  // Precompute static lookups once per binding (not per render): the set of
  // observed attribute names and the event -> `on*` prop name pairs.
  const attributeSet = new Set(attributes);
  const eventPropMap = buildEventPropMap(requestEvents);
  const eventPropNames = new Set(eventPropMap.map((entry) => entry.propName));

  const ReactElement = forwardRef(function ReactElement(props, forwardedRef) {
    const { children, ...rest } = props;

    // Own ref to the custom element; also forwarded to the consumer's ref.
    const elementRef = useRef(null);

    // Partition incoming props into attributes, properties and event callbacks.
    // Attributes reflect to HTML attributes; everything else that is not an
    // event callback is assigned as a JS property (the channel for rich inputs
    // like `captionsSrc`, `chapters`, `heatmapData`, `config`, `i18n`, ...).
    const attributeProps = {};
    const propertyProps = {};
    const callbackProps = {};

    for (const key of Object.keys(rest)) {
      const value = rest[key];
      if (eventPropNames.has(key)) {
        callbackProps[key] = value;
      } else if (attributeSet.has(key)) {
        attributeProps[key] = value;
      } else {
        propertyProps[key] = value;
      }
    }

    // Stabilize the reference-typed prop maps with a single deep compare per
    // render so the sync effects only re-run when content actually changes
    // (Req 7.5, 16.1, R1). Primitives inside are compared structurally too.
    const stableAttributeProps = useDeepCompareMemoize(attributeProps);
    const stablePropertyProps = useDeepCompareMemoize(propertyProps);

    // Keep the latest consumer callbacks in a ref updated every render, so the
    // subscription effect can read them without being a dependency (Req 16.4, R5).
    const callbacksRef = useRef(callbackProps);
    callbacksRef.current = callbackProps;

    // Reflect declared attributes -> HTML attributes (Req 7.2, 16.3). Runs only
    // when the memoized attribute content changes.
    useEffect(() => {
      const el = elementRef.current;
      if (!el) return;
      for (const name of Object.keys(stableAttributeProps)) {
        const value = stableAttributeProps[name];
        domFrameworkAdapter.syncAttribute(el, name, value ?? null);
      }
    }, [stableAttributeProps]);

    // Assign rich props -> JS properties (Req 7.2, 16.3). Runs only when the
    // memoized property content changes.
    useEffect(() => {
      const el = elementRef.current;
      if (!el) return;
      for (const name of Object.keys(stablePropertyProps)) {
        domFrameworkAdapter.syncProperty(el, name, stablePropertyProps[name]);
      }
    }, [stablePropertyProps]);

    // Subscribe to each request event once per element/event (Req 7.3, 16.5, R5).
    // The handler reads the latest callback from the ref, so consumers passing
    // new callback identities every render never trigger re-subscription.
    useEffect(() => {
      const el = elementRef.current;
      if (!el || eventPropMap.length === 0) return undefined;

      const unsubscribers = eventPropMap.map(({ eventName, propName }) =>
        domFrameworkAdapter.subscribe(el, eventName, (event) => {
          const callback = callbacksRef.current[propName];
          if (callback) callback(event);
        }),
      );

      return () => {
        for (const unsubscribe of unsubscribers) unsubscribe();
      };
      // Subscriptions depend only on the element identity; latest callbacks are
      // read from callbacksRef, so re-subscribing per callback change is neither
      // needed nor desired.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Merge the forwarded ref with our internal ref via a stable callback ref.
    const setRef = useMemo(
      () => (node) => {
        elementRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    // No side effects in render: only produce the element (Req 16.2). Props are
    // synced imperatively in the effects above, so we do not spread them here.
    return createElement(tagName, { ref: setRef }, children);
  });

  ReactElement.displayName = `Playerstack(${tagName})`;

  return ReactElement;
}
