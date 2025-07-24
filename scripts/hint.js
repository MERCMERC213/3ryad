// hint.js
import { board } from './board.js';
import { getMatch } from './logic.js';

let hintCooldown = 180; // seconds
let timer;

export function startHintCooldown() {
  const btn = document.getElementById('hint-button');
  btn.disabled = true;
  updateButtonLabel(hintCooldown);

  timer = setInterval(() => {
    hintCooldown--;
    if (hintCooldown <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.textContent = 'Hint';
    } else {
      updateButtonLabel(hintCooldown);
    }
  }, 1000);
}

function updateButtonLabel(seconds) {
  const btn = document.getElementById('hint-button');
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  btn.textContent = `Hint (${mins}:${secs.toString().padStart(2, '0')})`;
}

export function showHint() {
  const matches = getMatch(board);
  if (matches.length > 0) {
    matches.forEach(i => {
      const tile = document.querySelector(`[data-index='${i}']`);
      if (tile) tile.classList.add('match');
    });
    setTimeout(() => {
      matches.forEach(i => {
        const tile = document.querySelector(`[data-index='${i}']`);
        if (tile) tile.classList.remove('match');
      });
    }, 1000);
    startHintCooldown();
  }
}