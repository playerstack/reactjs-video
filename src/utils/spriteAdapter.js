/**
 * Web SpriteAdapter for core's `playerstack-sprite-preview` element.
 *
 * Performs the browser I/O the preview needs: fetching the VTT text, measuring each sprite sheet
 * image's natural size (via `new Image()`), and reading the preview container's pixel size. This
 * is the ONLY place that touches `fetch`/`Image`/`offsetWidth`; the frame-selection MATH lives in
 * core (`computeSpriteFrame`).
 *
 * @param {() => HTMLElement | null} getContainer - Returns the preview container element (the
 *   `playerstack-sprite-preview` host), whose pixel size the frame is scaled to cover.
 * @returns {import('@playerstack/core').SpriteAdapter}
 */
export function createWebSpriteAdapter(getContainer) {
  // In-memory cache so re-fetches (e.g., after a layout key-switch remount) resolve instantly
  // without a network round-trip even if the browser cache is cold.
  const vttCache = {};
  const sizeCache = {};

  return {
    fetchVtt: (url) => {
      if (vttCache[url]) return Promise.resolve(vttCache[url]);
      return fetch(url)
        .then((r) => r.text())
        .then((text) => {
          vttCache[url] = text;
          return text;
        });
    },
    loadSheetSizes: (urls) => {
      const uncached = urls.filter((u) => !sizeCache[u]);
      if (uncached.length === 0) {
        const result = {};
        for (const u of urls) result[u] = sizeCache[u];
        return Promise.resolve(result);
      }
      return Promise.all(
        uncached.map(
          (url) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => {
                sizeCache[url] = { w: img.naturalWidth, h: img.naturalHeight };
                resolve();
              };
              img.onerror = resolve;
              img.src = url;
            }),
        ),
      ).then(() => {
        const result = {};
        for (const u of urls) result[u] = sizeCache[u] || { w: 0, h: 0 };
        return result;
      });
    },
    getContainerSize: () => {
      const el = getContainer();
      return { width: el?.offsetWidth ?? 0, height: el?.offsetHeight ?? 0 };
    },
  };
}
