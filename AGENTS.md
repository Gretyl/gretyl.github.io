# AGENTS.md

Guidelines for AI agents contributing to this repository.

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
- **Favicons:** Follow [FAVICONS.md](FAVICONS.md) when adding emoji favicons to pages
- **Social preview cards:** Follow [EMBEDDING.md](EMBEDDING.md) when adding OpenGraph `<meta>` tags to standalone HTML pages

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

## Before pushing

1. Verify HTML is well-formed (check for unclosed tags, mismatched quotes)
2. Confirm JS has no syntax errors (look for typos in function names, missing brackets)
3. Ensure no secrets or credentials are included in the commit
