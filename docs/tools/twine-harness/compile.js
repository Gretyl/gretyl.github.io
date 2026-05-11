// compile.js — environment-agnostic harness around tweego.wasm.
//
// Two entry points, layered:
//
//   createCompiler({ wasmModule, GoCtor, storyformats })
//      → low-level. Caller supplies a cached WebAssembly.Module, the
//        wasm_exec.js Go constructor, and the bundled storyformats. We
//        return { compile({source, format}): Promise<string> }.
//
//   compileTwee({ source, format })
//      → high-level. Lazily fetches tweego.wasm + storyformats.js + sets
//        up wasm_exec.js the first time it's called. Browser-only — Node
//        tests use createCompiler directly via test/helper.mjs.
//
// Each compile call:
//   - builds a fresh fs-shim populated with /src/story.twee plus
//     /storyformats/<id>/{format.js, ...} for every bundled format;
//   - installs the shim as globalThis.fs / globalThis.process;
//   - instantiates a fresh Go runtime against the cached Module;
//   - runs `tweego -o /out.html /src/story.twee`;
//   - drains Go's pending timers (else they fire post-exit);
//   - reads /out.html out of the shim and returns it as a UTF-8 string.

import { createFsShim } from './fs-shim.js';

function decodeBase64(b64) {
  // Browser: atob(); Node 16+: Buffer.from(b64, 'base64').
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(b64, 'base64'));
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Lay down the storyformats under /storyformats/<id>/format.js so tweego's
// disk-discovery sees them. Caller can pass a subset to keep RAM down,
// but the default sends everything bundle-storyformats.mjs emitted.
export function buildStoryformatFiles(storyformats) {
  const out = {};
  for (const [id, entry] of Object.entries(storyformats)) {
    out[`/storyformats/${id}/format.js`] = decodeBase64(entry.b64);
  }
  return out;
}

export function createCompiler({ wasmModule, GoCtor, storyformats }) {
  if (!wasmModule) throw new Error('createCompiler: wasmModule is required');
  if (!GoCtor) throw new Error('createCompiler: GoCtor is required');
  if (!storyformats) throw new Error('createCompiler: storyformats is required');

  const formatFiles = buildStoryformatFiles(storyformats);
  const dec = new TextDecoder();

  return {
    async compile({ source, format }) {
      if (typeof source !== 'string') {
        throw new TypeError('compile: source must be a string');
      }

      // Fresh shim per compile so nothing leaks between runs.
      const shim = createFsShim({
        files: {
          '/src/story.twee': source,
          ...formatFiles,
        },
        captureStdout: true,
      });

      const result = { html: '', errors: [] };

      const prevFs = globalThis.fs;
      const prevProcess = globalThis.process;
      globalThis.fs = shim.fs;
      // In Node, process is a real object we can't replace. Splice in our
      // cwd/chdir while leaving the rest of process intact.
      if (prevProcess && typeof prevProcess === 'object' && !globalThis.__wasmTwineCompilerSpliced) {
        Object.defineProperty(globalThis, 'process', {
          value: new Proxy(prevProcess, {
            get(target, p) {
              if (p in shim.process && typeof shim.process[p] === 'function') return shim.process[p];
              return target[p];
            },
          }),
          configurable: true,
        });
        globalThis.__wasmTwineCompilerSpliced = true;
      } else if (!prevProcess) {
        globalThis.process = shim.process;
      }

      const argv = ['tweego', '-o', '/out.html', '/src/story.twee'];
      if (format) {
        argv.splice(1, 0, '-f', format);  // tweego's -f overrides StoryData.format
      }

      try {
        const go = new GoCtor();
        go.argv = argv;
        go.env = {};
        let exitCode = 0;
        // wasm_exec.js reassigns its own go.exit during run(); save off the
        // captured code via the resolveExitPromise hook by overriding _exit.
        // Simpler: read the warning-only console output. We capture exit
        // implicitly via the stderr drain plus the existence of /out.html.
        go.exit = (code) => { exitCode = code; };

        const inst = await WebAssembly.instantiate(wasmModule, go.importObject);
        await go.run(inst);

        // Drain timers wasm_exec scheduled before exit; otherwise they
        // fire after the instance is gone and throw "Go program has
        // already exited". (See notes.md / bench-warm.mjs.)
        if (go._scheduledTimeouts) {
          for (const id of go._scheduledTimeouts.values()) clearTimeout(id);
          go._scheduledTimeouts.clear();
        }

        const out = shim.readOutput('/out.html');
        result.html = out ? dec.decode(out) : '';
        result.errors = parseStderr(shim.stderr());

        // If tweego exited non-zero but produced no parseable per-line
        // errors, surface the raw stderr as a synthetic line-0 entry so
        // the caller still has something useful to show the user.
        if (exitCode !== 0 && result.errors.length === 0) {
          const raw = shim.stderr().join('\n').trim();
          if (raw) result.errors.push({ line: 0, message: raw });
        }

        return result;
      } finally {
        globalThis.fs = prevFs;
      }
    },
  };
}

// Parse tweego's stderr into structured {line, message} entries.
// Recognised forms:
//
//   error: load /src/story.twee: line 9: Malformed twee source; passage with no name.
//   warning: load /src/story.twee: line 5: Malformed twee source; ...
//
// Anything that doesn't match the "line N:" prefix is treated as a
// non-line-bound diagnostic and emitted with line: 0.
export function parseStderr(lines) {
  const errs = [];
  // tweego prefixes with "error: " or "warning: "; we surface only errors.
  const re = /^error:\s*(?:load\s+(\S+):\s*)?line\s+(\d+):\s*(.+?)\.?\s*$/i;
  const fallbackRe = /^error:\s*(.+?)\.?\s*$/i;
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('warning:')) continue;
    const m = line.match(re);
    if (m) {
      const entry = { line: Number(m[2]), message: m[3].trim() };
      if (m[1]) entry.source = m[1];
      errs.push(entry);
      continue;
    }
    const fm = line.match(fallbackRe);
    if (fm) errs.push({ line: 0, message: fm[1].trim() });
  }
  return errs;
}

// ---- Browser entry (lazy single-instance) -----------------------------

let _browserCompilerPromise = null;

async function _initBrowserCompiler() {
  // The browser harness must have loaded wasm_exec.js via <script> tag,
  // populating globalThis.Go.
  if (typeof globalThis.Go !== 'function') {
    throw new Error('compileTwee: globalThis.Go missing (load wasm_exec.js first)');
  }
  // storyformats.js is a sibling ES module; resolve relative to this file.
  const sfMod = await import(new URL('./storyformats.js', import.meta.url).href);

  // Two paths to get the WASM bytes: an inline base64-gzip blob (from
  // make dist-bundled), or a sibling tweego.wasm (from make dist-split).
  let bytes;
  const inline = (typeof document !== 'undefined')
    ? document.getElementById('tweego-wasm') : null;
  if (inline && inline.textContent && inline.textContent.trim().length > 100) {
    const r = await fetch('data:application/octet-stream;base64,' + inline.textContent.trim());
    const stream = r.body.pipeThrough(new DecompressionStream('gzip'));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  } else {
    const r = await fetch(new URL('./tweego.wasm', import.meta.url));
    bytes = new Uint8Array(await r.arrayBuffer());
  }
  const wasmModule = await WebAssembly.compile(bytes);
  return createCompiler({
    wasmModule,
    GoCtor: globalThis.Go,
    storyformats: sfMod.storyformats,
  });
}

export async function compileTwee({ source, format } = {}) {
  if (!_browserCompilerPromise) _browserCompilerPromise = _initBrowserCompiler();
  const c = await _browserCompilerPromise;
  return c.compile({ source, format });
}
