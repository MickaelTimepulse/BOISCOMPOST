import { useState, useEffect } from 'react';
import { supabase, CollectionSite, DepositSite, Client } from '../../lib/supabase';
import { Plus, Loader2, CreditCard as Edit2, Save, MapPin, Trash2 } from 'lucide-react';

export function SitesManager() {
  const [collectionSites, setCollectionSites] = useState<CollectionSite[]>([]);
  const [depositSites, setDepositSites] = useState<DepositSite[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'collection' | 'deposit'>('collection');
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [deletingSite, setDeletingSite] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', address: '', client_id: '', is_active: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: collection }, { data: deposit }, { data: clientsData }] = await Promise.all([
      supabase.from('collection_sites').select('*').order('created_at', { ascending: false }),
      supabase.from('deposit_sites').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('is_active', true)
    ]);
    if (collection) setCollectionSites(collection);
    if (deposit) setDepositSites(deposit);
    if (clientsData) setClients(clientsData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const table = activeTab === 'collection' ? 'collection_sites' : 'deposit_sites';
    const data = activeTab === 'collection'
      ? { name: formData.name, address: formData.address, client_id: formData.client_id, is_active: formData.is_active }
      : { name: formData.name, address: formData.address, is_active: formData.is_active };

    if (editingSite) {
      await supabase.from(table).update(data).eq('id', editingSite.id);
    } else {
      await supabase.from(table).insert(data);
    }
    setShowForm(false);
    setEditingSite(null);
    setFormData({ name: '', address: '', client_id: '', is_active: true });
    loadData();
  };

  const handleEdit = (site: any) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      address: site.address,
      client_id: site.client_id || '',
      is_active: site.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingSite) return;
    const table = activeTab === 'collection' ? 'collection_sites' : 'deposit_sites';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', deletingSite.id);
    if (!error) {
      setDeletingSite(null);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Sites</h2>
        <button onClick={() => { setEditingSite(null); setFormData({ name: '', address: '', client_id: '', is_active: true }); setShowForm(true); }} className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nouveau Site
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('collection')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'collection' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
          Sites de Collecte
        </button>
        <button onClick={() => setActiveTab('deposit')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'deposit' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
          Sites de Dépose
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom du site *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adresse *</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
            </div>
            {activeTab === 'collection' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <select value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required>
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-green-700 border-gray-300 rounded" />
              <label className="ml-2 text-sm text-gray-700">Site actif</label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditingSite(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">Annuler</button>
              <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Save className="w-4 h-4" />Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {(activeTab === 'collection' ? collectionSites : depositSites).map((site) => (
          <div key={site.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-start">
            <div className="flex gap-3">
              <div className="bg-white p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{site.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${site.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {site.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{site.address}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(site)} className="p-2 text-gray-600 hover:text-green-700 hover:bg-white rounded-lg" title="Modifier"><Edit2 className="w-5 h-5" /></button>
              <button onClick={() => setDeletingSite(site)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg" title="Supprimer"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>

      {deletingSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le site <strong>{deletingSite.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingSite(null)}
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
