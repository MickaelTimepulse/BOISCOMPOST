import { useState } from 'react';
import { supabase, Client, CollectionSite, DepositSite, Vehicle, MaterialType } from '../../lib/supabase';
import { X, Loader2, Save } from 'lucide-react';

type MissionFormProps = {
  onClose: () => void;
  onSuccess: () => void;
  driverId: string;
  clients: Client[];
  collectionSites: CollectionSite[];
  depositSites: DepositSite[];
  vehicles: Vehicle[];
  materialTypes: MaterialType[];
  missionRequestId?: string;
  initialData?: {
    client_id?: string;
    collection_site_id?: string;
    estimated_weight_tons?: number;
  };
  mission?: any;
};

export function MissionForm({
  onClose,
  onSuccess,
  driverId,
  clients,
  collectionSites,
  depositSites,
  vehicles,
  materialTypes,
  missionRequestId,
  initialData,
  mission
}: MissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    client_id: initialData?.client_id || mission?.client_id || '',
    collection_site_id: initialData?.collection_site_id || mission?.collection_site_id || '',
    deposit_site_id: mission?.deposit_site_id || '',
    vehicle_id: mission?.vehicle_id || '',
    material_type_id: mission?.material_type_id || '',
    mission_date: mission?.mission_date || new Date().toISOString().split('T')[0],
    empty_weight_kg: mission?.empty_weight_kg?.toString() || '',
    loaded_weight_kg: mission?.loaded_weight_kg?.toString() || '',
    driver_comment: mission?.driver_comment || ''
  });

  const filteredCollectionSites = formData.client_id
    ? collectionSites.filter(site => site.client_id === formData.client_id)
    : collectionSites;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emptyWeight = parseFloat(formData.empty_weight_kg);
      const loadedWeight = parseFloat(formData.loaded_weight_kg);

      if (loadedWeight <= emptyWeight) {
        setError('Le poids en charge doit être supérieur au poids à vide');
        setLoading(false);
        return;
      }

      if (mission) {
        const { error: updateError } = await supabase.from('missions').update({
          client_id: formData.client_id,
          collection_site_id: formData.collection_site_id,
          deposit_site_id: formData.deposit_site_id,
          vehicle_id: formData.vehicle_id,
          material_type_id: formData.material_type_id,
          mission_date: formData.mission_date,
          empty_weight_kg: emptyWeight,
          loaded_weight_kg: loadedWeight,
          driver_comment: formData.driver_comment || null
        }).eq('id', mission.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('missions').insert({
          client_id: formData.client_id,
          driver_id: driverId,
          collection_site_id: formData.collection_site_id,
          deposit_site_id: formData.deposit_site_id,
          vehicle_id: formData.vehicle_id,
          material_type_id: formData.material_type_id,
          mission_date: formData.mission_date,
          empty_weight_kg: emptyWeight,
          loaded_weight_kg: loadedWeight,
          driver_comment: formData.driver_comment || null,
          status: 'completed'
        });

        if (insertError) throw insertError;

        if (missionRequestId) {
          await supabase.from('mission_requests').update({
            status: 'converted_to_mission',
            converted_at: new Date().toISOString()
          }).eq('id', missionRequestId);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {mission ? 'Modifier la Mission' : missionRequestId ? 'Convertir la demande en Mission' : 'Nouvelle Mission'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value, collection_site_id: '' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              Site de collecte *
            </label>
            <select
              value={formData.collection_site_id}
              onChange={(e) => setFormData({ ...formData, collection_site_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              disabled={!formData.client_id}
            >
              <option value="">Sélectionner un site</option>
              {filteredCollectionSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} - {site.address}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un site</option>
              {depositSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} - {site.address}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un type</option>
              {materialTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} - {vehicle.license_plate}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de la mission *
            </label>
            <input
              type="date"
              value={formData.mission_date}
              onChange={(e) => setFormData({ ...formData, mission_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poids à vide (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.empty_weight_kg}
                onChange={(e) => setFormData({ ...formData, empty_weight_kg: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {formData.empty_weight_kg && formData.loaded_weight_kg && (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Poids net: <span className="font-bold text-green-700">
                  {((parseFloat(formData.loaded_weight_kg) - parseFloat(formData.empty_weight_kg)) / 1000).toFixed(2)} tonnes
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={formData.driver_comment}
              onChange={(e) => setFormData({ ...formData, driver_comment: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Notes, observations..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
