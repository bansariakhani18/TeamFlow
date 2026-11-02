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
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-white/80 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0F172A] mb-3 border border-slate-200/80">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#0F172A] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
