import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorMessage = ({ message = 'An error occurred', onRetry = null, className = '' }) => {
  return (
    <div
      className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900/60 dark:hover:bg-rose-800 dark:text-rose-100 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
