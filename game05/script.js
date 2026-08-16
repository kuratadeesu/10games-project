const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const bestTimerEl = document.getElementById("bestTimer");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");

const cols = 25;
const rows = 25;
const cellSize = 20;

canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let grid = [];
let player = { x: cols - 2, y: rows - 2 };
let coin = { x: 1, y: 1 };
let startTime = null;
let timerInterval = null;
let isCleared = false;
let isGameStarted = false;

// 連続移動用の管理オブジェクト
let moveInterval = null;
let activeKeys = new Set();

// ベストタイムの読み込み
let bestTime = localStorage.getItem("mazeBestTime");
if (bestTime) {
  bestTimerEl.textContent = parseFloat(bestTime).toFixed(2);
}

// 迷路生成
function generateMaze() {
  grid = Array.from({ length: rows }, () => Array(cols).fill(1));

  function dig(x, y) {
    grid[y][x] = 0;
    const dirs = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
        grid[y + dy / 2][x + dx / 2] = 0;
        dig(nx, ny);
      }
    }
  }

  dig(1, 1);
  player = { x: cols - 2, y: rows - 2 };
  coin = { x: 1, y: 1 };
  grid[player.y][player.x] = 0;
  grid[coin.y][coin.x] = 0;
}

// 描画
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        ctx.fillStyle = "#333";
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc((coin.x + 0.5) * cellSize, (coin.y + 0.5) * cellSize, cellSize * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#007bff";
  ctx.beginPath();
  ctx.arc((player.x + 0.5) * cellSize, (player.y + 0.5) * cellSize, cellSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function startGame() {
  clearInterval(timerInterval);
  stopContinuousMove();
  isCleared = false;
  isGameStarted = true;
  startTime = null;
  timerEl.textContent = "0.00";

  startScreen.style.display = "none";
  gameScreen.style.display = "block";

  generateMaze();
  draw();
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerEl.textContent = elapsed.toFixed(2);
  }, 10);
}

// 1マス移動処理
function movePlayer(dx, dy) {
  if (!isGameStarted || isCleared) return;

  if (!startTime) startTimer();

  const newX = player.x + dx;
  const newY = player.y + dy;

  if (grid[newY] && grid[newY][newX] === 0) {
    player.x = newX;
    player.y = newY;
    draw();

    // タップ時の微振動フィードバック（スマホ対応時）
    if (navigator.vibrate) navigator.vibrate(10);

    if (player.x === coin.x && player.y === coin.y) {
      handleClear();
    }
  }
}

// クリア処理（ベストタイム判定・保存）
function handleClear() {
  isCleared = true;
  clearInterval(timerInterval);
  stopContinuousMove();

  const finalTime = parseFloat(timerEl.textContent);
  let message = `クリア！ 記録: ${finalTime.toFixed(2)} 秒`;

  if (!bestTime || finalTime < parseFloat(bestTime)) {
    bestTime = finalTime;
    localStorage.setItem("mazeBestTime", finalTime);
    bestTimerEl.textContent = finalTime.toFixed(2);
    message += "\n★ 自己ベスト更新！";
  }

  setTimeout(() => alert(message), 50);
}

// 連続移動制御
function startContinuousMove(dx, dy) {
  movePlayer(dx, dy);
  stopContinuousMove();
  // 初回移動後、短時間保持してから連続リピートを開始（100ms間隔）
  moveInterval = setTimeout(() => {
    moveInterval = setInterval(() => movePlayer(dx, dy), 100);
  }, 180);
}

function stopContinuousMove() {
  if (moveInterval) {
    clearTimeout(moveInterval);
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

// 画面上ボタンの長押し・タッチイベント登録
document.querySelectorAll(".dpad-btn").forEach(btn => {
  const dx = parseInt(btn.dataset.dx);
  const dy = parseInt(btn.dataset.dy);

  const start = (e) => {
    e.preventDefault();
    btn.classList.add("active");
    startContinuousMove(dx, dy);
  };

  const end = (e) => {
    e.preventDefault();
    btn.classList.remove("active");
    stopContinuousMove();
  };

  btn.addEventListener("touchstart", start, { passive: false });
  btn.addEventListener("touchend", end);
  btn.addEventListener("mousedown", start);
  btn.addEventListener("mouseup", end);
  btn.addEventListener("mouseleave", end);
});

// PCキーボードの長押し連続移動対応
window.addEventListener("keydown", (e) => {
  const keyMap = {
    "ArrowUp": [0, -1], "w": [0, -1],
    "ArrowDown": [0, 1], "s": [0, 1],
    "ArrowLeft": [-1, 0], "a": [-1, 0],
    "ArrowRight": [1, 0], "d": [1, 0]
  };

  if (keyMap[e.key]) {
    e.preventDefault();
    if (!activeKeys.has(e.key)) {
      activeKeys.add(e.key);
      const [dx, dy] = keyMap[e.key];
      startContinuousMove(dx, dy);
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (activeKeys.has(e.key)) {
    activeKeys.delete(e.key);
    if (activeKeys.size === 0) {
      stopContinuousMove();
    }
  }
});