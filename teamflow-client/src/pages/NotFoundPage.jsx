import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F9FAFB] text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-[#0F172A] flex items-center justify-center mb-6 shadow-sm">
        <Compass className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
        The workspace route you are trying to visit does not exist or has been moved.
      </p>
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white bg-[#0D5C46] hover:bg-[#094232] shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Workspaces
      </Link>
    </main>
  );
};

export default NotFoundPage;
