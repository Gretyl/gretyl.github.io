---
layout: default
title: webkitdirectory Demo
---

A self-contained HTML demo exploring everything JavaScript can do with
`<input type="file" webkitdirectory>` — the browser's directory picker.

**[Launch the demo](index.html)**

## Features

- **Three input methods:** `<input webkitdirectory>`, `showDirectoryPicker()`,
  and drag-and-drop — all normalized into the same processing pipeline
- **Directory tree reconstruction** from flat `webkitRelativePath` strings
- **Stats dashboard** — file count, directory count, total size, max depth
- **Type breakdown** — color-coded proportional bar chart
- **Interactive tree view** — expand/collapse directories, click files to preview
- **File content preview** — renders text, images, and audio inline
- **Raw file table** — every file's path, MIME type, size, and modification date

No build step. No dependencies. Just HTML, CSS, and vanilla JavaScript.

## Key insight

The browser's `webkitdirectory` gives you a **read-only snapshot** — a flat
`FileList` with path metadata. For a self-hosted SPA, the real design work
is in the **sync protocol** between that ephemeral client snapshot and the
server's persistent state. Use `showDirectoryPicker()` as a progressive
enhancement for bidirectional sync where browser support allows it.
