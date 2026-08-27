/**
 * Postinstall script: link local sibling packages for development.
 *
 * If @playerstack/core exists as a built sibling directory (../core/dist),
 * replaces the registry-installed version with a symlink to the local source.
 * This allows real-time development without publishing after every change.
 *
 * In CI or when the sibling doesn't exist, this script is a no-op and the
 * registry version (specified in package.json) is used as-is.
 *
 * Pattern reference: https://stackoverflow.com/questions/57524314
 */
const fs = require('fs');
const path = require('path');

// PLAYERSTACK_CORE_PATH lets CI point at a core checkout built from an arbitrary branch
// (see .github/workflows/ci.yml). When set, we link against it instead of the `../core`
// sibling — so the skin can build/test against unreleased core changes without publishing
// a new npm version. Unset (local dev / fresh clone / npm publish), the default applies.
const coreOverride = process.env.PLAYERSTACK_CORE_PATH ? path.resolve(process.env.PLAYERSTACK_CORE_PATH) : null;

const LOCAL_DEPS = [
  {
    name: '@playerstack/core',
    localPath: coreOverride || '../core',
    checkPath: coreOverride ? path.join(coreOverride, 'dist') : '../core/dist',
  },
];

for (const dep of LOCAL_DEPS) {
  const checkAbsolute = path.resolve(__dirname, '..', dep.checkPath);
  const localAbsolute = path.resolve(__dirname, '..', dep.localPath);
  const targetDir = path.resolve(__dirname, '..', 'node_modules', dep.name);

  if (!fs.existsSync(checkAbsolute)) {
    // Sibling not available (CI, fresh clone without core) — use registry version
    continue;
  }

  // Remove registry-installed version
  fs.rmSync(targetDir, { recursive: true, force: true });

  // Ensure parent directory exists
  const parentDir = path.dirname(targetDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Create symlink (junction on Windows for cross-drive compat)
  fs.symlinkSync(localAbsolute, targetDir, 'junction');
  console.log(`[link-local-deps] Linked ${dep.name} → ${localAbsolute}`);
}
