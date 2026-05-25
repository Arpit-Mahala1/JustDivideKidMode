# Just Divide - Kid Mode

A responsive ReactJS implementation of the "Just Divide - Kid Mode".

## What is included

- Responsive 4x4 grid game interface
- Drag-and-drop tile placement for desktop and touch devices
- KEEP slot with swap support
- TRASH slot with limited uses
- Equal and divisible tile merge rules
- Undo, restart, hints, difficulty toggle, and persistent best score
- Session timer and level progression

## Run locally

```bash
cd "JustDivideKidMode"
npm install
npm run dev
```

Then open the local Vite URL in your browser.

## Notes

- Best score is saved in `localStorage` under `just-divide-best-score`.
- Difficulty keys: `1` = Easy, `2` = Medium, `3` = Hard.
- Keyboard shortcuts: `Z` = Undo, `R` = Restart, `G` = Toggle hints.

## Approach

Built as a lightweight React app with a custom 4x4 grid state model and drag-and-drop tile placement. The game logic resolves tile merges by exact equality or divisibility, while the UI keeps controls simple with keep/trash slots, queue preview, and a level-based trash budget.

## Key decisions

- Used React state hooks for grid, queue, score, undo history, timer, and difficulty.
- Implemented drag-and-drop using pointer events so the interface works on desktop and touch devices without extra libraries.
- Chose a divisibility merge rule to make gameplay strategic and visually easy to follow.
- Persisted best score in `localStorage` so performance is retained across browser sessions.

## Challenges

- Balancing tile generation and difficulty: larger numbers and primes were added at higher difficulty levels to create more challenging board states.
- Handling merge resolution cleanly without introducing unstable grid updates or invalid chain reactions.
- Keeping the UI responsive and touch-friendly while preserving clear feedback for keep/trash actions and game over states.

## What I would improve

- Add a score leaderboard for creating friendly competiton.
- Add a polished onboarding/tutorial overlay to explain the divisibility rules for new players.
- Add sound and animation feedback for merges, trash, and level progression.
- Introduce richer scoring and combo tracking to reward advanced play.
- Create a mobile-first layout optimization for smaller screens and improve accessibility support.
