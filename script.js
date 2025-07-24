const grid = document.getElementById('grid');
const size = 8;
const candies = [
  'candy1.png',
  'candy2.png',
  'candy3.png',
  'candy4.png',
  'candy5.png',
  'candy6.png'
];

let board = [];

function initBoard() {
  board = [];
  for (let i = 0; i < size * size; i++) {
    board.push(randomCandy());
  }
  drawBoard();
  resolveMatches();
}

function drawBoard() {
  grid.innerHTML = '';
  board.forEach((candy, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.index = i;
    tile.addEventListener('click', () => selectTile(i));

    const img = document.createElement('img');
    img.src = `images/${candy}`;
    tile.appendChild(img);
    grid.appendChild(tile);
  });
}

function randomCandy() {
  return candies[Math.floor(Math.random() * candies.length)];
}

let selected = null;

function selectTile(index) {
  if (selected === null) {
    selected = index;
    return;
  }

  if (isAdjacent(selected, index)) {
    swap(selected, index);
    if (hasMatches()) {
      resolveMatches();
    } else {
      swap(selected, index); // revert
    }
    drawBoard();
  }
  selected = null;
}

function isAdjacent(a, b) {
  const dx = Math.abs((a % size) - (b % size));
  const dy = Math.abs(Math.floor(a / size) - Math.floor(b / size));
  return dx + dy === 1;
}

function swap(a, b) {
  [board[a], board[b]] = [board[b], board[a]];
}

function getMatches() {
  let matches = [];

  // Горизонтальные
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 2; x++) {
      const i = y * size + x;
      if (board[i] && board[i] === board[i + 1] && board[i] === board[i + 2]) {
        matches.push(i, i + 1, i + 2);
      }
    }
  }

  // Вертикальные
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size - 2; y++) {
      const i = y * size + x;
      if (board[i] && board[i] === board[i + size] && board[i] === board[i + size * 2]) {
        matches.push(i, i + size, i + size * 2);
      }
    }
  }

  return [...new Set(matches)];
}

function hasMatches() {
  return getMatches().length > 0;
}

function resolveMatches() {
  const matches = getMatches();
  if (matches.length === 0) return;

  matches.forEach(i => board[i] = null);

  collapse();
  refill();
  setTimeout(() => {
    resolveMatches(); // рекурсивно, пока есть совпадения
    drawBoard();
  }, 200);
}

function collapse() {
  for (let x = 0; x < size; x++) {
    let col = [];
    for (let y = 0; y < size; y++) {
      const i = y * size + x;
      if (board[i]) col.push(board[i]);
    }

    while (col.length < size) col.unshift(null);

    for (let y = 0; y < size; y++) {
      board[y * size + x] = col[y];
    }
  }
}

function refill() {
  for (let i = 0; i < board.length; i++) {
    if (!board[i]) board[i] = randomCandy();
  }
}

initBoard();
