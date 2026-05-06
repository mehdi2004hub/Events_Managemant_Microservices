import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Calendar, LogIn, PlusCircle, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { bookingsApi, eventsApi } from '../services/api';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchNextBooking = async () => {
      try {
        const res = await bookingsApi.myBookings();
        const bookings = res.data;
        if (bookings.length === 0) return;
        
        let closestEvent = null;
        let minDiff = Infinity;
        
        for (const b of bookings) {
          try {
            const evRes = await eventsApi.get(b.eventId);
            const evDate = new Date(evRes.data.date).getTime();
            const now = new Date().getTime();
            if (evDate > now && (evDate - now) < minDiff) {
              minDiff = evDate - now;
              closestEvent = evRes.data;
            }
          } catch(e) {}
        }
        setNextEvent(closestEvent);
      } catch(e) {}
    };
    fetchNextBooking();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!nextEvent) return;
    // Initial calculate
    const calculateTime = () => {
      const now = new Date().getTime();
      const evDate = new Date(nextEvent.date).getTime();
      const diff = evDate - now;
      if (diff <= 0) {
        setTimeRemaining('En cours');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) setTimeRemaining(`J - ${days}`);
      else setTimeRemaining(`H - ${hours}`);
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [nextEvent]);

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
              
              <div className="relative group/notif flex items-center">
                <button className={`p-3 transition-colors flex items-center gap-2 rounded-xl border ${nextEvent ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' : 'text-fg-muted border-transparent hover:text-primary'} relative`}>
                  <Bell size={22} className={nextEvent ? 'animate-pulse' : ''} />
                  {nextEvent && timeRemaining && (
                    <span className="font-black tracking-widest text-[10px]">{timeRemaining}</span>
                  )}
                  {!nextEvent && (
                    <span className="absolute top-2.5 right-2 right-[22px] w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>
                {nextEvent && (
                  <div className="absolute top-14 right-0 w-64 p-4 glass rounded-2xl shadow-xl opacity-0 group-hover/notif:opacity-100 transition-opacity pointer-events-none z-50">
                    <p className="text-[10px] font-black uppercase text-fg-muted mb-1">Prochain événement :</p>
                    <p className="font-bold text-sm text-white">{nextEvent.title}</p>
                    <p className="text-[10px] text-amber-400 mt-2 font-medium leading-tight">Un email de rappel vous sera envoyé 24h avant l'événement.</p>
                  </div>
                )}
              </div>

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
