import * as THREE from 'three';

/**
 * Creates high-fidelity procedural 2D canvas textures for Three.js planetary spheres.
 * Generates main surface map, bump/normal map, cloud layer map, and ring map.
 */

export function createPlanetTexture(planetId: string): {
  surfaceTexture: THREE.CanvasTexture;
  bumpTexture?: THREE.CanvasTexture;
  cloudsTexture?: THREE.CanvasTexture;
  ringsTexture?: THREE.CanvasTexture;
  specularTexture?: THREE.CanvasTexture;
} {
  switch (planetId) {
    case 'earth':
      return createEarthTextures();
    case 'mars':
      return createMarsTextures();
    case 'moon':
      return createMoonTextures();
    case 'mercury':
      return createMercuryTextures();
    case 'venus':
      return createVenusTextures();
    case 'jupiter':
      return createJupiterTextures();
    case 'saturn':
      return createSaturnTextures();
    case 'uranus':
      return createUranusTextures();
    case 'neptune':
      return createNeptuneTextures();
    default:
      return createEarthTextures();
  }
}

// Helper canvas noise
function addNoise(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
}

// --- EARTH TEXTURES ---
function createEarthTextures() {
  const width = 1024;
  const height = 512;

  // 1. Surface Texture
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Ocean background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0d2b45');
  oceanGrad.addColorStop(0.5, '#124559');
  oceanGrad.addColorStop(1, '#0d2b45');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Draw continents procedurally
  ctx.fillStyle = '#2d6a4f';

  // North America
  drawLandmass(ctx, [
    [0.15, 0.2], [0.32, 0.18], [0.38, 0.35], [0.28, 0.45], [0.18, 0.4]
  ], width, height);

  // South America
  ctx.fillStyle = '#1b4332';
  drawLandmass(ctx, [
    [0.28, 0.52], [0.36, 0.55], [0.32, 0.85], [0.25, 0.72]
  ], width, height);

  // Eurasia & Africa
  ctx.fillStyle = '#52b788';
  drawLandmass(ctx, [
    [0.45, 0.18], [0.85, 0.15], [0.88, 0.45], [0.65, 0.48], [0.48, 0.35]
  ], width, height);

  // Africa
  ctx.fillStyle = '#d4a373';
  drawLandmass(ctx, [
    [0.48, 0.42], [0.62, 0.45], [0.58, 0.78], [0.46, 0.65]
  ], width, height);

  // Australia
  ctx.fillStyle = '#c17817';
  drawLandmass(ctx, [
    [0.78, 0.62], [0.88, 0.65], [0.85, 0.82], [0.75, 0.78]
  ], width, height);

  // Ice caps (Antarctica & Arctic)
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, width, height * 0.08); // North pole
  ctx.fillRect(0, height * 0.88, width, height * 0.12); // South pole

  addNoise(ctx, width, height, 15);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;
  surfaceTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 2. Earth Clouds Texture
  const cloudsCanvas = document.createElement('canvas');
  cloudsCanvas.width = width;
  cloudsCanvas.height = height;
  const cCtx = cloudsCanvas.getContext('2d')!;

  cCtx.fillStyle = 'rgba(0, 0, 0, 0)';
  cCtx.fillRect(0, 0, width, height);

  cCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height * 0.8 + height * 0.1;
    const rx = Math.random() * 120 + 40;
    const ry = Math.random() * 30 + 10;
    cCtx.beginPath();
    cCtx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    cCtx.fill();
  }

  const cloudsTexture = new THREE.CanvasTexture(cloudsCanvas);
  cloudsTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture, cloudsTexture };
}

// --- MARS TEXTURES ---
function createMarsTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Rust-red gradient background
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#8c2d19');
  bg.addColorStop(0.5, '#b7410e');
  bg.addColorStop(1, '#8c2d19');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Dark basaltic maria regions
  ctx.fillStyle = '#5c1d0e';
  // Syrtis Major
  drawLandmass(ctx, [[0.55, 0.4], [0.65, 0.35], [0.62, 0.55], [0.52, 0.5]], width, height);
  // Acidalia Planitia
  drawLandmass(ctx, [[0.25, 0.25], [0.45, 0.22], [0.42, 0.38], [0.22, 0.35]], width, height);

  // Valles Marineris canyon cut
  ctx.fillStyle = '#3a0e05';
  ctx.beginPath();
  ctx.moveTo(width * 0.3, height * 0.52);
  ctx.lineTo(width * 0.48, height * 0.54);
  ctx.lineWidth = 12;
  ctx.stroke();

  // Olympus Mons volcano peak dot
  ctx.fillStyle = '#d46a38';
  ctx.beginPath();
  ctx.arc(width * 0.18, height * 0.4, 18, 0, Math.PI * 2);
  ctx.fill();

  // Polar ice caps
  ctx.fillStyle = '#f1faee';
  ctx.fillRect(0, 0, width, height * 0.06);
  ctx.fillRect(0, height * 0.92, width, height * 0.08);

  addNoise(ctx, width, height, 22);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// --- MOON TEXTURES ---
function createMoonTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8d99ae';
  ctx.fillRect(0, 0, width, height);

  // Dark lunar maria (Sea of Tranquility, Oceanus Procellarum)
  ctx.fillStyle = '#4a5568';
  drawLandmass(ctx, [[0.3, 0.3], [0.48, 0.28], [0.52, 0.52], [0.28, 0.48]], width, height);
  drawLandmass(ctx, [[0.12, 0.32], [0.28, 0.25], [0.25, 0.62], [0.08, 0.55]], width, height);

  // Crater impact dots
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 8 + 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tycho rays
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  const tychoX = width * 0.45;
  const tychoY = height * 0.72;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    ctx.beginPath();
    ctx.moveTo(tychoX, tychoY);
    ctx.lineTo(tychoX + Math.cos(a) * 200, tychoY + Math.sin(a) * 200);
    ctx.stroke();
  }

  addNoise(ctx, width, height, 18);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// --- MERCURY TEXTURES ---
function createMercuryTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6c757d';
  ctx.fillRect(0, 0, width, height);

  // Caloris basin
  ctx.fillStyle = '#495057';
  ctx.beginPath();
  ctx.arc(width * 0.48, height * 0.35, 45, 0, Math.PI * 2);
  ctx.fill();

  addNoise(ctx, width, height, 30);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// --- VENUS TEXTURES ---
function createVenusTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#e9c46a');
  bg.addColorStop(0.5, '#f4a261');
  bg.addColorStop(1, '#e9c46a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Sulfur atmosphere swirls
  ctx.fillStyle = 'rgba(255, 243, 176, 0.3)';
  for (let i = 0; i < 25; i++) {
    const y = (i / 25) * height;
    ctx.beginPath();
    ctx.ellipse(width / 2, y, width, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// --- JUPITER TEXTURES ---
function createJupiterTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Banded atmosphere
  const bands = [
    '#ca6702', '#bb3e03', '#ae2012', '#9b2226', '#e9d8a6', '#ee9b00',
    '#ca6702', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ca6702'
  ];

  const bandH = height / bands.length;
  bands.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, i * bandH, width, bandH);
  });

  // Great Red Spot
  ctx.fillStyle = '#b7094c';
  ctx.beginPath();
  ctx.ellipse(width * 0.6, height * 0.62, 50, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  addNoise(ctx, width, height, 15);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// --- SATURN TEXTURES ---
function createSaturnTextures() {
  const width = 1024;
  const height = 512;

  // 1. Planet Body
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#dda15e');
  bg.addColorStop(0.3, '#bc6c25');
  bg.addColorStop(0.6, '#fefae0');
  bg.addColorStop(1, '#dda15e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  addNoise(ctx, width, height, 10);
  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  // 2. Rings Texture
  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = 512;
  ringCanvas.height = 64;
  const rCtx = ringCanvas.getContext('2d')!;

  const ringGrad = rCtx.createLinearGradient(0, 0, 512, 0);
  ringGrad.addColorStop(0, 'rgba(218, 165, 32, 0.9)');
  ringGrad.addColorStop(0.4, 'rgba(238, 232, 170, 0.8)');
  ringGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)'); // Cassini division gap
  ringGrad.addColorStop(0.6, 'rgba(189, 183, 107, 0.7)');
  ringGrad.addColorStop(1, 'rgba(218, 165, 32, 0.1)');

  rCtx.fillStyle = ringGrad;
  rCtx.fillRect(0, 0, 512, 64);

  const ringsTexture = new THREE.CanvasTexture(ringCanvas);

  return { surfaceTexture, ringsTexture };
}

// --- URANUS TEXTURES ---
function createUranusTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#4ea8de');
  bg.addColorStop(0.5, '#90e0ef');
  bg.addColorStop(1, '#4ea8de');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// --- NEPTUNE TEXTURES ---
function createNeptuneTextures() {
  const width = 1024;
  const height = 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#03045e');
  bg.addColorStop(0.5, '#0077b6');
  bg.addColorStop(1, '#03045e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Great Dark Spot
  ctx.fillStyle = '#023e8a';
  ctx.beginPath();
  ctx.ellipse(width * 0.45, height * 0.58, 35, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // White cirrus streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(width * 0.35, height * 0.52, 60, 4);

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;

  return { surfaceTexture };
}

// Helper polygon fill
function drawLandmass(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  width: number,
  height: number
) {
  if (points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * width, points[0][1] * height);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] * width, points[i][1] * height);
  }
  ctx.closePath();
  ctx.fill();
}
