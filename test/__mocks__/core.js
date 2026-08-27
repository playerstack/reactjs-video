export class HlsMock {
  constructor() {
    this.loadSource = jest.fn();
    this.attachMedia = jest.fn();
    this.on = jest.fn();
    this.destroy = jest.fn();
  }
  static Events = {
    MANIFEST_PARSED: 'manifestParsed',
    ERROR: 'error',
    // Agrega aquí otros eventos que necesites simular.
  };
  loadSource() {}
  attachMedia() {}
  on() {}
  destroy() {}
}

export const DashMock = {
  MediaPlayer: () => ({
    create: () => ({
      initialize: jest.fn(),
      on: jest.fn(),
      getDebug: jest.fn(() => ({
        setLogToBrowserConsole: jest.fn(),
      })),
    }),
  }),
};

export const FlvMock = {
  createPlayer: () => ({
    attachMediaElement: jest.fn(),
    load: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  }),
  Events: {
    ERROR: 'error',
  },
};
