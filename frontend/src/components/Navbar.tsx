import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <TrendingUp className="h-6 w-6" aria-hidden="true" />
            <span>StockAgent</span>
          </Link>

          {isAuthenticated && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <User className="h-4 w-4" aria-hidden="true" />
                <span>{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
