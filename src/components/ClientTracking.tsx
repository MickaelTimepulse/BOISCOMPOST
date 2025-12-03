import { useState, useMemo } from 'react';
import { supabase, Mission, Client } from '../lib/supabase';
import { Search, Package, Calendar, Weight, Loader2, BarChart3, Filter, Truck } from 'lucide-react';

type PeriodFilter = 'all' | 'week' | 'month' | 'year';

interface MaterialStats {
  material_type_id: string;
  count: number;
  total_weight: number;
}

export function ClientTracking() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [materialTypes, setMaterialTypes] = useState<Record<string, string>>({});
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [collectionSites, setCollectionSites] = useState<any[]>([]);
  const [requestForm, setRequestForm] = useState({ collection_site_id: '', estimated_weight_tons: '' });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResults(false);

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('tracking_token', trackingCode.trim())
        .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        setError('Code de suivi invalide');
        setClient(null);
        setMissions([]);
        setLoading(false);
        return;
      }

      setClient(clientData);

      const { data: missionsData, error: missionsError } = await supabase
        .from('missions')
        .select('*')
        .eq('client_id', clientData.id)
        .eq('status', 'validated')
        .order('mission_date', { ascending: false });

      if (missionsError) throw missionsError;

      setMissions(missionsData || []);

      const { data: materialsData } = await supabase
        .from('material_types')
        .select('id, name');

      if (materialsData) {
        const materialsMap: Record<string, string> = {};
        materialsData.forEach(m => {
          materialsMap[m.id] = m.name;
        });
        setMaterialTypes(materialsMap);
      }

      const { data: sitesData } = await supabase
        .from('collection_sites')
        .select('*')
        .eq('client_id', clientData.id)
        .eq('is_active', true);

      if (sitesData) {
        setCollectionSites(sitesData);
      }

      setShowResults(true);
    } catch (err: any) {
      setError('Erreur lors de la recherche. Veuillez réessayer.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMissions = useMemo(() => {
    if (periodFilter === 'all') return missions;

    const now = new Date();
    const filterDate = new Date();

    switch (periodFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return missions.filter(mission => new Date(mission.mission_date) >= filterDate);
  }, [missions, periodFilter]);

  const stats = useMemo(() => {
    const totalWeight = filteredMissions.reduce((sum, mission) => sum + mission.net_weight_tons, 0);
    const totalCount = filteredMissions.length;

    const materialStats: Record<string, MaterialStats> = {};
    filteredMissions.forEach(mission => {
      const matId = mission.material_type_id;
      if (!materialStats[matId]) {
        materialStats[matId] = { material_type_id: matId, count: 0, total_weight: 0 };
      }
      materialStats[matId].count += 1;
      materialStats[matId].total_weight += mission.net_weight_tons;
    });

    return { totalWeight, totalCount, materialStats: Object.values(materialStats) };
  }, [filteredMissions]);

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'year': return 'Cette année';
      default: return 'Toute la période';
    }
  };

  const handleRequestMission = async () => {
    if (!client || !requestForm.collection_site_id || !requestForm.estimated_weight_tons) {
      return;
    }

    setSubmittingRequest(true);

    try {
      const { error } = await supabase
        .from('mission_requests')
        .insert({
          client_id: client.id,
          collection_site_id: requestForm.collection_site_id,
          estimated_weight_tons: parseFloat(requestForm.estimated_weight_tons)
        });

      if (error) throw error;

      setShowRequestModal(false);
      setRequestForm({ collection_site_id: '', estimated_weight_tons: '' });
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-5xl font-bold text-green-700">BOISCOMPOST</h1>
          </div>
          <p className="text-gray-600 text-lg">Suivi de vos collectes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="tracking-code" className="block text-sm font-medium text-gray-700 mb-2">
                Entrez votre code de suivi
              </label>
              <div className="flex gap-3">
                <input
                  id="tracking-code"
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ex: a56f5da4-13cd-4402-8a69-fffb8b08f52e"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Rechercher
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        {showResults && client && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{client.name}</h2>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  Déclencher une mission
                </button>
              </div>
              <div className="flex justify-between items-start mb-6">
                <div></div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPeriodFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodFilter === 'all'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tout
                  </button>
                  <button
                    onClick={() => setPeriodFilter('week')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodFilter === 'week'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Semaine
                  </button>
                  <button
                    onClick={() => setPeriodFilter('month')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodFilter === 'month'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Mois
                  </button>
                  <button
                    onClick={() => setPeriodFilter('year')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      periodFilter === 'year'
                        ? 'bg-green-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Année
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Période : <span className="font-medium">{getPeriodLabel()}</span>
                </p>
              </div>

              {filteredMissions.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Weight className="w-5 h-5 text-green-700" />
                        <span className="text-sm font-medium text-gray-700">Total collecté</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700">{stats.totalWeight.toFixed(2)} T</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-blue-700" />
                        <span className="text-sm font-medium text-gray-700">Nombre de collectes</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">{stats.totalCount}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-gray-700" />
                        <span className="text-sm font-medium text-gray-700">Dernière collecte</span>
                      </div>
                      <p className="text-lg font-bold text-gray-700">
                        {new Date(filteredMissions[0].mission_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {stats.materialStats.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Répartition par matériau
                      </h3>
                      <div className="space-y-2">
                        {stats.materialStats.map((stat) => (
                          <div key={stat.material_type_id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              {materialTypes[stat.material_type_id] || 'Type inconnu'}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-600">{stat.count} collecte{stat.count > 1 ? 's' : ''}</span>
                              <span className="font-semibold text-green-700">{stat.total_weight.toFixed(2)} T</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historique des collectes</h3>

                {filteredMissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune collecte pour cette période</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMissions.map((mission) => (
                      <div key={mission.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {new Date(mission.mission_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">
                              {mission.net_weight_tons.toFixed(2)} T
                            </p>
                            <p className="text-xs text-gray-500">Poids net</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-2">
                          <div className="flex items-start gap-2">
                            <Weight className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-600">Poids à vide: <span className="font-medium">{mission.empty_weight_kg} kg</span></p>
                              <p className="text-gray-600">Poids en charge: <span className="font-medium">{mission.loaded_weight_kg} kg</span></p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-gray-600">Matériau: <span className="font-medium">{materialTypes[mission.material_type_id] || 'Non spécifié'}</span></p>
                            </div>
                          </div>
                        </div>

                        {mission.driver_comment && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700"><span className="font-medium">Note:</span> {mission.driver_comment}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Demande de mission</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site de collecte
                  </label>
                  <select
                    value={requestForm.collection_site_id}
                    onChange={(e) => setRequestForm({ ...requestForm, collection_site_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez un site</option>
                    {collectionSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} - {site.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poids estimatif (en tonnes)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={requestForm.estimated_weight_tons}
                    onChange={(e) => setRequestForm({ ...requestForm, estimated_weight_tons: e.target.value })}
                    placeholder="Ex: 5.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestForm({ collection_site_id: '', estimated_weight_tons: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submittingRequest}
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestMission}
                  disabled={submittingRequest || !requestForm.collection_site_id || !requestForm.estimated_weight_tons}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    'Envoyer la demande'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-green-700 text-white px-8 py-4 rounded-lg shadow-2xl animate-fade-in">
              <p className="text-lg font-semibold">✓ Votre demande est enregistrée</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
