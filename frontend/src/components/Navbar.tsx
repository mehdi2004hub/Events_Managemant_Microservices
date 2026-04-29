import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, LogIn, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass bg-white/70 sticky top-0 z-50 h-20 shadow-sm">
      <div className="container h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grad-bg p-2 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform">
            <Calendar size={24} />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent grad-bg">
            Billetix
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/" className="text-fg-medium hover:text-primary transition-colors font-medium">
            Événements
          </Link>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'ORGANIZER' && (
                <Link to="/events/new" className="flex items-center gap-2 text-primary font-semibold hover:bg-primary/10 px-4 py-2 rounded-full transition-all">
                  <PlusCircle size={20} />
                  <span>Créer</span>
                </Link>
              )}
              
              <Link to="/mes-reservations" className="text-fg-medium hover:text-primary transition-colors font-medium">
                Mes Billets
              </Link>
              
              <div className="h-6 w-px bg-border mx-2" />
              
              <div className="flex items-center gap-3 bg-bg-offset px-4 py-2 rounded-full border border-border">
                <User size={18} className="text-fg-muted" />
                <span className="text-sm font-semibold">{user?.firstName}</span>
                <button 
                  onClick={handleLogout}
                  className="p-1 hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <Link 
              to="/login" 
              className="grad-bg text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
            >
              <LogIn size={20} />
              <span>Connexion</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
