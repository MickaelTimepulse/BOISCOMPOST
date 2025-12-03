import { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { Plus, Search, Edit2, Loader2, Mail, Phone, Lock, Trash2 } from 'lucide-react';
import { DriverForm } from './DriverForm';

export function DriversManager() {
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Profile | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (data) setDrivers(data);
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        selectedDriver!.id,
        { password: newPassword }
      );

      if (error) throw error;

      setPasswordSuccess('Mot de passe modifié avec succès');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSelectedDriver(null);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleActive = async (driver: Profile) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !driver.is_active })
      .eq('id', driver.id);

    if (!error) {
      loadDrivers();
    }
  };

  const handleDeleteDriver = async (driver: Profile) => {
    try {
      const { data: missions, error: checkError } = await supabase
        .from('missions')
        .select('id')
        .eq('driver_id', driver.id)
        .limit(1);

      if (checkError) throw checkError;

      if (missions && missions.length > 0) {
        alert(`Impossible de supprimer ${driver.full_name}. Ce chauffeur a des missions associées. Vous pouvez le désactiver à la place.`);
        return;
      }

      if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le chauffeur ${driver.full_name} ?`)) {
        return;
      }

      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(driver.id);

      if (deleteAuthError) throw deleteAuthError;

      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', driver.id);

      if (deleteProfileError) throw deleteProfileError;

      loadDrivers();
    } catch (err: any) {
      alert('Erreur lors de la suppression: ' + err.message);
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Chauffeurs</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Chauffeur
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un chauffeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {showForm && (
        <DriverForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadDrivers();
          }}
        />
      )}

      <div className="grid gap-4">
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {searchTerm ? 'Aucun chauffeur trouvé' : 'Aucun chauffeur enregistré'}
            </p>
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{driver.full_name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {driver.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedDriver(driver);
                      setShowPasswordModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Changer le mot de passe"
                  >
                    <Lock className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(driver)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      driver.is_active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {driver.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleDeleteDriver(driver)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{driver.email}</span>
                </div>

                {driver.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{driver.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showPasswordModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Changer le mot de passe
            </h3>
            <p className="text-gray-600 mb-4">
              Chauffeur: <span className="font-semibold">{selectedDriver.full_name}</span>
            </p>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedDriver(null);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={passwordLoading}
              >
                Annuler
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="flex-1 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Modification...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
