import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Runs a GSAP setup function inside a scoped gsap.context() bound to `scope`.
 * - Honours prefers-reduced-motion (skips animation, content stays visible via CSS).
 * - Cleans up all tweens + ScrollTriggers on unmount.
 *
 * The setup callback receives { gsap, ScrollTrigger, reduced }.
 */
export function useGsapContext(setup, deps = []) {
  const scope = useRef(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      setup({ gsap, ScrollTrigger, reduced });
    }, scope);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/**
 * Convenience: batch-reveal elements matching `selector` within the scope on scroll.
 * Elements should carry the .lp-reveal or .lp-fade class (hidden by default in CSS).
 */
export function revealBatch(scope, selector, { reduced, gsap, ScrollTrigger }, vars = {}) {
  const targets = scope.querySelectorAll(selector);
  if (!targets.length) return;

  if (reduced) {
    gsap.set(targets, { opacity: 1, y: 0, clearProps: 'transform' });
    return;
  }

  ScrollTrigger.batch(targets, {
    start: 'top 85%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.09,
        overwrite: true,
        ...vars,
      }),
  });
}
