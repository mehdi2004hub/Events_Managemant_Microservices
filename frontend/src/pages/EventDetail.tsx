import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Tag, ArrowLeft, Loader2, ShieldCheck, Ticket } from 'lucide-react';
import { eventsApi, bookingsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  availableSeats: number;
  price: string;
  category: string;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!id) return;
        const res = await eventsApi.get(id);
        setEvent(res.data);
      } catch (err) {
        setError("Impossible de charger l'événement.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setBookingLoading(true);
    setError('');
    try {
      if (!id) return;
      await bookingsApi.create(id, quantity);
      setSuccess(true);
      // Refresh event to see new seat count
      const res = await eventsApi.get(id);
      setEvent(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de la réservation.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-white">Événement introuvable</h2>
      <button onClick={() => navigate('/')} className="mt-4 text-indigo-400 hover:underline">Retour à l'accueil</button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Retour
      </motion.button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="glass-card overflow-hidden">
            <div className="relative h-80 overflow-hidden">
              <img 
                src={`https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000`} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 backdrop-blur-md mb-3 inline-block">
                  {event.category}
                </span>
                <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <p className="text-xl text-gray-300 leading-relaxed">
                {event.description || "Aucune description détaillée n'a été fournie pour cet événement. Rejoignez-nous pour une expérience inoubliable !"}
              </p>

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 text-indigo-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Date & Heure</h3>
                    <p className="text-white font-medium">{new Date(event.date).toLocaleString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 text-indigo-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Lieu</h3>
                    <p className="text-white font-medium">{event.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Booking */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-card p-8 sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <span className="text-3xl font-bold text-white">{event.price} DA</span>
              <div className={`px-2 py-1 rounded text-xs font-bold ${event.availableSeats > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {event.availableSeats > 0 ? `${event.availableSeats} places` : 'COMPLET'}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Quantité</label>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
                  > - </button>
                  <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(event.availableSeats, quantity + 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
                  > + </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <AnimatePresence>
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center space-y-3"
                  >
                    <ShieldCheck className="w-12 h-12 mx-auto" />
                    <p className="font-bold">Réservation confirmée !</p>
                    <button 
                      onClick={() => navigate('/mes-reservations')}
                      className="text-sm underline hover:text-emerald-300"
                    >Voir mes billets</button>
                  </motion.div>
                ) : (
                  <button
                    disabled={bookingLoading || event.availableSeats === 0}
                    onClick={handleBooking}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    {bookingLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Ticket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        Réserver maintenant
                      </>
                    )}
                  </button>
                )}
              </AnimatePresence>

              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-gray-400 text-center">
                  En réservant, vous acceptez nos conditions générales de vente. Vos billets seront disponibles immédiatement.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EventDetail;
