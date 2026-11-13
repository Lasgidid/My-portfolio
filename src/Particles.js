import { useEffect, useRef } from "react";

// A quiet field of copper and solder specks behind the board.
// They drift on their own, part around your pointer, and lift a little when you scroll.
export default function Particles() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, specks = [];
    const pointer = { x: -9999, y: -9999 };
    let lastScroll = window.scrollY, scrollV = 0;

    const make = () => {
      const count = Math.round(Math.min(110, (w * h) / 16000));
      specks = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        r: 0.6 + Math.random() * 1.6,
        copper: Math.random() < 0.55,
        a: 0.18 + Math.random() * 0.35,
      }));
    };
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      make();
      if (reduced) draw();
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of specks) {
        ctx.fillStyle = s.copper ? `rgba(201,138,75,${s.a})` : `rgba(232,236,228,${s.a * 0.7})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    const tick = () => {
      const sy = window.scrollY;
      scrollV += ((sy - lastScroll) - scrollV) * 0.15; lastScroll = sy;
      for (const s of specks) {
        const dx = s.x - pointer.x, dy = s.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140 && d2 > 1) {
          const f = (1 - Math.sqrt(d2) / 140) * 0.35;
          s.vx += (dx / Math.sqrt(d2)) * f; s.vy += (dy / Math.sqrt(d2)) * f;
        }
        s.vy -= scrollV * 0.0025 * s.r;
        s.vx *= 0.96; s.vy *= 0.96;
        s.vx += (Math.random() - 0.5) * 0.01; s.vy += (Math.random() - 0.5) * 0.01;
        s.x += s.vx; s.y += s.vy;
        if (s.x < -10) s.x = w + 10; if (s.x > w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10; if (s.y > h + 10) s.y = -10;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; };
    const onLeave = () => { pointer.x = pointer.y = -9999; };

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="particles" aria-hidden="true" />;
}
