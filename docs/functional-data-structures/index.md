---
layout: default
title: Purely Functional Data Structures
favicon_emoji: 🗿
---

{% include analytics.html %}

A `collections`-style Python module implementing six core data structures from
Chris Okasaki's *Purely Functional Data Structures* (1998). All structures are
persistent and immutable — operations return new instances, leaving originals
unchanged.

## Data Structures

| Structure | Okasaki Ch | Key operations | Complexity |
|---|---|---|---|
| **ConsList** | 2 | `cons`, `head`, `tail`, `reverse` | O(1) cons/head/tail |
| **LeftistHeap** | 3 | `insert`, `find_min`, `delete_min`, `merge` | O(log n) merge |
| **BinomialHeap** | 3 | `insert`, `find_min`, `delete_min`, `merge` | O(log n) amortized |
| **RedBlackTree** | 3 | `insert`, `member`, `find_min`, `find_max` | O(log n) insert/lookup |
| **BankersQueue** | 6 | `snoc`, `head`, `tail` | O(1) amortized |
| **PairingHeap** | 5 | `insert`, `find_min`, `delete_min`, `merge` | O(1) merge, O(log n) delete_min amortized |

## Usage

```python
from pfds import ConsList, LeftistHeap, BankersQueue, RedBlackTree

# Persistent linked list
xs = ConsList.from_iterable([1, 2, 3])
ys = xs.cons(0)          # ConsList(0, 1, 2, 3)
assert list(xs) == [1, 2, 3]  # original unchanged

# Min-heap with O(log n) merge
h = LeftistHeap.from_iterable([5, 3, 1, 4, 2])
h.find_min()             # 1
h2 = h.delete_min()      # LeftistHeap(2, 3, 4, 5)

# Amortized O(1) FIFO queue with lazy evaluation
q = BankersQueue().snoc(1).snoc(2).snoc(3)
q.head()                 # 1
list(q.tail())           # [2, 3]

# Balanced BST as sorted set (Okasaki's 4-case balance)
t = RedBlackTree.from_iterable([5, 3, 1, 4, 2])
list(t)                  # [1, 2, 3, 4, 5]
3 in t                   # True
```

## Design

- **Protocols**: `Heap` and `Queue` runtime-checkable protocols
- **Lazy evaluation**: `Suspension` class (memoized thunks) used by `BankersQueue`
- **Python idioms**: `__len__`, `__iter__`, `__contains__`, `__bool__`, `__repr__`, `from_iterable()`
- **EmptyError**: Subclass of `IndexError`, raised by all empty-access operations

## References

- Okasaki, C. (1998). *Purely Functional Data Structures*. Cambridge University Press.
- Okasaki, C. (1996). *Purely Functional Data Structures*. PhD thesis, CMU. CMU-CS-96-177.
