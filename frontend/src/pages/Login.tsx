import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 grad-bg">
      <div className="glass bg-white/90 w-full max-w-md p-10 rounded-[32px] shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold mb-2 text-fg">
            {isLogin ? 'Bon retour !' : 'Rejoindre Billetix'}
          </h2>
          <p className="text-fg-medium">
            {isLogin ? 'Connectez-vous pour voir vos réservations' : 'Créez un compte pour commencer à réserver'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold border border-red-100 animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-fg-medium ml-1">Prénom</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
                  <input 
                    type="text" 
                    className="input pl-11"
                    placeholder="Mehdi"
                    required
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-fg-medium ml-1">Nom</label>
                <input 
                  type="text" 
                  className="input"
                  placeholder="Khedim"
                  required
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-fg-medium ml-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input 
                type="email" 
                className="input pl-11"
                placeholder="email@exemple.com"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-fg-medium ml-1">Mot de passe</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input 
                type="password" 
                className="input pl-11"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-bold text-fg-medium ml-1">Rôle</label>
              <select 
                className="input"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="CLIENT">Client (Acheteur)</option>
                <option value="ORGANIZER">Organisateur (Créateur)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full grad-bg text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-70 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                <span>{isLogin ? 'Se connecter' : 'Créer mon compte'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
