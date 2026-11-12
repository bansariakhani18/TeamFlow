import { AlertCircle, RotateCcw } from 'lucide-react';

export const ErrorMessage = ({ message = 'An error occurred', onRetry = null, className = '' }) => {
  return (
    <div
      className={`p-3.5 rounded-xl bg-[#FFE5D9] border border-[#FBC4B8] text-[#D97767] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-4 h-4 text-[#D97767] shrink-0" />
        <span className="text-xs sm:text-sm font-medium">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white border border-[#FBC4B8] hover:bg-[#FFE5D9]/50 text-[#D97767] transition"
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
