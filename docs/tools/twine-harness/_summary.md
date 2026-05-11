The Twine Harness compiles Twee 3 source to playable HTML entirely in the
browser via a WASM-compiled Tweego, then renders the compiled story in a
sandboxed iframe with a strict CSP that blocks outbound network access.
Bundled story formats: SugarCube 2, Harlowe 3, Snowman 2, Chapbook 1.

Key properties:
- No server roundtrip; tweego runs entirely in-page from `tweego.wasm`.
- Compiled stories run in a `sandbox="allow-scripts"` iframe with no
  same-origin access and a `connect-src 'none'` CSP injected at preview time.
- Downloaded `.html.gz` artifacts are unmodified tweego output, suitable
  for hosting elsewhere.
