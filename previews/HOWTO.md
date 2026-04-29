# HOWTO.md

How to generate preview screenshots of Jekyll-themed pages without running Jekyll locally.

## The `previews/` directory

This directory lives at the repo root, outside `docs/`, so its contents are not served by GitHub Pages. It holds:

- **`sidebar-mock.html`** — a standalone HTML template that replicates the remote theme's sidebar layout with inlined CSS. Edit this file to reflect content changes, then screenshot it. If the upstream theme changes, re-fetch the source files (step 1 below) and update the mock.
- **`*.png`** — screenshot artifacts committed to feature branches for PR review. These let reviewers see how a change will look with the Jekyll theme applied, without requiring deployment.
- **`HOWTO.md`** — this file.

## Why mock?

This site uses `jekyll-remote-theme` with `vaibhavvikas/jekyll-theme-minimalistic`. Opening raw `.html` files in a browser shows unstyled content with visible front matter and Liquid tags. Running Jekyll locally requires resolving gem version conflicts (`jekyll-sass-converter` vs `jekyll-remote-theme`). Mocking the theme layout in a standalone HTML file sidesteps both problems.

## Steps

### 1. Fetch theme source files (only if the upstream theme changes)

Download the layout and SCSS from the remote theme repo using `curl`:

```bash
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_layouts/default.html" -o /tmp/theme-default.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_includes/header-title.html" -o /tmp/theme-header-title.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_includes/header.html" -o /tmp/theme-header.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_includes/sidebar.html" -o /tmp/theme-sidebar.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_sass/jekyll-theme-minimalistic.scss" -o /tmp/theme-style.scss
```

Then update `sidebar-mock.html` to match.

### 2. Update the mock HTML

Edit `previews/sidebar-mock.html` to reflect the change being previewed (e.g., new navigation items, updated content, new assets). The mock already has the theme's CSS inlined and the correct HTML structure — most changes only require editing the `<section>` content or sidebar navigation.

For asset references, use relative paths from `previews/` (e.g., `../docs/assets/avatar.png`). Avoid hardcoded absolute paths — they break when the repo is cloned to a different location.

### 3. Screenshot with rodney

```bash
uvx rodney start
uvx rodney open "file://$(pwd)/previews/sidebar-mock.html"
uvx rodney waitload
uvx rodney sleep 1
uvx rodney screenshot -w 960 -h 700 previews/hero-headshot-preview.png
```

The `-w` and `-h` flags set the viewport size. Use `960` width to see the desktop sidebar layout; use `720` or below to test the mobile-responsive collapsed view.

#### Pages that use `localStorage`

If the page being screenshotted reads or writes `localStorage` (e.g., the disclosure-sync feature persists open/closed state under the `disclosure-state` key), Chromium's headless profile **persists that storage across `rodney start`/`stop` cycles** for the same `file://` path. State written by an earlier session (manual exploration, a verification script, an aborted test) leaks into the next session and can flip the canonical screenshot away from markup defaults — silently.

To capture a defaults-only screenshot, clear storage between loads:

```bash
uvx rodney start
uvx rodney open "file://$(pwd)/previews/sidebar-mock.html"
uvx rodney waitload
uvx rodney js 'localStorage.clear()'
uvx rodney open "file://$(pwd)/previews/sidebar-mock.html"   # reload so rehydration sees an empty store
uvx rodney waitload
uvx rodney sleep 1
uvx rodney screenshot -w 960 -h 700 previews/my-preview.png
uvx rodney stop
```

The first `open` is just to land somewhere `localStorage.clear()` can run — storage is scoped per origin and each `file://` path is its own origin, so you must be on the target page before clearing. The reload then runs rehydration against an empty store, surfacing the markup defaults.

If the screenshot looks "wrong" (e.g., a section that should default open is collapsed), suspect leftover storage first.

#### Verifying state-persisting features

For end-to-end verification of features that involve `localStorage` (rehydration on reload, cross-page persistence), the same caveat applies: explicitly `localStorage.clear()` at the start of each test, then drive the toggles, reload, and assert. `uvx rodney js '<expr>'` accepts a single expression — wrap multi-statement logic in an IIFE: `(()=>{ /* ... */; return result })()`.

For cross-page persistence (e.g., toggle on `/`, navigate to `/artemis-trail.html`, assert side nav rehydrates) the local mock isn't enough — `file://` URLs use per-path opaque origins, so two mock pages don't share storage. Serve via `cd docs && python3 -m http.server 8765` and drive rodney against `http://localhost:8765/...` so all pages share the same origin.

### 4. Commit the screenshot for PR review

PNGs in `previews/` are gitignored by default to avoid shipping accidental screenshots. To include one for PR review, force-add it:

```bash
git add -f previews/my-preview.png
```

Preview PNGs are ephemeral review artifacts, not permanent repo content. Do not remove them until the user explicitly asks — their presence on the branch is how we collaborate via the PR. Removing them is the signal that the branch is ready to merge into `main`.

### 5. Draft a PR description in `previews/`

When composing a PR title and description, write the description body to `previews/pr-description.md` rather than inlining it in chat. This keeps long markdown out of the conversation, gives the user a copyable artifact, and lives alongside the screenshots on the feature branch. Force-add it the same way:

```bash
git add -f previews/pr-description.md
```

Like preview PNGs, this file is an ephemeral review artifact — remove it when the branch is ready to merge.

## Image processing

### Background removal with rembg

To remove backgrounds from images (e.g., profile avatars):

```bash
uv run --with "rembg[cpu,cli]" rembg i input.png output.png
```

This runs a U2-Net model locally — no API keys needed. First run downloads the model (~176 MB) to `~/.u2net/`. Works well for illustrated/cartoon avatars and photos with distinct foreground subjects. Gradient or noisy backgrounds that are tonally similar to the subject may need manual cleanup.

## What didn't work

- **Jekyll locally**: `jekyll-remote-theme` 0.4.3 conflicts with `jekyll-sass-converter` 3.1.0 (shipped with Jekyll 4.4.1). The `github-pages` gem also failed to install due to version conflicts. Resolving these requires pinning specific gem versions or using a Gemfile with Bundler, which this repo intentionally avoids.
- **WebFetch for raw source**: The `WebFetch` tool summarizes fetched content instead of returning it verbatim — use `curl` to download theme files when you need exact source code.
- **ImageMagick / Pillow flood-fill**: Not suitable for removing gradient backgrounds from avatars — tonal similarity between background and subject edges causes artifacts. Use `rembg` instead.
