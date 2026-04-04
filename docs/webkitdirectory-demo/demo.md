# webkitdirectory Demo — Browser Directory Selection in JavaScript

*2026-03-02T18:54:55Z by Showboat 0.6.1*
<!-- showboat-id: bfc94236-38ca-4728-8fe3-5f606f3e23e2 -->

This demo explores `<input type="file" webkitdirectory>` — the browser's built-in directory picker. The HTML file below is a self-contained SPA that demonstrates everything JavaScript can do once a user selects a folder: tree reconstruction, file metadata, content preview, type analysis, drag-and-drop, and the modern File System Access API.

```bash
wc -l index.html
```

```output
697 index.html
```

A single self-contained HTML file — no build step, no dependencies, no framework. Let's look at the key sections.

**Three input methods** are wired up:

1. **`<input webkitdirectory>`** — the baseline, works in all browsers since 2025
2. **`showDirectoryPicker()`** — the modern File System Access API (Chrome/Edge only)
3. **Drag & drop** — uses `DataTransferItem.webkitGetAsEntry()` for recursive traversal

Each method normalizes files into the same pipeline: a flat array of `File` objects with `webkitRelativePath` set.

```bash
grep -n 'function\|addEventListener\|async function' index.html | head -20
```

```output
396:function pickViaInput() {
401:hiddenInput.addEventListener('change', () => {
406:async function pickViaFSA() {
417:async function collectFSAFiles(dirHandle, basePath) {
438:dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('active'); });
439:dropZone.addEventListener('dragleave', () => dropZone.classList.remove('active'));
440:dropZone.addEventListener('drop', async (e) => {
455:function readEntry(entry, path, acc) {
481:function processFiles(files) {
499:function renderStats() {
518:function humanSize(bytes) {
531:function categorize(file) {
544:function renderTypeBar() {
575:function buildTree(files) {
589:function renderTree() {
596:function treeToDOM(node, isRoot) {
605:    span.addEventListener('click', (e) => {
623:    span.addEventListener('click', (e) => { e.stopPropagation(); previewFile(f); });
631:async function previewFile(file) {
676:function renderTable() {
```

**What the demo shows once a directory is selected:**

- **Stats dashboard** — file count, directory count, total size, max depth
- **Type breakdown** — color-coded bar chart categorizing files (images, text/code, audio, video, archives, fonts, etc.)
- **Interactive tree view** — reconstructed from `webkitRelativePath` strings; directories collapse/expand on click
- **File preview** — click any file in the tree to see its contents (text, images, audio) rendered inline
- **Raw file table** — every file's path, MIME type, size, and modification date

The core insight: the browser gives you a *flat* `FileList`, but `webkitRelativePath` lets you rebuild the full hierarchy client-side.

```bash
sed -n '575,588p' index.html
```

```output
function buildTree(files) {
  const root = { __files: [] };
  for (const f of files) {
    const parts = (f.webkitRelativePath || f.name).split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { __files: [] };
      node = node[parts[i]];
    }
    node.__files.push(f);
  }
  return root;
}

```

The `buildTree` function above is the heart of the directory reconstruction — it splits each `webkitRelativePath` on `/` and walks a nested object, creating branches as needed. The result is a tree where each node's keys are subdirectory names and `__files` holds the leaf `File` objects.

Also included: a `design_proposal.md` that explores what `webkitdirectory` means for self-hosted SPAs with server-side state — covering manifest-based sync protocols, chunked upload, write-back strategies, security filtering, and progressive enhancement with the File System Access API.

```bash
wc -l design_proposal.md
```

```output
364 design_proposal.md
```
