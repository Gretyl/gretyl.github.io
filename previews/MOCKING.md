# MOCKING.md

How to generate preview screenshots of Jekyll-themed pages without running Jekyll locally.

## The `previews/` directory

This directory lives at the repo root, outside `docs/`, so its contents are not served by GitHub Pages. It holds mock-generated screenshot PNGs that are committed to feature branches for PR review. These files are development artifacts — they let reviewers see how a change will look with the Jekyll theme applied, without requiring deployment.

## Why mock?

This site uses `jekyll-remote-theme` with `vaibhavvikas/jekyll-theme-minimalistic`. Opening raw `.html` files in a browser shows unstyled content with visible front matter and Liquid tags. Running Jekyll locally requires resolving gem version conflicts (`jekyll-sass-converter` vs `jekyll-remote-theme`). Mocking the theme layout in a standalone HTML file sidesteps both problems.

## Steps

### 1. Fetch theme source files

Download the layout and SCSS from the remote theme repo using `curl`:

```bash
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_layouts/default.html" -o /tmp/theme-default.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_includes/header-title.html" -o /tmp/theme-header-title.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_includes/header.html" -o /tmp/theme-header.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_includes/sidebar.html" -o /tmp/theme-sidebar.html
curl -sL "https://raw.githubusercontent.com/vaibhavvikas/jekyll-theme-minimalistic/master/_sass/jekyll-theme-minimalistic.scss" -o /tmp/theme-style.scss
```

### 2. Build a mock HTML file

Create a standalone HTML file (e.g., `/tmp/sidebar-mock.html`) that:

- Inlines the theme's CSS (from `jekyll-theme-minimalistic.scss`) as plain CSS in a `<style>` block — strip `@import` lines and replace SCSS color variables with hardcoded CSS custom properties
- Replicates the theme's HTML structure: `.wrapper` > `.sidebar` + `section`
- Populates the sidebar with the same elements the theme includes render (logo, title, description, navigation)
- References local assets via absolute paths (e.g., `/home/user/gretyl.github.io/docs/assets/avatar.png`)

Key CSS variables for the light color scheme:

```css
:root {
  --clr-bg: #fff;
  --clr-text: #606c71;
  --clr-h1-and-bold: #333;
  --clr-h2: #586069;
  --clr-a-text: #1e6bb8;
  --clr-a-text-hvr: #159957;
  --clr-splitter-blockquote-and-section: #ddd;
}
```

### 3. Screenshot with rodney

```bash
uvx rodney start
uvx rodney open "file:///tmp/sidebar-mock.html"
uvx rodney waitload
uvx rodney sleep 1
uvx rodney screenshot -w 960 -h 700 previews/hero-headshot-preview.png
```

The `-w` and `-h` flags set the viewport size. Use `960` width to see the desktop sidebar layout; use `720` or below to test the mobile-responsive collapsed view.

### 4. Commit the screenshot for PR review

Save screenshots to `previews/` and push to the feature branch so reviewers can see them in the PR diff without deploying.

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
