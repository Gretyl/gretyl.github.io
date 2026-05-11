// fs-shim.js — in-memory filesystem backing for the Go WASM runtime.
//
// Go's `wasm_exec.js` reaches for `globalThis.fs` (a Node-fs-shaped API) for
// file I/O. In the browser there's no Node fs; we provide our own backed by
// a flat Map<absolute-path, Uint8Array>. Surface implemented:
//
//   open / close / fstat / stat / lstat / readdir
//   read   (random-access reads from in-memory buffers)
//   write  (writes to a per-fd output buffer; output captured on close)
//   writeSync (used by Go's println for stdout/stderr — line-buffered)
//
// Anything else (chmod, chown, link, symlink, …) returns ENOSYS — Go's
// stdlib treats those as advisory and tolerates the rejection.
//
// The shim is constructed per compile invocation. Each instance also
// installs a stub `globalThis.process` that satisfies Go's `os.Getwd()`
// and `os.Chdir()` calls (cwd defaults to "/").

const enc = new TextEncoder();
const dec = new TextDecoder();

// POSIX errno literals Go's os package recognises by string.
function makeErr(code, syscall = 'wasm-fs-shim') {
  const e = new Error(code);
  e.code = code;
  e.syscall = syscall;
  return e;
}

const NOW = Date.now();

function makeStat(size, isDir) {
  // Mirrors what Node's fs.Stats provides; Go consumes both the numeric
  // mode field and the is*() functions.
  const mode = isDir ? 0o040755 : 0o100644;
  return {
    dev: 0, ino: 0, mode,
    nlink: 1, uid: 0, gid: 0, rdev: 0,
    size, blksize: 4096, blocks: Math.ceil(size / 512) || 0,
    atimeMs: NOW, mtimeMs: NOW, ctimeMs: NOW, birthtimeMs: NOW,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  };
}

// Normalize "a//b/./c" → "/a/b/c", "" → "/".
function normalize(p) {
  if (!p) return '/';
  const parts = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') { parts.pop(); continue; }
    parts.push(seg);
  }
  return '/' + parts.join('/');
}

// Build a memfs from a {path: string|Uint8Array} dict.
//
// Files are stored at normalized absolute paths. Directories are derived
// implicitly from the set of file paths — readdir(p) returns the unique
// next-segment names for any path that has children. tweego only needs
// this much: it never mkdir's anything that wasn't already implied.
export function createFsShim({ files = {}, captureStdout = false } = {}) {
  const fileMap = new Map();      // path → Uint8Array
  const writeBuffers = new Map(); // fd → { path, chunks: Uint8Array[], total: number }
  const openFds = new Map();      // fd → { path, position: number, isWrite: boolean }
  let nextFd = 10;
  let stdoutBuf = '';
  let stderrBuf = '';
  const stdoutLines = [];
  const stderrLines = [];

  for (const [p, content] of Object.entries(files)) {
    const np = normalize(p);
    const bytes = typeof content === 'string' ? enc.encode(content) : content;
    fileMap.set(np, bytes);
  }

  function isDirectory(p) {
    const np = normalize(p);
    if (np === '/') return true;
    if (fileMap.has(np)) return false;
    const prefix = np.endsWith('/') ? np : np + '/';
    for (const k of fileMap.keys()) if (k.startsWith(prefix)) return true;
    return false;
  }

  function readDir(p) {
    const np = normalize(p);
    const prefix = np === '/' ? '/' : np + '/';
    const out = new Set();
    for (const k of fileMap.keys()) {
      if (!k.startsWith(prefix)) continue;
      const rest = k.slice(prefix.length);
      const seg = rest.split('/')[0];
      if (seg) out.add(seg);
    }
    return [...out].sort();
  }

  function statPath(p) {
    const np = normalize(p);
    if (fileMap.has(np)) return makeStat(fileMap.get(np).byteLength, false);
    if (isDirectory(np)) return makeStat(0, true);
    return null;
  }

  // wasm_exec.js writes through fs.writeSync for stdout/stderr (fd 1/2).
  function writeSync(fd, buf) {
    const text = dec.decode(buf);
    if (fd === 1) {
      stdoutBuf += text;
      let nl;
      while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
        const line = stdoutBuf.slice(0, nl);
        stdoutLines.push(line);
        if (!captureStdout) console.log(line);
        stdoutBuf = stdoutBuf.slice(nl + 1);
      }
    } else if (fd === 2) {
      stderrBuf += text;
      let nl;
      while ((nl = stderrBuf.indexOf('\n')) !== -1) {
        const line = stderrBuf.slice(0, nl);
        stderrLines.push(line);
        if (!captureStdout) console.error(line);
        stderrBuf = stderrBuf.slice(nl + 1);
      }
    } else {
      const wb = writeBuffers.get(fd);
      if (wb) {
        wb.chunks.push(buf.slice());
        wb.total += buf.length;
      }
    }
    return buf.length;
  }

  const fs = {
    constants: {
      O_RDONLY: 0, O_WRONLY: 1, O_RDWR: 2,
      O_CREAT: 64, O_EXCL: 128, O_TRUNC: 512, O_APPEND: 1024,
      O_DIRECTORY: 65536,
    },

    writeSync,

    write(fd, buf, offset, length, position, cb) {
      // Go calls fs.write for non-stdout writes too. Honor offset/length.
      if (offset !== 0 || length !== buf.length || position !== null) {
        // Random-access write; rare for tweego but support the basics.
        const slice = buf.subarray(offset, offset + length);
        const n = writeSync(fd, slice);
        cb(null, n);
        return;
      }
      const n = writeSync(fd, buf);
      cb(null, n);
    },

    open(path, flags, mode, cb) {
      const np = normalize(path);
      const isWrite = (flags & 3) !== 0;          // O_WRONLY or O_RDWR
      const isCreate = (flags & 64) !== 0;        // O_CREAT
      if (!isWrite) {
        if (fileMap.has(np)) {
          const fd = nextFd++;
          openFds.set(fd, { path: np, position: 0, isWrite: false, isDir: false });
          cb(null, fd);
          return;
        }
        // tweego does os.Open(dir) then Readdirnames; permit directory open.
        if (isDirectory(np)) {
          const fd = nextFd++;
          openFds.set(fd, { path: np, position: 0, isWrite: false, isDir: true });
          cb(null, fd);
          return;
        }
        cb(makeErr('ENOENT', 'open'));
        return;
      }
      // Write path: O_TRUNC clears, O_CREAT allows new file.
      if (!fileMap.has(np) && !isCreate) { cb(makeErr('ENOENT', 'open')); return; }
      const fd = nextFd++;
      writeBuffers.set(fd, { path: np, chunks: [], total: 0 });
      openFds.set(fd, { path: np, position: 0, isWrite: true, isDir: false });
      cb(null, fd);
    },

    close(fd, cb) {
      const wb = writeBuffers.get(fd);
      if (wb) {
        const out = new Uint8Array(wb.total);
        let off = 0;
        for (const c of wb.chunks) { out.set(c, off); off += c.byteLength; }
        fileMap.set(wb.path, out);
        writeBuffers.delete(fd);
      }
      openFds.delete(fd);
      cb(null);
    },

    read(fd, buffer, offset, length, position, cb) {
      const e = openFds.get(fd);
      if (!e) { cb(makeErr('EBADF', 'read')); return; }
      const data = fileMap.get(e.path);
      if (!data) { cb(makeErr('ENOENT', 'read')); return; }
      const start = position == null ? e.position : position;
      const end = Math.min(data.byteLength, start + length);
      const n = Math.max(0, end - start);
      buffer.set(data.subarray(start, end), offset);
      if (position == null) e.position = end;
      cb(null, n);
    },

    fstat(fd, cb) {
      const e = openFds.get(fd);
      if (!e) { cb(makeErr('EBADF', 'fstat')); return; }
      if (e.isDir) { cb(null, makeStat(0, true)); return; }
      const data = fileMap.get(e.path);
      if (!data && !isDirectory(e.path)) { cb(makeErr('ENOENT', 'fstat')); return; }
      cb(null, makeStat(data ? data.byteLength : 0, !data));
    },

    stat(path, cb) {
      const s = statPath(path);
      if (!s) { cb(makeErr('ENOENT', 'stat')); return; }
      cb(null, s);
    },

    lstat(path, cb) {
      const s = statPath(path);
      if (!s) { cb(makeErr('ENOENT', 'lstat')); return; }
      cb(null, s);
    },

    readdir(path, cb) {
      if (!isDirectory(path)) { cb(makeErr('ENOENT', 'readdir')); return; }
      cb(null, readDir(path));
    },

    mkdir(_path, _perm, cb) { cb(null); },           // implicit dirs
    unlink(path, cb)        { fileMap.delete(normalize(path)); cb(null); },
    rmdir(_path, cb)        { cb(null); },
    rename(from, to, cb)    {
      const f = normalize(from), t = normalize(to);
      const v = fileMap.get(f);
      if (!v) { cb(makeErr('ENOENT', 'rename')); return; }
      fileMap.set(t, v); fileMap.delete(f); cb(null);
    },

    chmod(_p, _m, cb)      { cb(null); },
    fchmod(_fd, _m, cb)    { cb(null); },
    chown(_p, _u, _g, cb)  { cb(null); },
    fchown(_f, _u, _g, cb) { cb(null); },
    lchown(_p, _u, _g, cb) { cb(null); },
    fsync(_fd, cb)         { cb(null); },
    ftruncate(_fd, _l, cb) { cb(null); },
    truncate(_p, _l, cb)   { cb(null); },
    utimes(_p, _a, _m, cb) { cb(null); },
    link(_f, _l, cb)       { cb(makeErr('ENOSYS', 'link')); },
    symlink(_p, _l, cb)    { cb(makeErr('ENOSYS', 'symlink')); },
    readlink(_p, cb)       { cb(makeErr('EINVAL', 'readlink')); },
  };

  // The Go runtime calls process.cwd() for relative-path resolution; with
  // no cwd it throws ENOSYS and tweego dies looking for `./storyformats`.
  // Default cwd is "/" — files map keys are absolute, so the match works.
  let cwd = '/';
  const proc = {
    getuid: () => 1, getgid: () => 1, geteuid: () => 1, getegid: () => 1,
    getgroups: () => [],
    pid: 1, ppid: 0,
    umask: () => 0,
    cwd: () => cwd,
    chdir: (p) => { cwd = normalize(p); },
  };

  return {
    fs,
    process: proc,
    files: fileMap,
    readOutput(path) {
      const np = normalize(path);
      return fileMap.get(np) ?? null;
    },
    stdout: () => stdoutLines.slice(),
    stderr: () => stderrLines.slice(),
  };
}
