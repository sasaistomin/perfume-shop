import { useEffect, useRef } from 'react';

// Кружечки, що плавають на фоні: відштовхуються один від одного,
// а через краї вільно пролітають і з’являються з протилежного боку.
const COLORS = [
  [184, 150, 110], // золото
  [212, 167, 106], // мед
  [201, 164, 108],
  [156, 107, 98], // пудрова троянда
  [138, 143, 160], // туманний
];

export default function Bubbles({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let balls = [];
    let raf = 0;
    let visible = true;
    let last = 0;

    const rand = (a, b) => a + Math.random() * (b - a);

    function make() {
      const small = W < 700;
      const count = small ? 11 : 18;
      const scale = Math.min(1, Math.max(0.55, W / 1400));
      const out = [];
      for (let i = 0; i < count; i++) {
        const r = rand(small ? 10 : 14, small ? 46 : 78) * (small ? 1 : scale);
        let x;
        let y;
        let tries = 0;
        do {
          x = rand(r, W - r);
          y = rand(r, H - r);
          tries++;
        } while (tries < 60 && out.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + r + 6));
        const speed = rand(14, 34); // пікселів за секунду
        const angle = rand(0, Math.PI * 2);
        const c = COLORS[i % COLORS.length];
        out.push({
          x,
          y,
          r,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          m: r * r,
          c,
          a: rand(0.1, 0.24),
          ring: Math.random() < 0.3,
        });
      }
      return out;
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const oldW = W;
      const oldH = H;
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!balls.length || Math.abs(oldW - W) > 120) balls = make();
      else if (oldW && oldH) balls.forEach((b) => ((b.x *= W / oldW), (b.y *= H / oldH)));
      draw();
    }

    function step(dt) {
      for (const b of balls) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // без стін: вилетів за край — з’являється з іншого боку
        if (b.x - b.r > W) b.x = -b.r;
        else if (b.x + b.r < 0) b.x = W + b.r;
        if (b.y - b.r > H) b.y = -b.r;
        else if (b.y + b.r < 0) b.y = H + b.r;
      }
      // пружні зіткнення між кружечками
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.01;
          const min = a.r + b.r;
          if (dist >= min) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          // розсунути, щоб не злипались
          const overlap = (min - dist) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel <= 0) continue; // уже розлітаються
          const k = (2 * rel) / (a.m + b.m);
          a.vx -= k * b.m * nx;
          a.vy -= k * b.m * ny;
          b.vx += k * a.m * nx;
          b.vy += k * a.m * ny;
        }
      }
      // обмеження швидкості, щоб рух лишався спокійним
      for (const b of balls) {
        const s = Math.hypot(b.vx, b.vy);
        const max = 60;
        const min = 10;
        if (s > max) (b.vx *= max / s), (b.vy *= max / s);
        else if (s < min && s > 0) (b.vx *= min / s), (b.vy *= min / s);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const b of balls) {
        const [r, g, bl] = b.c;
        if (b.ring) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${b.a + 0.12})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          continue;
        }
        const grad = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(255,255,255,${b.a + 0.25})`);
        grad.addColorStop(0.45, `rgba(${r},${g},${bl},${b.a})`);
        grad.addColorStop(1, `rgba(${r},${g},${bl},${b.a * 0.55})`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    function frame(t) {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0;
      last = t;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }
    const start = () => {
      if (reduce || raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    // не рахуємо анімацію, коли блок прокручено за межі екрана або вкладку сховано
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className={`bubbles ${className}`} aria-hidden="true" />;
}
