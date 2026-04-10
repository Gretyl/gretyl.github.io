# EMBEDDING.md — Adding Social Preview Cards

How to add OpenGraph meta tags to standalone HTML pages so they render rich previews on Mastodon, Discord, Slack, etc.

See also [FAVICONS.md](FAVICONS.md) — both docs govern `<head>` content and should be applied together when adding new pages.

## When to use this

Standalone HTML files (no Jekyll front matter) that you want to show a preview card when shared. Jekyll-rendered pages handle metadata differently — this guide is **not** for those.

Pages that already have cards: `artemis-trail.html`, `implode.html`, `tools/shadertoy.html`, `tutorials/greed.html`.

## The process

Everything — image (if any) and tags — lands in a single commit.

### 1. Prepare a preview image (optional)

If the default site avatar (`assets/avatar.png`) works for the card, skip to Step 2.

Otherwise, create or obtain an image for the page. Aim for **1200 × 630 px** (the 1.91:1 ratio that Mastodon and Discord expect). Save it to `docs/assets/og/` with a descriptive name — this is where all OpenGraph assets (images and videos) live.

#### 1a. Capture a screenshot with rodney (optional)

If the page is already functional, you can screenshot it from headless Chrome instead of creating an image from scratch:

```bash
uvx rodney start
uvx rodney open "file://$(pwd)/docs/path/to/page.html"
uvx rodney waitload
uvx rodney sleep 1
uvx rodney screenshot -w 1200 -h 630 docs/assets/og/my-preview.png
uvx rodney stop
```

`-w` and `-h` set the viewport dimensions — use `1200` × `630` to match the 1.91:1 aspect ratio. The screenshot captures exactly what's in the viewport, so resize-sensitive pages will render at that breakpoint.

For pages that need interaction before they look right (e.g., a game's title screen), add `rodney click` or `rodney js` steps between `waitload` and `screenshot`:

```bash
uvx rodney js "document.querySelector('.start-btn').click()"
uvx rodney sleep 1
uvx rodney screenshot -w 1200 -h 630 docs/assets/og/my-preview.png
```

### 2. Generate the tags

Open [`docs/tools/opengraph-preview.html`](https://gretyl.maplecrew.org/tools/opengraph-preview.html) in a browser and fill in:

| Field         | Value                                                    |
|---------------|----------------------------------------------------------|
| Page Title    | The headline you want on the card                        |
| Description   | 1–2 sentence summary (emoji OK)                         |
| Page URL      | `https://gretyl.maplecrew.org/<path-to-page>`           |
| Image URL     | `https://gretyl.maplecrew.org/assets/og/<image-file>`, or leave blank to use the default avatar |
| Site Name     | `Gretyl`                                                 |
| Type          | `website` (default) or `article` (for tutorials/guides)  |

Files in `docs/assets/og/` are hosted at `https://gretyl.maplecrew.org/assets/og/<filename>`. You can construct the URL before the image is deployed; it will resolve once the commit reaches `main`.

If Image URL is left blank, the tool falls back to the Default Image field (`assets/avatar.png`).

The tool also has optional **Video** fields (URL, type, width, height). See the video section below before using them.

The tool shows a live Mastodon-style card preview. Once you're happy with the layout and copy, click **Copy** to grab the generated HTML.

### 3. Embed in the HTML file

Paste the tags after the favicon `<link>` (see [FAVICONS.md](FAVICONS.md)), **before** the GA4 script and `<meta charset="UTF-8">`. The standard `<head>` ordering is favicon → OG → GA4 → rest:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<link rel="icon" href="data:image/svg+xml,...">

<meta property="og:title" content="The Artemis Trail">
<meta property="og:description" content="Lunar mission simulator, in the style of Oregon Trail.">
<meta property="og:url" content="https://gretyl.maplecrew.org/artemis-trail.html">
<meta property="og:image" content="https://gretyl.maplecrew.org/assets/og/artemis-trail.png">
<meta property="og:site_name" content="Gretyl">
<meta property="og:type" content="website">

<script async src="...gtag..."></script>
<script>...</script>

<meta charset="UTF-8">
```

### 4. Commit

Stage the HTML change (and the new image, if you added one) in a single commit:

```
docs(og): add preview card for <page>
```

## Tag reference

| Property           | Required | Notes                                          |
|--------------------|----------|-------------------------------------------------|
| `og:title`         | yes      | Card headline                                   |
| `og:description`   | yes      | Short summary; emoji and `&amp;` escapes are OK |
| `og:url`           | yes      | Canonical URL on `gretyl.maplecrew.org`         |
| `og:image`         | yes      | Absolute URL to image in `docs/assets/og/`, or `assets/avatar.png` as fallback |
| `og:site_name`     | yes      | Always `Gretyl`                                 |
| `og:type`          | yes      | `website` for games/tools, `article` for tutorials |
| `og:video`         | no       | Direct URL to video file or embed player        |
| `og:video:type`    | no       | MIME type — `video/mp4`, `video/webm`, or `text/html` for iframe embeds |
| `og:video:width`   | no       | Width in pixels                                 |
| `og:video:height`  | no       | Height in pixels                                |

## Video

**Video is supplemental.** Every card must have an `og:image` — it serves as the poster frame and fallback. Add `og:video` only when you also have a working image preview.

When including video, provide all four `og:video` properties. Store video files in `docs/assets/og/` alongside images.

## Worked example — GREED tutorial

```diff
 <!DOCTYPE html>
 <html lang="en">
 <head>
+<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎲</text></svg>">
+
+<meta property="og:title" content="GREED -- A Classic Dice Game of Risk &amp; Reward">
+<meta property="og:description" content="Score points and get greedy -- want to push your luck? 🎲">
+<meta property="og:url" content="https://gretyl.maplecrew.org/tutorials/greed.html">
+<meta property="og:image" content="https://gretyl.maplecrew.org/assets/og/greed.png">
+<meta property="og:type" content="article">
+<meta property="og:site_name" content="Gretyl">
+
 <meta charset="UTF-8">
```

Note `og:type` is `article` (not `website`) because this is a tutorial page.
