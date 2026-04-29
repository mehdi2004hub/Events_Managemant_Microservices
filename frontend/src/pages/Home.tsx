import React, { useEffect, useState } from 'react';
import { Search, MapPin, Calendar, Tag, ArrowRight } from 'lucide-react';
import { eventsApi } from '../services/api';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

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
    <div className="container py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
          Réservez vos places pour les <span className="text-primary">plus grands événements</span>
        </h1>
        <p className="text-fg-medium text-lg max-w-2xl mx-auto mb-10">
          Découvrez des concerts, festivals, conférences et plus encore. Billetix est la solution moderne pour la gestion d'événements.
        </p>

        {/* Search Bar */}
        <div className="glass max-w-3xl mx-auto p-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="flex-1 flex items-center gap-3 bg-bg-offset px-4 py-3 rounded-xl">
            <Search size={20} className="text-fg-muted" />
            <input 
              type="text" 
              placeholder="Rechercher un événement..." 
              className="bg-transparent border-none focus:outline-none w-full text-fg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-bg-offset px-4 py-3 rounded-xl border-none font-semibold text-fg-medium focus:ring-2 focus:ring-primary/20"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            <option value="Musique">Musique</option>
            <option value="Sport">Sport</option>
            <option value="Conférence">Conférence</option>
            <option value="Cinéma">Cinéma</option>
          </select>
        </div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Événements populaires</h2>
          <span className="text-fg-muted font-medium">{events.length} résultats trouvés</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-bg-offset animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div key={event.id} className="group glass bg-white hover:border-primary/50 transition-all duration-300 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col">
                <div className="aspect-video grad-bg relative flex items-center justify-center text-white/20">
                  <Calendar size={64} strokeWidth={1.5} />
                  <div className="absolute top-4 left-4 glass bg-black/20 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                    {event.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-2 text-fg-medium text-sm">
                      <Calendar size={16} className="text-primary" />
                      <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-fg-medium text-sm">
                      <MapPin size={16} className="text-primary" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-fg-medium text-sm">
                      <Tag size={16} className="text-primary" />
                      <span className="font-bold text-fg">{event.price} DA</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-fg-muted">
                      {event.availableSeats} places restantes
                    </span>
                    <Link to={`/events/${event.id}`} className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                      Réserver <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
