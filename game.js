const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const victoryOverlay = document.getElementById("victoryOverlay");
const victoryVideo = document.getElementById("victoryVideo");
const replayButton = document.getElementById("replayButton");

const W = canvas.width;
const H = canvas.height;
const GROUND_Y = 438;
const WORLD_W = 2880;
const gravity = 0.72;

const keys = new Set();
const heldButtons = new Set();
let lastTime = performance.now();
let cameraX = 0;
let particles = [];
let balls = [];
let gameState = "play";
let finishTimer = 0;
let currentLevel = 0;
let audioCtx = null;
let bgm = null;
let activeBgm = "";
let musicUnlocked = false;
let victoryVideoShown = false;
let victoryCelebrationStarted = false;
let victoryConfettiTimer = 0;

const assets = {
  background: loadAsset("assets/background.png"),
  level2: loadAsset("assets/level-2.png"),
  level3: loadAsset("assets/level-3.png"),
  level4: loadAsset("assets/level-4.png"),
  player: loadAsset("assets/player-crop.png"),
  star: loadAsset("assets/star.png"),
  ball: loadAsset("assets/ball.png"),
  fox: loadAsset("assets/fox.png"),
  hedgehog: loadAsset("assets/hedgehog.png"),
  bossCat: loadAsset("assets/boss-cat-crop.png"),
  flag: loadAsset("assets/flag.png"),
  banner: loadAsset("assets/banner.png")
};

const LEVELS = [
  {
    name: "Sunny Field",
    title: "STAGE 1-1",
    background: "background",
    music: "assets/music-level-1.mp3",
    theme: "field",
    timeLimit: 150,
    starGoal: 8,
    starsTotal: 18,
    goalX: 2700,
    platforms: [
      { x: 390, y: 360, w: 210, h: 26 },
      { x: 760, y: 300, w: 190, h: 26 },
      { x: 1120, y: 350, w: 240, h: 26 },
      { x: 1520, y: 280, w: 190, h: 26 },
      { x: 1900, y: 338, w: 230, h: 26 },
      { x: 2290, y: 292, w: 180, h: 26 }
    ],
    traps: [],
    enemies: [
      { x: 520, y: GROUND_Y - 38, w: 42, h: 38, vx: 0.75, a: 470, b: 680, hp: 1, type: "slime" },
      { x: 980, y: GROUND_Y - 44, w: 48, h: 44, vx: -0.85, a: 900, b: 1160, hp: 2, type: "hedge" },
      { x: 1420, y: GROUND_Y - 38, w: 42, h: 38, vx: 0.95, a: 1330, b: 1600, hp: 1, type: "slime" },
      { x: 2020, y: GROUND_Y - 44, w: 48, h: 44, vx: -0.9, a: 1900, b: 2160, hp: 2, type: "hedge" },
      { x: 2460, y: GROUND_Y - 38, w: 42, h: 38, vx: 1, a: 2380, b: 2610, hp: 1, type: "slime" }
    ],
    friends: [
      { x: 342, y: GROUND_Y - 48, mood: "cheer" },
      { x: 1715, y: GROUND_Y - 42, mood: "wave" }
    ]
  },
  {
    name: "Apple Orchard",
    title: "STAGE 1-2",
    background: "level2",
    music: "assets/music-level-2.mp3",
    theme: "orchard",
    timeLimit: 140,
    starGoal: 10,
    starsTotal: 20,
    goalX: 2780,
    platforms: [
      { x: 310, y: 330, w: 170, h: 26 },
      { x: 620, y: 270, w: 210, h: 26 },
      { x: 1010, y: 350, w: 170, h: 26 },
      { x: 1360, y: 290, w: 240, h: 26 },
      { x: 1760, y: 240, w: 170, h: 26 },
      { x: 2140, y: 330, w: 260, h: 26, move: { axis: "x", min: 2060, max: 2300, speed: 1.2 } }
    ],
    traps: [
      { type: "spike", x: 690, y: GROUND_Y - 20, w: 80, h: 20 },
      { type: "water", x: 1560, y: GROUND_Y - 10, w: 150, h: 12 }
    ],
    enemies: [
      { x: 430, y: GROUND_Y - 42, w: 46, h: 42, vx: 1.05, a: 360, b: 610, hp: 1, type: "mushroom" },
      { x: 880, y: GROUND_Y - 34, w: 42, h: 34, vx: -1.1, a: 760, b: 1040, hp: 1, type: "bee" },
      { x: 1270, y: GROUND_Y - 42, w: 46, h: 42, vx: 0.95, a: 1160, b: 1460, hp: 2, type: "mushroom" },
      { x: 1840, y: GROUND_Y - 34, w: 42, h: 34, vx: -1.25, a: 1720, b: 2040, hp: 1, type: "bee" },
      { x: 2370, y: GROUND_Y - 44, w: 48, h: 44, vx: 0.9, a: 2260, b: 2630, hp: 2, type: "hedge" }
    ],
    friends: [{ x: 570, y: GROUND_Y - 48, mood: "cheer" }]
  },
  {
    name: "Snow Village",
    title: "STAGE 1-3",
    background: "level3",
    music: "assets/music-level-3.mp3",
    theme: "snow",
    timeLimit: 130,
    starGoal: 12,
    starsTotal: 22,
    goalX: 2760,
    platforms: [
      { x: 360, y: 345, w: 210, h: 26 },
      { x: 740, y: 285, w: 170, h: 26 },
      { x: 1060, y: 235, w: 190, h: 26 },
      { x: 1420, y: 320, w: 230, h: 26 },
      { x: 1840, y: 270, w: 210, h: 26, move: { axis: "y", min: 230, max: 330, speed: 1.05 } },
      { x: 2240, y: 350, w: 250, h: 26 }
    ],
    traps: [
      { type: "ice", x: 560, y: GROUND_Y - 8, w: 210, h: 10 },
      { type: "spike", x: 1320, y: GROUND_Y - 20, w: 96, h: 20 },
      { type: "falling", x: 2040, y: 122, w: 34, h: 34, baseY: 122, delay: 0 }
    ],
    enemies: [
      { x: 500, y: GROUND_Y - 52, w: 46, h: 52, vx: 0.7, a: 410, b: 660, hp: 2, type: "snowman" },
      { x: 960, y: GROUND_Y - 36, w: 48, h: 36, vx: -1.3, a: 850, b: 1150, hp: 1, type: "bat" },
      { x: 1380, y: GROUND_Y - 52, w: 46, h: 52, vx: 0.8, a: 1260, b: 1570, hp: 2, type: "snowman" },
      { x: 1940, y: GROUND_Y - 36, w: 48, h: 36, vx: -1.35, a: 1810, b: 2120, hp: 1, type: "bat" },
      { x: 2480, y: GROUND_Y - 52, w: 46, h: 52, vx: 0.9, a: 2350, b: 2660, hp: 3, type: "snowman" }
    ],
    friends: [{ x: 1540, y: GROUND_Y - 42, mood: "wave" }]
  },
  {
    name: "Star Night",
    title: "STAGE 1-4",
    background: "level4",
    music: "assets/music-level-4.mp3",
    theme: "night",
    timeLimit: 120,
    starGoal: 14,
    starsTotal: 24,
    goalX: 2800,
    platforms: [
      { x: 330, y: 310, w: 160, h: 26 },
      { x: 650, y: 250, w: 160, h: 26 },
      { x: 980, y: 340, w: 220, h: 26 },
      { x: 1360, y: 275, w: 180, h: 26 },
      { x: 1710, y: 225, w: 220, h: 26 },
      { x: 2110, y: 315, w: 210, h: 26, move: { axis: "x", min: 2020, max: 2280, speed: 1.45 } },
      { x: 2490, y: 260, w: 170, h: 26 }
    ],
    traps: [
      { type: "spike", x: 520, y: GROUND_Y - 20, w: 92, h: 20 },
      { type: "water", x: 1480, y: GROUND_Y - 10, w: 180, h: 12 },
      { type: "falling", x: 2360, y: 102, w: 38, h: 38, baseY: 102, delay: 40 }
    ],
    enemies: [
      { x: 430, y: GROUND_Y - 36, w: 48, h: 36, vx: 1.2, a: 340, b: 620, hp: 1, type: "bat" },
      { x: 900, y: GROUND_Y - 46, w: 44, h: 46, vx: -0.95, a: 790, b: 1120, hp: 2, type: "ghost" },
      { x: 1320, y: GROUND_Y - 34, w: 42, h: 34, vx: 1.35, a: 1220, b: 1520, hp: 1, type: "bee" },
      { x: 1840, y: GROUND_Y - 46, w: 44, h: 46, vx: -1.05, a: 1710, b: 2030, hp: 2, type: "ghost" },
      { x: 2330, y: GROUND_Y - 36, w: 48, h: 36, vx: 1.35, a: 2200, b: 2580, hp: 1, type: "bat" },
      { x: 2650, y: GROUND_Y - 46, w: 44, h: 46, vx: -1.1, a: 2520, b: 2760, hp: 3, type: "ghost" }
    ],
    friends: [
      { x: 720, y: GROUND_Y - 48, mood: "cheer" },
      { x: 2050, y: GROUND_Y - 42, mood: "wave" }
    ]
  },
  {
    name: "Bowtie Cat Boss",
    title: "FINAL BOSS",
    background: "level4",
    music: "assets/boss-music.mp3",
    theme: "boss",
    timeLimit: 180,
    starGoal: 0,
    starsTotal: 8,
    goalX: 2760,
    platforms: [
      { x: 430, y: 330, w: 180, h: 26 },
      { x: 760, y: 270, w: 180, h: 26 },
      { x: 1110, y: 330, w: 190, h: 26 },
      { x: 1510, y: 285, w: 210, h: 26, move: { axis: "x", min: 1420, max: 1680, speed: 1.55 } },
      { x: 1960, y: 340, w: 170, h: 26 }
    ],
    traps: [
      { type: "spike", x: 920, y: GROUND_Y - 20, w: 100, h: 20 },
      { type: "falling", x: 1830, y: 92, w: 40, h: 40, baseY: 92, delay: 20 }
    ],
    enemies: [
      { x: 620, y: GROUND_Y - 36, w: 48, h: 36, vx: 1.1, a: 520, b: 800, hp: 1, type: "bat" },
      { x: 1250, y: GROUND_Y - 46, w: 44, h: 46, vx: -0.95, a: 1120, b: 1440, hp: 2, type: "ghost" },
      { x: 1770, y: GROUND_Y - 36, w: 48, h: 36, vx: 1.15, a: 1650, b: 1950, hp: 1, type: "bat" }
    ],
    friends: [],
    boss: {
      x: 2320,
      y: GROUND_Y - 182,
      w: 260,
      h: 182,
      hp: 25,
      maxHp: 25,
      inv: 0,
      dir: -1,
      vx: 1.45,
      a: 2220,
      b: 2580,
      attackCd: 70,
      attackTimer: 0,
      clawHit: false,
      summonCd: 210,
      phase2: false
    }
  }
];

const level = {
  score: 0,
  starsTotal: 18,
  goalX: 2700,
  platforms: [
    { x: 390, y: 360, w: 210, h: 26 },
    { x: 760, y: 300, w: 190, h: 26 },
    { x: 1120, y: 350, w: 240, h: 26 },
    { x: 1520, y: 280, w: 190, h: 26 },
    { x: 1900, y: 338, w: 230, h: 26 },
    { x: 2290, y: 292, w: 180, h: 26 }
  ],
  stars: [],
  enemies: [],
  friends: [],
  boss: null,
  traps: [],
  timeLimit: 150,
  timeLeft: 150,
  starGoal: 0,
  goalDeniedTimer: 0
};

const player = {
  x: 92,
  y: GROUND_Y - 72,
  w: 42,
  h: 72,
  vx: 0,
  vy: 0,
  dir: 1,
  hp: 5,
  lives: 3,
  inv: 0,
  onGround: false,
  kickCd: 0,
  blink: 0
};

function setupLevel() {
  const config = LEVELS[currentLevel];
  level.starsTotal = config.starsTotal;
  level.goalX = config.goalX;
  level.timeLimit = config.timeLimit;
  level.timeLeft = config.timeLimit;
  level.starGoal = config.starGoal;
  level.goalDeniedTimer = 0;
  level.platforms = config.platforms.map((p) => ({ ...p, baseX: p.x, baseY: p.y, prevX: p.x, prevY: p.y, phase: Math.random() * Math.PI * 2 }));
  level.enemies = config.enemies.map((e) => {
    const speedScale = 1 + currentLevel * 0.12;
    return { ...e, vx: e.vx * speedScale };
  });
  level.friends = config.friends.map((f) => ({ ...f }));
  level.boss = config.boss ? { ...config.boss } : null;
  level.traps = (config.traps || []).map((t) => ({ ...t, y: t.y ?? t.baseY ?? 0, vy: 0, active: false, resetTimer: 0, phase: Math.random() * 120 }));
  level.stars = [];
  for (let i = 0; i < level.starsTotal; i++) {
    const x = 230 + i * (WORLD_W - 520) / Math.max(1, level.starsTotal - 1) + (i % 3) * 24;
    const y = i % 4 === 0 ? 252 : i % 3 === 0 ? 205 : 354 - (i % 2) * 46;
    level.stars.push({ x, y, r: 15, got: false, bob: Math.random() * 10 });
  }
}

setupLevel();

function loadAsset(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function ready(image) {
  return image && image.complete && image.naturalWidth > 0;
}

function showVictoryVideo() {
  if (!victoryOverlay || !victoryVideo || victoryVideoShown) return;
  victoryVideoShown = true;
  if (bgm) bgm.pause();
  victoryOverlay.classList.add("show");
  victoryOverlay.classList.remove("finished");
  victoryOverlay.setAttribute("aria-hidden", "false");
  victoryVideo.currentTime = 0;
  victoryVideo.play().catch(() => {
    victoryOverlay.classList.add("finished");
  });
}

function hideVictoryVideo() {
  if (!victoryOverlay || !victoryVideo) return;
  victoryVideo.pause();
  victoryVideo.currentTime = 0;
  victoryOverlay.classList.remove("show", "finished");
  victoryOverlay.setAttribute("aria-hidden", "true");
}

if (victoryVideo) {
  victoryVideo.addEventListener("ended", () => {
    victoryOverlay?.classList.add("finished");
  });
}

if (replayButton) {
  replayButton.addEventListener("click", resetGame);
}

function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function unlockMusic() {
  musicUnlocked = true;
  playLevelMusic();
}

function playLevelMusic() {
  const src = LEVELS[currentLevel]?.music;
  if (!musicUnlocked) return;
  if (!src) {
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
    activeBgm = "";
    return;
  }
  if (bgm && activeBgm === src && !bgm.paused) return;

  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
  }

  bgm = new Audio(encodeURI(src));
  activeBgm = src;
  bgm.loop = true;
  bgm.volume = 0.34;
  bgm.play().catch(() => {
    musicUnlocked = false;
  });
}

function playTone({ type = "sine", start = 440, end = 440, duration = 0.16, gain = 0.12 }) {
  const ac = ensureAudio();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(start, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), now + duration);
  vol.gain.setValueAtTime(0.0001, now);
  vol.gain.exponentialRampToValueAtTime(gain, now + 0.015);
  vol.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(vol);
  vol.connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playJumpSound() {
  playTone({ type: "square", start: 290, end: 620, duration: 0.14, gain: 0.08 });
}

function playKickSound() {
  playTone({ type: "triangle", start: 150, end: 85, duration: 0.12, gain: 0.14 });
  setTimeout(() => playTone({ type: "sine", start: 360, end: 230, duration: 0.08, gain: 0.05 }), 35);
}

function playStarSound() {
  playTone({ type: "sine", start: 740, end: 1180, duration: 0.1, gain: 0.09 });
  setTimeout(() => playTone({ type: "sine", start: 980, end: 1560, duration: 0.12, gain: 0.07 }), 70);
}

function playVictorySound() {
  playTone({ type: "triangle", start: 523, end: 784, duration: 0.16, gain: 0.1 });
  setTimeout(() => playTone({ type: "triangle", start: 659, end: 988, duration: 0.16, gain: 0.1 }), 140);
  setTimeout(() => playTone({ type: "sine", start: 784, end: 1318, duration: 0.22, gain: 0.12 }), 280);
  setTimeout(() => playTone({ type: "square", start: 1046, end: 1568, duration: 0.18, gain: 0.06 }), 510);
}

function down(code) {
  return keys.has(code) || heldButtons.has(code);
}

window.addEventListener("keydown", (e) => {
  ensureAudio();
  unlockMusic();
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === "KeyJ" || e.code === "KeyK" || e.code === "Space") kick();
  if (e.code === "KeyR" && gameState !== "play") resetGame();
});

window.addEventListener("keyup", (e) => keys.delete(e.code));

document.querySelectorAll("[data-hold]").forEach((button) => {
  const code = button.dataset.hold === "left" ? "ArrowLeft" : "ArrowRight";
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    ensureAudio();
    unlockMusic();
    heldButtons.add(code);
    button.setPointerCapture(e.pointerId);
  });
  button.addEventListener("pointerup", () => heldButtons.delete(code));
  button.addEventListener("pointercancel", () => heldButtons.delete(code));
  button.addEventListener("pointerleave", () => heldButtons.delete(code));
});

document.querySelectorAll("[data-press]").forEach((button) => {
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    ensureAudio();
    unlockMusic();
    if (button.dataset.press === "jump") jump();
    if (button.dataset.press === "kick") kick();
  });
});

function jump() {
  if (player.onGround && gameState === "play") {
    player.vy = -15.5;
    player.onGround = false;
    playJumpSound();
    puff(player.x + player.w / 2, player.y + player.h, "#f8d98f", 9);
  }
}

function kick() {
  if (player.kickCd > 0 || gameState !== "play") return;
  player.kickCd = 40;
  balls.push({
    x: player.x + player.w / 2 + player.dir * 26,
    y: player.y + 39,
    r: 14,
    vx: player.dir * 11,
    vy: -2.5,
    life: 95,
    spin: 0,
    hitBoss: false
  });
  playKickSound();
  puff(player.x + player.w / 2 + player.dir * 22, player.y + 44, "#ffffff", 8);
}

function resetGame() {
  hideVictoryVideo();
  victoryVideoShown = false;
  victoryCelebrationStarted = false;
  victoryConfettiTimer = 0;
  currentLevel = 0;
  player.x = 92;
  player.y = GROUND_Y - 72;
  player.vx = 0;
  player.vy = 0;
  player.hp = 5;
  player.lives = 3;
  player.dir = 1;
  level.score = 0;
  balls = [];
  particles = [];
  cameraX = 0;
  finishTimer = 0;
  gameState = "play";
  setupLevel();
  playLevelMusic();
}

function startLevel() {
  player.x = 92;
  player.y = GROUND_Y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.dir = 1;
  player.hp = Math.min(5, player.hp + 1);
  player.inv = 90;
  balls = [];
  particles = [];
  cameraX = 0;
  finishTimer = 0;
  gameState = "play";
  setupLevel();
  playLevelMusic();
}

function finishLevel() {
  const finalLevel = currentLevel === LEVELS.length - 1;
  gameState = finalLevel ? "win" : "clear";
  finishTimer = 0;
  if (finalLevel) {
    victoryCelebrationStarted = true;
    victoryVideoShown = false;
    victoryConfettiTimer = 0;
    if (bgm) bgm.pause();
    playVictorySound();
  }
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: player.x + Math.random() * 80 - 40,
      y: player.y + Math.random() * 70,
      vx: Math.random() * 8 - 4,
      vy: Math.random() * -8 - 2,
      life: 80,
      color: ["#ffd84a", "#ff6758", "#80e37d", "#67c5ff"][i % 4],
      size: 4 + Math.random() * 4
    });
  }
}

function rectsHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectHit(c, r) {
  const cx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(c.y, r.y + r.h));
  return (c.x - cx) ** 2 + (c.y - cy) ** 2 < c.r ** 2;
}

function update(dt) {
  if (gameState !== "play") {
    finishTimer += dt;
    if (gameState === "win") {
      updateVictoryCelebration(dt);
      if (finishTimer > 190) showVictoryVideo();
    }
    updateParticles();
    if (gameState === "clear" && finishTimer > 105) {
      currentLevel++;
      startLevel();
    }
    return;
  }

  const left = down("ArrowLeft") || down("KeyA");
  const right = down("ArrowRight") || down("KeyD");
  if ((down("ArrowUp") || down("KeyW")) && player.onGround) jump();
  level.timeLeft = Math.max(0, level.timeLeft - dt / 60);
  if (level.timeLeft <= 0) {
    loseLifeToTimer();
    return;
  }

  player.vx *= 0.82;
  if (isPlayerOnTrap("ice")) player.vx *= 0.98;
  if (isPlayerOnTrap("water")) player.vx *= 0.62;
  if (left) {
    player.vx -= 0.75;
    player.dir = -1;
  }
  if (right) {
    player.vx += 0.75;
    player.dir = 1;
  }
  player.vx = Math.max(-5.4, Math.min(5.4, player.vx));
  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(20, Math.min(WORLD_W - player.w - 30, player.x));
  updateBoss();
  if (level.boss && level.boss.hp > 0) {
    player.x = Math.min(player.x, level.boss.x - player.w - 24);
  }
  updatePlatforms();

  player.onGround = false;
  if (player.y + player.h >= GROUND_Y) {
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  for (const p of level.platforms) {
    const wasAbove = player.y + player.h - player.vy <= p.y + 8;
    if (rectsHit(player, p) && player.vy >= 0 && wasAbove) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.x += (p.x - p.prevX) || 0;
      player.y += (p.y - p.prevY) || 0;
    }
  }

  if (player.kickCd > 0) player.kickCd--;
  if (player.inv > 0) player.inv--;
  player.blink += 0.18;

  updateTraps();
  updateBalls();
  updateEnemies();
  collectStars();
  updateParticles();

  cameraX += (player.x - W * 0.42 - cameraX) * 0.08;
  cameraX = Math.max(0, Math.min(WORLD_W - W, cameraX));

  if (player.x > level.goalX && (!level.boss || level.boss.hp <= 0)) {
    if (collectedStars() >= level.starGoal) {
      finishLevel();
    } else {
      level.goalDeniedTimer = 90;
      player.x = level.goalX - 25;
      player.vx = -5;
      playTone({ type: "square", start: 170, end: 120, duration: 0.16, gain: 0.08 });
    }
  }
}

function collectedStars() {
  return level.stars.filter((s) => s.got).length;
}

function loseLifeToTimer() {
  player.lives--;
  puff(player.x + player.w / 2, player.y + 30, "#ffcf6f", 28);
  playTone({ type: "sawtooth", start: 190, end: 70, duration: 0.24, gain: 0.12 });
  if (player.lives <= 0) {
    gameState = "lose";
    finishTimer = 0;
    return;
  }
  player.hp = 5;
  startLevel();
}

function updateBalls() {
  for (const ball of balls) {
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += 0.32;
    ball.spin += ball.vx * 0.08;
    ball.life--;
    if (ball.y + ball.r > GROUND_Y) {
      ball.y = GROUND_Y - ball.r;
      ball.vy *= -0.72;
      ball.vx *= 0.92;
      puff(ball.x, ball.y + ball.r, "#d8f6ff", 4);
    }

    for (const p of level.platforms) {
      if (circleRectHit(ball, p) && ball.vy > 0) {
        ball.y = p.y - ball.r;
        ball.vy *= -0.72;
      }
    }

    for (const enemy of level.enemies) {
      if (enemy.hp > 0 && circleRectHit(ball, enemy)) {
        enemy.hp--;
        ball.vx *= -0.45;
        ball.vy = -7;
        level.score += 500;
        puff(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffe070", 16);
      }
    }

    if (level.boss && level.boss.hp > 0 && !ball.hitBoss && circleRectHit(ball, bossBodyRect(level.boss))) {
      ball.hitBoss = true;
      level.boss.hp--;
      level.boss.inv = 12;
      ball.vx = (ball.x < level.boss.x + level.boss.w / 2 ? -1 : 1) * Math.max(6, Math.abs(ball.vx) * 0.62);
      ball.vy = -9;
      level.score += 800;
      puff(ball.x, ball.y, "#ffcf6f", 26);
      playTone({ type: "sawtooth", start: 170, end: 95, duration: 0.14, gain: 0.12 });
      if (level.boss.hp <= 0) {
        level.score += 5000;
        puff(level.boss.x + level.boss.w / 2, level.boss.y + level.boss.h / 2, "#ffd84a", 80);
        finishLevel();
      }
    }
  }
  balls = balls.filter((ball) => ball.life > 0 && ball.x > cameraX - 80 && ball.x < cameraX + W + 120);
}

function updatePlatforms() {
  for (const p of level.platforms) {
    p.prevX = p.x;
    p.prevY = p.y;
    if (!p.move) continue;
    const range = p.move.max - p.move.min;
    const mid = (p.move.max + p.move.min) / 2;
    const offset = Math.sin(performance.now() / 520 * p.move.speed + p.phase) * range / 2;
    if (p.move.axis === "x") p.x = mid + offset;
    if (p.move.axis === "y") p.y = mid + offset;
  }
}

function updateTraps() {
  for (const trap of level.traps) {
    if (trap.type === "falling") {
      const near = Math.abs(player.x + player.w / 2 - (trap.x + trap.w / 2)) < 130;
      if (!trap.active && near && trap.resetTimer <= 0) trap.active = true;
      if (trap.active) {
        trap.y += trap.vy;
        trap.vy += 0.55;
        if (trap.y + trap.h >= GROUND_Y) {
          trap.y = GROUND_Y - trap.h;
          trap.active = false;
          trap.resetTimer = 120;
          trap.vy = 0;
          puff(trap.x + trap.w / 2, trap.y + trap.h, "#d5d5d5", 12);
        }
      } else if (trap.resetTimer > 0) {
        trap.resetTimer--;
        if (trap.resetTimer <= 0) {
          trap.y = trap.baseY;
        }
      }
    }

    const hitBox = trapHitBox(trap);
    if (hitBox && player.inv <= 0 && rectsHit(player, hitBox)) {
      hurtPlayer(trap.type === "falling" ? 2 : 1, player.x < trap.x ? -12 : 12, -11, 110);
    }
  }
}

function trapHitBox(trap) {
  if (trap.type === "spike") return { x: trap.x + 4, y: trap.y + 4, w: trap.w - 8, h: trap.h - 4 };
  if (trap.type === "falling" && (trap.active || trap.y > trap.baseY + 10)) return trap;
  return null;
}

function isPlayerOnTrap(type) {
  return level.traps.some((trap) => trap.type === type && rectsHit(player, { x: trap.x, y: trap.y - 4, w: trap.w, h: trap.h + 10 }));
}

function updateBoss() {
  if (level.boss && level.boss.hp > 0) {
    const boss = level.boss;
    if (!boss.phase2 && boss.hp <= boss.maxHp / 2) {
      boss.phase2 = true;
      boss.vx *= 1.45;
      boss.attackCd = Math.min(boss.attackCd, 36);
      puff(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ff5d73", 70);
    }

    boss.x += boss.vx;
    if (boss.x < boss.a || boss.x > boss.b) boss.vx *= -1;
    boss.dir = player.x < boss.x ? -1 : 1;
    boss.attackCd = Math.max(0, (boss.attackCd || 0) - 1);
    boss.attackTimer = Math.max(0, (boss.attackTimer || 0) - 1);
    if (Math.abs(player.x + player.w / 2 - (boss.x + boss.w / 2)) < 360 && boss.attackCd <= 0) {
      boss.attackTimer = boss.phase2 ? 28 : 42;
      boss.attackCd = boss.phase2 ? 66 : 112;
      boss.clawHit = false;
      playTone({ type: "square", start: 120, end: 70, duration: 0.18, gain: 0.08 });
    }

    boss.summonCd = Math.max(0, (boss.summonCd || 0) - 1);
    if (boss.summonCd <= 0) {
      summonBossMinion();
      boss.summonCd = boss.phase2 ? 135 : 210;
    }

    level.boss.inv = Math.max(0, (level.boss.inv || 0) - 1);
    level.boss.y = GROUND_Y - level.boss.h + Math.sin(performance.now() / 450) * 4;
    const claw = bossClawRect(level.boss);
    if (claw && !boss.clawHit && player.inv <= 0 && rectsHit(player, claw)) {
      boss.clawHit = true;
      hurtPlayer(2, -15, -13, 120);
    }

    if (player.inv <= 0 && rectsHit(player, bossBodyRect(level.boss))) {
      hurtPlayer(1, -12, -11, 95);
    }
  }
}

function summonBossMinion() {
  const boss = level.boss;
  const type = boss.phase2 ? "ghost" : "bat";
  const x = boss.x - 250;
  const y = type === "ghost" ? GROUND_Y - 46 : GROUND_Y - 36;
  level.enemies.push({
    x,
    y,
    w: type === "ghost" ? 44 : 48,
    h: type === "ghost" ? 46 : 36,
    vx: boss.phase2 ? -1.65 : -1.35,
    a: Math.max(80, x - 220),
    b: Math.min(WORLD_W - 120, x + 160),
    hp: type === "ghost" ? 2 : 1,
    type
  });
  puff(x, y, "#a8aff2", 24);
}

function hurtPlayer(amount, vx, vy, inv) {
  player.hp -= amount;
  player.inv = inv;
  player.vx = vx * 1.22;
  player.vy = vy;
  puff(player.x + player.w / 2, player.y + 34, "#ff8780", 18);
  if (player.hp <= 0) {
    player.lives--;
    if (player.lives <= 0) {
      gameState = "lose";
      finishTimer = 0;
    } else {
      player.hp = 5;
      player.x = Math.max(60, player.x - 260);
      player.y = GROUND_Y - player.h;
      player.inv = 130;
    }
  }
}

function bossClawRect(boss) {
  const activeStart = boss.phase2 ? 22 : 28;
  const activeEnd = boss.phase2 ? 6 : 10;
  if (!boss || boss.attackTimer <= 0 || boss.attackTimer > activeStart || boss.attackTimer < activeEnd) return null;
  const facingLeft = boss.dir !== 1;
  return {
    x: facingLeft ? boss.x - 128 : boss.x + boss.w - 10,
    y: boss.y + 72,
    w: 138,
    h: 48
  };
}

function bossBodyRect(boss) {
  return {
    x: boss.x - 72,
    y: boss.y + 8,
    w: boss.w + 118,
    h: boss.h - 4
  };
}

function updateEnemies() {
  for (const enemy of level.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.x += enemy.vx;
    if (enemy.x < enemy.a || enemy.x > enemy.b) enemy.vx *= -1;
    if (player.inv <= 0 && rectsHit(player, enemy)) {
      player.hp--;
      player.inv = 80;
      player.vx = enemy.x < player.x ? 8 : -8;
      player.vy = -8;
      puff(player.x + player.w / 2, player.y + 34, "#ff8780", 14);
      if (player.hp <= 0) {
        player.lives--;
        if (player.lives <= 0) {
          gameState = "lose";
          finishTimer = 0;
        } else {
          player.hp = 5;
          player.x = Math.max(60, player.x - 230);
          player.y = GROUND_Y - player.h;
          player.inv = 120;
        }
      }
    }
  }
}

function collectStars() {
  for (const star of level.stars) {
    if (star.got) continue;
    const hit = player.x < star.x + star.r && player.x + player.w > star.x - star.r &&
      player.y < star.y + star.r && player.y + player.h > star.y - star.r;
    if (hit) {
      star.got = true;
      level.score += 250;
      playStarSound();
      puff(star.x, star.y, "#ffe27a", 18);
    }
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.life--;
  }
  particles = particles.filter((p) => p.life > 0);
}

function updateVictoryCelebration(dt) {
  victoryConfettiTimer -= dt;
  if (victoryConfettiTimer > 0) return;
  victoryConfettiTimer = 3;
  const colors = ["#ffd84a", "#ff5d73", "#54e8ff", "#80e37d", "#c98cff", "#ffffff"];
  for (let i = 0; i < 10; i++) {
    particles.push({
      x: cameraX + Math.random() * W,
      y: -20 - Math.random() * 60,
      vx: Math.random() * 4 - 2,
      vy: 2 + Math.random() * 4,
      life: 90 + Math.random() * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 6
    });
  }
}

function puff(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: Math.random() * 6 - 3,
      vy: Math.random() * -5 - 1,
      life: 24 + Math.random() * 22,
      color,
      size: 2 + Math.random() * 5
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawSky();
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawWorld();
  ctx.restore();
  drawHud();
  if (gameState === "clear") drawOverlay("STAGE CLEAR!", "下一关马上开始");
  if (gameState === "win") drawOverlay("ALL CLEAR!", "撒花庆祝中...");
  if (gameState === "lose") drawOverlay("TRY AGAIN", "按 R 重新挑战");
}

function drawSky() {
  const config = LEVELS[currentLevel];
  const bg = assets[config.background];
  if (ready(bg)) {
    ctx.drawImage(bg, -cameraX, 0, WORLD_W, H);
    return;
  }

  drawThemedSky(config.theme);
}

function drawThemedSky(theme) {
  if (theme === "orchard") {
    drawGradientScene("#39b8f0", "#ffe49c", "#72c653");
    for (let i = 0; i < 20; i++) drawFruitTree(i * 155 - (cameraX * 0.25) % 155, GROUND_Y - 92, i % 2);
    return;
  }
  if (theme === "snow") {
    drawGradientScene("#8dd8ff", "#f4fbff", "#dff7ff");
    for (let i = 0; i < 16; i++) drawPine(i * 190 - (cameraX * 0.3) % 190, GROUND_Y - 122, 1 + (i % 3) * 0.12);
    return;
  }
  if (theme === "night") {
    drawGradientScene("#13224f", "#293b75", "#49635f");
    drawMoon(W - 120, 92);
    for (let i = 0; i < 44; i++) {
      ctx.fillStyle = i % 3 ? "#fff6ad" : "#ffffff";
      ctx.fillRect((i * 83 - cameraX * 0.12) % W, 30 + (i * 47) % 180, 3, 3);
    }
    return;
  }
  if (theme === "boss") {
    drawGradientScene("#21183c", "#4c3b78", "#5a475d");
    drawMoon(W - 120, 92);
    ctx.fillStyle = "rgba(255, 218, 115, 0.9)";
    for (let i = 0; i < 28; i++) ctx.fillRect((i * 117 - cameraX * 0.1) % W, 42 + (i * 39) % 170, 4, 4);
    return;
  }

  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, "#27a9ea");
  grd.addColorStop(0.58, "#7fdbff");
  grd.addColorStop(1, "#59c45b");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  drawSun(W - 115, 86);
  for (let i = 0; i < 8; i++) {
    drawCloud((i * 220 - cameraX * 0.25) % (W + 260) - 130, 86 + (i % 3) * 55, 0.78 + (i % 2) * 0.18);
  }

  ctx.fillStyle = "#328c4c";
  for (let i = 0; i < 34; i++) {
    const x = i * 110 - (cameraX * 0.45) % 110;
    drawBush(x, GROUND_Y - 44, 44 + (i % 4) * 10);
  }
}

function drawWorld() {
  const bg = assets[LEVELS[currentLevel].background];
  if (!ready(bg)) drawGround();
  for (const trap of level.traps) drawTrap(trap);
  for (const p of level.platforms) drawPlatform(p.x, p.y, p.w, p.h);
  for (const friend of level.friends) drawFriend(friend);
  for (const star of level.stars) if (!star.got) drawStar(star.x, star.y + Math.sin(performance.now() / 260 + star.bob) * 6, star.r);
  for (const enemy of level.enemies) if (enemy.hp > 0) drawEnemy(enemy);
  if (level.boss && level.boss.hp > 0) drawBoss(level.boss);
  for (const ball of balls) drawBall(ball.x, ball.y, ball.r, ball.spin);
  if (!level.boss || level.boss.hp <= 0) drawGoal(level.goalX + 80, GROUND_Y);
  drawPlayer(player);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 45);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1;
  }
}

function drawGround() {
  const theme = LEVELS[currentLevel].theme;
  ctx.fillStyle = theme === "snow" ? "#e8fbff" : theme === "night" ? "#4b6276" : theme === "orchard" ? "#9bd74a" : "#65c948";
  ctx.fillRect(0, GROUND_Y, WORLD_W, 38);
  ctx.fillStyle = theme === "snow" ? "#b8e8f1" : theme === "night" ? "#8da1b0" : "#2e962f";
  for (let x = 0; x < WORLD_W; x += 42) {
    ctx.fillRect(x + 8, GROUND_Y + 8, 18, 5);
    ctx.fillRect(x + 25, GROUND_Y + 17, 12, 4);
  }
  ctx.fillStyle = theme === "snow" ? "#8c7b70" : theme === "night" ? "#3d3349" : "#87512d";
  ctx.fillRect(0, GROUND_Y + 38, WORLD_W, 102);
  ctx.fillStyle = theme === "snow" ? "#65584f" : theme === "night" ? "#282037" : "#5d351e";
  for (let x = 0; x < WORLD_W; x += 50) {
    ctx.beginPath();
    ctx.ellipse(x + 24, GROUND_Y + 60, 25, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(x, y, w, h) {
  const theme = LEVELS[currentLevel].theme;
  ctx.fillStyle = theme === "snow" ? "#7b6c62" : theme === "night" ? "#4a365d" : "#8f542d";
  roundRect(x, y, w, h, 6, true);
  ctx.fillStyle = theme === "snow" ? "#e9fbff" : theme === "night" ? "#6d75b8" : theme === "orchard" ? "#a5d94a" : "#4eb949";
  ctx.fillRect(x, y - 8, w, 12);
  ctx.fillStyle = theme === "snow" ? "#b9e5ee" : theme === "night" ? "#a8aff2" : "#2e8b35";
  for (let i = 8; i < w; i += 28) ctx.fillRect(x + i, y - 6, 11, 4);
}

function drawTrap(trap) {
  if (trap.type === "spike") {
    ctx.fillStyle = "#c9d1d8";
    ctx.strokeStyle = "#58606a";
    ctx.lineWidth = 2;
    for (let x = trap.x; x < trap.x + trap.w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, trap.y + trap.h);
      ctx.lineTo(x + 9, trap.y);
      ctx.lineTo(x + 18, trap.y + trap.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    return;
  }

  if (trap.type === "water") {
    ctx.fillStyle = "rgba(42, 170, 232, 0.72)";
    roundRect(trap.x, trap.y, trap.w, trap.h, 6, true);
    ctx.fillStyle = "rgba(205, 245, 255, 0.9)";
    for (let x = trap.x + 8; x < trap.x + trap.w; x += 32) ctx.fillRect(x, trap.y + 4, 16, 3);
    return;
  }

  if (trap.type === "ice") {
    ctx.fillStyle = "rgba(213, 250, 255, 0.82)";
    roundRect(trap.x, trap.y, trap.w, trap.h, 4, true);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(trap.x + 12, trap.y + 2, trap.w - 24, 2);
    return;
  }

  if (trap.type === "falling") {
    ctx.fillStyle = trap.active ? "#8a8d94" : "#b7bbc2";
    ctx.strokeStyle = "#545963";
    ctx.lineWidth = 3;
    roundRect(trap.x, trap.y, trap.w, trap.h, 6, true);
    roundRect(trap.x, trap.y, trap.w, trap.h, 6, false);
    ctx.fillStyle = "#d9dde3";
    ctx.fillRect(trap.x + 8, trap.y + 8, trap.w - 16, 5);
  }
}

function drawPlayer(p) {
  if (p.inv > 0 && Math.floor(p.blink * 9) % 2 === 0) return;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y);
  ctx.scale(p.dir, 1);

  if (ready(assets.player)) {
    const run = Math.sin(performance.now() / 95) * Math.min(1, Math.abs(p.vx || 0) / 4);
    const jumpLift = p.onGround ? 0 : -6;
    const drawW = 98;
    const drawH = 154;
    ctx.fillStyle = "rgba(55, 32, 20, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, 80, 27, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(assets.player, -drawW / 2, -58 + jumpLift + run * 2, drawW, drawH);
    ctx.restore();
    return;
  }

  const run = Math.sin(performance.now() / 95) * Math.min(1, Math.abs(p.vx || 0) / 4);
  const jumpLift = p.onGround ? 0 : -4;

  ctx.fillStyle = "rgba(55, 32, 20, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 80, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8e5c31";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, 64);
  ctx.lineTo(-21, 77 - run * 3);
  ctx.moveTo(12, 64);
  ctx.lineTo(22, 77 + run * 3);
  ctx.stroke();

  ctx.fillStyle = "#ffd0a1";
  ctx.beginPath();
  ctx.ellipse(-22, 78 - run * 3, 8, 4, -0.1, 0, Math.PI * 2);
  ctx.ellipse(23, 78 + run * 3, 8, 4, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#74bde0";
  ctx.strokeStyle = "#3a7898";
  ctx.lineWidth = 3;
  roundRect(-19, 36 + jumpLift, 38, 31, 10, true);
  roundRect(-19, 36 + jumpLift, 38, 31, 10, false);
  ctx.fillStyle = "#9ed7ee";
  ctx.fillRect(-8, 39 + jumpLift, 16, 5);
  ctx.fillStyle = "#5da9cf";
  ctx.fillRect(-13, 63 + jumpLift, 10, 11);
  ctx.fillRect(3, 63 + jumpLift, 10, 11);

  ctx.strokeStyle = "#ffd0a1";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-17, 43 + jumpLift);
  ctx.lineTo(-29, 58 + run * 4);
  ctx.moveTo(17, 43 + jumpLift);
  ctx.lineTo(31, 34 - run * 2);
  ctx.stroke();

  ctx.fillStyle = "#f2a074";
  ctx.beginPath();
  ctx.arc(-30, 59 + run * 4, 4, 0, Math.PI * 2);
  ctx.arc(32, 33 - run * 2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffd0a1";
  ctx.strokeStyle = "#9e6644";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 20 + jumpLift, 25, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffd0a1";
  ctx.beginPath();
  ctx.arc(-23, 22 + jumpLift, 6, 0, Math.PI * 2);
  ctx.arc(23, 22 + jumpLift, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e88f6a";
  ctx.fillRect(-25, 22 + jumpLift, 3, 4);
  ctx.fillRect(22, 22 + jumpLift, 3, 4);

  ctx.fillStyle = "#111821";
  ctx.beginPath();
  ctx.moveTo(-25, 12 + jumpLift);
  ctx.quadraticCurveTo(-22, -6 + jumpLift, -8, -5 + jumpLift);
  ctx.lineTo(-5, -12 + jumpLift);
  ctx.lineTo(1, -5 + jumpLift);
  ctx.lineTo(8, -13 + jumpLift);
  ctx.lineTo(12, -4 + jumpLift);
  ctx.lineTo(20, 0 + jumpLift);
  ctx.quadraticCurveTo(26, 7 + jumpLift, 23, 18 + jumpLift);
  ctx.quadraticCurveTo(14, 7 + jumpLift, 2, 8 + jumpLift);
  ctx.quadraticCurveTo(-12, 8 + jumpLift, -25, 12 + jumpLift);
  ctx.fill();

  ctx.fillStyle = "#26303a";
  ctx.fillRect(-16, 3 + jumpLift, 8, 3);
  ctx.fillRect(-2, -1 + jumpLift, 7, 3);
  ctx.fillRect(10, 2 + jumpLift, 8, 3);

  ctx.fillStyle = "#121820";
  ctx.beginPath();
  ctx.arc(-8, 21 + jumpLift, 4.5, 0, Math.PI * 2);
  ctx.arc(10, 21 + jumpLift, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-6.4, 19.4 + jumpLift, 1.4, 0, Math.PI * 2);
  ctx.arc(11.6, 19.4 + jumpLift, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f58d78";
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(-16, 30 + jumpLift, 6, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(17, 30 + jumpLift, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "#7d2d25";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(2, 27 + jumpLift, 9, 0.12, Math.PI - 0.12);
  ctx.stroke();
  ctx.fillStyle = "#b9332e";
  ctx.fillRect(-2, 33 + jumpLift, 8, 3);
  ctx.restore();
}

function drawEnemy(e) {
  if (e.type === "hedge" && ready(assets.hedgehog)) {
    const bob = Math.sin(performance.now() / 180 + e.x) * 2;
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    ctx.scale(e.vx < 0 ? -1 : 1, 1);
    ctx.drawImage(assets.hedgehog, -34, -70 + bob, 68, 86);
    ctx.restore();
    return;
  }

  if (e.type === "mushroom") {
    drawMushroomEnemy(e);
    return;
  }
  if (e.type === "bee") {
    drawBeeEnemy(e);
    return;
  }
  if (e.type === "snowman") {
    drawSnowmanEnemy(e);
    return;
  }
  if (e.type === "bat") {
    drawBatEnemy(e);
    return;
  }
  if (e.type === "ghost") {
    drawGhostEnemy(e);
    return;
  }

  if (e.type === "slime") {
    ctx.fillStyle = "#ef704e";
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2 + 6, e.w / 2, e.h / 2, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(e.x + e.w, e.y + e.h);
    ctx.lineTo(e.x, e.y + e.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(e.x + 11, e.y + 15, 5, 5);
    ctx.fillRect(e.x + 27, e.y + 15, 5, 5);
  } else {
    ctx.fillStyle = "#d29a5c";
    ctx.beginPath();
    ctx.ellipse(e.x + 24, e.y + 25, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8c5c32";
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(e.x + 5 + i * 7, e.y + 13);
      ctx.lineTo(e.x + 2 + i * 7, e.y + 2);
      ctx.lineTo(e.x + 12 + i * 7, e.y + 12);
      ctx.fill();
    }
    ctx.fillStyle = "#111";
    ctx.fillRect(e.x + 32, e.y + 22, 4, 4);
  }
}

function drawBoss(boss) {
  const flash = boss.inv > 0 && Math.floor(performance.now() / 70) % 2 === 0;
  ctx.save();
  if (flash) ctx.globalAlpha = 0.58;
  ctx.fillStyle = "rgba(30, 20, 35, 0.28)";
  ctx.beginPath();
  ctx.ellipse(boss.x + boss.w / 2, GROUND_Y + 4, 148, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  if (ready(assets.bossCat)) {
    ctx.drawImage(assets.bossCat, boss.x - 92, boss.y - 88, 470, 270);
  } else {
    drawFallbackBossCat(boss);
  }
  drawBossClaw(boss);
  ctx.restore();
}

function drawBossClaw(boss) {
  if (!boss.attackTimer) return;
  const claw = bossClawRect(boss);
  const facingLeft = boss.dir !== 1;
  const windup = !claw;
  const baseX = facingLeft ? boss.x + 20 : boss.x + boss.w - 26;
  const baseY = boss.y + 98;
  const reachX = facingLeft ? boss.x - 104 : boss.x + boss.w + 88;
  const pawX = windup ? baseX : reachX;
  const pawY = windup ? baseY - 34 : baseY - 2;

  ctx.save();
  ctx.globalAlpha = windup ? 0.75 : 1;
  ctx.strokeStyle = "#f3eadc";
  ctx.lineWidth = windup ? 12 : 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo((baseX + pawX) / 2, baseY - 28, pawX, pawY);
  ctx.stroke();

  ctx.fillStyle = "#f7efe2";
  ctx.beginPath();
  ctx.ellipse(pawX, pawY, 28, 20, facingLeft ? -0.12 : 0.12, 0, Math.PI * 2);
  ctx.fill();

  if (!windup) {
    ctx.strokeStyle = "#3b3533";
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(pawX + (facingLeft ? -18 : 18), pawY + i * 7);
      ctx.lineTo(pawX + (facingLeft ? -36 : 36), pawY + i * 7 - 4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawFallbackBossCat(boss) {
  const x = boss.x;
  const y = boss.y;
  ctx.fillStyle = "#f5eedf";
  ctx.beginPath();
  ctx.ellipse(x + 138, y + 112, 130, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#56514d";
  ctx.beginPath();
  ctx.ellipse(x + 80, y + 58, 62, 56, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 184, y + 84, 55, 45, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f5eedf";
  ctx.beginPath();
  ctx.ellipse(x + 78, y + 72, 32, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#56514d";
  ctx.beginPath();
  ctx.moveTo(x + 38, y + 28);
  ctx.lineTo(x + 18, y - 18);
  ctx.lineTo(x + 70, y + 9);
  ctx.moveTo(x + 108, y + 14);
  ctx.lineTo(x + 142, y - 20);
  ctx.lineTo(x + 138, y + 37);
  ctx.fill();
  ctx.fillStyle = "#f0a9a2";
  ctx.beginPath();
  ctx.moveTo(x + 75, y + 76);
  ctx.lineTo(x + 86, y + 76);
  ctx.lineTo(x + 80, y + 84);
  ctx.fill();
  ctx.fillStyle = "#211f24";
  ctx.fillRect(x + 55, y + 55, 8, 8);
  ctx.fillRect(x + 101, y + 55, 8, 8);
  ctx.fillStyle = "#7b1230";
  ctx.beginPath();
  ctx.moveTo(x + 68, y + 104);
  ctx.lineTo(x + 32, y + 88);
  ctx.lineTo(x + 52, y + 126);
  ctx.lineTo(x + 68, y + 104);
  ctx.lineTo(x + 104, y + 88);
  ctx.lineTo(x + 86, y + 126);
  ctx.fill();
  ctx.fillStyle = "#4b4644";
  ctx.beginPath();
  ctx.ellipse(x + 265, y + 72, 24, 95, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFriend(f) {
  if (ready(assets.fox)) {
    const bob = Math.sin(performance.now() / 220 + f.x) * 2;
    ctx.drawImage(assets.fox, f.x - 35, f.y - 51 + bob, 70, 104);
    return;
  }

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.fillStyle = "#f55746";
  ctx.beginPath();
  ctx.arc(0, 24, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff4d6";
  ctx.beginPath();
  ctx.arc(0, 18, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.fillRect(-8, 14, 4, 4);
  ctx.fillRect(6, 14, 4, 4);
  ctx.strokeStyle = "#8a2a24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 18, 9, 0.25, Math.PI - 0.25);
  ctx.stroke();
  ctx.restore();
}

function drawBall(x, y, r, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  if (ready(assets.ball)) {
    ctx.drawImage(assets.ball, -r, -r, r * 2, r * 2);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101018";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#17171f";
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 0.4;
    ctx.fillRect(Math.cos(a) * 7 - 3, Math.sin(a) * 7 - 3, 6, 6);
  }
  ctx.restore();
}

function drawStar(x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (ready(assets.star)) {
    ctx.rotate(Math.sin(performance.now() / 350 + x) * 0.08);
    ctx.drawImage(assets.star, -r * 1.35, -r * 1.35, r * 2.7, r * 2.7);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#ffe36a";
  ctx.strokeStyle = "#a96812";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGoal(x, groundY) {
  if (ready(assets.flag)) {
    ctx.drawImage(assets.flag, x - 36, groundY - 132, 116, 132);
    ctx.fillStyle = "#fff";
    ctx.font = "700 22px Trebuchet MS";
    ctx.fillText("GOAL", x - 18, groundY - 142);
    return;
  }

  ctx.fillStyle = "#f8df72";
  ctx.fillRect(x, groundY - 102, 10, 102);
  ctx.fillStyle = "#df3f35";
  ctx.fillRect(x + 10, groundY - 100, 82, 48);
  ctx.fillStyle = "#ffd850";
  ctx.beginPath();
  ctx.moveTo(x + 37, groundY - 90);
  ctx.lineTo(x + 45, groundY - 72);
  ctx.lineTo(x + 26, groundY - 82);
  ctx.lineTo(x + 48, groundY - 82);
  ctx.lineTo(x + 29, groundY - 70);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "700 22px Trebuchet MS";
  ctx.fillText("GOAL", x - 18, groundY - 122);
}

function drawHud() {
  ctx.fillStyle = "rgba(22, 30, 54, 0.88)";
  roundRect(14, 12, W - 28, 72, 8, true);
  ctx.strokeStyle = "#f2c26d";
  ctx.lineWidth = 4;
  roundRect(14, 12, W - 28, 72, 8, false);

  drawPortrait(38, 25);
  ctx.fillStyle = "#fff5d5";
  ctx.font = "800 24px Trebuchet MS";
  ctx.fillText(`× ${String(player.lives).padStart(2, "0")}`, 112, 54);

  for (let i = 0; i < 5; i++) drawHeart(235 + i * 32, 47, i < player.hp);

  ctx.textAlign = "center";
  ctx.font = "800 20px Trebuchet MS";
  ctx.fillStyle = "#ffe18b";
  ctx.fillText("SCORE", W / 2, 36);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px Trebuchet MS";
  ctx.fillText(String(level.score).padStart(7, "0"), W / 2, 66);
  ctx.textAlign = "left";

  const gotStars = level.stars.filter((s) => s.got).length;
  drawStar(W - 210, 48, 16);
  ctx.fillStyle = "#fff7da";
  ctx.font = "800 25px Trebuchet MS";
  ctx.fillText(`× ${String(gotStars).padStart(2, "0")}/${level.starsTotal}`, W - 180, 56);
  drawBall(W - 64, 48, 15, performance.now() / 240);

  ctx.textAlign = "center";
  ctx.fillStyle = "#8fe7ff";
  ctx.font = "800 16px Trebuchet MS";
  const need = level.starGoal > 0 ? `  STAR GOAL ${gotStars}/${level.starGoal}` : "";
  const timeColor = level.timeLeft < 20 ? "#ff8a75" : "#8fe7ff";
  ctx.fillText(`${LEVELS[currentLevel].title}  ${LEVELS[currentLevel].name}${need}`, W / 2, 82);
  ctx.fillStyle = timeColor;
  ctx.fillText(`TIME ${Math.ceil(level.timeLeft)}`, 122, 82);
  ctx.textAlign = "left";

  drawKickCooldown();
  if (level.goalDeniedTimer > 0) drawGoalDeniedMessage();
  if (level.boss && level.boss.hp > 0) drawBossHealthBar(level.boss);
}

function drawKickCooldown() {
  const x = W - 174;
  const y = 88;
  const w = 124;
  const h = 12;
  const pct = 1 - Math.min(1, player.kickCd / 40);
  ctx.fillStyle = "rgba(16, 24, 42, 0.82)";
  roundRect(x, y, w, h, 4, true);
  ctx.fillStyle = pct >= 1 ? "#67e07d" : "#f3c66d";
  roundRect(x + 3, y + 3, (w - 6) * pct, h - 6, 3, true);
  ctx.fillStyle = "#fff7da";
  ctx.font = "800 11px Trebuchet MS";
  ctx.fillText("KICK", x - 38, y + 10);
}

function drawGoalDeniedMessage() {
  level.goalDeniedTimer--;
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4dc";
  ctx.strokeStyle = "#8f3b1c";
  ctx.lineWidth = 4;
  ctx.font = "800 24px Microsoft YaHei";
  ctx.strokeText("星星还不够！", W / 2, 132);
  ctx.fillText("星星还不够！", W / 2, 132);
  ctx.textAlign = "left";
}

function drawBossHealthBar(boss) {
  const x = 250;
  const y = 92;
  const w = 460;
  const h = 24;
  const pct = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle = "rgba(18, 14, 30, 0.86)";
  roundRect(x, y, w, h, 6, true);
  ctx.strokeStyle = "#f3c66d";
  ctx.lineWidth = 3;
  roundRect(x, y, w, h, 6, false);
  ctx.fillStyle = "#6d1f35";
  roundRect(x + 5, y + 5, w - 10, h - 10, 4, true);
  ctx.fillStyle = pct > 0.35 ? "#ff4d5f" : "#ffb347";
  roundRect(x + 5, y + 5, (w - 10) * pct, h - 10, 4, true);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff7dc";
  ctx.font = "800 15px Trebuchet MS";
  ctx.fillText(`BOWTIE CAT  ${boss.hp}/${boss.maxHp}`, x + w / 2, y + 17);
  ctx.textAlign = "left";
}

function drawPortrait(x, y) {
  ctx.fillStyle = "#cdefff";
  roundRect(x, y, 54, 46, 6, true);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, 50, 42);
  ctx.clip();
  if (ready(assets.player)) {
    ctx.drawImage(assets.player, x - 8, y - 28, 76, 120);
  } else {
    ctx.save();
    ctx.translate(x + 27, y + 2);
    ctx.scale(0.92, 0.92);
    drawPlayer({ x: -21, y: -6, w: 42, h: 72, dir: 1, inv: 0, blink: 1, vx: 0, onGround: true });
    ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = "#24314d";
  ctx.lineWidth = 3;
  roundRect(x, y, 54, 46, 6, false);
}

function drawHeart(x, y, full) {
  ctx.fillStyle = full ? "#ff4775" : "#65415a";
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.bezierCurveTo(x - 14, y - 5, x - 28, y + 13, x, y + 28);
  ctx.bezierCurveTo(x + 28, y + 13, x + 14, y - 5, x, y + 8);
  ctx.fill();
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(12, 21, 38, 0.58)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe06f";
  ctx.strokeStyle = "#8f3b1c";
  ctx.lineWidth = 8;
  ctx.font = "900 76px Trebuchet MS";
  ctx.strokeText(title, W / 2, H / 2 - 32);
  ctx.fillText(title, W / 2, H / 2 - 32);
  if (ready(assets.banner)) {
    ctx.drawImage(assets.banner, W / 2 - 180, H / 2 - 2, 360, 115);
  }
  ctx.fillStyle = "#fff4dc";
  ctx.font = "800 27px Microsoft YaHei";
  ctx.fillText(subtitle, W / 2, H / 2 + 66);
  ctx.textAlign = "left";
}

function drawSun(x, y) {
  ctx.fillStyle = "#ffd14c";
  ctx.beginPath();
  ctx.arc(x, y, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8c481b";
  ctx.fillRect(x - 12, y - 8, 6, 6);
  ctx.fillRect(x + 8, y - 8, 6, 6);
  ctx.strokeStyle = "#9c4e1f";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y + 2, 14, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawCloud(x, y, s) {
  ctx.fillStyle = "rgba(255, 255, 244, 0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y - 8 * s, 27 * s, 0, Math.PI * 2);
  ctx.arc(x + 55 * s, y, 22 * s, 0, Math.PI * 2);
  ctx.fillRect(x - 18 * s, y, 92 * s, 22 * s);
  ctx.fill();
}

function drawGradientScene(top, middle, ground) {
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, top);
  grd.addColorStop(0.58, middle);
  grd.addColorStop(1, ground);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    drawCloud((i * 240 - cameraX * 0.18) % (W + 260) - 130, 62 + (i % 3) * 58, 0.7 + (i % 2) * 0.16);
  }
}

function drawFruitTree(x, y, variant) {
  ctx.fillStyle = "#7a4327";
  ctx.fillRect(x + 42, y + 42, 18, 92);
  ctx.fillStyle = variant ? "#e5543c" : "#ff8235";
  ctx.beginPath();
  ctx.arc(x + 38, y + 42, 34, 0, Math.PI * 2);
  ctx.arc(x + 68, y + 34, 36, 0, Math.PI * 2);
  ctx.arc(x + 82, y + 66, 32, 0, Math.PI * 2);
  ctx.arc(x + 34, y + 72, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd36a";
  for (let i = 0; i < 5; i++) ctx.fillRect(x + 34 + i * 12, y + 35 + (i % 2) * 22, 6, 6);
}

function drawPine(x, y, s) {
  ctx.fillStyle = "#6b4329";
  ctx.fillRect(x + 30 * s, y + 78 * s, 12 * s, 58 * s);
  ctx.fillStyle = "#2d8a69";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 36 * s, y + i * 30 * s);
    ctx.lineTo(x + 4 * s, y + (72 + i * 12) * s);
    ctx.lineTo(x + 68 * s, y + (72 + i * 12) * s);
    ctx.fill();
  }
  ctx.fillStyle = "#e9fbff";
  ctx.fillRect(x + 18 * s, y + 72 * s, 36 * s, 6 * s);
}

function drawMoon(x, y) {
  ctx.fillStyle = "#ffeaa2";
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#293b75";
  ctx.beginPath();
  ctx.arc(x + 13, y - 8, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(x, y, size) {
  ctx.fillStyle = "#329e43";
  ctx.beginPath();
  ctx.arc(x, y + 22, size * 0.45, 0, Math.PI * 2);
  ctx.arc(x + 30, y + 14, size * 0.38, 0, Math.PI * 2);
  ctx.arc(x + 62, y + 25, size * 0.43, 0, Math.PI * 2);
  ctx.fill();
}

function drawMushroomEnemy(e) {
  const x = e.x + e.w / 2;
  const y = e.y + e.h;
  ctx.fillStyle = "#ffe0b2";
  roundRect(x - 12, y - 28, 24, 28, 8, true);
  ctx.fillStyle = "#e8463f";
  ctx.beginPath();
  ctx.ellipse(x, y - 30, 28, 20, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(x + 26, y - 26);
  ctx.lineTo(x - 26, y - 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff4d8";
  ctx.fillRect(x - 15, y - 42, 7, 7);
  ctx.fillRect(x + 8, y - 39, 8, 8);
  ctx.fillStyle = "#1c1c24";
  ctx.fillRect(x - 7, y - 18, 4, 4);
  ctx.fillRect(x + 5, y - 18, 4, 4);
}

function drawBeeEnemy(e) {
  const t = performance.now() / 110;
  const x = e.x + e.w / 2;
  const y = e.y + 12 + Math.sin(t + e.x) * 14;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(x - 12, y - 14, 12, 8, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 12, y - 14, 12, 8, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd94d";
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a2524";
  ctx.fillRect(x - 9, y - 13, 5, 26);
  ctx.fillRect(x + 5, y - 13, 5, 26);
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 14 * Math.sign(e.vx || 1), y - 5, 4, 4);
}

function drawSnowmanEnemy(e) {
  const x = e.x + e.w / 2;
  const y = e.y + e.h;
  ctx.fillStyle = "#f7fdff";
  ctx.strokeStyle = "#9bc6da";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 18, 19, 0, Math.PI * 2);
  ctx.arc(x, y - 48, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111827";
  ctx.fillRect(x - 6, y - 52, 4, 4);
  ctx.fillRect(x + 5, y - 52, 4, 4);
  ctx.fillStyle = "#ff8a2b";
  ctx.fillRect(x - 1, y - 46, 13, 4);
  ctx.fillStyle = "#e74738";
  ctx.fillRect(x - 17, y - 38, 34, 5);
}

function drawBatEnemy(e) {
  const x = e.x + e.w / 2;
  const y = e.y + 16 + Math.sin(performance.now() / 120 + e.x) * 18;
  ctx.fillStyle = "#3a315f";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 28, y - 14);
  ctx.lineTo(x - 18, y + 12);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x + 18, y + 12);
  ctx.lineTo(x + 28, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#1b1930";
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd54a";
  ctx.fillRect(x - 6, y - 2, 3, 3);
  ctx.fillRect(x + 4, y - 2, 3, 3);
}

function drawGhostEnemy(e) {
  const x = e.x + e.w / 2;
  const y = e.y + e.h / 2 + Math.sin(performance.now() / 150 + e.x) * 8;
  ctx.fillStyle = "rgba(239, 248, 255, 0.92)";
  ctx.beginPath();
  ctx.arc(x, y - 8, 22, Math.PI, 0);
  ctx.lineTo(x + 22, y + 20);
  ctx.lineTo(x + 11, y + 14);
  ctx.lineTo(x, y + 22);
  ctx.lineTo(x - 11, y + 14);
  ctx.lineTo(x - 22, y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#26334e";
  ctx.fillRect(x - 9, y - 10, 5, 6);
  ctx.fillRect(x + 5, y - 10, 5, 6);
}

function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  if (fill) ctx.fill();
  else ctx.stroke();
}

function loop(now) {
  const dt = Math.min(32, now - lastTime) / 16.67;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

