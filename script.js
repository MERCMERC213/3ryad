// Система аналитики
const Analytics = {
    init() {
        this.stats = JSON.parse(localStorage.getItem('gameAnalytics')) || {
            totalSessions: 0,
            totalPlaytime: 0, // в минутах
            sessions: [],
            dailyStats: {}
        };
    },

    startSession() {
        this.sessionStart = Date.now();
        this.currentSession = {
            start: this.sessionStart,
            end: null,
            duration: 0
        };
    },

    endSession() {
        if (!this.sessionStart) return;
        
        const now = Date.now();
        const duration = Math.round((now - this.sessionStart) / 60000); // в минутах
        
        this.currentSession.end = now;
        this.currentSession.duration = duration;
        
        // Обновляем общую статистику
        this.stats.totalSessions++;
        this.stats.totalPlaytime += duration;
        
        // Обновляем статистику за сегодня
        const today = new Date().toLocaleDateString();
        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = {
                sessions: 0,
                playtime: 0
            };
        }
        
        this.stats.dailyStats[today].sessions++;
        this.stats.dailyStats[today].playtime += duration;
        
        // Сохраняем сессию
        this.stats.sessions.push(this.currentSession);
        
        // Сохраняем в localStorage
        localStorage.setItem('gameAnalytics', JSON.stringify(this.stats));
        
        this.sessionStart = null;
    },

    getTodayStats() {
        const today = new Date().toLocaleDateString();
        const todayData = this.stats.dailyStats[today];
        
        if (!todayData) {
            return "Сегодня игр не было";
        }
        
        return `${todayData.sessions} игр, ${todayData.playtime} мин`;
    },

    getAveragePlaytime() {
        if (this.stats.totalSessions === 0) return 0;
        return Math.round(this.stats.totalPlaytime / this.stats.totalSessions);
    },

    getLastSessionDate() {
        if (this.stats.sessions.length === 0) return "Никогда";
        
        const lastSession = this.stats.sessions[this.stats.sessions.length - 1];
        const date = new Date(lastSession.end);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
};

// Игровые константы
const BOARD_SIZE = 6;
const CANDY_TYPES = 6;
const LEVEL_TARGET_MULTIPLIER = 1.5;

// Специальные конфеты
const SPECIAL_CANDIES = {
    BOMB: 50,
    ARROW_UP: 51,
    ARROW_RIGHT: 52,
    ARROW_DOWN: 53,
    ARROW_LEFT: 54
};

// Препятствия
const OBSTACLES = {
    ICE: 100,
    WEB: 102,
    ICE_BLOCK: 103,
    WOODEN_CRATE: 104,
    THORNS: 105,
    LOCK: 106,
    CHEST: 107
};

// Состояние игры
let gameState = {
    board: [],
    score: 0,
    level: 1,
    target: 0,
    selectedCandy: null,
    isSwapping: false,
    isProcessing: false,
    bestScore: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    obstacles: [],
    tutorialShown: false,
    fallFrom: {},
    isPaused: false
};

// Очередь активации спецконфет
let activationQueue = [];

// Элементы DOM
const gameBoard = document.getElementById('gameBoard');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const targetElement = document.getElementById('target');
const levelProgress = document.getElementById('levelProgress');
const levelCompleteModal = document.getElementById('levelCompleteModal');
const completedLevelElement = document.getElementById('completedLevel');
const levelScoreElement = document.getElementById('levelScore');
const continueBtn = document.getElementById('continueBtn');
const newGameBtn = document.getElementById('newGameBtn');
const levelUpElement = document.getElementById('levelUp');
const bestScoreElement = document.getElementById('bestScore');
const tutorialModal = document.getElementById('tutorialModal');
const tutorialBtn = document.getElementById('tutorialBtn');
const pauseModal = document.getElementById('pauseModal');
const resumeBtn = document.getElementById('resumeBtn');
const analyticsBtn = document.getElementById('analyticsBtn');
const analyticsModal = document.getElementById('analyticsModal');
const todayStatsElement = document.getElementById('todayStats');
const totalGamesElement = document.getElementById('totalGames');
const totalPlaytimeElement = document.getElementById('totalPlaytime');
const avgPlaytimeElement = document.getElementById('avgPlaytime');
const lastSessionElement = document.getElementById('lastSession');
const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');

// Инициализация игры
function initGame() {
    // Инициализация аналитики
    Analytics.init();
    Analytics.startSession();
    
    loadGameState();
    startGame();
    
    // Настройка обработчиков событий
    continueBtn.addEventListener('click', () => {
        levelCompleteModal.classList.add('hidden');
        goToNextLevel();
    });
    
    tutorialBtn.addEventListener('click', () => {
        tutorialModal.classList.add('hidden');
        gameState.tutorialShown = true;
        saveGameState();
    });
    
    newGameBtn.addEventListener('click', () => {
        if (confirm('Начать новую игру? Текущий прогресс будет потерян.')) {
            resetGame();
            startGame();
        }
    });
    
    resumeBtn.addEventListener('click', () => {
        pauseModal.classList.add('hidden');
        gameState.isPaused = false;
    });
    
    // Обработчики аналитики
    analyticsBtn.addEventListener('click', showAnalytics);
    closeAnalyticsBtn.addEventListener('click', () => {
        analyticsModal.classList.add('hidden');
    });
    
    // Добавляем обработчики свайпов
    gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Обработчик паузы при сворачивании окна
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // Сохраняем сессию при скрытии приложения
            Analytics.endSession();
            
            if (!gameState.isProcessing && !gameState.isPaused) {
                gameState.isPaused = true;
                pauseModal.classList.remove('hidden');
            }
        } else {
            // Начинаем новую сессию при возвращении
            Analytics.startSession();
        }
    });
    
    // Сохранение сессии при закрытии
    window.addEventListener('beforeunload', () => {
        Analytics.endSession();
    });
}

// Показать аналитику
function showAnalytics() {
    Analytics.init();
    
    todayStatsElement.textContent = Analytics.getTodayStats();
    totalGamesElement.textContent = Analytics.stats.totalSessions;
    totalPlaytimeElement.textContent = `${Analytics.stats.totalPlaytime} мин`;
    avgPlaytimeElement.textContent = `${Analytics.getAveragePlaytime()} мин`;
    lastSessionElement.textContent = Analytics.getLastSessionDate();
    
    analyticsModal.classList.remove('hidden');
}

// Обработка начала касания
function handleTouchStart(e) {
    if (gameState.isProcessing || gameState.isPaused) return;
    
    const touch = e.touches[0];
    gameState.touchStartX = touch.clientX;
    gameState.touchStartY = touch.clientY;
    gameState.touchStartTime = Date.now();
    
    const cell = touch.target.closest('.cell');
    if (cell) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Выбираем конфету
        if (!gameState.selectedCandy) {
            selectCandy(row, col);
        }
    }
    
    // Предотвращаем прокрутку страницы при касании игрового поля
    e.preventDefault();
}

// Обработка окончания касания
function handleTouchEnd(e) {
    if (gameState.isProcessing || !gameState.selectedCandy || gameState.isPaused) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const dx = endX - gameState.touchStartX;
    const dy = endY - gameState.touchStartY;
    const dt = endTime - gameState.touchStartTime;
    
    // Определяем направление свайпа
    if (dt > 500 || (Math.abs(dx) < 20 && Math.abs(dy) < 20)) return;
    
    const [startRow, startCol] = gameState.selectedCandy;
    let targetRow = startRow;
    let targetCol = startCol;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Горизонтальный свайп
        if (dx > 30) targetCol++; // Вправо
        else if (dx < -30) targetCol--; // Влево
    } else {
        // Вертикальный свайп
        if (dy > 30) targetRow++; // Вниз
        else if (dy < -30) targetRow--; // Вверх
    }
    
    // Проверяем, что целевая ячейка в пределах доски
    if (targetRow >= 0 && targetRow < BOARD_SIZE && targetCol >= 0 && targetCol < BOARD_SIZE) {
        selectCandy(targetRow, targetCol);
    }
    
    e.preventDefault();
}

// Загрузка состояния игры из localStorage
function loadGameState() {
    const savedGame = localStorage.getItem('match3Game');
    if (savedGame) {
        try {
            const parsedGame = JSON.parse(savedGame);
            
            // Проверяем, что сохраненная игра имеет все необходимые поля
            if (parsedGame.board && parsedGame.score !== undefined && 
                parsedGame.level !== undefined) {
                gameState = parsedGame;
                
                // Гарантируем, что obstacles - массив
                if (!Array.isArray(gameState.obstacles)) {
                    gameState.obstacles = [];
                }
                
                // Обновляем лучший результат
                if (gameState.score > gameState.bestScore) {
                    gameState.bestScore = gameState.score;
                }
                
                // Сбрасываем временные флаги
                gameState.isProcessing = false;
                gameState.isSwapping = false;
                gameState.selectedCandy = null;
                gameState.isPaused = false;
            }
        } catch (e) {
            console.error('Ошибка загрузки состояния игры:', e);
            resetGame();
        }
    }
    
    // Скрываем модальные окна при загрузке
    levelCompleteModal.classList.add('hidden');
    tutorialModal.classList.add('hidden');
    pauseModal.classList.add('hidden');
    analyticsModal.classList.add('hidden');
}

// Сохранение состояния игры в localStorage
function saveGameState() {
    // Обновляем лучший результат
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        bestScoreElement.textContent = gameState.bestScore;
    }
    
    localStorage.setItem('match3Game', JSON.stringify(gameState));
}

// Начало игры
function startGame() {
    // Если игра только начинается или нет сохраненного состояния
    if (gameState.level === 0 || gameState.board.length === 0) {
        resetGame();
    }
    
    // Гарантируем, что obstacles - массив
    if (!Array.isArray(gameState.obstacles)) {
        gameState.obstacles = [];
    }
    
    // Показываем обучение для препятствий на уровне 2, если еще не показывали
    if (gameState.level >= 2 && !gameState.tutorialShown) {
        tutorialModal.classList.remove('hidden');
    }
    
    updateUI();
    renderBoard();
}

// Сброс игры
function resetGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.target = Math.floor(1000 * Math.pow(LEVEL_TARGET_MULTIPLIER, gameState.level - 1));
    gameState.selectedCandy = null;
    gameState.isSwapping = false;
    gameState.isProcessing = false;
    gameState.obstacles = [];
    gameState.tutorialShown = false;
    gameState.fallFrom = {};
    gameState.isPaused = false;
    
    generateBoard();
    updateUI();
}

// Генерация игрового поля
function generateBoard() {
    let validBoard = false;
    let attempts = 0;
    const maxAttempts = 50;
    
    // Инициализация массива
    gameState.board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        gameState.board[i] = new Array(BOARD_SIZE).fill(0);
    }
    
    while (!validBoard && attempts < maxAttempts) {
        attempts++;
        
        // Заполняем поле конфетами
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // Пропускаем ячейки с препятствиями
                if (gameState.board[row][col] > 0) continue;
                
                let candyType;
                let validCandy = false;
                let candyAttempts = 0;
                const maxCandyAttempts = 10;
                
                // Генерируем конфету, избегая совпадений
                do {
                    candyType = Math.floor(Math.random() * CANDY_TYPES) + 1;
                    candyAttempts++;
                    
                    // Проверка вертикальных совпадений
                    let hasVerticalMatch = false;
                    if (row >= 2) {
                        hasVerticalMatch = (
                            gameState.board[row-1][col] === candyType && 
                            gameState.board[row-2][col] === candyType
                        );
                    }
                    
                    // Проверка горизонтальных совпадений
                    let hasHorizontalMatch = false;
                    if (col >= 2) {
                        hasHorizontalMatch = (
                            gameState.board[row][col-1] === candyType && 
                            gameState.board[row][col-2] === candyType
                        );
                    }
                    
                    validCandy = !hasVerticalMatch && !hasHorizontalMatch;
                    
                } while (!validCandy && candyAttempts < maxCandyAttempts);
                
                gameState.board[row][col] = candyType;
            }
        }
        
        // Добавляем препятствия в зависимости от уровня
        addObstacles();
        
        // Проверяем наличие ходов
        validBoard = hasMoves();
    }
    
    if (!validBoard) {
        console.log("Не удалось создать валидное поле после " + maxAttempts + " попыток. Перестраиваем...");
        // Если не удалось - генерируем простое поле без проверки
        generateSimpleBoard();
    }
}

// Генерация простого поля без проверки совпадений
function generateSimpleBoard() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            gameState.board[row][col] = Math.floor(Math.random() * CANDY_TYPES) + 1;
        }
    }
    
    // Добавляем препятствия
    addObstacles();
}

// Добавление препятствий
function addObstacles() {
    // Очищаем предыдущие препятствия
    gameState.obstacles = [];
    
    // Добавляем препятствия в зависимости от уровня
    if (gameState.level >= 2) {
        // Лед
        const iceCount = Math.min(2 + gameState.level, 8);
        for (let i = 0; i < iceCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            // Не добавляем на уже занятые клетки
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.ICE, row, col});
            }
        }
        
        // Паутина
        const webCount = Math.min(1 + gameState.level, 5);
        for (let i = 0; i < webCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.WEB, row, col});
            }
        }
    }
    
    if (gameState.level >= 3) {
        // Ледяные блоки
        const iceBlockCount = Math.min(1 + gameState.level, 4);
        for (let i = 0; i < iceBlockCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.ICE_BLOCK, row, col});
            }
        }
        
        // Ящики
        const crateCount = Math.min(1 + gameState.level, 5);
        for (let i = 0; i < crateCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.WOODEN_CRATE, row, col});
            }
        }
    }
    
    if (gameState.level >= 4) {
        // Шипы
        const thornsCount = Math.min(1 + Math.floor(gameState.level/2), 4);
        for (let i = 0; i < thornsCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.THORNS, row, col});
            }
        }
    }
    
    if (gameState.level >= 5) {
        // Замки
        const lockCount = Math.min(1 + Math.floor(gameState.level/3), 3);
        for (let i = 0; i < lockCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.LOCK, row, col});
            }
        }
    }
    
    if (gameState.level >= 6) {
        // Сундуки
        const chestCount = Math.min(Math.floor(gameState.level/3), 3);
        for (let i = 0; i < chestCount; i++) {
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);
            
            if (!getObstacleAt(row, col)) {
                gameState.obstacles.push({type: OBSTACLES.CHEST, row, col});
            }
        }
    }
}

// Проверка наличия препятствия в ячейке
function getObstacleAt(row, col) {
    if (!gameState.obstacles) return null;
    return gameState.obstacles.find(obs => obs.row === row && obs.col === col) || null;
}

// Удаление препятствия
function removeObstacle(row, col) {
    if (!gameState.obstacles) return false;
    const index = gameState.obstacles.findIndex(obs => obs.row === row && obs.col === col);
    if (index !== -1) {
        gameState.obstacles.splice(index, 1);
        return true;
    }
    return false;
}

// Отрисовка игрового поля с препятствиями
function renderBoard() {
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const candyValue = gameState.board[row][col];
            
            // Добавляем конфету (если есть)
            if (candyValue > 0) {
                const candy = document.createElement('img');
                candy.className = 'candy';
                
                // Проверяем, является ли конфета специальной
                if (candyValue >= 50) {
                    candy.classList.add('special');
                    switch(candyValue) {
                        case SPECIAL_CANDIES.BOMB:
                            candy.src = 'bomb.png';
                            candy.alt = 'Бомбочка';
                            break;
                        case SPECIAL_CANDIES.ARROW_UP:
                            candy.src = 'arrow_up.png';
                            candy.alt = 'Стрелка вверх';
                            break;
                        case SPECIAL_CANDIES.ARROW_RIGHT:
                            candy.src = 'arrow_right.png';
                            candy.alt = 'Стрелка вправо';
                            break;
                        case SPECIAL_CANDIES.ARROW_DOWN:
                            candy.src = 'arrow_down.png';
                            candy.alt = 'Стрелка вниз';
                            break;
                        case SPECIAL_CANDIES.ARROW_LEFT:
                            candy.src = 'arrow_left.png';
                            candy.alt = 'Стрелка влево';
                            break;
                        default:
                            candy.src = `candy${candyValue}.png`;
                            candy.alt = `Конфета ${candyValue}`;
                    }
                } else {
                    candy.src = `candy${candyValue}.png`;
                    candy.alt = `Конфета ${candyValue}`;
                }
                
                cell.appendChild(candy);
            }
            
            // Добавляем препятствия
            const obstacle = getObstacleAt(row, col);
            if (obstacle) {
                if (obstacle.type === OBSTACLES.ICE) {
                    const iceOverlay = document.createElement('div');
                    iceOverlay.className = 'ice-overlay';
                    cell.appendChild(iceOverlay);
                } else if (obstacle.type === OBSTACLES.WEB) {
                    const webOverlay = document.createElement('div');
                    webOverlay.className = 'web-overlay';
                    cell.appendChild(webOverlay);
                } else if (obstacle.type === OBSTACLES.ICE_BLOCK) {
                    const iceBlock = document.createElement('div');
                    iceBlock.className = 'ice-block';
                    cell.appendChild(iceBlock);
                } else if (obstacle.type === OBSTACLES.WOODEN_CRATE) {
                    const crate = document.createElement('div');
                    crate.className = 'wooden-crate';
                    cell.appendChild(crate);
                } else if (obstacle.type === OBSTACLES.THORNS) {
                    const thorns = document.createElement('div');
                    thorns.className = 'thorns';
                    cell.appendChild(thorns);
                } else if (obstacle.type === OBSTACLES.LOCK) {
                    const lock = document.createElement('div');
                    lock.className = 'lock';
                    cell.appendChild(lock);
                } else if (obstacle.type === OBSTACLES.CHEST) {
                    const chest = document.createElement('div');
                    chest.className = 'chest';
                    cell.appendChild(chest);
                }
            }
            
            cell.addEventListener('click', () => {
                if (!gameState.isPaused) selectCandy(row, col);
            });
            gameBoard.appendChild(cell);
        }
    }
}

// Обновление конкретной ячейки
function updateCell(row, col) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    cell.innerHTML = '';
    
    const candyValue = gameState.board[row][col];
    
    // Добавляем конфету (если есть)
    if (candyValue > 0) {
        const candy = document.createElement('img');
        candy.className = 'candy';
        
        // Проверяем, является ли конфета специальной
        if (candyValue >= 50) {
            candy.classList.add('special');
            switch(candyValue) {
                case SPECIAL_CANDIES.BOMB:
                    candy.src = 'bomb.png';
                    candy.alt = 'Бомбочка';
                    break;
                case SPECIAL_CANDIES.ARROW_UP:
                    candy.src = 'arrow_up.png';
                    candy.alt = 'Стрелка вверх';
                    break;
                case SPECIAL_CANDIES.ARROW_RIGHT:
                    candy.src = 'arrow_right.png';
                    candy.alt = 'Стрелка вправо';
                    break;
                case SPECIAL_CANDIES.ARROW_DOWN:
                    candy.src = 'arrow_down.png';
                    candy.alt = 'Стрелка вниз';
                    break;
                case SPECIAL_CANDIES.ARROW_LEFT:
                    candy.src = 'arrow_left.png';
                    candy.alt = 'Стрелка влево';
                    break;
                default:
                    candy.src = `candy${candyValue}.png`;
                    candy.alt = `Конфета ${candyValue}`;
            }
        } else {
            candy.src = `candy${candyValue}.png`;
            candy.alt = `Конфета ${candyValue}`;
        }
        
        // Анимация падения
        if (gameState.fallFrom[`${row},${col}`]) {
            const [fromRow] = gameState.fallFrom[`${row},${col}`];
            const distance = row - fromRow;
            candy.style.transform = `translateY(${-distance * 100}%)`;
            candy.classList.add('falling');
            
            setTimeout(() => {
                candy.style.transform = 'translateY(0)';
                setTimeout(() => {
                    candy.classList.remove('falling');
                }, 300);
            }, 10);
        }
        
        cell.appendChild(candy);
    }
    
    // Добавляем препятствия
    const obstacle = getObstacleAt(row, col);
    if (obstacle) {
        if (obstacle.type === OBSTACLES.ICE) {
            const iceOverlay = document.createElement('div');
            iceOverlay.className = 'ice-overlay';
            cell.appendChild(iceOverlay);
        } else if (obstacle.type === OBSTACLES.WEB) {
            const webOverlay = document.createElement('div');
            webOverlay.className = 'web-overlay';
            cell.appendChild(webOverlay);
        } else if (obstacle.type === OBSTACLES.ICE_BLOCK) {
            const iceBlock = document.createElement('div');
            iceBlock.className = 'ice-block';
            cell.appendChild(iceBlock);
        } else if (obstacle.type === OBSTACLES.WOODEN_CRATE) {
            const crate = document.createElement('div');
            crate.className = 'wooden-crate';
            cell.appendChild(crate);
        } else if (obstacle.type === OBSTACLES.THORNS) {
            const thorns = document.createElement('div');
            thorns.className = 'thorns';
            cell.appendChild(thorns);
        } else if (obstacle.type === OBSTACLES.LOCK) {
            const lock = document.createElement('div');
            lock.className = 'lock';
            cell.appendChild(lock);
        } else if (obstacle.type === OBSTACLES.CHEST) {
            const chest = document.createElement('div');
            chest.className = 'chest';
            cell.appendChild(chest);
        }
    }
    
    // Добавляем обработчик клика
    cell.addEventListener('click', () => {
        if (!gameState.isPaused) selectCandy(row, col);
    });
}

// Выбор конфеты
function selectCandy(row, col) {
    if (gameState.isProcessing || gameState.isPaused) return;
    
    // Проверяем, является ли выбранная ячейка специальной конфетой
    const candyValue = gameState.board[row][col];
    if (candyValue >= 50) {
        activateSpecial(row, col, candyValue);
        return;
    }
    
    // Проверяем, есть ли в ячейке препятствие, блокирующее перемещение
    const obstacle = getObstacleAt(row, col);
    if (obstacle && (obstacle.type === OBSTACLES.LOCK || obstacle.type === OBSTACLES.CHEST)) return;
    
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    
    // Если конфета уже выбрана
    if (gameState.selectedCandy) {
        const [prevRow, prevCol] = gameState.selectedCandy;
        const prevCell = document.querySelector(`.cell[data-row="${prevRow}"][data-col="${prevCol}"]`);
        
        // Если выбрана та же самая конфета - снимаем выделение
        if (prevRow === row && prevCol === col) {
            prevCell.classList.remove('selected');
            gameState.selectedCandy = null;
            return;
        }
        
        // Проверяем, являются ли конфеты соседями
        const isNeighbor = 
            (Math.abs(prevRow - row) === 1 && prevCol === col) || 
            (Math.abs(prevCol - col) === 1 && prevRow === row);
        
        if (isNeighbor) {
            gameState.isSwapping = true;
            
            // Снимаем выделение с предыдущей конфеты
            prevCell.classList.remove('selected');
            
            // Меняем конфеты местами
            swapCandies(prevRow, prevCol, row, col, () => {
                // Проверяем, образовались ли совпадения
                const matches = findMatches();
                
                if (matches.length > 0) {
                    // Если есть совпадения - обрабатываем их
                    processMatches(matches);
                } else {
                    // Если совпадений нет - возвращаем конфеты обратно
                    swapCandies(prevRow, prevCol, row, col, () => {
                        gameState.isSwapping = false;
                        gameState.selectedCandy = null;
                    });
                }
            });
        } else {
            // Снимаем выделение с предыдущей конфеты
            prevCell.classList.remove('selected');
            // Выделяем новую конфету
            cell.classList.add('selected');
            gameState.selectedCandy = [row, col];
        }
    } else {
        // Выделяем новую конфету
        cell.classList.add('selected');
        gameState.selectedCandy = [row, col];
    }
}

// Активация специальной конфеты
function activateSpecial(row, col, type) {
    if (gameState.isProcessing || gameState.isPaused) return;
    
    gameState.isProcessing = true;
    
    const cellsToRemove = [];
    let scoreToAdd = 0;
    
    // Добавляем саму специальную конфету
    cellsToRemove.push([row, col]);
    scoreToAdd += 50;
    
    // Определяем эффект в зависимости от типа конфеты
    switch(type) {
        case SPECIAL_CANDIES.BOMB: // Бомбочка
            // Взрываем соседние клетки
            const bombDirections = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            bombDirections.forEach(([dx, dy]) => {
                const newRow = row + dx;
                const newCol = col + dy;
                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    cellsToRemove.push([newRow, newCol]);
                    scoreToAdd += 20;
                }
            });
            break;
            
        case SPECIAL_CANDIES.ARROW_UP: // Стрелка вверх
            for (let r = row - 1; r >= 0; r--) {
                cellsToRemove.push([r, col]);
                scoreToAdd += 10;
            }
            break;
            
        case SPECIAL_CANDIES.ARROW_RIGHT: // Стрелка вправо
            for (let c = col + 1; c < BOARD_SIZE; c++) {
                cellsToRemove.push([row, c]);
                scoreToAdd += 10;
            }
            break;
            
        case SPECIAL_CANDIES.ARROW_DOWN: // Стрелка вниз
            for (let r = row + 1; r < BOARD_SIZE; r++) {
                cellsToRemove.push([r, col]);
                scoreToAdd += 10;
            }
            break;
            
        case SPECIAL_CANDIES.ARROW_LEFT: // Стрелка влево
            for (let c = col - 1; c >= 0; c--) {
                cellsToRemove.push([row, c]);
                scoreToAdd += 10;
            }
            break;
    }
    
    // Находим другие спецконфеты для каскадной активации
    const nextSpecials = [];
    
    // Удаляем конфеты и препятствия
    cellsToRemove.forEach(([r, c]) => {
        // Для спецконфет (кроме активируемой) - добавляем в очередь
        if (gameState.board[r][c] >= 50 && !(r === row && c === col)) {
            nextSpecials.push([r, c, gameState.board[r][c]]);
        } else {
            // Обычные конфеты удаляем
            gameState.board[r][c] = 0;
            removeObstacle(r, c);
        }
        updateCell(r, c);
        
        // Анимация удаления
        const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            const animation = document.createElement('div');
            animation.className = 'match-animation';
            cell.appendChild(animation);
            
            setTimeout(() => {
                animation.remove();
            }, 300);
        }
    });
    
    // Добавляем спецконфеты в очередь
    nextSpecials.forEach(([r, c, t]) => {
        activationQueue.push({row: r, col: c, type: t});
    });
    
    // Добавляем очки
    gameState.score += scoreToAdd;
    updateUI();
    
    // Обработка очереди
    if (activationQueue.length > 0) {
        setTimeout(() => {
            const next = activationQueue.shift();
            activateSpecial(next.row, next.col, next.type);
        }, 500);
    } else {
        setTimeout(() => {
            dropCandies();
        }, 300);
    }
}

// Обмен конфет местами с анимацией
function swapCandies(row1, col1, row2, col2, callback) {
    // Меняем конфеты в массиве
    const temp = gameState.board[row1][col1];
    gameState.board[row1][col1] = gameState.board[row2][col2];
    gameState.board[row2][col2] = temp;
    
    // Обновляем отображение
    updateCell(row1, col1);
    updateCell(row2, col2);
    
    // Вызываем callback после небольшой задержки для анимации
    setTimeout(callback, 200);
}

// Поиск совпадений
function findMatches() {
    const matches = [];
    const visited = new Set();
    
    // Проверка горизонтальных совпадений
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {
            const candyType = gameState.board[row][col];
            if (candyType === 0 || candyType >= 50) continue; // Пустая ячейка или спец. конфета
            
            if (candyType === gameState.board[row][col+1] && 
                candyType === gameState.board[row][col+2]) {
                
                // Проверяем, не входит ли уже эта ячейка в совпадение
                if (visited.has(`${row},${col}`)) continue;
                
                const match = [[row, col], [row, col+1], [row, col+2]];
                visited.add(`${row},${col}`);
                visited.add(`${row},${col+1}`);
                visited.add(`${row},${col+2}`);
                
                // Проверяем совпадения длиннее 3
                let nextCol = col + 3;
                while (nextCol < BOARD_SIZE && gameState.board[row][nextCol] === candyType) {
                    match.push([row, nextCol]);
                    visited.add(`${row},${nextCol}`);
                    nextCol++;
                }
                
                matches.push(match);
            }
        }
    }
    
    // Проверка вертикальных совпадений
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const candyType = gameState.board[row][col];
            if (candyType === 0 || candyType >= 50) continue; // Пустая ячейка или спец. конфета
            
            if (candyType === gameState.board[row+1][col] && 
                candyType === gameState.board[row+2][col]) {
                
                // Проверяем, не входит ли уже эта ячейка в совпадение
                if (visited.has(`${row},${col}`)) continue;
                
                const match = [[row, col], [row+1, col], [row+2, col]];
                visited.add(`${row},${col}`);
                visited.add(`${row+1},${col}`);
                visited.add(`${row+2},${col}`);
                
                // Проверяем совпадения длиннее 3
                let nextRow = row + 3;
                while (nextRow < BOARD_SIZE && gameState.board[nextRow][col] === candyType) {
                    match.push([nextRow, col]);
                    visited.add(`${nextRow},${col}`);
                    nextRow++;
                }
                
                matches.push(match);
            }
        }
    }
    
    // Поиск квадратов 2x2
    for (let row = 0; row < BOARD_SIZE - 1; row++) {
        for (let col = 0; col < BOARD_SIZE - 1; col++) {
            const candyType = gameState.board[row][col];
            if (!candyType || candyType >= 50) continue;
            
            if (candyType === gameState.board[row][col+1] &&
                candyType === gameState.board[row+1][col] &&
                candyType === gameState.board[row+1][col+1]) {
                
                const square = [
                    [row, col], [row, col+1],
                    [row+1, col], [row+1, col+1]
                ];
                
                // Проверка на пересечение с другими совпадениями
                let isNew = true;
                square.forEach(([r, c]) => {
                    if (visited.has(`${r},${c}`)) isNew = false;
                });
                
                if (isNew) {
                    matches.push(square);
                    square.forEach(([r, c]) => visited.add(`${r},${c}`));
                }
            }
        }
    }
    
    return matches;
}

function showMobileTutorial() {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    const tutorialSteps = [
      {title: "Новые препятствия!", content: "На этом уровне появляются новые виды препятствий..."},
      {content: "❄️ <strong>Лед</strong> - растает от одного совпадения рядом"},
      {content: "🕸️ <strong>Паутина</strong> - требует два совпадения рядом"},
      {content: "🧊 <strong>Ледяной блок</strong> - требует три совпадения"},
      {content: "📦 <strong>Ящик</strong> - разрушается от одного совпадения"},
      {content: "🌵 <strong>Шипы</strong> - уменьшают очки при совпадении"},
      {content: "🔒 <strong>Замок</strong> - блокирует конфету"},
      {content: "🎁 <strong>Сундук</strong> - при открытии дает спецконфету"},
      {content: "С каждым уровнем препятствий будет больше!"}
    ];

    let currentStep = 0;
    
    function showStep() {
      const step = tutorialSteps[currentStep];
      tutorialModal.innerHTML = `
        <div class="modal-content">
          ${step.title ? `<h2>${step.title}</h2>` : ''}
          <div class="tutorial">
            <p>${step.content}</p>
          </div>
          <div class="tutorial-controls">
            ${currentStep > 0 ? `<button id="prevBtn">Назад</button>` : ''}
            <button id="nextBtn">${currentStep === tutorialSteps.length - 1 ? 'Понятно!' : 'Далее'}</button>
          </div>
        </div>
      `;
      
      document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentStep < tutorialSteps.length - 1) {
          currentStep++;
          showStep();
        } else {
          tutorialModal.classList.add('hidden');
          gameState.tutorialShown = true;
          saveGameState();
        }
      });
      
      if (currentStep > 0) {
        document.getElementById('prevBtn').addEventListener('click', () => {
          currentStep--;
          showStep();
        });
      }
    }
    
    tutorialModal.classList.remove('hidden');
    showStep();
  } else {
    // Стандартное обучение для десктопа
    tutorialModal.classList.remove('hidden');
  }
}

// Обработка совпадений и препятствий
function processMatches(matches) {
    if (matches.length === 0) {
        gameState.isSwapping = false;
        gameState.selectedCandy = null;
        return;
    }
    
    gameState.isProcessing = true;
    
    // Удаляем совпавшие конфеты и добавляем очки
    let totalScore = 0;
    const matchedCells = [];
    const specialCells = [];
    
    matches.forEach(match => {
        // Добавляем очки за совпадение
        let matchScore = 10 * match.length * gameState.level;
        
        // Помечаем совпавшие конфеты для удаления
        match.forEach(([row, col]) => {
            if (!matchedCells.some(cell => cell[0] === row && cell[1] === col)) {
                matchedCells.push([row, col]);
                
                // Анимация удаления конфеты
                const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    const animation = document.createElement('div');
                    animation.className = 'match-animation';
                    cell.appendChild(animation);
                    
                    setTimeout(() => {
                        animation.remove();
                    }, 300);
                }
            }
        });
        
        // Создаем специальную конфету для совпадений из 4 и более конфет
        let specialType = null;
        if (match.length >= 4) {
            // Определяем тип специальной конфеты
            if (match.length >= 5) {
                // Для 5+ конфет создаем бомбочку
                specialType = SPECIAL_CANDIES.BOMB;
            } else {
                // Для 4 конфет создаем стрелочку
                // Определяем направление ряда
                const isHorizontal = match[0][0] === match[1][0];
                if (isHorizontal) {
                    // Горизонтальный ряд - стрелка влево или вправо
                    specialType = Math.random() < 0.5 ? SPECIAL_CANDIES.ARROW_LEFT : SPECIAL_CANDIES.ARROW_RIGHT;
                } else {
                    // Вертикальный ряд - стрелка вверх или вниз
                    specialType = Math.random() < 0.5 ? SPECIAL_CANDIES.ARROW_UP : SPECIAL_CANDIES.ARROW_DOWN;
                }
            }
            
            // Выбираем центр совпадения для создания специальной конфеты
            const centerRow = Math.floor(match.reduce((sum, [r]) => sum + r, 0) / match.length);
            const centerCol = Math.floor(match.reduce((sum, [, c]) => sum + c, 0) / match.length);
            
            specialCells.push({
                row: centerRow,
                col: centerCol,
                type: specialType
            });
            
            // Удаляем эту ячейку из списка на удаление
            const index = match.findIndex(([r, c]) => r === centerRow && c === centerCol);
            if (index !== -1) {
                match.splice(index, 1);
            }
        }
        
        totalScore += matchScore;
    });
    
    // Обработка препятствий рядом с совпадениями
    const affectedObstacles = new Set();
    
    matches.forEach(match => {
        match.forEach(([row, col]) => {
            // Проверяем соседние клетки на наличие препятствий
            const neighbors = [
                [row-1, col], [row+1, col], [row, col-1], [row, col+1]
            ];
            
            neighbors.forEach(([nRow, nCol]) => {
                if (nRow >= 0 && nRow < BOARD_SIZE && nCol >= 0 && nCol < BOARD_SIZE) {
                    const obstacle = getObstacleAt(nRow, nCol);
                    if (obstacle) {
                        affectedObstacles.add(`${nRow},${nCol}`);
                        
                        // Для паутины требуется два совпадения рядом
                        if (obstacle.type === OBSTACLES.WEB) {
                            obstacle.hits = (obstacle.hits || 0) + 1;
                            if (obstacle.hits >= 2) {
                                removeObstacle(nRow, nCol);
                            }
                        } 
                        // Для ледяного блока требуется три совпадения
                        else if (obstacle.type === OBSTACLES.ICE_BLOCK) {
                            obstacle.hits = (obstacle.hits || 0) + 1;
                            if (obstacle.hits >= 3) {
                                removeObstacle(nRow, nCol);
                            }
                        }
                        // Для ящика требуется одно совпадение рядом
                        else if (obstacle.type === OBSTACLES.WOODEN_CRATE) {
                            removeObstacle(nRow, nCol);
                        }
                        // Для шипов - уменьшаем очки
                        else if (obstacle.type === OBSTACLES.THORNS) {
                            // Штраф 10% за совпадение на клетке с шипами
                            totalScore = Math.floor(totalScore * 0.9);
                        }
                        // Для замка - снимаем замок при совпадении на этой клетке
                        else if (obstacle.type === OBSTACLES.LOCK) {
                            removeObstacle(nRow, nCol);
                        }
                        // Для сундука - открываем при двух совпадениях рядом
                        else if (obstacle.type === OBSTACLES.CHEST) {
                            obstacle.hits = (obstacle.hits || 0) + 1;
                            if (obstacle.hits >= 2) {
                                // Добавляем 100 очков
                                totalScore += 100;
                                // Удаляем препятствие
                                removeObstacle(nRow, nCol);
                                // Создаем спецконфету
                                const specialTypes = [
                                    SPECIAL_CANDIES.BOMB,
                                    SPECIAL_CANDIES.ARROW_UP,
                                    SPECIAL_CANDIES.ARROW_RIGHT,
                                    SPECIAL_CANDIES.ARROW_DOWN,
                                    SPECIAL_CANDIES.ARROW_LEFT
                                ];
                                const randomType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
                                gameState.board[nRow][nCol] = randomType;
                                // Обновляем клетку
                                updateCell(nRow, nCol);
                            }
                        }
                        // Лед растает от одного совпадения рядом
                        else if (obstacle.type === OBSTACLES.ICE) {
                            removeObstacle(nRow, nCol);
                        }
                    }
                }
            });
        });
    });
    
    // Обновляем счет
    gameState.score += totalScore;
    updateUI();
    
    // Удаляем совпавшие конфеты
    setTimeout(() => {
        matchedCells.forEach(([row, col]) => {
            gameState.board[row][col] = 0;
            updateCell(row, col);
        });
        
        // Добавляем специальные конфеты
        specialCells.forEach(({row, col, type}) => {
            gameState.board[row][col] = type;
            updateCell(row, col);
        });
        
        // Сдвигаем конфеты
        dropCandies();
    }, 300);
}

// Сдвиг конфет вниз
function dropCandies() {
    let moved = false;
    gameState.fallFrom = {};
    
    // Проходим по всем столбцам
    for (let col = 0; col < BOARD_SIZE; col++) {
        // Начинаем с нижней строки
        let emptySpaces = 0;
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            // Если ячейка пуста и нет блокирующего препятствия
            if (gameState.board[row][col] === 0 && 
                !(getObstacleAt(row, col) && 
                (getObstacleAt(row, col).type === OBSTACLES.LOCK || 
                 getObstacleAt(row, col).type === OBSTACLES.CHEST))) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                // Перемещаем конфету вниз
                const newRow = row + emptySpaces;
                gameState.board[newRow][col] = gameState.board[row][col];
                gameState.board[row][col] = 0;
                
                // Запоминаем начальную позицию для анимации
                gameState.fallFrom[`${newRow},${col}`] = [row, col];
                moved = true;
            }
        }
        
        // Заполняем верхние пустые ячейки новыми конфетами
        for (let row = 0; row < emptySpaces; row++) {
            if (!(getObstacleAt(row, col) && 
                (getObstacleAt(row, col).type === OBSTACLES.LOCK || 
                 getObstacleAt(row, col).type === OBSTACLES.CHEST))) {
                gameState.board[row][col] = Math.floor(Math.random() * CANDY_TYPES) + 1;
                // Запоминаем, что конфета падает сверху
                gameState.fallFrom[`${row},${col}`] = [row - emptySpaces, col];
                moved = true;
            }
        }
    }
    
    if (moved) {
        // Обновляем все ячейки с анимацией
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                updateCell(row, col);
            }
        }
        
        setTimeout(() => {
            // Проверяем новые совпадения
            const newMatches = findMatches();
            
            if (newMatches.length > 0) {
                processMatches(newMatches);
            } else {
                // Проверяем, достигнута ли цель уровня
                if (gameState.score >= gameState.target) {
                    showLevelCompleteModal();
                } else {
                    gameState.isProcessing = false;
                    gameState.isSwapping = false;
                    gameState.selectedCandy = null;
                    
                    // Проверяем, есть ли еще ходы
                    if (!hasMoves()) {
                        // Если ходов нет - перестраиваем поле
                        setTimeout(() => {
                            generateBoard();
                            renderBoard();
                            gameState.isProcessing = false;
                        }, 300);
                    }
                }
            }
        }, 300);
    } else {
        gameState.isProcessing = false;
        gameState.isSwapping = false;
        gameState.selectedCandy = null;
    }
}

// Показать окно завершения уровня
function showLevelCompleteModal() {
    completedLevelElement.textContent = gameState.level;
    levelScoreElement.textContent = gameState.score;
    levelCompleteModal.classList.remove('hidden');
}

// Переход на следующий уровень
function goToNextLevel() {
    // Переходим на следующий уровень
    gameState.level++;
    gameState.target = Math.floor(1000 * Math.pow(LEVEL_TARGET_MULTIPLIER, gameState.level - 1));
    
    // Сохраняем прогресс
    saveGameState();
    
    // Обновляем UI
    updateUI();
    
    // Генерируем новое поле
    generateBoard();
    renderBoard();
    
    gameState.isProcessing = false;
    gameState.isSwapping = false;
    gameState.selectedCandy = null;
    
    // Показываем обучение для препятствий на уровне 2, если еще не показывали
    if (gameState.level === 2 && !gameState.tutorialShown) {
        tutorialModal.classList.remove('hidden');
    }
}

// Обновление интерфейса
function updateUI() {
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    targetElement.textContent = gameState.target;
    
    // Обновляем прогресс уровня
    const progressPercent = Math.min(100, (gameState.score / gameState.target) * 100);
    levelProgress.style.width = `${progressPercent}%`;
    
    // Обновляем лучший результат
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
    }
    bestScoreElement.textContent = gameState.bestScore;
    
    // Сохраняем состояние игры
    saveGameState();
}

// Проверка наличия возможных ходов
function hasMoves() {
    const tempBoard = JSON.parse(JSON.stringify(gameState.board));
    
    // Проверяем все возможные обмены
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // Пробуем обмен вправо
            if (col < BOARD_SIZE - 1) {
                // Проверяем препятствия
                if (getObstacleAt(row, col) || getObstacleAt(row, col+1)) continue;
                
                // Меняем местами
                [tempBoard[row][col], tempBoard[row][col+1]] = [tempBoard[row][col+1], tempBoard[row][col]];
                
                // Проверяем, есть ли совпадения
                if (findMatchesForBoard(tempBoard).length > 0) {
                    return true;
                }
                
                // Возвращаем обратно
                [tempBoard[row][col], tempBoard[row][col+1]] = [tempBoard[row][col+1], tempBoard[row][col]];
            }
            
            // Пробуем обмен вниз
            if (row < BOARD_SIZE - 1) {
                // Проверяем препятствия
                if (getObstacleAt(row, col) || getObstacleAt(row+1, col)) continue;
                
                // Меняем местами
                [tempBoard[row][col], tempBoard[row+1][col]] = [tempBoard[row+1][col], tempBoard[row][col]];
                
                // Проверяем, есть ли совпадения
                if (findMatchesForBoard(tempBoard).length > 0) {
                    return true;
                }
                
                // Возвращаем обратно
                [tempBoard[row][col], tempBoard[row+1][col]] = [tempBoard[row+1][col], tempBoard[row][col]];
            }
        }
    }
    
    return false;
}

// Проверка совпадений для заданной доски
function findMatchesForBoard(board) {
    const matches = [];
    const visited = new Set();
    
    // Проверка горизонтальных совпадений
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {
            const candyType = board[row][col];
            if (candyType === 0 || candyType >= 50) continue; // Пустая ячейка или спец. конфета
            
            if (candyType === board[row][col+1] && 
                candyType === board[row][col+2]) {
                
                // Проверяем, не входит ли уже эта ячейка в совпадение
                if (visited.has(`${row},${col}`)) continue;
                
                const match = [[row, col], [row, col+1], [row, col+2]];
                visited.add(`${row},${col}`);
                visited.add(`${row},${col+1}`);
                visited.add(`${row},${col+2}`);
                
                // Проверяем совпадения длиннее 3
                let nextCol = col + 3;
                while (nextCol < BOARD_SIZE && board[row][nextCol] === candyType) {
                    match.push([row, nextCol]);
                    visited.add(`${row},${nextCol}`);
                    nextCol++;
                }
                
                matches.push(match);
            }
        }
    }
    
    // Проверка вертикальных совпадений
    for (let row = 0; row < BOARD_SIZE - 2; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const candyType = board[row][col];
            if (candyType === 0 || candyType >= 50) continue; // Пустая ячейка или спец. конфета
            
            if (candyType === board[row+1][col] && 
                candyType === board[row+2][col]) {
                
                // Проверяем, не входит ли уже эта ячейка в совпадение
                if (visited.has(`${row},${col}`)) continue;
                
                const match = [[row, col], [row+1, col], [row+2, col]];
                visited.add(`${row},${col}`);
                visited.add(`${row+1},${col}`);
                visited.add(`${row+2},${col}`);
                
                // Проверяем совпадения длиннее 3
                let nextRow = row + 3;
                while (nextRow < BOARD_SIZE && board[nextRow][col] === candyType) {
                    match.push([nextRow, col]);
                    visited.add(`${nextRow},${col}`);
                    nextRow++;
                }
                
                matches.push(match);
            }
        }
    }
    
    return matches;
}

// Запуск игры при загрузке страницы
window.addEventListener('DOMContentLoaded', initGame);