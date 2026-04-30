import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Calendar, LogIn, PlusCircle, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-50 h-24 border-b border-white/10 shadow-lg backdrop-blur-3xl transition-all duration-300">
      <div className="container h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div 
            whileHover={{ rotate: -10, scale: 1.1 }}
            className="grad-bg p-2.5 rounded-2xl text-white shadow-xl group-hover:shadow-primary/40 transition-all"
          >
            <Calendar size={28} strokeWidth={2.5} />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter grad-text leading-none">
              Billetix
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted leading-none mt-1">
              Premium Tickets
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-10">
          <Link to="/" className="text-fg-medium hover:text-primary transition-all font-bold tracking-tight relative group">
            Événements
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 grad-bg transition-all group-hover:w-full rounded-full" />
          </Link>
          {isAuthenticated && (
            <Link to="/mes-reservations" className="text-fg-medium hover:text-primary transition-all font-bold tracking-tight relative group">
              Réservations
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 grad-bg transition-all group-hover:w-full rounded-full" />
            </Link>
          )}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {user?.role === 'ORGANIZER' && (
                <Link 
                  to="/creer-evenement" 
                  className="flex items-center gap-2 bg-primary/10 text-primary font-black px-6 py-3 rounded-2xl transition-all hover:bg-primary/20 scale-95 hover:scale-100"
                >
                  <PlusCircle size={20} />
                  <span>CRÉER</span>
                </Link>
              )}
              
              <div className="h-10 w-px bg-border/50 mx-1 hidden md:block" />
              
              <button className="p-3 text-fg-muted hover:text-primary transition-colors relative">
                <Bell size={22} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>

              <motion.div 
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 bg-white/50 border border-border p-1.5 pr-5 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 grad-bg rounded-xl flex items-center justify-center text-white font-black text-sm shadow-inner group-hover:rotate-6 transition-transform">
                  {user?.firstName?.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-fg-muted leading-none">Compte</span>
                  <span className="text-sm font-bold text-fg leading-tight mt-1">{user?.firstName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-3 p-1.5 text-fg-muted hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={18} />
                </button>
              </motion.div>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="grad-bg text-white px-8 py-3.5 rounded-2xl font-black shadow-2xl hover:shadow-primary/40 transition-all flex items-center gap-3 scale-95 hover:scale-100 active:scale-95"
            >
              <LogIn size={20} strokeWidth={2.5} />
              <span>CONNEXION</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
