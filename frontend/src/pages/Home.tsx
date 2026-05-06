import React, { useEffect, useState } from 'react';
import { Search, MapPin, Calendar, ArrowRight, Sparkles, Filter, TrendingUp, Music, Cpu, Film, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventsApi } from '../services/api';
import { Link } from 'react-router-dom';

// Asset mapping for categories
const categoryAssets: Record<string, { img: string, icon: any, color: string }> = {
  'Musique': { img: '/src/assets/design/music.png', icon: Music, color: 'from-blue-500 to-indigo-600' },
  'Sport': { img: '/src/assets/design/tech.png', icon: Trophy, color: 'from-orange-500 to-red-600' },
  'Conférence': { img: '/src/assets/design/tech.png', icon: Cpu, color: 'from-purple-500 to-pink-600' },
  'Cinéma': { img: '/src/assets/design/music.png', icon: Film, color: 'from-teal-500 to-emerald-600' },
  'default': { img: '/src/assets/design/music.png', icon: Sparkles, color: 'from-gray-500 to-slate-600' }
};

const Home: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterLive, setFilterLive] = useState(false);
  
  const displayEvents = events.filter(e => {
    if (!filterLive) return true;
    const evDate = new Date(e.date);
    const today = new Date();
    return evDate.toDateString() === today.toDateString();
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await eventsApi.list({ search: searchTerm, category });
        setEvents(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des événements", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [searchTerm, category]);

  return (
    <div className="min-h-screen mesh-bg selection:bg-primary/30">
      <div className="container py-12 lg:py-20 relative z-10">
        
        {/* Floating Decorative Elements */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-accent/20 blur-[140px] rounded-full animate-pulse delay-1000" />

        {/* Hero Section */}
        <section className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 glass px-6 py-2.5 rounded-full text-xs font-black mb-8 border border-white/10 uppercase tracking-widest shadow-xl">
              <Sparkles size={14} className="text-primary animate-spin-slow" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Expériences Uniques en Algérie</span>
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-black mb-8 tracking-tighter leading-[0.9] drop-shadow-sm">
              Explorez <br />
              <span className="grad-text italic">L'Exceptionnel</span>
            </h1>
            
            <p className="text-fg-medium text-xl max-w-2xl mx-auto mb-14 font-medium leading-relaxed opacity-80">
              Découvrez, réservez et vivez les événements les plus prestigieux. <br className="hidden md:block" />
              Billetix est votre pass VIP pour l'excellence.
            </p>
          </motion.div>

          {/* Premium Search Container */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="glass max-w-5xl mx-auto p-2.5 rounded-[32px] flex flex-col md:flex-row items-center gap-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border-white/10"
          >
            <div className="flex-1 flex items-center gap-4 bg-white/5 px-8 py-5 rounded-[24px] w-full group focus-within:ring-2 ring-primary/30 transition-all">
              <Search size={22} className="text-primary group-focus-within:scale-110 transition-transform" />
              <input 
                type="text" 
                placeholder="Quel événement recherchez-vous ?" 
                className="bg-transparent border-none focus:outline-none w-full text-fg font-bold placeholder:text-fg-muted text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
              <div className="flex items-center gap-3 w-full md:w-auto pr-2">
              <button 
                onClick={() => setFilterLive(!filterLive)}
                className={`px-6 py-5 rounded-[24px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${filterLive ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-fg-muted hover:text-white'}`}
              >
                <div className={`w-2 h-2 rounded-full ${filterLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
                Live
              </button>
              
              <div className="flex items-center gap-3 bg-white/5 px-8 py-5 rounded-[24px] w-full md:w-auto">
                <Filter size={18} className="text-accent" />
                <select 
                  className="bg-transparent border-none font-bold text-fg-medium focus:outline-none cursor-pointer text-base appearance-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" className="bg-bg">Toutes catégories</option>
                  <option value="Musique" className="bg-bg">Musique</option>
                  <option value="Sport" className="bg-bg">Sport</option>
                  <option value="Conférence" className="bg-bg">Conférence</option>
                  <option value="Cinéma" className="bg-bg">Cinéma</option>
                </select>
              </div>
              
              <button className="grad-bg text-white px-10 py-5 rounded-[24px] font-black shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95 hidden md:flex items-center gap-3">
                <span>RECHERCHER</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Secondary Navigation / Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-20">
          {['Musique', 'Sport', 'Conférence', 'Cinéma'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
              className={`px-8 py-3 rounded-2xl border text-sm font-black tracking-wider uppercase transition-all duration-300 ${
                category === cat 
                ? 'grad-bg border-transparent text-white shadow-lg' 
                : 'glass border-white/5 text-fg-muted hover:text-fg hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Section */}
        <section>
          <div className="flex items-end justify-between mb-16 px-4">
            <div>
              <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-3">
                <TrendingUp size={14} />
                <span>En vedette</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Événements <span className="grad-text italic">Incontournables</span></h2>
            </div>
            <div className="hidden md:flex items-center gap-4 text-fg-muted bg-white/5 border border-white/5 px-6 py-3 rounded-2xl text-xs font-black tracking-widest uppercase">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </div>
              {displayEvents.length} {filterLive ? 'Aujourd\'hui' : 'Disponibles'}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 px-4"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[520px] glass-card animate-pulse shadow-sm" />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 px-4"
              >
                {displayEvents.map((event, idx) => {
                  const asset = categoryAssets[event.category] || categoryAssets.default;
                  const Icon = asset.icon;
                  return (
                    <motion.div 
                      key={event.id} 
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="glass-card group flex flex-col h-full overflow-hidden"
                    >
                      {/* Image Holder */}
                      <div className="aspect-[16/11] relative overflow-hidden">
                        <img 
                          src={asset.img} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
                        
                        {/* Float Tags */}
                        <div className="absolute top-6 left-6 flex items-center gap-2">
                           <div className={`p-2 rounded-xl bg-gradient-to-br ${asset.color} text-white shadow-xl`}>
                            <Icon size={16} strokeWidth={2.5} />
                          </div>
                          <div className="glass bg-black/40 backdrop-blur-md text-[10px] text-white font-black px-4 py-2 rounded-xl border border-white/20 uppercase tracking-widest">
                            {event.category}
                          </div>
                        </div>

                        <div className="absolute bottom-6 left-6 bg-white py-2 px-4 rounded-xl shadow-2xl">
                           <div className="flex flex-col">
                             <span className="text-[9px] font-black uppercase tracking-tighter text-fg-muted mb-0.5">À PARTIR DE</span>
                             <span className="text-lg font-black text-bg leading-none">{event.price} DA</span>
                           </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-black mb-6 group-hover:grad-text transition-all leading-tight">
                          {event.title}
                        </h3>
                        
                        <div className="space-y-4 mb-10">
                          <div className="flex items-center gap-4 text-fg-medium group/item hover:text-primary transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover/item:rotate-12 transition-transform border border-primary/10">
                              <Calendar size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Date & Heure</span>
                              <span className="font-bold text-sm tracking-tight capitalize">
                                {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-fg-medium group/item hover:text-accent transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent group-hover/item:-rotate-12 transition-transform border border-accent/10">
                              <MapPin size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-fg-muted">Lieu</span>
                              <span className="font-bold text-sm tracking-tight">{event.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-fg-muted tracking-[0.2em] mb-1">Status</span>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${event.availableSeats > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                              <span className={`text-xs font-black uppercase tracking-wider ${event.availableSeats > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {event.availableSeats > 0 ? `${event.availableSeats} places` : 'Complet'}
                              </span>
                            </div>
                          </div>
                          {event.availableSeats > 0 ? (
                            <Link 
                              to={`/events/${event.id}`} 
                              className="flex items-center gap-3 grad-bg text-white px-8 py-4 rounded-[20px] font-black shadow-xl hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95 group/btn"
                            >
                              <span>RÉSERVER</span>
                              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 bg-white/5 text-fg-muted px-8 py-4 rounded-[20px] font-black cursor-not-allowed">
                              <span>ÉPUISÉ</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Community / CTA Section */}
        <section className="mt-40">
           <div className="glass grad-bg p-2 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <div className="relative z-10 bg-bg p-12 lg:p-24 rounded-[36px] flex flex-col items-center text-center gap-8">
                 <div className="w-20 h-20 grad-bg rounded-[24px] flex items-center justify-center text-white shadow-2xl">
                    <Sparkles size={40} strokeWidth={2.5} />
                 </div>
                 <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none max-w-4xl">
                   Ne manquez plus <br/>
                   <span className="grad-text italic">L'Incontournable</span>
                 </h2>
                 <p className="text-xl text-fg-medium max-w-2xl font-medium">Rejoignez notre communauté de passionnés et recevez les meilleures offres en avant-première.</p>
                 <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-6">
                    <input 
                      type="email" 
                      placeholder="votre@email.com" 
                      className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-8 py-5 font-bold focus:outline-none focus:ring-2 ring-primary/40 transition-all"
                    />
                    <button className="grad-bg text-white px-10 py-5 rounded-[20px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">S'inscrire</button>
                 </div>
              </div>
           </div>
        </section>

        <footer className="mt-40 mb-12 flex flex-col md:flex-row items-center justify-between text-fg-muted font-black uppercase tracking-widest text-[9px] border-t border-white/5 pt-12 gap-8">
           <div className="flex items-center gap-8">
             <a href="#" className="hover:text-primary transition-colors">Politique de confidentialité</a>
             <a href="#" className="hover:text-primary transition-colors">Conditions Générales</a>
             <a href="#" className="hover:text-primary transition-colors">Contact</a>
           </div>
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <span>© 2026 Billetix • Fait avec passion</span>
           </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
