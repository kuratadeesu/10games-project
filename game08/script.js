const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const startBtn = document.getElementById('start-btn');
const diffBtns = document.querySelectorAll('.diff-btn');
const zones = document.querySelectorAll('.zone');

// エフェクト用 Canvas
const canvas = document.getElementById('effect-canvas');
const ctx = canvas.getContext('2d');

let audioCtx = null;
let bgmBuffer = null;
let bgmSource = null;
let audioStartTime = 0;

let score = 0;
let combo = 0;
let isPlaying = false;
let currentDifficulty = 'normal';

const LANE_POS = [1, 34.3, 67.6];
const KEY_MAP = { KeyD: 0, KeyF: 1, KeyJ: 2 };
const activeInputs = [false, false, false];

// エフェクト要素管理配列
let particles = [];
let ripples = [];
let judgeTexts = [];

// 周波数テーブル
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00, B5: 987.77
};

// 難易度別構成データ
const DIFFICULTY_CONFIG = {
  easy: {
    speed: 220,
    bpm: 100,
    duration: 11,
    chords: [
      { time: 0.0, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] },
      { time: 2.4, freqs: [NOTES.G3, NOTES.B3, NOTES.D4] },
      { time: 4.8, freqs: [NOTES.A3, NOTES.C4, NOTES.E4] },
      { time: 7.2, freqs: [NOTES.F3, NOTES.A3, NOTES.C4] }
    ],
    drums: [
      { time: 0.0, type: 'kick' }, { time: 0.6, type: 'hat' }, { time: 1.2, type: 'snare' }, { time: 1.8, type: 'hat' },
      { time: 2.4, type: 'kick' }, { time: 3.0, type: 'hat' }, { time: 3.6, type: 'snare' }, { time: 4.2, type: 'hat' },
      { time: 4.8, type: 'kick' }, { time: 5.4, type: 'hat' }, { time: 6.0, type: 'snare' }, { time: 6.6, type: 'hat' },
      { time: 7.2, type: 'kick' }, { time: 7.8, type: 'hat' }, { time: 8.4, type: 'snare' }, { time: 9.0, type: 'hat' }
    ],
    chart: [
      { time: 1.2, lane: 0, type: 'normal', pitch: NOTES.C4 },
      { time: 2.4, lane: 1, type: 'normal', pitch: NOTES.E4 },
      { time: 3.6, lane: 2, type: 'long', duration: 1.0, pitch: NOTES.G4 },
      { time: 6.0, lane: 1, type: 'normal', pitch: NOTES.A4 },
      { time: 7.2, lane: 0, type: 'normal', pitch: NOTES.F4 },
      { time: 8.4, lane: 2, type: 'long', duration: 1.2, pitch: NOTES.C5 }
    ]
  },
  normal: {
    speed: 320,
    bpm: 128,
    duration: 11,
    chords: [
      { time: 0.0, freqs: [NOTES.A3, NOTES.C4, NOTES.E4] },
      { time: 2.0, freqs: [NOTES.F3, NOTES.A3, NOTES.C4] },
      { time: 4.0, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] },
      { time: 6.0, freqs: [NOTES.G3, NOTES.B3, NOTES.D4] },
      { time: 8.0, freqs: [NOTES.A3, NOTES.C4, NOTES.E4] }
    ],
    drums: [
      { time: 0.0, type: 'kick' }, { time: 0.5, type: 'hat' }, { time: 1.0, type: 'kick' }, { time: 1.0, type: 'snare' }, { time: 1.5, type: 'hat' },
      { time: 2.0, type: 'kick' }, { time: 2.5, type: 'hat' }, { time: 3.0, type: 'snare' }, { time: 3.5, type: 'hat' },
      { time: 4.0, type: 'kick' }, { time: 4.5, type: 'hat' }, { time: 5.0, type: 'kick' }, { time: 5.0, type: 'snare' }, { time: 5.5, type: 'hat' },
      { time: 6.0, type: 'kick' }, { time: 6.5, type: 'hat' }, { time: 7.0, type: 'snare' }, { time: 7.5, type: 'hat' },
      { time: 8.0, type: 'kick' }, { time: 8.5, type: 'hat' }, { time: 9.0, type: 'snare' }, { time: 9.5, type: 'snare' }
    ],
    chart: [
      { time: 0.5, lane: 0, type: 'normal', pitch: NOTES.A4 },
      { time: 1.0, lane: 1, type: 'normal', pitch: NOTES.C5 },
      { time: 1.5, lane: 2, type: 'normal', pitch: NOTES.E5 },
      { time: 2.0, lane: 1, type: 'long', duration: 0.8, pitch: NOTES.A4 },
      { time: 3.5, lane: 0, type: 'normal', pitch: NOTES.F4 },
      { time: 4.0, lane: 2, type: 'normal', pitch: NOTES.G4 },
      { time: 4.5, lane: 1, type: 'long', duration: 1.0, pitch: NOTES.C5 },
      { time: 6.0, lane: 0, type: 'normal', pitch: NOTES.B4 },
      { time: 6.5, lane: 1, type: 'normal', pitch: NOTES.D5 },
      { time: 7.0, lane: 2, type: 'normal', pitch: NOTES.G5 },
      { time: 8.0, lane: 0, type: 'long', duration: 1.2, pitch: NOTES.E5 }
    ]
  },
  hard: {
    speed: 420,
    bpm: 160,
    duration: 11,
    chords: [
      { time: 0.0, freqs: [NOTES.E3, NOTES.G3, NOTES.B3] },
      { time: 1.5, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] },
      { time: 3.0, freqs: [NOTES.D3, NOTES.F3, NOTES.A3] },
      { time: 4.5, freqs: [NOTES.B3, NOTES.D4, NOTES.F4] },
      { time: 6.0, freqs: [NOTES.E3, NOTES.G3, NOTES.B3] },
      { time: 7.5, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] }
    ],
    drums: [
      { time: 0.0, type: 'kick' }, { time: 0.375, type: 'hat' }, { time: 0.75, type: 'snare' }, { time: 1.125, type: 'hat' },
      { time: 1.5, type: 'kick' }, { time: 1.875, type: 'hat' }, { time: 2.25, type: 'snare' }, { time: 2.625, type: 'hat' },
      { time: 3.0, type: 'kick' }, { time: 3.375, type: 'hat' }, { time: 3.75, type: 'snare' }, { time: 4.125, type: 'hat' },
      { time: 4.5, type: 'kick' }, { time: 4.875, type: 'hat' }, { time: 5.25, type: 'snare' }, { time: 5.625, type: 'hat' },
      { time: 6.0, type: 'kick' }, { time: 6.375, type: 'hat' }, { time: 6.75, type: 'snare' }, { time: 7.125, type: 'hat' },
      { time: 7.5, type: 'kick' }, { time: 7.875, type: 'snare' }, { time: 8.25, type: 'kick' }, { time: 8.625, type: 'snare' }
    ],
    chart: [
      { time: 0.375, lane: 0, type: 'normal', pitch: NOTES.E4 },
      { time: 0.75, lane: 1, type: 'normal', pitch: NOTES.G4 },
      { time: 1.125, lane: 2, type: 'normal', pitch: NOTES.B4 },
      { time: 1.5, lane: 0, type: 'long', duration: 0.6, pitch: NOTES.E5 },
      { time: 2.625, lane: 2, type: 'normal', pitch: NOTES.C5 },
      { time: 3.0, lane: 1, type: 'normal', pitch: NOTES.D5 },
      { time: 3.375, lane: 0, type: 'long', duration: 0.8, pitch: NOTES.F5 },
      { time: 4.5, lane: 1, type: 'normal', pitch: NOTES.D5 },
      { time: 4.875, lane: 2, type: 'normal', pitch: NOTES.B4 },
      { time: 5.25, lane: 0, type: 'normal', pitch: NOTES.G4 },
      { time: 5.625, lane: 1, type: 'long', duration: 1.0, pitch: NOTES.E5 },
      { time: 7.125, lane: 2, type: 'normal', pitch: NOTES.G5 },
      { time: 7.5, lane: 0, type: 'normal', pitch: NOTES.E5 },
      { time: 7.875, lane: 1, type: 'long', duration: 1.2, pitch: NOTES.B5 }
    ]
  }
};

const TARGET_Y = 270;
const SPAWN_Y = -30;
let activeNotes = [];

function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isPlaying) return;
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDifficulty = btn.dataset.diff;
    generateBGM();
  });
});

async function generateBGM() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startBtn.textContent = 'BGM構築中...';
  startBtn.disabled = true;

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const duration = config.duration;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioCtx.sampleRate * duration), audioCtx.sampleRate);

  config.chords.forEach(c => {
    c.freqs.forEach(freq => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, c.time);
      gain.gain.setValueAtTime(0.01, c.time);
      gain.gain.linearRampToValueAtTime(0.08, c.time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, c.time + 2.0);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(c.time);
      osc.stop(c.time + 2.0);
    });
  });

  config.drums.forEach(d => {
    if (d.type === 'kick') {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.frequency.setValueAtTime(120, d.time);
      osc.frequency.exponentialRampToValueAtTime(0.01, d.time + 0.15);
      gain.gain.setValueAtTime(0.4, d.time);
      gain.gain.exponentialRampToValueAtTime(0.01, d.time + 0.15);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(d.time);
      osc.stop(d.time + 0.15);
    } else if (d.type === 'snare') {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, d.time);
      osc.frequency.exponentialRampToValueAtTime(40, d.time + 0.1);
      gain.gain.setValueAtTime(0.2, d.time);
      gain.gain.exponentialRampToValueAtTime(0.01, d.time + 0.1);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(d.time);
      osc.stop(d.time + 0.1);
    } else if (d.type === 'hat') {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000, d.time);
      gain.gain.setValueAtTime(0.03, d.time);
      gain.gain.exponentialRampToValueAtTime(0.001, d.time + 0.04);
      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(d.time);
      osc.stop(d.time + 0.04);
    }
  });

  config.chart.forEach(n => {
    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    osc.type = n.type === 'long' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(n.pitch || 440, n.time);
    
    const playLen = n.duration || 0.2;
    gain.gain.setValueAtTime(0.15, n.time);
    gain.gain.exponentialRampToValueAtTime(0.01, n.time + playLen);
    
    osc.connect(gain);
    gain.connect(offlineCtx.destination);
    osc.start(n.time);
    osc.stop(n.time + playLen);
  });

  bgmBuffer = await offlineCtx.startRendering();
  startBtn.textContent = 'ゲーム開始';
  startBtn.disabled = false;
}

// レーン上へのヒットポップアップエフェクト発生
function createHitEffect(lane, judgeText = '', color = '#00f3ff') {
  const laneWidth = canvas.width / 3;
  const x = lane * laneWidth + laneWidth / 2;
  const y = TARGET_Y + 6;

  // 波紋
  ripples.push({
    x: x,
    y: y,
    radius: 5,
    maxRadius: 35,
    alpha: 1.0,
    color: color
  });

  // 粒子
  const particleCount = 14;
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      radius: Math.random() * 3 + 1.5,
      alpha: 1.0,
      decay: Math.random() * 0.03 + 0.02,
      color: color
    });
  }

  // ノーツ位置のすぐ上に表示する判定テキスト＆コンボ数
  if (judgeText) {
    // 同じレーンの既存テキストを置き換え
    judgeTexts = judgeTexts.filter(t => t.lane !== lane);

    judgeTexts.push({
      lane: lane,
      text: judgeText,
      combo: combo > 1 ? `${combo} COMBO` : '', // 2コンボ以上で表示
      x: x,
      y: TARGET_Y - 25, // 判定ラインの少し上
      alpha: 1.0,
      color: color,
      scale: 1.3
    });
  }
}

// Canvasエフェクト＆判定テキストの描画
function drawEffects() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 波紋の描画
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = r.alpha;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    r.radius += 2;
    r.alpha -= 0.05;

    if (r.alpha <= 0 || r.radius >= r.maxRadius) {
      ripples.splice(i, 1);
    }
  }

  // 2. 粒子の描画
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  // 3. レーン上の判定テキスト＆コンボ数描画（浮かび上がりながらフェードアウト）
  for (let i = judgeTexts.length - 1; i >= 0; i--) {
    const t = judgeTexts[i];
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.textAlign = 'center';

    // メイン判定文字（PERFECT! など）
    ctx.font = `900 ${Math.round(14 * t.scale)}px sans-serif`;
    ctx.fillStyle = t.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = t.color;
    ctx.fillText(t.text, t.x, t.y);

    // サブコンボ表示（12 COMBO など）
    if (t.combo) {
      ctx.font = `800 ${Math.round(10 * t.scale)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#ff007f';
      ctx.fillText(t.combo, t.x, t.y + 14); // 判定文字のすぐ下に表示
    }

    ctx.restore();

    t.y -= 0.8; // ゆっくり上昇
    t.alpha -= 0.035; // フェードアウト
    if (t.scale > 1.0) t.scale -= 0.04; // スケーリング収束

    if (t.alpha <= 0) {
      judgeTexts.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}

function startGame() {
  if (!bgmBuffer) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const travelTime = (TARGET_Y - SPAWN_Y) / config.speed;

  score = 0;
  combo = 0;
  particles = [];
  ripples = [];
  judgeTexts = [];
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  container.querySelectorAll('.note, .long-note').forEach(el => el.remove());

  activeNotes = config.chart.map(data => {
    const el = document.createElement('div');
    const isLong = data.type === 'long';
    el.className = isLong ? 'long-note' : 'note';
    el.style.left = `${LANE_POS[data.lane]}%`;
    el.style.display = 'none';
    container.appendChild(el);

    return {
      el: el,
      lane: data.lane,
      type: data.type,
      targetTime: data.time,
      duration: data.duration || 0,
      spawnTime: data.time - travelTime,
      hit: false,
      holding: false,
      completed: false
    };
  });

  bgmSource = audioCtx.createBufferSource();
  bgmSource.buffer = bgmBuffer;
  bgmSource.connect(audioCtx.destination);
  audioStartTime = audioCtx.currentTime;
  bgmSource.start(0);
  
  isPlaying = true;
  startBtn.style.display = 'none';
  requestAnimationFrame(update);
}

function update() {
  if (!isPlaying) return;

  const elapsedTime = audioCtx.currentTime - audioStartTime;
  const config = DIFFICULTY_CONFIG[currentDifficulty];

  for (let note of activeNotes) {
    if (note.completed) continue;

    const timeDiff = elapsedTime - note.spawnTime;
    
    if (timeDiff < 0) {
      note.el.style.display = 'none';
      continue;
    }

    if (note.type === 'normal') {
      const currentY = SPAWN_Y + (timeDiff * config.speed);
      note.el.style.top = `${currentY}px`;
      note.el.style.display = 'block';

      if (elapsedTime > note.targetTime + 0.15 && !note.hit) {
        note.completed = true;
        note.el.style.display = 'none';
        resetCombo(note.lane, 'MISS', '#ff4d4d');
      }
    } 
    else if (note.type === 'long') {
      const noteHeight = note.duration * config.speed;

      if (note.holding) {
        const holdTime = elapsedTime - note.targetTime;
        const remainingHeight = Math.max(0, noteHeight - (holdTime * config.speed));
        
        note.el.style.top = `${TARGET_Y - remainingHeight}px`;
        note.el.style.height = `${remainingHeight}px`;
        note.el.style.display = 'block';

        if (Math.random() < 0.3) {
          createHitEffect(note.lane, '', '#ff007f');
        }

        if (elapsedTime >= note.targetTime + note.duration) {
          note.completed = true;
          note.el.remove();
          addScore(note.lane, 150, 'PERFECT!', '#00f3ff');
        } else if (!activeInputs[note.lane]) {
          note.holding = false;
          note.completed = true;
          note.el.style.display = 'none';
          resetCombo(note.lane, 'MISS', '#ff4d4d');
        }
      } else {
        const headY = SPAWN_Y + (timeDiff * config.speed);
        const topY = headY - noteHeight;

        if (headY < 0) {
          note.el.style.display = 'none';
        } else {
          note.el.style.top = `${topY}px`;
          note.el.style.height = `${noteHeight}px`;
          note.el.style.display = 'block';
        }

        if (elapsedTime > note.targetTime + 0.15 && !note.hit) {
          note.completed = true;
          note.el.style.display = 'none';
          resetCombo(note.lane, 'MISS', '#ff4d4d');
        }
      }
    }
  }

  drawEffects();

  if (elapsedTime > config.duration) {
    isPlaying = false;
    startBtn.style.display = 'block';
    startBtn.textContent = 'もう一度プレイ';
  } else {
    requestAnimationFrame(update);
  }
}

function handleInputStart(lane) {
  zones[lane].classList.add('active');
  activeInputs[lane] = true;

  if (!isPlaying) return;
  const elapsedTime = audioCtx.currentTime - audioStartTime;

  let closestNote = null;
  let minDiff = Infinity;

  for (let note of activeNotes) {
    if (note.completed || note.lane !== lane || note.hit) continue;
    const diff = Math.abs(elapsedTime - note.targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  if (closestNote && minDiff <= 0.15) {
    closestNote.hit = true;
    if (closestNote.type === 'long') {
      closestNote.holding = true;
      closestNote.el.classList.add('holding');
      addScore(lane, 50, 'HOLD!', '#ff007f');
    } else {
      closestNote.completed = true;
      closestNote.el.remove();
      if (minDiff <= 0.06) {
        addScore(lane, 100, 'PERFECT!', '#00f3ff');
      } else {
        addScore(lane, 50, 'GREAT', '#ffeb3b');
      }
    }
  }
}

function handleInputEnd(lane) {
  zones[lane].classList.remove('active');
  activeInputs[lane] = false;
}

function addScore(lane, baseScore, judgeText, color) {
  combo++;
  const multiplier = Math.min(2.0, 1 + Math.floor(combo / 10) * 0.1);
  score += Math.round(baseScore * multiplier);
  
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  createHitEffect(lane, judgeText, color);
}

function resetCombo(lane, judgeText, color) {
  combo = 0;
  comboEl.textContent = combo;
  createHitEffect(lane, judgeText, color);
}

// イベント処理
container.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const rect = container.getBoundingClientRect();
  for (let touch of e.changedTouches) {
    const x = touch.clientX - rect.left;
    const lane = Math.floor((x / rect.width) * 3);
    if (lane >= 0 && lane < 3) handleInputStart(lane);
  }
}, { passive: false });

container.addEventListener('touchend', (e) => {
  const rect = container.getBoundingClientRect();
  for (let touch of e.changedTouches) {
    const x = touch.clientX - rect.left;
    const lane = Math.floor((x / rect.width) * 3);
    if (lane >= 0 && lane < 3) handleInputEnd(lane);
  }
});

window.addEventListener('keydown', (e) => {
  if (KEY_MAP[e.code] !== undefined && !activeInputs[KEY_MAP[e.code]]) {
    handleInputStart(KEY_MAP[e.code]);
  }
});

window.addEventListener('keyup', (e) => {
  if (KEY_MAP[e.code] !== undefined) {
    handleInputEnd(KEY_MAP[e.code]);
  }
});

startBtn.addEventListener('click', () => {
  if (!bgmBuffer) generateBGM();
  else startGame();
});

generateBGM();