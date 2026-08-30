// Public barrel for the compound API's composable parts.
//
// Each composable is re-exported from its OWN module so a tree-shaking bundler can drop
// any part the consumer does not import (Req 1.4 / 1.5): every part stays in its own
// module/chunk instead of being collapsed into a single bundle.
//
// This is the PARTS-only barrel. `Player` is intentionally NOT exported here — the public
// entry (`src/index.js`) exports the root directly from `@compound/Player`. `Captions.Toggle`
// is a static property of `Captions`, so consumers reach it as `Captions.Toggle`; it needs
// no separate top-level export (Req 1.3).
export { PlayOverlay } from '@compound/parts/PlayOverlay';
export { Poster } from '@compound/parts/Poster';
export { Captions } from '@compound/parts/Captions';
export { BottomBar } from '@compound/parts/BottomBar';
export { TopBar } from '@compound/parts/TopBar';
export { SidebarLeft } from '@compound/parts/SidebarLeft';
export { SidebarRight } from '@compound/parts/SidebarRight';
export { DesktopUI } from '@compound/parts/DesktopUI';
export { MobileUI } from '@compound/parts/MobileUI';
export { CenterControls } from '@compound/parts/CenterControls';
export { PrevButton } from '@compound/parts/PrevButton';
export { NextButton } from '@compound/parts/NextButton';
export { PlayButton } from '@compound/parts/PlayButton';
export { Volume } from '@compound/parts/Volume';
export { PlayTime } from '@compound/parts/PlayTime';
export { Title } from '@compound/parts/Title';
export { Timeline } from '@compound/parts/Timeline';
export { Chapters } from '@compound/parts/Chapters';
export { Heatmap } from '@compound/parts/Heatmap';
export { Settings } from '@compound/parts/Settings';
export { Cast } from '@compound/parts/Cast';
export { Fullscreen } from '@compound/parts/Fullscreen';
export { Source } from '@compound/parts/Source';
