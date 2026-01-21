$(document).ready(function() {
    console.log("Pong Game - Проти бота завантажується...");
    
    // ====================
    // DOM ЕЛЕМЕНТИ
    // ====================
    const $mainMenu = $('#mainMenu');
    const $gameScreen = $('#gameScreen');
    const $gameOver = $('#gameOver');
    
    const $startGameBtn = $('#startGameBtn');
    const $restartBtn = $('#restartBtn');
    const $menuBtn = $('#menuBtn');
    const $exitToMenuBtn = $('#exitToMenuBtn');
    const $soundToggle = $('#soundToggle');
    const $soundIcon = $('#soundIcon');
    
    const $canvas = $('#gameCanvas');
    const ctx = $canvas[0].getContext('2d');
    
    // Елементи інтерфейсу
    const $playerScore = $('#playerScore');
    const $botScore = $('#botScore');
    const $difficultyLevel = $('#difficultyLevel');
    const $hitsCount = $('#hitsCount');
    const $maxDifficulty = $('#maxDifficulty');
    const $totalHits = $('#totalHits');
    
    const $winnerTitle = $('#winnerTitle');
    const $winnerMessage = $('#winnerMessage');
    const $finalScore = $('#finalScore');
    
    // Аудіо елементи
    const $backgroundMusic = $('#backgroundMusic');
    const $hitSound = $('#hitSound');
    const $scoreSound = $('#scoreSound');
    
    // ====================
    // КОНСТАНТИ ГРИ
    // ====================
    const PADDLE_WIDTH = 100;
    const PADDLE_HEIGHT = 15;
    const BALL_SIZE = 10;
    const MIN_BALL_SPEED = 3.0;
    const MAX_BALL_SPEED = 12.0;
    const SPEED_INCREMENT = 0.5;
    const PADDLE_SPEED = 8;
    
    // Налаштування прогресу бо
    const BOT_PROGRESS_RATE = 0.04; // Збільшив швидкість прогресу
    const MAX_DIFFICULTY = 999;
    
    // ====================
    // СТАН ГРИ
    // ====================
    const gameState = {
        soundEnabled: true,
        maxDifficultyAchieved: 1.0,
        totalHitsCount: 0,
        
        player: {
            x: 300,
            y: 750,
            score: 0,
            color: '#00b4db',
            name: 'Гравець'
        },
        
        bot: {
            x: 300,
            y: 35,
            score: 0,
            color: '#ff416c',
            name: 'Бот',
            targetX: 300,
            lastUpdate: 0,
            difficulty: 1.0,          // Починає з 1.0
            baseErrorRange: 40,       // Базова похибка
            currentErrorRange: 40,    // Поточна похибка
            baseReactionSpeed: 200,   // Базова реакція
            currentReactionSpeed: 200,// Поточна реакція
            predictionAccuracy: 0.3,  // Точність прогнозу
            adaptiveLearning: 0,      // Адаптивне навчання
            speedMultiplier: 1.0      // Множник швидкості
        },
        
        ball: {
            x: 350,
            y: 400,
            dx: 0,
            dy: 0,
            currentSpeed: MIN_BALL_SPEED,
            hits: 0
        },
        
        gameRunning: false,
        gameActive: false,
        keys: {}
    };
    
    // ====================
    // ІНІЦІАЛІЗАЦІЯ
    // ====================
    
    function init() {
        setupEventListeners();
        resetGameState();
        setupAudio();
        showMainMenu();
    }
    
    function setupEventListeners() {
        // Кнопки
        $startGameBtn.on('click', startGame);
        $restartBtn.on('click', restartGame);
        $menuBtn.on('click', showMainMenu);
        $exitToMenuBtn.on('click', showMainMenu);
        $soundToggle.on('click', toggleSound);
        
        // Клавіатура
        $(document).on('keydown', handleKeyDown);
        $(document).on('keyup', handleKeyUp);
    }
    
    function setupAudio() {
        // Налаштування аудіо
        $backgroundMusic[0].volume = 0.1;
        $hitSound[0].volume = 0.3;
        $scoreSound[0].volume = 0.4;
    }
    
    function playSound(soundElement) {
        if (gameState.soundEnabled) {
            soundElement[0].currentTime = 0;
            soundElement[0].play().catch(e => console.log("Audio play error:", e));
        }
    }
    
    function toggleSound() {
        gameState.soundEnabled = !gameState.soundEnabled;
        
        if (gameState.soundEnabled) {
            $soundIcon.text('🔊');
            $backgroundMusic[0].play().catch(e => console.log("Audio play error:", e));
        } else {
            $soundIcon.text('🔇');
            $backgroundMusic[0].pause();
        }
    }
    
    // ====================
    // МЕНЮ ТА НАЛАШТУВАННЯ
    // ====================
    
    function showMainMenu() {
        $mainMenu.show();
        $gameScreen.hide();
        $gameOver.hide();
        
        gameState.gameRunning = false;
        // Зберігаємо максимальну складність
        gameState.maxDifficultyAchieved = Math.max(gameState.maxDifficultyAchieved, gameState.bot.difficulty);
        $backgroundMusic[0].pause();
    }
    
    // ====================
    // ФУНКЦІЇ ГРИ
    // ====================
    
    function startGame() {
        $mainMenu.hide();
        $gameScreen.show();
        
        // При старті нової гри бот починає з базової складності
        // Але зберігає максимальну досягнуту складність
        gameState.bot.difficulty = 1.0;
        gameState.bot.currentErrorRange = gameState.bot.baseErrorRange;
        gameState.bot.currentReactionSpeed = gameState.bot.baseReactionSpeed;
        gameState.bot.predictionAccuracy = 0.3;
        gameState.bot.adaptiveLearning = 0;
        gameState.bot.speedMultiplier = 1.0;
        
        gameState.player.score = 0;
        gameState.bot.score = 0;
        gameState.ball.hits = 0;
        
        startRound();
        gameState.gameRunning = true;
        gameState.gameActive = true;
        
        updateScores();
        updateUI();
        
        // Включаємо музику
        if (gameState.soundEnabled) {
            $backgroundMusic[0].play().catch(e => console.log("Audio play error:", e));
        }
        
        gameLoop();
    }
    
    function restartGame() {
        $gameOver.hide();
        
        // При перезапуску бот зберігає свою поточну складність
        // (не скидується до 1.0)
        gameState.player.score = 0;
        gameState.bot.score = 0;
        gameState.ball.hits = 0;
        
        startRound();
        gameState.gameActive = true;
        gameState.gameRunning = true;
    }
    
    function resetGameState() {
        // Зберігаємо максимальні значення
        gameState.maxDifficultyAchieved = Math.max(gameState.maxDifficultyAchieved, gameState.bot.difficulty);
        gameState.totalHitsCount += gameState.ball.hits;
        
        // Скидаємо позиції
        gameState.player.x = 300;
        gameState.player.score = 0;
        
        gameState.bot.x = 300;
        gameState.bot.score = 0;
        gameState.bot.targetX = 300;
        gameState.bot.lastUpdate = 0;
        
        // Бот починає з базової складності при повному скиданні (вихід в меню)
        gameState.bot.difficulty = 1.0;
        gameState.bot.currentErrorRange = gameState.bot.baseErrorRange;
        gameState.bot.currentReactionSpeed = gameState.bot.baseReactionSpeed;
        gameState.bot.predictionAccuracy = 0.3;
        gameState.bot.adaptiveLearning = 0;
        gameState.bot.speedMultiplier = 1.0;
        
        gameState.ball.x = 350;
        gameState.ball.y = 400;
        gameState.ball.dx = 0;
        gameState.ball.dy = 0;
        gameState.ball.currentSpeed = MIN_BALL_SPEED;
        gameState.ball.hits = 0;
        
        // Скидаємо клавіші
        gameState.keys = {};
    }
    
    function startRound() {
        gameState.ball.x = 350;
        gameState.ball.y = 400;
        gameState.ball.currentSpeed = MIN_BALL_SPEED;
        
        gameState.ball.dx = 0;
        gameState.ball.dy = 0;
        
        // Затримка перед початком раунду
        setTimeout(() => {
            if (gameState.gameActive) {
                // Випадковий кут запуску
                const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
                const direction = Math.random() > 0.5 ? 1 : -1;
                
                gameState.ball.currentSpeed = MIN_BALL_SPEED;
                gameState.ball.dx = MIN_BALL_SPEED * Math.sin(angle) * (Math.random() > 0.5 ? 1 : -1);
                gameState.ball.dy = MIN_BALL_SPEED * Math.cos(angle) * direction;
            }
        }, 1000);
    }
    
    function increaseBallSpeed() {
        // Збільшуємо швидкість м'яча
        if (gameState.ball.currentSpeed < MAX_BALL_SPEED) {
            gameState.ball.currentSpeed += SPEED_INCREMENT;
            gameState.ball.currentSpeed = Math.min(gameState.ball.currentSpeed, MAX_BALL_SPEED);
        }
        
        gameState.ball.hits++;
        gameState.totalHitsCount++;
        
        // Корекція вектору швидкості
        const currentMagnitude = Math.sqrt(
            gameState.ball.dx * gameState.ball.dx + 
            gameState.ball.dy * gameState.ball.dy
        );
        
        if (currentMagnitude > 0) {
            const ratio = gameState.ball.currentSpeed / currentMagnitude;
            gameState.ball.dx *= ratio;
            gameState.ball.dy *= ratio;
        }
        
        // Покращуємо бота
        improveBot();
        
        playSound($hitSound);
        updateUI();
    }
    
    function improveBot() {
        // Бот прогресує з кожним ударом
        const improvement = BOT_PROGRESS_RATE * (1 + Math.sqrt(gameState.ball.hits));
        
        // Збільшуємо складність
        gameState.bot.difficulty = Math.min(MAX_DIFFICULTY, 1.0 + improvement);
        
        // Покращуємо характеристики бо
        gameState.bot.currentErrorRange = Math.max(3, gameState.bot.baseErrorRange - improvement * 8);
        gameState.bot.currentReactionSpeed = Math.max(20, gameState.bot.baseReactionSpeed - improvement * 35);
        gameState.bot.predictionAccuracy = Math.min(0.98, 0.3 + improvement * 0.15);
        gameState.bot.speedMultiplier = Math.min(3.0, 1.0 + improvement * 0.4);
        
        // Адаптивне навчання: бот запам'ятовує стиль гри
        if (gameState.ball.hits % 10 === 0) {
            gameState.bot.adaptiveLearning += 0.1;
        }
        
        // Оновлюємо максимальну складність
        gameState.maxDifficultyAchieved = Math.max(gameState.maxDifficultyAchieved, gameState.bot.difficulty);
    }
    
    function updateScores() {
        // Обмежуємо рахунок до 999
        $playerScore.text(Math.min(gameState.player.score, 999));
        $botScore.text(Math.min(gameState.bot.score, 999));
        
        playSound($scoreSound);
    }
    
    function updateUI() {
        $difficultyLevel.text(gameState.bot.difficulty.toFixed(1) + 'x');
        $hitsCount.text(gameState.ball.hits);
        $maxDifficulty.text(gameState.maxDifficultyAchieved.toFixed(1) + 'x');
        $totalHits.text(gameState.totalHitsCount + gameState.ball.hits);
    }
    
    // ====================
    // УПРАВЛІННЯ КЛАВІАТУРОЮ
    // ====================
    
    function handleKeyDown(e) {
        if (!gameState.gameActive) return;
        
        const key = e.key.toLowerCase();
        
        // Керування стрілками або A/D
        if (key === 'arrowleft' || key === 'a') gameState.keys.left = true;
        if (key === 'arrowright' || key === 'd') gameState.keys.right = true;
    }
    
    function handleKeyUp(e) {
        const key = e.key.toLowerCase();
        
        if (key === 'arrowleft' || key === 'a') gameState.keys.left = false;
        if (key === 'arrowright' || key === 'd') gameState.keys.right = false;
    }
    
    // ====================
    // ЛОГІКА БОТА
    // ====================
    
    function updateBot() {
        const now = Date.now();
        
        if (now - gameState.bot.lastUpdate > gameState.bot.currentReactionSpeed) {
            // Розрахунок часу до м'яча
            const distanceToPaddle = Math.abs(gameState.bot.y + PADDLE_HEIGHT - gameState.ball.y);
            const verticalSpeed = Math.abs(gameState.ball.dy);
            
            if (verticalSpeed > 0 && gameState.ball.dy < 0) { // М'яч рухається до бо
                const timeToReach = distanceToPaddle / verticalSpeed;
                
                // Прогнозування з урахуванням точності
                const basePrediction = gameState.ball.x + gameState.ball.dx * timeToReach;
                
                // Адаптивна корекція на основі стилю гравця
                const playerCenter = gameState.player.x + PADDLE_WIDTH / 2;
                const playerBias = (playerCenter - 350) / 350 * gameState.bot.adaptiveLearning;
                
                // Фінальне прогнозування
                let predictedX = basePrediction * gameState.bot.predictionAccuracy + 
                               gameState.ball.x * (1 - gameState.bot.predictionAccuracy);
                
                predictedX += playerBias * 50;
                
                // Додаємо похибку (зменшується зі складністю)
                const error = (Math.random() * 2 - 1) * gameState.bot.currentErrorRange;
                predictedX += error;
                
                // Ціль - центр платформи бо на прогнозованій позиції
                gameState.bot.targetX = predictedX - PADDLE_WIDTH / 2;
            } else {
                // Якщо м'яч рухається від бо, слідуємо за м'ячем
                gameState.bot.targetX = gameState.ball.x - PADDLE_WIDTH / 2;
            }
            
            gameState.bot.lastUpdate = now;
        }
        
        // Плавний рух до цілі з урахуванням складності та швидкісного множника
        const diff = gameState.bot.targetX - gameState.bot.x;
        const speed = 0.07 * gameState.bot.difficulty * gameState.bot.speedMultiplier;
        gameState.bot.x += diff * speed;
        
        // Обмежуємо межі
        gameState.bot.x = Math.max(0, Math.min(700 - PADDLE_WIDTH, gameState.bot.x));
    }
    
    // ====================
    // МАЛЮВАННЯ
    // ====================
    
    function drawPaddle(x, y, color) {
        // Малюємо платформу з градієнтом
        const gradient = ctx.createLinearGradient(x, y, x, y + PADDLE_HEIGHT);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, darkenColor(color, 30));
        
        ctx.fillStyle = gradient;
        const radius = PADDLE_HEIGHT / 2;
        
        // Закруглені кути
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + PADDLE_WIDTH - radius, y);
        ctx.quadraticCurveTo(x + PADDLE_WIDTH, y, x + PADDLE_WIDTH, y + radius);
        ctx.lineTo(x + PADDLE_WIDTH, y + PADDLE_HEIGHT - radius);
        ctx.quadraticCurveTo(x + PADDLE_WIDTH, y + PADDLE_HEIGHT, x + PADDLE_WIDTH - radius, y + PADDLE_HEIGHT);
        ctx.lineTo(x + radius, y + PADDLE_HEIGHT);
        ctx.quadraticCurveTo(x, y + PADDLE_HEIGHT, x, y + PADDLE_HEIGHT - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        
        // Обводка
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    function darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return "#" + (
            0x1000000 +
            (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
            (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
            (B < 255 ? (B < 1 ? 0 : B) : 255)
        ).toString(16).slice(1);
    }
    
    function drawBall() {
        // Білий м'яч з градієнтом
        const gradient = ctx.createRadialGradient(
            gameState.ball.x, gameState.ball.y, 0,
            gameState.ball.x, gameState.ball.y, BALL_SIZE
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#f0f0f0');
        gradient.addColorStop(1, '#dddddd');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(gameState.ball.x, gameState.ball.y, BALL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        // Блиск (менш помітний для білого м'яча)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(gameState.ball.x - BALL_SIZE/3, gameState.ball.y - BALL_SIZE/3, BALL_SIZE/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Тінь
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(gameState.ball.x + 2, gameState.ball.y + 2, BALL_SIZE, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawNet() {
        // Сітка посередині поля
        ctx.setLineDash([5, 15]);
        ctx.beginPath();
        ctx.moveTo(0, 400);
        ctx.lineTo(700, 400);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    function drawField() {
        // Фон поля
        const gradient = ctx.createLinearGradient(0, 0, 0, 800);
        gradient.addColorStop(0, '#0a1929');
        gradient.addColorStop(1, '#152238');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 700, 800);
        
        // Зони голів (дуже прозорі)
        ctx.fillStyle = 'rgba(255, 65, 108, 0.05)';
        ctx.fillRect(0, 0, 700, 30);
        
        ctx.fillStyle = 'rgba(0, 180, 219, 0.05)';
        ctx.fillRect(0, 770, 700, 30);
        
        // Бічні стіни
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, 0, 5, 800);
        ctx.fillRect(695, 0, 5, 800);
    }
    
    function draw() {
        // Очищення
        ctx.clearRect(0, 0, 700, 800);
        
        // Малюємо всі елементи
        drawField();
        drawNet();
        drawPaddle(gameState.player.x, gameState.player.y, gameState.player.color);
        drawPaddle(gameState.bot.x, gameState.bot.y, gameState.bot.color);
        drawBall();
    }
    
    // ====================
    // ЛОГІКА ГРИ
    // ====================
    
    function checkCollision(paddle) {
        const ballLeft = gameState.ball.x - BALL_SIZE;
        const ballRight = gameState.ball.x + BALL_SIZE;
        const ballTop = gameState.ball.y - BALL_SIZE;
        const ballBottom = gameState.ball.y + BALL_SIZE;
        
        const paddleLeft = paddle.x;
        const paddleRight = paddle.x + PADDLE_WIDTH;
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + PADDLE_HEIGHT;
        
        if (ballRight > paddleLeft && 
            ballLeft < paddleRight && 
            ballBottom > paddleTop && 
            ballTop < paddleBottom) {
            
            // Точка удару (від -1 до 1)
            const hitPoint = (gameState.ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
            
            // Кут відбиття залежить від точки удару
            const maxAngle = Math.PI / 2.5; // Максимальний кут 72 градуси
            const angle = hitPoint * maxAngle;
            
            // Напрямок вертикального руху
            const verticalDirection = paddle === gameState.player ? -1 : 1;
            
            // Новий вектор швидкості
            gameState.ball.dx = Math.sin(angle) * gameState.ball.currentSpeed;
            gameState.ball.dy = Math.cos(angle) * gameState.ball.currentSpeed * verticalDirection;
            
            // Корекція позиції м'яча
            if (paddle === gameState.player) {
                gameState.ball.y = paddle.y - BALL_SIZE - 1;
            } else {
                gameState.ball.y = paddle.y + PADDLE_HEIGHT + BALL_SIZE + 1;
            }
            
            return true;
        }
        
        return false;
    }
    
    function update() {
        if (!gameState.gameActive) return;
        
        // Рух гравця
        if (gameState.keys.left) {
            gameState.player.x = Math.max(0, gameState.player.x - PADDLE_SPEED);
        }
        if (gameState.keys.right) {
            gameState.player.x = Math.min(700 - PADDLE_WIDTH, gameState.player.x + PADDLE_SPEED);
        }
        
        // Рух бо
        updateBot();
        
        // Рух м'яча
        const nextX = gameState.ball.x + gameState.ball.dx;
        const nextY = gameState.ball.y + gameState.ball.dy;
        
        // Колізія з бічними стінами
        if (nextX - BALL_SIZE <= 0 || nextX + BALL_SIZE >= 700) {
            gameState.ball.dx = -gameState.ball.dx;
            playSound($hitSound);
        } else {
            gameState.ball.x = nextX;
        }
        
        // Голи
        if (nextY - BALL_SIZE <= 0) {
            // М'яч у верхній зоні - гол гравцю
            gameState.player.score++;
            updateScores();
            startRound();
            return;
        }
        
        if (nextY + BALL_SIZE >= 800) {
            // М'яч у нижній зоні - гол боту
            gameState.bot.score++;
            updateScores();
            startRound();
            return;
        }
        
        gameState.ball.y = nextY;
        
        // Перевірка колізії з платформами
        if (checkCollision(gameState.player) || checkCollision(gameState.bot)) {
            increaseBallSpeed();
        }
    }
    
    function gameLoop() {
        update();
        draw();
        
        if (gameState.gameRunning) {
            requestAnimationFrame(gameLoop);
        }
    }
    
    // Запускаємо гру
    init();
});