
// ====================
// ゲームの基本設定
// ====================

let score = 0;
let time = 10;
let gameStarted = false;
let timer;


// ====================
// ハイスコアを読み込む
// ====================

let highScore =
    Number(localStorage.getItem("highScore")) || 0;


// ====================
// HTMLの要素を取得
// ====================

const startButton =
    document.getElementById("startButton");

const target =
    document.getElementById("target");

const scoreText =
    document.getElementById("score");

const timeText =
    document.getElementById("time");

const highScoreText =
    document.getElementById("highScore");

const result =
    document.getElementById("result");

const finalScore =
    document.getElementById("finalScore");

const finalHighScore =
    document.getElementById("finalHighScore");

const newRecord =
    document.getElementById("newRecord");


// ====================
// 最初のハイスコアを表示
// ====================

highScoreText.textContent = highScore;


// ====================
// CLICK!を元の位置に戻す
// ====================

function resetTarget() {

    target.style.position = "";
    target.style.left = "";
    target.style.top = "";

}


// ====================
// STARTボタン
// ====================

startButton.addEventListener("click", function() {

    // 前のタイマーが残っていたら止める
    clearInterval(timer);


    // ゲームを初期化
    score = 0;
    time = 10;
    gameStarted = true;


    // 画面を更新
    scoreText.textContent = score;
    timeText.textContent = time;


    // 結果画面を隠す
    result.classList.add("hidden");


    // NEW RECORD!も一旦隠す
    newRecord.style.display = "none";


    // CLICK!を元の位置に戻す
    resetTarget();


    // ====================
    // タイマー開始
    // ====================

    timer = setInterval(function() {

        time--;

        timeText.textContent = time;


        // 時間切れ
        if (time <= 0) {

            clearInterval(timer);

            gameStarted = false;


            // CLICK!を元の位置に戻す
            resetTarget();


            // 最終スコアを表示
            finalScore.textContent =
                "SCORE: " + score;


            // ====================
            // ハイスコア判定
            // ====================

            if (score > highScore) {

                // ハイスコアを更新
                highScore = score;


                // ブラウザに保存
                localStorage.setItem(
                    "highScore",
                    highScore
                );


                // 画面上のハイスコアも更新
                highScoreText.textContent =
                    highScore;


                // 結果画面のハイスコア
                finalHighScore.textContent =
                    "HIGH SCORE: " + highScore;


                // NEW RECORD!を表示
                newRecord.style.display = "block";


            } else {

                // ハイスコアは更新されていない
                finalHighScore.textContent =
                    "HIGH SCORE: " + highScore;


                // NEW RECORD!を非表示
                newRecord.style.display = "none";

            }


            // 結果画面を表示
            result.classList.remove("hidden");

        }

    }, 1000);

});


// ====================
// CLICK!ボタン
// ====================

target.addEventListener("click", function() {


    // ゲーム中じゃなければ何もしない
    if (!gameStarted) {
        return;
    }


    // スコアを1増やす
    score++;

    scoreText.textContent = score;


    // ====================
    // ゲームエリアのサイズを取得
    // ====================

    const gameArea =
        document.getElementById("gameArea");


    // CLICK!が収まる最大座標
    const maxX =
        gameArea.clientWidth -
        target.offsetWidth;

    const maxY =
        gameArea.clientHeight -
        target.offsetHeight;


    // ランダムな位置を作る
    const x =
        Math.random() * maxX;

    const y =
        Math.random() * maxY;


    // CLICK!を移動
    target.style.position = "absolute";

    target.style.left =
        x + "px";

    target.style.top =
        y + "px";

});