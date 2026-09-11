import React from 'react';

interface LogoBadgeProps {
  className?: string;
  size?: number | string;
}

export const LogoBadge: React.FC<LogoBadgeProps> = ({ className = "w-10 h-10 sm:w-11 sm:h-11", size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div 
      className={`relative shrink-0 rounded-full overflow-hidden shadow-md shadow-red-950/40 select-none ${className}`}
      style={style}
    >
      <svg 
        viewBox="0 0 400 400" 
        className="w-full h-full transform group-hover:scale-105 transition-transform duration-200"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shadows and filters */}
          <filter id="logo-drop-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#500709" floodOpacity="0.8" />
          </filter>
          <filter id="text-stroke-white" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFFFFF" floodOpacity="1" />
          </filter>
        </defs>

        {/* 1. Deep Crimson Red Background */}
        <circle cx="200" cy="200" r="200" fill="#9B1417" />
        <circle cx="200" cy="200" r="198" fill="url(#bg-radial)" fillOpacity="0.2" />

        <radialGradient id="bg-radial" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#C02024" />
          <stop offset="100%" stopColor="#750C0E" />
        </radialGradient>

        {/* 2. Concentric Lavender/Lilac Orbital Dynamic Rings */}
        <g stroke="#B896D2" strokeWidth="6.5" strokeLinecap="round" opacity="0.95">
          {/* Outer ring segments */}
          <path d="M 90 60 A 165 165 0 0 1 350 140" />
          <path d="M 370 200 A 165 165 0 0 1 180 370" />
          <path d="M 140 365 A 165 165 0 0 1 40 240" />
          <path d="M 42 190 A 165 165 0 0 1 70 120" />

          {/* Inner ring segments */}
          <path d="M 140 45 A 148 148 0 0 1 330 110" strokeWidth="5.5" stroke="#CBB0E2" />
          <path d="M 355 170 A 148 148 0 0 1 230 355" strokeWidth="5.5" stroke="#CBB0E2" />
          <path d="M 170 355 A 148 148 0 0 1 55 200" strokeWidth="5.5" stroke="#CBB0E2" />
          <path d="M 68 140 A 148 148 0 0 1 110 80" strokeWidth="5.5" stroke="#CBB0E2" />
        </g>

        {/* 3. Tilted Graphic Typography Container */}
        <g transform="rotate(-7 200 200)">
          
          {/* "TOCALA" Text Layer */}
          <g filter="url(#logo-drop-shadow)">
            {/* White outline backdrop */}
            <text
              x="195"
              y="165"
              textAnchor="middle"
              fontFamily="'Impact', 'Arial Black', 'Montserrat', sans-serif"
              fontSize="68"
              fontWeight="900"
              letterSpacing="2"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="14"
              strokeLinejoin="round"
            >
              TOCALA
            </text>
            {/* Yellow front text */}
            <text
              x="195"
              y="165"
              textAnchor="middle"
              fontFamily="'Impact', 'Arial Black', 'Montserrat', sans-serif"
              fontSize="68"
              fontWeight="900"
              letterSpacing="2"
              fill="#FFD000"
            >
              TOCALA
            </text>
          </g>

          {/* "ACA" Text Layer */}
          <g filter="url(#logo-drop-shadow)">
            {/* White outline backdrop */}
            <text
              x="170"
              y="275"
              textAnchor="middle"
              fontFamily="'Impact', 'Arial Black', 'Montserrat', sans-serif"
              fontSize="120"
              fontWeight="900"
              letterSpacing="-2"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="18"
              strokeLinejoin="round"
            >
              ACA
            </text>
            {/* Yellow front text */}
            <text
              x="170"
              y="275"
              textAnchor="middle"
              fontFamily="'Impact', 'Arial Black', 'Montserrat', sans-serif"
              fontSize="120"
              fontWeight="900"
              letterSpacing="-2"
              fill="#FFD000"
            >
              ACA
            </text>
          </g>

          {/* Location Pin with Soccer Ball Icon beside ACA */}
          <g transform="translate(290, 180)" filter="url(#logo-drop-shadow)">
            {/* Pin body white outline */}
            <path
              d="M20 0 C8.95 0 0 8.95 0 20 C0 33 20 52 20 52 C20 52 40 33 40 20 C40 8.95 31.05 0 20 0 Z"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            {/* Pin body yellow fill */}
            <path
              d="M20 0 C8.95 0 0 8.95 0 20 C0 33 20 52 20 52 C20 52 40 33 40 20 C40 8.95 31.05 0 20 0 Z"
              fill="#FFD000"
            />
            {/* Inner white circle for soccer ball */}
            <circle cx="20" cy="19" r="12" fill="#FFFFFF" stroke="#9B1417" strokeWidth="1.5" />
            
            {/* Soccer ball pattern inside pin */}
            <g fill="#9B1417">
              {/* Center pentagon */}
              <polygon points="20,15 23.5,17.5 22,21.5 18,21.5 16.5,17.5" />
              {/* Outer patches */}
              <path d="M 20 15 L 20 10" stroke="#9B1417" strokeWidth="1.2" />
              <path d="M 23.5 17.5 L 28 16" stroke="#9B1417" strokeWidth="1.2" />
              <path d="M 22 21.5 L 25 26" stroke="#9B1417" strokeWidth="1.2" />
              <path d="M 18 21.5 L 15 26" stroke="#9B1417" strokeWidth="1.2" />
              <path d="M 16.5 17.5 L 12 16" stroke="#9B1417" strokeWidth="1.2" />
            </g>
          </g>

        </g>
      </svg>
    </div>
  );
};
