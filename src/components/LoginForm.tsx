import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, UserPlus } from 'lucide-react';

export function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const adminEmail = 'admin@boiscompost.fr';
      const adminPassword = 'Admin123!Secure';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      setSuccess(`Compte créé avec succès ! Utilisez ces identifiants pour vous connecter.`);
      setEmail(adminEmail);
      setPassword(adminPassword);
      setTimeout(() => {
        setShowSetup(false);
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Erreur création admin:', err);
      setError(`Erreur: ${err.message}. Vérifiez la console pour plus de détails.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-green-700 mb-2">BOISCOMPOST</h1>
              <p className="text-gray-600">Gestion des collectes</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        {!showSetup ? (
          <button
            onClick={() => setShowSetup(true)}
            className="w-full text-center text-gray-600 text-sm mt-6 hover:text-green-700 transition-colors"
          >
            Configuration initiale
          </button>
        ) : (
          <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Configuration initiale</h3>
            <p className="text-sm text-gray-600 mb-4">
              Créez le compte administrateur principal pour commencer à utiliser BOISCOMPOST.
            </p>
            <button
              onClick={handleCreateAdmin}
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Créer le compte administrateur
                </>
              )}
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="w-full text-gray-600 text-sm mt-3 hover:text-gray-900"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
