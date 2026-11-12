import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import Navbar from '../components/Navbar';
import ActivityFeed from '../components/ActivityFeed';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import { ArrowLeft, Kanban } from 'lucide-react';

export const ActivityFeedPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/projects/${projectId}`);
        setProject(res.data?.data || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  return (
    <div className="min-h-screen bg-[#F4F3EF] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workspace Overview
          </Link>

          <Link
            to={`/projects/${projectId}/board`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#4E8765] text-white hover:bg-[#3B6B50] shadow-xs transition"
          >
            <Kanban className="w-3.5 h-3.5" />
            Open Kanban Board
          </Link>
        </div>

        {/* Workspace Title Header */}
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#F3E8FF] text-[#7E22CE] rounded-lg">
              Module 3
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              {project ? `${project.name}  Activity Stream` : 'Activity Stream'}
            </h1>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Unified audit history and real-time collaboration timeline for this project
          </p>
        </div>

        {/* Activity Feed Container */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" />
            <p className="text-xs text-stone-400 mt-2">Loading workspace details...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <ActivityFeed projectId={projectId} showHeader={false} />
        )}
      </main>
    </div>
  );
};

export default ActivityFeedPage;
