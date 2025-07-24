let hintCooldown = false;
let hintCooldownTimer = null;
let totalHintsUsed = 0;

export function initHintSystem(hintButton) {
    // Загружаем статистику
    const savedHints = localStorage.getItem('totalHintsUsed');
    if (savedHints) {
        totalHintsUsed = parseInt(savedHints);
    }
    
    updateHintButton();
}

export function useHint(game) {
    if (hintCooldown || game.isProcessing) return;
    
    // Находим возможные ходы
    const possibleMoves = findPossibleMoves(game.board, game.boardSize);
    
    if (possibleMoves.length > 0) {
        // Подсвечиваем возможные ходы
        game.highlightPossibleMoves(possibleMoves);
        
        // Обновляем статистику
        totalHintsUsed++;
        localStorage.setItem('totalHintsUsed', totalHintsUsed.toString());
        document.getElementById('total-hints').textContent = totalHintsUsed;
        
        // Включаем перезарядку
        startCooldown();
    }
}

function findPossibleMoves(board, boardSize) {
    const possibleMoves = [];
    
    // Проверяем все возможные свайпы
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const cell = board[row][col];
            
            // Проверяем свайп вправо
            if (col < boardSize - 1) {
                const rightCell = board[row][col + 1];
                if (checkSwap(cell, rightCell, board, boardSize)) {
                    possibleMoves.push(cell, rightCell);
                }
            }
            
            // Проверяем свайп вниз
            if (row < boardSize - 1) {
                const downCell = board[row + 1][col];
                if (checkSwap(cell, downCell, board, boardSize)) {
                    possibleMoves.push(cell, downCell);
                }
            }
        }
    }
    
    return [...new Set(possibleMoves)]; // Убираем дубликаты
}

function checkSwap(cell1, cell2, board, boardSize) {
    // Временный обмен
    [cell1.type, cell2.type] = [cell2.type, cell1.type];
    
    // Проверяем, создает ли это совпадение
    const hasMatch = checkForMatchAt(cell1.row, cell1.col, board, boardSize) || 
                    checkForMatchAt(cell2.row, cell2.col, board, boardSize);
    
    // Возвращаем обратно
    [cell1.type, cell2.type] = [cell2.type, cell1.type];
    
    return hasMatch;
}

function checkForMatchAt(row, col, board, boardSize) {
    const type = board[row][col].type;
    if (!type) return false;
    
    // Проверка по горизонтали
    let left = col;
    while (left > 0 && board[row][left - 1].type === type) left--;
    
    let right = col;
    while (right < boardSize - 1 && board[row][right + 1].type === type) right++;
    
    if (right - left >= 2) return true;
    
    // Проверка по вертикали
    let top = row;
    while (top > 0 && board[top - 1][col].type === type) top--;
    
    let bottom = row;
    while (bottom < boardSize - 1 && board[bottom + 1][col].type === type) bottom++;
    
    return bottom - top >= 2;
}

function startCooldown() {
    hintCooldown = true;
    const cooldownElement = document.querySelector('.hint-cooldown');
    const hintButton = document.getElementById('hint-btn');
    
    hintButton.classList.add('disabled');
    cooldownElement.style.transition = 'transform 180s linear';
    cooldownElement.style.transform = 'scaleX(0)';
    
    hintCooldownTimer = setTimeout(() => {
        hintCooldown = false;
        hintButton.classList.remove('disabled');
        cooldownElement.style.transition = 'none';
        cooldownElement.style.transform = 'scaleX(1)';
    }, 180000); // 3 минуты
}

function updateHintButton() {
    document.getElementById('total-hints').textContent = totalHintsUsed;
}