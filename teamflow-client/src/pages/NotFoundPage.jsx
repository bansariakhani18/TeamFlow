import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F4F3EF] text-center">
      <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 text-[#4E8765] flex items-center justify-center mb-6 shadow-sm">
        <Compass className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-bold text-[#1F2937] tracking-tight mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-6">
        The workspace route you are trying to visit does not exist or has been moved.
      </p>
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-[#4E8765] hover:bg-[#3B6B50] shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Workspaces
      </Link>
    </main>
  );
};

export default NotFoundPage;
