import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildBindings,
  DEFAULT_KEYBIND,
  DEFAULT_LABEL_OFF,
  DEFAULT_LABEL_ON,
  isAutoFromCommands,
  labelFor,
  normalizeOptions,
  PERMISSION_MODE_COMMAND,
} from "../src/state.ts"

const cmd = (title: unknown) => ({ name: PERMISSION_MODE_COMMAND, title })

describe("isAutoFromCommands", () => {
  it("is true when the built-in command offers to disable", () => {
    assert.equal(isAutoFromCommands([{ name: "other" }, cmd("Disable auto-approve permissions")]), true)
  })
  it("is false when the built-in command offers to enable", () => {
    assert.equal(isAutoFromCommands([cmd("Enable auto-approve permissions")]), false)
  })
  it("is undefined when the command is missing", () => {
    assert.equal(isAutoFromCommands([{ name: "session.new", title: "New session" }]), undefined)
  })
  it("is undefined for non-string or unrecognised titles", () => {
    assert.equal(isAutoFromCommands([cmd(undefined)]), undefined)
    assert.equal(isAutoFromCommands([cmd("Toggle auto-approve")]), undefined)
  })
})

describe("normalizeOptions", () => {
  it("applies defaults", () => {
    assert.deepEqual(normalizeOptions(undefined), {
      keybind: [DEFAULT_KEYBIND],
      labelOn: DEFAULT_LABEL_ON,
      labelOff: DEFAULT_LABEL_OFF,
      showOff: false,
    })
    assert.equal(DEFAULT_LABEL_ON, "●")
  })
  it("accepts a single key or a list of keys", () => {
    assert.deepEqual(normalizeOptions({ keybind: " <leader>y " }).keybind, ["<leader>y"])
    assert.deepEqual(normalizeOptions({ keybind: ["<leader>p", "", 3, "ctrl+shift+a"] }).keybind, [
      "<leader>p",
      "ctrl+shift+a",
    ])
  })
  it("disables the hotkey with false, 'none', empty string or empty list", () => {
    for (const keybind of [false, "none", "", []]) {
      assert.equal(normalizeOptions({ keybind }).keybind, false)
    }
  })
  it("falls back to the default for invalid keybind types", () => {
    assert.deepEqual(normalizeOptions({ keybind: 42 }).keybind, [DEFAULT_KEYBIND])
  })
  it("honours custom labels and showOff", () => {
    const o = normalizeOptions({ labelOn: "YOLO", labelOff: "safe", showOff: true })
    assert.equal(o.labelOn, "YOLO")
    assert.equal(o.labelOff, "safe")
    assert.equal(o.showOff, true)
    assert.equal(normalizeOptions({ showOff: "yes" }).showOff, false)
  })
})

describe("buildBindings", () => {
  it("maps every key to the built-in toggle", () => {
    assert.deepEqual(
      buildBindings(["<leader>p", "<leader>y"]).map((b) => [b.key, b.cmd]),
      [
        ["<leader>p", PERMISSION_MODE_COMMAND],
        ["<leader>y", PERMISSION_MODE_COMMAND],
      ],
    )
  })
  it("returns no bindings when disabled", () => {
    assert.deepEqual(buildBindings(false), [])
  })
})

describe("labelFor", () => {
  const options = normalizeOptions({})
  it("shows the ON label when auto", () => assert.equal(labelFor(true, options), DEFAULT_LABEL_ON))
  it("renders nothing when off by default", () => assert.equal(labelFor(false, options), undefined))
  it("shows the OFF label when showOff is true", () =>
    assert.equal(labelFor(false, normalizeOptions({ showOff: true })), DEFAULT_LABEL_OFF))
  it("renders nothing when the state is unknown", () => assert.equal(labelFor(undefined, options), undefined))
})
