import fs from 'fs';
import path from 'path';

/**
 * Task 11.2 — Thin-wrapper SOURCE SCAN of `src/compound/*` (Design Property 8 / A8b · Req 11.3,
 * 11.4, 11.5).
 *
 * WHY a source scan instead of a behavioral test: Req 11.3/11.4/11.5 constrain the SOURCE of every
 * file under `src/compound/*` — they must be thin (declarative markers + pure transforms + the
 * Composition Context Provider) and must NOT contain:
 *   • business timers — `setTimeout` / `setInterval` (Req 11.3), nor
 *   • state machines / phase flags that reproduce a Core controller's internal state (Req 11.4/11.5).
 * A render/behavior test cannot prove the ABSENCE of such code across a whole directory; reading
 * the files and asserting the patterns are absent can. Jest runs in Node, so we read the files with
 * `fs`.
 *
 * "No state machine" as a robust, pragmatic proxy: in React a per-file phase-flag state machine is
 * built from `useState`/`useReducer`. The compound files legitimately use only `useMemo`,
 * `forwardRef`, `useContext`, `createContext` and `React.Children` (declarative wiring + pure
 * transforms), so the enforceable rule is "no `setTimeout`/`setInterval` and no `useState(`/
 * `useReducer(` anywhere under `src/compound`". Any of those appearing would signal exactly the
 * kind of contamination A8b forbids (a timer or a controller-like state machine leaking into the
 * thin compound layer).
 *
 * Path resolution: `src/compound` is derived from `__dirname` (this file lives in
 * `<repo>/test/compound/`, so the target is `../../src/compound`). This keeps the scan robust
 * regardless of the process CWD. Reading files via `fs`/`path` is test-time I/O — NOT an intra-`src`
 * module import — so it does not conflict with the `@`-alias import rule (I1–I7), which governs
 * module imports between project files, not filesystem reads inside a test.
 */

const COMPOUND_DIR = path.resolve(__dirname, '..', '..', 'src', 'compound');

/** Recursively collect every `.js`/`.jsx` source file under `src/compound`. */
function collectSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(full);
    }
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

/**
 * Strip comments and string literals before pattern-matching so a banned word that appears only in
 * EXPLANATORY PROSE (e.g. a doc-comment that says "no timers, no state machines") or inside a
 * string can never trip the scan — we only want to flag REAL code. The compound files do not use
 * template literals with embedded code, so backtick spans are collapsed wholesale too.
 */
function stripCommentsAndStrings(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ') // block comments
    .replace(/\/\/[^\n]*/g, ' ') // line comments
    .replace(/'(?:\\.|[^'\\])*'/g, "''") // single-quoted strings
    .replace(/"(?:\\.|[^"\\])*"/g, '""') // double-quoted strings
    .replace(/`(?:\\.|[^`\\])*`/g, '``'); // template literals
}

/** Relative label like `src/compound/Player/index.jsx` for readable test names / offender lists. */
function relLabel(file) {
  return file.replace(/\\/g, '/').replace(/.*\/src\/compound\//, 'src/compound/');
}

const files = collectSourceFiles(COMPOUND_DIR);

// The banned patterns. `\b…\b` for the timer globals; `…\s*\(` for the React state hooks so we
// match a CALL (`useState(`) and never a mere mention.
const BANNED = [
  { key: 'setTimeout', re: /\bsetTimeout\b/, req: '11.3' },
  { key: 'setInterval', re: /\bsetInterval\b/, req: '11.3' },
  { key: 'useState', re: /\buseState\s*\(/, req: '11.4/11.5' },
  { key: 'useReducer', re: /\buseReducer\s*\(/, req: '11.4/11.5' },
];

describe('src/compound is a thin-wrapper layer — source scan (Property 8 / A8b · Req 11.3/11.4/11.5)', () => {
  test('the scan actually covers the compound source files (guards against a vacuous pass)', () => {
    // If the path resolved wrong we would scan zero files and every ban below would pass vacuously.
    // Assert we found a realistic number of files AND the key surfaces are included.
    expect(files.length).toBeGreaterThanOrEqual(20);

    const rels = files.map(relLabel);
    expect(rels).toContain('src/compound/Player/index.jsx');
    expect(rels).toContain('src/compound/context/CompositionContext.jsx');
    expect(rels).toContain('src/compound/context/useComposition.js');
    expect(rels).toContain('src/compound/hooks/useResolveComposition.js');
    expect(rels).toContain('src/compound/hooks/collectConfig.js');
    expect(rels).toContain('src/compound/hooks/deriveEngineProps.js');
    // At least one declarative part marker is covered.
    expect(rels.some((r) => r.startsWith('src/compound/parts/') && r.endsWith('/index.jsx'))).toBe(true);
  });

  // Per-file table so a violation names the exact offending file (and future files are covered too).
  describe.each(files.map((file) => [relLabel(file), file]))('%s', (_label, file) => {
    const code = stripCommentsAndStrings(fs.readFileSync(file, 'utf8'));

    test.each(BANNED)('contains no business `$key` (Req $req)', ({ re }) => {
      expect(re.test(code)).toBe(false);
    });
  });

  // Aggregate belt-and-suspenders: assert the whole directory is clean in one shot and, on failure,
  // report exactly which files/patterns offend (far more useful than a lone boolean).
  test('NO file under src/compound uses business timers or state-machine hooks (aggregate)', () => {
    const offenders = { setTimeout: [], setInterval: [], useState: [], useReducer: [] };

    files.forEach((file) => {
      const code = stripCommentsAndStrings(fs.readFileSync(file, 'utf8'));
      const label = relLabel(file);
      BANNED.forEach(({ key, re }) => {
        if (re.test(code)) {
          offenders[key].push(label);
        }
      });
    });

    expect(offenders).toEqual({ setTimeout: [], setInterval: [], useState: [], useReducer: [] });
  });
});
