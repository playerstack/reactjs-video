global.MediaStream = class {
  constructor() {
    this.getTracks = jest.fn();
    this.getAudioTracks = jest.fn();
    this.getVideoTracks = jest.fn();
  }
};

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: jest.fn(),
});
