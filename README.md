# gretyl.github.io

Experiments in hosting and iterating on interactive artifacts with JavaScript-enabled interactivity, some with embedded metadata for social media previews.

## Navigation

- **Arcade** — standalone games, vibe coded and playable in the browser
- **Entries** — documented subprojects with demos, notes, and interactive examples
- **Tools** — utility applications for creative and development workflows
- **Tutorials** — explainers and walkthroughs, from games to machine learning

## Feeds

Subscribe to new artifacts via either feed:

- **Atom 1.0** — [`/feed.xml`](https://gretyl.maplecrew.org/feed.xml)
- **JSON Feed 1.1** — [`/feed.json`](https://gretyl.maplecrew.org/feed.json)

Both are hand-templated from a single manifest (`docs/_data/artifacts.yml`), sorted newest-first.

## Development

Static HTML and vanilla JS — no build step, no dependencies. All publishable content lives in `docs/`. Push to `main` and GitHub Pages deploys automatically via Jekyll.
