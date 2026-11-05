export const ErrorMessage = ({ message = 'An error occurred', onRetry, className = '' }) => {
  return (
    <div className={`p-4 bg-red-50/80 border border-red-200/80 rounded-2xl text-red-800 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

