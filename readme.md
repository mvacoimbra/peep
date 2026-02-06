# peep

A TUI HTTP proxy for developers who want to see what's going on. Think [Proxyman](https://proxyman.io), but in your terminal.

Built with [Ink](https://github.com/vadimdemedes/ink) and React.

> **Status:** Early development. Not ready for use yet.

## Why

Debugging HTTP traffic shouldn't require leaving the terminal. Peep sits between your app and the internet, letting you inspect requests and responses in a clean terminal UI.

## Planned Features

- Intercept and inspect HTTP/HTTPS traffic
- Request/response detail view with headers, body, timing
- Filter and search through captured traffic
- TUI with keyboard navigation
- iOS Simulator and Android Emulator support (later)

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
