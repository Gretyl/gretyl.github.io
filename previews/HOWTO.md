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

### 4. Commit the screenshot for PR review

PNGs in `previews/` are gitignored by default to avoid shipping accidental screenshots. To include one for PR review, force-add it:

```bash
git add -f previews/my-preview.png
```

Remove preview PNGs before merging — they are ephemeral review artifacts, not permanent repo content.

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
