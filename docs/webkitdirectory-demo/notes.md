# webkitdirectory Demo — Working Notes

## 2026-03-02: Starting investigation

### Goal
Recreate the demo from the shared conversation that started with:
> `<input type="file" webkitdirectory>` - build a demo that shows what JS can do with this

Then create a `design_proposal.md` exploring implications for self-hosted SPAs
that manage server-side state.

### Research findings

**Core API:**
- `<input type="file" webkitdirectory>` switches the browser file picker to
  directory-selection mode
- All files in the selected directory tree are returned as a flat `FileList`
- Each `File` object has a `webkitRelativePath` property giving its path
  relative to the selected ancestor directory
- Baseline browser support since August 2025 (Chrome 7+, Firefox 50+, Edge 13+,
  Safari 11.1+)

**Modern alternative — File System Access API:**
- `showDirectoryPicker()` provides a `FileSystemDirectoryHandle`
- Allows persistent read/write access (via permissions)
- Supports incremental traversal (no upfront loading of entire tree)
- Chrome 86+, Edge 86+; not in Firefox or Safari as of early 2026

**Key capabilities to demo:**
1. Directory selection via `<input webkitdirectory>`
2. Reconstructing the directory tree from flat `webkitRelativePath` entries
3. File metadata inspection (name, size, type, lastModified)
4. Reading file contents (text, images) via FileReader / file.text()
5. Aggregate statistics (count, size by type, etc.)
6. Drag-and-drop directory support via DataTransferItem.webkitGetAsEntry()
7. Tree visualization in the DOM
8. Comparison with `showDirectoryPicker()` modern API

### Architecture decisions
- Single self-contained HTML file — no build step, no dependencies
- Progressive enhancement: webkitdirectory fallback + showDirectoryPicker when available
- Pure vanilla JS — the demo itself is the point, not a framework showcase
- Dark/light theme via `prefers-color-scheme`

### What I learned
- `webkitRelativePath` is read-only and set by the browser at selection time
- The `change` event fires once, after the entire directory is scanned
- For very large directories, the browser may take several seconds to enumerate
  files before firing the event — there's no progress callback
- `DataTransferItem.webkitGetAsEntry()` returns `FileSystemEntry` objects that
  support recursive directory reading via `createReader().readEntries()`
- The drag-and-drop API uses a different entry type than the File System Access
  API — they're not interchangeable
- For self-hosted SPAs, the key tension is: the browser gives you *read-only*
  access to file contents, but a self-hosted app may want to *write back* or
  sync state with a server, requiring an upload/sync protocol on top
