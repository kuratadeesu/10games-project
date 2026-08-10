// ==============================
// 間違い探しゲーム
// ==============================

// 座標は「画像そのもの」の幅・高さを基準にしています。
// x, y は 0〜100 のパーセント。
// r はクリック判定の半径です。
const differences = [
  { x: 8.0,  y: 13.0, r: 5.0, name: "鳥の色" },
  { x: 23.5, y: 27.0, r: 7.0, name: "屋根とすべり台" },
  { x: 44.0, y: 34.0, r: 5.5, name: "街灯" },
  { x: 90.0, y: 12.0, r: 5.5, name: "太陽" },
  { x: 84.0, y: 39.0, r: 7.0, name: "噴水" },
  { x: 71.0, y: 70.0, r: 5.5, name: "犬の首輪" },
  { x: 91.0, y: 83.0, r: 7.0, name: "花" }
];

const pictures = document.querySelectorAll(".picture");
const foundCount = document.querySelector("#foundCount");
const totalCount = document.querySelector("#totalCount");
const missCount = document.querySelector("#missCount");
const message = document.querySelector("#message");
const resetButton = document.querySelector("#resetButton");
const clearModal = document.querySelector("#clearModal");
const resultText = document.querySelector("#resultText");
const playAgainButton = document.querySelector("#playAgainButton");
const timeElement = document.querySelector("#timer");
const showAnswerButton = document.querySelector("#showAnswerButton");

let found = new Set();
let misses = 0;
let timeLeft = 30;
let timerId = null;
let isPlaying = false;
let gameOver = false;

totalCount.textContent = differences.length;

pictures.forEach((picture) => {
  picture.addEventListener("click", (event) => {
    if (!isPlaying || gameOver) return;
    if (found.size === differences.length) return;

    const rect = picture.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const hitIndex = differences.findIndex((difference, index) => {
      if (found.has(index)) return false;

      const dx = x - difference.x;
      const dy = y - difference.y;
      return Math.sqrt(dx * dx + dy * dy) <= difference.r;
    });

    if (hitIndex >= 0) {
      found.add(hitIndex);
      pictures.forEach((p) => showMarker(p, differences[hitIndex]));
      updateStatus();

      message.textContent = `正解！「${differences[hitIndex].name}」を発見！`;
      message.className = "message good";

      if (found.size === differences.length) {
        clearInterval(timerId);
        isPlaying = false;
        setTimeout(showClear, 450);
      }
    } else {
      misses++;
      updateStatus();

      // クリックした位置に「✖」マークを表示
      showMissMarker(picture, x, y);

      message.textContent = "そこじゃないよ！もう一度探してみよう 👀";
      message.className = "message bad";
    }
  });
});

// 正解マーカーを表示する関数
function showMarker(picture, difference, isAnswer = false) {
  const markers = picture.querySelector(".markers");
  const marker = document.createElement("div");

  // 答え合わせ表示の場合は answer クラスを付与
  marker.className = isAnswer ? "marker answer" : "marker";
  marker.style.left = `${difference.x}%`;
  marker.style.top = `${difference.y}%`;

  markers.appendChild(marker);
}

function showMissMarker(picture, x, y) {
  const markers = picture.querySelector(".markers");
  const missMarker = document.createElement("div");

  missMarker.className = "miss-marker";
  missMarker.textContent = "✖";
  missMarker.style.left = `${x}%`;
  missMarker.style.top = `${y}%`;

  markers.appendChild(missMarker);

  setTimeout(() => {
    missMarker.remove();
  }, 600);
}

function updateStatus() {
  foundCount.textContent = found.size;
  missCount.textContent = misses;
  timeElement.textContent = timeLeft;
}

function showClear() {
  resultText.textContent = `残り時間：${timeLeft}秒 / ミス：${misses} 回`;
  clearModal.classList.remove("hidden");
}

// 答えを表示する関数
function revealAnswers() {
  differences.forEach((difference, index) => {
    // まだ見つけていない正解だけを表示
    if (!found.has(index)) {
      pictures.forEach((p) => showMarker(p, difference, true));
    }
  });
  showAnswerButton.classList.add("hidden");
  message.textContent = "青い丸が残りの答えだよ！";
  message.className = "message";
}

// ゲーム開始・再スタート処理
function startGame() {
  found.clear();
  misses = 0;
  timeLeft = 30;
  gameOver = false;
  isPlaying = true;

  document.querySelectorAll(".markers").forEach((markers) => {
    markers.innerHTML = "";
  });

  clearModal.classList.add("hidden");
  showAnswerButton.classList.add("hidden"); // ボタンを非表示に
  resetButton.textContent = "もう一度遊ぶ";
  message.textContent = "違うところを探してみよう！";
  message.className = "message";
  updateStatus();
  startTimer();
}

function startTimer() {
  clearInterval(timerId);

  timerId = setInterval(() => {
    timeLeft--;
    timeElement.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerId); 
      gameOver = true;
      isPlaying = false;
      
      resetButton.textContent = "もう一度遊ぶ";
      message.textContent = "⏰ 時間切れ！";
      message.className = "message bad";

      // 未発見の答えがある場合のみ「答えを見る」ボタンを表示
      if (found.size < differences.length) {
        showAnswerButton.classList.remove("hidden");
      }
    }
  }, 1000);
}

// 初期化（ページ読み込み時の準備）
function initGame() {
  found.clear();
  misses = 0;
  timeLeft = 30;
  gameOver = false;
  isPlaying = false;
  clearInterval(timerId);

  showAnswerButton.classList.add("hidden");
  resetButton.textContent = "スタート";
  message.textContent = "「スタート」ボタンを押してゲームを始めてね！";
  message.className = "message";
  updateStatus();
}

resetButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
showAnswerButton.addEventListener("click", revealAnswers);

// 初期表示状態を設定
initGame();