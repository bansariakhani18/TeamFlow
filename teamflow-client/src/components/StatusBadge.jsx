export const StatusBadge = ({ status = 'todo', className = '' }) => {
  const norm = (status || '').toLowerCase().replace(' ', '_');

  let bgClass = 'bg-stone-100 text-stone-700 border-stone-200';
  let label = 'To Do';

  if (norm === 'in_progress') {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'In Progress';
  } else if (norm === 'review' || norm === 'in_review') {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'In Review';
  } else if (norm === 'done') {
    bgClass = 'bg-[#E8F2EC] text-[#2D5A40] border-emerald-200';
    label = 'Done';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${bgClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
};

export default StatusBadge;
