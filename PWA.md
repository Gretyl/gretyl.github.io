# PWA.md — Making Pages Home Screen-Ready & Offline-Capable

How to turn a standalone HTML page into an installable, offline-capable web app that launches full-screen from the Home Screen.

See also [FAVICONS.md](FAVICONS.md) and [EMBEDDING.md](EMBEDDING.md) — all three docs govern `<head>` content and should be applied together when adding new pages.

## When to use this

Standalone HTML files (no Jekyll front matter) that are interactive or app-like and would benefit from being installable or working offline. Not every page needs this — it's best suited for self-contained tools and games that users might reach for repeatedly.

Pages that already have PWA support: `artemis-trail.html`, `implode.html`, `phrase-a-day.html`, `tools/opengraph-preview.html`, `tools/shadertoy.html`.

## The process

Icon, meta tags, manifest, and service worker all land in a single commit.

### 1. Create an app icon (180×180 PNG)

iOS requires an opaque, square **180×180 PNG** for the Home Screen — it masks the corners itself. SVG emoji favicons work in browser tabs but are ignored for the Home Screen icon.

Save the icon to `docs/assets/icons/{app}-180.png`, where `{app}` matches the HTML filename (e.g., `artemis-trail`).

Link it in `<head>`:

```html
<link rel="apple-touch-icon" href="/assets/icons/{app}-180.png">
```

### 2. Add meta tags for standalone mode

These make the page launch without Safari chrome when opened from the Home Screen:

```html
<link rel="apple-touch-icon" href="/assets/icons/{app}-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="{Short Title}">
<link rel="manifest" href="/assets/manifest/{app}.json">
```

**Status bar style:** use `black` for dark-themed UIs (Artemis Trail, Shadertoy), `default` for lighter ones (Phrase a Day, OpenGraph Preview).

**App title:** keep it short — iOS truncates long names under the icon.

These tags go after the OG block and before GA4. See the `<head>` ordering section below.

### 3. Update viewport & add safe-area insets

Add `viewport-fit=cover` to the existing viewport meta tag so the app extends into notch and home-indicator areas:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

Then use `env(safe-area-inset-*)` in CSS to pad the main container away from device edges. The `max()` pattern preserves your existing padding as a minimum:

```css
padding: max(20px, env(safe-area-inset-top))
         max(20px, env(safe-area-inset-right))
         max(20px, env(safe-area-inset-bottom))
         max(20px, env(safe-area-inset-left));
```

Replace `20px` with whatever base padding the page already uses.

### 4. Create a web app manifest

Create `docs/assets/manifest/{app}.json`:

```json
{
  "name": "Full App Name",
  "short_name": "ShortName",
  "start_url": "/{path-to-page}.html",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000",
  "icons": [
    {
      "src": "/assets/icons/{app}-180.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

- `short_name` — the Home Screen label fallback; keep it under ~15 characters, no spaces preferred.
- `theme_color` / `background_color` — match the page's visual design.
- `start_url` — the page's path from the site root.

Link it in the `<head>` meta-tag block from Step 2.

### 5. Add a service worker (optional — for offline support)

A service worker lets the page load without a network connection. Create `docs/sw-{app}.js` with a three-tier caching strategy:

```javascript
const CACHE_NAME = '{app}-v1';
const APP_FILES = ['/{path-to-page}.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // Google Fonts — cache-first (URLs are versioned)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => Response.error());
      })
    );
    return;
  }

  // App files — network-first (online users get latest, offline falls back to cache)
  if (url.origin === self.location.origin &&
      APP_FILES.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else (GA4, etc.) — pass through, no caching
});
```

**Extra assets:** if the page loads data files at runtime, add them to the `APP_FILES` array so they're cached too (e.g., Phrase a Day caches `/assets/phrases.md`).

**Cache versioning:** bump the `-v1` suffix when you make breaking changes to force a cache refresh.

Register the service worker at the end of `<body>` in the HTML file:

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-{app}.js');
}
</script>
```

### 6. Commit

Stage the HTML change, icon, manifest, and service worker in a single commit:

```
feat(pwa): add Home Screen web app support to <page>
```

## `<head>` ordering

With all enhancements applied, the standard `<head>` ordering is:

```html
<head>
<link rel="icon" href="data:image/svg+xml,...">       <!-- 1. Favicon -->

<meta property="og:title" content="...">               <!-- 2. OG tags -->
...

<link rel="apple-touch-icon" href="...">               <!-- 3. PWA tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="...">
<meta name="apple-mobile-web-app-title" content="...">
<link rel="manifest" href="...">

<script async src="...gtag..."></script>               <!-- 4. GA4 -->
<script>...</script>

<meta charset="UTF-8">                                 <!-- 5. Everything else -->
<meta name="viewport" content="..., viewport-fit=cover">
<title>...</title>
```

## Gotchas

- iOS ignores `rel="icon"` (including SVG data URIs) for the Home Screen — `apple-touch-icon` with a PNG is required.
- The PNG must be **opaque and square**; iOS rounds the corners automatically. Transparency renders as black.
- Manifest `icons` are used by Android/Chrome but **not** by iOS for the Home Screen icon.
- `apple-touch-icon-precomposed` is legacy — modern iOS no longer adds a gloss effect, so plain `apple-touch-icon` is fine.
- iOS has no install prompt (`beforeinstallprompt`). Users must use **Share → Add to Home Screen** manually.
- Service workers must live at the site root (`docs/sw-{app}.js`) to have scope over the page they serve.

## File conventions

| Asset            | Path                                | Naming                   |
|------------------|-------------------------------------|--------------------------|
| App icon         | `docs/assets/icons/{app}-180.png`   | kebab-case, matches HTML |
| Manifest         | `docs/assets/manifest/{app}.json`   | kebab-case, matches HTML |
| Service worker   | `docs/sw-{app}.js`                  | kebab-case, matches HTML |
