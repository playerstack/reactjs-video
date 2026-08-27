import { eventNameToPropName, buildEventPropMap } from '@adapter/eventPropName';

describe('eventPropName', () => {
  describe('eventNameToPropName', () => {
    test('maps a prefixed request event to an on* callback prop name', () => {
      expect(eventNameToPropName('playerstack-play-request')).toBe('onPlayRequest');
    });

    test('drops the playerstack- prefix and PascalCases the remaining segments', () => {
      expect(eventNameToPropName('playerstack-enter-fullscreen-request')).toBe('onEnterFullscreenRequest');
      expect(eventNameToPropName('playerstack-exit-pip-request')).toBe('onExitPipRequest');
    });

    test('handles a hyphenated name without the playerstack- prefix', () => {
      expect(eventNameToPropName('volume-change')).toBe('onVolumeChange');
    });

    test('handles a single-segment name', () => {
      expect(eventNameToPropName('playerstack-seek')).toBe('onSeek');
      expect(eventNameToPropName('click')).toBe('onClick');
    });

    test('ignores empty segments produced by trailing/leading hyphens', () => {
      expect(eventNameToPropName('playerstack-ad-skip')).toBe('onAdSkip');
      expect(eventNameToPropName('playerstack--double--tap')).toBe('onDoubleTap');
    });
  });

  describe('buildEventPropMap', () => {
    test('returns event/prop pairs for each request event', () => {
      const events = ['playerstack-play-request', 'playerstack-pause-request'];
      expect(buildEventPropMap(events)).toEqual([
        { eventName: 'playerstack-play-request', propName: 'onPlayRequest' },
        { eventName: 'playerstack-pause-request', propName: 'onPauseRequest' },
      ]);
    });

    test('returns an empty array for a binding with no request events', () => {
      expect(buildEventPropMap([])).toEqual([]);
    });

    test('preserves order and uses eventNameToPropName for the mapping', () => {
      const events = ['playerstack-mute-request', 'playerstack-unmute-request', 'playerstack-volume-request'];
      const map = buildEventPropMap(events);
      expect(map.map((entry) => entry.propName)).toEqual(['onMuteRequest', 'onUnmuteRequest', 'onVolumeRequest']);
      map.forEach((entry) => {
        expect(entry.propName).toBe(eventNameToPropName(entry.eventName));
      });
    });
  });
});
