const path = require('path');
const fs = require('fs');

const srcDir = path.resolve(__dirname, 'src');
const coreSrcDir = path.resolve(__dirname, '../web-core/src');

/**
 * Custom Jest resolver that handles @alias imports.
 * Resolves @foo/bar to src/foo/bar (with extension resolution).
 * When the importer is inside web-core/src, resolves relative to web-core/src.
 * Falls back to default resolution for npm scoped packages.
 */
module.exports = (request, options) => {
  if (request.startsWith('@') && !request.startsWith('@playerstack/') && !request.startsWith('@testing-library/')) {
    const stripped = request.slice(1);

    // Determine which src root to use based on the importer's location
    const importer = options.basedir || '';
    const resolveRoot = importer.replace(/\\/g, '/').includes('/web-core/src') ? coreSrcDir : srcDir;

    // Map @typings/ to types/ directory, and @root/ to the src root (e.g. @root/engine ->
    // src/engine). @compound/ resolves to src/compound via the generic src-relative rule (sugar over @).
    let mappedPath = stripped;
    if (stripped.startsWith('typings/')) {
      mappedPath = 'types/' + stripped.slice('typings/'.length);
    } else if (stripped === 'root' || stripped.startsWith('root/')) {
      mappedPath = stripped.slice('root'.length).replace(/^\//, '');
    }
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
