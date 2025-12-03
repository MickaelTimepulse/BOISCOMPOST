import { useState, useEffect } from 'react';
import { supabase, Client, Profile, CollectionSite, DepositSite, Vehicle, MaterialType } from '../../lib/supabase';
import { Save, X } from 'lucide-react';

interface MissionFormProps {
  mission?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MissionForm({ mission, onSuccess, onCancel }: MissionFormProps) {
  const [formData, setFormData] = useState({
    client_id: mission?.client_id || '',
    driver_id: mission?.driver_id || '',
    collection_site_id: mission?.collection_site_id || '',
    deposit_site_id: mission?.deposit_site_id || '',
    vehicle_id: mission?.vehicle_id || '',
    material_type_id: mission?.material_type_id || '',
    mission_date: mission?.mission_date || new Date().toISOString().split('T')[0],
    empty_weight_kg: mission?.empty_weight_kg || '',
    loaded_weight_kg: mission?.loaded_weight_kg || '',
    driver_comment: mission?.driver_comment || '',
    status: mission?.status || 'validated',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [collectionSites, setCollectionSites] = useState<CollectionSite[]>([]);
  const [depositSites, setDepositSites] = useState<DepositSite[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clientsRes, driversRes, collectionRes, depositRes, vehiclesRes, materialsRes] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'driver').order('full_name'),
      supabase.from('collection_sites').select('*').order('name'),
      supabase.from('deposit_sites').select('*').order('name'),
      supabase.from('vehicles').select('*').order('license_plate'),
      supabase.from('material_types').select('*').order('name'),
    ]);

    if (clientsRes.data) setClients(clientsRes.data);
    if (driversRes.data) setDrivers(driversRes.data);
    if (collectionRes.data) setCollectionSites(collectionRes.data);
    if (depositRes.data) setDepositSites(depositRes.data);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    if (materialsRes.data) setMaterialTypes(materialsRes.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emptyWeight = parseFloat(formData.empty_weight_kg);
    const loadedWeight = parseFloat(formData.loaded_weight_kg);

    if (isNaN(emptyWeight) || isNaN(loadedWeight)) {
      setError('Les poids doivent être des nombres valides');
      setLoading(false);
      return;
    }

    if (loadedWeight <= emptyWeight) {
      setError('Le poids en charge doit être supérieur au poids à vide');
      setLoading(false);
      return;
    }

    const missionData = {
      client_id: formData.client_id,
      driver_id: formData.driver_id,
      collection_site_id: formData.collection_site_id,
      deposit_site_id: formData.deposit_site_id,
      vehicle_id: formData.vehicle_id,
      material_type_id: formData.material_type_id,
      mission_date: formData.mission_date,
      empty_weight_kg: formData.empty_weight_kg,
      loaded_weight_kg: formData.loaded_weight_kg,
      driver_comment: formData.driver_comment,
      status: formData.status,
      validated_at: formData.status === 'validated' && !mission?.validated_at ? new Date().toISOString() : mission?.validated_at,
    };

    let error: any;

    if (mission?.id) {
      const result = await supabase
        .from('missions')
        .update(missionData)
        .eq('id', mission.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('missions')
        .insert([missionData]);
      error = result.error;
    }

    if (error) {
      setError(mission?.id ? 'Erreur lors de la modification de la mission' : 'Erreur lors de la création de la mission');
      console.error(error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  };

  const netWeight = formData.empty_weight_kg && formData.loaded_weight_kg
    ? ((parseFloat(formData.loaded_weight_kg) - parseFloat(formData.empty_weight_kg)) / 1000).toFixed(2)
    : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {mission?.id ? 'Modifier la mission' : 'Nouvelle Mission'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chauffeur *
              </label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un chauffeur</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site de collecte *
              </label>
              <select
                value={formData.collection_site_id}
                onChange={(e) => setFormData({ ...formData, collection_site_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un site</option>
                {collectionSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site de dépose *
              </label>
              <select
                value={formData.deposit_site_id}
                onChange={(e) => setFormData({ ...formData, deposit_site_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un site</option>
                {depositSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Véhicule *
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de matériau *
              </label>
              <select
                value={formData.material_type_id}
                onChange={(e) => setFormData({ ...formData, material_type_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Sélectionner un matériau</option>
                {materialTypes.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de mission *
              </label>
              <input
                type="date"
                value={formData.mission_date}
                onChange={(e) => setFormData({ ...formData, mission_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="draft">Brouillon</option>
                <option value="completed">Terminée</option>
                <option value="validated">Validée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids à vide (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.empty_weight_kg}
                onChange={(e) => setFormData({ ...formData, empty_weight_kg: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 2000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids en charge (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.loaded_weight_kg}
                onChange={(e) => setFormData({ ...formData, loaded_weight_kg: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 35752"
                required
              />
            </div>
          </div>

          {formData.empty_weight_kg && formData.loaded_weight_kg && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Poids net calculé : <span className="text-2xl font-bold text-green-700">{netWeight} T</span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire
            </label>
            <textarea
              value={formData.driver_comment}
              onChange={(e) => setFormData({ ...formData, driver_comment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Commentaire sur la mission..."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mission ? 'Enregistrer' : 'Créer la mission'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
