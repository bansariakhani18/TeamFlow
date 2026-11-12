import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import {
  Activity,
  MessageSquare,
  UserPlus,
  UserMinus,
  Trash2,
  Clock,
  Filter,
  RefreshCw,
  ArrowRight,
  PlusCircle,
  FileText,
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getActionDetails = (act) => {
  switch (act.action) {
    case 'COMMENT_ADDED':
      return {
        badgeBg: 'bg-[#F3E8FF]',
        badgeText: 'text-[#7E22CE]',
        badgeBorder: 'border-purple-200/60',
        label: 'Comment',
        icon: MessageSquare,
        renderDescription: () => (
          <span>
            commented on{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.task?.title || act.target || 'a task'}
            </strong>
          </span>
        ),
      };
    case 'COMMENT_DELETED':
      return {
        badgeBg: 'bg-[#FFE5D9]',
        badgeText: 'text-[#D97767]',
        badgeBorder: 'border-rose-200/60',
        label: 'Comment Removed',
        icon: Trash2,
        renderDescription: () => (
          <span>
            removed a comment on{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.target || 'a task'}
            </strong>
          </span>
        ),
      };
    case 'TASK_CREATED':
      return {
        badgeBg: 'bg-[#E8F2EC]',
        badgeText: 'text-[#2D5A40]',
        badgeBorder: 'border-emerald-200/60',
        label: 'New Task',
        icon: PlusCircle,
        renderDescription: () => (
          <span>
            created task{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.task?.title || act.target || 'Task'}
            </strong>
          </span>
        ),
      };
    case 'STATUS_CHANGED':
      return {
        badgeBg: 'bg-[#FFF3C4]',
        badgeText: 'text-[#B48209]',
        badgeBorder: 'border-amber-200/60',
        label: 'Status Shift',
        icon: ArrowRight,
        renderDescription: () => (
          <span>
            moved{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.task?.title || act.target || 'a task'}
            </strong>{' '}
            to{' '}
            <span className="font-semibold text-stone-900 uppercase text-[11px] tracking-wide">
              {act.details?.to || 'new status'}
            </span>
          </span>
        ),
      };
    case 'TASK_ASSIGNED':
      return {
        badgeBg: 'bg-[#E0F2FE]',
        badgeText: 'text-[#0284C7]',
        badgeBorder: 'border-sky-200/60',
        label: 'Assignment',
        icon: UserPlus,
        renderDescription: () => (
          <span>
            reassigned task{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.task?.title || act.target || 'a task'}
            </strong>
          </span>
        ),
      };
    case 'TASK_DELETED':
      return {
        badgeBg: 'bg-[#FFE5D9]',
        badgeText: 'text-[#D97767]',
        badgeBorder: 'border-rose-200/60',
        label: 'Task Deleted',
        icon: Trash2,
        renderDescription: () => (
          <span>
            deleted task{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.target || 'a task'}
            </strong>
          </span>
        ),
      };
    case 'MEMBER_ADDED':
      return {
        badgeBg: 'bg-[#E8F2EC]',
        badgeText: 'text-[#2D5A40]',
        badgeBorder: 'border-emerald-200/60',
        label: 'Member Added',
        icon: UserPlus,
        renderDescription: () => (
          <span>
            added{' '}
            <strong className="text-stone-900 font-semibold">
              {act.details?.memberEmail || act.target || 'a teammate'}
            </strong>{' '}
            to the workspace
          </span>
        ),
      };
    case 'MEMBER_REMOVED':
      return {
        badgeBg: 'bg-[#FFE5D9]',
        badgeText: 'text-[#D97767]',
        badgeBorder: 'border-rose-200/60',
        label: 'Member Left',
        icon: UserMinus,
        renderDescription: () => (
          <span>
            removed{' '}
            <strong className="text-stone-900 font-semibold">
              {act.details?.memberName || act.target || 'a member'}
            </strong>{' '}
            from workspace
          </span>
        ),
      };
    default:
      return {
        badgeBg: 'bg-stone-100',
        badgeText: 'text-stone-700',
        badgeBorder: 'border-stone-200',
        label: act.action || 'Activity',
        icon: FileText,
        renderDescription: () => (
          <span>
            performed {act.action} on{' '}
            <strong className="text-stone-900 font-semibold">
              {act.taskTitle || act.target || 'item'}
            </strong>
          </span>
        ),
      };
  }
};

export const ActivityFeed = ({
  projectId: propProjectId,
  showHeader = true,
  maxHeight = null,
}) => {
  const { projectId: routeProjectId } = useParams();
  const projectId = propProjectId || routeProjectId;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = useCallback(
    async (isManualRefresh = false, targetPage = 1) => {
      if (!projectId) return;

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (targetPage === 1) {
        setLoading(true);
      }

      setError(null);
      try {
        const res = await axiosClient.get(`/projects/${projectId}/activity`, {
          params: {
            page: targetPage,
            limit: 20,
            action: selectedAction || undefined,
          },
        });

        const data = res.data?.data || res.data || [];
        const pagination = res.data?.pagination || {};

        if (targetPage === 1) {
          setActivities(Array.isArray(data) ? data : []);
        } else {
          setActivities((prev) => [...prev, ...data]);
        }

        setPage(targetPage);
        setTotalCount(pagination.total || data.length);
        setHasMore(targetPage < (pagination.pages || 1));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load activity timeline');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [projectId, selectedAction]
  );

  useEffect(() => {
    fetchActivities(false, 1);
  }, [fetchActivities]);

  const FILTER_OPTIONS = [
    { label: 'All Actions', value: '' },
    { label: 'Comments', value: 'COMMENT_ADDED' },
    { label: 'Status Updates', value: 'STATUS_CHANGED' },
    { label: 'Tasks Created', value: 'TASK_CREATED' },
    { label: 'Assignments', value: 'TASK_ASSIGNED' },
  ];

  return (
    <section className="bg-white border border-stone-200/80 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header & Controls */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                  Team Activity Timeline
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F4F3EF] text-stone-600">
                  {totalCount} events
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Audited real-time log of team comments, workflow changes, and contributions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchActivities(true, 1)}
              disabled={isRefreshing || loading}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition shadow-xs flex items-center gap-1.5 text-xs font-medium"
              title="Refresh timeline"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#4E8765]' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedAction(opt.value)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition shrink-0 ${
              selectedAction === opt.value
                ? 'bg-[#4E8765] text-white shadow-xs'
                : 'bg-[#F4F3EF] text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-xs font-medium text-stone-500 mt-3">
            Loading team timeline...
          </p>
        </div>
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={() => fetchActivities(false, 1)}
          className="my-4"
        />
      ) : activities.length === 0 ? (
        <div className="bg-[#F4F3EF]/60 border border-dashed border-stone-300 rounded-2xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center mx-auto mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">
            No activity events recorded yet
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Team actions such as task creation, column status shifts, and conversation comments will stream here live.
          </p>
        </div>
      ) : (
        <div
          className={`space-y-4 ${
            maxHeight ? `overflow-y-auto pr-1 ${maxHeight}` : ''
          }`}
        >
          <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
            {activities.map((act) => {
              const details = getActionDetails(act);
              const IconComponent = details.icon;
              const actorName = act.actor?.name || 'A teammate';
              const actorInitial = actorName.charAt(0).toUpperCase();

              return (
                <div key={act._id} className="relative group">
                  {/* Timeline icon node */}
                  <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#4E8765] flex items-center justify-center shadow-xs">
                    <IconComponent className="w-3 h-3 text-[#4E8765]" />
                  </div>

                  {/* Card Container */}
                  <div className="bg-[#F4F3EF]/40 hover:bg-[#F4F3EF]/70 border border-stone-200/80 rounded-2xl p-4 shadow-xs transition-colors space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Actor Badge */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#E8F2EC] text-[#2D5A40] flex items-center justify-center font-bold text-[10px]">
                            {actorInitial}
                          </div>
                          <span className="text-xs font-bold text-stone-900">
                            {actorName}
                          </span>
                        </div>

                        {/* Action Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${details.badgeBg} ${details.badgeText} ${details.badgeBorder}`}
                        >
                          {details.label}
                        </span>
                      </div>

                      {/* Relative Timestamp */}
                      <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(act.createdAt || act.timestamp)}
                      </span>
                    </div>

                    {/* Formatted description text */}
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {details.renderDescription()}
                    </p>

                    {/* Snippet / Metadata Details if present */}
                    {act.details?.textSnippet && (
                      <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 text-xs text-stone-600 italic">
                        "{act.details.textSnippet}"
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination Button */}
          {hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={() => fetchActivities(false, page + 1)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-xs transition"
              >
                Load Older Activities
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ActivityFeed;
