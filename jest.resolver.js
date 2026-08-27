const path = require('path');
const fs = require('fs');

const srcDir = path.resolve(__dirname, 'src');
const coreSrcDir = path.resolve(__dirname, '../core/src');

/**
 * Custom Jest resolver that handles @alias imports.
 * Resolves @foo/bar to src/foo/bar (with extension resolution).
 * When the importer is inside core/src, resolves relative to core/src.
 * Falls back to default resolution for npm scoped packages.
 */
module.exports = (request, options) => {
  if (request.startsWith('@') && !request.startsWith('@playerstack/') && !request.startsWith('@testing-library/')) {
    const stripped = request.slice(1);

    // Determine which src root to use based on the importer's location
    const importer = options.basedir || '';
    const resolveRoot = importer.replace(/\\/g, '/').includes('/core/src') ? coreSrcDir : srcDir;

    // Map @typings/ to types/ directory
    const mappedPath = stripped.startsWith('typings/') ? 'types/' + stripped.slice('typings/'.length) : stripped;
    const candidate = path.resolve(resolveRoot, mappedPath);
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];

    // Try exact file
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
    // Try with extensions
    for (const ext of extensions) {
      if (fs.existsSync(candidate + ext)) {
        return candidate + ext;
      }
    }
    // Try as directory with index
    for (const ext of extensions) {
      const indexPath = path.join(candidate, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
    // Not a local alias — fall through to default resolution
  }

  return options.defaultResolver(request, options);
};
