import { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import ConfirmDialog from './ConfirmDialog';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import {
  X,
  MessageSquare,
  History,
  Send,
  AtSign,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Pastel badge mapping per action
const getActionBadge = (action) => {
  switch (action) {
    case 'TASK_CREATED':
      return { bg: 'bg-[#E8F2EC]', text: 'text-[#2D5A40]', label: 'Created' };
    case 'STATUS_CHANGED':
      return { bg: 'bg-[#FFF3C4]', text: 'text-[#B48209]', label: 'Status' };
    case 'TASK_ASSIGNED':
      return { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', label: 'Assigned' };
    case 'COMMENT_ADDED':
      return { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', label: 'Comment' };
    case 'COMMENT_DELETED':
      return { bg: 'bg-[#FFE5D9]', text: 'text-[#D97767]', label: 'Deleted' };
    case 'TASK_UPDATED':
      return { bg: 'bg-stone-100', text: 'text-stone-700', label: 'Updated' };
    default:
      return { bg: 'bg-stone-100', text: 'text-stone-700', label: action };
  }
};

const STATUS_TRANSITIONS = {
  todo: ['in_progress'],
  'To Do': ['in_progress'],
  in_progress: ['review', 'done', 'todo'],
  'In Progress': ['review', 'done', 'todo'],
  review: ['done', 'in_progress'],
  'In Review': ['done', 'in_progress'],
  done: ['review', 'in_progress'],
  'Done': ['review', 'in_progress'],
};

export const TaskDetailDrawer = ({
  isOpen,
  onClose,
  task,
  projectMembers = [],
  onUpdate,
  onStatusChange,
  onDelete,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

  // Task inline editing state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
  });

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Mention dropdown
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Activities state
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('');

  // Refs
  const commentInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Normalize project member list
  const normalizedMembers = (projectMembers || []).map((m) => {
    if (m.user && typeof m.user === 'object') {
      return {
        _id: m.user._id,
        name: m.user.name || 'Member',
        email: m.user.email || '',
      };
    }
    return {
      _id: m._id || m.id,
      name: m.name || 'Member',
      email: m.email || '',
    };
  });

  // Sync task form on open or task change
  useEffect(() => {
    if (task) {
      setTaskForm({
        title: task.title || '',
        description: task.description || '',
        priority: (task.priority || 'medium').toLowerCase(),
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assignedTo:
          task.assignedTo?._id ||
          task.assignedTo ||
          task.assignee?._id ||
          task.assignee ||
          '',
      });
      setIsEditingTask(false);
    }
  }, [task]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!task?._id) return;
    setLoadingComments(true);
    setCommentsError(null);
    try {
      const res = await axiosClient.get(`/tasks/${task._id}/comments`, {
        params: { order: 'asc', limit: 100 },
      });
      const data = res.data?.data || res.data || [];
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setCommentsError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [task?._id]);

  // Fetch task activity history
  const fetchActivities = useCallback(async () => {
    if (!task?._id) return;
    setLoadingActivities(true);
    setActivitiesError(null);
    try {
      const res = await axiosClient.get(`/tasks/${task._id}/activity`, {
        params: { limit: 50, action: activityFilter || undefined },
      });
      const data = res.data?.data || res.data || [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivitiesError(err.response?.data?.message || 'Failed to load task activity');
    } finally {
      setLoadingActivities(false);
    }
  }, [task?._id, activityFilter]);

  // Initial load when drawer opens
  useEffect(() => {
    if (isOpen && task?._id) {
      fetchComments();
      fetchActivities();
      // Auto-focus comment box
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 250);
    } else {
      setComments([]);
      setActivities([]);
      setCommentText('');
      setSelectedMentions([]);
      setEditingCommentId(null);
    }
  }, [isOpen, task?._id, fetchComments, fetchActivities]);

  // Handle typing in comment textarea & @mention detection
  const handleCommentChange = (e) => {
    const val = e.target.value;
    setCommentText(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && (lastAt === 0 || /\s/.test(textBeforeCursor[lastAt - 1]))) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!/\s/.test(query)) {
        setMentionQuery(query);
        setMentionMenuOpen(true);
        setMentionIndex(lastAt);
        return;
      }
    }
    setMentionMenuOpen(false);
  };

  // Insert mention into textarea
  const insertMention = (member) => {
    const beforeAt = commentText.slice(0, mentionIndex);
    const afterCursor = commentText.slice(mentionIndex + mentionQuery.length + 1);
    const newText = `${beforeAt}@${member.name} ${afterCursor}`;
    setCommentText(newText);

    if (!selectedMentions.includes(member._id)) {
      setSelectedMentions((prev) => [...prev, member._id]);
    }

    setMentionMenuOpen(false);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Add mention via quick badge pill click
  const handleQuickMention = (member) => {
    if (!commentText.includes(`@${member.name}`)) {
      const newText = commentText.trim() ? `${commentText} @${member.name} ` : `@${member.name} `;
      setCommentText(newText);
    }
    if (!selectedMentions.includes(member._id)) {
      setSelectedMentions((prev) => [...prev, member._id]);
    }
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Submit comment
  const handleSubmitComment = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || isSubmittingComment || !task?._id) return;

    setIsSubmittingComment(true);
    try {
      const res = await axiosClient.post(`/tasks/${task._id}/comments`, {
        text: commentText.trim(),
        mentions: selectedMentions,
      });
      const newComment = res.data?.data || res.data;
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setSelectedMentions([]);
      success('Comment posted');

      // Refresh activity timeline to show COMMENT_ADDED
      fetchActivities();

      // Scroll to bottom of comments
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Save comment edit
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim() || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      const res = await axiosClient.put(`/comments/${commentId}`, {
        text: editText.trim(),
      });
      const updated = res.data?.data || res.data;
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, ...updated } : c))
      );
      setEditingCommentId(null);
      setEditText('');
      success('Comment updated');
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update comment');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axiosClient.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      success('Comment deleted');
      fetchActivities();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Handle task metadata edit submit
  const handleSaveTaskEdit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (onUpdate) {
      onUpdate(task._id, {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || null,
        assignee: taskForm.assignedTo || null,
      });
    }
    setIsEditingTask(false);
    success('Task details updated');
  };

  // Filter mention suggestions
  const filteredMentionMembers = normalizedMembers.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Render comment text with highlighted @mentions
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_\s]+?)(?=\s|[.,!?]|$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold bg-[#F3E8FF] text-[#7E22CE] mx-0.5"
          >
            <AtSign className="w-2.5 h-2.5 inline" />
            {part.slice(1)}
          </span>
        );
      }
      return part;
    });
  };

  if (!isOpen || !task) return null;

  const currentUserId = user?._id || user?.id;
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    !['done', 'Done'].includes(task.status);

  const availableTransitions =
    STATUS_TRANSITIONS[task.status] || ['in_progress'];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Slide-Over Drawer Container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <aside className="w-screen max-w-xl bg-[#F4F3EF] shadow-2xl flex flex-col border-l border-stone-200/80 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-5 bg-white border-b border-stone-200/80 flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFE5D9] text-[#D97767]">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight truncate">
                  {task.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingTask(!isEditingTask)}
                  className={`p-2 rounded-xl text-xs font-semibold transition ${
                    isEditingTask
                      ? 'bg-stone-200 text-stone-800'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                  title={isEditingTask ? 'Cancel editing' : 'Edit task details'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  title="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Shift Bar */}
            <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-semibold uppercase text-[10px] tracking-wider">
                Move Status:
              </span>
              <div className="flex items-center gap-1.5">
                {availableTransitions.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    type="button"
                    onClick={() => onStatusChange && onStatusChange(task._id, nextStatus)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-stone-200 hover:border-[#4E8765] hover:text-[#4E8765] shadow-2xs transition capitalize flex items-center gap-1"
                  >
                    <span>{nextStatus.replace('_', ' ')}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="px-6 bg-white border-b border-stone-200/80 flex items-center gap-6 text-sm font-semibold text-stone-500">
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-[#4E8765] text-[#4E8765]'
                    : 'border-transparent hover:text-stone-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discussion</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-[#F4F3EF] text-stone-600 font-bold">
                  {comments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`py-3.5 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === 'activity'
                    ? 'border-[#4E8765] text-[#4E8765]'
                    : 'border-transparent hover:text-stone-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Activity History</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-[#F4F3EF] text-stone-600 font-bold">
                  {activities.length}
                </span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Edit Form OR Overview Card */}
              {isEditingTask ? (
                <form
                  onSubmit={handleSaveTaskEdit}
                  className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Edit Task Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingTask(false)}
                      className="text-xs text-stone-400 hover:text-stone-700"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#4E8765]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={taskForm.description}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, description: e.target.value })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#4E8765]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, priority: e.target.value })
                        }
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, dueDate: e.target.value })
                        }
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Assignee
                      </label>
                      <select
                        value={taskForm.assignedTo}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, assignedTo: e.target.value })
                        }
                        className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="">Unassigned</option>
                        {normalizedMembers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingTask(false)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs rounded-xl bg-[#4E8765] text-white hover:bg-[#3B6B50] font-semibold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-stone-400 font-medium block mb-1">Assignee</span>
                      <div className="flex items-center gap-2 text-stone-800 font-semibold">
                        <div className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center text-xs font-bold">
                          {task.assignee?.name?.charAt(0) ||
                            task.assignedTo?.name?.charAt(0) ||
                            '?'}
                        </div>
                        <span>
                          {task.assignee?.name || task.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-stone-400 font-medium block mb-1">Due Date</span>
                      <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                        <Calendar className="w-4 h-4 text-stone-400" />
                        <span>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'No due date'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {task.description && (
                    <div className="pt-3 border-t border-stone-100">
                      <span className="text-stone-400 text-xs font-medium block mb-1">
                        Description
                      </span>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: COMMENTS / DISCUSSION */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Conversation Thread
                    </h3>
                    <span className="text-xs text-stone-400">
                      Use <strong className="text-[#7E22CE]">@mention</strong> to tag teammates
                    </span>
                  </div>

                  {loadingComments ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <Spinner size="md" />
                      <p className="text-xs text-stone-400 mt-2">Loading discussion...</p>
                    </div>
                  ) : commentsError ? (
                    <ErrorMessage message={commentsError} onRetry={fetchComments} />
                  ) : comments.length === 0 ? (
                    <div className="bg-white/60 border border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center mx-auto">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-stone-800">
                        No comments yet
                      </p>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto">
                        Start the collaboration! Share updates, tag team members with @mention, or leave feedback.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const isAuthor =
                          comment.author &&
                          (comment.author._id === currentUserId ||
                            comment.author.id === currentUserId ||
                            comment.author === currentUserId);
                        const isEditing = editingCommentId === comment._id;

                        return (
                          <div
                            key={comment._id}
                            className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs transition-all hover:border-stone-300 space-y-2"
                          >
                            {/* Comment Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#E8F2EC] text-[#2D5A40] flex items-center justify-center text-xs font-bold">
                                  {comment.author?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-stone-900 block leading-tight">
                                    {comment.author?.name || 'Teammate'}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                                    <span>{formatRelativeTime(comment.createdAt)}</span>
                                    {comment.editedAt && (
                                      <span className="italic text-stone-400">
                                        (edited)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Author Actions */}
                              {isAuthor && !isEditing && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment._id);
                                      setEditText(comment.text);
                                    }}
                                    className="p-1 rounded-lg text-stone-400 hover:text-[#4E8765] hover:bg-stone-50 transition"
                                    title="Edit comment"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="p-1 rounded-lg text-stone-400 hover:text-[#D97767] hover:bg-[#FFE5D9]/50 transition"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Comment Body / Edit Form */}
                            {isEditing ? (
                              <div className="space-y-2 pt-1">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={2}
                                  className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] bg-stone-50"
                                  maxLength={1000}
                                />
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-stone-400">
                                    {editText.length} / 1000
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setEditingCommentId(null)}
                                      className="px-2.5 py-1 rounded-lg text-stone-600 hover:bg-stone-100 font-medium"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(comment._id)}
                                      disabled={!editText.trim() || isSavingEdit}
                                      className="px-3 py-1 rounded-lg bg-[#4E8765] text-white font-semibold hover:bg-[#3B6B50] disabled:opacity-50"
                                    >
                                      {isSavingEdit ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                                {renderFormattedText(comment.text)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                      <div ref={commentsEndRef} />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TASK ACTIVITY HISTORY */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" />
                      Task Audit Log
                    </h3>
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-stone-600 focus:outline-none focus:border-[#4E8765]"
                    >
                      <option value="">All Events</option>
                      <option value="COMMENT_ADDED">Comments</option>
                      <option value="STATUS_CHANGED">Status</option>
                      <option value="TASK_ASSIGNED">Assignment</option>
                      <option value="TASK_CREATED">Creation</option>
                    </select>
                  </div>

                  {loadingActivities ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <Spinner size="md" />
                      <p className="text-xs text-stone-400 mt-2">Loading task history...</p>
                    </div>
                  ) : activitiesError ? (
                    <ErrorMessage message={activitiesError} onRetry={fetchActivities} />
                  ) : activities.length === 0 ? (
                    <div className="bg-white/60 border border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-2">
                      <p className="text-sm font-semibold text-stone-800">
                        No activity events recorded
                      </p>
                      <p className="text-xs text-stone-500">
                        Actions like status changes and comments on this task will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                      {activities.map((act) => {
                        const badge = getActionBadge(act.action);
                        return (
                          <div key={act._id} className="relative group">
                            {/* Dot marker */}
                            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#4E8765]" />

                            <div className="bg-white border border-stone-200/80 rounded-xl p-3.5 shadow-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}
                                >
                                  {badge.label}
                                </span>
                                <span className="text-[11px] text-stone-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatRelativeTime(act.createdAt || act.timestamp)}
                                </span>
                              </div>

                              <p className="text-xs text-stone-800">
                                <strong className="font-semibold text-stone-900">
                                  {act.actor?.name || 'Someone'}
                                </strong>{' '}
                                {act.action === 'TASK_CREATED' && 'created this task'}
                                {act.action === 'STATUS_CHANGED' && (
                                  <span>
                                    changed status to{' '}
                                    <span className="font-semibold">{act.details?.to || 'new status'}</span>
                                  </span>
                                )}
                                {act.action === 'TASK_ASSIGNED' && 'updated the task assignee'}
                                {act.action === 'COMMENT_ADDED' && 'added a comment'}
                                {act.action === 'COMMENT_DELETED' && 'removed a comment'}
                                {act.action === 'TASK_UPDATED' && 'updated task details'}
                              </p>

                              {act.details?.textSnippet && (
                                <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded-lg border border-stone-100">
                                  "{act.details.textSnippet}"
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comment Composer Footer (Active when on Comments tab) */}
            {activeTab === 'comments' && (
              <div className="p-4 bg-white border-t border-stone-200/80 space-y-3 relative">
                {/* @Mention Floating Autocomplete Dropdown */}
                {mentionMenuOpen && filteredMentionMembers.length > 0 && (
                  <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-20 max-h-44 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-[#7E22CE]" /> Mention Teammate
                    </div>
                    {filteredMentionMembers.map((member) => (
                      <button
                        key={member._id}
                        type="button"
                        onClick={() => insertMention(member)}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#F3E8FF]/60 flex items-center justify-between text-xs transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#E8F2EC] text-[#2D5A40] flex items-center justify-center font-bold text-xs">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-stone-800">
                            {member.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {member.email}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Teammate Mention Chips */}
                {normalizedMembers.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] text-stone-400 font-medium shrink-0 flex items-center gap-1">
                      <AtSign className="w-3 h-3 text-[#7E22CE]" /> Mention:
                    </span>
                    {normalizedMembers.slice(0, 5).map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => handleQuickMention(m)}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3E8FF] text-[#7E22CE] hover:bg-[#E9D5FF] transition shrink-0"
                      >
                        @{m.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Textarea Form */}
                <form onSubmit={handleSubmitComment} className="space-y-2">
                  <div className="relative">
                    <textarea
                      ref={commentInputRef}
                      rows={3}
                      value={commentText}
                      onChange={handleCommentChange}
                      placeholder="Write a comment... Type @ to mention a teammate"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F4F3EF]/60 border border-stone-200 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] text-stone-900 placeholder:text-stone-400 transition"
                      maxLength={1000}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-medium ${
                        commentText.length > 900
                          ? 'text-[#D97767]'
                          : 'text-stone-400'
                      }`}
                    >
                      {commentText.length} / 1000
                    </span>

                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4E8765] hover:bg-[#3B6B50] text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmittingComment ? (
                        <>
                          <Spinner size="xs" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Post Comment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          if (onDelete) {
            onDelete(task._id);
          }
        }}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${task.title}" and its comments? This action cannot be undone.`}
        confirmText="Delete Task"
        isDanger={true}
      />
    </>
  );
};

export default TaskDetailDrawer;
