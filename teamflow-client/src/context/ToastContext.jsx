import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-md border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-[#E8F2EC] border-[#CBE4D6] text-[#2D5A40]'
                : t.type === 'error'
                ? 'bg-[#FFE5D9] border-[#FBC4B8] text-[#D97767]'
                : 'bg-white border-stone-200 text-[#1F2937]'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#4E8765] shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#D97767] shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-[#4E8765] shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">{t.message}</div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-stone-400 hover:text-stone-600 p-0.5 rounded transition"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
