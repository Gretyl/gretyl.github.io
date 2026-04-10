# FAVICONS.md — Adding Emoji Favicons

How to add an emoji favicon to any page so browsers show it in the tab.

See also [EMBEDDING.md](EMBEDDING.md) — both docs govern `<head>` content and should be applied together when adding new pages.

## The approach

An inline SVG data URI renders the emoji as a favicon with no extra files:

```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>">
```

Works in Chrome, Firefox, Edge, and Safari 12+.

## Standalone HTML files

Add the `<link>` as the **first element** after `<head>`, before OG tags and GA4. The standard `<head>` ordering is:

```html
<head>
<link rel="icon" href="data:image/svg+xml,...">   <!-- 1. Favicon -->

<meta property="og:title" content="...">           <!-- 2. OG tags -->
...

<script async src="...gtag..."></script>            <!-- 3. GA4 -->
<script>...</script>

<meta charset="UTF-8">                             <!-- 4. Everything else -->
<meta name="viewport" ...>
<title>...</title>
```

## Jekyll-rendered pages

Set `favicon_emoji` in the page's front matter:

```yaml
---
layout: default
title: My Page
favicon_emoji: 🎯
---
```

The `_includes/head-custom.html` override handles the rest — it reads the front matter variable and emits the SVG favicon `<link>` in the layout's `<head>`. No changes to the page content are needed.

If `favicon_emoji` is omitted, no favicon is rendered.
