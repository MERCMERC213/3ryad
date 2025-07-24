import { createBonus, activateBonus } from './bonuses.js';
import { LevelSystem } from './level-system.js';
import { updateStats } from './stats-manager.js';

export class Game {
    constructor({ boardElement, levelDisplay, scoreDisplay, movesDisplay }) {
        this.boardElement = boardElement;
        this.levelDisplay = levelDisplay;
        this.scoreDisplay = scoreDisplay;
        this.movesDisplay = movesDisplay;
        
        this.levelSystem = new LevelSystem();
        this.currentLevel = 1;
        this.score = 0;
        this.moves = 0;
        
        this.board = [];
        this.selectedCell = null;
        this.isProcessing = false;
        this.boardSize = 6;
        
        this.candyTypes = 6;
        this.candies = [];
        this.bonusTypes = ['arrow_up', 'arrow_down', 'arrow_left', 'arrow_right', 'bomb'];
        
        this.initCandies();
    }
    
    initCandies() {
        for (let i = 1; i <= this.candyTypes; i++) {
            this.candies.push(`candy${i}`);
        }
    }
    
    startNewGame() {
        this.currentLevel = 1;
        this.score = 0;
        this.moves = 0;
        
        this.updateUI();
        this.generateBoard();
        this.updateBoard();
    }
    
    generateBoard() {
        this.board = [];
        this.boardSize = this.currentLevel < 5 ? 6 : 8;
        
        // Очищаем доску
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        
        // Создаем новую доску
        for (let row = 0; row < this.boardSize; row++) {
            const rowArray = [];
            for (let col = 0; col < this.boardSize; col++) {
                // Случайный тип конфеты
                const candyType = this.getRandomCandy();
                
                // Создаем ячейку
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Создаем элемент конфеты
                const candy = document.createElement('img');
                candy.src = `images/${candyType}.png`;
                candy.alt = candyType;
                candy.dataset.type = candyType;
                
                cell.appendChild(candy);
                cell.addEventListener('click', () => this.handleCellClick(cell));
                
                this.boardElement.appendChild(cell);
                rowArray.push({
                    type: candyType,
                    element: cell,
                    candyElement: candy,
                    bonus: null,
                    ice: this.shouldHaveIce(row, col)
                });
            }
            this.board.push(rowArray);
        }
        
        // Проверяем, нет ли случайных совпадений
        setTimeout(() => this.checkForMatches(true), 300);
    }
    
    getRandomCandy() {
        return this.candies[Math.floor(Math.random() * this.candies.length)];
    }
    
    shouldHaveIce(row, col) {
        // Со 2 уровня добавляем лёд с вероятностью 20%
        if (this.currentLevel >= 2 && Math.random() < 0.2) {
            return 2; // Количество ударов для удаления
        }
        return 0;
    }
    
    handleCellClick(cell) {
        if (this.isProcessing) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellData = this.board[row][col];
        
        // Если ячейка уже выбрана
        if (this.selectedCell === cellData) {
            this.deselectCell();
            return;
        }
        
        // Если это первая выбранная ячейка
        if (!this.selectedCell) {
            this.selectCell(cellData);
            return;
        }
        
        // Проверяем, является ли ячейка соседней
        const selectedRow = this.selectedCell.row;
        const selectedCol = this.selectedCell.col;
        
        const isAdjacent = (
            (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
            (Math.abs(col - selectedCol) === 1 && row === selectedRow
        );
        
        if (isAdjacent) {
            this.swapCells(this.selectedCell, cellData);
        } else {
            this.deselectCell();
            this.selectCell(cellData);
        }
    }
    
    selectCell(cellData) {
        this.selectedCell = cellData;
        cellData.element.classList.add('selected');
    }
    
    deselectCell() {
        if (this.selectedCell) {
            this.selectedCell.element.classList.remove('selected');
            this.selectedCell = null;
        }
    }
    
    swapCells(cell1, cell2) {
        this.isProcessing = true;
        this.deselectCell();
        
        // Визуальное перемещение
        this.animateSwap(cell1, cell2, () => {
            // Фактическое перемещение в массиве
            const temp = { ...cell1 };
            this.board[cell1.row][cell1.col] = cell2;
            this.board[cell2.row][cell2.col] = temp;
            
            // Обновление позиций
            [cell1.row, cell2.row] = [cell2.row, cell1.row];
            [cell1.col, cell2.col] = [cell2.col, cell1.col];
            
            // Проверка совпадений
            setTimeout(() => {
                const matches = this.findMatches();
                if (matches.length > 0) {
                    this.processMatches(matches);
                    this.moves++;
                    this.updateUI();
                } else {
                    // Если совпадений нет - возвращаем обратно
                    this.animateSwap(cell1, cell2, () => {
                        const temp = { ...cell1 };
                        this.board[cell1.row][cell1.col] = cell2;
                        this.board[cell2.row][cell2.col] = temp;
                        [cell1.row, cell2.row] = [cell2.row, cell1.row];
                        [cell1.col, cell2.col] = [cell2.col, cell1.col];
                        this.isProcessing = false;
                    });
                }
            }, 300);
        });
    }
    
    animateSwap(cell1, cell2, callback) {
        // Анимация перемещения
        const cell1Element = cell1.element;
        const cell2Element = cell2.element;
        
        // Временно удаляем конфеты
        const candy1 = cell1Element.querySelector('img');
        const candy2 = cell2Element.querySelector('img');
        candy1.remove();
        candy2.remove();
        
        // Перемещаем конфеты
        cell1Element.appendChild(candy2);
        cell2Element.appendChild(candy1);
        
        // Запускаем анимацию
        setTimeout(callback, 300);
    }
    
    findMatches() {
        const matches = [];
        
        // Проверка по горизонтали
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize - 2; col++) {
                const cell1 = this.board[row][col];
                const cell2 = this.board[row][col + 1];
                const cell3 = this.board[row][col + 2];
                
                if (cell1.type === cell2.type && cell2.type === cell3.type) {
                    const match = [cell1, cell2, cell3];
                    
                    // Проверяем на более длинные совпадения
                    let nextCol = col + 3;
                    while (nextCol < this.boardSize && this.board[row][nextCol].type === cell1.type) {
                        match.push(this.board[row][nextCol]);
                        nextCol++;
                    }
                    
                    matches.push(match);
                    col = nextCol - 1; // Пропускаем проверенные ячейки
                }
            }
        }
        
        // Проверка по вертикали
        for (let col = 0; col < this.boardSize; col++) {
            for (let row = 0; row < this.boardSize - 2; row++) {
                const cell1 = this.board[row][col];
                const cell2 = this.board[row + 1][col];
                const cell3 = this.board[row + 2][col];
                
                if (cell1.type === cell2.type && cell2.type === cell3.type) {
                    const match = [cell1, cell2, cell3];
                    
                    // Проверяем на более длинные совпадения
                    let nextRow = row + 3;
                    while (nextRow < this.boardSize && this.board[nextRow][col].type === cell1.type) {
                        match.push(this.board[nextRow][col]);
                        nextRow++;
                    }
                    
                    matches.push(match);
                    row = nextRow - 1; // Пропускаем проверенные ячейки
                }
            }
        }
        
        return matches;
    }
    
    processMatches(matches) {
        if (matches.length === 0) {
            this.fillBoard();
            return;
        }
        
        // Обрабатываем каждое совпадение
        let totalScore = 0;
        let createdBonus = false;
        
        matches.forEach(match => {
            // Очки: 10 за конфету + 5 за каждую дополнительную в совпадении
            const matchScore = 10 + (match.length - 3) * 5;
            totalScore += matchScore;
            
            // Создаем бонусы для больших совпадений
            if (!createdBonus && match.length >= 4) {
                const centerCell = match[Math.floor(match.length / 2)];
                this.createBonus(centerCell, match.length);
                createdBonus = true;
            }
            
            // Удаляем совпадения
            match.forEach(cell => {
                if (cell.ice > 0) {
                    cell.ice--;
                    if (cell.ice === 0) {
                        cell.element.classList.remove('ice');
                    }
                } else {
                    cell.element.classList.add('disappearing');
                    
                    // Если есть бонус - активируем его
                    if (cell.bonus) {
                        setTimeout(() => {
                            activateBonus(cell, this.board, this.boardSize);
                        }, 200);
                    }
                    
                    setTimeout(() => {
                        cell.type = null;
                        cell.bonus = null;
                        const img = cell.element.querySelector('img');
                        if (img) img.remove();
                    }, 300);
                }
            });
        });
        
        // Обновляем счет
        this.score += totalScore;
        this.updateUI();
        
        // Заполняем пустые ячейки
        setTimeout(() => {
            this.fillBoard();
            setTimeout(() => {
                const newMatches = this.findMatches();
                if (newMatches.length > 0) {
                    this.processMatches(newMatches);
                } else {
                    this.checkLevelCompletion();
                    this.isProcessing = false;
                }
            }, 500);
        }, 500);
    }
    
    createBonus(cell, matchLength) {
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
    
    fillBoard() {
        // Перемещаем существующие конфеты вниз
        for (let col = 0; col < this.boardSize; col++) {
            let emptySpaces = 0;
            
            // Идем снизу вверх
            for (let row = this.boardSize - 1; row >= 0; row--) {
                const cell = this.board[row][col];
                
                if (!cell.type) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Перемещаем конфету вниз
                    const newRow = row + emptySpaces;
                    this.board[newRow][col] = cell;
                    this.board[row][col] = { row, col, type: null, element: cell.element };
                    
                    // Обновляем позицию в DOM
                    cell.row = newRow;
                    cell.element.dataset.row = newRow;
                    cell.element.classList.add('falling');
                    
                    setTimeout(() => {
                        cell.element.classList.remove('falling');
                    }, 300);
                }
            }
            
            // Добавляем новые конфеты сверху
            for (let row = 0; row < emptySpaces; row++) {
                const candyType = this.getRandomCandy();
                const cell = this.board[row][col];
                
                cell.type = candyType;
                cell.bonus = null;
                
                const candy = document.createElement('img');
                candy.src = `images/${candyType}.png`;
                candy.alt = candyType;
                candy.dataset.type = candyType;
                candy.style.transform = 'translateY(-100%)';
                
                cell.element.appendChild(candy);
                cell.element.classList.add('falling');
                
                setTimeout(() => {
                    candy.style.transform = 'translateY(0)';
                    cell.element.classList.remove('falling');
                }, 10);
            }
        }
    }
    
    checkLevelCompletion() {
        // Упрощенная проверка завершения уровня
        // В реальной игре здесь была бы более сложная логика
        if (this.score >= this.currentLevel * 500) {
            this.currentLevel++;
            this.levelDisplay.textContent = this.currentLevel;
            
            if (this.currentLevel === 5) {
                // Переход на поле 8x8
                setTimeout(() => {
                    this.generateBoard();
                }, 1000);
            }
            
            updateStats('maxLevel', this.currentLevel);
        }
    }
    
    updateUI() {
        this.levelDisplay.textContent = this.currentLevel;
        this.scoreDisplay.textContent = this.score;
        this.movesDisplay.textContent = this.moves;
    }
    
    pauseGame() {
        this.isProcessing = true;
    }
    
    highlightPossibleMoves(cells) {
        // Снимаем предыдущие подсветки
        this.clearHighlights();
        
        // Подсвечиваем новые возможные ходы
        cells.forEach(cell => {
            cell.element.classList.add('possible-move');
        });
        
        // Через 3 секунды снимаем подсветку
        setTimeout(() => {
            this.clearHighlights();
        }, 3000);
    }
    
    clearHighlights() {
        document.querySelectorAll('.cell.possible-move').forEach(cell => {
            cell.classList.remove('possible-move');
        });
    }
}