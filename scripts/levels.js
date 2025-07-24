// levels.js
export let candyTypes = [
  'candy1.png',
  'candy2.png',
  'candy3.png',
  'candy4.png',
  'candy5.png',
  'candy6.png'
];

export function setupLevels(level) {
  const indicator = document.getElementById('level-indicator');
  indicator.textContent = `Level: ${level}`;

  if (level === 2) addObstacles();
  if (level === 5) addLockedTiles();
  if (level === 10) addTimerMode();
  if (level === 20) addColorLimits();
  if (level === 50) addShufflePenalties();
  if (level === 100) addHiddenTiles();
  if (level === 200) addSpecialGoals();
}

function addObstacles() {
  console.log('Add obstacles on board');
}
function addLockedTiles() {
  console.log('Lock some tiles');
}
function addTimerMode() {
  console.log('Enable timer mode');
}
function addColorLimits() {
  console.log('Limit color match');
}
function addShufflePenalties() {
  console.log('Penalize frequent shuffles');
}
function addHiddenTiles() {
  console.log('Some tiles become hidden');
}
function addSpecialGoals() {
  console.log('Add goals like clear X of Y color');
}

export function nextLevel(current) {
  return current + 1;
}