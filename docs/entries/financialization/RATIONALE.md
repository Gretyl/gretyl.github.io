# Scrollytelling Framework Choice

**Decision:** No framework. The scroll-driven interactions use three browser-native APIs:

- `IntersectionObserver` — 19 discrete step triggers
- `scroll` event listener (RAF-gated) — 2 progress-triggered steps (LBO-wave bar saturation, Sankey morph)
- `CSS position: sticky` — canvas pinning

## Candidates considered

### Scrollama

Scrollama is a convenience wrapper around `IntersectionObserver` that adds step-enter/step-exit/step-progress callbacks and handles resize debouncing. Our step logic is simple enough (21 steps, no resize-dependent threshold recalculation) that the wrapper doesn't save meaningful complexity. Adding it would mean either a CDN `<script>` tag (external dependency on a static site that currently has zero) or vendoring ~8KB of library code. The AGENTS.md instruction to "prefer simple, self-contained files over complex abstractions" pushed against it.

### GSAP ScrollTrigger

GSAP is commercially licensed for non-free work, and ScrollTrigger is its premium plugin. It excels at timeline-based choreography (sequencing multiple animations with scrub), but our acts are independent — each canvas has its own state machine, and the only continuous scrub is the Sankey morph. GSAP would also be the heaviest dependency by far (~50KB minified for core + ScrollTrigger).

## What we gave up

- **Resize handling.** Scrollama's `handleResize` and offset recalculation on viewport changes would be more robust than our static `rootMargin: '-30% 0px -30% 0px'`.
- **Scrub precision.** GSAP's `scrub` parameter would make the morph step's scroll-to-progress mapping more precise and handle edge cases (overscroll, momentum scrolling on iOS) more gracefully.
- **Reverse-scroll snapping.** Both libraries handle the "scroll backward snap" problem — where a fast reverse scroll should snap to the correct state without replaying transitions — more cleanly than our manual `if (step === actIState) return` guard.

## Revisiting this decision

If real-device testing surfaces problems with:

- Imprecise trigger thresholds on aggressive resize
- Momentum-scroll jank on the morph step (iOS Safari)
- Step-skip artifacts on fast reverse scroll

then **Scrollama is a ~5-minute drop-in replacement**. The step DOM structure (`div.step[data-step]`) is already Scrollama-compatible by convention. Swap the `IntersectionObserver` setup for `scrollama().setup()` and wire the same `updateActI`/`updateActII`/`updateActIII` callbacks to `onStepEnter`.
