// 画像のスタイルに合わせたパレット（9色）
const COLOR_PALETTE = [
  '#FF5252', // 赤系
  '#FFD740', // 黄色系
  '#00ACC1', // シアン系
  '#FF4081', // マゼンタ系
  '#40C4FF', // 水色系
  '#00C853', // 緑系
  '#CCFF90', // 黄緑系
  '#E1BEE7', // 薄紫系
  '#7C4DFF'  // 紫系
];

let currentNum = 1;
let startTime = 0;
let timerInterval = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('reset-btn').addEventListener('click', resetBestTime);
  displayBestTime();
  renderEmptyBoard();
});

// 初期（空）盤面の描画
function renderEmptyBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell-btn';
    cell.style.backgroundColor = '#e0e0e0';
    board.appendChild(cell);
  }
}

// ハイスコア表示
function displayBestTime() {
  const savedBest = localStorage.getItem('number_game_3x3_best');
  const bestTimeElement = document.getElementById('best-time');
  if (savedBest) {
    bestTimeElement.innerText = `自己ベスト: ${parseFloat(savedBest).toFixed(2)} 秒`;
  } else {
    bestTimeElement.innerText = '自己ベスト: -- 秒';
  }
}

// ハイスコアリセット
function resetBestTime() {
  const savedBest = localStorage.getItem('number_game_3x3_best');
  if (!savedBest) {
    alert('リセットする記録がありません。');
    return;
  }
  if (confirm('自己ベスト記録をリセットしますか？')) {
    localStorage.removeItem('number_game_3x3_best');
    displayBestTime();
  }
}

// 配列をランダムにシャッフルする関数（Fisher-Yates）
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 盤面の再配置（数字と背景色をランダム化）
function updateBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  // 1〜9の数字と色の配列をそれぞれシャッフル
  const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const colors = shuffle(COLOR_PALETTE);

  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell-btn';
    btn.innerText = numbers[i];
    btn.style.backgroundColor = colors[i];

    btn.addEventListener('click', () => handleTap(btn, numbers[i]));
    board.appendChild(btn);
  }
}

// ゲーム開始
function startGame() {
  currentNum = 1;
  isPlaying = true;
  
  document.getElementById('target-num').innerText = `次を押す: ${currentNum}`;
  document.getElementById('timer').innerText = '0.00 秒';

  updateBoard();

  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsedTime = (Date.now() - startTime) / 1000;
    document.getElementById('timer').innerText = `${elapsedTime.toFixed(2)} 秒`;
  }, 10);
}

// セルタップ時の判定
function handleTap(btn, num) {
  if (!isPlaying) return;

  if (num === currentNum) {
    if (currentNum === 9) {
      // 9を押したらクリア処理
      clearInterval(timerInterval);
      isPlaying = false;

      const finalTimeStr = ((Date.now() - startTime) / 1000).toFixed(2);
      const finalTime = parseFloat(finalTimeStr);
      
      document.getElementById('timer').innerText = `${finalTimeStr} 秒`;

      const savedBest = localStorage.getItem('number_game_3x3_best');
      if (!savedBest || finalTime < parseFloat(savedBest)) {
        localStorage.setItem('number_game_3x3_best', finalTime);
        document.getElementById('target-num').innerText = '🎉 新記録達成！ クリア！';
        displayBestTime();
      } else {
        document.getElementById('target-num').innerText = 'クリア！';
      }
    } else {
      // 1〜8の場合は次の数字に進み、盤面をシャッフル
      currentNum++;
      document.getElementById('target-num').innerText = `次を押す: ${currentNum}`;
      updateBoard();
    }
  } else {
    // ミスタップ演出
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.remove('wrong'), 200);
  }
}