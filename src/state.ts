/**
 * Pure helpers for the auto-mode plugin. Kept free of TUI imports so they can
 * be unit-tested with plain `node --test`.
 */

/** Built-in opencode command that toggles auto-approve (packages/tui/src/app.tsx). */
export const PERMISSION_MODE_COMMAND = "permission.mode"

export const DEFAULT_KEYBIND = "<leader>p"
// opencode already prints a muted "auto" next to the agent name, so by default
// the plugin only adds a coloured dot while ON and nothing while OFF.
export const DEFAULT_LABEL_ON = "●"
export const DEFAULT_LABEL_OFF = "approve: ask"
export const DEFAULT_SHOW_OFF = false

export type AutoModeOptions = {
  /** Key(s) bound to the toggle; `false` disables the hotkey. */
  keybind: string[] | false
  labelOn: string
  labelOff: string
  /** Render `labelOff` while auto-approve is off. */
  showOff: boolean
}

type CommandLike = { name: string; title?: unknown }

/**
 * opencode keeps the auto-approve mode in private in-memory state. The only
 * signal visible to plugins is the reactive title of the built-in command:
 * "Disable auto-approve permissions" while ON, "Enable …" while OFF.
 *
 * @returns `true`/`false`, or `undefined` when the state can't be determined
 * (command missing or title format changed in a newer opencode).
 */
export function isAutoFromCommands(commands: readonly CommandLike[]): boolean | undefined {
  const command = commands.find((c) => c.name === PERMISSION_MODE_COMMAND)
  if (!command || typeof command.title !== "string") return undefined
  const title = command.title.trim().toLowerCase()
  if (title.startsWith("disable")) return true
  if (title.startsWith("enable")) return false
  return undefined
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

function normalizeKeybind(value: unknown): string[] | false {
  if (value === undefined || value === null) return [DEFAULT_KEYBIND]
  if (value === false || value === "none") return false
  if (typeof value === "string") return value.trim() ? [value.trim()] : false
  if (Array.isArray(value)) {
    const keys = value.filter((k): k is string => typeof k === "string" && k.trim() !== "").map((k) => k.trim())
    return keys.length > 0 ? keys : false
  }
  return [DEFAULT_KEYBIND]
}

export function normalizeOptions(raw: Record<string, unknown> | undefined): AutoModeOptions {
  const options = raw ?? {}
  return {
    keybind: normalizeKeybind(options.keybind),
    labelOn: stringOr(options.labelOn, DEFAULT_LABEL_ON),
    labelOff: stringOr(options.labelOff, DEFAULT_LABEL_OFF),
    showOff: typeof options.showOff === "boolean" ? options.showOff : DEFAULT_SHOW_OFF,
  }
}

/** Keymap bindings that route the configured key(s) to the built-in toggle. */
export function buildBindings(keybind: string[] | false) {
  if (!keybind) return []
  return keybind.map((key) => ({
    key,
    cmd: PERMISSION_MODE_COMMAND,
    desc: "Toggle auto-approve permissions",
  }))
}

/** Text to render for a given state; `undefined` means render nothing. */
export function labelFor(auto: boolean | undefined, options: AutoModeOptions): string | undefined {
  if (auto === undefined) return undefined
  if (auto) return options.labelOn
  return options.showOff && options.labelOff ? options.labelOff : undefined
}
