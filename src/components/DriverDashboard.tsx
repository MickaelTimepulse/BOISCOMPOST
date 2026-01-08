import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Mission, Client, CollectionSite, DepositSite, Vehicle, MaterialType } from '../lib/supabase';
import { LogOut, Plus, Truck, MapPin, Package, Calendar, Weight, CheckCircle, Loader2, Bell, ArrowRight, Edit, Trash2 } from 'lucide-react';
import { MissionForm } from './driver/MissionForm';

export function DriverDashboard() {
  const { profile, signOut } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [collectionSites, setCollectionSites] = useState<CollectionSite[]>([]);
  const [depositSites, setDepositSites] = useState<DepositSite[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [missionRequests, setMissionRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'missions' | 'requests'>('requests');
  const [convertingRequestId, setConvertingRequestId] = useState<string | null>(null);
  const [convertingRequestData, setConvertingRequestData] = useState<any>(null);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadMissions(),
      loadClients(),
      loadCollectionSites(),
      loadDepositSites(),
      loadVehicles(),
      loadMaterialTypes(),
      loadMissionRequests()
    ]);
    setLoading(false);
  };

  const loadMissions = async () => {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('driver_id', profile?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMissions(data);
    }
  };

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*').eq('is_active', true);
    if (data) setClients(data);
  };

  const loadCollectionSites = async () => {
    const { data } = await supabase.from('collection_sites').select('*').eq('is_active', true);
    if (data) setCollectionSites(data);
  };

  const loadDepositSites = async () => {
    const { data } = await supabase.from('deposit_sites').select('*').eq('is_active', true);
    if (data) setDepositSites(data);
  };

  const loadVehicles = async () => {
    const { data } = await supabase.from('vehicles').select('*').eq('is_active', true);
    if (data) setVehicles(data);
  };

  const loadMaterialTypes = async () => {
    const { data } = await supabase.from('material_types').select('*').eq('is_active', true);
    if (data) setMaterialTypes(data);
  };

  const loadMissionRequests = async () => {
    const { data } = await supabase
      .from('mission_requests')
      .select(`
        *,
        client:clients(name, email),
        collection_site:collection_sites(name, address)
      `)
      .order('created_at', { ascending: false });

    if (data) setMissionRequests(data);
  };

  const markRequestAsViewed = async (requestId: string) => {
    const { error } = await supabase
      .from('mission_requests')
      .update({
        viewed_by_driver_at: new Date().toISOString(),
        status: 'viewed'
      })
      .eq('id', requestId);

    if (!error) {
      loadMissionRequests();
    }
  };

  const handleMissionCreated = () => {
    setShowForm(false);
    setConvertingRequestId(null);
    setConvertingRequestData(null);
    setEditingMission(null);
    loadMissions();
    loadMissionRequests();
  };

  const handleConvertToMission = (request: any) => {
    setConvertingRequestId(request.id);
    setConvertingRequestData({
      client_id: request.client_id,
      collection_site_id: request.collection_site_id,
      estimated_weight_tons: request.estimated_weight_tons,
      client_mission_id: request.client_mission_id,
      client_request_date: request.client_request_date
    });
    setShowForm(true);
  };

  const handleEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setShowForm(true);
  };

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      return;
    }

    const { error } = await supabase.from('missions').delete().eq('id', missionId);

    if (!error) {
      loadMissions();
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setConvertingRequestId(null);
    setConvertingRequestData(null);
    setEditingMission(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-green-700">BOISCOMPOST</h1>
              <div className="h-8 w-px bg-gray-300"></div>
              <p className="text-sm text-gray-600">Chauffeur: {profile?.full_name}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            Demandes
            {missionRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {missionRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'missions'
                ? 'bg-green-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Mes Missions
          </button>
        </div>

        {activeTab === 'missions' && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Mes Missions</h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Mission
            </button>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Demandes de missions</h2>
            <div className="grid gap-4">
              {missionRequests.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune demande de mission</p>
                </div>
              ) : (
                missionRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`rounded-lg p-6 ${
                      request.status === 'pending' ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-white'
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
                          onClick={() => markRequestAsViewed(request.id)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marquer comme vue
                        </button>
                      )}
                      {request.status !== 'converted_to_mission' && (
                        <button
                          onClick={() => handleConvertToMission(request)}
                          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Convertir en mission
                        </button>
                      )}
                      {request.status === 'converted_to_mission' && (
                        <span className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800">
                          Convertie en mission
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {showForm && (
          <MissionForm
            onClose={handleCloseForm}
            onSuccess={handleMissionCreated}
            driverId={profile!.id}
            clients={clients}
            collectionSites={collectionSites}
            depositSites={depositSites}
            vehicles={vehicles}
            materialTypes={materialTypes}
            missionRequestId={convertingRequestId || undefined}
            initialData={convertingRequestData || undefined}
            mission={editingMission || undefined}
          />
        )}

        {activeTab === 'missions' && <div className="grid gap-4">
          {missions.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune mission enregistrée</p>
              <p className="text-sm text-gray-500 mt-2">
                Cliquez sur "Nouvelle Mission" pour commencer
              </p>
            </div>
          ) : (
            missions.map((mission) => (
              <div key={mission.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Mission du {new Date(mission.mission_date).toLocaleDateString('fr-FR')}
                    </h3>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 bg-green-100 text-green-800">
                      Validée
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      {mission.net_weight_tons.toFixed(2)} T
                    </p>
                    <p className="text-xs text-gray-500">Poids net</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <Weight className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Poids à vide: {mission.empty_weight_kg} kg</p>
                      <p className="text-gray-600">Poids en charge: {mission.loaded_weight_kg} kg</p>
                    </div>
                  </div>
                </div>

                {mission.driver_comment && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{mission.driver_comment}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditMission(mission)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteMission(mission.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>}
      </div>
    </div>
  );
}
