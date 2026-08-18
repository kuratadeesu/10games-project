const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const bestTimerEl = document.getElementById("bestTimer");
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");

// 難易度調整：迷路のサイズを小さく（25 -> 15）
const cols = 15;
const rows = 15;
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

// --------------------------------------------------
// ドット絵データ (8x8ピクセル)
// --------------------------------------------------
// --------------------------------------------------
// ドット絵データ (8x8ピクセル)
// --------------------------------------------------
// 人（ドット絵キャラクター）
const PLAYER_SPRITE = [
  [0, 1, 1, 1, 1, 1, 0, 0], // 1: 髪（茶色）
  [0, 1, 2, 2, 2, 1, 0, 0], // 2: 肌色
  [0, 2, 3, 2, 3, 2, 0, 0], // 3: 目（黒）
  [0, 2, 2, 2, 2, 2, 0, 0],
  [0, 4, 4, 4, 4, 4, 0, 0], // 4: 服（青）
  [0, 2, 4, 4, 4, 2, 0, 0], // 両脇に手（肌色）
  [0, 0, 5, 0, 5, 0, 0, 0], // 5: ズボン/靴（ダークネイビー）
  [0, 0, 5, 0, 5, 0, 0, 0],
];

const PLAYER_PALETTE = {
  1: "#78350f", // 髪（ブラウン）
  2: "#fde047", // 肌（ウォームイエロー/ベージュ系）
  3: "#1e293b", // 目（黒/ダークグレー）
  4: "#2563eb", // 服（ブルー）
  5: "#1e1b4b"  // ズボン/靴（ダークネイビー）
};

// コイン
const COIN_SPRITE = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [1, 2, 2, 3, 2, 2, 2, 1],
  [1, 2, 3, 3, 2, 2, 2, 1],
  [1, 2, 2, 3, 2, 2, 2, 1],
  [1, 2, 2, 3, 2, 2, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
];
const COIN_PALETTE = {
  1: "#d97706", // 濃い黄色（枠線）
  2: "#fbbf24", // 黄色（本体）
  3: "#fef08a"  // ハイライト
};

// ドット絵を描画する汎用関数
function drawPixelArt(sprite, palette, gridX, gridY) {
  const pixelSize = cellSize / 8;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const colorCode = sprite[r][c];
      if (colorCode !== 0) {
        ctx.fillStyle = palette[colorCode];
        ctx.fillRect(
          gridX * cellSize + c * pixelSize,
          gridY * cellSize + r * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

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

  // 壁と道の描画
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        ctx.fillStyle = "#333";
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  // コインとプレイヤーをドット絵で描画
  drawPixelArt(COIN_SPRITE, COIN_PALETTE, coin.x, coin.y);
  drawPixelArt(PLAYER_SPRITE, PLAYER_PALETTE, player.x, player.y);
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

    if (navigator.vibrate) navigator.vibrate(10);

    if (player.x === coin.x && player.y === coin.y) {
      handleClear();
    }
  }
}

// クリア処理
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

// イベントリスナー登録（十字キー・キーボード）
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