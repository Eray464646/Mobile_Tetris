const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
ctx.scale(30, 30);

// Touch Buttons
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnDown = document.getElementById('btn-down');
const btnRotate = document.getElementById('btn-rotate');

function vibrate(ms = 50) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

if (btnLeft && btnRight && btnDown && btnRotate) {
  btnLeft.addEventListener('touchstart', e => {
    e.preventDefault(); vibrate(); playerMove(-1);
  });
  btnRight.addEventListener('touchstart', e => {
    e.preventDefault(); vibrate(); playerMove(1);
  });
  btnDown.addEventListener('touchstart', e => {
    e.preventDefault(); vibrate(); playerDrop();
  });
  btnRotate.addEventListener('touchstart', e => {
    e.preventDefault(); vibrate(); playerRotate(1);
  });
}

// Tastatursteuerung
window.addEventListener('keydown', e => {
  if (!gameStarted || isGameOver) return;
  switch (e.key) {
    case 'ArrowLeft':  playerMove(-1); break;
    case 'ArrowRight': playerMove(1); break;
    case 'ArrowDown':  playerDrop(); break;
    case 'w': case 'W': playerRotate(1); break;
  }
});

// Alle weiteren Funktionen wie:
// - createPiece
// - playerMove, playerDrop, playerRotate
// - draw, update, updateScore
// - startGame, endGame
// bleiben unverändert und müssen in dieser Datei ergänzt sein.
