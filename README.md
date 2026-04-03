# gretyl.github.io

Personal GitHub Pages site with interactive tools and experiments, served via Jekyll with the [Minimal](https://github.com/pages-themes/minimal) theme.

## What's here

- [Artemis Trail](docs/artemis-trail.html) — interactive lunar mission simulator
- [WebGL Shadertoy harness](docs/tools/shadertoy.html) — shader IDE with `@slider` annotations for live parameter tuning

## Repo structure

```
docs/               ← GitHub Pages publishing source
  _config.yml       ← Jekyll config (minimal theme)
  index.html
  artemis-trail.html
  tools/
    shadertoy.html
AGENTS.md           ← guidelines for AI agents
CLAUDE.md
```

## Development

Static HTML and vanilla JS — no build step, no dependencies. All publishable content lives in `docs/`. Push to `main` and GitHub Pages deploys automatically via Jekyll.
