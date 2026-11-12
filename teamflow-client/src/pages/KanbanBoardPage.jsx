import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import KanbanColumn from '../components/kanban/KanbanColumn';
import CreateTaskModal from '../components/kanban/CreateTaskModal';
import TaskDetailModal from '../components/kanban/TaskDetailModal';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import { useAuth } from '../context/AuthContext';

const KANBAN_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-stone-400', transitions: ['in_progress'] },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-400', transitions: ['review', 'done', 'todo'] },
  { id: 'review', title: 'In Review', color: 'bg-amber-400', transitions: ['done', 'in_progress'] },
  { id: 'done', title: 'Done', color: 'bg-emerald-400', transitions: ['review', 'in_progress'] },
];

export const KanbanBoardPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createColumnId, setCreateColumnId] = useState('todo');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project details and tasks
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      // If no projectId in URL, get first available project or create default
      let activeProjectId = projectId;
      if (!activeProjectId) {
        try {
          const projRes = await axiosClient.get('/projects');
          const projs = projRes.data?.data || projRes.data;
          if (projs && projs.length > 0) {
            activeProjectId = projs[0]._id;
            setProject(projs[0]);
          }
        } catch (e) {
          // Projects endpoint might not be populated yet
        }
      } else {
        try {
          const projRes = await axiosClient.get(`/projects/${activeProjectId}`);
          setProject(projRes.data?.data || projRes.data);
        } catch (e) {
          // Continue
        }
      }

      // Fetch tasks for the project
      const endpoint = activeProjectId
        ? `/projects/${activeProjectId}/tasks`
        : '/projects/default/tasks';

      const taskRes = await axiosClient.get(endpoint, {
        params: {
          search: searchQuery || undefined,
          priority: priorityFilter || undefined,
          assignee: assigneeFilter || undefined,
          overdue: overdueOnly ? 'true' : undefined,
        },
      });

      const loadedTasks = taskRes.data?.data || taskRes.data || [];
      setTasks(loadedTasks);
    } catch (err) {
      console.error('Failed to load board tasks:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, searchQuery, priorityFilter, assigneeFilter, overdueOnly]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle task creation
  const handleCreateTask = async (taskData) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const targetProjId = project?._id || projectId || 'default';
      const res = await axiosClient.post(`/projects/${targetProjId}/tasks`, taskData);
      const created = res.data?.data || res.data;
      setTasks((prev) => [created, ...prev]);
      setIsCreateOpen(false);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status column movement
  const handleMoveStatus = async (taskId, targetStatus) => {
    setActionError(null);
    try {
      const res = await axiosClient.patch(`/tasks/${taskId}/status`, {
        status: targetStatus,
      });
      const updated = res.data?.data || res.data;

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus, ...updated } : t))
      );

      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask((prev) => ({ ...prev, status: targetStatus, ...updated }));
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'Status transition not permitted');
    }
  };

  // Handle full task edit
  const handleUpdateTask = async (taskId, updatedData) => {
    setIsSubmitting(true);
    setActionError(null);
    try {
      const res = await axiosClient.put(`/tasks/${taskId}`, updatedData);
      const updated = res.data?.data || res.data;

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, ...updated } : t))
      );

      setSelectedTask(updated);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    setActionError(null);
    try {
      await axiosClient.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setIsDetailOpen(false);
      setSelectedTask(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Group tasks into the 4 columns
  const getTasksForColumn = (columnId) => {
    return tasks.filter((task) => {
      const s = (task.status || '').toLowerCase().replace(' ', '_');
      if (columnId === 'todo') return s === 'todo' || s === 'to_do';
      if (columnId === 'in_progress') return s === 'in_progress';
      if (columnId === 'review') return s === 'review' || s === 'in_review';
      if (columnId === 'done') return s === 'done';
      return false;
    });
  };

  // Open task detail
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  // Open create task modal for specific column
  const handleOpenCreate = (columnId = 'todo') => {
    setCreateColumnId(columnId);
    setIsCreateOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F3EF] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#E8F2EC] text-[#2D5A40] rounded-lg">
                Module 2
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {project?.name || 'Task & Kanban Board'}
              </h1>
            </div>
            <p className="mt-1 text-sm text-stone-600">
              {project?.description || 'Manage tasks, assign team members, and navigate the Kanban workflow.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              title="Refresh Tasks"
              className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors shadow-xs"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <button
              onClick={() => handleOpenCreate('todo')}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#4E8765] hover:bg-[#3B6B50] rounded-xl shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Create Task</span>
            </button>
          </div>
        </div>

        {/* Global Action Error / Toast Alert */}
        {actionError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-xs font-bold text-amber-700 hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title..."
                className="w-full pl-9 pr-4 py-2 text-sm text-stone-800 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#4E8765] focus:ring-2 focus:ring-[#E8F2EC] transition-all"
              />
              <svg
                className="w-4 h-4 text-stone-400 absolute left-3 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4E8765]"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#4E8765]"
            >
              <option value="">All Members</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>

            {/* Overdue Toggle */}
            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border ${
                overdueOnly
                  ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {overdueOnly ? 'ðŸ”¥ Overdue Only' : 'Overdue'}
            </button>
          </div>
        </div>

        {/* Board View / Status handling */}
        {loading ? (
          <div className="py-24">
            <Spinner size="lg" />
            <p className="text-center text-sm font-medium text-stone-500 mt-2">
              Loading Kanban workflow...
            </p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchData} className="my-8" />
        ) : (
          /* 4 Kanban Columns Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getTasksForColumn(col.id)}
                onSelectTask={handleSelectTask}
                onMoveStatus={handleMoveStatus}
                onAddTask={handleOpenCreate}
                transitions={col.transitions}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
        initialStatus={createColumnId}
        projectMembers={project?.members || []}
        isLoading={isSubmitting}
      />

      <TaskDetailDrawer
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        projectMembers={project?.members || []}
        onUpdate={handleUpdateTask}
        onStatusChange={handleMoveStatus}
        onDelete={handleDeleteTask}
      />
    </div>
  );
};

export default KanbanBoardPage;

