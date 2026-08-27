import PlayerStack from '@';

const COMMON_METHODS = ['getDuration', 'getCurrentTime', 'getSecondsLoaded', 'getInternalPlayer'];

describe('COMMON_METHODS', () => {
  test.each(COMMON_METHODS)('%s() - valid value', (method) => {
    const instance = new PlayerStack();
    instance.references.player({ [method]: () => 123 });
    expect(instance[method]()).toBe(123);
  });

  test.each(COMMON_METHODS)('%s() - null', (method) => {
    const instance = new PlayerStack();
    expect(instance[method]()).toBe(null);
  });
});

describe('Other methods', () => {
  test('getInternalPlayer() - default', async () => {
    const instance = new PlayerStack();
    const mockGetInternalPlayer = jest.fn().mockReturnValue('abc');
    instance.references.player({
      getInternalPlayer: mockGetInternalPlayer,
    });
    const result = instance.getInternalPlayer();

    expect(result).toBe('abc');
    expect(mockGetInternalPlayer).toHaveBeenCalledWith('player');
  });

  test('seekTo()', async () => {
    const instance = new PlayerStack();
    const mockSeekTo = jest.fn();
    instance.references.player({ seekTo: mockSeekTo });
    instance.seekTo(5, 'seconds', true);

    expect(mockSeekTo).toHaveBeenCalledTimes(1);
    expect(mockSeekTo).toHaveBeenCalledWith(5, 'seconds', true);
  });

  test('seekTo() - null', async () => {
    const instance = new PlayerStack();
    expect(instance.seekTo()).toBe(null);
  });

  test('onReady()', () => {
    const mockOnReady = jest.fn();
    const instance = new PlayerStack({
      onReady: mockOnReady,
    });
    instance.handleReady();
    expect(mockOnReady).toHaveBeenCalledTimes(1);
    expect(mockOnReady).toHaveBeenCalledWith(instance);
  });

  test('refs', async () => {
    const instance = new PlayerStack();
    instance.references.player('abc');
    instance.references.wrapper('def');

    expect(instance.player).toBe('abc');
    expect(instance.wrapper).toBe('def');
  });
});
