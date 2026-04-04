# Purely Functional Data Structures

*2026-03-18T22:59:10Z by Showboat 0.6.1*
<!-- showboat-id: 628ae0e4-9a9e-4121-bda7-c7979b644e3c -->

Python implementations of six core data structures from Okasaki's Purely Functional Data Structures (1998). All structures are persistent/immutable — every operation returns a new instance.

```python3

import sys; sys.path.insert(0, '.')
from pfds import ConsList, LeftistHeap, BinomialHeap, RedBlackTree, BankersQueue, PairingHeap

# ConsList — persistent linked list
xs = ConsList.from_iterable([1, 2, 3])
ys = xs.cons(0)
print('ConsList:')
print(f'  xs = {xs}')
print(f'  ys = xs.cons(0) = {ys}')
print(f'  xs unchanged: {list(xs)}')
print()

# LeftistHeap — merge in O(log n)
h1 = LeftistHeap.from_iterable([5, 3, 1])
h2 = LeftistHeap.from_iterable([4, 2])
merged = h1.merge(h2)
print('LeftistHeap:')
print(f'  h1 = {h1}')
print(f'  h2 = {h2}')
print(f'  merged = {merged}')
print(f'  min = {merged.find_min()}')
print()

# BankersQueue — amortized O(1) FIFO
q = BankersQueue()
for i in range(1, 6):
    q = q.snoc(i)
print('BankersQueue:')
print(f'  q = {q}')
print(f'  head = {q.head()}')
print(f'  after tail = {q.tail()}')
print()

# RedBlackTree — balanced BST as sorted set
t = RedBlackTree.from_iterable([5, 3, 1, 4, 2])
print('RedBlackTree:')
print(f'  t = {t}')
print(f'  3 in t: {3 in t}')
print(f'  9 in t: {9 in t}')
print(f'  min={t.find_min()}, max={t.find_max()}')

```

```output
ConsList:
  xs = ConsList(1, 2, 3)
  ys = xs.cons(0) = ConsList(0, 1, 2, 3)
  xs unchanged: [1, 2, 3]

LeftistHeap:
  h1 = LeftistHeap(1, 3, 5)
  h2 = LeftistHeap(2, 4)
  merged = LeftistHeap(1, 2, 3, 4, 5)
  min = 1

BankersQueue:
  q = BankersQueue(1, 2, 3, 4, 5)
  head = 1
  after tail = BankersQueue(2, 3, 4, 5)

RedBlackTree:
  t = RedBlackTree(1, 2, 3, 4, 5)
  3 in t: True
  9 in t: False
  min=1, max=5
```

```bash
uv run pytest tests/ -v --tb=no 2>&1 | tail -20
```

```output
tests/test_red_black_tree.py::TestSortedIteration::test_in_order PASSED  [ 88%]
tests/test_red_black_tree.py::TestSortedIteration::test_large_random PASSED [ 88%]
tests/test_red_black_tree.py::TestFindMinMax::test_find_min PASSED       [ 89%]
tests/test_red_black_tree.py::TestFindMinMax::test_find_max PASSED       [ 90%]
tests/test_red_black_tree.py::TestFromIterable::test_from_iterable PASSED [ 90%]
tests/test_red_black_tree.py::TestFromIterable::test_from_iterable_empty PASSED [ 91%]
tests/test_red_black_tree.py::TestBalanceInvariants::test_root_is_black PASSED [ 92%]
tests/test_red_black_tree.py::TestBalanceInvariants::test_no_consecutive_reds PASSED [ 93%]
tests/test_red_black_tree.py::TestBalanceInvariants::test_equal_black_height PASSED [ 93%]
tests/test_red_black_tree.py::TestRepr::test_repr PASSED                 [ 94%]
tests/test_red_black_tree.py::TestRepr::test_repr_empty PASSED           [ 95%]
tests/test_suspension.py::TestSuspension::test_force_returns_value PASSED [ 95%]
tests/test_suspension.py::TestSuspension::test_force_memoizes PASSED     [ 96%]
tests/test_suspension.py::TestSuspension::test_from_value PASSED         [ 97%]
tests/test_suspension.py::TestSuspension::test_from_value_never_calls_thunk PASSED [ 97%]
tests/test_suspension.py::TestSuspension::test_force_with_complex_computation PASSED [ 98%]
tests/test_suspension.py::TestSuspension::test_repr PASSED               [ 99%]
tests/test_suspension.py::TestSuspension::test_force_propagates_exception PASSED [100%]

============================= 143 passed in 0.12s ==============================
```
