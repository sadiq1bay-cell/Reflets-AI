export interface StarPoint {
  xNorm: number;
  yNorm: number;
  radius: number;
  speed: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  tint: string;
}

const STAR_TINTS = ['#FFFFFF', '#E0F2FE', '#F5D0FE', '#FDE68A', '#C4B5FD'];

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function createStarfield(count = 200, seed = 42): StarPoint[] {
  const rand = mulberry32(seed);
  const stars: StarPoint[] = [];
  for (let i = 0; i < count; i++) {
    const depth = rand();
    stars.push({
      xNorm: rand(),
      yNorm: rand(),
      radius: 0.55 + depth * 1.55,
      speed: 0.002 + depth * 0.008,
      baseAlpha: 0.25 + depth * 0.65,
      twinklePhase: rand() * Math.PI * 2,
      twinkleSpeed: 0.8 + rand() * 2.2,
      tint: STAR_TINTS[Math.floor(rand() * STAR_TINTS.length)],
    });
  }
  return stars;
}

export interface OrbitalParams {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  angleRad: number;
  tiltRad?: number;
}

export function computeOrbitalPosition(params: OrbitalParams): { x: number; y: number } {
  const { centerX, centerY, radiusX, radiusY, angleRad, tiltRad = 0 } = params;
  const localX = Math.cos(angleRad) * radiusX;
  const localY = Math.sin(angleRad) * radiusY;
  if (tiltRad === 0) {
    return { x: centerX + localX, y: centerY + localY };
  }
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);
  return {
    x: centerX + localX * cosT - localY * sinT,
    y: centerY + localX * sinT + localY * cosT,
  };
}
