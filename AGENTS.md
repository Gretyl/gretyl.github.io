# AGENTS.md

Guidelines for AI agents contributing to this repository.

## The criterion

> *Every artifact ships as self-contained HTML — no build step, no
> runtime dependency. What you push to `main` is what the visitor sees.*

The sections below operationalize this single constraint: key
considerations (§"Key considerations") guard the zero-dependency
boundary; patterns (§"Patterns in use") keep pages self-contained;
workflow (§"Branching workflow", §"Commits") protects the only deploy
gate — the merge to `main`. Situational guidance (§"Situational
guidance") at the end forwards to `guides/` for concerns that don't
apply to every change.

The `guides/` directory holds situational guidance subdocuments — it
is not part of the published site.

## Repository

Static GitHub Pages site — plain HTML and vanilla JavaScript. No build tools, no package manager, no tests. Changes go live immediately when pushed to `main`.

## Key considerations

- **No safety net.** Without tests or CI, review changes carefully before pushing. Validate HTML structure and JS correctness by reading the code.
- **No build process.** Do not introduce bundlers, transpilers, or package managers unless explicitly asked.
- **Client-side only.** Everything runs in the browser. Never commit secrets, API keys, or server-side code.
- **Minimal footprint.** This is a personal site, not a framework. Prefer simple, self-contained files over complex abstractions.

## Patterns in use

- `docs/tools/shadertoy.html` uses `@slider` annotations in GLSL comments to auto-generate UI controls — follow this pattern when adding shader presets
- Interactive pages (Artemis Trail, Shadertoy) are single-file HTML with embedded CSS and JS
- **Arcade** section is for standalone games that are vibe coded — keep new games here
- **Entries** section is for self-contained subproject directories under `docs/` (e.g., `resnick-algorithms/`, `functional-data-structures/`). Each entry has an `index.md` (Jekyll front matter + content adapted from README.md), a `_summary.md` (used by cog to generate homepage blurbs), and optionally `demo.md`, `notes.md`, and other supporting files
- Homepage summaries in `docs/index.html` are auto-generated from `_summary.md` files via [cogapp](https://pypi.org/project/cogapp/). Run `cd docs && uvx --from cogapp cog -r index.html` to regenerate after adding or updating entries
- Navigation in `docs/_config.yml` must be updated when adding new entries (add to the `Entries` sublist)
- **Analytics:** Jekyll-rendered pages (with front matter) use `{% include analytics.html %}`. Standalone HTML files (no front matter) must inline the raw GA4 snippet in `<head>` instead — Jekyll does not process Liquid tags in files without front matter, so `{% include %}` would appear as literal text
- **GitHub Pages + Jekyll:** This site uses the `jekyll-remote-theme` plugin with `vaibhavvikas/jekyll-theme-minimalistic`. For layout, includes, and deployment details, see the [GitHub Pages documentation](https://docs.github.com/en/pages)
- **Tools** section is for utility applications under `docs/tools/`. Tools can be single-file HTML or directory-based (e.g., `webkitdirectory-demo/`). Follow the same standalone-file conventions as Arcade pages

## Branching workflow

- **Feature branches + PRs.** Create a descriptively-named branch and open a PR for all changes — do not commit directly to `main`. The repo has branch protection requiring PRs, and pushes to `main` deploy immediately.

## Commits

- **Atomic commits.** Each commit should contain exactly one logical change. Don't bundle unrelated edits.
- **Conventional Commits.** Format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Scopes: match the area of the codebase — e.g., `shadertoy`, `artemis`, `jekyll`, `agents`

## Working with this repo

- Edit HTML/JS files directly — there is nothing to compile or bundle
- Open `.html` files in a browser to test locally
- Use `uvx rodney` for headless Chrome browser validation (e.g., `uvx rodney start`, `uvx rodney open <url>`, `uvx rodney js '<expr>'`)
- For previewing Jekyll-themed pages without running Jekyll, see [previews/HOWTO.md](previews/HOWTO.md)

## Debugging

- **Local HTTP server for `fetch()`-dependent pages.** Standalone HTML pages that use `fetch()` for local assets (e.g., `phrase-a-day.html` loading `assets/phrases.md`) will fail under `file://` URLs due to browser security restrictions. Serve them via a local HTTP server instead: `cd docs && python3 -m http.server 8765`, then open `http://localhost:8765/<page>.html` in the browser or with `uvx rodney open`.
- **Service worker cache versioning.** When modifying HTML or assets cached by a service worker, bump the `CACHE_NAME` version string in the corresponding `sw-{app}.js` file so stale offline copies are evicted. See the cache versioning section in [`guides/pwa.md`](guides/pwa.md) for details.

## Before pushing

1. Verify HTML is well-formed (check for unclosed tags, mismatched quotes)
2. Confirm JS has no syntax errors (look for typos in function names, missing brackets)
3. Ensure no secrets or credentials are included in the commit

## Situational guidance

The documents in `guides/` apply only when a task intersects them.
**If your task touches one of these areas, read the linked file first:**

- Emoji favicons for browser tabs →
  [`guides/favicons.md`](guides/favicons.md)
- OpenGraph social preview cards →
  [`guides/embedding.md`](guides/embedding.md)
- Adding artifacts to the Atom / JSON feeds →
  [`guides/feeds.md`](guides/feeds.md)
- PWA offline support and Home Screen install →
  [`guides/pwa.md`](guides/pwa.md)
- Previewing Jekyll-themed pages without running Jekyll →
  [`previews/HOWTO.md`](previews/HOWTO.md)
