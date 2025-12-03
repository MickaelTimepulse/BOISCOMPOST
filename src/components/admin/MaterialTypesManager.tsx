import { useState, useEffect } from 'react';
import { supabase, MaterialType } from '../../lib/supabase';
import { Plus, Loader2, CreditCard as Edit2, X, Save, Trash2 } from 'lucide-react';

export function MaterialTypesManager() {
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialType | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<MaterialType | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    const { data } = await supabase.from('material_types').select('*').order('created_at', { ascending: false });
    if (data) setMaterials(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      await supabase.from('material_types').update(formData).eq('id', editingMaterial.id);
    } else {
      await supabase.from('material_types').insert(formData);
    }
    setShowForm(false);
    setEditingMaterial(null);
    setFormData({ name: '', description: '', is_active: true });
    loadMaterials();
  };

  const handleEdit = (material: MaterialType) => {
    setEditingMaterial(material);
    setFormData({ name: material.name, description: material.description || '', is_active: material.is_active });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingMaterial) return;
    const { error } = await supabase
      .from('material_types')
      .delete()
      .eq('id', deletingMaterial.id);
    if (!error) {
      setDeletingMaterial(null);
      loadMaterials();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Types de Matériaux</h2>
        <button onClick={() => { setEditingMaterial(null); setFormData({ name: '', description: '', is_active: true }); setShowForm(true); }} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouveau Matériau
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-green-700 border-gray-300 rounded" />
              <label className="ml-2 text-sm text-gray-700">Actif</label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingMaterial(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Annuler</button>
              <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Save className="w-4 h-4" />Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {materials.map((material) => (
          <div key={material.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{material.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${material.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {material.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              {material.description && <p className="text-sm text-gray-600 mt-1">{material.description}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(material)} className="p-2 text-gray-600 hover:text-green-700 hover:bg-white rounded-lg" title="Modifier"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => setDeletingMaterial(material)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg" title="Supprimer"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>

      {deletingMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le matériau <strong>{deletingMaterial.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingMaterial(null)}
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
