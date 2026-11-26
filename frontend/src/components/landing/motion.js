// Motion helpers for the landing page: no animation library, no React re-renders on
// pointer movement. Everything writes CSS custom properties or toggles classes.
import { useEffect } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Reveal-on-scroll: every element with [data-reveal] inside `rootRef` gets `is-in`
 * the first time it enters the viewport. One shared IntersectionObserver.
 */
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll('[data-reveal]');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/**
 * Pointer-reactive CSS variables on `ref`: --px/--py in [-1, 1] relative to the
 * element (or the window when `global`). Smoothed with rAF, cleaned up on unmount.
 */
export function usePointerVars(ref, { global = false, ease = 0.08 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !canHover()) return undefined;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, active = false;

    const tick = () => {
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      el.style.setProperty('--px', x.toFixed(4));
      el.style.setProperty('--py', y.toFixed(4));
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(tick);
      else active = false;
    };
    const kick = () => { if (!active) { active = true; raf = requestAnimationFrame(tick); } };

    const onMove = (e) => {
      const r = global ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight } : el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      tx = Math.max(-1, Math.min(1, tx));
      ty = Math.max(-1, Math.min(1, ty));
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };

    const target = global ? window : el;
    target.addEventListener('pointermove', onMove, { passive: true });
    if (!global) el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      target.removeEventListener('pointermove', onMove);
      if (!global) el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, global, ease]);
}

/** Spotlight for cards: sets --sx/--sy (px) where the pointer is over each [data-spotlight] child. */
export function useSpotlight(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !canHover()) return undefined;
    const onMove = (e) => {
      const card = e.target.closest?.('[data-spotlight]');
      if (!card || !root.contains(card)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', `${e.clientX - r.left}px`);
      card.style.setProperty('--sy', `${e.clientY - r.top}px`);
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    return () => root.removeEventListener('pointermove', onMove);
  }, [rootRef]);
}
