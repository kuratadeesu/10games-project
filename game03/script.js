// ==============================
// 神経衰弱ゲーム
// ==============================


// カードに使う絵文字
const symbols = [
  "🍎",
  "🍌",
  "🍇",
  "🍉",
  "🍓",
  "🍊",
  "🥝",
  "🍍",
  "🍒",
  "🥭",
  "🍑",
  "🍐",
  "🥥",
  "🫐",
  "🍋",
  "🍈",
  "🍏",
  "🥕",
  "🌽",
  "🍅",
  "🥔",
  "🍆",
  "🥦",
  "🥑",
  "🍄",
  "🌶️",
  "🫑",
  "🥒",
  "🧅",
  "🧄",
  "🫛",
  "🥬"
];


// ==============================
// 難易度
// ==============================

const difficulties = {

  4: {
    name: "かんたん",
    pairs: 8
  },

  6: {
    name: "ふつう",
    pairs: 18
  },

  8: {
    name: "むずかしい",
    pairs: 32
  }

};


// ==============================
// HTML要素
// ==============================

const gameBoard =
  document.getElementById(
    "game-board"
  );

const movesElement =
  document.getElementById(
    "moves"
  );

const timerElement =
  document.getElementById(
    "timer"
  );

const bestScoreElement =
  document.getElementById(
    "best-score"
  );

const pairsElement =
  document.getElementById(
    "pairs"
  );

const totalPairsElement =
  document.getElementById(
    "total-pairs"
  );

const restartButton =
  document.getElementById(
    "restart-button"
  );

const modalRestartButton =
  document.getElementById(
    "modal-restart"
  );

const clearModal =
  document.getElementById(
    "clear-modal"
  );

const resultMoves =
  document.getElementById(
    "result-moves"
  );

const resultTime =
  document.getElementById(
    "result-time"
  );

const resultDifficulty =
  document.getElementById(
    "result-difficulty"
  );

const newRecordElement =
  document.getElementById(
    "new-record"
  );


const difficultyButtons =
  document.querySelectorAll(
    ".difficulty-button"
  );


// ==============================
// ゲーム状態
// ==============================

let currentSize = 4;

let cards = [];

let firstCard = null;
let secondCard = null;

let lockBoard = false;

let moves = 0;
let matchedPairs = 0;


// タイマー
let elapsedSeconds = 0;
let timerInterval = null;
let gameStarted = false;


// ==============================
// localStorage
// ==============================

// 難易度ごとに別々のキーを作る
function getBestScoreKey() {

  return `memoryGameBest_${currentSize}`;

}


// ==============================
// ベストスコア取得
// ==============================

function getBestScore() {

  const saved =
    localStorage.getItem(
      getBestScoreKey()
    );


  if (saved === null) {
    return null;
  }


  return Number(saved);

}


// ==============================
// ベストスコア表示
// ==============================

function updateBestScoreDisplay() {

  const bestScore =
    getBestScore();


  if (bestScore === null) {

    bestScoreElement.textContent =
      "--:--";

    return;
  }


  bestScoreElement.textContent =
    formatTime(bestScore);

}


// ==============================
// ゲーム開始
// ==============================

function startGame() {

  const difficulty =
    difficulties[currentSize];


  // タイマー停止
  stopTimer();


  // 状態リセット
  cards = [];

  firstCard = null;
  secondCard = null;

  lockBoard = false;

  moves = 0;
  matchedPairs = 0;

  elapsedSeconds = 0;
  gameStarted = false;


  // 表示更新
  movesElement.textContent =
    moves;

  pairsElement.textContent =
    matchedPairs;

  totalPairsElement.textContent =
    difficulty.pairs;

  timerElement.textContent =
    "00:00";


  // ベストスコア更新
  updateBestScoreDisplay();


  // クリア画面を閉じる
  clearModal.classList.add(
    "hidden"
  );

  newRecordElement.classList.add(
    "hidden"
  );


  // ボードのサイズ
  gameBoard.className =
    `game-board size-${currentSize}`;


  // 必要なペアだけ取得
  const selectedSymbols =
    symbols.slice(
      0,
      difficulty.pairs
    );


  // 2枚ずつ
  cards = [
    ...selectedSymbols,
    ...selectedSymbols
  ];


  // シャッフル
  shuffle(cards);


  // ボードを空にする
  gameBoard.innerHTML = "";


  // カード生成
  cards.forEach(
    (symbol, index) => {

      const card =
        createCard(
          symbol,
          index
        );

      gameBoard.appendChild(card);

    }
  );

}


// ==============================
// タイマー開始
// ==============================

function startTimer() {

  // すでに開始していたら何もしない
  if (gameStarted) {
    return;
  }


  gameStarted = true;


  timerInterval =
    setInterval(() => {

      elapsedSeconds++;


      timerElement.textContent =
        formatTime(
          elapsedSeconds
        );

    }, 1000);

}


// ==============================
// タイマー停止
// ==============================

function stopTimer() {

  if (timerInterval !== null) {

    clearInterval(
      timerInterval
    );

    timerInterval = null;

  }


  gameStarted = false;

}


// ==============================
// 時間を mm:ss に変換
// ==============================

function formatTime(seconds) {

  const minutes =
    Math.floor(
      seconds / 60
    );

  const remainingSeconds =
    seconds % 60;


  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0")
  );

}


// ==============================
// カード生成
// ==============================

function createCard(
  symbol,
  index
) {

  const card =
    document.createElement(
      "button"
    );


  card.classList.add(
    "card"
  );


  card.type = "button";


  card.dataset.symbol =
    symbol;

  card.dataset.index =
    index;


  card.innerHTML = `
    <div class="card-inner">

      <div class="card-front"></div>

      <div class="card-back">
        ${symbol}
      </div>

    </div>
  `;


  card.addEventListener(
    "click",
    () => flipCard(card)
  );


  return card;

}


// ==============================
// カードをめくる
// ==============================

function flipCard(card) {

  if (lockBoard) {
    return;
  }


  if (card === firstCard) {
    return;
  }


  if (
    card.classList.contains(
      "matched"
    )
  ) {
    return;
  }


  if (
    card.classList.contains(
      "flipped"
    )
  ) {
    return;
  }


  // 最初のカードをめくった瞬間
  // タイマー開始
  if (!gameStarted) {
    startTimer();
  }


  card.classList.add(
    "flipped"
  );


  // 1枚目
  if (!firstCard) {

    firstCard = card;

    return;

  }


  // 2枚目
  secondCard = card;


  // 手数
  moves++;

  movesElement.textContent =
    moves;


  checkMatch();

}


// ==============================
// ペア判定
// ==============================

function checkMatch() {

  const isMatch =
    firstCard.dataset.symbol ===
    secondCard.dataset.symbol;


  if (isMatch) {

    disableMatchedCards();

  } else {

    unflipCards();

  }

}


// ==============================
// ペア成立
// ==============================

function disableMatchedCards() {

  firstCard.classList.add(
    "matched"
  );

  secondCard.classList.add(
    "matched"
  );


  matchedPairs++;


  pairsElement.textContent =
    matchedPairs;


  resetTurn();


  // 全部揃った
  if (
    matchedPairs ===
    difficulties[currentSize].pairs
  ) {

    // タイマー停止
    stopTimer();


    setTimeout(
      showClearModal,
      500
    );

  }

}


// ==============================
// ペア不成立
// ==============================

function unflipCards() {

  lockBoard = true;


  setTimeout(() => {

    firstCard.classList.remove(
      "flipped"
    );

    secondCard.classList.remove(
      "flipped"
    );


    resetTurn();

  }, 800);

}


// ==============================
// ターンリセット
// ==============================

function resetTurn() {

  firstCard = null;

  secondCard = null;

  lockBoard = false;

}


// ==============================
// クリア画面
// ==============================

function showClearModal() {

  const difficulty =
    difficulties[currentSize];


  const bestScore =
    getBestScore();


  // クリア時の時間
  const finalTime =
    elapsedSeconds;


  resultDifficulty.textContent =
    difficulty.name;


  resultMoves.textContent =
    moves;


  resultTime.textContent =
    formatTime(finalTime);


  let isNewRecord = false;


  // ベストスコアがない
  if (
    bestScore === null
  ) {

    isNewRecord = true;

  }

  // 今回のほうが速い
  else if (
    finalTime < bestScore
  ) {

    isNewRecord = true;

  }


  // 新記録なら保存
  if (isNewRecord) {

    localStorage.setItem(
      getBestScoreKey(),
      String(finalTime)
    );

  }


  // 新記録表示
  if (isNewRecord) {

    newRecordElement.classList.remove(
      "hidden"
    );

  } else {

    newRecordElement.classList.add(
      "hidden"
    );

  }


  // ベストスコア表示更新
  updateBestScoreDisplay();


  // モーダル表示
  clearModal.classList.remove(
    "hidden"
  );

}


// ==============================
// シャッフル
// Fisher-Yates
// ==============================

function shuffle(array) {

  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );


    [
      array[i],
      array[j]
    ] = [
      array[j],
      array[i]
    ];

  }

}


// ==============================
// 難易度変更
// ==============================

difficultyButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        currentSize =
          Number(
            button.dataset.size
          );


        // 選択状態変更
        difficultyButtons.forEach(
          btn => {

            btn.classList.remove(
              "active"
            );

          }
        );


        button.classList.add(
          "active"
        );


        // 新しい難易度で開始
        startGame();

      }
    );

  }
);


// ==============================
// リスタート
// ==============================

restartButton.addEventListener(
  "click",
  startGame
);


modalRestartButton.addEventListener(
  "click",
  startGame
);


// ==============================
// 初回起動
// ==============================

startGame();