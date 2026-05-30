const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const width = 1280;
const height = 1600;
const channels = 4;
const pixels = Buffer.alloc(width * height * channels);

const cyan = [0, 242, 254, 255];
const blue = [79, 172, 254, 255];
const pink = [255, 8, 68, 255];
const amber = [255, 177, 153, 255];
const white = [246, 248, 255, 255];

for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const nx = x / width;
    const ny = y / height;
    const noise = pseudoNoise(x, y) * 8;
    const vignette = Math.min(1, Math.hypot(nx - 0.52, ny - 0.5) * 1.35);
    const base = mix([10, 11, 16, 255], [18, 24, 40, 255], ny * 0.65 + nx * 0.18);
    base[0] += noise - vignette * 26;
    base[1] += noise - vignette * 24;
    base[2] += noise - vignette * 18;
    setPixel(x, y, base);
  }
}

drawGrid();
drawNeuralNetwork();
drawCodeGlyphs();
drawRhythmCurves();
drawGlassFrame();

const png = encodePng(width, height, pixels);
const outPath = path.join(__dirname, "..", "assets", "hero_art.png");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, png);
console.log(outPath);

function drawGrid() {
  for (let x = 80; x < width; x += 80) {
    line(x, 70, x, height - 70, [255, 255, 255, 18], 1);
  }
  for (let y = 80; y < height; y += 80) {
    line(70, y, width - 70, y, [255, 255, 255, 14], 1);
  }
}

function drawNeuralNetwork() {
  const nodes = [];
  for (let i = 0; i < 56; i += 1) {
    const zone = i % 3;
    nodes.push({
      x: 150 + pseudoNoise(i * 41, 7) * 620 + zone * 90,
      y: 130 + pseudoNoise(13, i * 67) * 1080,
      r: 3 + pseudoNoise(i, i) * 5,
    });
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 190) {
        line(a.x, a.y, b.x, b.y, [0, 242, 254, Math.round((1 - dist / 190) * 94)], 2);
      }
    }
  }

  for (const node of nodes) {
    circle(node.x, node.y, node.r + 8, [0, 242, 254, 24]);
    circle(node.x, node.y, node.r, cyan);
  }
}

function drawCodeGlyphs() {
  const glyphs = [
    [175, 250, "< / >"],
    [705, 245, "O(log n)"],
    [165, 1195, "dp[i]"],
    [720, 1130, "{ AI }"],
    [452, 615, "01"],
    [875, 720, "SWE"],
  ];
  for (const [x, y, text] of glyphs) {
    drawTextBlock(x, y, text);
  }
}

function drawRhythmCurves() {
  for (let i = 0; i < 9; i += 1) {
    const offset = i * 54;
    const alpha = 150 - i * 11;
    bezier(
      260 + offset * 0.22,
      1420 - offset,
      540 + Math.sin(i) * 120,
      930 - offset * 0.28,
      905 + Math.cos(i * 1.7) * 85,
      710 + offset * 0.08,
      1070 - offset * 0.18,
      230 + offset * 0.6,
      [255, 177, 153, alpha],
      8 - i * 0.45
    );
    bezier(
      210 + offset * 0.15,
      1340 - offset * 0.72,
      450 + Math.cos(i) * 140,
      960 - offset * 0.2,
      850 + Math.sin(i * 1.4) * 90,
      760 + offset * 0.08,
      1140 - offset * 0.1,
      510 + offset * 0.38,
      [255, 8, 68, Math.max(30, alpha - 35)],
      4
    );
  }

  for (let i = 0; i < 36; i += 1) {
    const angle = i * 0.62;
    const r = 95 + i * 10;
    const x = 710 + Math.cos(angle) * r;
    const y = 910 + Math.sin(angle) * r * 0.72;
    circle(x, y, 5 + (i % 4), i % 2 ? amber : pink);
  }
}

function drawGlassFrame() {
  rect(86, 86, width - 172, height - 172, [255, 255, 255, 12]);
  rectOutline(86, 86, width - 172, height - 172, [255, 255, 255, 68], 2);
  rectOutline(112, 112, width - 224, height - 224, [0, 242, 254, 54], 2);
  line(112, 112, 470, 112, [255, 8, 68, 110], 4);
  line(width - 470, height - 112, width - 112, height - 112, [0, 242, 254, 130], 4);
}

function drawTextBlock(x, y, text) {
  rect(x - 24, y - 26, text.length * 22 + 44, 62, [255, 255, 255, 20]);
  rectOutline(x - 24, y - 26, text.length * 22 + 44, 62, [0, 242, 254, 58], 2);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    const gx = x + i * 22;
    const gy = y;
    drawGlyph(gx, gy, code, i % 2 ? blue : white);
  }
}

function drawGlyph(x, y, code, color) {
  const bits = code.toString(2).padStart(8, "0");
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === "1") {
      rect(x + (i % 4) * 4, y + Math.floor(i / 4) * 12, 3, 10, [...color.slice(0, 3), 190]);
    }
  }
}

function bezier(x0, y0, x1, y1, x2, y2, x3, y3, color, widthPx) {
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 180; i += 1) {
    const t = i / 180;
    const x = cubic(x0, x1, x2, x3, t);
    const y = cubic(y0, y1, y2, y3, t);
    line(px, py, x, y, color, widthPx);
    px = x;
    py = y;
  }
}

function cubic(a, b, c, d, t) {
  const mt = 1 - t;
  return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
}

function line(x0, y0, x1, y1, color, widthPx = 1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    circle(x0 + dx * t, y0 + dy * t, widthPx * 0.5, color);
  }
}

function rect(x, y, w, h, color) {
  for (let yy = Math.max(0, Math.floor(y)); yy < Math.min(height, Math.ceil(y + h)); yy += 1) {
    for (let xx = Math.max(0, Math.floor(x)); xx < Math.min(width, Math.ceil(x + w)); xx += 1) {
      blendPixel(xx, yy, color);
    }
  }
}

function rectOutline(x, y, w, h, color, widthPx) {
  line(x, y, x + w, y, color, widthPx);
  line(x + w, y, x + w, y + h, color, widthPx);
  line(x + w, y + h, x, y + h, color, widthPx);
  line(x, y + h, x, y, color, widthPx);
}

function circle(cx, cy, r, color) {
  const minX = Math.max(0, Math.floor(cx - r));
  const maxX = Math.min(width - 1, Math.ceil(cx + r));
  const minY = Math.max(0, Math.floor(cy - r));
  const maxY = Math.min(height - 1, Math.ceil(cy + r));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) {
        const edge = Math.max(0, Math.min(1, r - dist));
        blendPixel(x, y, [color[0], color[1], color[2], Math.round(color[3] * Math.max(edge, 0.35))]);
      }
    }
  }
}

function setPixel(x, y, color) {
  const idx = (Math.floor(y) * width + Math.floor(x)) * channels;
  pixels[idx] = clampByte(color[0]);
  pixels[idx + 1] = clampByte(color[1]);
  pixels[idx + 2] = clampByte(color[2]);
  pixels[idx + 3] = clampByte(color[3]);
}

function blendPixel(x, y, color) {
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (y * width + x) * channels;
  const alpha = (color[3] || 255) / 255;
  pixels[idx] = clampByte(pixels[idx] * (1 - alpha) + color[0] * alpha);
  pixels[idx + 1] = clampByte(pixels[idx + 1] * (1 - alpha) + color[1] * alpha);
  pixels[idx + 2] = clampByte(pixels[idx + 2] * (1 - alpha) + color[2] * alpha);
  pixels[idx + 3] = 255;
}

function mix(a, b, t) {
  return a.map((value, index) => value * (1 - t) + b[index] * t);
}

function pseudoNoise(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function encodePng(w, h, rgba) {
  const rowLength = w * 4 + 1;
  const raw = Buffer.alloc(rowLength * h);
  for (let y = 0; y < h; y += 1) {
    raw[y * rowLength] = 0;
    rgba.copy(raw, y * rowLength + 1, y * w * 4, (y + 1) * w * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr(w, h)),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ihdr(w, h) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(w, 0);
  data.writeUInt32BE(h, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
