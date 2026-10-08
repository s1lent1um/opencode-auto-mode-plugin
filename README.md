# @s1lent1um/opencode-auto-mode-plugin

An [opencode](https://opencode.ai) TUI plugin that gives the built-in **auto-approve permissions** toggle:

- a **hotkey** (default `<leader>p`, i.e. `ctrl+x` then `p`), and
- an always-visible **on/off indicator** in the prompt's meta row (home and session screens).

```
┃  Build · Claude Opus Anthropic                   approve: ask      ← off
┃  Build auto · Claude Opus Anthropic            ● AUTO-APPROVE      ← on (bold, warning colour)
```

It reuses opencode's own `permission.mode` command, so the hotkey, the command palette entry
("Enable/Disable auto-approve permissions") and `opencode --auto` / `--yolo` all stay in sync.
The palette entry also shows the hotkey once the plugin is loaded.

Requires opencode `>=1.18.0 <2` (tested on 1.18.32).

## Install

```sh
opencode plugin @s1lent1um/opencode-auto-mode-plugin -g
```

or add it manually to `~/.config/opencode/tui.json` (global) or a project `tui.json` / `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [["@s1lent1um/opencode-auto-mode-plugin", { "keybind": "<leader>p" }]]
}
```

Note: TUI plugins go in `tui.json`, not `opencode.json`.

## Options

| Option     | Type                          | Default            | Description                                                          |
| ---------- | ----------------------------- | ------------------ | -------------------------------------------------------------------- |
| `keybind`  | `string \| string[] \| false` | `"<leader>p"`      | Key(s) that toggle auto-approve. `false` / `"none"` disables hotkey. |
| `labelOn`  | `string`                      | `"● AUTO-APPROVE"` | Indicator text while auto-approve is on (bold, theme warning colour). |
| `labelOff` | `string`                      | `"approve: ask"`   | Indicator text while auto-approve is off (muted).                    |
| `showOff`  | `boolean`                     | `true`             | Show `labelOff` while off. `false` = indicator only appears when on. |

Key syntax is opencode's keybind syntax (`<leader>x`, `ctrl+shift+a`, …); `<leader>` is
`keybinds.leader` from your `tui.json` (default `ctrl+x`).

### Alternative hotkey: `<leader>y`

`<leader>y` ("yolo") is a nice mnemonic but in opencode 1.18 it is already bound to **Copy message**
(`messages_copy`). To use it, move Copy message elsewhere:

```json
{
  "keybinds": { "messages_copy": "none" },
  "plugin": [["@s1lent1um/opencode-auto-mode-plugin", { "keybind": "<leader>y" }]]
}
```

## How auto-approve behaves (opencode, not this plugin)

- It answers permission prompts for rules set to `ask` with "allow once". Rules set to `deny` are still denied.
- It is client-side and in-memory: it applies to the whole TUI process and resets on restart
  (start with `opencode --auto` to begin enabled).
- Prompts already pending when you switch it on are not auto-approved.

## How it works / limitations

opencode does not expose the auto-approve state to plugins. The plugin binds the key(s) to the
built-in `permission.mode` command and derives the state from that command's title
("**Disable** auto-approve permissions" ⇒ on), refreshing on every keymap `state` event. If a future
opencode changes that command, the indicator hides itself (and logs one warning) rather than
showing a wrong state; the hotkey keeps working as long as the command name exists.

Upstream improvements that would make this plugin unnecessary: a `permission_mode` keybind in
opencode's `keybinds` config, and exposing the permission mode to the plugin API.

## Development

Requires Node.js ≥ 22.18 (native TypeScript) for tests.

```sh
npm install
npm test          # node --test (pure state/option helpers)
npm run typecheck # tsc --noEmit
```

To try local changes, point a `tui.json` at the source file (absolute path or relative to that `tui.json`):

```json
{ "plugin": [["/path/to/opencode-auto-mode-plugin/src/tui.tsx", {}]] }
```

opencode transpiles the `.tsx` at load time; there is no build step. Restart opencode to reload.

Layout:

- `src/tui.tsx` — plugin entry (`exports["./tui"]`): keymap layer + prompt slots.
- `src/state.ts` — pure helpers: state detection, option normalisation, bindings, labels.
- `test/state.test.ts` — unit tests.

## Publishing

```sh
npm version patch   # or minor / major
npm publish         # prepublishOnly runs typecheck + tests
```

## License

MIT
