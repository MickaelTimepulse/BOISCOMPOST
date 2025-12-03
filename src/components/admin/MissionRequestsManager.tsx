import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Truck, MapPin, Weight, Calendar, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';

interface MissionRequest {
  id: string;
  client_id: string;
  collection_site_id: string;
  estimated_weight_tons: number;
  status: string;
  created_at: string;
  viewed_by_admin_at: string | null;
  viewed_by_driver_at: string | null;
  client: { name: string; email: string };
  collection_site: { name: string; address: string };
}

interface MissionRequestsManagerProps {
  onConvertToMission?: (requestId: string) => void;
  onRequestUpdate?: () => void;
}

export function MissionRequestsManager({ onConvertToMission, onRequestUpdate }: MissionRequestsManagerProps) {
  const [requests, setRequests] = useState<MissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mission_requests')
      .select(`
        *,
        client:clients(name, email),
        collection_site:collection_sites(name, address)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const markAsViewed = async (requestId: string) => {
    const { error } = await supabase
      .from('mission_requests')
      .update({
        viewed_by_admin_at: new Date().toISOString(),
        status: 'viewed'
      })
      .eq('id', requestId);

    if (!error) {
      loadRequests();
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    }
  };

  const handleConvertToMission = (request: MissionRequest) => {
    if (onConvertToMission) {
      onConvertToMission(request.id);
    }
  };

  const handleDeleteRequest = async (request: MissionRequest) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la demande de ${request.client.name} ?`)) {
      return;
    }

    const { error } = await supabase
      .from('mission_requests')
      .delete()
      .eq('id', request.id);

    if (!error) {
      loadRequests();
      if (onRequestUpdate) {
        onRequestUpdate();
      }
    } else {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Demandes de missions</h2>
        <p className="text-sm text-gray-600 mt-1">Demandes reçues des clients</p>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucune demande de mission</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className={`rounded-lg p-6 ${
                request.status === 'pending' ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {request.client.name}
                    </h3>
                    {request.status === 'pending' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Nouvelle demande
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Vue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{request.client.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    {request.estimated_weight_tons.toFixed(1)} T
                  </p>
                  <p className="text-xs text-gray-500">Poids estimé</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Site de collecte</p>
                    <p className="font-medium text-gray-900">{request.collection_site.name}</p>
                    <p className="text-sm text-gray-600">{request.collection_site.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Date de demande</p>
                    <p className="font-medium text-gray-900">
                      {new Date(request.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {request.status === 'pending' && (
                  <button
                    onClick={() => markAsViewed(request.id)}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer comme vue
                  </button>
                )}
                <button
                  onClick={() => handleConvertToMission(request)}
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Convertir en mission
                </button>
                <button
                  onClick={() => handleDeleteRequest(request)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>

              {request.viewed_by_admin_at && (
                <div className="mt-4 text-xs text-gray-500">
                  Vue le {new Date(request.viewed_by_admin_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
