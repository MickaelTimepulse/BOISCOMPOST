import { useState, useEffect } from 'react';
import { supabase, Client } from '../../lib/supabase';
import { Plus, Search, CreditCard as Edit2, Eye, Loader2, Mail, Phone, MapPin, Hash, ExternalLink, Trash2 } from 'lucide-react';
import { ClientForm } from './ClientForm';

export function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.siret?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuccess = () => {
    setShowForm(false);
    setEditingClient(null);
    loadClients();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', deletingClient.id);
    if (!error) {
      setDeletingClient(null);
      loadClients();
    }
  };

  const getTrackingUrl = (token: string) => {
    return `${window.location.origin}/tracking/${token}`;
  };

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
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Clients</h2>
        <button
          onClick={() => {
            setEditingClient(null);
            setShowForm(true);
          }}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Client
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou SIRET..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {showForm && (
        <ClientForm
          client={editingClient}
          onClose={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      <div className="grid gap-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              {searchTerm ? 'Aucun client trouvé' : 'Aucun client enregistré'}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {client.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${client.email}`} className="hover:text-green-700">
                        {client.email}
                      </a>
                    </div>

                    {client.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${client.phone}`} className="hover:text-green-700">
                          {client.phone}
                        </a>
                      </div>
                    )}

                    {client.siret && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Hash className="w-4 h-4" />
                        <span>{client.siret}</span>
                      </div>
                    )}

                    {client.address && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Code de suivi client:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-mono font-bold bg-green-50 text-green-700 px-4 py-2 rounded border-2 border-green-200">
                          {client.tracking_token}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(client.tracking_token);
                          }}
                          className="p-2 hover:bg-white rounded transition-colors"
                          title="Copier le code"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Lien de suivi:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white px-3 py-1 rounded border border-gray-300 flex-1 overflow-x-auto">
                        {getTrackingUrl(client.tracking_token)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getTrackingUrl(client.tracking_token));
                        }}
                        className="p-2 hover:bg-white rounded transition-colors"
                        title="Copier le lien"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-gray-600 hover:text-green-700 hover:bg-white rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeletingClient(client)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deletingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer le client <strong>{deletingClient.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingClient(null)}
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
