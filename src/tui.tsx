/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiTheme } from "@opencode-ai/plugin/tui"
import { createSignal, Show } from "solid-js"
import { buildBindings, isAutoFromCommands, labelFor, normalizeOptions } from "./state.ts"

const ID = "s1lent1um.auto-mode"

const readState = (api: TuiPluginApi) => isAutoFromCommands(api.keymap.getCommands({ visibility: "registered" }))

const tui: TuiPlugin = async (api, rawOptions) => {
  const options = normalizeOptions(rawOptions as Record<string, unknown> | undefined)

  const [auto, setAuto] = createSignal(readState(api))
  let warned = false
  const refresh = () => {
    const next = readState(api)
    if (next === undefined && !warned) {
      warned = true
      console.warn(`[${ID}] could not read auto-approve state; indicator hidden (unsupported opencode version?)`)
    }
    setAuto(next)
  }
  // The host re-registers its command layer whenever the mode flips, which
  // emits keymap "state". Listener is disposed automatically on unload.
  api.keymap.on("state", refresh)
  refresh()

  const bindings = buildBindings(options.keybind)
  if (bindings.length > 0) {
    api.keymap.registerLayer({ mode: "base", bindings })
  }

  const Badge = (props: { theme: TuiTheme }) => (
    <Show when={labelFor(auto(), options)}>
      {(label) => (
        <Show
          when={auto()}
          fallback={<text fg={props.theme.current.textMuted}>{label()}</text>}
        >
          <text fg={props.theme.current.warning}>
            <b>{label()}</b>
          </text>
        </Show>
      )}
    </Show>
  )

  api.slots.register({
    order: 0,
    slots: {
      home_prompt_right: (ctx) => <Badge theme={ctx.theme} />,
      session_prompt_right: (ctx) => <Badge theme={ctx.theme} />,
    },
  })
}

const plugin: TuiPluginModule & { id: string } = { id: ID, tui }

export default plugin
