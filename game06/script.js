// --- Web Audio API による効果音生成システム ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.1) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// 効果音定義
const soundEffects = {
  beep: () => playTone(800, 'sine', 0.08, 0.15),           // 数字切り替え（ピッ）
  countdown: () => playTone(440, 'triangle', 0.15, 0.2),  // カウントダウン（ポーン）
  start: () => playTone(880, 'sine', 0.3, 0.25),          // スタート（ピー）
  correct: () => {                                         // 正解（ピンポン！）
    playTone(659.25, 'sine', 0.15, 0.2); // E5
    setTimeout(() => playTone(880, 'sine', 0.4, 0.2), 120); // A5
  },
  incorrect: () => {                                       // 不正解（ブッ）
    playTone(150, 'sawtooth', 0.3, 0.2);
  },
  tap: () => playTone(1200, 'sine', 0.03, 0.05)            // テンキータップ（チッ）
};


// --- DOM要素 ---
const numberDisplay = document.getElementById('number-display');
const settingsArea = document.getElementById('settings-area');
const inputArea = document.getElementById('input-area');
const levelSelect = document.getElementById('level');
const countSelect = document.getElementById('count');
const speedSelect = document.getElementById('speed');
const startBtn = document.getElementById('start-btn');
const submitBtn = document.getElementById('submit-btn');
const userAnswerInput = document.getElementById('user-answer');
const resultMessage = document.getElementById('result-message');

let correctAnswer = 0;

// 桁数範囲の設定
function getNumberRange(level) {
  switch (level) {
    case 'easy':   return { min: 1, max: 9 };     // 1桁
    case 'medium': return { min: 10, max: 99 };   // 2桁
    case 'hard':   return { min: 100, max: 999 }; // 3桁
    default:       return { min: 1, max: 9 };
  }
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ゲーム開始処理
startBtn.addEventListener('click', () => {
  audioCtx.resume(); // オーディオコンテキストの有効化

  const level = levelSelect.value;
  const count = parseInt(countSelect.value);
  const displayTime = parseFloat(speedSelect.value) * 1000;
  const { min, max } = getNumberRange(level);

  correctAnswer = 0;
  resultMessage.textContent = '';
  resultMessage.className = 'result';
  settingsArea.classList.add('hidden');
  userAnswerInput.value = '';

  // カウントダウン (3, 2, 1)
  let countdown = 3;
  numberDisplay.textContent = countdown;
  soundEffects.countdown();

  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      numberDisplay.textContent = countdown;
      soundEffects.countdown();
    } else {
      clearInterval(countdownInterval);
      soundEffects.start();
      numberDisplay.textContent = '';
      setTimeout(() => {
        startFlashSequence(count, min, max, displayTime);
      }, 300);
    }
  }, 1000);
});

// 数字の表示 & フラッシュ演出
function startFlashSequence(totalCount, min, max, displayTime) {
  let currentCount = 0;

  const flashInterval = setInterval(() => {
    if (currentCount < totalCount) {
      const num = getRandomNumber(min, max);
      correctAnswer += num;

      // フラッシュ演出 (一瞬白く光らせる)
      numberDisplay.classList.add('flash');
      numberDisplay.textContent = num;
      soundEffects.beep();

      setTimeout(() => {
        numberDisplay.classList.remove('flash');
      }, 60);

      // パッと消える消灯時間
      setTimeout(() => {
        numberDisplay.textContent = '';
      }, displayTime - 80);

      currentCount++;
    } else {
      clearInterval(flashInterval);
      setTimeout(() => {
        numberDisplay.textContent = '？';
        inputArea.classList.remove('hidden');
      }, 200);
    }
  }, displayTime);
}

// テンキー入力処理
document.querySelectorAll('.key-btn[data-value]').forEach(btn => {
  btn.addEventListener('click', () => {
    soundEffects.tap();
    if (userAnswerInput.value.length < 6) { // 上限桁数制限
      userAnswerInput.value += btn.dataset.value;
    }
  });
});

// クリア(C)ボタン
document.getElementById('clear-btn').addEventListener('click', () => {
  soundEffects.tap();
  userAnswerInput.value = '';
});

// バックスペース(⌫)ボタン
document.getElementById('bs-btn').addEventListener('click', () => {
  soundEffects.tap();
  userAnswerInput.value = userAnswerInput.value.slice(0, -1);
});

// 回答チェック
function checkAnswer() {
  if (!userAnswerInput.value) return;

  const userAnswer = parseInt(userAnswerInput.value);

  if (userAnswer === correctAnswer) {
    resultMessage.textContent = '正解です！ 🎉';
    resultMessage.className = 'result correct';
    soundEffects.correct();
  } else {
    resultMessage.textContent = `不正解… 正解は ${correctAnswer} です`;
    resultMessage.className = 'result incorrect';
    soundEffects.incorrect();
  }

  inputArea.classList.add('hidden');
  settingsArea.classList.remove('hidden');
}

submitBtn.addEventListener('click', checkAnswer);