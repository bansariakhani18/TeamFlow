import React from 'react';

export const BrandLogo = ({ className = "h-8 w-8" }) => (
  <div className="flex items-center gap-3">
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="TeamFlow Logo">
      {/* Left Column Plane - Dark Sage Shade */}
      <path d="M22 38 L44 26 L44 78 L22 90 Z" fill="#3B6B50" />
      {/* Top Crossbar Plane - Pastel Sage Highlight */}
      <path d="M22 38 L62 16 L84 28 L44 50 Z" fill="#6B9E80" />
      {/* Right Interlocking Wing - Medium Sage Accent */}
      <path d="M44 50 L78 32 L78 52 L44 70 Z" fill="#4E8765" />
      {/* Front Fold Edge Highlight */}
      <path d="M44 50 L44 78 L58 70 L58 42 Z" fill="#88B89C" opacity="0.9" />
    </svg>
    <span className="font-bold text-xl tracking-tight text-stone-800 font-sans">
      Team<span className="text-[#4E8765]">Flow</span>
    </span>
  </div>
);

export const BrandLogoB = BrandLogo;
export default BrandLogo;
