import * as fengari from "fengari";
import { describe, expect, it } from "vitest";
import { obfuscateLua, vaultWrap } from "./obfuscate";

// fengari ships no types; the VM surface we use is stable.
const { lua, lauxlib, lualib, to_luastring } = fengari as any;

const SAMPLE = `local SECRET = "sensitive-token-123"
local parts = {}
local function greet(name)
  local message = "hello, " .. name
  parts[#parts + 1] = message
  return 42
end
for i = 1, 3 do
  greet("world")
end
RESULT = table.concat(parts, ",") .. "|" .. tostring(SECRET)
`;

const ALL_ON = {
  vault: false,
  encryptStrings: true,
  renameLocals: true,
  mutateNumbers: true,
  stripComments: true,
};

function runLua(code: string): string {
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const status = lauxlib.luaL_dostring(L, to_luastring(code));
  if (status !== lua.LUA_OK) {
    throw new Error(`lua error: ${lua.lua_tojsstring(L, -1)}`);
  }
  lua.lua_getglobal(L, to_luastring("RESULT"));
  return lua.lua_tojsstring(L, -1);
}

describe("obfuscateLua", () => {
  it("hides strings and renames locals in deep mode", () => {
    const { code, stats } = obfuscateLua(SAMPLE, ALL_ON);
    expect(code).not.toContain("sensitive-token-123");
    expect(code).not.toContain("SECRET");
    expect(stats.strings).toBeGreaterThan(0);
    expect(stats.locals).toBeGreaterThan(0);
  });

  it("vault output executes identically in a real Lua VM", () => {
    expect(runLua(vaultWrap(SAMPLE))).toBe(runLua(SAMPLE));
  });

  it("deep output executes identically in a real Lua VM", () => {
    const { code } = obfuscateLua(SAMPLE, ALL_ON);
    expect(runLua(code)).toBe(runLua(SAMPLE));
  });

  it("double-layer vault executes identically and deobfuscator recovers the source", async () => {
    const { deobfuscateVault } = await import("./obfuscate");
    const hardened = vaultWrap(SAMPLE, 2);
    expect(runLua(hardened)).toBe(runLua(SAMPLE));
    expect(deobfuscateVault(hardened)).toBe(SAMPLE);
    expect(deobfuscateVault(vaultWrap(SAMPLE))).toBe(SAMPLE);
  });

  it("deobfuscator decodes deep-mode string tables", async () => {
    const { deobfuscateVault } = await import("./obfuscate");
    const { code } = obfuscateLua(`print("sensitive-token-123")`, ALL_ON);
    const recovered = deobfuscateVault(code);
    expect(recovered).toContain('"sensitive-token-123"');
  });

  it("deobfuscator rejects foreign code", async () => {
    const { deobfuscateVault } = await import("./obfuscate");
    expect(deobfuscateVault(`print("hello")`)).toBeNull();
  });
});
