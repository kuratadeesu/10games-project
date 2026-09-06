const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const msg = document.getElementById('msg');
const stageText = document.getElementById('stage-text');
const inkBar = document.getElementById('ink-bar');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

// キャンバス解像度
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// ゲーム状態
let currentStage = 1;
let ball, goal, lines, isDrawing, currentLineSegments, isCleared, isGameOver, isGameStarted;

// ギミック要素
let walls = [];        // 跳ね返る壁
let spikes = [];       // 接触でミスになるトゲ
let noDrawZones = [];  // 線を描けない描画禁止ゾーン

// インクパラメータ（少し増量して描きやすく）
const MAX_INK = 600;
let remainingInk = MAX_INK;

// 物理パラメータ
const GRAVITY = 0.25;
const RESTITUTION = 0.5;
const BALL_RADIUS = 12;

function setupCanvas() {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}

// 2つの矩形が重なっているか判定するヘルパー関数
function isRectOverlap(r1, r2) {
  return !(r1.x + r1.w < r2.x || 
           r2.x + r2.w < r1.x || 
           r1.y + r1.h < r2.y || 
           r2.y + r2.h < r1.y);
}

// ステージとギミックの自動生成
function setupStage() {
  ball = {
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS
  };

  // 1. ゴールの位置を広範囲（画面中央〜右エリア）に自由に配置＆サイズ拡大
  goal = {
    x: 300 + Math.random() * 420,
    y: 100 + Math.random() * 400,
    radius: 42
  };

  const ballRect = { x: ball.x - 40, y: ball.y - 40, w: 80, h: 80 };
  const goalRect = { x: goal.x - 50, y: goal.y - 50, w: 100, h: 100 };

  // 配列を初期化
  walls = [];
  spikes = [];
  noDrawZones = [];

  // 2. 「壁」を0〜1個だけ配置（数を減らしてシンプルに）
  if (Math.random() < 0.7) {
    const w = 25 + Math.random() * 25;
    const h = 100 + Math.random() * 120;
    const x = 220 + Math.random() * 300;
    const y = 120 + Math.random() * 250;
    const newWall = { x, y, w, h };

    if (!isRectOverlap(newWall, ballRect) && !isRectOverlap(newWall, goalRect)) {
      walls.push(newWall);
    }
  }

  // 3. 「トゲ（危険ゾーン）」を0〜1個だけ配置（控えめなサイズ）
  if (Math.random() < 0.6) {
    const w = 70 + Math.random() * 80;
    const h = 20 + Math.random() * 20;
    const x = 200 + Math.random() * 350;
    const y = 200 + Math.random() * 280;
    const newSpike = { x, y, w, h };

    if (!isRectOverlap(newSpike, ballRect) && !isRectOverlap(newSpike, goalRect)) {
      spikes.push(newSpike);
    }
  }

  // 4. 「描画禁止ゾーン」を0〜1個だけ配置
  if (Math.random() < 0.5) {
    const ndWidth = 100 + Math.random() * 80;
    const ndHeight = 120 + Math.random() * 100;
    const ndX = 250 + Math.random() * 280;
    const ndY = 150 + Math.random() * 220;
    const newZone = { x: ndX, y: ndY, w: ndWidth, h: ndHeight };

    if (!isRectOverlap(newZone, ballRect) && !isRectOverlap(newZone, goalRect)) {
      noDrawZones.push(newZone);
    }
  }

  lines = [];
  currentLineSegments = [];
  isDrawing = false;
  isCleared = false;
  isGameOver = false;
  isGameStarted = false;
  remainingInk = MAX_INK;

  stageText.innerText = `STAGE ${currentStage}`;
  msg.innerText = "線を描いてから「スタート」を押してね！";
  msg.style.color = "#ffffff";
  startBtn.innerText = "スタート";
  updateInkUI();
}

// インクゲージ更新
function updateInkUI() {
  const percentage = Math.max(0, (remainingInk / MAX_INK) * 100);
  inkBar.style.width = `${percentage}%`;
  inkBar.style.backgroundColor = percentage < 20 ? '#ff4757' : '#3498db';
}

// メインループ
function update() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (isGameStarted && !isCleared && !isGameOver) {
    // 1. 重力と移動
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 2. 画面外枠の衝突
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx *= -RESTITUTION;
    }
    if (ball.x + ball.radius > CANVAS_WIDTH) {
      ball.x = CANVAS_WIDTH - ball.radius;
      ball.vx *= -RESTITUTION;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy *= -RESTITUTION;
    }
    if (ball.y + ball.radius > CANVAS_HEIGHT) {
      ball.y = CANVAS_HEIGHT - ball.radius;
      ball.vy *= -RESTITUTION;
      ball.vx *= 0.96;
    }

    // 3. 固定壁との衝突
    walls.forEach(w => checkRectCollision(ball, w));

    // 4. トゲ（即死）判定
    spikes.forEach(s => {
      if (checkRectOverlap(ball, s)) {
        isGameOver = true;
        msg.innerText = "GAME OVER... 💀 リトライしてね";
        msg.style.color = "#ff4757";
      }
    });

    // 5. 自作線との衝突判定
    lines.forEach(line => checkLineCollision(ball, line));

    // 6. クリア判定
    const dx = ball.x - goal.x;
    const dy = ball.y - goal.y;
    if (Math.sqrt(dx * dx + dy * dy) < goal.radius) {
      isCleared = true;
      msg.innerText = "STAGE CLEAR!! 🎉";
      msg.style.color = "#2ed573";
      startBtn.innerText = "次のステージへ";
    }
  }

  // --- 描画処理 ---

  // 描画禁止ゾーン（赤い透明領域）
  noDrawZones.forEach(zone => {
    ctx.fillStyle = 'rgba(255, 71, 87, 0.15)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.setLineDash([]);
  });

  // 固定の壁（灰色）
  ctx.fillStyle = '#747d8c';
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // 即死トゲ（赤紫）
  ctx.fillStyle = '#ff4757';
  spikes.forEach(s => ctx.fillRect(s.x, s.y, s.w, s.h));

  // ゴール（緑）
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, goal.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#2ed573';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7bed9f';
  ctx.stroke();

  // 確定済みの線（オレンジ）
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffa502';
  lines.forEach(line => {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  });

  // 描画中の線
  if (currentLineSegments.length > 0) {
    ctx.beginPath();
    ctx.moveTo(currentLineSegments[0].x1, currentLineSegments[0].y1);
    currentLineSegments.forEach(seg => ctx.lineTo(seg.x2, seg.y2));
    ctx.stroke();
  }

  // ボール（青）
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1e90ff';
  ctx.fill();

  requestAnimationFrame(update);
}

// 矩形とのめり込み回避処理（壁）
function checkRectCollision(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));

  const distX = circle.x - closestX;
  const distY = circle.y - closestY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  if (distance < circle.radius) {
    const nx = distX / (distance || 1);
    const ny = distY / (distance || 1);
    const overlap = circle.radius - distance;

    circle.x += nx * overlap;
    circle.y += ny * overlap;

    const dot = circle.vx * nx + circle.vy * ny;
    if (dot < 0) {
      circle.vx = (circle.vx - (1 + RESTITUTION) * dot * nx) * 0.95;
      circle.vy = (circle.vy - (1 + RESTITUTION) * dot * ny) * 0.95;
    }
  }
}

// 矩形との単純重なりチェック（トゲ）
function checkRectOverlap(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const distX = circle.x - closestX;
  const distY = circle.y - closestY;
  return (distX * distX + distY * distY) < (circle.radius * circle.radius);
}

// 線との衝突判定
function checkLineCollision(circle, line) {
  const x1 = line.x1, y1 = line.y1;
  const x2 = line.x2, y2 = line.y2;
  const cx = circle.x, cy = circle.y;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return;

  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  const distX = cx - closestX;
  const distY = cy - closestY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  if (distance < circle.radius) {
    const nx = distX / distance || 0;
    const ny = distY / distance || -1;

    const overlap = circle.radius - distance;
    circle.x += nx * overlap;
    circle.y += ny * overlap;

    const dot = circle.vx * nx + circle.vy * ny;
    if (dot < 0) {
      circle.vx = (circle.vx - (1 + RESTITUTION) * dot * nx) * 0.98;
      circle.vy = (circle.vy - (1 + RESTITUTION) * dot * ny) * 0.98;
    }
  }
}

// 座標取得
function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / rect.width;
  const scaleY = CANVAS_HEIGHT / rect.height;

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

// 描画禁止エリア内かどうかの判定
function isInNoDrawZone(pos) {
  return noDrawZones.some(zone => 
    pos.x >= zone.x &&
    pos.x <= zone.x + zone.w &&
    pos.y >= zone.y &&
    pos.y <= zone.y + zone.h
  );
}

// --- 入力イベント ---
function startDrawing(e) {
  if (isCleared || isGameOver || isGameStarted || remainingInk <= 0) return;
  
  const pos = getCanvasPos(e);
  if (isInNoDrawZone(pos)) return;

  isDrawing = true;
  currentLineSegments = [];
  this.lastPos = pos;
}

function drawMove(e) {
  if (!isDrawing || remainingInk <= 0) return;

  const pos = getCanvasPos(e);
  if (isInNoDrawZone(pos)) return;

  const dx = pos.x - this.lastPos.x;
  const dy = pos.y - this.lastPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 3) {
    if (remainingInk - dist < 0) return;

    const segment = {
      x1: this.lastPos.x,
      y1: this.lastPos.y,
      x2: pos.x,
      y2: pos.y
    };

    currentLineSegments.push(segment);
    lines.push(segment);

    remainingInk -= dist;
    updateInkUI();

    this.lastPos = pos;
  }
}

function stopDrawing() {
  isDrawing = false;
  currentLineSegments = [];
}

// イベントリスナー
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', drawMove);
window.addEventListener('mouseup', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startDrawing(e);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  drawMove(e);
}, { passive: false });

window.addEventListener('touchend', stopDrawing);

// ボタン処理
startBtn.addEventListener('click', () => {
  if (isCleared) {
    currentStage++;
    setupStage();
  } else if (!isGameStarted) {
    isGameStarted = true;
    msg.innerText = "ゴールを目指そう！";
  }
});

resetBtn.addEventListener('click', () => {
  setupStage();
});

// 初期化
setupCanvas();
setupStage();
update();