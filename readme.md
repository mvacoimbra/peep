# peep

A TUI HTTP proxy for developers who want to see what's going on. Think [Proxyman](https://proxyman.io), but in your terminal.

Built with [Ink](https://github.com/vadimdemedes/ink) and React.

> **Status:** Under active development. Core proxy and TUI are functional.

## Why

Debugging HTTP traffic shouldn't require leaving the terminal. Peep sits between your app and the internet, letting you inspect requests and responses in a clean terminal UI.

## Features

- HTTP and HTTPS interception (automatic CA generation and trust)
- Three-panel TUI: domain sidebar, request list, request/response detail
- Request/response detail with headers, body, and raw views
- Syntax-highlighted body previews (JSON, HTML, CSS, XML)
- Domain grouping and filtering in the sidebar
- Sortable request list (by method, URL, status, duration, size)
- Vim-style keyboard navigation (`hjkl`, `gg`/`G`)
- Copy request/response to clipboard
- Automatic system proxy configuration (macOS)
- Firefox/Zen NSS certificate store support

## Usage

```bash
peep              # start on default port 8080
peep --port=3128  # custom port
```

Peep will automatically configure itself as the system HTTP proxy and install its CA certificate on first run.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll up/down |
| `h` / `l` | Switch panels / expand-collapse groups / switch tabs |
| `Enter` | Select / drill into detail |
| `Esc` | Go back |
| `s` | Sort request list |
| `y` | Copy to clipboard |
| `gg` / `G` | Jump to top/bottom |
| `q` | Quit |

## Install

```bash
npm install --global peep
```

## Development

```bash
pnpm install
pnpm dev       # watch mode
pnpm build     # compile
pnpm lint      # check linting
pnpm format    # check formatting
```

## Tech Stack

- **Runtime:** Node.js
- **UI:** Ink v4 + React 18
- **Language:** TypeScript
- **Tooling:** Biome (lint + format), pnpm

## License

MIT
