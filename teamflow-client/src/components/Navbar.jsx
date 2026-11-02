import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from './BrandLogo';
import { FolderGit2, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 w-full border-t-2 border-t-[#4E8765] border-b border-stone-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-8">
            <Link to="/projects" className="flex items-center group">
              <BrandLogo className="h-8 w-8" />
            </Link>

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/projects"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
                  isActive('/projects')
                    ? 'bg-[#E8F2EC] text-[#2D5A40] font-semibold'
                    : 'text-stone-600 hover:text-[#1F2937] hover:bg-stone-100'
                }`}
              >
                <FolderGit2 className="w-4 h-4 text-[#4E8765]" />
                Workspaces
              </Link>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-100/80 border border-stone-200/70">
              <div className="w-6 h-6 rounded-lg bg-[#1F2937] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {user?.name ? user.name.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1F2937] leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-stone-500 leading-tight truncate max-w-[130px]">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-[#D97767] hover:bg-[#FFE5D9]/50 border border-transparent hover:border-[#D97767]/30 transition"
              title="Log out of TeamFlow"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
