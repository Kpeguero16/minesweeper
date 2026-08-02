# Minesweeper

<img width="1350" height="540" alt="minesweeper" src="https://github.com/user-attachments/assets/47a3c2eb-8755-48d2-8e23-28a275a2d474" />

## Requirements

Node.js 20.19 or newer.

```powershell
node --version
```

## Run it

```powershell
npm install
npm run dev
```

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm test` | Run the tests with Vitest in watch mode (press `q` to quit) |
| `npm run build` | Type-check strictly, then bundle into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## Project layout

| File | Job |
|---|---|
| `src/board.ts` | Game state and the functions that change it (`createGame`, `neighbors`, `reveal`, `toggleFlag`). Pure logic. |
| `src/render.ts` | Reads the game object and makes the page match it. |
| `src/main.ts` | Listens for clicks, calls the board.ts, then tells render.ts to redraw. |
| `src/board.test.ts` | Vitest tests for board.ts. |
| `src/style.css` | The classic Windows look. |

## License

Public domain — see [LICENSE](LICENSE) (the Unlicense).
