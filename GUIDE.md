# Building Minesweeper — A Step-by-Step Guide

This guide walks you through building a complete, classic Minesweeper as a website — TypeScript, no framework — and deploying it free on GitHub Pages, at your own pace, writing the interesting code yourself.

It was written for **this repo** (`Kpeguero16/minesweeper`) on **Windows 11 + PowerShell**. Toolchain verified on this machine on 2026-07-16: Node v26.4.0, npm 11.5.2, `create-vite` 9.1.1 (which installs Vite 8, TypeScript 6), Vitest 4. If versions have drifted when you read this, the steps almost certainly still apply.

**Total effort:** roughly 3–5 evenings. Milestone 5 is the big one — plan a full session for it.

---

## How to use this guide

Every code block is marked:

| Marker | Meaning |
|---|---|
| 📋 **Paste** | Copy it verbatim. It's configuration or plumbing — typing it teaches you nothing. |
| ✍️ **You write it** | You get the exact function signature and numbered steps. The body is yours. This is where the learning is. |
| ✅ **Checkpoint** | Verify this before moving on. **Never build on top of a failing checkpoint.** |
| 💾 **Commit** | Save your progress in git. Small commits = free undo points. |

Two rules that make this work:

1. **Don't paste ✍️ code from the internet or an AI.** If you're stuck, use the [When you're stuck](#when-youre-stuck) table, add `console.log`s, or take a break. Struggling *productively* is the point; the table exists so you never struggle *unproductively* for more than ~20 minutes.
2. **Do the checkpoints.** Each one catches the bug in the milestone that created it, while the code is still small enough to reason about.

---

## 1. What we're building

Minesweeper: a grid of hidden cells, some hiding mines. Left-click reveals a cell — a mine loses the game; a number tells you how many of the 8 surrounding cells hold mines; a blank auto-reveals its whole region. Right-click plants a flag. Reveal every safe cell to win.

### The mental model: brain, face, hands

The whole architecture is three files with strict jobs:

```
        clicks                 function calls              reads state
  You ─────────▶  main.ts  ─────────────────▶  board.ts  ◀───────────  render.ts
                 (hands)                        (brain)                  (face)
                     │                                                     ▲
                     └────────────── "redraw now" ─────────────────────────┘
```

- **`board.ts` — the brain.** A plain data object (the `Game`) plus functions that change it: `reveal`, `toggleFlag`, `chord`. It never touches the web page. It doesn't know browsers exist.
- **`render.ts` — the face.** One job: look at the `Game` object and make the page match it.
- **`main.ts` — the hands.** Turns your clicks into brain calls, then tells the face to redraw. Also owns the timer.

Every user action is the same three-beat rhythm: **event → change the game → redraw**.

**Why keep the brain page-free?** Two payoffs you'll feel directly: (1) you can test all the tricky logic with fast automated tests, no browser involved — you'll catch flood-fill bugs in milliseconds instead of by clicking around; (2) the brain is a plain object, so when something's weird you can just `console.log(game)` and *look* at it.

---

## 2. Prerequisites

### Tools

| Tool | Why | Check / get it |
|---|---|---|
| **Node.js ≥ 20.19** | Runs the dev tooling | `node --version` — this machine has v26.4.0 ✓. If missing: [nodejs.org](https://nodejs.org), LTS installer, then reopen your terminal. |
| **VS Code** | Editor with built-in TypeScript smarts | [code.visualstudio.com](https://code.visualstudio.com) |
| **Git** | Already set up — this repo exists and pushes to GitHub ✓ | `git status` |
| **GitHub account** | You have one (`Kpeguero16`) ✓ | — |

You do **not** need the `gh` CLI, Docker, or any database.

### Words you'll see (one line each)

- **Vite** — the dev tool. Runs a local server with instant reload while you code (`npm run dev`), and bundles everything into a deployable `dist/` folder (`npm run build`).
- **TypeScript** — JavaScript plus type annotations. The compiler catches "this might be null" and "wrong argument" mistakes *before* you run anything. `.ts` files compile to plain JS.
- **Vitest** — a test runner. You write small functions that call your code and assert what it should return; Vitest re-runs them on every save.
- **GitHub Actions** — a robot at GitHub that runs commands you define (test, build, deploy) every time you push.
- **GitHub Pages** — free hosting for static sites, straight out of your repo. This is how you'll share the game as a URL.

---

## 3. The build

### M0 — Setup check (10 min)

Open a terminal **in the repo folder** (`C:\Users\kpeguero\Documents\Extras\minesweeper`). In VS Code: File → Open Folder, then Terminal → New Terminal.

```powershell
node --version    # want v20.19+  (you have v26.4.0)
git status        # want "On branch main", nothing weird
```

✅ **Checkpoint:** both commands print happily.

💾 **Commit** this guide so it's versioned with the project:

```powershell
git add GUIDE.md
git commit -m "Add build guide"
```

---

### M1 — Scaffold the project (30 min)

**Goal:** a running dev server with hot reload, template junk removed.

**1.** In the repo folder:

```powershell
npm create vite@latest . -- --template vanilla-ts
```

(The `.` means "right here"; the `--template vanilla-ts` picks plain TypeScript, no framework. The extra `--` in the middle is npm syntax for "pass the rest through".)

**2.** It will ask two questions. Answer with arrow keys + Enter:

- *"Current directory is not empty. Please choose how to proceed:"* → choose **`Ignore files and continue`**.
  ⚠️ **NOT** "Remove existing files" — that deletes your README and LICENSE.
- *"Install with npm and start now?"* → choose **No**. You'll run the steps yourself so you know what they are.

**3.** Install dependencies and start the dev server:

```powershell
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

✅ **Checkpoint:** the Vite demo page loads (logo + a counter button). Your toolchain works. Leave the server running — it auto-reloads on every save from now on.

**4.** Now strip the demo. Delete these files/folders:

- `src/counter.ts`
- `src/assets/` (whole folder)
- `public/icons.svg` (keep `public/favicon.svg`)

**5.** Replace the entire contents of `src/main.ts` with: 📋

```ts
import './style.css';

console.log('minesweeper coming soon');
```

(That CSS import looks odd — it's how Vite learns your styles exist. One line, just accept it.)

**6.** Empty out `src/style.css` completely (M2 fills it).

**7.** In `index.html`, change the `<title>` to `Minesweeper`.

**8.** Open `tsconfig.json` and add one line at the top of `"compilerOptions"`: 📋

```jsonc
    "strict": true,
```

The current template ships *without* strict mode (verified — surprising but true). Strict mode is the whole reason to use TypeScript: it forces you to handle `null` and missing values instead of discovering them as crashes.

**9.** Open `.gitignore` and confirm it lists `node_modules` and `dist` (the template includes both — just verify).

✅ **Checkpoint:** browser shows a blank page titled **Minesweeper**; F12 → Console shows `minesweeper coming soon`; no red errors in the terminal.

💾 `git add -A` then `git commit -m "Scaffold Vite + TypeScript app"`

---

### M2 — Game state + a grid you can see (1–2 h)

**Goal:** define what a game *is*, and draw a 9×9 grid of raised buttons.

#### The one idea this milestone: a grid in a flat array

The board is stored as ONE flat array, not an array of arrays. Cell at column `x`, row `y` lives at index:

```
i = y * width + x
```

For a 4-wide board:

```
index:   0  1  2  3        x = i % width        (column)
         4  5  6  7        y = Math.floor(i / width)   (row)
         8  9 10 11
        12 13 14 15        e.g. i=9  →  x=1, y=2
```

⚠️ Burn this in now: **`x` is the column and gets `% width`; `y` is the row and gets `/ width`.** Every classic Minesweeper bug is this line backwards — and it hides on square boards where width = height, then explodes on Expert (30×16). We'll test on a non-square board early on purpose.

#### Create `src/board.ts` — types 📋

```ts
export type CellState = 'hidden' | 'revealed' | 'flagged';

export type Cell = {
  mine: boolean;
  adjacent: number; // how many of the up-to-8 neighbors are mines
  state: CellState;
};

export type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

export type Game = {
  cells: Cell[]; // flat array, index = y * width + x
  width: number;
  height: number;
  mineCount: number;
  status: GameStatus;
  hitIndex: number | null; // which mine you clicked, when you lose
};

export const PRESETS = {
  beginner: { width: 9, height: 9, mines: 10 },
  intermediate: { width: 16, height: 16, mines: 40 },
  expert: { width: 30, height: 16, mines: 99 },
} as const;

export type DifficultyName = keyof typeof PRESETS;
```

Note what's *not* here: no mention of buttons, pixels, or clicks. The brain stays pure.

#### `createGame` ✍️ **You write it** (in `board.ts`)

```ts
export function createGame(width: number, height: number, mineCount: number): Game {
  // your code
}
```

Steps:

1. Build an array of `width * height` cells, each one `{ mine: false, adjacent: 0, state: 'hidden' }`.
2. Return a `Game` with those cells, the dimensions, `mineCount`, `status: 'ready'`, `hitIndex: null`.
3. **No mines yet.** Mines get placed on the *first click* (M5) — that's how we guarantee your first click never explodes.

💡 Use `Array.from({ length: width * height }, () => ({ ... }))`.
⚠️ Do **not** use `new Array(n).fill({ ... })` — `fill` puts the **same one object** in every slot, so flagging one cell flags all 81. This is a rite-of-passage bug; skip the ritual.

#### Replace `index.html`'s `<body>` 📋

This is the page's whole skeleton, including pieces that come alive in later milestones (counter/face in M7, difficulty in M9, flag toggle in M10). Adding it once now means you never fight HTML again:

```html
<body>
  <div id="app">
    <div class="header">
      <span id="counter" class="lcd">010</span>
      <button id="face" type="button">🙂</button>
      <span id="timer" class="lcd">000</span>
    </div>
    <div class="controls">
      <select id="difficulty">
        <option value="beginner">Beginner (9×9)</option>
        <option value="intermediate">Intermediate (16×16)</option>
        <option value="expert">Expert (30×16)</option>
      </select>
      <button id="flag-mode" type="button" aria-pressed="false">🚩 Flag mode: off</button>
    </div>
    <div class="board-wrap">
      <div id="grid"></div>
    </div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
```

#### `src/style.css` 📋

The full stylesheet, classic-Windows look, including classes you'll only start *using* in M6–M10:

```css
:root {
  --cell-size: 28px;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #008080; /* classic teal desktop */
  font-family: system-ui, sans-serif;
}

#app {
  background: #c0c0c0;
  padding: 10px;
  border: 3px solid;
  border-color: #fff #7b7b7b #7b7b7b #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 6px;
  margin-bottom: 8px;
  border: 2px solid;
  border-color: #7b7b7b #fff #fff #7b7b7b;
}

.lcd {
  font-family: Consolas, monospace;
  font-size: 22px;
  font-weight: bold;
  color: #f00;
  background: #000;
  padding: 1px 4px;
  min-width: 3ch;
  text-align: right;
}

#face {
  font-size: 20px;
  width: 38px;
  height: 38px;
  cursor: pointer;
  background: #c0c0c0;
  border: 3px solid;
  border-color: #fff #7b7b7b #7b7b7b #fff;
}
#face:active {
  border-color: #7b7b7b #fff #fff #7b7b7b;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.controls select,
.controls button {
  font: inherit;
  cursor: pointer;
}
#flag-mode[aria-pressed='true'] {
  background: #ffd54f;
}

.board-wrap {
  overflow-x: auto; /* Expert is 30 columns; scroll, don't shrink */
  max-width: calc(100vw - 40px);
}

#grid {
  display: grid; /* columns set from JS per game */
  width: max-content;
  border: 3px solid;
  border-color: #7b7b7b #fff #fff #7b7b7b;
}

.cell {
  width: var(--cell-size);
  height: var(--cell-size);
  padding: 0;
  font-family: Consolas, monospace;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  background: #c0c0c0;
  border: 3px solid;
  border-color: #fff #7b7b7b #7b7b7b #fff; /* raised bevel */
  cursor: pointer;
}

.cell.revealed {
  border: 1px solid #9a9a9a; /* flat */
  background: #bdbdbd;
  cursor: default;
}

/* classic number colors */
.n1 { color: #0000ff; }
.n2 { color: #008000; }
.n3 { color: #ff0000; }
.n4 { color: #000080; }
.n5 { color: #800000; }
.n6 { color: #008080; }
.n7 { color: #000000; }
.n8 { color: #808080; }

.cell.hit {
  background: #ff0000; /* the mine you clicked */
}

.cell.wrong {
  background: #ffb3b3; /* a flag that was wrong, shown on loss */
}
```

#### Create `src/render.ts` 📋 (structure) + ✍️ (the render body)

```ts
import type { Game } from './board';

// The face's own handles on the page. `!` tells TypeScript "this exists" —
// safe ONLY because these ids are hardcoded in our index.html.
const gridEl = document.querySelector<HTMLDivElement>('#grid')!;

/** Build the cell buttons once per game. */
export function initGrid(game: Game): void {
  gridEl.innerHTML = ''; // clearing static content — fine. Never build DYNAMIC content with innerHTML.
  gridEl.style.gridTemplateColumns = `repeat(${game.width}, var(--cell-size))`;
  for (let i = 0; i < game.cells.length; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell';
    btn.dataset.index = String(i);
    gridEl.appendChild(btn);
  }
}

/** Make the page match the game. Called after every action. */
export function render(game: Game): void {
  // your code (below)
}
```

✍️ For now `render` is two lines of logic: loop `i` over `game.cells`, grab the matching button with `const btn = gridEl.children[i] as HTMLButtonElement`, and set `btn.className = 'cell'` and `btn.textContent = ''`. (Every cell starts hidden. M6 makes this interesting.)

Why buttons get **updated in place** instead of rebuilt each time: rebuilding mid-click destroys the element under your cursor and causes ghost-click bugs. Build once, mutate forever.

#### Replace `src/main.ts` 📋

```ts
import './style.css';
import { createGame } from './board';
import { initGrid, render } from './render';

let game = createGame(9, 9, 10);

initGrid(game);
render(game);
```

✅ **Checkpoint:** a 9×9 grid of raised silver buttons under a header showing `010 🙂 000`. Hover a cell — cursor becomes a pointer. Nothing is clickable yet (correct!).

💾 `git commit -m "Game state, static grid rendering"` (after `git add -A`)

---

### M3 — Make clicks reach the brain (30 min)

**Goal:** clicking any cell logs its index.

#### The pattern: event delegation 📋 (this is the "shown once in full" novel pattern)

Instead of 480 listeners (one per button), put **one** listener on the grid and ask "which button did this click land on?". Events "bubble" from the button up to the grid, so the grid hears everything. Add to `main.ts`:

```ts
const gridEl = document.querySelector<HTMLDivElement>('#grid')!;

/** Which cell did this event land on? null if it hit a border/gap. */
function cellIndexFromEvent(e: Event): number | null {
  const btn = (e.target as HTMLElement).closest('button[data-index]');
  if (!btn) return null;
  return Number((btn as HTMLElement).dataset.index);
}

gridEl.addEventListener('click', (e) => {
  const i = cellIndexFromEvent(e);
  if (i === null) return;
  console.log('clicked cell', i);
});
```

(`closest` walks upward from whatever was clicked until it finds a cell button — or returns `null` if the click hit the grid's edge. Always guard the `null`.)

✅ **Checkpoint:** F12 console open. Click the four corners of the 9×9 grid — they must log **0** (top-left), **8** (top-right), **72** (bottom-left), **80** (bottom-right). Do the math for 72 yourself once: bottom-left is x=0, y=8 → `8 * 9 + 0`. If your corners log something else, your loop in `initGrid` and this handler disagree — fix it *now*, before any game logic exists.

💾 `git commit -m "Click handling via event delegation"`

---

### M4 — Tests + `neighbors()` (1 h)

**Goal:** a test runner watching your code, and the single most important helper function — bug-proofed by tests.

**1.** Install Vitest and add a script:

```powershell
npm install -D vitest
```

In `package.json`, add to `"scripts"`: 📋

```jsonc
    "test": "vitest",
```

**2.** Open a **second** terminal (keep the dev server in the first) and run `npm test`. Vitest starts in **watch mode**: it re-runs your tests on every save. Leave it running while you work — it's your fastest feedback loop. (Press `q` to quit. On CI it automatically runs once and exits — no config needed.)

**3.** Create `src/board.test.ts` with your first test, given in full as the template to copy for all future tests: 📋

```ts
import { test, expect } from 'vitest';
import { createGame, neighbors } from './board';

test('a middle cell has 8 neighbors', () => {
  const g = createGame(9, 9, 10);
  const middle = 4 * 9 + 4; // x=4, y=4
  expect(neighbors(g, middle)).toHaveLength(8);
});
```

Anatomy: `test(name, fn)` registers a test; inside, you *arrange* (make a game), *act* (call the function), *assert* (`expect(...).toHaveLength(8)`). That's all a test is.

It fails — `neighbors` doesn't exist. Good: that's your to-do list.

#### `neighbors` ✍️ **You write it** (in `board.ts`)

Returns the indices of the up-to-8 cells surrounding `i`. **Every** other function will use this — centralizing edge handling here means edge bugs can only exist in one place.

```ts
export function neighbors(game: Game, i: number): number[] {
  // your code
}
```

Steps:

1. `const x = i % game.width;` and `const y = Math.floor(i / game.width);`
2. Make an empty `result` array.
3. Loop `dy` from −1 to 1, and inside it `dx` from −1 to 1.
4. Skip the center: if `dx === 0 && dy === 0`, `continue`.
5. `const nx = x + dx;` `const ny = y + dy;`
6. Only if `nx >= 0 && nx < game.width && ny >= 0 && ny < game.height`, push `ny * game.width + nx`.
7. Return `result`.

⚠️ **Why you must convert to x/y first:** it's tempting to compute neighbors as `i-1, i+1, i-width...` directly. But in a 9-wide grid, index 8 is the *right edge of row 0* and index 9 is the *left edge of row 1* — arithmetic thinks they're neighbors; geometry says no. The x/y bounds checks in step 6 are the whole fix.

#### More tests ✍️ **You write them** (same file, copy the template's shape)

1. A corner of a 9×9 board has exactly **3** neighbors.
2. A non-corner edge cell has exactly **5**.
3. **The anti-wrap test:** on a 9×9 board, `expect(neighbors(g, 8)).not.toContain(9)` — index 8 (right edge) must NOT list index 9 (next row's left edge).
4. **Non-square:** make `createGame(4, 3, 0)` (4 wide, 3 tall) and check the counts of a corner and a middle cell. If you swapped width/height anywhere, this one catches it.

✅ **Checkpoint:** watch terminal shows all green, something like `Tests  5 passed (5)`.

💾 `git commit -m "neighbors() with tests"`

---

### M5 — The heart: mines, reveal, flood fill, win/lose (one full session)

**Goal:** the complete game brain, fully tested — before it's even visible on screen. This is the milestone where you write real algorithms. Take your time.

#### The one rule that prevents half the bugs

> **Every action function starts with: if the game is over, do nothing.**
>
> ```ts
> if (game.status === 'won' || game.status === 'lost') return;
> ```

This one guard means clicks after the game ends can't corrupt anything — and (you'll see in M8) it's what makes chording safe when it hits a mine halfway through. It's the first line of `reveal`, `toggleFlag`, and later `chord`.

#### 5a. `placeMines` ✍️ **You write it** (in `board.ts`, NOT exported — only `reveal` uses it)

```ts
function placeMines(game: Game, safeIndex: number): void {
  // your code
}
```

Called once, on the first reveal. `safeIndex` is where the player clicked.

1. Build the forbidden zone: `const forbidden = new Set([safeIndex, ...neighbors(game, safeIndex)]);`
   (Excluding the neighbors too — not just the clicked cell — guarantees the first click lands on a `0` and opens a satisfying region instead of a lonely number. This is the modern standard.)
2. Edge case: if `game.cells.length - forbidden.size < game.mineCount` (tiny board, tons of mines), fall back to `forbidden = new Set([safeIndex])`.
3. Place mines one at a time until you've placed `mineCount`: pick `const r = Math.floor(Math.random() * game.cells.length);` — if `r` is forbidden or already a mine, skip and re-roll; otherwise set `game.cells[r].mine = true`.
4. Compute the numbers: for every index `i` whose cell is **not** a mine, set
   `game.cells[i].adjacent = neighbors(game, i).filter((n) => game.cells[n].mine).length;`
   (See why `neighbors` came first? Counting is a one-liner now.)

#### 5b. `reveal` ✍️ **You write it**

```ts
export function reveal(game: Game, i: number): void {
  // your code
}
```

1. Game-over guard (the rule above).
2. First click? If `status === 'ready'`: call `placeMines(game, i)`, then set `status = 'playing'`.
3. If `game.cells[i].state !== 'hidden'`, return. (One check covers both "already revealed" and "flagged" — **a flag protects a cell from being clicked**. That's the entire point of flags.)
4. **Mine?** If `game.cells[i].mine`: set its state to `'revealed'`, set `game.hitIndex = i`, set `status = 'lost'`, then loop over all cells and reveal every other mine (so the player sees the whole minefield). Return.
5. **Safe: flood fill.** Reveal the cell — and if it's a `0`, its neighbors, and *their* neighbors while they're 0s... Use an explicit to-do stack, **not recursion**:

   ```
   stack = [i]
   while stack is not empty:
       j = stack.pop()
       cell = game.cells[j]
       if cell.state !== 'hidden'  →  continue     // THE line. See below.
       cell.state = 'revealed'
       if cell.adjacent === 0  →  push all neighbors(game, j) onto the stack
   ```

   ⚠️ That `continue` line is doing three jobs: it stops the flood at cells you already did (otherwise the loop runs **forever** — if your tab freezes, this line is missing), it makes duplicate stack entries harmless, and — because flagged cells aren't `'hidden'` — **it stops the flood at flags**. Numbered cells get revealed but don't push (they don't have `adjacent === 0`), which is why the flood opens a region and stops at its numbered border.
6. Last line: `checkWin(game);`

#### 5c. `toggleFlag` ✍️ **You write it**

```ts
export function toggleFlag(game: Game, i: number): void {
  // your code
}
```

Game-over guard; then `'hidden'` → `'flagged'`, `'flagged'` → `'hidden'`, `'revealed'` → do nothing.

#### 5d. `checkWin` ✍️ **You write it** (not exported)

```ts
function checkWin(game: Game): void {
  // your code
}
```

You win when **every non-mine cell is revealed**. One line with `.every()`: each cell must be a mine, or revealed. If so, `status = 'won'`.

Note what winning does *not* require: flagging anything. Flags are a memory aid for the player, never homework. (Also note a happy consequence: `placeMines` + this rule = a first click on a 1×1-safe... more practically, if reveal's flood clears the last safe cells, you win with zero flags placed. There's a test for that below.)

#### 5e. Tests — with a hand-built board

Random mines make tests flaky, so tests use a helper that **plants mines exactly where you say**. Paste it into `board.test.ts`: 📋

```ts
import { test, expect } from 'vitest';
import { createGame, neighbors, reveal, toggleFlag } from './board';
import type { Game } from './board';

/** A game with mines exactly where you put them. Skips random placement. */
function createTestGame(width: number, height: number, mines: number[]): Game {
  const g = createGame(width, height, mines.length);
  g.status = 'playing'; // pretend the first click already happened
  for (const m of mines) g.cells[m].mine = true;
  for (let i = 0; i < g.cells.length; i++) {
    if (!g.cells[i].mine) {
      g.cells[i].adjacent = neighbors(g, i).filter((n) => g.cells[n].mine).length;
    }
  }
  return g;
}
```

(Note `import type { Game }` — this tsconfig requires the `type` keyword when importing something that's only a type. If you forget, TypeScript's error message tells you exactly this.)

All scenario tests use this one tiny board — one mine at index 5:

```
 0  1  2  3          .  .  .  .
 4  5  6  7          .  *  .  .        * = mine
 8  9 10 11          .  .  .  .        cells 0,1,2,4,6,8,9,10 → "1"
12 13 14 15          .  .  .  .        cells 3,7,11,12,13,14,15 → "0"
```

✍️ **You write these** (each is 3–6 lines, same shape as the template):

1. **Flood reveals the region and its border — and only that:** `createTestGame(4, 4, [5])`, `reveal(g, 15)`. The flood opens all seven 0s and the numbers *touching* them — twelve cells. But expect cells **0, 1, and 4 to still be `'hidden'`**: they're numbers fenced off from every 0 by other numbers, and numbers never spread the flood. (Trace it on the diagram — this is the subtlety that makes flood fill *flood fill* and not "reveal everything".) The mine is still `'hidden'`, status still `'playing'`.
2. **Win, with zero flags:** continue that game — `reveal(g, 0)`, `reveal(g, 1)`, `reveal(g, 4)`. That's the last safe cells: `status === 'won'`, and not one flag was placed. Flags are optional; the win condition never mentions them.
3. **Flags block reveal:** fresh game, `toggleFlag(g, 0)` then `reveal(g, 0)` → cell 0 is still `'flagged'`, not revealed.
4. **Flags block the flood — and can wall cells off:** fresh game, `toggleFlag(g, 13)`, then `reveal(g, 15)`. Expect: 13 still `'flagged'`, **and 12 still `'hidden'`** — the only zero-path to 12 went through 13, so the flag walled it off (8 and 9 are numbers; numbers never spread the flood). And therefore `status` is still `'playing'`.
5. **Loss:** fresh game, `reveal(g, 5)` → `status === 'lost'`, `hitIndex === 5`, and the mine's state is `'revealed'`.
6. **Game over freezes the board:** continue from the loss — `reveal(g, 0)` and `toggleFlag(g, 0)` → cell 0 is still `'hidden'`, status still `'lost'`.

And the first-click-safety test — this one's given, because the *looping* style is the thing being demonstrated: 📋

```ts
test('first click is never a mine and always opens a zero region', () => {
  for (let k = 0; k < 50; k++) {
    const g = createGame(9, 9, 10); // real random placement
    const i = Math.floor(Math.random() * 81);
    reveal(g, i);
    expect(g.cells[i].mine).toBe(false);
    expect(g.cells[i].adjacent).toBe(0);
    expect(g.status).not.toBe('lost');
  }
});
```

(50 random games, every one must behave. Randomness in the game, determinism in the assertion.)

💡 **Debugging tip for this milestone:** your game is plain data, so you can *print the board*. Consider writing a 6-line helper `boardToString(game)` that returns rows of characters (`#` hidden, `F` flag, `*` mine, digits/space revealed) and `console.log` it inside a failing test. Ugly-print beats squinting at object dumps.

✅ **Checkpoint:** all tests green (should be ~12 by now).

💾 `git commit -m "Core game logic: mines, reveal, flood fill, win/loss"`

---

### M6 — See it on screen (1–2 h)

**Goal:** clicking actually plays — regions open, numbers show in classic colors, mines explode.

#### Extend `render` ✍️ **You write it** (in `render.ts`)

Your M2 loop already visits every cell and its button. Now set `className` and `textContent` from this table — top-to-bottom, first matching row wins:

| # | Cell is... | `className` | `textContent` |
|---|---|---|---|
| 1 | flagged, game lost, **not** a mine | `'cell wrong'` | `'❌'` |
| 2 | flagged (anything else) | `'cell'` | `'🚩'` |
| 3 | hidden | `'cell'` | `''` |
| 4 | revealed mine, `i === game.hitIndex` | `'cell revealed hit'` | `'💣'` |
| 5 | revealed mine | `'cell revealed'` | `'💣'` |
| 6 | revealed, `adjacent > 0` | `` `cell revealed n${cell.adjacent}` `` | `String(cell.adjacent)` |
| 7 | revealed, `adjacent === 0` | `'cell revealed'` | `''` |

(Row 1 is why `render` gets the whole `game`, not just a cell: "was this flag wrong?" needs `game.status`. Rows 6's `n1`–`n8` classes hit the classic colors already sitting in your CSS.)

#### Wire the click (in `main.ts`)

Replace the `console.log` in your click listener: ✍️

```ts
reveal(game, i);
render(game);
```

(Import `reveal` from `./board`.) That's the three-beat rhythm from section 1, in the flesh: event → brain → face.

✅ **Checkpoint:** in the browser —

- First click opens a region of blanks ringed by colored numbers. Try several new games (reload the page): the first click **never** lands on a bare number and never explodes.
- Click a number-adjacent hidden cell until you find a mine: every 💣 appears, yours on a red square, and the board freezes (more clicks do nothing).
- The classic colors read right: 1 blue, 2 green, 3 red.

💾 `git commit -m "Playable reveal with classic rendering"`

---

### M7 — Flags, counter, face (1–2 h)

**Goal:** right-click flags, the mine counter counts down, the face reacts and resets.

**1. Right-click → flag.** In `main.ts`: 📋

```ts
gridEl.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // always — even off-cell, the browser menu never belongs on the board
  const i = cellIndexFromEvent(e);
  if (i === null) return;
  toggleFlag(game, i);
  render(game);
});
```

**2. Header rendering.** In `render.ts`, add lookups for `#counter` and `#face` next to `gridEl`, and extend `render` to update them: ✍️

- **Counter** = `game.mineCount − (number of flagged cells)`. Count with a `.filter().length`. Classic LCD shows 3 digits — write a tiny `formatCounter(n: number): string`:
  - `10` → `'010'`, `0` → `'000'` (pad with `String(n).padStart(3, '0')`)
  - negative numbers happen (flag more than there are mines) and classic shows them: `-5` → `'-05'` — ⚠️ `padStart` alone gives `'0-5'`, so handle `n < 0` as `'-' + pad(abs(n), 2)`.
- **Face** from `game.status`: `ready`/`playing` → 🙂, `won` → 😎, `lost` → 😵.

**3. Reset.** In `main.ts`, a `newGame` function and a face listener: ✍️

```ts
function newGame(width: number, height: number, mines: number): void {
  // your code: replace `game`, initGrid(game), render(game)
}
```

Face click → `newGame(9, 9, 10)`.

✅ **Checkpoint:** right-click plants 🚩 and the counter drops; right-click again removes it; a flagged cell ignores left-click; over-flagging goes negative like `-01`; lose → 😵 and any wrong flags show ❌; win... hard to do on purpose at 9×9? Flag-count your way through a corner — or trust the M5 win test and verify 😎 in M8. Face click always deals a fresh board. **No browser context menu anywhere on the grid.**

💾 `git commit -m "Flags, mine counter, face reset"`

---

### M8 — Chording (1–2 h)

**Goal:** the move that makes Minesweeper *fast*. When a revealed number already has exactly that many flags around it, clicking it reveals all its other neighbors at once.

#### `chord` ✍️ **You write it** (in `board.ts`)

```ts
export function chord(game: Game, i: number): void {
  // your code
}
```

1. Game-over guard.
2. Only revealed numbers chord: if the cell's state isn't `'revealed'` or its `adjacent === 0`, return.
3. Count flagged neighbors. If that count `!==` the cell's `adjacent`, return. (Strict equality — an over-flagged number refuses too.)
4. For each neighbor still `'hidden'`: `reveal(game, n)`.

That's it — and step 4 is deliberately lazy. If the player's flags were **wrong**, one of those reveals hits a mine, `status` flips to `'lost'`, and every remaining `reveal` in your loop silently no-ops via the game-over guard. The invariant from M5 just paid for itself. (Chording into a mine because your flag was misplaced is *correct Minesweeper* — the game punishing a wrong deduction.)

#### Wire it (in `main.ts`) ✍️

Left-clicking a **revealed** cell means chord; left-clicking a hidden cell means reveal. Restructure the click listener:

```ts
if (game.cells[i].state === 'revealed') {
  chord(game, i);
} else {
  reveal(game, i);
}
render(game);
```

Optionally also add middle-click (nice on desktop, 4 lines): an `'auxclick'` listener on the grid — if `e.button === 1`, same `chord` + `render`. (We deliberately skip the old simultaneous left+right-click gesture — it's the most bug-prone input code in classic clones, and left-click-on-number does the same job.)

#### Tests ✍️ (same 4×4 board, mine at 5)

1. **Correct flag chords — twice, to a win:** `toggleFlag(g, 5)`, `reveal(g, 9)` (a "1"), then `chord(g, 9)` → 9's hidden neighbors reveal and the zeros among them flood the board — *except* cells 0 and 1, which stay `'hidden'` (fenced off, same as M5's first test), so `status` is still `'playing'`. Now `chord(g, 4)` — cell 4 was just revealed as a "1" and its one flag (the mine) satisfies it → reveals 0 and 1 → **`status === 'won'`**. One test proves chording works *and* that a chord can deliver the win.
2. **Wrong flag loses:** `reveal(g, 9)`, `toggleFlag(g, 4)` (wrong guess, but 9 is "satisfied"), `chord(g, 9)` → the real mine at 5 gets revealed → `'lost'`.
3. **Unsatisfied no-ops:** `reveal(g, 9)`, no flags, `chord(g, 9)` → nothing changed, still `'playing'`.

✅ **Checkpoint:** play a full Beginner game using chords — reveal, flag the obvious mines, click the numbers to cascade. Win it: 😎. Notice how much faster the game feels; that's why this feature is non-negotiable.

💾 `git commit -m "Chording"`

---

### M9 — Timer + difficulty (1–2 h)

**Goal:** the LCD timer, and all three classic board sizes.

#### The refactor first: one door for all actions 📋

Right now three listeners each do "brain call, then render". The timer needs to react to *status changes* (started? ended?), and M12's stats will too. Instead of sprinkling that everywhere, funnel every action through one function. In `main.ts`:

```ts
function dispatch(action: () => void): void {
  const before = game.status;
  action();
  render(game);
  if (before === 'ready' && game.status === 'playing') {
    startTimer();
  }
  if (before === 'playing' && (game.status === 'won' || game.status === 'lost')) {
    const seconds = stopTimer();
    // M12 will record stats here — this is the only place a game ever ends.
  }
}
```

Update the three listeners to use it, e.g. `dispatch(() => reveal(game, i));` — and delete their direct `render` calls (dispatch renders).

#### The timer ✍️ **You write it** (in `main.ts`)

⚠️ Design note before you write it: do **not** keep a counter you `++` every second. Intervals drift, and browsers throttle timers in background tabs — your "seconds" would lie. Instead, **remember when the game started and compute the difference**:

- Module-level state: `let startTime: number | null = null;` and `let timerId: number | null = null;`
- `startTimer()`: `startTime = Date.now();` then `timerId = window.setInterval(...)` every ~250 ms setting the `#timer` element to `formatCounter(Math.min(elapsedSeconds(), 999))` — where `elapsedSeconds()` is `Math.floor((Date.now() - startTime) / 1000)`. (Reuse `formatCounter` — export it from `render.ts`.)
- `stopTimer(): number`: clear the interval, return the **uncapped** `elapsedSeconds()` — the display caps at 999 like the original, but M12's best-times want the truth.
- `resetTimer()`: clear the interval, null the state, set the display back to `'000'`. Call it inside `newGame`.

#### Difficulty ✍️ (in `main.ts`)

You already have `newGame(w, h, mines)` and the `<select id="difficulty">` in the HTML. Wire them:

- Import `PRESETS` (and the `DifficultyName` type) from `./board`.
- Track the current choice: `let difficulty: DifficultyName = 'beginner';`
- `change` listener on the select: set `difficulty` from `select.value as DifficultyName`, then start a new game from `PRESETS[difficulty]`.
- Face click now re-deals the *current* difficulty.

(`newGame` calls `initGrid`, which already rebuilds the right number of buttons and sets `gridTemplateColumns` from the game's width — M2 you was setting future you up.)

✅ **Checkpoint:** timer stays `000` until your **first reveal** (not on page load, not on flags), ticks up, and freezes on win/loss. Face click resets it. Switch to Expert: the board is **30 wide, 16 tall** — if it renders 16 wide, you've swapped width/height somewhere and the M4 non-square test should be your first suspect. Intermediate shows `040` mines.

💾 `git commit -m "Timer and difficulty presets"`

---

### M10 — Phones and trackpads: flag mode (1 h)

**Goal:** playable on a touchscreen, where right-click doesn't exist.

The fix is a toggle: when **Flag mode** is on, a plain tap flags instead of reveals. (The `#flag-mode` button has been sitting in your HTML since M2.) ✍️ In `main.ts`:

- `let flagMode = false;`
- Click listener on `#flag-mode`: flip the boolean, and reflect it in the UI — `btn.setAttribute('aria-pressed', String(flagMode))` (the CSS highlights it) and swap its label text between `🚩 Flag mode: off` / `: on`.
- In the grid click handler, the decision becomes three-way:

  ```
  revealed cell        → chord   (unchanged — works great on touch)
  flagMode on          → toggleFlag
  otherwise            → reveal
  ```

✅ **Checkpoint:** in the browser press F12 → click the device-toolbar icon (Ctrl+Shift+M) → pick a phone. Tap cells: reveals. Toggle flag mode (it highlights): taps now plant 🚩. On Expert, the board scrolls horizontally inside its frame instead of squishing. Also try flag mode with your mouse — it's genuinely nicer than right-click on a laptop trackpad.

💾 `git commit -m "Flag mode toggle for touch"`

---

### M11 — Ship it: GitHub Pages (1 h)

**Goal:** your game at `https://kpeguero16.github.io/minesweeper/` — updated automatically every time you push.

How the pieces fit: you push → **GitHub Actions** (the robot) checks out your code on a fresh machine, runs your tests, runs the build → uploads the `dist/` folder → **GitHub Pages** serves it at that URL. You configure the robot with one YAML file; you never build on your own machine again.

**1. Tell Vite about the subpath.** Your site lives at `/minesweeper/`, not at the domain root — Vite needs to know or every asset link 404s. Create `vite.config.ts` in the repo root: 📋

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/minesweeper/',
});
```

**2. Prove the build works locally, once:**

```powershell
npm run build
npm run preview
```

Open the printed URL (note it already serves under `/minesweeper/`) and play a quick game. `build` also type-checks everything strictly — fix anything it flags.

**3. The robot's instructions.** Create `.github/workflows/deploy.yml` (folders matter, spelling matters — Actions only looks exactly there): 📋

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm test        # vitest sees CI and runs once instead of watching
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

(Reading it top to bottom: on every push to `main` → one job installs, tests, builds, and uploads `dist`; a second job publishes that upload to Pages. The `permissions` block is what authorizes the publish — miss it and the deploy fails with a permissions error. `npm ci` is `npm install`'s stricter CI sibling: exact versions from your lockfile.)

**4. The one-time manual switch** (no workflow can do this part for you):

1. Open `https://github.com/Kpeguero16/minesweeper` in your browser
2. **Settings** tab (top of the repo)
3. **Pages** in the left sidebar (under "Code and automation")
4. Under **Build and deployment → Source**, pick **GitHub Actions** from the dropdown. No save button — it applies immediately.

**5. Push:**

```powershell
git add -A
git commit -m "Deploy workflow"
git push
```

**6. Watch it go:** repo → **Actions** tab → your run appears within seconds. Click it to watch both jobs. Green checkmarks ≈ 1–2 minutes.

✅ **Checkpoint:** visit **`https://kpeguero16.github.io/minesweeper/`** — play a game. Then open it on your actual phone and flag-mode a few cells. Then send the link to someone.

💾 Already committed — this milestone *was* a commit.

---

### M12 — Phase 2: stats that survive (2–3 h, optional — the game is complete without it)

**Goal:** best times, win rate, and streaks — remembered between visits via `localStorage` (a tiny per-site key-value store in the browser; stores strings only, so JSON in/out).

#### Create `src/stats.ts` — shape 📋, logic ✍️

```ts
export type DifficultyStats = {
  played: number;
  won: number;
  bestTime: number | null; // seconds; null until the first win
  currentStreak: number;
  longestStreak: number;
};

export type Stats = {
  version: 1; // bump this if the shape ever changes, so old blobs can be detected
  difficulties: Record<string, DifficultyStats>;
};

const KEY = 'minesweeper:stats';
```

✍️ Three functions, with their contracts:

- `loadStats(): Stats` — read `localStorage.getItem(KEY)`, `JSON.parse` it, check `parsed.version === 1`, return it. **Wrap the whole thing in `try/catch`** and return a fresh default `Stats` on *any* failure. A corrupt blob, a privacy setting, an old version — none of them may ever crash the game. Stats are decoration; the game is the product.
- `saveStats(stats: Stats): void` — `setItem(KEY, JSON.stringify(stats))`, **also in try/catch** with an empty catch. (Yes, *writing* can throw: private-browsing modes and storage-blocking settings do this. The game must shrug and play on.)
- `recordGame(difficulty: string, won: boolean, seconds: number): Stats` — load, update, save, return (returning makes displaying easy). Update rules: `played++`; if won: `won++`, `currentStreak++`, `longestStreak = max(longest, current)`, and `bestTime = min(bestTime ?? Infinity, seconds)`; if lost: `currentStreak = 0`.

#### Hook it in — one line, one place ✍️

Remember M9's `dispatch` comment — "this is the only place a game ever ends"? That's the hook. In the `playing → won/lost` branch: `recordGame(difficulty, game.status === 'won', seconds)`. Because it lives on the status *transition*, a game can never be double-counted — there's no second moment at which `before` was `'playing'` and now it isn't.

#### Show it ✍️

Keep it humble: add `<div id="stats"></div>` under `.board-wrap` in the HTML, and after recording, set its text to something like:

```
Beginner — best 34s · won 12/30 (40%) · streak 3 (max 5)
```

Also show existing stats on load and when switching difficulty (`loadStats()` — it's cheap).

✅ **Checkpoint (three parts):**

1. Win a Beginner game → stats line appears. **Reload the page** → still there.
2. Win again, slower → best time keeps the *lower* number.
3. **The corruption drill:** F12 → Console → `localStorage.setItem('minesweeper:stats', '{oops')` → reload. The game must load and play normally, stats simply reset. That try/catch just earned its keep.

💾 `git commit -m "Persistent stats"` — and push, and your deployed game has stats too.

---

## When you're stuck

First, the universal move: **your game is plain data.** In the console, type your way in — or add `console.log(game.status, game.cells[i])` at the top of a handler. In tests, print the board. Almost every bug is visible in the data long before it's obvious on screen.

| Symptom | Likely cause | Fix |
|---|---|---|
| Flagging one cell flags many / all cells change together | `new Array(n).fill({...})` — every slot is the **same object** | Build cells with `Array.from({length}, () => ({...}))` (fresh object per slot) |
| Cells at row edges interact with the far side of the next row | Neighbor math done on indices (`i±1`) without bounds checks | Convert to x/y, bounds-check both, convert back — see M4. The anti-wrap test catches it |
| Board looks right but Expert is 16 wide | `width`/`height` swapped somewhere | The M4 non-square test narrows it to one function |
| Tab freezes when revealing | Flood loop never terminates | The `continue`-if-not-`'hidden'` check is missing/after the push — see M5 step 5 |
| Click does something (log proves it) but screen doesn't change | Forgot `render(game)` — or, after M9, called the brain directly instead of via `dispatch` | Every action goes through `dispatch` |
| Browser's right-click menu opens over the board | `e.preventDefault()` missing in the `contextmenu` listener, or listener on the wrong element | It goes on `#grid`, and `preventDefault` runs unconditionally |
| Clicking between cells crashes: "Cannot read ... of null" | `closest()` found no button and you didn't guard | `if (i === null) return;` |
| TS: "Object is possibly 'null'" on `querySelector` | Strict mode doing its job | For elements hardcoded in *your own* index.html, the trailing `!` is a legitimate promise. Anywhere else, actually check |
| TS: error mentioning `verbatimModuleSyntax` on an import | Importing a type without the keyword | `import type { Game } from './board';` |
| `npm test` seems "stuck" | It's watch mode — that's the feature | Leave it running in its own terminal; `q` quits |
| Vitest can't find your tests | Filename doesn't end `.test.ts`, or missing imports | `import { test, expect } from 'vitest';` |
| `npm run dev` says port in use | Another dev server still running | Use the new URL it picked (5174), or close the other terminal |
| Git shows thousands of changed files | `node_modules` got committed | `git rm -r --cached node_modules`, confirm `.gitignore`, commit |
| Git warns "LF will be replaced by CRLF" | Windows line endings | Harmless. Ignore |
| `npm run build` errors but dev was fine | `build` runs the strict type-checker; dev is lenient | Read the first error, fix, repeat — they're almost always real |
| **Deployed page is blank** | Wrong `base` — assets 404 | F12 → Network → red 404s prove it. `vite.config.ts` must say `base: '/minesweeper/'` exactly. Renamed the repo? Rename the base |
| Actions run fails on the deploy step ("Not Found" / permissions) | The one-time Pages switch was skipped | Settings → Pages → Source → **GitHub Actions** (M11 step 4), then re-run the workflow from the Actions tab |
| Emoji (🚩💣) render at odd sizes per device | Platform emoji fonts differ | Cosmetic. `font-size`/`line-height` on `.cell` tames it |

Still stuck after 20 minutes? Commit what you have (even broken, on a branch if you like), take a break, and re-read the milestone's ⚠️ boxes — they were written from exactly these failures.

## Sanctioned shortcuts

If a milestone drags, these trims are legitimate — noted so you know what you're trading:

- **Skip middle-click chord** (M8). Left-click-on-number does the same job; `auxclick` adds nothing but desktop nicety.
- **Simpler timer** (M9): a plain `setInterval` counter that `++`s a number. Trade-off: it drifts and background tabs throttle it — fine for casual play, and you can swap in timestamps later without touching anything else.
- **Defer the face** (M7): a plain "New game" button first; emoji when you feel like it.
- **One difficulty until M9**: hardcode Beginner everywhere and add the selector last. (The guide already orders it this way — this shortcut just says you can *ship* before M9.)
- **Skip M12 entirely.** The game is complete without stats. It'll still be here.

What is *not* a sanctioned shortcut: chording itself (M8) — it's the difference between a demo and a game people actually enjoy — and first-click safety, which you already got for free in M5.

## Next steps

Ranked — each one builds on something you now understand:

1. **Polish the stats UI** — a small table across all three difficulties instead of one line; maybe a "reset stats" button (with confirm).
2. **Question-mark flags** — the classic third right-click state. Touches `CellState`, `toggleFlag`, `render`. A nice warm-up refactor: you'll feel how cheap changes are when logic is pure and tested.
3. **Keyboard play** — arrow keys move a focus highlight, Enter reveals, F flags. The proper pattern is a "roving tabindex" (one cell focusable at a time) plus ARIA grid roles. Real accessibility work, very learnable at this codebase's size.
4. **Seeded boards / daily challenge** — replace `Math.random` in `placeMines` with a seedable random generator passed into `createGame` (look up "mulberry32" — 4 lines). Same seed = same board: share a seed with a friend, race the same minefield. This is the dependency-injection idea we deliberately skipped earlier, arriving with a reason.
5. **Guess-free boards** — the deep one. Generate a board, run a *solver* that only uses logical deductions; if it must guess, regenerate. You'll write a constraint-propagation loop and learn why Expert sometimes forces a coin flip. (Search: "minesweeper no-guess generation".)
6. **Juice** — reveal animations, sounds, a dark theme via CSS variables, confetti on a best time.
7. **Desktop app** — wrap the site in Tauri for a real installable `.exe`. Your brain/face split means zero game code changes.

---

*Built something? Fix a typo in this guide? It's your repo — commit to it. 🙂*
