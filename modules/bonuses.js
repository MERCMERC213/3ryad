// Функция для создания бонусов
export function createBonus(cell, matchLength) {
    let bonusType;
    
    if (matchLength >= 5) {
        bonusType = 'bomb';
    } else {
        // Выбираем случайное направление для стрелки
        const directions = ['up', 'down', 'left', 'right'];
        bonusType = `arrow_${directions[Math.floor(Math.random() * directions.length)]}`;
    }
    
    cell.bonus = bonusType;
    
    // Обновляем изображение
    const img = cell.element.querySelector('img');
    img.src = `images/${bonusType}.png`;
    img.alt = bonusType;
    img.dataset.type = bonusType;
}

// Функция для активации бонусов
export function activateBonus(cell, board, boardSize) {
    if (!cell.bonus) return;
    
    const row = cell.row;
    const col = cell.col;
    let cellsToRemove = [];
    
    switch(cell.bonus) {
        case 'arrow_up':
            for (let r = 0; r < row; r++) {
                cellsToRemove.push(board[r][col]);
            }
            break;
            
        case 'arrow_down':
            for (let r = row + 1; r < boardSize; r++) {
                cellsToRemove.push(board[r][col]);
            }
            break;
            
        case 'arrow_left':
            for (let c = 0; c < col; c++) {
                cellsToRemove.push(board[row][c]);
            }
            break;
            
        case 'arrow_right':
            for (let c = col + 1; c < boardSize; c++) {
                cellsToRemove.push(board[row][c]);
            }
            break;
            
        case 'bomb':
            // Удаляем все в радиусе 1 клетки
            for (let r = Math.max(0, row - 1); r <= Math.min(boardSize - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(boardSize - 1, col + 1); c++) {
                    if (r !== row || c !== col) {
                        cellsToRemove.push(board[r][c]);
                    }
                }
            }
            break;
    }
    
    // Удаляем помеченные ячейки
    cellsToRemove.forEach(targetCell => {
        if (targetCell.ice > 0) {
            targetCell.ice--;
            if (targetCell.ice === 0) {
                targetCell.element.classList.remove('ice');
            }
        } else {
            targetCell.element.classList.add('disappearing');
            setTimeout(() => {
                targetCell.type = null;
                targetCell.bonus = null;
                const img = targetCell.element.querySelector('img');
                if (img) img.remove();
            }, 300);
        }
    });
}