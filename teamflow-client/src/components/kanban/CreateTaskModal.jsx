import { useState, useRef, useEffect } from 'react';
import Modal from '../Modal';

export const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialStatus = 'todo',
  projectMembers = [],
  isLoading = false,
}) => {
  const titleInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: initialStatus,
    dueDate: '',
    assignedTo: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: initialStatus || 'todo',
        dueDate: '',
        assignedTo: '',
      });
      setErrors({});
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialStatus]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      status: formData.status,
      dueDate: formData.dueDate || null,
      assignedTo: formData.assignedTo || null,
      assignee: formData.assignedTo || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: null });
            }}
            placeholder="e.g. Design authentication workflow"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-stone-800 bg-stone-50/50 focus:bg-white focus:outline-none transition-all ${
              errors.title
                ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                : 'border-stone-200 focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC]'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors({ ...errors, description: null });
            }}
            placeholder="Provide context, acceptance criteria or details..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC] transition-all resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.description}</p>
          )}
        </div>

        {/* Priority & Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white focus:outline-none focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC]"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Initial Column
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white focus:outline-none focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC]"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Due Date & Assignee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white focus:outline-none focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC]"
            >
            </input>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Assignee
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 bg-white focus:outline-none focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC]"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => {
                const u = m.user || m;
                return (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name || u.email}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4E8765] hover:bg-[#3B6B50] rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : '+ Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;

