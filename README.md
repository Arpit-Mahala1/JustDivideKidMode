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
