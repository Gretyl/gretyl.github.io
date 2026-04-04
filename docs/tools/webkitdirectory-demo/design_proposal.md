# Design Proposal: `<input webkitdirectory>` for Self-Hosted SPAs with Server-Side State

## Abstract

The `webkitdirectory` attribute on `<input type="file">` lets a browser
hand an entire directory tree to JavaScript — recursively, in one gesture.
This document explores what that capability means for **self-hosted
single-page applications** that maintain authoritative state on a server:
project IDEs, note-taking tools, media managers, local-first sync engines,
and similar systems where the browser acts as both UI and ingestion
pipeline.

---

## 1. What the Browser Gives You

When a user selects a directory, the browser enumerates every file in the
subtree and surfaces them as a flat `FileList`. Each `File` object carries:

| Property               | Value                                         |
|------------------------|-----------------------------------------------|
| `name`                 | Filename (leaf)                                |
| `webkitRelativePath`   | Full path from the selected root, e.g. `project/src/main.rs` |
| `size`                 | Byte length                                    |
| `type`                 | MIME type (best-effort, from extension)         |
| `lastModified`         | Unix-epoch millisecond timestamp                |

The `webkitRelativePath` is the critical field — it preserves the directory
hierarchy as a string, letting you reconstruct the tree on the client
without any server involvement.

### 1.1 Three Ways In

| Method | Trigger | API Surface | Browser Support |
|--------|---------|-------------|-----------------|
| `<input webkitdirectory>` | Click / programmatic `.click()` | `input.files` (FileList) | Baseline 2025 — all major browsers |
| Drag & drop | Drop event | `DataTransferItem.webkitGetAsEntry()` → `FileSystemEntry` tree | Chrome, Firefox, Edge, Safari |
| `showDirectoryPicker()` | JS call (requires gesture) | `FileSystemDirectoryHandle` with async iteration | Chrome 86+, Edge 86+; **no Firefox/Safari** |

For a self-hosted SPA that must work everywhere, `webkitdirectory` is the
only reliable baseline. The File System Access API
(`showDirectoryPicker`) is a powerful progressive enhancement — it enables
**write-back** and **persistent permissions** — but cannot be the sole
path.

### 1.2 What You *Don't* Get

- **No write access.** `webkitdirectory` is strictly read-only. The
  browser gives you *copies* of file contents; it does not give you a
  handle back to the filesystem.
- **No incremental updates.** There is no "watch" or "poll" mode. If the
  user changes a file on disk, the SPA does not know unless the user
  re-selects the directory.
- **No progress during enumeration.** The browser scans the entire tree
  before firing the `change` event. For large directories (100k+ files)
  this can take several seconds with no feedback.
- **No filtering.** You get everything — `.git/`, `node_modules/`,
  `.DS_Store`, binary blobs. The SPA must filter client-side.

---

## 2. The Server-State Problem

A self-hosted SPA typically runs a local server (or a server on a
home/office machine) that owns the canonical data — a database, a file
store, a project index. The browser is a thin client that reads and
writes through an API.

`webkitdirectory` inverts this: the browser suddenly holds a
potentially large dataset that the server has never seen. The question
becomes: **how do you reconcile a client-side directory snapshot with
server-side state?**

### 2.1 Ingestion: Bulk Upload

The simplest model: the client reads files and POSTs them to the server.

```
Browser                          Server
──────                          ──────
User picks directory
  → FileList (N files)
  → for each file:
      POST /api/files
        { path, content, size, modified }
  → Server stores, indexes, responds
```

**Considerations:**

- **Bandwidth.** A modest project (10k files, 200 MB) requires 200 MB of
  upload — fine on localhost, painful over a WAN.
- **Atomicity.** Uploading file-by-file leaves the server in a
  partially-updated state during transit. The server needs a transaction
  or staging concept.
- **Deduplication.** On re-upload, you want to skip unchanged files.
  The client can send `{ path, size, lastModified }` manifests first;
  the server responds with the delta; the client uploads only what changed.

### 2.2 Sync: Manifest-Based Diffing

A more sophisticated model treats the directory as a **snapshot** and diffs
it against the server's known state.

```
1. Client builds manifest:
     [ { path, size, lastModified, hash? }, … ]

2. Client sends manifest to server:
     POST /api/sync/diff  → body: manifest

3. Server compares with its index, returns:
     { upload: [paths…], delete: [paths…], unchanged: N }

4. Client uploads only the files in the `upload` list.

5. Server removes files in the `delete` list (or marks them deleted).
```

This requires the client to compute **content hashes** for diffing (since
`lastModified` is unreliable across machines). The Web Crypto API makes
SHA-256 fast:

```js
async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
```

Hashing 200 MB of files client-side takes ~1–2 seconds in a modern
browser, which is acceptable.

### 2.3 Streaming: Chunked Upload with Progress

For very large directories (multi-GB), uploading everything at once is
impractical. A chunked protocol lets the SPA:

1. **Initiate a session** — `POST /api/upload/start → { sessionId }`
2. **Stream files** — `POST /api/upload/{sessionId}/file` with chunked
   transfer encoding or `ReadableStream` body
3. **Finalize** — `POST /api/upload/{sessionId}/commit`

The server can process files as they arrive (indexing, thumbnailing,
virus-scanning) rather than waiting for the complete upload.

### 2.4 Write-Back: The Hard Part

With `webkitdirectory` alone, there is no way to write changes back to
the user's filesystem. The SPA can:

- **Download modified files** as a zip or individual downloads
- **Use `showDirectoryPicker()`** where available, which provides
  writable `FileSystemFileHandle` objects and persistent permissions
- **Run a local companion agent** (like a sidecar daemon or browser
  extension) that bridges the SPA to the local filesystem

For a **self-hosted** SPA, the most natural write-back path is through
the server itself — the server can write to the local filesystem
directly. The browser's role is ingestion and UI, not storage.

---

## 3. Architecture Patterns

### 3.1 Pattern A: Client-Heavy Ingestion

```
┌─────────────────────┐     ┌───────────────┐
│  Browser (SPA)      │     │  Server        │
│                     │     │               │
│  webkitdirectory ───┼──→  │  /api/files   │
│  ↓ FileList         │     │  ↓            │
│  ↓ hash + filter    │     │  store to DB  │
│  ↓ upload changed   │     │  + filesystem │
│  ↓ render tree      │     │               │
└─────────────────────┘     └───────────────┘
```

The browser does all filtering, hashing, and diffing. The server is a
dumb store. Good for small-to-medium directories where the client has
plenty of compute.

### 3.2 Pattern B: Server-Heavy Processing

```
┌─────────────────────┐     ┌───────────────────┐
│  Browser (SPA)      │     │  Server            │
│                     │     │                   │
│  webkitdirectory ───┼──→  │  /api/ingest      │
│  ↓ FileList         │     │  ↓ receive stream │
│  ↓ stream to server │     │  ↓ hash, index   │
│  ↓ render progress  │     │  ↓ diff with DB  │
│                     │  ←──┼  ↓ return result  │
└─────────────────────┘     └───────────────────┘
```

The client streams raw files; the server handles hashing, diffing, and
indexing. Better for large directories or constrained client devices.

### 3.3 Pattern C: Hybrid with File System Access API

```
┌─────────────────────────────────────────────┐
│  Browser (SPA)                              │
│                                             │
│  showDirectoryPicker() → dirHandle          │
│    ↓ read files, sync to server             │
│    ↓ receive server edits                   │
│    ↓ write back via FileSystemFileHandle    │
│                                             │
│  Fallback: webkitdirectory (read-only)      │
│    ↓ upload to server                       │
│    ↓ download zip for write-back            │
└─────────────────────────────────────────────┘
```

The gold standard — true bidirectional sync where supported, graceful
degradation elsewhere.

---

## 4. Security and UX Considerations

### 4.1 What the User Sees

When `webkitdirectory` triggers the picker, browsers show a **warning
dialog** explaining that the entire directory will be shared. This is
good — it sets expectations — but it means:

- The user must explicitly confirm directory access every time
- There is no "remember this directory" capability (unlike
  `showDirectoryPicker`, which can persist permissions)
- Users may be alarmed by "upload entire folder" language

### 4.2 Sensitive File Exposure

A directory selection can include:

- `.env` files with secrets
- `.git/` with commit history and credentials
- `node_modules/` with thousands of irrelevant files
- OS metadata (`.DS_Store`, `Thumbs.db`, `desktop.ini`)

**The SPA must filter aggressively.** A sensible default ignore list:

```js
const IGNORE_PATTERNS = [
  /^\.git\//,
  /^\.svn\//,
  /\/node_modules\//,
  /\/\.env/,
  /\/\.DS_Store$/,
  /\/Thumbs\.db$/,
  /\/desktop\.ini$/,
  /\/__pycache__\//,
  /\/\.venv\//,
];

function shouldInclude(relativePath) {
  return !IGNORE_PATTERNS.some(p => p.test(relativePath));
}
```

### 4.3 Memory Pressure

The browser holds all `File` objects in memory. For large directories:

- **Don't read all contents eagerly.** The `File` objects are lightweight
  (metadata only) until you call `.text()`, `.arrayBuffer()`, or
  `.stream()`.
- **Process in batches.** Read and upload files in groups of 10–50 to
  avoid blowing the memory budget.
- **Release references.** Once uploaded, drop the `File` reference and
  any `ObjectURL` you created.

### 4.4 CORS and Self-Hosted Context

Self-hosted SPAs typically serve the frontend and API from the same
origin, so CORS is not a concern. However, if the SPA and API run on
different ports (e.g., Vite dev server on `:5173`, API on `:8000`),
ensure the API sets appropriate CORS headers for file uploads.

---

## 5. Practical Size Limits

| Scenario | Files | Size | Client Hash Time | Upload (localhost) | Upload (LAN) |
|----------|-------|------|------------------|--------------------|---------------|
| Small project | 100 | 2 MB | ~50ms | instant | ~1s |
| Medium project | 5,000 | 50 MB | ~500ms | ~1s | ~10s |
| Large project | 50,000 | 500 MB | ~5s | ~5s | ~60s |
| Photo library | 10,000 | 20 GB | ~60s | ~30s | ~10min |

For the photo-library case, chunked streaming with progress UI is
essential. For projects up to ~500 MB, manifest-based diffing with
client-side hashing is fast enough to feel interactive.

---

## 6. Recommendations for Implementation

### For a self-hosted SPA that manages server-side state:

1. **Use `webkitdirectory` as the baseline ingestion method.** It works
   everywhere and requires no special permissions beyond the file picker.

2. **Build a manifest-diff protocol.** Don't upload everything every time.
   Hash on the client, diff on the server, upload only what changed.

3. **Filter aggressively on the client.** Strip `.git/`, `node_modules/`,
   and other noise before hashing or uploading.

4. **Show progress.** Directory enumeration and hashing are synchronous
   from the user's perspective. Use a progress bar during upload and
   provide file counts during the (opaque) browser enumeration phase.

5. **Progressively enhance with `showDirectoryPicker()`.** Where
   available, it provides persistent permissions (no re-picking),
   incremental access (no upfront scan), and write-back capability.

6. **Design the server to be the write-back authority.** Since the browser
   can't write to disk via `webkitdirectory`, the server should handle
   filesystem mutations and offer download/export for clients that lack
   `showDirectoryPicker()`.

7. **Keep the upload protocol resumable.** Network interruptions on a
   multi-gigabyte upload shouldn't force a restart. Use session-based
   chunked uploads with server-side tracking of what's been received.

---

## 7. Open Questions

- **Should the SPA maintain a client-side cache (IndexedDB) of the last
  known directory state?** This would enable instant diffing on
  re-selection without a server round-trip, but adds complexity.

- **How should conflict resolution work when both the server and the
  user's local directory have changed?** Last-write-wins is simple but
  lossy. Three-way merge is complex but preserves intent.

- **Is there a role for Web Workers?** Hashing large files on the main
  thread blocks the UI. Offloading to a Worker is straightforward but
  requires transferring `File` objects (which is supported).

- **What about the Origin Private File System (OPFS)?** OPFS provides a
  sandboxed, high-performance filesystem in the browser. It could serve
  as a client-side cache/staging area, bridging the gap between
  `webkitdirectory` reads and server uploads.

---

## 8. Conclusion

`<input webkitdirectory>` turns the browser into a directory scanner. For
self-hosted SPAs, this is a powerful ingestion primitive — but it's only
the first step. The real design work is in the **sync protocol** between
the client's ephemeral directory snapshot and the server's persistent
state. The key insight: treat `webkitdirectory` as a **read-only snapshot
source**, not a bidirectional sync endpoint, and build your upload/diff
protocol accordingly. Use `showDirectoryPicker()` as a progressive
enhancement for the richer, bidirectional case.
