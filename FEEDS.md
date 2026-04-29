# FEEDS.md — Adding artifacts to the site feeds

How to add a new artifact to the Atom and JSON feeds at `/feed.xml` and
`/feed.json`.

See also [EMBEDDING.md](EMBEDDING.md) and [FAVICONS.md](FAVICONS.md) — all
three docs govern `<head>` content and per-artifact metadata, and should
be applied together when adding a new page.

## What this is

The site exposes two feeds:

- **Atom 1.0:** `https://gretyl.maplecrew.org/feed.xml`
- **JSON Feed 1.1:** `https://gretyl.maplecrew.org/feed.json`

Both are hand-rolled Liquid templates (`docs/feed.xml`, `docs/feed.json`)
that iterate a single manifest at `docs/_data/artifacts.yml`. There is
one entry per artifact under `/docs/`, sorted newest-first by `date`.

Discovery `<link rel="alternate">` tags live in
`docs/_includes/head-custom.html`, so every Jekyll-rendered page
advertises both feeds. The side nav also surfaces them as
`fa-square-rss` icon links above the footer (see
`docs/_includes/sidebar.html`).

### Why not `jekyll-feed` / `jekyll-json-feed`?

The plugin combo assumes posts in `_posts/`. Our artifacts are real pages
with their own permalinks, and we want each entry backdated to the first
commit that introduced its OG card — not to a generic `published`
front-matter field. Hand-templating over `_data/artifacts.yml` keeps the
existing GitHub Pages auto-deploy (no Actions migration, no allowlist
issue) and gives us per-entry control of date, summary, and image.

## Adding a new artifact

When you add an HTML artifact under `/docs/` (game, tool, tutorial, or
entry), append a YAML block to `docs/_data/artifacts.yml`:

```yaml
- id: my-new-artifact
  title: My New Artifact
  url: /tools/my-new-artifact.html
  date: 2026-05-15T14:22:08-05:00
  summary: One-sentence descriptor — match the bullet on docs/index.html.
  image: /assets/og/my-new-artifact.png
  type: website
```

### Field reference

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Stable slug; usually the filename without extension |
| `title` | yes | Same as `og:title` from the artifact's `<head>` |
| `url` | yes | Site-relative path (leading slash). For directory artifacts, end with `/` |
| `date` | yes | ISO 8601 with offset — see "Picking the date" below |
| `summary` | yes | Match the descriptor on `docs/index.html` so the feed reads the same as the homepage |
| `image` | no | Site-relative path to the OG image, or `/assets/avatar.png` as fallback |
| `type` | yes | `website` (games, tools, entries) or `article` (tutorials), matching the EMBEDDING.md convention |

The `summary` may contain inline HTML (`<em>`, `<code>`); both feeds
escape it correctly. Keep it to one or two sentences.

## Picking the date

Convention: the **author date of the first commit that introduced the
artifact's OG card.** That's the closest analog to a "published" stamp
on this site.

```bash
git log --reverse --format='%aI %s' -S 'og:title' -- docs/path/to/artifact.html | head -1
```

If the artifact has no OG card (the two `Entries/` Jekyll subprojects
fall in this bucket), use the first commit of the artifact's
directory:

```bash
git log --reverse --format='%aI %s' -- docs/my-entry/ | head -1
```

Copy the `%aI` value (ISO 8601 with local offset, e.g.
`2026-04-12T02:39:16-05:00`) into the `date` field verbatim.
Perturb all concurrent items' datestamps by a single second each 
so every item in our feed has a unique posting time that 
generates a stable sequence of items in feed readers for 
widest interoperability.

## Verifying

1. **Local Jekyll preview** (or the previews flow in
   [previews/HOWTO.md](previews/HOWTO.md)): open `/feed.xml` and
   `/feed.json` and confirm both render without Liquid errors.
2. **Atom validation:** paste the body of `/feed.xml` into the
   [W3C Feed Validator](https://validator.w3.org/feed/) — expect a
   "valid Atom 1.0 feed" verdict.
3. **JSON Feed validation:** paste `/feed.json` into the
   [JSON Feed Validator](https://validator.jsonfeed.org/) — expect
   "valid JSON Feed 1.1".
4. **Spot-check the new entry:** confirm its `date_published` /
   `<published>` matches what you copied from `git log`, and the
   summary matches `docs/index.html`.
5. **Discovery:** `view-source:` on `/` should show both
   `<link rel="alternate">` tags in `<head>`.

## Optional: per-page discovery on standalone HTML

Standalone HTML pages (no Jekyll front matter) don't pick up the
`head-custom.html` discovery tags. Adding the same two lines to a
standalone page's `<head>` is **optional** — feed readers subscribe by
URL, not by discovery — but it lets browser extensions and
auto-discoverers find the feed from any artifact's page:

```html
<link rel="alternate" type="application/atom+xml" title="Gretyl (Atom)" href="/feed.xml">
<link rel="alternate" type="application/feed+json" title="Gretyl (JSON Feed)" href="/feed.json">
```
