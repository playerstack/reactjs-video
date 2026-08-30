import React from 'react';
import { render } from '@testing-library/react';

import { PART_NAME } from '@compound/parts/partName';
import { PlayOverlay } from '@compound/parts/PlayOverlay';
import { Poster } from '@compound/parts/Poster';
import { Captions } from '@compound/parts/Captions';
import { BottomBar } from '@compound/parts/BottomBar';
import { TopBar } from '@compound/parts/TopBar';
import { SidebarLeft } from '@compound/parts/SidebarLeft';
import { SidebarRight } from '@compound/parts/SidebarRight';
import { DesktopUI } from '@compound/parts/DesktopUI';
import { MobileUI } from '@compound/parts/MobileUI';
import { CenterControls } from '@compound/parts/CenterControls';
import { PrevButton } from '@compound/parts/PrevButton';
import { NextButton } from '@compound/parts/NextButton';
import { PlayButton } from '@compound/parts/PlayButton';
import { Volume } from '@compound/parts/Volume';
import { PlayTime } from '@compound/parts/PlayTime';
import { Title } from '@compound/parts/Title';
import { Timeline } from '@compound/parts/Timeline';
import { Chapters } from '@compound/parts/Chapters';
import { Heatmap } from '@compound/parts/Heatmap';
import { Settings } from '@compound/parts/Settings';
import { Cast } from '@compound/parts/Cast';
import { Fullscreen } from '@compound/parts/Fullscreen';
import { Source } from '@compound/parts/Source';

// Data-driven table of every public composable marker as [Component, expectedPartName].
// Captions.Toggle is included as the static sub-composable of Captions (catalog slot name
// 'CaptionsToggle'). Every marker must expose PART_NAME + displayName, declare propTypes,
// and render no DOM (return null) so the resolver can scan children safely (Req 1.9/4.4/4.5/4.6).
const parts = [
  [PlayOverlay, 'PlayOverlay'],
  [Poster, 'Poster'],
  [Captions, 'Captions'],
  [BottomBar, 'BottomBar'],
  [TopBar, 'TopBar'],
  [SidebarLeft, 'SidebarLeft'],
  [SidebarRight, 'SidebarRight'],
  [DesktopUI, 'DesktopUI'],
  [MobileUI, 'MobileUI'],
  [CenterControls, 'CenterControls'],
  [PrevButton, 'PrevButton'],
  [NextButton, 'NextButton'],
  [PlayButton, 'PlayButton'],
  [Volume, 'Volume'],
  [PlayTime, 'PlayTime'],
  [Title, 'Title'],
  [Timeline, 'Timeline'],
  [Chapters, 'Chapters'],
  [Heatmap, 'Heatmap'],
  [Settings, 'Settings'],
  [Cast, 'Cast'],
  [Fullscreen, 'Fullscreen'],
  [Source, 'Source'],
  [Captions.Toggle, 'CaptionsToggle'],
];

describe('composable part markers', () => {
  parts.forEach(([Component, expectedPartName]) => {
    describe(`${expectedPartName}`, () => {
      test('exposes PART_NAME as a non-empty string matching the catalog name', () => {
        const partName = Component[PART_NAME];
        expect(typeof partName).toBe('string');
        expect(partName.length).toBeGreaterThan(0);
        expect(partName).toBe(expectedPartName);
      });

      test('exposes a displayName', () => {
        expect(typeof Component.displayName).toBe('string');
        expect(Component.displayName).toBe(expectedPartName);
      });

      test('declares propTypes', () => {
        // Assert the own `propTypes` property via hasOwnProperty to avoid a foreign
        // prop-types member access, while still proving the marker declares propTypes.
        expect(Object.prototype.hasOwnProperty.call(Component, 'propTypes')).toBe(true);
      });

      test('returns null and mounts no DOM', () => {
        const { container } = render(<Component />);
        expect(container).toBeEmptyDOMElement();
        expect(container.childNodes).toHaveLength(0);
      });
    });
  });

  test('covers the full set of composable markers', () => {
    expect(parts).toHaveLength(24);
  });

  test('Captions.Toggle is the static sub-composable named "CaptionsToggle"', () => {
    expect(Captions.Toggle).toBeDefined();
    expect(Captions.Toggle[PART_NAME]).toBe('CaptionsToggle');
    expect(Captions.Toggle.displayName).toBe('CaptionsToggle');
    expect(Object.prototype.hasOwnProperty.call(Captions.Toggle, 'propTypes')).toBe(true);
  });

  test('BottomBar declares container === true', () => {
    expect(BottomBar.container).toBe(true);
  });

  test('TopBar declares container === true', () => {
    expect(TopBar.container).toBe(true);
  });

  test('SidebarLeft declares container === true', () => {
    expect(SidebarLeft.container).toBe(true);
  });

  test('SidebarRight declares container === true', () => {
    expect(SidebarRight.container).toBe(true);
  });

  test('DesktopUI declares container === true', () => {
    expect(DesktopUI.container).toBe(true);
  });

  test('MobileUI declares container === true', () => {
    expect(MobileUI.container).toBe(true);
  });

  test('CenterControls declares container === true', () => {
    expect(CenterControls.container).toBe(true);
  });
});
