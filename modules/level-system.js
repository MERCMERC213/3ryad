export class LevelSystem {
    constructor() {
        this.levels = [
            { size: 6, candyTypes: 4, iceProbability: 0, bonusProbability: 0 },
            { size: 6, candyTypes: 5, iceProbability: 0.2, bonusProbability: 0.1 },
            { size: 6, candyTypes: 5, iceProbability: 0.3, bonusProbability: 0.15 },
            { size: 6, candyTypes: 6, iceProbability: 0.4, bonusProbability: 0.2 },
            { size: 8, candyTypes: 6, iceProbability: 0.5, bonusProbability: 0.25 },
            { size: 8, candyTypes: 6, iceProbability: 0.6, bonusProbability: 0.3 }
        ];
    }
    
    getLevelSettings(level) {
        const index = Math.min(level - 1, this.levels.length - 1);
        return this.levels[index];
    }
}