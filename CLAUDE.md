# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peep is a TUI HTTP proxy application similar to Proxyman, built with React and Ink. It's designed to help developers inspect and debug HTTP traffic during web and mobile app development. The initial focus is on web development support, with mobile simulator support (iOS Simulator, Android Emulator) planned for later.

## Commands

```bash
pnpm build       # Compile TypeScript to dist/
pnpm dev         # Watch mode compilation
pnpm lint        # Run Biome linter and formatter checks
pnpm format      # Auto-format with Biome
```

## Architecture

- **Framework**: Ink v4 (React for terminal UIs) with React 18
- **CLI parsing**: meow for command-line argument handling
- **Entry point**: `source/cli.tsx` - parses CLI flags and renders the App
- **Main component**: `source/app.tsx` - root React component
- **Build output**: `dist/` (compiled JS, entry is `dist/cli.js`)

## Code Style

- Biome for linting and formatting
- ESM modules (`"type": "module"` in package.json)
- TypeScript with `@sindresorhus/tsconfig` base config and `react-jsx` transform
- Tabs for indentation, double quotes, LF line endings
- Import compiled `.js` extensions in source files (e.g., `import App from './app.js'`)

## Validation

After planning and completing a task, run the following checks and fix any errors before considering the task done:

```bash
pnpm lint --fix
pnpm format --write
pnpm build
pnpm tsc
```

## Task Tracking

- Use **beads** (`bd`) for all task tracking — do NOT use TodoWrite, TaskCreate, or markdown files
- Create a beads issue before starting work, update status to `in_progress`, and `bd close` when done
- Run `bd sync --flush-only` before ending a session

## Commit

- Separate changes into atomic commits following Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `style:`, `perf:`, `ci:`, `build:`)
- Max 72 characters in the subject line
- No scope (e.g., `feat: add proxy support`, not `feat(proxy): add proxy support`)
- No body
- No co-authorship notes
