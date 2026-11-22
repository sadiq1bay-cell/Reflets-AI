import React, { useEffect, useMemo, useRef } from 'react';
import { computeOrbitalPosition, createStarfield } from '../utils/spaceScene';

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
  maxLife: number;
}

export const SpaceBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stars = useMemo(() => createStarfield(180, 2026), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgOffscreen = document.createElement('canvas');
    const bgCtx = bgOffscreen.getContext('2d');
    const scrimOffscreen = document.createElement('canvas');
    const scrimCtx = scrimOffscreen.getContext('2d');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;
    let nextMeteorIn = 2.0;
    const meteors: Meteor[] = [];

    const rebuildStaticLayers = () => {
      bgOffscreen.width = width;
      bgOffscreen.height = height;
      scrimOffscreen.width = width;
      scrimOffscreen.height = height;

      if (bgCtx) {
        bgCtx.fillStyle = '#070310';
        bgCtx.fillRect(0, 0, width, height);

        const neb1 = bgCtx.createRadialGradient(
          width * 0.52,
          height * 0.06,
          10,
          width * 0.52,
          height * 0.06,
          Math.max(width, height) * 0.65
        );
        neb1.addColorStop(0, 'rgba(168, 34, 165, 0.24)');
        neb1.addColorStop(0.45, 'rgba(88, 28, 135, 0.14)');
        neb1.addColorStop(1, 'rgba(7, 3, 16, 0)');
        bgCtx.fillStyle = neb1;
        bgCtx.fillRect(0, 0, width, height);

        const neb2 = bgCtx.createRadialGradient(
          width * 0.18,
          height * 0.82,
          10,
          width * 0.18,
          height * 0.82,
          Math.max(width, height) * 0.45
        );
        neb2.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
        neb2.addColorStop(1, 'rgba(7, 3, 16, 0)');
        bgCtx.fillStyle = neb2;
        bgCtx.fillRect(0, 0, width, height);

        // Subtle orbital guide ellipses
        bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
        bgCtx.lineWidth = 1;
        bgCtx.beginPath();
        bgCtx.ellipse(width * 0.5, height * 0.45, width * 0.36, height * 0.25, -0.18, 0, Math.PI * 2);
        bgCtx.stroke();
        bgCtx.beginPath();
        bgCtx.ellipse(width * 0.5, height * 0.45, width * 0.24, height * 0.16, -0.18, 0, Math.PI * 2);
        bgCtx.stroke();
      }

      if (scrimCtx) {
        scrimCtx.clearRect(0, 0, width, height);
        const scrim = scrimCtx.createRadialGradient(
          width * 0.5,
          height * 0.46,
          Math.min(width, height) * 0.08,
          width * 0.5,
          height * 0.46,
          Math.max(width, height) * 0.52
        );
        scrim.addColorStop(0, 'rgba(8, 4, 16, 0.54)');
        scrim.addColorStop(1, 'rgba(8, 4, 16, 0.12)');
        scrimCtx.fillStyle = scrim;
        scrimCtx.fillRect(0, 0, width, height);
      }
    };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect?.width || window.innerWidth));
      height = Math.max(320, Math.floor(rect?.height || window.innerHeight));
      canvas.width = width;
      canvas.height = height;
      rebuildStaticLayers();
    };

    const drawPlanetBody = (
      x: number,
      y: number,
      r: number,
      sunX: number,
      sunY: number,
      cLight: string,
      cMid: string,
      cDark: string,
      bandColor?: string
    ) => {
      const dx = sunX - x;
      const dy = sunY - y;
      const dist = Math.hypot(dx, dy) || 1;
      const lx = x + (dx / dist) * r * 0.42;
      const ly = y + (dy / dist) * r * 0.42;

      const grad = ctx.createRadialGradient(lx, ly, r * 0.08, x, y, r * 1.12);
      grad.addColorStop(0, cLight);
      grad.addColorStop(0.55, cMid);
      grad.addColorStop(1, cDark);

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      if (bandColor) {
        ctx.clip();
        ctx.strokeStyle = bandColor;
        ctx.lineWidth = r * 0.16;
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.15, r * 1.15, r * 0.24, -0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        ctx.ellipse(x, y + r * 0.26, r * 1.15, r * 0.2, -0.18, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawSaturn = (x: number, y: number, r: number, sunX: number, sunY: number, t: number) => {
      const ringOuterX = r * 2.25;
      const ringOuterY = r * 0.62;
      const ringInnerX = r * 1.68;
      const ringInnerY = r * 0.44;
      const tilt = -0.34 + Math.sin(t * 0.15) * 0.03;

      const makeRingGrad = () => {
        const g = ctx.createLinearGradient(-ringOuterX, 0, ringOuterX, 0);
        g.addColorStop(0, 'rgba(236, 72, 153, 0.78)');
        g.addColorStop(0.28, 'rgba(251, 146, 60, 0.72)');
        g.addColorStop(0.52, 'rgba(52, 211, 153, 0.72)');
        g.addColorStop(0.76, 'rgba(34, 211, 238, 0.8)');
        g.addColorStop(1, 'rgba(168, 85, 247, 0.78)');
        return g;
      };

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);

      ctx.beginPath();
      ctx.ellipse(0, 0, ringOuterX, ringOuterY, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = makeRingGrad();
      ctx.lineWidth = Math.max(3, r * 0.24);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, ringInnerX, ringInnerY, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = Math.max(1.2, r * 0.08);
      ctx.stroke();
      ctx.restore();

      drawPlanetBody(
        x,
        y,
        r,
        sunX,
        sunY,
        '#FDE68A',
        '#C084FC',
        '#140A29',
        'rgba(56, 189, 248, 0.24)'
      );

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);

      ctx.beginPath();
      ctx.ellipse(0, 0, ringOuterX, ringOuterY, 0, 0, Math.PI);
      ctx.strokeStyle = makeRingGrad();
      ctx.lineWidth = Math.max(3.2, r * 0.26);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, 0, ringInnerX, ringInnerY, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(255,255,255,0.34)';
      ctx.lineWidth = Math.max(1.2, r * 0.08);
      ctx.stroke();
      ctx.restore();
    };

    const drawMoon = (x: number, y: number, r: number, sunX: number, sunY: number) => {
      drawPlanetBody(x, y, r, sunX, sunY, '#F8FAFC', '#94A3B8', '#1E1B2E');
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
      ctx.beginPath();
      ctx.arc(x - r * 0.28, y - r * 0.12, r * 0.18, 0, Math.PI * 2);
      ctx.arc(x + r * 0.22, y + r * 0.24, r * 0.13, 0, Math.PI * 2);
      ctx.arc(x + r * 0.06, y - r * 0.34, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const renderFrame = (dt: number) => {
      elapsed += dt;

      ctx.drawImage(bgOffscreen, 0, 0);

      for (const s of stars) {
        const x = (((s.xNorm - elapsed * s.speed) % 1) + 1) % 1 * width;
        const y = (((s.yNorm + elapsed * s.speed * 0.28) % 1) + 1) % 1 * height;
        const twinkle = 0.55 + 0.45 * Math.sin(elapsed * s.twinkleSpeed + s.twinklePhase);
        ctx.globalAlpha = s.baseAlpha * twinkle;
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(x, y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        nextMeteorIn -= dt;
        if (nextMeteorIn <= 0) {
          nextMeteorIn = 3.0 + Math.random() * 4.0;
          meteors.push({
            x: width * (0.35 + Math.random() * 0.6),
            y: height * (0.04 + Math.random() * 0.25),
            vx: -(360 + Math.random() * 220),
            vy: 160 + Math.random() * 110,
            length: 70 + Math.random() * 55,
            life: 0,
            maxLife: 0.9 + Math.random() * 0.4,
          });
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.life += dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          const progress = m.life / m.maxLife;
          if (progress >= 1) {
            meteors.splice(i, 1);
            continue;
          }
          const alpha = Math.sin(progress * Math.PI) * 0.75;
          const norm = Math.hypot(m.vx, m.vy) || 1;
          const tailX = m.x - (m.vx / norm) * m.length;
          const tailY = m.y - (m.vy / norm) * m.length;
          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          grad.addColorStop(0.5, `rgba(192, 132, 252, ${alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();
        }
      }

      const sunX = width * 0.88 + Math.sin(elapsed * 0.12) * 8;
      const sunY = height * 0.17 + Math.cos(elapsed * 0.1) * 6;
      const sunR = Math.max(24, Math.min(46, width * 0.036));
      const coronaPulse = 1 + Math.sin(elapsed * 0.9) * 0.05;

      const sunCorona = ctx.createRadialGradient(
        sunX,
        sunY,
        sunR * 0.3,
        sunX,
        sunY,
        sunR * 4.5 * coronaPulse
      );
      sunCorona.addColorStop(0, 'rgba(254, 240, 138, 0.72)');
      sunCorona.addColorStop(0.24, 'rgba(251, 146, 60, 0.32)');
      sunCorona.addColorStop(0.58, 'rgba(236, 72, 153, 0.10)');
      sunCorona.addColorStop(1, 'rgba(7, 3, 16, 0)');
      ctx.fillStyle = sunCorona;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 4.5 * coronaPulse, 0, Math.PI * 2);
      ctx.fill();

      const sunDisc = ctx.createRadialGradient(sunX - sunR * 0.2, sunY - sunR * 0.2, 2, sunX, sunY, sunR);
      sunDisc.addColorStop(0, '#FEF9C3');
      sunDisc.addColorStop(0.55, '#FBBF24');
      sunDisc.addColorStop(1, '#EA580C');
      ctx.fillStyle = sunDisc;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      const earthPos = computeOrbitalPosition({
        centerX: width * 0.5,
        centerY: height * 0.45,
        radiusX: width * 0.24,
        radiusY: height * 0.16,
        angleRad: 2.35 + elapsed * 0.12,
        tiltRad: -0.18,
      });
      const earthR = Math.max(10, Math.min(18, width * 0.015));
      drawPlanetBody(
        earthPos.x,
        earthPos.y,
        earthR,
        sunX,
        sunY,
        '#67E8F9',
        '#2563EB',
        '#0B1026',
        'rgba(110, 231, 183, 0.32)'
      );

      const moonPos = computeOrbitalPosition({
        centerX: earthPos.x,
        centerY: earthPos.y,
        radiusX: earthR * 2.3,
        radiusY: earthR * 1.4,
        angleRad: elapsed * 0.65,
        tiltRad: 0.25,
      });
      drawMoon(moonPos.x, moonPos.y, Math.max(4.5, earthR * 0.38), sunX, sunY);

      const marsPos = computeOrbitalPosition({
        centerX: width * 0.5,
        centerY: height * 0.45,
        radiusX: width * 0.33,
        radiusY: height * 0.22,
        angleRad: 4.5 + elapsed * 0.08,
        tiltRad: -0.18,
      });
      drawPlanetBody(
        marsPos.x,
        marsPos.y,
        Math.max(8, Math.min(14, width * 0.012)),
        sunX,
        sunY,
        '#FDBA74',
        '#EA580C',
        '#1A0B14'
      );

      const saturnPos = computeOrbitalPosition({
        centerX: width * 0.48,
        centerY: height * 0.48,
        radiusX: width * 0.36,
        radiusY: height * 0.25,
        angleRad: 0.42 + elapsed * 0.06,
        tiltRad: -0.16,
      });
      const saturnR = Math.max(18, Math.min(34, width * 0.026));
      drawSaturn(saturnPos.x, saturnPos.y, saturnR, sunX, sunY, elapsed);

      ctx.drawImage(scrimOffscreen, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reducedMotion) {
      renderFrame(0);
    } else {
      const loop = (now: number) => {
        rafId = window.requestAnimationFrame(loop);
        const delta = now - lastTs;
        if (delta < 42) return;
        const dt = Math.min(0.1, Math.max(0.001, delta / 1000));
        lastTs = now;
        renderFrame(dt);
      };
      renderFrame(0.016);
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="space-backdrop-canvas"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
};
