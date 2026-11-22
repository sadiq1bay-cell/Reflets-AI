import React, { useId } from 'react';

interface HelyumeLogoProps {
  size?: number;
  className?: string;
}

export const HelyumeLogo: React.FC<HelyumeLogoProps> = ({ size = 28, className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const planetGradId = `reflets-planet-${uid}`;
  const bandGradId = `reflets-band-${uid}`;
  const ringGradId = `reflets-ring-${uid}`;
  const ringInnerGradId = `reflets-ring-inner-${uid}`;
  const glowGradId = `reflets-glow-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={glowGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.32" />
          <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#080410" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={planetGradId} x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="35%" stopColor="#818CF8" />
          <stop offset="70%" stopColor="#E879F9" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>

        <linearGradient id={bandGradId} x1="18" y1="26" x2="46" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#C084FC" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.75" />
        </linearGradient>

        <linearGradient id={ringGradId} x1="6" y1="42" x2="58" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF3B8B" />
          <stop offset="22%" stopColor="#FF9E2C" />
          <stop offset="45%" stopColor="#34D399" />
          <stop offset="72%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>

        <linearGradient id={ringInnerGradId} x1="10" y1="40" x2="54" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Soft ambient halo */}
      <circle cx="32" cy="32" r="29" fill={`url(#${glowGradId})`} />

      {/* Back half of Saturn RGB rings (behind planet sphere) */}
      <g transform="rotate(-24 32 32)">
        <path
          d="M 5 32 A 27 8.5 0 0 1 59 32"
          stroke={`url(#${ringGradId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeOpacity="0.88"
        />
        <path
          d="M 10 32 A 22 6.2 0 0 1 54 32"
          stroke={`url(#${ringInnerGradId})`}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </g>

      {/* Saturn planet sphere */}
      <circle cx="32" cy="32" r="14.5" fill={`url(#${planetGradId})`} />
      <circle
        cx="32"
        cy="32"
        r="14.5"
        fill="#0B061A"
        fillOpacity="0.22"
      />
      {/* Iridescent RGB atmospheric belt */}
      <path
        d="M 18.2 29.2 Q 32 33.8 45.8 29.2 A 14.5 14.5 0 0 1 45.2 35.4 Q 32 39.2 18.8 35.4 A 14.5 14.5 0 0 1 18.2 29.2 Z"
        fill={`url(#${bandGradId})`}
      />
      {/* Specular highlight */}
      <ellipse cx="26.5" cy="24.5" rx="4.8" ry="2.6" transform="rotate(-24 26.5 24.5)" fill="white" fillOpacity="0.28" />

      {/* Front half of Saturn RGB rings (in front of planet sphere) */}
      <g transform="rotate(-24 32 32)">
        <path
          d="M 59 32 A 27 8.5 0 0 1 5 32"
          stroke={`url(#${ringGradId})`}
          strokeWidth="3.6"
          strokeLinecap="round"
        />
        <path
          d="M 54 32 A 22 6.2 0 0 1 10 32"
          stroke={`url(#${ringInnerGradId})`}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>

      {/* Subtle RGB star/moon accents */}
      <circle cx="51" cy="15" r="2.2" fill="#22D3EE" />
      <circle cx="13" cy="48" r="1.8" fill="#FF3B8B" />
    </svg>
  );
};
