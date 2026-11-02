import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) => {
  const variantClasses = {
    danger:
      'bg-[#DC2626] hover:bg-[#B91C1C] text-white focus:ring-[#DC2626] shadow-sm',
    primary:
      'bg-[#4E8765] hover:bg-[#3B6B50] text-white focus:ring-[#4E8765] shadow-sm',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#FFE5D9] text-[#DC2626] flex items-center justify-center shrink-0 border border-[#FBC4B8]">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-0.5">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl transition focus:outline-none focus:ring-1 focus:ring-offset-1 ${
            variantClasses[confirmVariant] || variantClasses.danger
          } disabled:opacity-50`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
