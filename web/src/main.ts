const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D canvas context unavailable");
}

ctx.imageSmoothingEnabled = false;
ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

const sprite = new Image();
sprite.src = "/tiles/grass_tile.png";
sprite.onload = () => {
  ctx.drawImage(sprite, 0, 0, 48, 48);
};
