// ============================================================
//  KidBrainBreak — Confetti Effect
// ============================================================

export class Confetti {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.pieces  = [];
    this._running = false;

    // Match canvas to viewport
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 120) {
    const colors = ['#7b61ff','#ff61b6','#00e5ff','#ffe456','#4dffb4','#ff9d4d','#ff5252'];
    const shapes = ['circle','square','strip'];

    for (let i = 0; i < count; i++) {
      this.pieces.push({
        x:  this.canvas.width  * (0.3 + Math.random() * 0.4),
        y:  this.canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 12,
        vy: -(4 + Math.random() * 8),
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size:  5 + Math.random() * 10,
        alpha: 1,
        gravity: 0.3 + Math.random() * 0.2
      });
    }

    if (!this._running) this._loop();
  }

  _loop() {
    this._running = true;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.pieces = this.pieces.filter(p => p.alpha > 0.01);

    this.pieces.forEach(p => {
      p.vy       += p.gravity;
      p.x        += p.vx;
      p.y        += p.vy;
      p.rotation += p.rotSpeed;
      p.vx       *= 0.99;
      if (p.y > canvas.height * 0.7) p.alpha -= 0.02;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
      }
      ctx.restore();
    });

    if (this.pieces.length > 0) {
      requestAnimationFrame(() => this._loop());
    } else {
      this._running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
