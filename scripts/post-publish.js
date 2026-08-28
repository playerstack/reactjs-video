/**
 * post-publish cleanup.
 * Removes the type declarations that prepublishOnly copied to the project root
 * (they are only needed inside the npm tarball, not in the working tree).
 */
const { join } = require('path');
const { readdir, unlink, rm } = require('fs').promises;
const { existsSync, statSync } = require('fs');

const TYPES_DIR = join(__dirname, '..', 'types');

async function cleanup() {
  if (!existsSync(TYPES_DIR)) return;
  const entries = await readdir(TYPES_DIR);
  const root = join(__dirname, '..');

  for (const entry of entries) {
    const target = join(root, entry);
    if (!existsSync(target)) continue;
    if (statSync(target).isDirectory()) {
      // Only remove if it also exists in types/ (avoid removing src/lib etc.)
      await rm(target, { recursive: true, force: true });
    } else {
      await unlink(target);
    }
  }
}

cleanup().catch((err) => {
  console.error('post-publish cleanup error:', err);
  process.exit(1);
});
