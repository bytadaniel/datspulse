const canvas = document.getElementById("hexGrid");
const ctx = canvas.getContext("2d");

// Установка размера холста
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawHexGrid();
}

// Параметры сетки
const hexRadius = 30;
const hexHeight = Math.sqrt(3) * hexRadius;
const hexWidth = 2 * hexRadius;

// Правильные расстояния между центрами
const horizontalSpacing = hexWidth * 0.75;
const verticalSpacing = hexHeight * 0.5;

// Настройки отрисовки
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 1;

// Рисование одного гексагона
function drawHexagon(x, y) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = x + hexRadius * Math.cos(angle);
    const py = y + hexRadius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.stroke();
}

// Рисование всей сетки
function drawHexGrid() {
  const cols = Math.ceil(canvas.width / (hexWidth * 0.75)) + 1;
  const rows = Math.ceil(canvas.height / (hexHeight * 0.5)) + 1;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2) * hexRadius;
      const x = col * (hexWidth * 0.75) + offsetX;
      const y = row * (hexHeight * 0.5);
      
      if (x > -hexWidth && x < canvas.width + hexWidth && 
          y > -hexHeight && y < canvas.height + hexHeight) {
        drawHexagon(x, y);
      }
    }
  }
}

// Инициализация
resizeCanvas();
window.addEventListener("resize", resizeCanvas);