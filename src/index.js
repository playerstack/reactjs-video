// Public entry point of `@playerstack/reactjs-video` — the composed (compound-components)
// API is the ONLY public surface (requirements 1.1, 2.1). There is intentionally NO
// prop-driven monolithic default export anymore.
//
// - `default` and the named `Player` resolve to the SAME component reference — the composed
//   root at `@compound/Player` (requirements 1.1, 1.2, 2.1, 2.2). This is the idiomatic entry
//   for a compound API's root, not a backward-compat alias.
// - Every composable part is re-exported from the parts barrel, each from its own module so a
//   tree-shaking bundler can drop the parts a consumer does not import (requirements 1.3, 2.1).
// - The old prop-driven monolith is gone: it is exposed neither as default nor as a named
//   export, so accessing any of its former named exports resolves to `undefined` (req 2.3, 2.6).
// - The playback engine factory (`createMediaPlayer` / `Engine`) stays internal at
//   `@root/engine` and is deliberately NOT re-exported here (requirements 2.4, 2.5).
export { default, default as Player } from '@compound/Player';
export * from '@compound/index';
