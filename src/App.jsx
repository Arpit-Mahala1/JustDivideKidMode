import { useEffect, useRef, useState } from 'react';
import catImage from './assets/Cat.png';

const TILE_VALUES = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15];
const DIFFICULTY = {
  1: { label: 'Easy', trash: 5 },
  2: { label: 'Medium', trash: 4 },
  3: { label: 'Hard', trash: 3 }
};

const randomTile = (difficulty = 1) => {
  // Pools tuned per difficulty: include larger numbers and primes to increase challenge
  const easy = [2,3,4,5,6,7,8,9,10,12,14,15,16,18,20,21];
  const medium = [2,3,4,5,6,7,8,9,10,12,14,15,16,18,20,21,22,24,25,26,27,28,30,32,33,34,35,36,38,39,40,42,44,45,46,48,49,50];
  const hard = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,54,55,56,57,58,60,63,64,66,68,70,72,75,77,80,84,88,90,96,100];
  if (difficulty <= 1) return easy[Math.floor(Math.random() * easy.length)];
  if (difficulty === 2) return medium[Math.floor(Math.random() * medium.length)];
  return hard[Math.floor(Math.random() * hard.length)];
};
const emptyGrid = () => Array(16).fill(0);
const getNeighbors = (index) => {
  const row = Math.floor(index / 4);
  const col = index % 4;
  const result = [];
  if (row > 0) result.push(index - 4);
  if (row < 3) result.push(index + 4);
  if (col > 0) result.push(index - 1);
  if (col < 3) result.push(index + 1);
  return result;
};

const canMerge = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  const [small, big] = a < b ? [a, b] : [b, a];
  return big % small === 0;
};

const resolvePlacement = (grid, index) => {
  const nextGrid = [...grid];
  let activeIndex = index;
  let activeValue = nextGrid[index];
  let scoreDelta = 0;

  while (activeValue !== 0) {
    let merged = false;
    const neighbors = getNeighbors(activeIndex);

    for (const neighbor of neighbors) {
      const neighborValue = nextGrid[neighbor];
      if (!neighborValue) continue;

      if (neighborValue === activeValue) {
        scoreDelta += activeValue * 2;
        nextGrid[activeIndex] = 0;
        nextGrid[neighbor] = 0;
        activeValue = 0;
        merged = true;
        break;
      }

      const [small, big] = activeValue < neighborValue ? [activeValue, neighborValue] : [neighborValue, activeValue];
      if (big % small === 0) {
        const result = big / small;
        if (result === 1) {
          scoreDelta += 1;
          nextGrid[activeIndex] = 0;
          nextGrid[neighbor] = 0;
          activeValue = 0;
          merged = true;
          break;
        }
        scoreDelta += result;
        const largerIndex = activeValue === big ? activeIndex : neighbor;
        const smallerIndex = activeValue === small ? activeIndex : neighbor;
        nextGrid[largerIndex] = result;
        nextGrid[smallerIndex] = 0;
        activeIndex = largerIndex;
        activeValue = result;
        merged = true;
        break;
      }
    }

    if (!merged) break;
  }

  return { grid: nextGrid, scoreDelta };
};

const buildQueue = (difficulty = 1) => [randomTile(difficulty), randomTile(difficulty), randomTile(difficulty)];

export default function App() {
  const [grid, setGrid] = useState(emptyGrid());
  const [difficulty, setDifficulty] = useState(1);
  const [queue, setQueue] = useState(buildQueue(1));
  const [keepValue, setKeepValue] = useState(0);
  const [score, setScore] = useState(0);
  const [trashUsed, setTrashUsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [dragState, setDragState] = useState({ active: false, value: null, x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [history, setHistory] = useState([]);
  const [showHints, setShowHints] = useState(false);

  const keepRef = useRef(null);
  const trashRef = useRef(null);
  const gridRefs = useRef([]);

  const level = Math.floor(score / 20) + 1;
  const trashCount = DIFFICULTY[difficulty].trash + level - 1 - trashUsed;

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSeconds((seconds) => {
        const next = seconds + 1;
        if (next >= 300) {
          setGameOver(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  const checkGameOver = (nextGrid) => {
    if (nextGrid.some((value) => value === 0)) return false;
    for (let i = 0; i < 16; i += 1) {
      for (const neighbor of getNeighbors(i)) {
        if (canMerge(nextGrid[i], nextGrid[neighbor])) return false;
      }
    }
    return true;
  };

  const resetGame = (levelParam) => {
    const level = typeof levelParam === 'number' ? levelParam : difficulty;
    setDifficulty(level);
    setGrid(emptyGrid());
    setQueue(buildQueue(level));
    setKeepValue(0);
    setScore(0);
    setTrashUsed(0);
    setGameOver(false);
    setSeconds(0);
    setHistory([]);
  };

  const setGridRef = (element, index) => {
    gridRefs.current[index] = element;
  };

  const dropAt = (clientX, clientY) => {
    if (!dragState.active) return;
    const hitGrid = gridRefs.current.findIndex((ref) => {
      if (!ref) return false;
      const rect = ref.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    });
    if (hitGrid !== -1) {
      placeTile(hitGrid);
      return;
    }
    if (keepRef.current) {
      const rect = keepRef.current.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        keepAction();
        return;
      }
    }
    if (trashRef.current) {
      const rect = trashRef.current.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        trashAction();
      }
    }
  };

  const placeTile = (index) => {
    if (gameOver || grid[index] !== 0) return;
    // save snapshot for undo (limit 20)
    setHistory((h) => [...h.slice(-19), { grid, queue, keepValue, score, trashUsed, seconds }]);
    const nextGrid = [...grid];
    nextGrid[index] = queue[0];
    const outcome = resolvePlacement(nextGrid, index);
    setGrid(outcome.grid);
    setScore((value) => value + outcome.scoreDelta);
    setQueue((prev) => [prev[1], prev[2], randomTile(difficulty)]);
    setGameOver(checkGameOver(outcome.grid));
  };

  const trashAction = () => {
    if (gameOver || trashCount <= 0) return;
    setHistory((h) => [...h.slice(-19), { grid, queue, keepValue, score, trashUsed, seconds }]);
    setTrashUsed((value) => value + 1);
    setQueue((prev) => [prev[1], prev[2], randomTile(difficulty)]);
  };

  const keepAction = () => {
    if (gameOver) return;
    setHistory((h) => [...h.slice(-19), { grid, queue, keepValue, score, trashUsed, seconds }]);
    if (keepValue === 0) {
      setKeepValue(queue[0]);
      setQueue((prev) => [prev[1], prev[2], randomTile(difficulty)]);
      return;
    }
    setQueue((prev) => [keepValue, prev[1], prev[2]]);
    setKeepValue(queue[0]);
  };

  const undoAction = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGrid(last.grid);
    setQueue(last.queue);
    setKeepValue(last.keepValue);
    setScore(last.score);
    setTrashUsed(last.trashUsed);
    setSeconds(last.seconds);
    setGameOver(checkGameOver(last.grid));
  };

  const handlePointerDown = (event) => {
    if (gameOver || queue[0] === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({
      active: true,
      value: queue[0],
      x: event.clientX - rect.width / 2,
      y: event.clientY - rect.height / 2,
      offsetX: rect.width / 2,
      offsetY: rect.height / 2
    });
  };

  useEffect(() => {
    if (!dragState.active) return undefined;

    const handleMove = (event) => {
      setDragState((prev) => ({
        ...prev,
        x: event.clientX - prev.offsetX,
        y: event.clientY - prev.offsetY
      }));
    };

    const handleUp = (event) => {
      dropAt(event.clientX, event.clientY);
      setDragState({ active: false, value: null, x: 0, y: 0, offsetX: 0, offsetY: 0 });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState.active, dropAt]);

  // Keyboard shortcuts: Z=Undo, R=Restart, 1/2/3 difficulty, G toggle hints
  useEffect(() => {
    const handleKey = (e) => {
      // ignore if typing in an input
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') undoAction();
      if (key === 'r') resetGame();
      if (key === 'g') setShowHints((s) => !s);
      if (['1', '2', '3'].includes(key)) {
        const level = Number(key);
        // apply immediately with the selected difficulty
        resetGame(level);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [history, grid, queue, keepValue, score, trashUsed, seconds]);

  const formatTime = (value) => {
    const minutes = Math.floor(value / 60).toString().padStart(2, '0');
    const secondsValue = (value % 60).toString().padStart(2, '0');
    return `${minutes}:${secondsValue}`;
  };

  const tileClass = (value) => {
    if (!value) return 'tile empty';
    const colorIndex = (value % 5) + 1;
    return `tile value-${value} color-${colorIndex}`;
  };

  return (
    <div className="app-shell">
      <div className="app-container">
        <header className="top-header">
          <div className="title-block">
            <p className="eyebrow">JUST DIVIDE</p>
            <h1>Split and match tiles by division.</h1>
            <p className="subtitle">Solve rows and columns by dividing numbers to keep the board alive.</p>
          </div>
          <div className="timer-badge">
            <span>SESSION TIMER</span>
            <strong>{formatTime(seconds)}</strong>
          </div>
        </header>

        <section className="game-grid-area">
          <div className="game-column">
            <div className="cat-row">
              <div className="badge side-badge">
                <span>LEVEL</span>
                <strong>{level}</strong>
              </div>
              <div className="cat-wrapper">
                <img src={catImage} alt="Cat guide" />
              </div>
              <div className="badge side-badge">
                <span>SCORE</span>
                <strong>{score}</strong>
              </div>
            </div>

            <div className="board-card">
              <div className="grid-board">
                {grid.map((value, index) => (
                  <div
                    ref={(element) => setGridRef(element, index)}
                    key={index}
                    className={`grid-cell ${value ? 'filled' : 'empty'}`}
                  >
                    {value ? <div className={tileClass(value)}>{value}</div> : <div className="cell-dot" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="side-panel">
            <div className="panel-block keep-panel" ref={keepRef}>
              <div className="panel-label">KEEP</div>
              <div className="keep-slot">{keepValue ? <div className={tileClass(keepValue)}>{keepValue}</div> : <div className="placeholder">Empty</div>}</div>
            </div>

            <div className="panel-block queue-panel">
              <div className="panel-label">QUEUE</div>
              <div className="queue-list">
                {queue.map((value, index) => (
                  <div key={index} className={`queue-item ${index === 0 ? 'active' : ''}`}>
                    <div
                      className={tileClass(value)}
                      onPointerDown={index === 0 ? handlePointerDown : undefined}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-block trash-panel" ref={trashRef}>
              <div className="panel-label">TRASH</div>
              <div className="trash-slot">{trashCount > 0 ? <div className="trash-counter">{trashCount}</div> : <div className="placeholder disabled">0 left</div>}</div>
            </div>
          </aside>
        </section>

        {dragState.active && (
          <div className="drag-ghost" style={{ left: dragState.x, top: dragState.y }}>
            <div className={`tile value-${dragState.value} color-${(dragState.value % 5) + 1}`}>
              {dragState.value}
            </div>
          </div>
        )}

        {showHints && (
          <div className="hints-overlay">
            <div className="hints-card">
              <h3>Keyboard Shortcuts</h3>
              <ul>
                <li><strong>Z</strong> — Undo</li>
                <li><strong>R</strong> — Restart</li>
                <li><strong>1</strong>, <strong>2</strong>, <strong>3</strong> — Difficulty (Easy / Medium / Hard)</li>
                <li><strong>G</strong> — Toggle hints</li>
              </ul>
              <button className="close-hints" onClick={() => setShowHints(false)}>Close</button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-card">
              <h3>{seconds >= 300 ? 'Time is up!' : 'No moves left'}</h3>
              <p className="game-over-copy">Your final score is <strong>{score}</strong> and you reached level <strong>{level}</strong>.</p>
              <div className="game-over-actions">
                <button className="action-button" onClick={() => resetGame(difficulty)}>Play Again</button>
                <button className="action-button secondary" onClick={() => setShowHints(true)}>View Controls</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
