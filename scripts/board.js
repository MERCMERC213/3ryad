// board.js
import { getMatch, collapseBoard, refillBoard } from './logic.js';
import { candyTypes } from './levels.js';

const grid = document.getElementById('grid');
export let board = [];
const size = 8;

export function createBoard() {
  board.length = 0;
  for (let i = 0; i < size * size; i++) {
    board.push(getRandomCandy());
  }
}

export function drawBoard() {
  grid.innerHTML = '';
  board.forEach((candy, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = i;

    const img = document.createElement('img');
    img.src = `./images/${candy}`;
    tile.appendChild(img);

    tile.addEventListener('click', () => handleClick(i));
    grid.appendChild(tile);
  });
}

function getRandomCandy() {
  const index = Math.floor(Math.random() * candyTypes.length);
  return candyTypes[index];
}

let firstClick = null;

function handleClick(index) {
  if (firstClick === null) {
    firstClick = index;
    return;
  }

  if (isValidMove(firstClick, index)) {
    swap(firstClick, index);
    if (getMatch(board).length > 0) {
      handleMatches();
    } else {
      swap(firstClick, index); // revert if no match
    }
  }

  firstClick = null;
  drawBoard();
}

function isValidMove(a, b) {
  const dx = Math.abs((a % size) - (b % size));
  const dy = Math.abs(Math.floor(a / size) - Math.floor(b / size));
  return (dx + dy === 1);
}

function swap(a, b) {
  [board[a], board[b]] = [board[b], board[a]];
}

function handleMatches() {
  const matched = getMatch(board);
  if (matched.length === 0) return;

  matched.forEach(i => {
    const el = grid.children[i];
    el.classList.add('match');
  });

  setTimeout(() => {
    collapseBoard(board, matched);
    refillBoard(board, size, getRandomCandy);
    drawBoard();
    handleMatches();
  }, 400);
}

// dummy export to avoid import error
export const dummy = true;
