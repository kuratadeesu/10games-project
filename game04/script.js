const AREA_SIZE = 400; 
const BTN_SIZE = 60;   

let currentNum = 1;
let startTime = 0;
let timerInterval = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-btn');
  startBtn.addEventListener('click', startGame);

  // リセットボタンのイベント設定を追加
  const resetBtn = document.getElementById('reset-btn');
  resetBtn.addEventListener('click', resetBestTime);

  displayBestTime();
});

// 自己ベストの表示更新
function displayBestTime() {
  const savedBest = localStorage.getItem('number_game_best_time');
  const bestTimeElement = document.getElementById('best-time');
  
  if (savedBest) {
    bestTimeElement.innerText = `自己ベスト: ${parseFloat(savedBest).toFixed(2)} 秒`;
  } else {
    bestTimeElement.innerText = '自己ベスト: -- 秒';
  }
}

// 自己ベストのリセット処理（新規追加）
function resetBestTime() {
  const savedBest = localStorage.getItem('number_game_best_time');

  if (!savedBest) {
    alert('リセットする記録がありません。');
    return;
  }

  // 誤操作防止の確認ダイアログ
  if (confirm('自己ベスト記録をリセットしますか？')) {
    localStorage.removeItem('number_game_best_time');
    displayBestTime();
  }
}

function startGame() {
  const gameArea = document.getElementById('game-area');
  gameArea.innerHTML = '';
  
  currentNum = 1;
  isPlaying = true;
  document.getElementById('target-num').innerText = `次を押す: ${currentNum}`;
  document.getElementById('timer').innerText = '0.00 秒';
  
  const positions = [];

  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.innerText = i;

    const pos = getRandomPosition(positions);
    positions.push(pos);

    btn.style.left = `${pos.x}px`;
    btn.style.top = `${pos.y}px`;

    btn.addEventListener('click', () => handleTap(btn, i));

    gameArea.appendChild(btn);
  }

  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsedTime = (Date.now() - startTime) / 1000;
    document.getElementById('timer').innerText = `${elapsedTime.toFixed(2)} 秒`;
  }, 10);
}

function getRandomPosition(existingPositions) {
  const maxPos = AREA_SIZE - BTN_SIZE;
  let x, y, overlap;

  do {
    x = Math.floor(Math.random() * maxPos);
    y = Math.floor(Math.random() * maxPos);
    
    overlap = existingPositions.some(p => {
      const distance = Math.hypot(p.x - x, p.y - y);
      return distance < BTN_SIZE + 10;
    });
  } while (overlap);

  return { x, y };
}

function handleTap(btn, num) {
  if (!isPlaying) return;

  if (num === currentNum) {
    btn.remove();
    currentNum++;

    if (currentNum > 10) {
      clearInterval(timerInterval);
      isPlaying = false;
      
      const finalTimeStr = ((Date.now() - startTime) / 1000).toFixed(2);
      const finalTime = parseFloat(finalTimeStr);
      
      document.getElementById('timer').innerText = `${finalTimeStr} 秒`;

      const savedBest = localStorage.getItem('number_game_best_time');
      
      if (!savedBest || finalTime < parseFloat(savedBest)) {
        localStorage.setItem('number_game_best_time', finalTime);
        document.getElementById('target-num').innerText = '🎉 新記録達成！ クリア！';
        displayBestTime();
      } else {
        document.getElementById('target-num').innerText = 'クリア！';
      }

    } else {
      document.getElementById('target-num').innerText = `次を押す: ${currentNum}`;
    }
  } else {
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.remove('wrong'), 200);
  }
}