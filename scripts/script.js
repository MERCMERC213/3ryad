document.addEventListener('DOMContentLoaded', () => {
    const mainMenu = document.getElementById('main-menu');
    const gameContainer = document.getElementById('game-container');
    const startButton = document.getElementById('start-btn');
    const gameBoard = document.getElementById('game-board');

    const BOARD_SIZE = 8;
    const COLORS = 6; // Количество разных цветов
    let board = [];
    let selectedCell = null;

    startButton.addEventListener('click', startGame);

    function startGame() {
        mainMenu.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initializeBoard();
        renderBoard();
    }

    function initializeBoard() {
        // Создаем игровое поле со случайными цветами
        board = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            board[i] = [];
            for (let j = 0; j < BOARD_SIZE; j++) {
                board[i][j] = Math.floor(Math.random() * COLORS);
            }
        }
    }

    function renderBoard() {
        gameBoard.innerHTML = '';
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                const cell = document.createElement('div');
                cell.className = `cell color-${board[i][j]}`;
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', handleCellClick);
                gameBoard.appendChild(cell);
            }
        }
    }

    function handleCellClick(event) {
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (!selectedCell) {
            // Первый выбор
            selectedCell = { row, col };
            event.target.style.border = "3px solid white";
        } else {
            // Второй выбор - пробуем поменять фигуры
            const firstCell = selectedCell;
            const isAdjacent = 
                (Math.abs(firstCell.row - row) === 1 && firstCell.col === col) ||
                (Math.abs(firstCell.col - col) === 1 && firstCell.row === row);
            
            if (isAdjacent) {
                // Меняем фигуры местами
                swapCells(firstCell, { row, col });
                // Сбрасываем выделение
                document.querySelector(`[data-row="${firstCell.row}"][data-col="${firstCell.col}"]`).style.border = "";
                selectedCell = null;
                
                // Проверяем совпадения
                setTimeout(checkMatches, 300);
            } else {
                // Сбрасываем предыдущий выбор
                document.querySelector(`[data-row="${firstCell.row}"][data-col="${firstCell.col}"]`).style.border = "";
                // Выбираем новую ячейку
                selectedCell = { row, col };
                event.target.style.border = "3px solid white";
            }
        }
    }

    function swapCells(cell1, cell2) {
        const temp = board[cell1.row][cell1.col];
        board[cell1.row][cell1.col] = board[cell2.row][cell2.col];
        board[cell2.row][cell2.col] = temp;
        renderBoard();
    }

    function checkMatches() {
        let hasMatches = false;
        
        // Проверка по горизонтали
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE - 2; col++) {
                if (board[row][col] === board[row][col+1] && 
                    board[row][col] === board[row][col+2]) {
                    
                    // Помечаем совпадения как пустые (-1)
                    board[row][col] = -1;
                    board[row][col+1] = -1;
                    board[row][col+2] = -1;
                    hasMatches = true;
                }
            }
        }
        
        // Проверка по вертикали
        for (let col = 0; col < BOARD_SIZE; col++) {
            for (let row = 0; row < BOARD_SIZE - 2; row++) {
                if (board[row][col] === board[row+1][col] && 
                    board[row][col] === board[row+2][col]) {
                    
                    board[row][col] = -1;
                    board[row+1][col] = -1;
                    board[row+2][col] = -1;
                    hasMatches = true;
                }
            }
        }
        
        if (hasMatches) {
            removeMatches();
            setTimeout(checkMatches, 300); // Рекурсивная проверка
        }
    }

    function removeMatches() {
        // Удаляем совпадения (сдвигаем фигуры вниз)
        for (let col = 0; col < BOARD_SIZE; col++) {
            let emptySpaces = 0;
            
            // Снизу вверх
            for (let row = BOARD_SIZE - 1; row >= 0; row--) {
                if (board[row][col] === -1) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    board[row + emptySpaces][col] = board[row][col];
                    board[row][col] = -1;
                }
            }
            
            // Заполняем верхние пустые места
            for (let row = 0; row < emptySpaces; row++) {
                board[row][col] = Math.floor(Math.random() * COLORS);
            }
        }
        
        renderBoard();
    }
});