# CLAUDE.md

Project context for Claude Code sessions.

## Repository

Static GitHub Pages site — plain HTML and vanilla JavaScript. No build tools, no package manager, no tests.

## Structure

```
index.html              Site root / landing page
artemis-trail.html      Interactive lunar mission simulator
tools/
  shadertoy.html        WebGL shader IDE with live preview
  shaders.js            Shader utilities, preset library, @slider parser
```

## Conventions

- **Commits** follow conventional-commit style: `type(scope): description`
- **Default branch** is `main`
- **Deployment** is automatic via GitHub Pages on push to `main`
- All code is client-side; no server, no API keys, no secrets

## Working with this repo

- Edit HTML/JS files directly — there is nothing to compile or bundle
- Open `.html` files in a browser to test locally
- See [AGENTS.md](AGENTS.md) for agent-specific guidelines
