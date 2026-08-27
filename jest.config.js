const path = require('path');
const fs = require('fs');

// Always consume core's built CJS output (same as the published package / CI).
// The dev workspace symlinks node_modules/@playerstack/web-core → ../web-core, so rebuilding
// core keeps this fresh. Resolving to dist avoids transforming core's TypeScript
// with esbuild-jest (which trips on `export type` re-exports).
//
// PLAYERSTACK_CORE_PATH lets CI point at a core checkout built from an arbitrary branch
// (see .github/workflows/ci.yml) so the skin can be tested against unreleased core changes
// WITHOUT publishing a new npm version. Local dev keeps the default `../web-core` sibling.
const coreRoot = process.env.PLAYERSTACK_CORE_PATH
  ? path.resolve(process.env.PLAYERSTACK_CORE_PATH)
  : path.resolve(__dirname, '../web-core');
const distCoreCjs = path.join(coreRoot, 'dist/cjs');
const hasLocalCore = fs.existsSync(distCoreCjs);

function corePath(subpath) {
  if (hasLocalCore) {
    return path.join(distCoreCjs, subpath + '.js');
  }
  return path.join(__dirname, 'node_modules/@playerstack/web-core/dist/cjs', subpath + '.js');
}

module.exports = {
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'esbuild-jest',
  },
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/test/setupTests.js'],
  coverageReporters: ['lcov', 'json', 'clover', 'text'],
  coveragePathIgnorePatterns: ['node_modules', 'demo', 'examples', 'lib', 'scripts', 'types', 'dist', 'coverage'],
  reporters: ['default', ['jest-junit', { outputDirectory: 'coverage', outputName: 'report.xml' }]],
  testMatch: ['<rootDir>/test/**/*.spec.(js|jsx)'],
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom(.*)$': '<rootDir>/node_modules/react-dom$1',
    '^@playerstack/web-core$': corePath('index'),
    '^@playerstack/web-core/patterns$': corePath('patterns'),
    '^@playerstack/web-core/chapters$': corePath('chapters'),
    '^@playerstack/web-core/heatmap$': corePath('heatmap'),
    '^@playerstack/web-core/i18n$': corePath('i18n/index'),
    '^@playerstack/web-core/keyboard$': corePath('keyboard'),
    '^@playerstack/web-core/live-dvr$': corePath('live-dvr'),
    '^@playerstack/web-core/slider$': corePath('slider'),
    '^@playerstack/web-core/player-state$': corePath('player-state'),
    '^@playerstack/web-core/quality$': corePath('quality'),
    '^@playerstack/web-core/reducer$': corePath('reducer'),
    '^@playerstack/web-core/ui$': corePath('ui/index'),
    '^@playerstack/web-core/styles$': corePath('styles/index'),
    '^@playerstack/web-core/engine$': corePath('media-engine'),
    '^@playerstack/web-core/adapters/framework$': corePath('adapters/index'),
    '^@playerstack/web-core/adapters$': corePath('types/adapters.types'),
    '^@playerstack/web-core/utils/format$': corePath('utils/format'),
    '^@playerstack/web-core/utils/cookie$': corePath('utils/cookie'),
    '^@playerstack/web-core/utils/device$': corePath('utils/device'),
    '^@playerstack/web-core/utils/sdk$': corePath('utils/sdk'),
    '^@playerstack/web-core/utils/media$': corePath('utils/media'),
    '^@playerstack/web-core/utils/env$': corePath('utils/env'),
    '^@playerstack/web-core/utils/captions$': corePath('utils/captions'),
    '^@playerstack/web-core/utils/vtt-sprite$': corePath('utils/vtt-sprite'),
    '^@playerstack/web-core/constants$': corePath('constants'),
    '^@playerstack/web-core/icons/mobile$': corePath('icons/mobile/index'),
    '^@playerstack/web-core/icons$': corePath('icons/index'),
  },
  resolver: '<rootDir>/jest.resolver.js',
};
