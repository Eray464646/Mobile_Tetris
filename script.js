// Canvas & Skalierung
const canvas = document.getElementById('tetris');
const ctx    = canvas.getContext('2d');
ctx.scale(30, 30);

// Profile
let profiles = JSON.parse(localStorage.getItem('tetrisProfiles') || '[]');
if (!profiles.length) {
  profiles = [{ name: 'Gast', highScore: 0 }];
  localStorage.setItem('tetrisProfiles', JSON.stringify(profiles));
}
let currentProfile = profiles[0].name;

// UI-Elemente
const profileNameInput = document.getElementById('profileName');
const createProfileBtn = document.getElementById('createProfile');
const profileSelect    = document.getElementById('profileSelect');
const deleteProfileBtn = document.getElementById('deleteProfile');
const startBtn         = document.getElementById('startBtn');
const restartBtn       = document.getElementById('restartBtn');
const quitBtn          = document.getElementById('quitBtn');
const modeEasy         = document.getElementById('modeEasy');
const modeHard         = document.getElementById('modeHard');
const modeImpossible   = document.getElementById('modeImpossible');
const scoresList       = document.getElementById('scoresList');
const gameOverEl       = document.getElementById('gameOver');
const scoreEl          = document.getElementById('score');

// Spielvariablen
const EASY       = 1000;
const HARD       = 200;
const IMPOSSIBLE = HARD / 4;
let dropInterval = EASY;
let dropCounter = 0;
let lastTime = 0;
let isGameOver = false;
let gameStarted = false;

const arena = Array.from({ length: 20 }, () => Array(10).fill(0));
const colors = [ null, '#FF0D72','#0DC2FF','#0DFF72','#F538FF','#FF8E0D','#FFE138','#3877FF' ];
const player = { pos: { x: 0, y: 0 }, matrix: null, score: 0 };

// Profile-Rendering
function renderProfiles() {
  profileSelect.innerHTML = '';
  profiles.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    profileSelect.appendChild(opt);
  });
  profileSelect.value = currentProfile;
}
function renderLeaderboard() {
  const sorted = [...profiles].sort((a, b) => b.highScore - a.highScore);
  scoresList.innerHTML = '';
  sorted.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.name}: ${p.highScore}`;
    scoresList.appendChild(li);
  });
}
renderProfiles();
renderLeaderboard();

// Profilverwaltung
createProfileBtn.onclick = () => {
  const name = profileNameInput.value.trim();
  if (name && !profiles.find(p => p.name === name)) {
    profiles.push({ name, highScore: 0 });
    localStorage.setItem('tetrisProfiles', JSON.stringify(profiles));
    currentProfile = name;
    profileNameInput.value = '';
    renderProfiles();
    renderLeaderboard();
  }
};
profileSelect.onchange = () => { currentProfile = profileSelect.value; };
deleteProfileBtn.onclick = () => {
  if (profiles.length <= 1) return;
  profiles = profiles.filter(p => p.name !== currentProfile);
  currentProfile = profiles[0].name;
  localStorage.setItem('tetrisProfiles', JSON.stringify(profiles));
  renderProfiles();
  renderLeaderboard();
};

// Spielmodi
modeEasy.onchange       = () => { dropInterval = EASY; };
modeHard.onchange       = () => { dropInterval = HARD; };
modeImpossible.onchange = () => { dropInterval = IMPOSSIBLE; };

// Spielsteuerung
startBtn.onclick   = () => { if (!gameStarted) startGame(); };
restartBtn.onclick = () => { startGame(); };
quitBtn.onclick    = () => { endGame(true); };

// Spiellogik
function createPiece(type) {
  return {
    T: [[0,0,0],[1,1,1],[0,1,0]],
    O: [[2,2],[2,2]],
    L: [[0,3,0],[0,3,0],[0,3,3]],
    J: [[0,4,0],[0,4,0],[4,4,0]],
    I: [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]],
    S: [[0,6,6],[6,6,0],[0,0,0]],
    Z: [[7,7,0],[0,7,7],[0,0,0]]
  }[type];
}
function drawMatrix(m, o) {
  m.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v) {
        ctx.fillStyle = colors[v];
        ctx.fillRect(o.x + x, o.y + y, 1, 1);
      }
    })
  );
}
function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, { x: 0, y: 0 });
  if (player.matrix) drawMatrix(player.matrix, player.pos);
}
function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y)
    for (let x = 0; x < m[y].length; ++x)
      if (m[y][x] && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) return true;
  return false;
}
function merge(arena, player) {
  player.matrix.forEach((row, y) =>
    row.forEach((v, x) => {
      if (v) arena[y + player.pos.y][x + player.pos.x] = v;
    })
  );
}
function sweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (!arena[y][x]) continue outer;
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    player.score += rowCount * 10;
    rowCount *= 2;
    ++y;
    updateScore();
  }
}
function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    sweep();
    playerReset();
  }
  dropCounter = 0;
}
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) player.pos.x -= dir;
}
function rotate(m, dir) {
  for (let y = 0; y < m.length; ++y)
    for (let x = 0; x < y; ++x)
      [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
  dir > 0 ? m.forEach(r => r.reverse()) : m.reverse();
}
function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}
function updateScore() {
  scoreEl.innerText = player.score;
}
function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[(Math.random() * pieces.length) | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) endGame();
}
function update(time = 0) {
  if (!gameStarted || isGameOver) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) playerDrop();
  draw();
  requestAnimationFrame(update);
}
function startGame() {
  isGameOver = false;
  gameStarted = true;
  dropCounter = 0;
  lastTime = 0;
  arena.forEach(row => row.fill(0));
  player.score = 0;
  updateScore();
  gameOverEl.style.display = 'none';
  playerReset();
  requestAnimationFrame(update);
}
function endGame(quit = false) {
  isGameOver = true;
  gameStarted = false;
  if (!quit) gameOverEl.style.display = 'block';
  const prof = profiles.find(p => p.name === currentProfile);
  if (player.score > prof.highScore) prof.highScore = player.score;
  localStorage.setItem('tetrisProfiles', JSON.stringify(profiles));
  renderLeaderboard();
}

// Tastatursteuerung (funktioniert überall im Fenster)
window.addEventListener('keydown', e => {
  if (!gameStarted || isGameOver) return;
  switch (e.key) {
    case 'ArrowLeft':  playerMove(-1); break;
    case 'ArrowRight': playerMove(1);  break;
    case 'ArrowDown':  playerDrop();   break;
    case 'w':
    case 'W':          playerRotate(1); break;
  }
});
