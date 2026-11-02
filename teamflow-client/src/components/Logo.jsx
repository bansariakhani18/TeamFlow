export const Logo = ({ size = 'md', className = '' }) => {
  const boxSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric monochrome logomark */}
      <div
        className={`${boxSizes[size] || boxSizes.md} rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold tracking-tight shadow-sm border border-slate-800 shrink-0`}
      >
        <span className="font-mono tracking-tighter">TF</span>
      </div>
      <span
        className={`font-bold tracking-tight text-[#0F172A] ${textSizes[size] || textSizes.md}`}
      >
        TeamFlow
      </span>
    </div>
  );
};

export default Logo;
