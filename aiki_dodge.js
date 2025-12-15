document.addEventListener('DOMContentLoaded', () => {
    // === DOM要素の取得 ===
    const gameArea = document.getElementById('game-area');
    const player = document.getElementById('player');
    const hpDisplay = document.getElementById('hp');
    const scoreDisplay = document.getElementById('score');
    const overlay = document.getElementById('overlay');
    const mobileControls = document.getElementById('mobile-controls');
    const message = document.getElementById('message');
    const startButton = document.getElementById('start-button');
    const leftButton = document.getElementById('left-button'); 
    const rightButton = document.getElementById('right-button');
    const endGameButton = document.getElementById('end-game-button');
    const rulesBox = document.getElementById('rules-box');
    
    const pauseMenu = document.getElementById('pause-menu');
    const resumeButton = document.getElementById('resume-button');
    const quitButton = document.getElementById('quit-button');
    const flowButton = document.getElementById('return-to-flow-button');

    if (!gameArea || !player || !hpDisplay || !scoreDisplay || !overlay || !message || !startButton || !leftButton || !rightButton || !endGameButton || !rulesBox || !pauseMenu || !resumeButton || !quitButton) {
        console.error("ゲームに必要なDOM要素の一部が見つかりません。HTMLのIDを確認してください。");
        return;
    }

    // === ゲーム定数と変数 ===
    let gameLoop;
    let isGameRunning = false;
    let isPaused = false; 
    let timerInterval;
    
    let playerX = gameArea.clientWidth / 2;
    const playerWidth = 80;
    const playerHeight = 150;
    const playerBottomOffset = 90; 

    // プレイヤーの速度と移動状態の管理
    const PLAYER_SPEED = 6; 
    let moveDirection = 0; 

    const INITIAL_HP = 50;
    let hp = INITIAL_HP;
    let score = 0;
    let timeLeft = 0;
    let currentStage = 0; 
    
    // ステージ設定 (ステージ2まで)
    const STAGE_SETTINGS = {
        1: { TARGET_SCORE: 5, TIME_LIMIT: 30, objectSpeed: 3, stageTitle: '体捌き基礎編' },
        2: { TARGET_SCORE: 5, TIME_LIMIT: 30, objectSpeed: 4.5, stageTitle: '合気道応用編' },
    };
    const MAX_STAGE = Object.keys(STAGE_SETTINGS).length; 
    let TARGET_SCORE;
    let objectSpeed;

    const LOG_SPAWN_RATE = 1000; 
    const CHERRY_SPAWN_RATE = 2000;
    const BEER_SPAWN_RATE = 3000;
    let lastLogSpawnTime = 0; 
    let lastCherrySpawnTime = 0; 
    let lastBeerSpawnTime = 0; 
    
    // === 状態更新関数 ===
    function updateHP(amount) {
        hp += amount;
        hp = Math.min(100, Math.max(0, hp));
        hpDisplay.textContent = `HP: ${hp}`;
        
        if (hp <= 0 && isGameRunning) {
            endGame('GAME OVER');
        } else if (amount < 0) {
            gameArea.style.backgroundColor = '#FFCCCC'; 
            setTimeout(() => { gameArea.style.backgroundColor = 'transparent'; }, 100);
        } else if (amount > 0) {
            gameArea.style.backgroundColor = '#CCFFCC'; 
            setTimeout(() => { gameArea.style.backgroundColor = 'transparent'; }, 100);
        }
    }
    
    function updateScore(amount) {
        score += amount;
        scoreDisplay.textContent = `🌸: ${score} / ${TARGET_SCORE} | ⏱: ${timeLeft}秒`;
        
        if (score >= TARGET_SCORE && isGameRunning) {
            if (currentStage < MAX_STAGE) { 
                // ステージ遷移: setupStageを直接呼び出し、次のステージへ
                setupStage(currentStage + 1);
            } else {
                endGame('SUCCESS');
            }
        }
    }

    function updateTimer(immediate = false) {
        if (!isGameRunning || isPaused) return;
        if (!immediate) {
            timeLeft = Math.max(0, timeLeft - 1);
        }
        
        scoreDisplay.textContent = `🌸: ${score} / ${TARGET_SCORE} | ⏱: ${timeLeft}秒`;
        
        if (timeLeft <= 0 && score < TARGET_SCORE) {
            clearInterval(timerInterval);
            endGame('TIME OVER');
        }
    }

    
    // === アイテム/障害物の生成 (変更なし) ===
    function spawnObject(type) {
        if (!isGameRunning || isPaused) return;
        
        let content;
        if (type === 'branch') { content = "🪵"; } 
        else if (type === 'cherry') { content = '🌸'; } 
        else if (type === 'beer') { content = '🍺'; } 
        else { return; } 
        
        const objectElement = document.createElement('div');
        objectElement.classList.add(type); 
        objectElement.setAttribute('data-type', type);
        objectElement.textContent = content;

        const objectSize = 40;
        objectElement.style.fontSize = '2.2em';
        objectElement.style.width = `${objectSize}px`;
        objectElement.style.height = `${objectSize}px`;
        
        const randomX = Math.floor(Math.random() * (gameArea.clientWidth - objectSize)) + objectSize / 2;
        objectElement.style.left = `${randomX - objectSize / 2}px`; 
        objectElement.style.top = `0px`; 

        gameArea.appendChild(objectElement);
    }

    // === ゲームループ (変更なし) ===
    function gameUpdate(timestamp) {
        if (!isGameRunning || isPaused) {
            cancelAnimationFrame(gameLoop);
            return;
        }

        if (moveDirection !== 0) {
            let newX = playerX + (moveDirection * PLAYER_SPEED);
            
            // 境界チェック
            newX = Math.max(playerWidth / 2, newX);
            newX = Math.min(gameArea.clientWidth - playerWidth / 2, newX);
            
            playerX = newX;
            player.style.left = `${playerX - playerWidth / 2}px`;
        }


        // 1. アイテム/障害物の生成
        if (timestamp - lastLogSpawnTime > LOG_SPAWN_RATE) { 
            spawnObject('branch');
            lastLogSpawnTime = timestamp;
        }
        if (timestamp - lastCherrySpawnTime > CHERRY_SPAWN_RATE) { 
            spawnObject('cherry');
            lastCherrySpawnTime = timestamp;
        }
        if (timestamp - lastBeerSpawnTime > BEER_SPAWN_RATE) { 
            spawnObject('beer');
            lastBeerSpawnTime = timestamp;
        }

        // 2. アイテム/障害物の移動と衝突判定
        const objects = gameArea.querySelectorAll('.branch, .cherry, .beer'); 
        
        const playerRect = {
            left: playerX - playerWidth / 2 + 10,
            right: playerX + playerWidth / 2 - 10,
            top: gameArea.clientHeight - playerHeight + playerBottomOffset,
            bottom: gameArea.clientHeight - playerBottomOffset
        };

        for (const obj of objects) { 
            let currentY = parseFloat(obj.style.top) || 0;
            currentY += objectSpeed; 
            obj.style.top = `${currentY}px`;

            const objRect = obj.getBoundingClientRect();
            const objCollisionRect = {
                left: parseFloat(obj.style.left),
                right: parseFloat(obj.style.left) + objRect.width,
                top: currentY,
                bottom: currentY + objRect.height
            };
            
            const isColliding = 
                playerRect.left < objCollisionRect.right &&
                playerRect.right > objCollisionRect.left &&
                playerRect.top < objCollisionRect.bottom &&
                playerRect.bottom > objCollisionRect.top;

            if (isColliding) {
                const type = obj.getAttribute('data-type');
                if (type === 'branch') { updateHP(-10); } 
                else if (type === 'cherry') { updateScore(1); } 
                else if (type === 'beer') { updateHP(20); } 
                obj.remove();
            } else if (currentY > gameArea.clientHeight) {
                obj.remove();
            }
        }
        gameLoop = requestAnimationFrame(gameUpdate);
    }

    // --- ゲーム開始/終了/一時停止制御 ---
    
    function setupStage(stageNum) {
        // ゲーム停止状態を確実にリセット
        isGameRunning = false;
        isPaused = false;
        clearInterval(timerInterval);
        cancelAnimationFrame(gameLoop);

        // ステージ設定の適用
        const settings = STAGE_SETTINGS[stageNum];
        currentStage = stageNum;
        TARGET_SCORE = settings.TARGET_SCORE;
        objectSpeed = settings.objectSpeed;
        timeLeft = settings.TIME_LIMIT; 

        // リセット処理
        if (stageNum === 1) { 
            hp = INITIAL_HP; // ステージ1開始時のみHPリセット
        }
        score = 0;
        updateHP(0);

        // アイテムをすべて削除
        gameArea.querySelectorAll('.branch, .cherry, .beer').forEach(el => el.remove());
        playerX = gameArea.clientWidth / 2;
        player.style.left = `${playerX - playerWidth / 2}px`;
        
        // UI表示
        overlay.style.display = 'flex';
        endGameButton.style.display = 'none';
        pauseMenu.style.display = 'none';
        
        // 🔴 修正: ステージ1の時のみルールを表示
        rulesBox.style.display = (stageNum === 1) ? 'block' : 'none'; 
        startButton.style.display = 'block';
        message.style.display = 'block';
        
        // 🔴 修正: メッセージの表示内容を変更
        if (stageNum === 1) {
            // ステージ1/再挑戦時
            message.innerHTML = `<h2>ステージ${stageNum} : ${settings.stageTitle}</h2>
                                <p>🌸 目標桜数: **${TARGET_SCORE}**個 / 制限時間 **${timeLeft}秒**</p>`;
        } else {
            // ステージクリア後の待機画面
            message.innerHTML = `<div class="result-box">
                                    <h1>ステージ${stageNum}へ！</h1>
                                    <p>🎉 お見事！HPを維持したまま次へ！</p>
                                    <p class="warning">⚠️ 落下速度が上がります！ 🌸 目標桜数: **${settings.TARGET_SCORE}**個</p>
                                 </div>`;
        }

        startButton.textContent = `ステージ${stageNum} スタート`;
        scoreDisplay.textContent = `🌸: ${score} / ${TARGET_SCORE} | ⏱: ${timeLeft}秒`;

        // スタートボタンのリスナーを設定
        startButton.onclick = () => startRunning();
    }
    
    function startRunning() {
        isGameRunning = true;
        isPaused = false;
        moveDirection = 0; 

        // UI表示の切り替え
        overlay.style.display = 'none';
        endGameButton.style.display = 'block';
        rulesBox.style.display = 'none'; 
        pauseMenu.style.display = 'none';

        // 🔴 修正箇所: ゲーム開始時、モバイルボタンを表示
        if (window.innerWidth <= 600) {
            mobileControls.style.display = 'flex';
        }

        // タイマー開始
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000); 
        updateTimer(true); 

        // スポーンタイマーをリセット
        lastLogSpawnTime = performance.now();
        lastCherrySpawnTime = performance.now();
        lastBeerSpawnTime = performance.now();

        gameLoop = requestAnimationFrame(gameUpdate);
        
    }


    function pauseGame() {
        if (!isGameRunning) return; 
        isPaused = true;
        clearInterval(timerInterval);
        cancelAnimationFrame(gameLoop);
        
        overlay.style.display = 'flex';
        endGameButton.style.display = 'none';
        rulesBox.style.display = 'none';
        startButton.style.display = 'none';
        message.style.display = 'none';
        pauseMenu.style.display = 'block';
    }

    function resumeGame() {
        if (!isGameRunning || !isPaused) return; 
        isPaused = false;
        moveDirection = 0; 
        
        overlay.style.display = 'none';
        endGameButton.style.display = 'block';
        pauseMenu.style.display = 'none';

        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000); 
        gameLoop = requestAnimationFrame(gameUpdate);
    }

    function endGame(endMessage) { 
        isGameRunning = false;
        isPaused = false;
        clearInterval(timerInterval); 
        cancelAnimationFrame(gameLoop);
        moveDirection = 0; 
        
        gameArea.querySelectorAll('.branch, .cherry, .beer').forEach(el => el.remove());
        
        overlay.style.display = 'flex';
        endGameButton.style.display = 'none';
        pauseMenu.style.display = 'none';
        startButton.style.display = 'block';
        message.style.display = 'block';

        // ゲームオーバー時はステージをリセットし、再挑戦のためにルールボックスを表示
        currentStage = 0; 
        rulesBox.style.display = (endMessage.includes('GAME OVER') || endMessage.includes('TIME OVER')) ? 'block' : 'none'; 

        // 🔴 修正: 結果画面のコンテンツ
        let resultText = `<div class="result-box ${endMessage.includes('SUCCESS') ? 'success-box' : ''}">`; 
        
        if (endMessage.includes('GAME OVER')) {
            resultText += `<h1>💥 残念！鍛錬不足！！ 💥</h1>`;
            resultText += `<p>👑 残りのHP: **${hp} / ${INITIAL_HP}**</p>`;
            resultText += `<p>🌸 獲得した桜: **${score}**個 (ステージ${currentStage + 1}敗退)</p>`;
            resultText += `<p class="detail">薪をよけきれませんでした。あきらめず体捌きを磨きましょう！</p>`;
        
        } else if (endMessage.includes('TIME OVER')) {
            resultText += `<h1>⌛ タイムアップ！ ⌛</h1>`;
            resultText += `<p>👑 残りのHP: **${hp} / ${INITIAL_HP}**</p>`;
            resultText += `<p>🌸 獲得した桜: **${score}**個 (ステージ${currentStage + 1}敗退)</p>`;
            resultText += `<p class="detail">制限時間内に目標の桜を集められませんでした。</p>`;
        
        } else if (endMessage.includes('SUCCESS')) {
            resultText += `<h1>🎉 ㊗️ 全ステージ完全制覇！ ㊗️</h1>`; // 全クリアを強調
            resultText += `<p>👑 **残りのHP:** **${hp}** / ${INITIAL_HP}</p>`; 
            resultText += `<p>🌸 **獲得した桜:** ${STAGE_SETTINGS[MAX_STAGE].TARGET_SCORE * MAX_STAGE}個</p>`; 
            resultText += `<p class="detail">合気道の体捌き、お見事！</p>`;
        } else { // PLAYER QUIT
            resultText += `<h1>⏸️ ゲーム終了 ⏸️</h1>`;
            resultText += `<p>🌸 獲得した桜: **${score}**個</p>`;
            resultText += '<p class="detail">ゲームが途中で終了しました。</p>';
        }
        
        resultText += `</div>`;
        message.innerHTML = resultText;
        startButton.textContent = 'もう一度プレイ';
        
        // 再挑戦はステージ1から
        startButton.onclick = () => setupStage(1); 
    }
    
    // --- イベントリスナー (変更なし) ---
    document.addEventListener('keydown', (e) => {
        if (!isGameRunning || isPaused) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            e.preventDefault();
            moveDirection = -1; 
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            e.preventDefault();
            moveDirection = 1; 
        } else if (e.key === 'Escape' && isGameRunning && !isPaused) {
            pauseGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (!isGameRunning || isPaused) return;
        
        if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') && moveDirection !== 0) {
            moveDirection = 0; 
        }
    });
    
    // モバイルボタンのリスナー
    leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameRunning && !isPaused) moveDirection = -1; });
    leftButton.addEventListener('touchend', () => { if (isGameRunning && !isPaused) moveDirection = 0; }); 
    
    rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameRunning && !isPaused) moveDirection = 1; });
    rightButton.addEventListener('touchend', () => { if (isGameRunning && !isPaused) moveDirection = 0; }); 

    endGameButton.addEventListener('click', pauseGame); 
    resumeButton.addEventListener('click', resumeGame); 
    quitButton.addEventListener('click', () => endGame('PLAYER QUIT')); 

    flowButton.addEventListener('click', () => { 
        window.location.href = 'aiki-flow.html'; 
    });
    
    // --- 初期設定 ---
    setupStage(1); 
});