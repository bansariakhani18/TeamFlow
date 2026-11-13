import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import PriorityBadge from '../components/PriorityBadge';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Kanban,
  Mail,
  Send,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AnalyticsDashboardPage = () => {
  const { projectId: routeProjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [activeProjectId, setActiveProjectId] = useState(routeProjectId || null);
  const [projectsList, setProjectsList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Date filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Reminder state: map of taskId -> boolean
  const [sendingReminderId, setSendingReminderId] = useState(null);

  // Notification log accordion for owners
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Resolve active project if not provided in URL
  useEffect(() => {
    const resolveInitialProject = async () => {
      try {
        const res = await axiosClient.get('/projects');
        const list = res.data?.data || res.data || [];
        setProjectsList(list);

        if (!activeProjectId && list.length > 0) {
          setActiveProjectId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load projects list:', err);
      }
    };

    resolveInitialProject();
  }, [activeProjectId]);

  // Sync route param change
  useEffect(() => {
    if (routeProjectId && routeProjectId !== activeProjectId) {
      setActiveProjectId(routeProjectId);
    }
  }, [routeProjectId, activeProjectId]);

  // Fetch project analytics
  const fetchAnalytics = useCallback(async () => {
    if (!activeProjectId) return;

    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await axiosClient.get(`/projects/${activeProjectId}/analytics`, { params });
      const data = res.data?.data || res.data;
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      const msg = err.response?.data?.message || 'Failed to load project analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, dateFrom, dateTo]);

  useEffect(() => {
    if (activeProjectId) {
      fetchAnalytics();
    }
  }, [activeProjectId, fetchAnalytics]);

  // Check if current user is project owner
  const isOwner = Boolean(
    analytics?.project?.owner &&
      user?._id &&
      (analytics.project.owner._id?.toString() === user._id.toString() ||
        analytics.project.owner.toString() === user._id.toString())
  );

  // Load notifications for owner
  const fetchNotifications = useCallback(async () => {
    if (!activeProjectId || !isOwner) return;
    setLoadingNotifications(true);
    try {
      const res = await axiosClient.get(`/projects/${activeProjectId}/notifications?limit=15`);
      const notifs = res.data?.data || [];
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  }, [activeProjectId, isOwner]);

  useEffect(() => {
    if (showNotifications && notifications.length === 0) {
      fetchNotifications();
    }
  }, [showNotifications, fetchNotifications, notifications.length]);

  // Export CSV Report Handler per SRS FR-4.2
  const handleExportCSV = async () => {
    if (!activeProjectId) return;

    setIsExporting(true);
    try {
      const res = await axiosClient.get(`/projects/${activeProjectId}/export/csv`, {
        responseType: 'blob',
      });

      // Create download anchor
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const projectName = analytics?.project?.name || 'project';
      const cleanName = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      link.setAttribute('download', `${cleanName}_tasks_report.csv`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      success('Tasks summary CSV report downloaded successfully');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toastError(err.response?.data?.message || 'Failed to generate CSV export');
    } finally {
      setIsExporting(false);
    }
  };

  // Send Reminder Handler per SRS FR-DSH-07
  const handleSendReminder = async (taskId, taskTitle) => {
    setSendingReminderId(taskId);
    try {
      await axiosClient.post(`/tasks/${taskId}/remind`);
      success(`Reminder email sent for "${taskTitle}"`);
      // Refresh notifications if open
      if (showNotifications) {
        fetchNotifications();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 502
          ? 'Email delivery failed (Resend API check)'
          : 'Failed to send reminder email');
      toastError(msg);
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const summary = analytics?.summary || {
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    overdueTasksCount: 0,
    dueSoonTasksCount: 0,
    activeContributors: 0,
    velocity: 0,
    byStatus: { todo: 0, in_progress: 0, review: 0, done: 0 },
  };

  const workload = analytics?.workload || [];
  const overdueTasks = analytics?.overdueTasks || [];
  const projectInfo = analytics?.project || {};

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3EF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb & Project Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Link
              to={activeProjectId ? `/projects/${activeProjectId}` : '/projects'}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#4E8765] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Workspace
            </Link>

            {projectsList.length > 1 && (
              <div className="flex items-center gap-2 pl-3 border-l border-stone-300">
                <span className="text-xs text-stone-500">Switch:</span>
                <select
                  value={activeProjectId || ''}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setActiveProjectId(newId);
                    navigate(`/projects/${newId}/dashboard`);
                  }}
                  className="text-xs font-semibold bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#4E8765]"
                >
                  {projectsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={activeProjectId ? `/projects/${activeProjectId}/board` : '/board'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/80 rounded-xl transition shadow-xs"
            >
              <Kanban className="w-3.5 h-3.5 text-[#4E8765]" />
              Kanban Board
            </Link>
          </div>
        </div>

        {/* Top Header Banner */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#E8F2EC] text-[#2D5A40] rounded-full border border-[#4E8765]/20">
                  Module 4 &bull; Analytics & Insights
                </span>
                {isOwner && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                    <ShieldCheck className="w-3 h-3 text-[#4E8765]" />
                    Project Owner
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight mb-2">
                {projectInfo.name || 'Workspace Analytics'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
                Comprehensive performance metrics, task completion rates, team workload allocation,
                and overdue monitoring.
              </p>
            </div>

            {/* Primary Action Button: Export CSV */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                title="Refresh Analytics"
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleExportCSV}
                disabled={isExporting || loading || summary.totalTasks === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#4E8765] hover:bg-[#3B6B50] shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating CSV...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export CSV Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Date Filter Bar */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-stone-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              Filter by Due Date:
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="analyticsDateFrom" className="text-stone-500">
                From:
              </label>
              <input
                id="analyticsDateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 text-xs focus:ring-1 focus:ring-[#4E8765]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="analyticsDateTo" className="text-stone-500">
                To:
              </label>
              <input
                id="analyticsDateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700 text-xs focus:ring-1 focus:ring-[#4E8765]"
              />
            </div>

            {(dateFrom || dateTo) && (
              <button
                onClick={handleResetFilters}
                className="text-stone-500 hover:text-[#D97767] underline text-xs font-medium ml-auto"
              >
                Clear Date Filters
              </button>
            )}
          </div>
        </section>

        {/* Loading & Error States */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <span className="mt-3 text-xs text-stone-500">Computing analytics pipeline...</span>
          </div>
        )}

        {error && !loading && (
          <div className="mb-8">
            <ErrorMessage message={error} onRetry={fetchAnalytics} />
          </div>
        )}

        {!loading && !error && summary.totalTasks === 0 && (
          <EmptyState
            icon={FileSpreadsheet}
            title="No tasks in this workspace yet"
            description="Create tasks on the Kanban board to view real-time completion analytics, workload distribution, and performance metrics."
            actionLabel="Open Kanban Board"
            onAction={() =>
              navigate(activeProjectId ? `/projects/${activeProjectId}/board` : '/board')
            }
          />
        )}

        {!loading && !error && summary.totalTasks > 0 && (
          <>
            {/* Metric Summary Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Card 1: Total Tasks */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Total Tasks
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
                    <Kanban className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-[#1F2937]">
                    {summary.totalTasks}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">registered</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">
                    {summary.byStatus?.todo || 0}
                  </span>{' '}
                  to do &bull;{' '}
                  <span className="font-semibold text-stone-700">
                    {summary.byStatus?.in_progress || 0}
                  </span>{' '}
                  active
                </div>
              </div>

              {/* Card 2: Completion Rate % */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Completion Rate
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#E8F2EC] text-[#2D5A40] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-[#2D5A40]">
                    {summary.completionRate}%
                  </span>
                  <span className="text-xs text-stone-400 font-medium">done</span>
                </div>
                <div className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-700">{summary.completedTasks}</span> of{' '}
                  <span className="font-semibold text-stone-700">{summary.totalTasks}</span> tasks
                  closed
                </div>
              </div>

              {/* Card 3: Active Contributors */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Active Teammates
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-[#1F2937]">
                    {summary.activeContributors}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">assigned</span>
                </div>
                <div className="text-xs text-stone-500">
                  Across{' '}
                  <span className="font-semibold text-stone-700">{workload.length}</span> recorded
                  buckets
                </div>
              </div>

              {/* Card 4: Team Velocity */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm transition hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Velocity
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#FFF3C4] text-[#B48209] flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-[#B48209]">
                    {summary.velocity}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">tasks / 7d</span>
                </div>
                <div className="text-xs text-stone-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#4E8765]" />
                  <span>Closed in the last 7 days</span>
                </div>
              </div>
            </section>

            {/* Charts & Distribution Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Task Distribution by Status */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#1F2937]">
                      Task Distribution by Status
                    </h2>
                    <span className="text-xs font-medium text-stone-400">
                      Total: {summary.totalTasks}
                    </span>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="h-5 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner mb-6">
                    {summary.totalTasks > 0 && (
                      <>
                        <div
                          style={{
                            width: `${((summary.byStatus?.todo || 0) / summary.totalTasks) * 100}%`,
                          }}
                          className="bg-stone-400 transition-all duration-500"
                          title={`To Do: ${summary.byStatus?.todo || 0}`}
                        />
                        <div
                          style={{
                            width: `${((summary.byStatus?.in_progress || 0) / summary.totalTasks) * 100}%`,
                          }}
                          className="bg-blue-400 transition-all duration-500"
                          title={`In Progress: ${summary.byStatus?.in_progress || 0}`}
                        />
                        <div
                          style={{
                            width: `${((summary.byStatus?.review || 0) / summary.totalTasks) * 100}%`,
                          }}
                          className="bg-amber-400 transition-all duration-500"
                          title={`In Review: ${summary.byStatus?.review || 0}`}
                        />
                        <div
                          style={{
                            width: `${((summary.byStatus?.done || 0) / summary.totalTasks) * 100}%`,
                          }}
                          className="bg-emerald-500 transition-all duration-500"
                          title={`Done: ${summary.byStatus?.done || 0}`}
                        />
                      </>
                    )}
                  </div>

                  {/* Status Legend Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/70">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                        <span className="text-xs font-semibold text-stone-700">To Do</span>
                      </div>
                      <div className="text-lg font-bold text-stone-800">
                        {summary.byStatus?.todo || 0}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {summary.totalTasks > 0
                          ? (
                              ((summary.byStatus?.todo || 0) / summary.totalTasks) *
                              100
                            ).toFixed(0)
                          : 0}
                        % of total
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <span className="text-xs font-semibold text-blue-800">In Progress</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900">
                        {summary.byStatus?.in_progress || 0}
                      </div>
                      <span className="text-[10px] text-blue-600">
                        {summary.totalTasks > 0
                          ? (
                              ((summary.byStatus?.in_progress || 0) / summary.totalTasks) *
                              100
                            ).toFixed(0)
                          : 0}
                        % of total
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-xs font-semibold text-amber-800">In Review</span>
                      </div>
                      <div className="text-lg font-bold text-amber-900">
                        {summary.byStatus?.review || 0}
                      </div>
                      <span className="text-[10px] text-amber-600">
                        {summary.totalTasks > 0
                          ? (
                              ((summary.byStatus?.review || 0) / summary.totalTasks) *
                              100
                            ).toFixed(0)
                          : 0}
                        % of total
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-800">Done</span>
                      </div>
                      <div className="text-lg font-bold text-emerald-900">
                        {summary.byStatus?.done || 0}
                      </div>
                      <span className="text-[10px] text-emerald-600">
                        {summary.totalTasks > 0
                          ? (
                              ((summary.byStatus?.done || 0) / summary.totalTasks) *
                              100
                            ).toFixed(0)
                          : 0}
                        % of total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Overview Sub-panel */}
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold text-stone-600">Priority Breakdown:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#FFE5D9] text-[#D97767] font-semibold">
                      Urgent: {summary.byPriority?.urgent || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FFE5D9] text-[#D97767] font-semibold">
                      High: {summary.byPriority?.high || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FFF3C4] text-[#B48209] font-semibold">
                      Medium: {summary.byPriority?.medium || 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-semibold">
                      Low: {summary.byPriority?.low || 0}
                    </span>
                  </div>
                </div>
              </section>

              {/* Workload Allocation per Member */}
              <section className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#1F2937]">
                      Workload Allocation per Member
                    </h2>
                    <span className="text-xs font-medium text-stone-400">
                      {workload.length} contributors
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                    {workload.map((item, idx) => {
                      const isUnassigned = item.name === 'Unassigned' || !item.userId;
                      const initials = item.name ? item.name.charAt(0).toUpperCase() : '?';

                      return (
                        <div
                          key={item.userId || `unassigned-${idx}`}
                          className="p-3 rounded-xl bg-stone-50/70 border border-stone-200/70"
                        >
                          <div className="flex items-center justify-between text-xs mb-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs uppercase select-none ${
                                  isUnassigned
                                    ? 'bg-stone-300 text-stone-700'
                                    : 'bg-[#1F2937] text-white'
                                }`}
                              >
                                {isUnassigned ? <User className="w-3.5 h-3.5" /> : initials}
                              </div>
                              <div>
                                <span className="font-semibold text-stone-800">{item.name}</span>
                                {item.email && (
                                  <span className="text-[10px] text-stone-400 block truncate max-w-[150px]">
                                    {item.email}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1F2937]">
                                {item.totalAssigned || item.assigned || 0} tasks
                              </span>
                              <span className="text-[11px] font-semibold text-stone-500 bg-white border border-stone-200 px-2 py-0.5 rounded-full">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>

                          {/* Member Workload Bar */}
                          <div className="w-full bg-stone-200/70 rounded-full h-2.5 overflow-hidden flex">
                            <div
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                isUnassigned ? 'bg-stone-400' : 'bg-[#4E8765]'
                              }`}
                            />
                          </div>

                          {/* Breakdown pills */}
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-stone-500">
                            <span>To Do: {item.todo ?? item.toDo ?? 0}</span>
                            <span>&bull;</span>
                            <span>Active: {item.inProgress ?? 0}</span>
                            <span>&bull;</span>
                            <span>Done: {item.done ?? 0}</span>
                            {(item.overdue || 0) > 0 && (
                              <>
                                <span>&bull;</span>
                                <span className="font-bold text-[#D97767]">
                                  {item.overdue} Overdue
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-400 flex items-center justify-between">
                  <span>Balanced distribution prevents team burnout</span>
                  <span className="text-[#4E8765] font-semibold">Active Pipeline</span>
                </div>
              </section>
            </div>

            {/* Overdue Tasks Section with Send Reminder CTA */}
            <section className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFE5D9] text-[#D97767] flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1F2937]">
                      Overdue Tasks ({overdueTasks.length})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Tasks past their due date that require attention or follow-up
                    </p>
                  </div>
                </div>

                {overdueTasks.length > 0 && isOwner && (
                  <span className="text-xs text-stone-500 italic">
                    Project owners can send email reminders directly
                  </span>
                )}
              </div>

              {overdueTasks.length === 0 ? (
                <div className="py-8 text-center bg-stone-50/60 rounded-xl border border-stone-200/60">
                  <CheckCircle2 className="w-8 h-8 text-[#4E8765] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-stone-700">All tasks are on track!</p>
                  <p className="text-xs text-stone-400">
                    No overdue tasks found for this workspace.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3">Task</th>
                        <th className="py-3 px-3">Priority</th>
                        <th className="py-3 px-3">Due Date</th>
                        <th className="py-3 px-3">Days Overdue</th>
                        <th className="py-3 px-3">Assignee</th>
                        {isOwner && <th className="py-3 px-3 text-right">Owner Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {overdueTasks.map((task) => {
                        const assignee = task.assignee || {};
                        const isSending = sendingReminderId === task._id;

                        return (
                          <tr key={task._id} className="hover:bg-stone-50/70 transition">
                            <td className="py-3 px-3 font-semibold text-stone-800 max-w-[240px] truncate">
                              {task.title}
                            </td>
                            <td className="py-3 px-3">
                              <PriorityBadge priority={task.priority} />
                            </td>
                            <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : 'No date'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFE5D9] text-[#D97767] border border-[#FBC4B8]">
                                <Clock className="w-3 h-3" />
                                {task.daysOverdue} {task.daysOverdue === 1 ? 'day' : 'days'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {assignee.name ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-md bg-[#1F2937] text-white flex items-center justify-center font-bold text-[9px] uppercase">
                                    {assignee.name.charAt(0)}
                                  </div>
                                  <span className="text-stone-700 truncate max-w-[140px]">
                                    {assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-stone-400 italic">Unassigned</span>
                              )}
                            </td>
                            {isOwner && (
                              <td className="py-3 px-3 text-right">
                                {assignee.name ? (
                                  <button
                                    onClick={() => handleSendReminder(task._id, task.title)}
                                    disabled={isSending}
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#D97767] bg-[#FFE5D9]/70 hover:bg-[#FFE5D9] border border-[#FBC4B8] rounded-lg transition disabled:opacity-50"
                                    title="Send reminder email via Resend"
                                  >
                                    {isSending ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3" />
                                    )}
                                    <span>Remind</span>
                                  </button>
                                ) : (
                                  <span className="text-stone-400 text-[10px]">Assign first</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Notification History Accordion (Project Owner Only) */}
            {isOwner && (
              <section className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden mb-8">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-stone-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-[#4E8765]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F2937]">
                        Email Notification Log (Resend API)
                      </h3>
                      <p className="text-xs text-stone-500">
                        Audit trail of assignment and reminder emails dispatched
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-400">
                    <span className="text-xs font-medium">
                      {showNotifications ? 'Hide Log' : 'View Log'}
                    </span>
                    {showNotifications ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {showNotifications && (
                  <div className="p-5 pt-0 border-t border-stone-100">
                    {loadingNotifications ? (
                      <div className="py-6 flex justify-center">
                        <Spinner size="sm" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <p className="py-4 text-xs text-stone-400 text-center">
                        No email notifications dispatched yet for this workspace.
                      </p>
                    ) : (
                      <div className="overflow-x-auto mt-3">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase text-[10px]">
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3">Recipient</th>
                              <th className="py-2.5 px-3">Task</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Dispatched At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {notifications.map((n) => (
                              <tr key={n._id} className="hover:bg-stone-50">
                                <td className="py-2.5 px-3 font-semibold text-stone-700">
                                  {n.type === 'TASK_ASSIGNED' ? 'Assignment' : 'Reminder'}
                                </td>
                                <td className="py-2.5 px-3 text-stone-600">
                                  {n.recipient?.name || n.recipient?.email || 'Teammate'}
                                </td>
                                <td className="py-2.5 px-3 text-stone-800 font-medium max-w-[200px] truncate">
                                  {n.task?.title || 'Task'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    title={n.error || (n.status === 'sent' ? `Delivered (ID: ${n.providerMessageId || 'OK'})` : 'Dispatch attempted')}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-help ${
                                      n.status === 'sent'
                                        ? 'bg-[#E8F2EC] text-[#2D5A40]'
                                        : 'bg-[#FFE5D9] text-[#D97767]'
                                    }`}
                                  >
                                    {n.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-stone-400 text-[11px] whitespace-nowrap">
                                  {new Date(n.createdAt).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AnalyticsDashboardPage;
