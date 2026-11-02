import { FolderGit2 } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FolderGit2,
  title = 'No items found',
  description = 'Get started by creating your first workspace.',
  action = null,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-[#4E8765] mb-3 border border-stone-200/80">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#1F2937] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
