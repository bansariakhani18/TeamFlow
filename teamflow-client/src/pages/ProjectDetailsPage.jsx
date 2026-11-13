import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import ActivityFeed from '../components/ActivityFeed';
import {
  ArrowLeft,
  Calendar,
  Users,
  ShieldCheck,
  UserPlus,
  Edit3,
  Trash2,
  LogOut,
  Mail,
  User,
  Loader2,
  BarChart3,
  Kanban,
} from 'lucide-react';

export const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [confirmMemberRemoval, setConfirmMemberRemoval] = useState(null); // { userId, name, isSelf }

  // Form states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Add member form
  const [memberEmail, setMemberEmail] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Delete/Remove action loading
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get(`/projects/${projectId}`);
      const data = response.data?.data || response.data;
      setProject(data);

      // Pre-fill edit modal
      setEditName(data.name || '');
      setEditDescription(data.description || '');
      setEditStartDate(data.startDate ? data.startDate.split('T')[0] : '');
      setEditEndDate(data.endDate ? data.endDate.split('T')[0] : '');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load workspace details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const isOwner =
    project &&
    user &&
    (project.owner?._id?.toString() === user._id?.toString() ||
      project.owner?.toString() === user._id?.toString());

  // Edit Project Handler
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editName.trim()) {
      errors.name = 'Workspace name is required';
    } else if (editName.trim().length < 3) {
      errors.name = 'Workspace name must be at least 3 characters';
    }

    if (editStartDate && editEndDate && new Date(editEndDate) < new Date(editStartDate)) {
      errors.endDate = 'End date must be on or after start date';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsUpdating(true);
    setEditErrors({});
    try {
      const payload = {
        name: editName.trim(),
        description: editDescription.trim(),
        startDate: editStartDate || null,
        endDate: editEndDate || null,
      };

      const response = await axiosClient.put(`/projects/${projectId}`, payload);
      setProject(response.data?.data || response.data);
      success('Workspace updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update workspace';
      toastError(msg);
      if (err.response?.data?.errors) {
        const fieldMap = {};
        err.response.data.errors.forEach((e) => {
          if (e.field) fieldMap[e.field] = e.message;
        });
        setEditErrors(fieldMap);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Add Member Handler
  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddMemberError('');

    if (!memberEmail.trim()) {
      setAddMemberError('Email address is required');
      return;
    }

    setIsAddingMember(true);
    try {
      const response = await axiosClient.post(`/projects/${projectId}/members`, {
        email: memberEmail.trim(),
      });
      setProject(response.data?.data || response.data);
      success('Member added successfully!');
      setMemberEmail('');
      setIsAddMemberModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member';
      setAddMemberError(msg);
      toastError(msg);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove/Leave Member Handler
  const handleConfirmRemoveMember = async () => {
    if (!confirmMemberRemoval) return;

    setIsProcessingAction(true);
    try {
      await axiosClient.delete(
        `/projects/${projectId}/members/${confirmMemberRemoval.userId}`
      );

      if (confirmMemberRemoval.isSelf) {
        success('You have left the workspace.');
        navigate('/projects');
      } else {
        success('Member removed successfully');
        setConfirmMemberRemoval(null);
        fetchProjectDetails();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove member';
      toastError(msg);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async () => {
    setIsProcessingAction(true);
    try {
      await axiosClient.delete(`/projects/${projectId}`);
      success('Workspace deleted successfully');
      navigate('/projects');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete workspace';
      toastError(msg);
    } finally {
      setIsProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F3EF]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-12 w-full">
          <ErrorMessage
            message={error || 'Workspace not found or access denied'}
            onRetry={fetchProjectDetails}
          />
          <div className="mt-4">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#4E8765] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workspaces
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const members = project.members || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3EF] text-[#1F2937]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <nav className="mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-[#4E8765] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspaces
          </Link>
        </nav>

        {/* Workspace Overview Card */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${
                    isOwner
                      ? 'bg-stone-100 text-stone-800 border border-stone-200'
                      : 'bg-[#E8F2EC] text-[#2D5A40] border border-[#4E8765]/20'
                  }`}
                >
                  {isOwner && <ShieldCheck className="w-3 h-3" />}
                  {isOwner ? 'Workspace Owner' : 'Workspace Member'}
                </span>

                {(project.startDate || project.endDate) && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-50 border border-stone-200/60 px-2.5 py-0.5 rounded-full">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Start'}
                    {' '}&rarr;{' '}
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#1F2937] mb-2">
                {project.name}
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl whitespace-pre-line">
                {project.description || 'No description provided for this workspace.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/projects/${projectId}/board`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition shadow-xs"
              >
                <Kanban className="w-3.5 h-3.5 text-[#4E8765]" />
                Kanban
              </Link>

              <Link
                to={`/projects/${projectId}/dashboard`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#E8F2EC] text-[#2D5A40] border border-[#4E8765]/20 hover:bg-[#d8e9de] transition shadow-xs"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#4E8765]" />
                Analytics
              </Link>

              {isOwner ? (
                <>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                    Edit
                  </button>

                  <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-[#4E8765] hover:bg-[#3B6B50] shadow-sm transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Member
                  </button>

                  <button
                    onClick={() => setIsDeleteProjectOpen(true)}
                    className="inline-flex items-center p-1.5 rounded-xl text-[#D97767] hover:bg-[#FFE5D9]/50 border border-transparent hover:border-[#D97767]/30 transition"
                    title="Delete Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    setConfirmMemberRemoval({
                      userId: user._id,
                      name: user.name,
                      isSelf: true,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#D97767] border border-[#FBC4B8] hover:bg-[#FFE5D9]/50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Leave Workspace
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Members Management Section */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-stone-100 text-[#1F2937] flex items-center justify-center">
                <Users className="w-4 h-4 text-[#4E8765]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">
                  Team Members ({members.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Collaborators with assigned roles and workspace access
                </p>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E8765] hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const memberUser = member.user || {};
              const memberId = memberUser._id?.toString() || memberUser.toString();
              const isMemberOwner =
                project.owner?._id?.toString() === memberId ||
                project.owner?.toString() === memberId;
              const isCurrentUser = user?._id?.toString() === memberId;

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between p-4 rounded-xl bg-stone-50/70 border border-stone-200/70"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-[#1F2937] text-white flex items-center justify-center font-bold text-xs shrink-0 uppercase select-none">
                      {memberUser.name ? memberUser.name.charAt(0) : <User className="w-4 h-4" />}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-[#1F2937] truncate">
                          {memberUser.name || 'Unknown User'}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold text-stone-400">
                            (You)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 truncate block">
                        {memberUser.email || 'No email provided'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isMemberOwner ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-800 border border-stone-200">
                        <ShieldCheck className="w-3 h-3" />
                        Owner
                      </span>
                    ) : (
                      <>
                        <span className="text-[10px] font-medium text-stone-500 bg-white border border-stone-200 px-2.5 py-0.5 rounded-full">
                          Member
                        </span>
                        {isOwner && (
                          <button
                            onClick={() =>
                              setConfirmMemberRemoval({
                                userId: memberId,
                                name: memberUser.name || 'Member',
                                isSelf: false,
                              })
                            }
                            className="p-1 rounded-lg text-stone-400 hover:text-[#D97767] hover:bg-[#FFE5D9]/50 transition"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Real-Time Team Activity Timeline (Module 3) */}
        <div className="mt-8">
          <ActivityFeed projectId={projectId} />
        </div>

        {/* Edit Workspace Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => !isUpdating && setIsEditModalOpen(false)}
          title="Edit Workspace Details"
        >
          <form onSubmit={handleUpdateProject} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="editName"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Workspace Name *
              </label>
              <input
                id="editName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-white border border-stone-200 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] text-stone-900 shadow-sm"
              />
              {editErrors.name && (
                <p className="mt-1 text-xs text-[#D97767] font-medium">{editErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="editDescription"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Description
              </label>
              <textarea
                id="editDescription"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm bg-white border border-stone-200 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] text-stone-900 shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="editStartDate"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Start Date
                </label>
                <input
                  id="editStartDate"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-sm bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] shadow-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="editEndDate"
                  className="block text-xs font-semibold text-stone-700 mb-1.5"
                >
                  Target End Date
                </label>
                <input
                  id="editEndDate"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-sm bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] shadow-sm"
                />
                {editErrors.endDate && (
                  <p className="mt-1 text-xs text-[#D97767] font-medium">{editErrors.endDate}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isUpdating}
                className="px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white bg-[#4E8765] hover:bg-[#3B6B50] shadow-sm transition disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Member Modal */}
        <Modal
          isOpen={isAddMemberModalOpen}
          onClose={() => !isAddingMember && setIsAddMemberModalOpen(false)}
          title="Add Team Member"
        >
          <form onSubmit={handleAddMember} className="space-y-4" noValidate>
            <p className="text-xs text-stone-500">
              Enter the registered email of the student collaborator you want to add to this workspace.
            </p>

            {addMemberError && (
              <div
                className="p-3 rounded-xl bg-[#FFE5D9] border border-[#FBC4B8] text-xs text-[#D97767] font-medium"
                role="alert"
              >
                {addMemberError}
              </div>
            )}

            <div>
              <label
                htmlFor="memberEmail"
                className="block text-xs font-semibold text-stone-700 mb-1.5"
              >
                Member Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="memberEmail"
                  type="email"
                  value={memberEmail}
                  onChange={(e) => {
                    setMemberEmail(e.target.value);
                    if (addMemberError) setAddMemberError('');
                  }}
                  placeholder="collaborator@university.edu"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl text-sm bg-white border border-stone-200 focus:outline-none focus:border-[#4E8765] focus:ring-1 focus:ring-[#4E8765] text-stone-900 transition shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)}
                disabled={isAddingMember}
                className="px-3.5 py-2 text-sm font-medium rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingMember}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white bg-[#4E8765] hover:bg-[#3B6B50] shadow-sm transition disabled:opacity-50"
              >
                {isAddingMember ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add to Workspace'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Remove/Leave Member Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!confirmMemberRemoval}
          onClose={() => setConfirmMemberRemoval(null)}
          onConfirm={handleConfirmRemoveMember}
          title={confirmMemberRemoval?.isSelf ? 'Leave Workspace' : 'Remove Team Member'}
          message={
            confirmMemberRemoval?.isSelf
              ? 'Are you sure you want to leave this workspace? You will lose access until re-invited by the owner.'
              : `Are you sure you want to remove ${confirmMemberRemoval?.name || 'this member'} from the workspace?`
          }
          confirmText={confirmMemberRemoval?.isSelf ? 'Leave Workspace' : 'Remove Member'}
          confirmVariant="danger"
          loading={isProcessingAction}
        />

        {/* Delete Project Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDeleteProjectOpen}
          onClose={() => setIsDeleteProjectOpen(false)}
          onConfirm={handleDeleteProject}
          title="Delete Workspace"
          message={`Are you sure you want to permanently delete "${project.name}"? This will delete all associated data.`}
          confirmText="Delete Workspace"
          confirmVariant="danger"
          loading={isProcessingAction}
        />
      </main>
    </div>
  );
};

export default ProjectDetailsPage;
