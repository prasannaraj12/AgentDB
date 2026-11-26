import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './motion';

/**
 * Hero background: a sparse field of slowly drifting data nodes with faint links
 * between near neighbours. Canvas 2D, capped particle count, paused off-screen,
 * static when reduced motion is requested.
 */
export default function HeroField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;

    const reduced = prefersReducedMotion();
    let width = 0, height = 0, dpr = 1, raf = 0, visible = true;
    let nodes = [];

    const seed = () => {
      const area = width * height;
      const count = Math.max(14, Math.min(width < 700 ? 22 : 54, Math.round(area / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.3 + 0.5,
        hue: Math.random() < 0.22 ? 'cyan' : 'violet',
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw();
    };

    const LINK = 130;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.16;
            ctx.strokeStyle = `rgba(155,131,255,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = n.hue === 'cyan' ? 'rgba(32,214,194,0.75)' : 'rgba(190,176,255,0.7)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = () => {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10) n.x = width + 10; else if (n.x > width + 10) n.x = -10;
        if (n.y < -10) n.y = height + 10; else if (n.y > height + 10) n.y = -10;
      }
      draw();
      if (visible) raf = requestAnimationFrame(step);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let io;
    if (!reduced) {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(step);
      });
      io.observe(canvas);
    }
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && visible && !reduced) raf = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-field" aria-hidden="true" />;
}
