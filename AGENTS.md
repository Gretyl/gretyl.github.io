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

## Commits

- **Atomic commits.** Each commit should contain exactly one logical change. Don't bundle unrelated edits.
- **Conventional Commits.** Format: `type(scope): description`
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
  - Scopes: match the area of the codebase — e.g., `shadertoy`, `artemis`, `jekyll`, `agents`

## Working with this repo

- Edit HTML/JS files directly — there is nothing to compile or bundle
- Open `.html` files in a browser to test locally
- Use `uvx rodney` for headless Chrome browser validation (e.g., `uvx rodney start`, `uvx rodney open <url>`, `uvx rodney js '<expr>'`)

## Before pushing

1. Verify HTML is well-formed (check for unclosed tags, mismatched quotes)
2. Confirm JS has no syntax errors (look for typos in function names, missing brackets)
3. Ensure no secrets or credentials are included in the commit
