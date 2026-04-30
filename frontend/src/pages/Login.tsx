import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT'
  });

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await authApi.login(formData.email, formData.password);
        setAuth(res.data.user, res.data.access, res.data.refresh);
      } else {
        await authApi.register(formData);
        const loginRes = await authApi.login(formData.email, formData.password);
        setAuth(loginRes.data.user, loginRes.data.access, loginRes.data.refresh);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 mesh-bg relative overflow-hidden">
      
      {/* Decorative Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-lg p-1 lg:p-1.5 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border-white/5 relative z-10"
      >
        <div className="bg-bg/40 backdrop-blur-2xl p-10 lg:p-14 rounded-[36px] border border-white/5">
            <div className="text-center mb-12">
              <div className="w-16 h-16 grad-bg rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-2xl">
                 <Sparkles size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-black mb-3 tracking-tighter grad-text italic">
                {isLogin ? 'Bon retour parmi nous' : 'Créez votre accès VIP'}
              </h2>
              <p className="text-fg-medium font-medium opacity-80">
                {isLogin ? 'Accédez à vos réservations et billets exclusifs.' : 'Inscrivez-vous pour ne rien manquer de l\'exceptionnel.'}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 text-red-500 p-5 rounded-2xl mb-8 text-sm font-bold border border-red-500/20 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted ml-2">Prénom</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:ring-2 ring-primary/40 transition-all text-sm"
                      placeholder="Mehdi"
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted ml-2">Nom</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:ring-2 ring-primary/40 transition-all text-sm"
                      placeholder="Khedim"
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted ml-2">Email Professionnel</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-fg-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 font-bold focus:outline-none focus:ring-2 ring-primary/40 transition-all text-sm"
                    placeholder="mehdi@billetix.dz"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted ml-2">Mot de Passe</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-fg-muted group-focus-within:text-accent transition-colors" />
                  <input 
                    type="password" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 font-bold focus:outline-none focus:ring-2 ring-accent/40 transition-all text-sm"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-muted ml-2">Type de Compte</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:ring-2 ring-primary/40 transition-all text-sm appearance-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="CLIENT" className="bg-bg">Client (Acheteur)</option>
                    <option value="ORGANIZER" className="bg-bg">Organisateur (Créateur)</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full grad-bg text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(99,102,241,0.3)] disabled:opacity-70 mt-6"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    <span>{isLogin ? 'ACCÉDER À MON COMPTE' : 'CRÉER MON ACCÈS VIP'}</span>
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 text-center flex flex-col items-center gap-6">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-black uppercase tracking-widest text-[10px] hover:text-accent transition-colors border-b border-primary/20 pb-1"
              >
                {isLogin ? "Nouveau ici ? Créer un compte" : "Déjà membre ? Se connecter"}
              </button>
              
              <div className="flex items-center gap-2 text-[10px] font-black text-fg-muted uppercase tracking-widest">
                 <ShieldCheck size={12} className="text-green-500" />
                 Connexion Sécurisée
              </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
