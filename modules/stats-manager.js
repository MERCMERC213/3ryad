let gameStats = {
    totalGames: 0,
    maxLevel: 0,
    maxScore: 0,
    totalHints: 0
};

export function initStats() {
    const savedStats = localStorage.getItem('gameStats');
    if (savedStats) {
        gameStats = JSON.parse(savedStats);
    }
}

export function updateStats(key, value) {
    if (key === 'maxLevel') {
        gameStats.maxLevel = Math.max(gameStats.maxLevel, value);
    } else if (key === 'maxScore') {
        gameStats.maxScore = Math.max(gameStats.maxScore, value);
    } else if (key === 'hintUsed') {
        gameStats.totalHints++;
    }
    
    localStorage.setItem('gameStats', JSON.stringify(gameStats));
}

export function showStats() {
    initStats();
    updateStatsDisplay();
}

export function updateStatsDisplay() {
    document.getElementById('total-games').textContent = gameStats.totalGames;
    document.getElementById('max-level').textContent = gameStats.maxLevel;
    document.getElementById('max-score').textContent = gameStats.maxScore;
    document.getElementById('total-hints').textContent = gameStats.totalHints;
}