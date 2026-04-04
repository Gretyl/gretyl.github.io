# Resnick Algorithm Artifacts

*2026-03-18T21:30:18Z by Showboat 0.6.1*
<!-- showboat-id: ffc3311a-b2bd-4412-9980-22b1d7dc50b9 -->

Interactive simulations of 7 algorithms from Resnick's *Turtles, Termites, and Traffic Jams*. Each simulation separates pure algorithm logic (sim/*.js) from rendering (*.html), tested via Node.js built-in node:test.

```bash
node --test test/*.test.js 2>&1 | tail -10
```

```output
  ...
1..48
# tests 78
# suites 48
# pass 78
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 512.823281
```

All 78 tests pass across 7 simulations: traffic, boids, termites, fire, ants, slime, and predator-prey.

```bash
ls -la sim/ test/ *.html
```

```output
-rw-r--r-- 1 root root 4749 Mar 18 21:28 ants.html
-rw-r--r-- 1 root root 4425 Mar 18 21:27 boids.html
-rw-r--r-- 1 root root 4890 Mar 18 21:28 fire.html
-rw-r--r-- 1 root root 6137 Mar 18 21:29 predator-prey.html
-rw-r--r-- 1 root root 5043 Mar 18 21:29 slime.html
-rw-r--r-- 1 root root 4495 Mar 18 21:28 termites.html
-rw-r--r-- 1 root root 5454 Mar 18 21:23 traffic.html

sim/:
total 60
drwxr-xr-x 2 root root 4096 Mar 18 21:25 .
drwxr-xr-x 4 root root 4096 Mar 18 21:30 ..
-rw-r--r-- 1 root root 4854 Mar 18 21:25 ants.js
-rw-r--r-- 1 root root 5447 Mar 18 21:23 boids.js
-rw-r--r-- 1 root root 3650 Mar 18 21:24 fire.js
-rw-r--r-- 1 root root 5442 Mar 18 21:25 predator-prey.js
-rw-r--r-- 1 root root  512 Mar 18 21:21 rng.js
-rw-r--r-- 1 root root 5294 Mar 18 21:25 slime.js
-rw-r--r-- 1 root root 4282 Mar 18 21:23 termites.js
-rw-r--r-- 1 root root 3377 Mar 18 21:22 traffic.js

test/:
total 40
drwxr-xr-x 2 root root 4096 Mar 18 21:27 .
drwxr-xr-x 4 root root 4096 Mar 18 21:30 ..
-rw-r--r-- 1 root root 3517 Mar 18 21:26 ants.test.js
-rw-r--r-- 1 root root 5314 Mar 18 21:24 boids.test.js
-rw-r--r-- 1 root root 4019 Mar 18 21:26 fire.test.js
-rw-r--r-- 1 root root 4025 Mar 18 21:27 predator-prey.test.js
-rw-r--r-- 1 root root 3871 Mar 18 21:26 slime.test.js
-rw-r--r-- 1 root root 3216 Mar 18 21:24 termites.test.js
-rw-r--r-- 1 root root 3768 Mar 18 21:22 traffic.test.js
```
