import { Link, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/board" className="flex items-center">
              <BrandLogo />
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/board"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  location.pathname.includes('board') || location.pathname === '/'
                    ? 'bg-[#E8F2EC] text-[#2D5A40]'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                Kanban Board
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8F2EC] text-[#2D5A40] flex items-center justify-center font-bold text-xs border border-emerald-200">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'TF'}
                  </div>
                  <span className="text-sm font-medium text-stone-700 hidden sm:inline">
                    {user.name || 'TeamFlow User'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg">
                  Heer Sachdev (M2)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
