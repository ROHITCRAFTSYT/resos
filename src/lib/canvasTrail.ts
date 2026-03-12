// Oscillator
function Oscillator(this: any, e: any) {
  this.init(e || {});
}
Oscillator.prototype = {
  init: function (e: any) {
    this.phase = e.phase || 0;
    this.offset = e.offset || 0;
    this.frequency = e.frequency || 0.001;
    this.amplitude = e.amplitude || 1;
  },
  update: function () {
    this.phase += this.frequency;
    oscValue = this.offset + Math.sin(this.phase) * this.amplitude;
    return oscValue;
  },
  value: function () {
    return oscValue;
  },
};

function TrailLine(this: any, e: any) {
  this.init(e || {});
}
TrailLine.prototype = {
  init: function (e: any) {
    this.spring = e.spring + 0.1 * Math.random() - 0.05;
    this.friction = cfg.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    for (let i = 0; i < cfg.size; i++) {
      const t = new (TrailNode as any)();
      t.x = pos.x;
      t.y = pos.y;
      this.nodes.push(t);
    }
  },
  update: function () {
    let e = this.spring;
    let t = this.nodes[0];
    t.vx += (pos.x - t.x) * e;
    t.vy += (pos.y - t.y) * e;
    for (let n, i = 0, a = this.nodes.length; i < a; i++) {
      t = this.nodes[i];
      if (i > 0) {
        n = this.nodes[i - 1];
        t.vx += (n.x - t.x) * e;
        t.vy += (n.y - t.y) * e;
        t.vx += n.vx * cfg.dampening;
        t.vy += n.vy * cfg.dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x += t.vx;
      t.y += t.vy;
      e *= cfg.tension;
    }
  },
  draw: function () {
    let e, t;
    let nx = this.nodes[0].x;
    let ny = this.nodes[0].y;
    ctx!.beginPath();
    ctx!.moveTo(nx, ny);
    for (let a = 1, o = this.nodes.length - 2; a < o; a++) {
      e = this.nodes[a];
      t = this.nodes[a + 1];
      nx = 0.5 * (e.x + t.x);
      ny = 0.5 * (e.y + t.y);
      ctx!.quadraticCurveTo(e.x, e.y, nx, ny);
    }
    e = this.nodes[this.nodes.length - 2];
    t = this.nodes[this.nodes.length - 1];
    ctx!.quadraticCurveTo(e.x, e.y, t.x, t.y);
    ctx!.stroke();
    ctx!.closePath();
  },
};

function TrailNode(this: any) {
  this.x = 0;
  this.y = 0;
  this.vy = 0;
  this.vx = 0;
}

let ctx: (CanvasRenderingContext2D & { running?: boolean; frame?: number }) | null = null;
let osc: any;
let oscValue = 0;
const pos: { x: number; y: number } = { x: 0, y: 0 };
let lines: any[] = [];
let lastHueShift = 0;

// Config — hue offset shifted to the green range (100–160) for the project theme
const cfg = {
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

function initLines() {
  lines = [];
  for (let i = 0; i < cfg.trails; i++) {
    lines.push(new (TrailLine as any)({ spring: 0.45 + (i / cfg.trails) * 0.025 }));
  }
}

function onMove(e: MouseEvent | TouchEvent) {
  if ('touches' in e) {
    pos.x = e.touches[0].pageX;
    pos.y = e.touches[0].pageY;
  } else {
    pos.x = (e as MouseEvent).clientX;
    pos.y = (e as MouseEvent).clientY;
  }
  e.preventDefault();

  // Shift to a new random hue every 800ms of movement
  const now = Date.now();
  if (now - lastHueShift > 800) {
    lastHueShift = now;
    if (osc) {
      osc.offset = Math.random() * 360;
      osc.amplitude = 30 + Math.random() * 60;
    }
  }
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    pos.x = e.touches[0].pageX;
    pos.y = e.touches[0].pageY;
  }
}

function onFirstInteraction(e: MouseEvent | TouchEvent) {
  document.removeEventListener('mousemove', onFirstInteraction as EventListener);
  document.removeEventListener('touchstart', onFirstInteraction as EventListener);
  document.addEventListener('mousemove', onMove as EventListener);
  document.addEventListener('touchmove', onMove as EventListener, { passive: false });
  document.addEventListener('touchstart', onTouchStart as EventListener);
  onMove(e);
  initLines();
  render();
}

function render() {
  if (!ctx || !ctx.running || lines.length === 0) return;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  // Use green hues (90–160) for the project palette
  ctx.strokeStyle = `hsla(${Math.round(osc.update())},90%,55%,0.028)`;
  ctx.lineWidth = 10;
  for (let i = 0; i < cfg.trails; i++) {
    lines[i].update();
    lines[i].draw();
  }
  ctx.frame!++;
  window.requestAnimationFrame(render);
}

function resizeCanvas() {
  if (!ctx) return;
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

export function renderCanvas() {
  const canvas = document.getElementById('resilienceos-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  ctx = canvas.getContext('2d') as typeof ctx;
  if (!ctx) return;

  ctx.running = true;
  ctx.frame = 1;

  // Oscillator starts at a random hue; shifts further on each interaction
  osc = new (Oscillator as any)({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 50,
    frequency: 0.0015,
    offset: Math.random() * 360,
  });

  // Center pos initially
  pos.x = window.innerWidth / 2;
  pos.y = window.innerHeight / 2;

  document.addEventListener('mousemove', onFirstInteraction as EventListener);
  document.addEventListener('touchstart', onFirstInteraction as EventListener);
  document.body.addEventListener('orientationchange', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('focus', () => {
    if (ctx && !ctx.running) {
      ctx.running = true;
      render();
    }
  });
  window.addEventListener('blur', () => {
    if (ctx) ctx.running = false;
  });

  resizeCanvas();
}

export function destroyCanvas() {
  if (ctx) ctx.running = false;
  document.removeEventListener('mousemove', onFirstInteraction as EventListener);
  document.removeEventListener('mousemove', onMove as EventListener);
  document.removeEventListener('touchstart', onFirstInteraction as EventListener);
  document.removeEventListener('touchmove', onMove as EventListener);
  document.removeEventListener('touchstart', onTouchStart as EventListener);
  lines = [];
  lastHueShift = 0;
}
