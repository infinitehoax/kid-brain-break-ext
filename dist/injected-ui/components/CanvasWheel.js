// ============================================================
//  KidBrainBreak — Canvas Spinning Wheel
// ============================================================

export class CanvasWheel {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.size    = canvas.width;
    this.cx      = this.size / 2;
    this.cy      = this.size / 2;
    this.radius  = this.size / 2 - 6;

    this.segments = [
      { label: '👤 You Pick!',    color: '#7b61ff', bg: '#2a1f5c' },
      { label: '🎲 System Picks', color: '#ff61b6', bg: '#4a1535' },
      { label: '👤 You Pick!',    color: '#00e5ff', bg: '#003d4d' },
      { label: '🎲 System Picks', color: '#ffe456', bg: '#3d3400' },
      { label: '👤 You Pick!',    color: '#4dffb4', bg: '#003d2a' },
      { label: '🎲 System Picks', color: '#ff9d4d', bg: '#3d2000' },
    ];

    this.angle      = 0;      // current rotation (radians)
    this.velocity   = 0;      // radians per frame
    this.friction   = 0.985;  // deceleration factor
    this.spinning   = false;
    this.onFinish   = null;

    this._raf = null;
    this._draw();
  }

  spin(onFinish) {
    if (this.spinning) return;
    this.onFinish   = onFinish;
    this.spinning   = true;
    // Random initial velocity between 0.25 and 0.45 rad/frame
    this.velocity   = 0.25 + Math.random() * 0.2;
    this._loop();
  }

  _loop() {
    this.angle    += this.velocity;
    this.velocity *= this.friction;

    this._draw();

    if (this.velocity > 0.002) {
      this._raf = requestAnimationFrame(() => this._loop());
    } else {
      this.spinning = false;
      this._draw();
      if (this.onFinish) this.onFinish(this._getResult());
    }
  }

  _getResult() {
    const sliceAngle = (2 * Math.PI) / this.segments.length;
    // Arrow points up (−π/2), we find which segment is there
    const normalised = ((-this.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const index      = Math.floor(normalised / sliceAngle) % this.segments.length;
    return this.segments[index];
  }

  _draw() {
    const { ctx, cx, cy, radius, angle, segments, size } = this;
    ctx.clearRect(0, 0, size, size);

    const sliceAngle = (2 * Math.PI) / segments.length;

    segments.forEach((seg, i) => {
      const startAngle = angle + i * sliceAngle;
      const endAngle   = startAngle + sliceAngle;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.bg;
      ctx.fill();

      // Slice arc border
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);

      // Gradient text glow
      const textX = radius * 0.62;
      ctx.font      = `bold 13px 'Nunito', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Shadow glow
      ctx.shadowColor  = seg.color;
      ctx.shadowBlur   = 10;
      ctx.fillStyle    = seg.color;
      ctx.fillText(seg.label, textX, 0);
      ctx.restore();
    });

    // Centre circle
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32);
    grad.addColorStop(0, '#2a2a5a');
    grad.addColorStop(1, '#13132b');
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(123,97,255,0.6)';
    ctx.lineWidth   = 3;
    ctx.stroke();

    // 🧠 emoji in centre
    ctx.font         = '22px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧠', cx, cy);

    // Outer ring glow
    const ringGrad = ctx.createRadialGradient(cx, cy, radius - 4, cx, cy, radius + 4);
    ringGrad.addColorStop(0, 'rgba(123,97,255,0.5)');
    ringGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth   = 6;
    ctx.stroke();
  }
}
