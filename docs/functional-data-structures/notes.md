# Purely Functional Data Structures — Working Notes

## 2026-03-18

### Research phase
- Surveyed existing Python libraries: pyrsistent, immutables, pcollections
- Key gap: Okasaki's core structures (leftist heaps, banker's queues, binomial heaps) lack quality Python implementations
- Plan: implement 6 core structures from the book as a `pfds` package using red/green TDD

### Implementation plan
- Phase 0: Suspension (lazy eval) + Protocols/EmptyError
- Phase 1: ConsList (Ch 2)
- Phase 2: LeftistHeap (Ch 3)
- Phase 3: BinomialHeap (Ch 3)
- Phase 4: RedBlackTree (Ch 3)
- Phase 5: BankersQueue (Ch 6) — depends on Suspension + ConsList
- Phase 6: PairingHeap (Ch 5)

### Implementation notes

**Suspension** — Wraps a zero-arg callable with memoization. `_SENTINEL` object
distinguishes "not yet evaluated" from a cached `None`. Used by BankersQueue for
lazy list reversal.

**ConsList** — Classic cons cell. Uses `__new__` + manual slot assignment for the
`_make` factory to avoid `__init__` overhead. `__add__` is recursive (O(n) in
left list length) — matches Okasaki's concat. Added `__hash__` to satisfy ruff's
PLW1641 since we define `__eq__`.

**LeftistHeap** — Rank = length of rightmost spine. `_make` swaps children if
needed to enforce `rank(left) >= rank(right)`. Empty heap uses self-referential
left/right pointers (avoids Optional checks).

**BinomialHeap** — `BinomialTree` as frozen dataclass. `_ins_tree` implements
carry propagation (linking same-rank trees). `delete_min` reverses children
(decreasing → increasing rank) before merging back.

**RedBlackTree** — Okasaki's four-case balance function. Each case detects a
black node with a red child that has a red child, and rotates to produce
Red(Black, elem, Black). Root forced black after every insert.

**BankersQueue** — Two-list queue: suspended front + eager rear. When
`len(rear) > len(front)`, lazily reverse rear and append. The `_make` factory
enforces this invariant. Lambda captures use default args (`f=front, r=rear`)
to avoid closure over mutable state.

**PairingHeap** — Simplest heap. Merge is O(1) — just compare roots and make
loser a child of winner. `delete_min` uses two-pass pairing: pair adjacent
children left-to-right, then merge the pairs right-to-left.

### Lint fixes
- Renamed `R`/`B` to `red`/`blk` in balance function (ruff N806)
- Added `__hash__` to ConsList (ruff PLW1641)
- Moved `import random` to top of file (ruff PLC0415)
- Replaced `sorted(list(x))` with `sorted(x)` (ruff C414)

### Test results
- 143 tests passing across 7 test files
- All structures verified for: emptiness, protocol conformance, persistence,
  iteration, and structural invariants
