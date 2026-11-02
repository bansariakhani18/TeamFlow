import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-8">
            <Link to="/projects" className="flex items-center group">
              <Logo size="md" />
            </Link>

            {/* Nav Links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/projects"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive('/projects')
                    ? 'bg-[#E6F0EC] text-[#0D5C46] font-semibold'
                    : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                }`}
              >
                <FolderGit2 className="w-4 h-4" />
                Workspaces
              </Link>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-100/70 border border-slate-200/60">
              <div className="w-6 h-6 rounded-md bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {user?.name ? user.name.charAt(0) : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#0F172A] leading-tight">
                  {user?.name || 'User'}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight truncate max-w-[130px]">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#B91C1C] hover:bg-[#FEF2F2] border border-transparent hover:border-[#FCA5A5]/40 transition"
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
