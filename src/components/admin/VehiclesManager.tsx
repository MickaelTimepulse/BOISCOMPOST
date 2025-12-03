import { useState, useEffect, startTransition } from 'react';
import { supabase, Vehicle } from '../../lib/supabase';
import { Plus, Loader2, CreditCard as Edit2, Save, Truck, Trash2 } from 'lucide-react';

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({ name: '', license_plate: '', vehicle_type: '', is_active: true });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (data) setVehicles(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      await supabase.from('vehicles').update(formData).eq('id', editingVehicle.id);
    } else {
      await supabase.from('vehicles').insert(formData);
    }
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({ name: '', license_plate: '', vehicle_type: '', is_active: true });
    loadVehicles();
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({ name: vehicle.name, license_plate: vehicle.license_plate, vehicle_type: vehicle.vehicle_type, is_active: vehicle.is_active });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    const vehicleId = deletingVehicle.id;
    setDeletingVehicle(null);

    setVehicles(prev => prev.filter(v => v.id !== vehicleId));

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      startTransition(() => {
        loadVehicles();
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Véhicules</h2>
        <button onClick={() => { setEditingVehicle(null); setFormData({ name: '', license_plate: '', vehicle_type: '', is_active: true }); setShowForm(true); }} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouveau Véhicule
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du véhicule *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plaque d'immatriculation *</label>
                <input type="text" value={formData.license_plate} onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de véhicule *</label>
                <input type="text" value={formData.vehicle_type} onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required placeholder="Ex: Camion 12T" />
              </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-green-700 border-gray-300 rounded" />
              <label className="ml-2 text-sm text-gray-700">Véhicule actif</label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingVehicle(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Annuler</button>
              <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Save className="w-4 h-4" />Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg">
                <Truck className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                  <span className="text-sm text-gray-600">({vehicle.license_plate})</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${vehicle.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {vehicle.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{vehicle.vehicle_type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(vehicle)} className="p-2 text-gray-600 hover:text-green-700 hover:bg-white rounded-lg" title="Modifier"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => setDeletingVehicle(vehicle)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg" title="Supprimer"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>

      {deletingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le véhicule <strong>{deletingVehicle.name}</strong> ({deletingVehicle.license_plate}) ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingVehicle(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
