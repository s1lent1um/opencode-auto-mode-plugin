// Compiles src/ to dist/ with the same Babel setup opencode uses for local
// .tsx plugins (@opentui/solid/scripts/solid-transform.js).
//
// Why a build step: opencode's runtime Solid JSX transform skips anything under
// node_modules, so an npm-installed plugin must ship plain JS.
import { transformAsync } from "@babel/core"
import ts from "@babel/preset-typescript"
import solid from "babel-preset-solid"
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const srcDir = path.join(root, "src")
const outDir = path.join(root, "dist")

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

for (const name of await readdir(srcDir)) {
  if (!/\.tsx?$/.test(name)) continue
  const filename = path.join(srcDir, name)
  const presets = []
  if (name.endsWith(".tsx")) presets.push([solid, { moduleName: "@opentui/solid", generate: "universal" }])
  presets.push([ts, { rewriteImportExtensions: true }])
  const result = await transformAsync(await readFile(filename, "utf8"), {
    filename,
    configFile: false,
    babelrc: false,
    presets,
  })
  if (!result?.code) throw new Error(`Babel produced no output for ${name}`)
  const out = path.join(outDir, name.replace(/\.tsx?$/, ".js"))
  await writeFile(out, result.code + "\n")
  console.log(`built ${path.relative(root, out)}`)
}
