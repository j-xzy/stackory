# @stackory/ui-ink

## 2.0.0

### Major Changes

- af8a2d4: ### @stackory/ui-web

  Initial release of the web component registry.

  - Added `coverflow` — a 3D carousel component with keyboard accessibility and customizable visual config
  - Added `markdown-content` — a markdown renderer with GFM and line-break support
  - Registry source organized under `registry/components/`, `registry/hooks/`, `registry/lib/`
  - Build output to `dist/r/` via `shadcn build -o dist/r`

  ### @stackory/ui-ink

  Initial release of the Ink (terminal) component registry.

  - Added `ink-spinner` — a terminal spinner with configurable frames and interval
  - Added `ink-keyboard-provider` — hierarchical keyboard input context provider
  - Added `ink-navigation-provider` — focus-based navigation context provider
  - Added `ink-text-input` — full-featured terminal text input with cursor navigation, paste support, undo history, and BPM protocol; depends on `ink-keyboard-provider`
