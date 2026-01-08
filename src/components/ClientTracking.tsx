import { useState, useMemo, useEffect } from 'react';
import { supabase, Mission, Client, CollectionSite, DepositSite } from '../lib/supabase';
import { Search, Package, Calendar, Weight, Loader2, BarChart3, Filter, Truck, Download, FileText, MapPin, X } from 'lucide-react';

type PeriodFilter = 'all' | 'week' | 'month' | 'year';

interface MaterialStats {
  material_type_id: string;
  count: number;
  total_weight: number;
}

interface MissionWithSites extends Mission {
  collection_site: CollectionSite;
  deposit_site: DepositSite;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  collectionSiteId: string;
  depositSiteId: string;
  materialTypeId: string;
}

export function ClientTracking() {
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [missions, setMissions] = useState<MissionWithSites[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [materialTypes, setMaterialTypes] = useState<Record<string, string>>({});
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [collectionSites, setCollectionSites] = useState<CollectionSite[]>([]);
  const [depositSites, setDepositSites] = useState<DepositSite[]>([]);
  const [displayLimit, setDisplayLimit] = useState(30);
  const [hasMoreMissions, setHasMoreMissions] = useState(false);
  const [requestForm, setRequestForm] = useState({
    collection_site_id: '',
    estimated_weight_tons: '',
    client_mission_id: '',
    client_request_date: new Date().toISOString().split('T')[0]
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    collectionSiteId: '',
    depositSiteId: '',
    materialTypeId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResults(false);

    try {
      const { data: clientData, error: clientError } = await supabase
        .rpc('get_client_by_tracking_token', { token: trackingCode.trim() })
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
        .select(`
          *,
          collection_site:collection_sites(*),
          deposit_site:deposit_sites(*)
        `)
        .eq('client_id', clientData.id)
        .or('status.eq.completed,status.eq.validated')
        .order('mission_date', { ascending: false });

      if (missionsError) throw missionsError;

      setMissions(missionsData || []);
      setDisplayLimit(30);
      setHasMoreMissions((missionsData || []).length > 30);

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

      const { data: depositSitesData } = await supabase
        .from('deposit_sites')
        .select('*')
        .eq('is_active', true);

      if (depositSitesData) {
        setDepositSites(depositSitesData);
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
    let filtered = missions;

    // Filtre par période (boutons Tout, Semaine, Mois, Année)
    if (periodFilter !== 'all') {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const filterDate = new Date(now);

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

      filtered = filtered.filter(mission => {
        const missionDate = new Date(mission.mission_date);
        missionDate.setHours(0, 0, 0, 0);
        return missionDate >= filterDate;
      });
    }

    // Filtres avancés
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(mission => {
        const missionDate = new Date(mission.mission_date);
        missionDate.setHours(0, 0, 0, 0);
        return missionDate >= startDate;
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(mission => {
        const missionDate = new Date(mission.mission_date);
        missionDate.setHours(0, 0, 0, 0);
        return missionDate <= endDate;
      });
    }

    if (filters.collectionSiteId) {
      filtered = filtered.filter(mission =>
        mission.collection_site_id === filters.collectionSiteId
      );
    }

    if (filters.depositSiteId) {
      filtered = filtered.filter(mission =>
        mission.deposit_site_id === filters.depositSiteId
      );
    }

    if (filters.materialTypeId) {
      filtered = filtered.filter(mission =>
        mission.material_type_id === filters.materialTypeId
      );
    }

    return filtered;
  }, [missions, periodFilter, filters]);

  const displayedMissions = useMemo(() => {
    return filteredMissions.slice(0, displayLimit);
  }, [filteredMissions, displayLimit]);

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

  const loadMoreMissions = () => {
    setDisplayLimit(prev => prev + 30);
  };

  useEffect(() => {
    setDisplayLimit(30);
  }, [periodFilter, filters]);

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
          estimated_weight_tons: parseFloat(requestForm.estimated_weight_tons),
          client_mission_id: requestForm.client_mission_id || null,
          client_request_date: requestForm.client_request_date
        });

      if (error) throw error;

      setShowRequestModal(false);
      setRequestForm({
        collection_site_id: '',
        estimated_weight_tons: '',
        client_mission_id: '',
        client_request_date: new Date().toISOString().split('T')[0]
      });
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const exportToCSV = () => {
    if (!client) return;

    const headers = [
      'N° Commande',
      'ID Demande Client',
      'Date Collecte',
      'Date Demande Client',
      'Lieu de collecte',
      'Adresse collecte',
      'Lieu de dépose',
      'Adresse dépose',
      'Matériau',
      'Poids à vide (kg)',
      'Poids en charge (kg)',
      'Poids net (T)',
      'Commentaire'
    ];

    const rows = filteredMissions.map(m => [
      m.order_number || '',
      m.client_mission_id || '',
      new Date(m.mission_date).toLocaleDateString('fr-FR'),
      m.client_request_date ? new Date(m.client_request_date).toLocaleDateString('fr-FR') : '',
      m.collection_site?.name || '',
      m.collection_site?.address || '',
      m.deposit_site?.name || '',
      m.deposit_site?.address || '',
      materialTypes[m.material_type_id] || '',
      m.empty_weight_kg,
      m.loaded_weight_kg,
      m.net_weight_tons.toFixed(2),
      m.driver_comment || ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `collectes_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = async () => {
    if (!client) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${window.location.origin}/boiscompost_origine.jpg`;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0);
    const logoBase64 = canvas.toDataURL('image/jpeg');

    const printContent = document.createElement('div');
    printContent.id = 'print-content';
    printContent.className = 'print-only';
    printContent.innerHTML = `
      <style>
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          body > *:not(#print-content) { display: none !important; }
          #print-content { display: block !important; }
        }
      </style>
      <div id="pdf-content" style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #F79420; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${logoBase64}" alt="BOISCOMPOST" style="height: 60px; width: auto;">
          </div>
          <div style="text-align: right; font-size: 12px; color: #666;">
            <strong>BOISCOMPOST</strong><br>
            Le Moulin Potiron<br>
            44370 Loireauxence<br>
            France
          </div>
        </div>

        <div style="text-align: center; font-size: 24px; font-weight: bold; color: #548235; margin: 30px 0;">
          Historique des Collectes
        </div>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
          <div style="font-size: 14px; margin-bottom: 10px;">
            <span style="font-weight: bold; color: #548235;">Client :</span> ${client.name}
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="font-size: 14px;">
              <span style="font-weight: bold; color: #548235;">Période :</span> ${getPeriodLabel()}
            </div>
            <div style="font-size: 14px;">
              <span style="font-weight: bold; color: #548235;">Nombre de collectes :</span> ${stats.totalCount}
            </div>
            <div style="font-size: 14px;">
              <span style="font-weight: bold; color: #548235;">Poids total :</span> ${stats.totalWeight.toFixed(2)} T
            </div>
          </div>
          <div style="font-size: 14px; margin-top: 10px;">
            <span style="font-weight: bold; color: #548235;">Date du rapport :</span> ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 8px;">
          <thead>
            <tr>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">N° Cde</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">ID Demande</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Date</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Lieu collecte</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Lieu dépose</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Matériau</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Vide (kg)</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Charge (kg)</th>
              <th style="background: #548235; color: white; padding: 8px 3px; text-align: left; font-weight: bold;">Net (T)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMissions.map(m => `
              <tr>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd;">${m.order_number || '-'}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd; font-size: 7px;">${m.client_mission_id || '-'}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd;">${new Date(m.mission_date).toLocaleDateString('fr-FR')}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd; font-size: 7px;">${m.collection_site?.name || '-'}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd; font-size: 7px;">${m.deposit_site?.name || '-'}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd;">${materialTypes[m.material_type_id] || '-'}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd;">${m.empty_weight_kg}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd;">${m.loaded_weight_kg}</td>
                <td style="padding: 6px 3px; border-bottom: 1px solid #ddd; font-weight: bold;">${m.net_weight_tons.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f5f5f5; font-weight: bold; border-top: 2px solid #548235;">
              <td colspan="8" style="padding: 8px 3px; text-align: right; padding-right: 10px;">TOTAL</td>
              <td style="padding: 8px 3px;">${stats.totalWeight.toFixed(2)} T</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
          Document généré le ${new Date().toLocaleString('fr-FR')} - BOISCOMPOST - Le Moulin Potiron, 44370 Loireauxence
        </div>
      </div>
    `;

    document.body.appendChild(printContent);

    const handleAfterPrint = () => {
      printContent.remove();
      window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);

    setTimeout(() => {
      window.print();
    }, 300);
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
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Masquer les filtres' : 'Filtres avancés'}
                </button>
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

              {showFilters && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtres avancés
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lieu de collecte
                      </label>
                      <select
                        value={filters.collectionSiteId}
                        onChange={(e) => setFilters({ ...filters, collectionSiteId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      >
                        <option value="">Tous les lieux</option>
                        {collectionSites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lieu de dépose
                      </label>
                      <select
                        value={filters.depositSiteId}
                        onChange={(e) => setFilters({ ...filters, depositSiteId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      >
                        <option value="">Tous les lieux</option>
                        {depositSites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Matériau
                      </label>
                      <select
                        value={filters.materialTypeId}
                        onChange={(e) => setFilters({ ...filters, materialTypeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      >
                        <option value="">Tous les matériaux</option>
                        {Object.entries(materialTypes).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setFilters({
                            startDate: '',
                            endDate: '',
                            collectionSiteId: '',
                            depositSiteId: '',
                            materialTypeId: ''
                          });
                        }}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Réinitialiser
                      </button>
                    </div>
                  </div>

                  {(filters.startDate || filters.endDate || filters.collectionSiteId || filters.depositSiteId || filters.materialTypeId) && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Filtres actifs :</span>
                        {filters.startDate && <span className="ml-2 inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs">À partir du {new Date(filters.startDate).toLocaleDateString('fr-FR')}</span>}
                        {filters.endDate && <span className="ml-2 inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Jusqu'au {new Date(filters.endDate).toLocaleDateString('fr-FR')}</span>}
                        {filters.collectionSiteId && <span className="ml-2 inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">{collectionSites.find(s => s.id === filters.collectionSiteId)?.name}</span>}
                        {filters.depositSiteId && <span className="ml-2 inline-flex items-center px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs">{depositSites.find(s => s.id === filters.depositSiteId)?.name}</span>}
                        {filters.materialTypeId && <span className="ml-2 inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs">{materialTypes[filters.materialTypeId]}</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Historique des collectes</h3>
                  {filteredMissions.length > 0 && (
                    <div className="flex gap-3">
                      <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Exporter CSV
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        Exporter PDF
                      </button>
                    </div>
                  )}
                </div>

                {filteredMissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune collecte pour cette période</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {displayedMissions.map((mission) => (
                        <div key={mission.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-semibold text-green-700 mb-1">
                              N° Commande: {mission.order_number}
                            </p>
                            {mission.client_mission_id && (
                              <p className="text-sm text-blue-600 font-medium mb-2">
                                ID Demande Client: {mission.client_mission_id}
                              </p>
                            )}
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
                            {mission.client_request_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Demandé le: {new Date(mission.client_request_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">
                              {mission.net_weight_tons.toFixed(2)} T
                            </p>
                            <p className="text-xs text-gray-500">Poids net</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-blue-800 font-medium mb-1">Lieu de collecte</p>
                                <p className="text-sm font-semibold text-blue-900">{mission.collection_site?.name || 'Non spécifié'}</p>
                                <p className="text-xs text-blue-700 mt-0.5">{mission.collection_site?.address || ''}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-orange-800 font-medium mb-1">Lieu de dépose</p>
                                <p className="text-sm font-semibold text-orange-900">{mission.deposit_site?.name || 'Non spécifié'}</p>
                                <p className="text-xs text-orange-700 mt-0.5">{mission.deposit_site?.address || ''}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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

                  {displayedMissions.length < filteredMissions.length && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={loadMoreMissions}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
                      >
                        <Package className="w-5 h-5" />
                        Charger plus de missions ({filteredMissions.length - displayedMissions.length} restantes)
                      </button>
                      <p className="text-sm text-gray-600 mt-2">
                        Affichage de {displayedMissions.length} sur {filteredMissions.length} collectes
                      </p>
                    </div>
                  )}
                </>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de la mission client (optionnel)
                  </label>
                  <input
                    type="text"
                    value={requestForm.client_mission_id}
                    onChange={(e) => setRequestForm({ ...requestForm, client_mission_id: e.target.value })}
                    placeholder="Ex: CMD-2024-001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de la demande du client
                  </label>
                  <input
                    type="date"
                    value={requestForm.client_request_date}
                    onChange={(e) => setRequestForm({ ...requestForm, client_request_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestForm({
                      collection_site_id: '',
                      estimated_weight_tons: '',
                      client_mission_id: '',
                      client_request_date: new Date().toISOString().split('T')[0]
                    });
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
