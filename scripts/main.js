// main.js
import { createBoard, drawBoard, handleTileClick } from './board.js';
import { setupLevels, nextLevel } from './levels.js';
import { applyTheme, toggleTheme } from './ui.js';
import { startHintCooldown, showHint } from './hint.js';

let currentLevel = 1;

window.startGame = () => {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  setupLevels(currentLevel);
  createBoard();
  drawBoard();
  startHintCooldown();
};

window.showRules = () => {
  const content = document.getElementById('modal-content');
  content.innerHTML = `
    <h2>Rules</h2>
    <p>Swap tiles to match 3 or more in a row or column. Clear matches to score points and advance levels. New challenges appear as you progress!</p>
  `;
  document.getElementById('modal').classList.remove('hidden');
};

window.showStats = () => {
  const content = document.getElementById('modal-content');
  const played = localStorage.getItem('gamesPlayed') || 0;
  content.innerHTML = `
    <h2>Statistics</h2>
    <p>Games played: ${played}</p>
  `;
  document.getElementById('modal').classList.remove('hidden');
};

window.closeModal = () => {
  document.getElementById('modal').classList.add('hidden');
};

window.toggleTheme = () => {
  document.body.classList.toggle('dark');
  applyTheme();
};

window.showHint = () => {
  showHint();
};

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
});