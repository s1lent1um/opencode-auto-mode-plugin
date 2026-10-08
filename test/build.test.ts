import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { before, describe, it } from "node:test"

// opencode does not transform JSX/TS for plugins installed under node_modules,
// so the published entry must be plain, already-compiled JS.
const root = path.resolve(import.meta.dirname, "..")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))

describe("build", () => {
  before(() => {
    execFileSync(process.execPath, [path.join(root, "scripts/build.mjs")], { cwd: root, stdio: "ignore" })
  })

  it("package ./tui export points at compiled JS", () => {
    assert.equal(pkg.exports["./tui"].import, "./dist/tui.js")
    assert.ok(pkg.files.includes("dist"))
  })

  it("compiles JSX away and rewrites .ts imports", () => {
    const out = readFileSync(path.join(root, "dist/tui.js"), "utf8")
    assert.doesNotMatch(out, /<(Show|text|b)\b/)
    assert.match(out, /from "@opentui\/solid"/)
    assert.match(out, /from "\.\/state\.js"/)
  })

  it("compiled module exports the plugin object", async () => {
    // solid-js/@opentui/solid are provided by opencode at runtime; here we only
    // check state.js loads standalone and has the expected helpers.
    const state = await import(path.join(root, "dist/state.js"))
    assert.equal(typeof state.isAutoFromCommands, "function")
    assert.equal(state.PERMISSION_MODE_COMMAND, "permission.mode")
  })
})
