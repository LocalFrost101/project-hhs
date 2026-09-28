import * as luaparse from "luaparse";

export interface ObfuscateOptions {
  vault: boolean;
  encryptStrings: boolean;
  renameLocals: boolean;
  mutateNumbers: boolean;
  stripComments: boolean;
}

export interface ObfuscateStats {
  original: number;
  obfuscated: number;
  strings: number;
  locals: number;
  numbers: number;
}

export interface ObfuscateResult {
  code: string;
  stats: ObfuscateStats;
}

const randKey = () => 1 + Math.floor(Math.random() * 255);
const toBytes = (s: string): number[] => Array.from(new TextEncoder().encode(s));

function vaultLayer(payload: string, outermost: boolean): string {
  const k = randKey();
  const m = 3 + Math.floor(Math.random() * 250);
  const enc = toBytes(payload).map((b, i) => (b + k + i * m) % 256);
  const body = `local _D={${enc.join(",")}}local _K=${k} local _M=${m} local _L=loadstring or load local _B={}for _I=1,#_D do _B[_I]=string.char((_D[_I]-_K-(_I-1)*_M)%256)end local _F=_L(table.concat(_B))assert(_F,"BLUES DET: runtime cannot load strings")return _F()`;
  const wrapped = `return(function()${body}end)()`;
  return outermost ? `--[[ BLUES DET VAULT v2 · hardened scramble ]]\n${wrapped}` : wrapped;
}

// WeAreDevs-grade hard scramble: position-keyed byte cipher, return-function loader,
// optional multi-layer nesting (vault of a vault).
export function vaultWrap(source: string, layers = 1): string {
  const n = Math.min(3, Math.max(1, layers));
  let code = source;
  for (let i = 0; i < n; i++) code = vaultLayer(code, i === n - 1);
  return code;
}

function luaQuoteBytes(bytes: number[]): string {
  let out = '"';
  for (const b of bytes) {
    if (b === 34) out += '\\"';
    else if (b === 92) out += "\\\\";
    else if (b === 10) out += "\\n";
    else if (b < 32 || b > 126) out += `\\${b.toString().padStart(3, "0")}`;
    else out += String.fromCharCode(b);
  }
  return out + '"';
}

// Reverses Blues DET vault layers (v1 flat key and v2 position key) and deep-mode
// __S string tables. Returns null when the input isn't recognizable Blues DET output.
export function deobfuscateVault(code: string): string | null {
  let current = code.trim();
  let touched = false;
  for (let layer = 0; layer < 5; layer++) {
    const dMatch = /local\s+_D=\{([\d,]+)\}/.exec(current);
    if (!dMatch) break;
    const kMatch = /local\s+_K=(\d+)/.exec(current);
    if (!kMatch) break;
    const mMatch = /local\s+_M=(\d+)/.exec(current);
    const bytes = dMatch[1].split(",").map(Number);
    const k = Number(kMatch[1]);
    const m = mMatch ? Number(mMatch[1]) : 0;
    current = new TextDecoder().decode(
      new Uint8Array(bytes.map((b, i) => (((b - k - i * m) % 256) + 256) % 256)),
    );
    touched = true;
  }
  let strings = 0;
  current = current.replace(/__S\(\{([\d,]+)\},(\d+)\)/g, (_m, nums: string, kk: string) => {
    const bytes = nums.split(",").map(Number);
    const k = Number(kk);
    strings++;
    return luaQuoteBytes(bytes.map((b) => (((b - k) % 256) + 256) % 256));
  });
  if (strings > 0) touched = true;
  return touched ? current : null;
}

export function stripLuaComments(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const two = src.slice(i, i + 2);
    if (two === "--") {
      const m = /^\[(=*)\[/.exec(src.slice(i + 2));
      if (m) {
        const close = `]${m[1]}]`;
        const end = src.indexOf(close, i + 2 + m[0].length);
        i = end === -1 ? src.length : end + close.length;
      } else {
        const nl = src.indexOf("\n", i);
        i = nl === -1 ? src.length : nl;
      }
      continue;
    }
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < src.length && src[j] !== ch) {
        if (src[j] === "\\") j++;
        j++;
      }
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === "[") {
      const m = /^\[(=*)\[/.exec(src.slice(i));
      if (m) {
        const close = `]${m[1]}]`;
        const end = src.indexOf(close, i + m[0].length);
        const stop = end === -1 ? src.length : end + close.length;
        out += src.slice(i, stop);
        i = stop;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

// The luaparse fork ships StringLiteral/NumericLiteral with value=null and only `raw`
// populated, so decode raw source text ourselves. Returns null for escapes we don't
// model exactly (\xNN, \ddd, \u{...}) — those strings are left untouched rather than
// risk changing program semantics.
function decodeLuaString(raw: string): string | null {
  if (raw.startsWith('"') || raw.startsWith("'")) {
    const inner = raw.slice(1, -1);
    let out = "";
    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (c !== "\\") {
        out += c;
        continue;
      }
      i++;
      const e = inner[i];
      if (e === undefined) return null;
      if (/[0-9xu]/.test(e)) return null;
      const map: Record<string, string> = {
        a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v",
        "\\": "\\", '"': '"', "'": "'", "\n": "",
      };
      const decoded = map[e];
      if (decoded === undefined) return null;
      out += decoded;
    }
    return out;
  }
  const m = /^\[(=*)\[/.exec(raw);
  if (m) {
    let content = raw.slice(m[0].length, raw.length - (m[1].length + 2));
    if (content.startsWith("\n")) content = content.slice(1);
    return content;
  }
  return null;
}

// Generic walker used for the string/number passes. Skips metadata keys so the
// scope annotations luaparse adds (which are circular) don't trap the walk.
function walkAll(node: unknown, cb: (n: Record<string, unknown>) => void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((c) => walkAll(c, cb));
    return;
  }
  const rec = node as Record<string, unknown>;
  if (typeof rec.type === "string") cb(rec);
  for (const k of Object.keys(rec)) {
    if (k === "range" || k === "loc" || k === "scope" || k === "globals" || k === "parent") continue;
    walkAll(rec[k], cb);
  }
}

export function obfuscateLua(source: string, opts: ObfuscateOptions, layers = 1): ObfuscateResult {
  if (opts.vault) {
    const code = vaultWrap(source, layers);
    return { code, stats: { original: source.length, obfuscated: code.length, strings: 0, locals: 0, numbers: 0 } };
  }

  const src = opts.stripComments ? stripLuaComments(source) : source;
  const ast = luaparse.parse(src, { scope: true, ranges: true, locations: false, comments: false }) as unknown as Record<string, unknown>;

  // Pre-collect every identifier name so generated names never collide.
  const taken = new Set<string>();
  walkAll(ast, (n) => {
    if (n.type === "Identifier" && typeof n.name === "string") taken.add(n.name);
  });
  const newName = (): string => {
    let n = "";
    do {
      n = `_0x${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
    } while (taken.has(n));
    taken.add(n);
    return n;
  };

  const edits: Edit[] = [];
  let strings = 0;
  let locals = 0;
  let numbers = 0;

  // --- string + number passes (position-based splices, order-independent) ---
  walkAll(ast, (n) => {
    const range = n.range as [number, number] | undefined;
    if (!range) return;
    if (opts.encryptStrings && n.type === "StringLiteral") {
      const value = typeof n.value === "string" ? n.value : decodeLuaString(String(n.raw ?? ""));
      if (value === null) return;
      const k = randKey();
      const enc = toBytes(value).map((b) => (b + k) % 256);
      edits.push({ start: range[0], end: range[1], text: `__S({${enc.join(",")}},${k})` });
      strings++;
    } else if (opts.mutateNumbers && n.type === "NumericLiteral") {
      const value = typeof n.value === "number" ? n.value : Number(String(n.raw ?? "NaN"));
      if (!Number.isInteger(value) || Math.abs(value) >= 2 ** 31) return;
      const a = Math.floor(Math.random() * 0xffff);
      const b = value - a;
      edits.push({ start: range[0], end: range[1], text: `(0x${a.toString(16)} + ${b})` });
      numbers++;
    }
  });

  // --- scope-aware local renaming (controlled traversal, source order) ---
  if (opts.renameLocals) {
    const scopeStack: Array<Map<string, string>> = [];
    const pushScope = () => scopeStack.push(new Map());
    const popScope = () => scopeStack.pop();
    const declare = (ident: { name: string; range?: [number, number] }) => {
      const nn = newName();
      scopeStack[scopeStack.length - 1].set(ident.name, nn);
      if (ident.range) edits.push({ start: ident.range[0], end: ident.range[1], text: nn });
      locals++;
    };
    const lookup = (name: string): string | null => {
      for (let i = scopeStack.length - 1; i >= 0; i--) {
        const hit = scopeStack[i].get(name);
        if (hit) return hit;
      }
      return null;
    };

    const visitExpr = (n: any): void => {
      if (!n || typeof n.type !== "string") return;
      switch (n.type) {
        case "Identifier": {
          if (n.isLocal && n.range) {
            const nn = lookup(n.name);
            if (nn) edits.push({ start: n.range[0], end: n.range[1], text: nn });
          }
          return;
        }
        case "MemberExpression":
          visitExpr(n.base);
          return;
        case "IndexExpression":
          visitExpr(n.base);
          visitExpr(n.index);
          return;
        case "CallExpression":
          visitExpr(n.base);
          (n.arguments ?? []).forEach(visitExpr);
          return;
        case "StringCallExpression":
        case "ParenExpression":
          visitExpr(n.base ?? n.argument);
          return;
        case "TableCallExpression":
          visitExpr(n.base);
          visitExpr(n.argument);
          return;
        case "UnaryExpression":
          visitExpr(n.argument);
          return;
        case "BinaryExpression":
        case "LogicalExpression":
          visitExpr(n.left);
          visitExpr(n.right);
          return;
        case "FunctionDeclaration":
          visitFunction(n);
          return;
        case "TableConstructorExpression":
          (n.fields ?? []).forEach((f: any) => {
            if (f.type === "TableKey") {
              visitExpr(f.key);
              visitExpr(f.value);
            } else if (f.type === "TableValue") {
              visitExpr(f.value);
            } else if (f.type === "TableKeyString") {
              visitExpr(f.value);
            }
          });
          return;
        default:
          return;
      }
    };

    const visitFunction = (n: any): void => {
      pushScope();
      (n.parameters ?? []).forEach((p: any) => {
        if (p.type === "Identifier") declare(p);
      });
      visitBlock(n.body ?? []);
      popScope();
    };

    const visitClauseBody = (body: any[]): void => {
      pushScope();
      visitBlock(body);
      popScope();
    };

    const visitStat = (n: any): void => {
      if (!n || typeof n.type !== "string") return;
      switch (n.type) {
        case "LocalStatement":
          (n.init ?? []).forEach(visitExpr);
          (n.variables ?? []).forEach((v: any) => declare(v));
          return;
        case "FunctionDeclaration":
          if (n.isLocal && n.identifier?.type === "Identifier") declare(n.identifier);
          else if (n.identifier) visitExpr(n.identifier);
          visitFunction(n);
          return;
        case "CallStatement":
          visitExpr(n.expression);
          return;
        case "AssignmentStatement":
          (n.init ?? []).forEach(visitExpr);
          (n.variables ?? []).forEach(visitExpr);
          return;
        case "ReturnStatement":
          (n.arguments ?? []).forEach(visitExpr);
          return;
        case "IfStatement":
          (n.clauses ?? []).forEach((c: any) => {
            if (c.condition) visitExpr(c.condition);
            visitClauseBody(c.body ?? []);
          });
          return;
        case "WhileStatement":
          visitExpr(n.condition);
          visitClauseBody(n.body ?? []);
          return;
        case "RepeatStatement":
          pushScope();
          visitBlock(n.body ?? []);
          visitExpr(n.condition);
          popScope();
          return;
        case "DoStatement":
          visitClauseBody(n.body ?? []);
          return;
        case "ForNumericStatement":
          visitExpr(n.start);
          visitExpr(n.end);
          if (n.step) visitExpr(n.step);
          pushScope();
          declare(n.variable);
          visitBlock(n.body ?? []);
          popScope();
          return;
        case "ForGenericStatement":
          (n.iterators ?? []).forEach(visitExpr);
          pushScope();
          (n.variables ?? []).forEach((v: any) => declare(v));
          visitBlock(n.body ?? []);
          popScope();
          return;
        default:
          return;
      }
    };

    const visitBlock = (body: any[]): void => body.forEach(visitStat);

    pushScope();
    visitBlock((ast as any).body ?? []);
    popScope();
  }

  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  if (strings > 0) {
    out =
      "local function __S(_t,_k) local _b={} for _i=1,#_t do _b[_i]=string.char((_t[_i]-_k)%256) end return table.concat(_b) end\n" +
      out;
  }

  return {
    code: out,
    stats: { original: source.length, obfuscated: out.length, strings, locals, numbers },
  };
}
