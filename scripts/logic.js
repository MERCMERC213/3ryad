// logic.js
export function getMatch(board) {
  const size = 8;
  let matched = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 2; x++) {
      const i = y * size + x;
      if (board[i] && board[i] === board[i + 1] && board[i] === board[i + 2]) {
        matched.push(i, i + 1, i + 2);
      }
    }
  }

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size - 2; y++) {
      const i = y * size + x;
      if (board[i] && board[i] === board[i + size] && board[i] === board[i + size * 2]) {
        matched.push(i, i + size, i + size * 2);
      }
    }
  }

  return [...new Set(matched)];
}

export function collapseBoard(board, matched) {
  matched.forEach(i => board[i] = null);

  for (let x = 0; x < 8; x++) {
    let col = [];
    for (let y = 0; y < 8; y++) {
      const i = y * 8 + x;
      if (board[i]) col.push(board[i]);
    }

    while (col.length < 8) col.unshift(null);

    for (let y = 0; y < 8; y++) {
      board[y * 8 + x] = col[y];
    }
  }
}

export function refillBoard(board, size, getCandy) {
  for (let i = 0; i < size * size; i++) {
    if (!board[i]) board[i] = getCandy();
  }
}