export const PriorityBadge = ({ priority = 'medium', className = '' }) => {
  const norm = (priority || '').toLowerCase();

  let bgClass = 'bg-[#FFF3C4] text-[#B48209]';
  let label = 'Medium';

  if (norm === 'urgent') {
    bgClass = 'bg-[#FFE5D9] text-[#D97767] font-bold';
    label = 'Urgent';
  } else if (norm === 'high') {
    bgClass = 'bg-[#FFE5D9] text-[#D97767]';
    label = 'High';
  } else if (norm === 'low') {
    bgClass = 'bg-[#E0F2FE] text-[#0284C7]';
    label = 'Low';
  } else {
    bgClass = 'bg-[#FFF3C4] text-[#B48209]';
    label = 'Medium';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide shadow-xs ${bgClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};

export default PriorityBadge;

