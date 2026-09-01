const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const startBtn = document.getElementById('start-btn');
const judgeEl = document.getElementById('judge-display');
const diffBtns = document.querySelectorAll('.diff-btn');
const zones = document.querySelectorAll('.zone');

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

// 周波数テーブル
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99
};

// 難易度別：譜面＋ドラム＋コード伴奏データ
const DIFFICULTY_CONFIG = {
  easy: {
    speed: 220,
    bpm: 100,
    duration: 11,
    // C -> G -> Am -> F
    chords: [
      { time: 0.0, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] },
      { time: 2.4, freqs: [NOTES.G3, NOTES.B3, NOTES.D4] },
      { time: 4.8, freqs: [NOTES.A3, NOTES.C4, NOTES.E4] },
      { time: 7.2, freqs: [NOTES.F3, NOTES.A3, NOTES.C4] }
    ],
    // 4つ打ちポピュラー風ドラム
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
    // Am -> F -> C -> G
    chords: [
      { time: 0.0, freqs: [NOTES.A3, NOTES.C4, NOTES.E4] },
      { time: 2.0, freqs: [NOTES.F3, NOTES.A3, NOTES.C4] },
      { time: 4.0, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] },
      { time: 6.0, freqs: [NOTES.G3, NOTES.B3, NOTES.D4] },
      { time: 8.0, freqs: [NOTES.A3, NOTES.C4, NOTES.E4] }
    ],
    // ダンスビートドラム
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
    // Em -> C -> D -> Bm
    chords: [
      { time: 0.0, freqs: [NOTES.E3, NOTES.G3, NOTES.B3] },
      { time: 1.5, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] },
      { time: 3.0, freqs: [NOTES.D3, NOTES.F3, NOTES.A3] },
      { time: 4.5, freqs: [NOTES.B3, NOTES.D4, NOTES.F4] },
      { time: 6.0, freqs: [NOTES.E3, NOTES.G3, NOTES.B3] },
      { time: 7.5, freqs: [NOTES.C3, NOTES.E3, NOTES.G3] }
    ],
    // 高速アグレッシブドラム
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

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isPlaying) return;
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDifficulty = btn.dataset.diff;
    generateBGM();
  });
});

// オーディオ合成エンジン（ドラム・コード伴奏・メロディ）
async function generateBGM() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startBtn.textContent = 'BGM構築中...';
  startBtn.disabled = true;

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const duration = config.duration;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioCtx.sampleRate * duration), audioCtx.sampleRate);

  // 1. コード伴奏の合成
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

  // 2. ドラムパートの合成
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

  // 3. メロディ（ノーツ音）の合成
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

function startGame() {
  if (!bgmBuffer) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const config = DIFFICULTY_CONFIG[currentDifficulty];
  const travelTime = (TARGET_Y - SPAWN_Y) / config.speed;

  score = 0;
  combo = 0;
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  judgeEl.textContent = '';
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

// メイン更新ループ
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
        resetCombo('MISS', '#ff4d4d');
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

        if (elapsedTime >= note.targetTime + note.duration) {
          note.completed = true;
          note.el.remove();
          addScore(150, 'PERFECT!', '#00f3ff');
        } else if (!activeInputs[note.lane]) {
          note.holding = false;
          note.completed = true;
          note.el.style.display = 'none';
          resetCombo('MISS', '#ff4d4d');
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
          resetCombo('MISS', '#ff4d4d');
        }
      }
    }
  }

  if (elapsedTime > config.duration) {
    isPlaying = false;
    startBtn.style.display = 'block';
    startBtn.textContent = 'もう一度プレイ';
  } else {
    requestAnimationFrame(update);
  }
}

// 入力イベント処理
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
      addScore(50, 'HOLD!', '#ff007f');
    } else {
      closestNote.completed = true;
      closestNote.el.remove();
      if (minDiff <= 0.06) addScore(100, 'PERFECT!', '#00f3ff');
      else addScore(50, 'GREAT', '#ffeb3b');
    }
  }
}

function handleInputEnd(lane) {
  zones[lane].classList.remove('active');
  activeInputs[lane] = false;
}

function addScore(baseScore, judgeText, color) {
  combo++;
  const multiplier = Math.min(2.0, 1 + Math.floor(combo / 10) * 0.1);
  score += Math.round(baseScore * multiplier);
  
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  showJudge(judgeText, color);
}

function resetCombo(judgeText, color) {
  combo = 0;
  comboEl.textContent = combo;
  showJudge(judgeText, color);
}

function showJudge(text, color) {
  judgeEl.textContent = text;
  judgeEl.style.color = color;
  judgeEl.classList.remove('pop-anim');
  void judgeEl.offsetWidth;
  judgeEl.classList.add('pop-anim');
}

// タッチ＆キーボードリスナー
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