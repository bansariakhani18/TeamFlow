import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import {
  Plus,
  Search,
  ArrowUpDown,
  Calendar,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Loader2,
  FolderGit2,
} from 'lucide-react';

export const ProjectsPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 1 });

  // Create Project Modal state & ref
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStartDate, setNewProjectStartDate] = useState('');
  const [newProjectEndDate, setNewProjectEndDate] = useState('');
  const [modalErrors, setModalErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Autofocus Project Name field on modal open
  const projectNameInputRef = useRef(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      const timer = setTimeout(() => {
        projectNameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCreateModalOpen]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 9,
        sort: sortBy,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await axiosClient.get('/projects', { params });
      const projectList = response.data?.data || [];
      const meta = response.data?.pagination || {
        page: 1,
        limit: 9,
        total: projectList.length,
        pages: 1,
      };

      setProjects(projectList);
      setPagination(meta);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load projects';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, debouncedSearch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to page 1 on search or sort change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy]);

  const validateCreateForm = () => {
    const errors = {};
    if (!newProjectName.trim()) {
      errors.name = 'Project name is required';
    } else if (newProjectName.trim().length < 3) {
      errors.name = 'Project name must be at least 3 characters';
    } else if (newProjectName.trim().length > 80) {
      errors.name = 'Project name cannot exceed 80 characters';
    }

    if (newProjectDescription && newProjectDescription.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    if (newProjectStartDate && newProjectEndDate) {
      if (new Date(newProjectEndDate) < new Date(newProjectStartDate)) {
        errors.endDate = 'End date must be on or after start date';
      }
    }

    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setIsSubmitting(true);
    setModalErrors({});
    try {
      const payload = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        startDate: newProjectStartDate || null,
        endDate: newProjectEndDate || null,
      };

      await axiosClient.post('/projects', payload);
      success('Project created successfully!');
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectStartDate('');
      setNewProjectEndDate('');
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create project';
      toastError(msg);
      if (err.response?.data?.errors) {
        const fieldMap = {};
        err.response.data.errors.forEach((e) => {
          if (e.field) fieldMap[e.field] = e.message;
        });
        setModalErrors(fieldMap);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#0F172A]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Workspaces & Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Structured workspace overview for student project modules and team management.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white bg-[#0D5C46] hover:bg-[#094232] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0D5C46]"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
        </section>

        {/* Filters & Search Toolbar */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects by name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-slate-50/70 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D5C46] text-slate-900 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <label
              htmlFor="sort-select"
              className="text-xs font-medium text-slate-500"
            >
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0D5C46]"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="endDate">Due Date (Earliest)</option>
              <option value="-endDate">Due Date (Latest)</option>
            </select>
          </div>
        </section>

        {/* Content Section: Loading, Error, Empty, or Grid */}
        {loading ? (
          <div className="py-20">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchProjects} className="my-8" />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title={debouncedSearch ? 'No matching workspaces found' : 'No workspaces yet'}
            description={
              debouncedSearch
                ? `No projects matched "${debouncedSearch}". Try another keyword.`
                : 'Create your first project workspace to collaborate with your team.'
            }
            action={
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0D5C46] hover:bg-[#094232] transition"
              >
                <Plus className="w-4 h-4" />
                Create Workspace
              </button>
            }
          />
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => {
                const isOwner =
                  project.owner?._id?.toString() === user?._id?.toString() ||
                  project.owner?.toString() === user?._id?.toString();

                const memberCount = project.members?.length || 0;

                return (
                  <article
                    key={project._id}
                    className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Icon, Name, Role Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-[#0F172A] flex items-center justify-center shrink-0 border border-slate-200/80">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
                            isOwner
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-[#E6F0EC] text-[#0D5C46] border border-[#0D5C46]/20'
                          }`}
                        >
                          {isOwner && <ShieldCheck className="w-3 h-3" />}
                          {isOwner ? 'Owner' : 'Member'}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-[#0F172A] hover:text-[#0D5C46] transition-colors line-clamp-1 mb-1.5">
                        <Link to={`/projects/${project._id}`}>{project.name}</Link>
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mb-4 leading-relaxed">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                      {/* Dates Tag */}
                      {(project.startDate || project.endDate) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md text-[11px]">
                            {project.startDate
                              ? new Date(project.startDate).toLocaleDateString()
                              : 'Start'}{' '}
                            &rarr;{' '}
                            {project.endDate
                              ? new Date(project.endDate).toLocaleDateString()
                              : 'Ongoing'}
                          </span>
                        </div>
                      )}

                      {/* Footer: Member count & Action button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>

                        <Link
                          to={`/projects/${project._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D5C46] hover:underline transition"
                        >
                          View workspace &rarr;
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <nav
                className="mt-10 flex items-center justify-center gap-2"
                aria-label="Pagination Navigation"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-medium text-slate-600 px-3">
                  Page <strong className="text-slate-900">{page}</strong> of{' '}
                  <strong className="text-slate-900">{pagination.pages}</strong>
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            )}
          </>
        )}

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Create New Workspace"
        >
          <form onSubmit={handleCreateProject} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="projectName"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Workspace Name *
              </label>
              <input
                id="projectName"
                ref={projectNameInputRef}
                type="text"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value);
                  if (modalErrors.name) setModalErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="e.g. Website Redesign Q4"
                className={`w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 border ${
                  modalErrors.name
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-[#0D5C46]'
                } focus:outline-none focus:ring-1 text-slate-900 transition`}
              />
              {modalErrors.name && (
                <p className="mt-1 text-xs text-[#B91C1C] font-medium">{modalErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="projectDescription"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Description
              </label>
              <textarea
                id="projectDescription"
                rows={3}
                value={newProjectDescription}
                onChange={(e) => {
                  setNewProjectDescription(e.target.value);
                  if (modalErrors.description)
                    setModalErrors((prev) => ({ ...prev, description: null }));
                }}
                placeholder="Outline the workspace objectives and scope..."
                className={`w-full px-3.5 py-2 rounded-lg text-sm bg-slate-50 border ${
                  modalErrors.description
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-[#0D5C46]'
                } focus:outline-none focus:ring-1 text-slate-900 transition`}
              />
              {modalErrors.description && (
                <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                  {modalErrors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="projectStartDate"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Start Date
                </label>
                <input
                  id="projectStartDate"
                  type="date"
                  value={newProjectStartDate}
                  onChange={(e) => setNewProjectStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0D5C46] text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="projectEndDate"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Target End Date
                </label>
                <input
                  id="projectEndDate"
                  type="date"
                  value={newProjectEndDate}
                  onChange={(e) => {
                    setNewProjectEndDate(e.target.value);
                    if (modalErrors.endDate) setModalErrors((prev) => ({ ...prev, endDate: null }));
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-sm bg-slate-50 border ${
                    modalErrors.endDate ? 'border-rose-400' : 'border-slate-200'
                  } focus:outline-none focus:ring-1 focus:ring-[#0D5C46] text-slate-900`}
                />
                {modalErrors.endDate && (
                  <p className="mt-1 text-xs text-[#B91C1C] font-medium">
                    {modalErrors.endDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#0D5C46] hover:bg-[#094232] shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workspace'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
};

export default ProjectsPage;
