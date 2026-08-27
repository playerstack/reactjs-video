# Contributing to Player Stack

Thanks for contributing to Player Stack! ❤️

---

## 🎒 Getting Started

### Requirements

- [Node.js](https://nodejs.org/) (see `.nvmrc` or `package.json > engines`)
- [Git](https://git-scm.com/)
- npm

### Fork & Clone

```bash
git clone https://github.com/{your-username}/reactjs-video.git
cd reactjs
npm install
npm start
# Open http://localhost:3000
```

To keep your fork up to date:

```bash
git remote add upstream git@github.com:playerstack/reactjs-video.git
git fetch upstream
git branch --set-upstream-to=upstream/main main
git pull upstream --rebase
```

---

## 🌿 Branch Naming Convention

Format: `<type>/<description-kebab-case>` or `<type>/<issue-number>-<description-kebab-case>`

| Type | Usage |
|------|-------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `refactor/` | Refactoring without behavior change |
| `chore/` | Maintenance (build, deps, CI) |
| `docs/` | Documentation only |
| `test/` | Tests only |

**Examples:**

```
feat/chapter-markers
fix/123-volume-slider-mobile
refactor/player-proxy-cleanup
chore/upgrade-esbuild
```

**Rules:**
- Use kebab-case (lowercase + hyphens).
- Main branch: `main`. Never push directly to `main`.
- Create branches from an up-to-date `main`.

---

## ✍️ Commit Convention — Semantic Commits

Format:

```
<type>(<scope>): <description in present imperative>
```

| Type | When |
|------|------|
| `feat` | New feature for the user |
| `fix` | Bug fix for the user |
| `refactor` | Code refactoring (no API change) |
| `chore` | Build, deps, CI tasks (no production code change) |
| `docs` | Documentation only |
| `test` | Tests only |
| `style` | Formatting, semicolons, etc. (no logic change) |

**Scope** = area of code: `player`, `skin`, `hooks`, `core`, `i18n`, `utils`, `build`.

**Examples:**

```
feat(skin): add chapter segments to TimeSlider
fix(core): prevent HLS SDK double-load on quality switch
refactor(hooks): simplify useVolume cleanup logic
chore(build): upgrade esbuild to 0.21
docs: update CONTRIBUTING with branch conventions
test(hooks): add useTimeSlider regression test
```

**Rules:**
- First letter of description in lowercase.
- No trailing period.
- Subject line ≤ 72 characters.
- Body optional: explain **why**, not **what**.

Reference: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

---

## 🎉 Pull Requests

1. Create a branch from an up-to-date `main` following the branch naming convention.
2. Write commits following Semantic Commits.
3. PR title = conventional commit format: `feat(skin): add chapter segments to TimeSlider`.
4. Mark `[WIP]` in the title if not ready for review.
5. Fill out the PR template (description, type, issues, checklist).

### Checklist before requesting review

- [ ] `npm run build:lib` compiles without errors
- [ ] `npm run test` passes (with regression test if it's a fix)
- [ ] `npm run lint` has no new errors in touched files

---

## 🐛 Issues

We use templates:
- **Bug Report** — for confirmed bugs (include reproduction steps)
- **Feature Request** — to suggest new features

Generic questions and discussions go to [Discussions](https://github.com/playerstack/reactjs-video/discussions).

---

## 🧪 Testing

```bash
npm test          # Run Jest once
npm run test:cov  # With coverage report
```

Framework: Jest 29 + jsdom + @testing-library/react. Tests in `test/**/*.spec.js`.

---

## 🔍 Linting

```bash
npm run lint
```

Uses ESLint with the project configuration. Fix issues before opening a PR.
