## Description

<!-- Briefly describe what this PR does and why. -->

## Type of change

- [ ] `fix` — Bug fix
- [ ] `feat` — New feature
- [ ] `refactor` — Refactoring without behavior change
- [ ] `chore` — Maintenance tasks (build, deps, CI)
- [ ] `docs` — Documentation only
- [ ] `test` — Tests only

## Related issues

<!-- Close or reference issues: "Closes #123" or "Relates to #456" -->

## Core dependency (optional)

<!--
  If this PR needs UNRELEASED changes from @playerstack/web-core, tell CI which core branch/tag/SHA
  to build the skin against — no need to publish a new core version. Uncomment the line below
  and set the ref (the "Core-Branch:" prefix is required, it is matched by CI as Core-Branch:\s*<ref>):

  Core-Branch: feat/my-core-branch

  If omitted, CI auto-resolves in this order:
    1. A core branch with the SAME name as this PR's head branch.
    2. Fallback to `main`.
  You can also override it manually from Actions → "Node.js CI" → "Run workflow" (core_ref input).
-->

## Checklist

- [ ] `npm run build:lib` compiles without errors
- [ ] `npm run test` passes
- [ ] `npm run lint` has no new errors in touched files
