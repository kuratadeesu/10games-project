const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hudEl = document.getElementById('hud');
const scoreEl = document.getElementById('score');
const highScoreHudEl = document.getElementById('high-score-hud');
const highScoreStartEl = document.getElementById('high-score-start');
const startScreenEl = document.getElementById('start-screen');
const gameOverEl = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const newRecordEl = document.getElementById('new-record');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const touchControlsEl = document.getElementById('touch-controls');

// Canvasサイズの設定（レスポンシブ対応）
function resizeCanvas() {
  const container = document.getElementById('game-container');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ゲーム状態 & ハイスコア管理
let isPlaying = false;
let startTime = 0;
let elapsedTime = 0;
let bonusTime = 0;
let highScore = parseFloat(localStorage.getItem('avoid_game_highscore')) || 0;
let animationFrameId;

// 人型プレイヤー設定
const player = {
  x: 0,
  y: 0,
  width: 24,
  height: 38,
  speed: 6,
  tilt: 0,
  hasShield: false,
  color: '#00d2d3'
};

let obstacles = [];
let items = [];
let particles = [];
let spawnTimer = 0;
let spawnInterval = 30;

const keys = { left: false, right: false };

// ハイスコアUI更新
function updateHighScoreUI() {
  highScoreStartEl.textContent = `HIGH SCORE: ${highScore.toFixed(1)}s`;
  highScoreHudEl.textContent = `BEST: ${highScore.toFixed(1)}s`;
}
updateHighScoreUI();

// キーボード操作（PC）
window.addEventListener('keydown', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = true;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.left = false;
  if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.right = false;
});

// タッチ操作（スマホ）
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });
btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });

canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', () => { keys.left = false; keys.right = false; });

function handleTouch(e) {
  e.preventDefault();
  if (!isPlaying) return;
  const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  keys.left = touchX < canvas.width / 2;
  keys.right = touchX >= canvas.width / 2;
}

// ゲーム開始処理
function startGame() {
  isPlaying = true;
  elapsedTime = 0;
  bonusTime = 0;
  obstacles = [];
  items = [];
  particles = [];
  spawnTimer = 0;

  player.x = canvas.width / 2 - player.width / 2;
  player.y = canvas.height - player.height - 25;
  player.hasShield = false;

  startScreenEl.classList.add('hidden');
  gameOverEl.classList.add('hidden');
  newRecordEl.classList.add('hidden');
  hudEl.classList.remove('hidden');
  touchControlsEl.classList.remove('hidden');

  startTime = Date.now();
  cancelAnimationFrame(animationFrameId);
  update();
}

// 人型キャラクターの描画
function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  
  // 移動時の傾きアニメーション
  if (keys.left) player.tilt = -0.15;
  else if (keys.right) player.tilt = 0.15;
  else player.tilt = 0;
  ctx.rotate(player.tilt);

  // シールド展開中のオーラ
  if (player.hasShield) {
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 213, 115, 0.25)';
    ctx.strokeStyle = '#2ed573';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#2ed573';
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = player.color;
  ctx.strokeStyle = player.color;
  ctx.lineWidth = 3;

  // 頭
  ctx.beginPath();
  ctx.arc(0, -12, 6, 0, Math.PI * 2);
  ctx.fill();

  // 胴体
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 8);
  ctx.stroke();

  // 腕
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.lineTo(8, -2);
  ctx.stroke();

  // 脚
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-6, 18);
  ctx.moveTo(0, 8);
  ctx.lineTo(6, 18);
  ctx.stroke();

  ctx.restore();
}

// 落下物・アイテムの生成
function spawnEntities() {
  const totalTime = elapsedTime + bonusTime;
  const speedBonus = totalTime * 0.8;
  const baseSpeed = Math.random() * 3 + 4;
  const size = Math.random() * 16 + 24;
  const x = Math.random() * (canvas.width - size);
  
  const rand = Math.random();
  if (rand < 0.06) {
    // シールドアイテム
    items.push({ x: x, y: -30, radius: 14, speed: 3.5, type: 'shield' });
  } else if (rand < 0.18) {
    // コインアイテム
    items.push({ x: x, y: -30, radius: 12, speed: 4, type: 'coin', animFrame: 0 });
  } else {
    // 隕石障害物
    obstacles.push({
      x: x,
      y: -size,
      width: size,
      height: size,
      speed: baseSpeed + speedBonus
    });
  }
}

// 敵（隕石）の描画
function drawObstacle(obs) {
  ctx.save();
  
  // 落下時の火花エフェクト
  ctx.fillStyle = 'rgba(255, 71, 87, 0.25)';
  ctx.beginPath();
  ctx.moveTo(obs.x, obs.y);
  ctx.lineTo(obs.x + obs.width / 2, obs.y - 15);
  ctx.lineTo(obs.x + obs.width, obs.y);
  ctx.fill();

  // 本体（角丸の岩）
  ctx.fillStyle = '#ff4757';
  ctx.strokeStyle = '#ff6b81';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ff4757';

  const r = 6;
  ctx.beginPath();
  ctx.moveTo(obs.x + r, obs.y);
  ctx.lineTo(obs.x + obs.width - r, obs.y);
  ctx.quadraticCurveTo(obs.x + obs.width, obs.y, obs.x + obs.width, obs.y + r);
  ctx.lineTo(obs.x + obs.width, obs.y + obs.height - r);
  ctx.quadraticCurveTo(obs.x + obs.width, obs.y + obs.height, obs.x + obs.width - r, obs.y + obs.height);
  ctx.lineTo(obs.x + r, obs.y + obs.height);
  ctx.quadraticCurveTo(obs.x, obs.y + obs.height, obs.x, obs.y + obs.height - r);
  ctx.lineTo(obs.x, obs.y + r);
  ctx.quadraticCurveTo(obs.x, obs.y, obs.x + r, obs.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 中央に危険マーク
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `${obs.width * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💥', obs.x + obs.width / 2, obs.y + obs.height / 2 + 1);

  ctx.restore();
}

// アイテムの描画
function drawItem(item) {
  ctx.save();
  ctx.shadowBlur = 8;

  if (item.type === 'shield') {
    // シールドアイテム (🛡️)
    ctx.shadowColor = '#2ed573';
    ctx.fillStyle = '#2ed573';
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', item.x, item.y + 1);
  } else if (item.type === 'coin') {
    // コインアイテム (🪙 / $)
    item.animFrame = (item.animFrame || 0) + 0.1;
    const scaleX = Math.cos(item.animFrame);

    ctx.shadowColor = '#f1c40f';
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(item.x, item.y, Math.abs(item.radius * scaleX), item.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    if (Math.abs(scaleX) > 0.4) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', item.x, item.y);
    }
  }

  ctx.restore();
}

// パーティクル生成
function createParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: Math.random() * 4 + 2,
      color: color,
      life: 1.0
    });
  }
}

// 衝突判定 (矩形 vs 矩形)
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// 衝突判定 (円 vs 矩形)
function checkCircleCollision(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.width / 2);
  const distY = Math.abs(circle.y - rect.y - rect.height / 2);

  if (distX > (rect.width / 2 + circle.radius)) return false;
  if (distY > (rect.height / 2 + circle.radius)) return false;

  if (distX <= (rect.width / 2)) return true; 
  if (distY <= (rect.height / 2)) return true;

  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

// メインゲームループ
function update() {
  if (!isPlaying) return;

  elapsedTime = (Date.now() - startTime) / 1000;
  const currentScore = elapsedTime + bonusTime;
  scoreEl.textContent = `SCORE: ${currentScore.toFixed(1)}s`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // プレイヤー移動
  if (keys.left && player.x > 0) player.x -= player.speed;
  if (keys.right && player.x + player.width < canvas.width) player.x += player.speed;

  // プレイヤー描画
  drawPlayer();

  // 障害物＆アイテムの生成
  spawnTimer++;
  const currentInterval = Math.max(10, spawnInterval - Math.floor(currentScore / 5));
  if (spawnTimer >= currentInterval) {
    spawnEntities();
    spawnTimer = 0;
  }

  // アイテム処理
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.y += item.speed;

    drawItem(item);

    // 取得判定
    if (checkCircleCollision(item, player)) {
      if (item.type === 'shield') player.hasShield = true;
      if (item.type === 'coin') bonusTime += 3.0; // 3秒分スコア加算

      createParticles(item.x, item.y, item.type === 'shield' ? '#2ed573' : '#f1c40f', 12);
      items.splice(i, 1);
      continue;
    }

    if (item.y > canvas.height + 30) items.splice(i, 1);
  }

  // 障害物（敵）処理
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.y += obs.speed;

    drawObstacle(obs);

    // 衝突判定
    if (checkCollision(player, obs)) {
      if (player.hasShield) {
        // シールドで破壊
        player.hasShield = false;
        createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#2ed573', 15);
        obstacles.splice(i, 1);
        continue;
      } else {
        // ゲームオーバー
        createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff4757', 25);
        endGame(currentScore);
        return;
      }
    }

    if (obs.y > canvas.height + 30) obstacles.splice(i, 1);
  }

  // パーティクルの更新と描画
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.03;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1.0;
  }

  animationFrameId = requestAnimationFrame(update);
}

// ゲームオーバー処理
function endGame(finalScore) {
  isPlaying = false;
  finalScoreEl.textContent = `SCORE: ${finalScore.toFixed(1)}s`;

  if (finalScore > highScore) {
    highScore = finalScore;
    localStorage.setItem('avoid_game_highscore', highScore);
    newRecordEl.classList.remove('hidden');
    updateHighScoreUI();
  }

  gameOverEl.classList.remove('hidden');
  touchControlsEl.classList.add('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);