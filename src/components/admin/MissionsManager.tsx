import { useState, useEffect } from 'react';
import { supabase, Mission, Client, Profile, CollectionSite, DepositSite, Vehicle, MaterialType } from '../../lib/supabase';
import { Loader2, Calendar, Filter, CheckCircle, Mail, Plus, Edit, Trash2 } from 'lucide-react';
import { MissionForm } from './MissionForm';

interface MissionsManagerProps {
  missionRequestId?: string | null;
  onRequestProcessed?: () => void;
}

export function MissionsManager({ missionRequestId, onRequestProcessed }: MissionsManagerProps) {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [missionFromRequest, setMissionFromRequest] = useState<any>(null);

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    if (missionRequestId) {
      loadMissionRequest(missionRequestId);
    }
  }, [missionRequestId]);

  const loadMissionRequest = async (requestId: string) => {
    const { data, error } = await supabase
      .from('mission_requests')
      .select(`
        *,
        client:clients(*),
        collection_site:collection_sites(*)
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (!error && data) {
      setMissionFromRequest({
        client_id: data.client_id,
        collection_site_id: data.collection_site_id,
        estimated_weight_tons: data.estimated_weight_tons,
        mission_request_id: data.id
      });
      setShowAddForm(true);
    }
  };

  const loadMissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('missions')
      .select(`
        *,
        client:clients(*),
        driver:profiles(*),
        collection_site:collection_sites(*),
        deposit_site:deposit_sites(*),
        vehicle:vehicles(*),
        material_type:material_types(*)
      `)
      .order('mission_date', { ascending: false });

    if (!error && data) {
      setMissions(data);
    }
    setLoading(false);
  };

  const handleValidateMission = async (missionId: string, clientEmail: string) => {
    const { error } = await supabase
      .from('missions')
      .update({ status: 'validated', validated_at: new Date().toISOString() })
      .eq('id', missionId);

    if (!error) {
      loadMissions();
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      return;
    }

    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', missionId);

    if (!error) {
      loadMissions();
    }
  };

  const filteredMissions = missions.filter((mission) => {
    if (dateFilter && mission.mission_date !== dateFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div>
      {(showAddForm || editingMission) && (
        <MissionForm
          mission={editingMission || missionFromRequest}
          onSuccess={async () => {
            if (missionRequestId) {
              await supabase
                .from('mission_requests')
                .update({ status: 'converted' })
                .eq('id', missionRequestId);
              if (onRequestProcessed) {
                onRequestProcessed();
              }
              setMissionFromRequest(null);
            }
            setShowAddForm(false);
            setEditingMission(null);
            loadMissions();
          }}
          onCancel={() => {
            setShowAddForm(false);
            setEditingMission(null);
            setMissionFromRequest(null);
            if (missionRequestId && onRequestProcessed) {
              onRequestProcessed();
            }
          }}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Gestion des Missions</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter une mission
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucune mission trouvée</p>
          </div>
        ) : (
          filteredMissions.map((mission) => (
            <div key={mission.id} className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {mission.client?.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Validée
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Chauffeur: {mission.driver?.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(mission.mission_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">
                    {mission.net_weight_tons.toFixed(2)} T
                  </p>
                  <p className="text-xs text-gray-500">Poids net</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Collecte</p>
                  <p className="font-medium">{mission.collection_site?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Dépose</p>
                  <p className="font-medium">{mission.deposit_site?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Matériau</p>
                  <p className="font-medium">{mission.material_type?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Véhicule</p>
                  <p className="font-medium">{mission.vehicle?.license_plate}</p>
                </div>
              </div>

              {mission.driver_comment && (
                <div className="bg-white rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Commentaire du chauffeur:</p>
                  <p className="text-sm text-gray-700">{mission.driver_comment}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingMission(mission)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDeleteMission(mission.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
