# webkitdirectory Demo

A self-contained HTML demo exploring everything JavaScript can do with
`<input type="file" webkitdirectory>` — the browser's directory picker.

## What's here

| File | Purpose |
|------|---------|
| `index.html` | The demo — open in any browser, pick a folder, explore |
| `design_proposal.md` | Design exploration: webkitdirectory for self-hosted SPAs with server-side state |
| `demo.md` | Showboat-generated walkthrough of the demo |
| `notes.md` | Working notes from the investigation |

## The demo

`index.html` is a zero-dependency, single-file SPA that demonstrates:

- **Three input methods:** `<input webkitdirectory>`, `showDirectoryPicker()`,
  and drag-and-drop — all normalized into the same processing pipeline
- **Directory tree reconstruction** from flat `webkitRelativePath` strings
- **Stats dashboard** — file count, directory count, total size, max depth
- **Type breakdown** — color-coded proportional bar chart
- **Interactive tree view** — expand/collapse directories, click files to preview
- **File content preview** — renders text, images, and audio inline
- **Raw file table** — every file's path, MIME type, size, and modification date

### Running it

```bash
open index.html
# or
python3 -m http.server 8000  # then visit localhost:8000
```

No build step. No dependencies. Just HTML, CSS, and vanilla JavaScript.

## The design proposal

`design_proposal.md` explores what `webkitdirectory` means for **self-hosted
SPAs that manage server-side state** — project IDEs, note-taking tools,
media managers, and similar systems. It covers:

- The three browser APIs for directory access and their trade-offs
- Ingestion patterns: bulk upload, manifest-based diffing, chunked streaming
- Write-back strategies (the hard part — `webkitdirectory` is read-only)
- Three architecture patterns (client-heavy, server-heavy, hybrid)
- Security considerations: sensitive file filtering, memory pressure, CORS
- Practical size limits and performance characteristics
- Concrete recommendations for implementation

## Key insight

The browser's `webkitdirectory` gives you a **read-only snapshot** — a flat
`FileList` with path metadata. For a self-hosted SPA, the real design work
is in the **sync protocol** between that ephemeral client snapshot and the
server's persistent state. Use `showDirectoryPicker()` as a progressive
enhancement for bidirectional sync where browser support allows it.
