// Основной файл, управляющий игрой
import { Game } from './modules/game-core.js';
import { initTheme, toggleTheme } from './modules/theme-manager.js';
import { showStats, updateStatsDisplay } from './modules/stats-manager.js';
import { initHintSystem, useHint } from './modules/hint-system.js';

// Элементы интерфейса
const mainMenu = document.getElementById('main-menu');
const gameScreen = document.getElementById('game-screen');
const rulesScreen = document.getElementById('rules-screen');
const statsScreen = document.getElementById('stats-screen');
const startButton = document.getElementById('start-game');
const rulesButton = document.getElementById('rules-btn');
const statsButton = document.getElementById('stats-btn');
const backFromRules = document.getElementById('back-from-rules');
const backFromStats = document.getElementById('back-from-stats');
const menuButton = document.getElementById('menu-btn');
const themeToggle = document.getElementById('theme-toggle');
const hintButton = document.getElementById('hint-btn');
const levelDisplay = document.getElementById('level');
const scoreDisplay = document.getElementById('score');
const movesDisplay = document.getElementById('moves');

// Инициализация темы
initTheme();

// Создание экземпляра игры
const game = new Game({
    boardElement: document.getElementById('game-board'),
    levelDisplay,
    scoreDisplay,
    movesDisplay
});

// Обработчики событий
startButton.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    game.startNewGame();
});

rulesButton.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    rulesScreen.classList.remove('hidden');
});

statsButton.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    statsScreen.classList.remove('hidden');
    updateStatsDisplay();
});

backFromRules.addEventListener('click', () => {
    rulesScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

backFromStats.addEventListener('click', () => {
    statsScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

menuButton.addEventListener('click', () => {
    gameScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    game.pauseGame();
});

themeToggle.addEventListener('click', toggleTheme);

hintButton.addEventListener('click', () => {
    useHint(game);
});

// Инициализация системы подсказок
initHintSystem(hintButton);