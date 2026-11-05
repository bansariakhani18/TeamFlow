import { useState, useEffect } from 'react';
import Modal from '../Modal';
import PriorityBadge from '../PriorityBadge';
import StatusBadge from '../StatusBadge';
import ConfirmDialog from '../ConfirmDialog';

export const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  projectMembers = [],
  onUpdate,
  onStatusChange,
  onDelete,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title || '',
        description: task.description || '',
        priority: (task.priority || 'medium').toLowerCase(),
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo: (task.assignedTo?._id || task.assignedTo || task.assignee?._id || task.assignee || ''),
      });
      setIsEditing(false);
    }
  }, [task]);

  if (!task) return null;

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    onUpdate(task._id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
      assignedTo: editForm.assignedTo || null,
      assignee: editForm.assignedTo || null,
    });
    setIsEditing(false);
  };

  const assigneeUser = task.assignedTo || task.assignee;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Task Details" maxWidth="max-w-2xl">
        <div className="space-y-6">
          {/* Header Row: Status, Priority, Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Task'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC] outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none"
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#4E8765] hover:bg-[#3B6B50] rounded-xl shadow-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900 leading-snug">{task.title}</h2>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                  {task.description || (
                    <span className="italic text-stone-400">No description provided.</span>
                  )}
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200/60 text-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Assigned To
                  </span>
                  {assigneeUser ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E8F2EC] text-[#2D5A40] flex items-center justify-center font-bold text-[10px]">
                        {assigneeUser.name ? assigneeUser.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <span className="font-medium text-stone-800">
                        {assigneeUser.name || assigneeUser.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-stone-400 font-medium">Unassigned</span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Due Date
                  </span>
                  <span className="font-medium text-stone-800">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'None'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Created By
                  </span>
                  <span className="font-medium text-stone-800">
                    {task.createdBy?.name || 'Team member'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
                    Created At
                  </span>
                  <span className="font-medium text-stone-800">
                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status Workflow Actions */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
                  Workflow State Transition:
                </span>
                <div className="flex flex-wrap gap-2">
                  {['todo', 'in_progress', 'review', 'done'].map((st) => {
                    const isCurrent = (task.status || '').toLowerCase().replace(' ', '_') === st;
                    return (
                      <button
                        key={st}
                        disabled={isCurrent || isLoading}
                        onClick={() => onStatusChange(task._id, st)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-[#E8F2EC] text-[#2D5A40] border border-emerald-300 cursor-default'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isCurrent ? '✓ ' : ''}
                        {st === 'todo' ? 'To Do' : st === 'in_progress' ? 'In Progress' : st === 'review' ? 'In Review' : 'Done'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDelete(task._id);
          setShowDeleteConfirm(false);
          onClose();
        }}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${task.title}"? This cannot be undone.`}
        confirmText="Delete Task"
      />
    </>
  );
};

export default TaskDetailModal;
