import PlayerStack from '@';

describe('PlayerStack - static methods', () => {
  test('canPlay()', () => {
    expect(
      PlayerStack.canPlay('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'),
    ).toBeTruthy();
    expect(
      PlayerStack.canPlay('https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps_640x360_800k.mpd'),
    ).toBeTruthy();
    expect(PlayerStack.canPlay('https://www.w3schools.com/tags/mov_bbb.mp4')).toBeTruthy();
    expect(
      PlayerStack.canPlay(
        'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp8/360/Big_Buck_Bunny_360_10s_1MB.webm',
      ),
    ).toBeTruthy();
    // expect(PlayerStack.canPlay('http://example.com/random/path')).toBeTruthy();
  });
});
