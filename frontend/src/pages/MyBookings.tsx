import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Loader2, Sparkles, LayoutDashboard } from 'lucide-react';
import { bookingsApi, eventsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

interface Booking {
  id: string;
  eventId: string;
  quantity: number;
  totalPrice: string;
  status: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<{booking: Booking, event: Event | null}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      try {
        const res = await bookingsApi.myBookings();
        const bookings: Booking[] = res.data;
        
        // Fetch event details for each booking
        const fullData = await Promise.all(bookings.map(async (b) => {
          try {
            const eventRes = await eventsApi.get(b.eventId);
            return { booking: b, event: eventRes.data };
          } catch {
            return { booking: b, event: null };
          }
        }));
        
        setData(fullData);
      } catch (err) {
        setError("Impossible de charger vos réservations.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-indigo-400 mb-2 font-medium"
          >
            <LayoutDashboard className="w-5 h-5" />
            Espace Personnel
          </motion.div>
          <h1 className="text-4xl font-bold text-white">Mes Réservations</h1>
        </div>
        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.length}</div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Billets actifs</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-8">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {data.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
              <Ticket className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white">Aucune réservation pour le moment</h3>
            <p className="text-gray-400">Découvrez nos événements et réservez votre place !</p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors"
            >
              Parcourir les événements
            </button>
          </div>
        ) : (
          data.map(({ booking, event }, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 md:p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center border-l-4 border-l-indigo-500 group hover:bg-white/[0.03] transition-all"
            >
              {/* Event Info */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase text-wider">Billet # {booking.id.slice(0, 8)}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase">
                    {booking.status}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {event?.title || "Événement inconnu"}
                </h3>

                <div className="grid sm:grid-cols-2 gap-4 text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {event ? new Date(event.date).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      }) : 'Date inconnue'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{event?.location || 'Lieu inconnu'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Stats */}
              <div className="flex md:flex-col items-center justify-between md:justify-center gap-8 md:gap-4 w-full md:w-32 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{booking.quantity}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Places</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-indigo-400">{booking.totalPrice} DA</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Total</div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyBookings;
