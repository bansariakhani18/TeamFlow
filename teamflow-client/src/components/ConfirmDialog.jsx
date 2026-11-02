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
      'bg-[#B91C1C] hover:bg-[#991B1B] text-white focus:ring-[#B91C1C] shadow-sm',
    primary:
      'bg-[#0D5C46] hover:bg-[#094232] text-white focus:ring-[#0D5C46] shadow-sm',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5 mb-6">
        <div className="w-9 h-9 rounded-lg bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0 border border-[#FCA5A5]/40">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">
          {message}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition focus:outline-none focus:ring-1 focus:ring-offset-1 ${
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
