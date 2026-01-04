import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Download, FileText, Filter, Calendar, Users, Truck, MapPin, Package, Weight } from 'lucide-react';

interface FilterState {
  startDate: string;
  endDate: string;
  clientId: string;
  driverId: string;
  vehicleId: string;
  collectionSiteId: string;
  depositSiteId: string;
  materialTypeId: string;
  minWeight: string;
  maxWeight: string;
}

export function AccountingDashboard() {
  const [missions, setMissions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [collectionSites, setCollectionSites] = useState<any[]>([]);
  const [depositSites, setDepositSites] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    clientId: '',
    driverId: '',
    vehicleId: '',
    collectionSiteId: '',
    depositSiteId: '',
    materialTypeId: '',
    minWeight: '',
    maxWeight: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [missionsRes, clientsRes, driversRes, vehiclesRes, collectionRes, depositRes, materialsRes] = await Promise.all([
      supabase.from('missions').select(`
        *,
        client:clients(*),
        driver:profiles(*),
        collection_site:collection_sites(*),
        deposit_site:deposit_sites(*),
        vehicle:vehicles(*),
        material_type:material_types(*)
      `).order('mission_date', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'driver').order('full_name'),
      supabase.from('vehicles').select('*').order('license_plate'),
      supabase.from('collection_sites').select('*').order('name'),
      supabase.from('deposit_sites').select('*').order('name'),
      supabase.from('material_types').select('*').order('name'),
    ]);

    if (missionsRes.data) setMissions(missionsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (driversRes.data) setDrivers(driversRes.data);
    if (vehiclesRes.data) setVehicles(vehiclesRes.data);
    if (collectionRes.data) setCollectionSites(collectionRes.data);
    if (depositRes.data) setDepositSites(depositRes.data);
    if (materialsRes.data) setMaterialTypes(materialsRes.data);

    setLoading(false);
  };

  const filteredMissions = missions.filter((mission) => {
    if (filters.startDate && mission.mission_date < filters.startDate) return false;
    if (filters.endDate && mission.mission_date > filters.endDate) return false;
    if (filters.clientId && mission.client_id !== filters.clientId) return false;
    if (filters.driverId && mission.driver_id !== filters.driverId) return false;
    if (filters.vehicleId && mission.vehicle_id !== filters.vehicleId) return false;
    if (filters.collectionSiteId && mission.collection_site_id !== filters.collectionSiteId) return false;
    if (filters.depositSiteId && mission.deposit_site_id !== filters.depositSiteId) return false;
    if (filters.materialTypeId && mission.material_type_id !== filters.materialTypeId) return false;
    if (filters.minWeight && mission.net_weight_tons < parseFloat(filters.minWeight)) return false;
    if (filters.maxWeight && mission.net_weight_tons > parseFloat(filters.maxWeight)) return false;
    return true;
  });

  const totalWeight = filteredMissions.reduce((sum, m) => sum + m.net_weight_tons, 0);
  const totalMissions = filteredMissions.length;

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      clientId: '',
      driverId: '',
      vehicleId: '',
      collectionSiteId: '',
      depositSiteId: '',
      materialTypeId: '',
      minWeight: '',
      maxWeight: '',
    });
  };

  const exportToCSV = () => {
    const headers = [
      'N° Commande',
      'Date',
      'Client',
      'Chauffeur',
      'Site de collecte',
      'Site de dépose',
      'Véhicule',
      'Matériau',
      'Poids à vide (kg)',
      'Poids en charge (kg)',
      'Poids net (T)',
      'Commentaire',
      'Statut'
    ];

    const rows = filteredMissions.map(m => [
      m.order_number || '',
      new Date(m.mission_date).toLocaleDateString('fr-FR'),
      m.client?.name || '',
      m.driver?.full_name || '',
      m.collection_site?.name || '',
      m.deposit_site?.name || '',
      m.vehicle?.license_plate || '',
      m.material_type?.name || '',
      m.empty_weight_kg,
      m.loaded_weight_kg,
      m.net_weight_tons.toFixed(2),
      m.driver_comment || '',
      m.status === 'validated' ? 'Validée' : m.status === 'completed' ? 'Complétée' : 'Brouillon'
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `missions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = async () => {
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
          Rapport Comptable des Missions
        </div>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="font-size: 14px;">
            <span style="font-weight: bold; color: #548235;">Période :</span>
            ${filters.startDate ? new Date(filters.startDate).toLocaleDateString('fr-FR') : 'Toutes'} -
            ${filters.endDate ? new Date(filters.endDate).toLocaleDateString('fr-FR') : 'Toutes'}
          </div>
          <div style="font-size: 14px;">
            <span style="font-weight: bold; color: #548235;">Nombre de missions :</span> ${totalMissions}
          </div>
          <div style="font-size: 14px;">
            <span style="font-weight: bold; color: #548235;">Poids total :</span> ${totalWeight.toFixed(2)} T
          </div>
          <div style="font-size: 14px;">
            <span style="font-weight: bold; color: #548235;">Date du rapport :</span> ${new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px;">
          <thead>
            <tr>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">N° Cde</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Date</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Client</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Chauffeur</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Site collecte</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Site dépose</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Véhicule</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Matériau</th>
              <th style="background: #548235; color: white; padding: 10px 5px; text-align: left; font-weight: bold;">Poids (T)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMissions.map(m => `
              <tr>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.order_number || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${new Date(m.mission_date).toLocaleDateString('fr-FR')}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.client?.name || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.driver?.full_name || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.collection_site?.name || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.deposit_site?.name || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.vehicle?.license_plate || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.material_type?.name || '-'}</td>
                <td style="padding: 8px 5px; border-bottom: 1px solid #ddd;">${m.net_weight_tons.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f5f5f5; font-weight: bold; border-top: 2px solid #548235;">
              <td colspan="8" style="padding: 8px 5px; text-align: right; padding-right: 10px;">TOTAL</td>
              <td style="padding: 8px 5px;">${totalWeight.toFixed(2)} T</td>
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Comptabilité</h2>
          <p className="text-sm text-gray-600 mt-1">Filtrez et exportez les données des missions</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de début
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Client
              </label>
              <select
                value={filters.clientId}
                onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Chauffeur
              </label>
              <select
                value={filters.driverId}
                onChange={(e) => setFilters({ ...filters, driverId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les chauffeurs</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Véhicule
              </label>
              <select
                value={filters.vehicleId}
                onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les véhicules</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.license_plate}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Site de collecte
              </label>
              <select
                value={filters.collectionSiteId}
                onChange={(e) => setFilters({ ...filters, collectionSiteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les sites</option>
                {collectionSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Site de dépose
              </label>
              <select
                value={filters.depositSiteId}
                onChange={(e) => setFilters({ ...filters, depositSiteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les sites</option>
                {depositSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Matériau
              </label>
              <select
                value={filters.materialTypeId}
                onChange={(e) => setFilters({ ...filters, materialTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tous les matériaux</option>
                {materialTypes.map((material) => (
                  <option key={material.id} value={material.id}>{material.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Weight className="w-4 h-4" />
                Poids min (T)
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.minWeight}
                onChange={(e) => setFilters({ ...filters, minWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Weight className="w-4 h-4" />
                Poids max (T)
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.maxWeight}
                onChange={(e) => setFilters({ ...filters, maxWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="100.00"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      <div className="bg-green-50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Missions filtrées</p>
            <p className="text-3xl font-bold text-green-700">{totalMissions}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Poids total</p>
            <p className="text-3xl font-bold text-green-700">{totalWeight.toFixed(2)} T</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Poids moyen</p>
            <p className="text-3xl font-bold text-green-700">
              {totalMissions > 0 ? (totalWeight / totalMissions).toFixed(2) : '0.00'} T
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          Exporter en CSV
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <FileText className="w-5 h-5" />
          Exporter en PDF
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N° Commande</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chauffeur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Collecte</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dépose</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Véhicule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matériau</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Poids (T)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Aucune mission ne correspond aux filtres sélectionnés
                  </td>
                </tr>
              ) : (
                filteredMissions.map((mission) => (
                  <tr key={mission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {mission.order_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(mission.mission_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mission.client?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mission.driver?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mission.collection_site?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mission.deposit_site?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mission.vehicle?.license_plate || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{mission.material_type?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                      {mission.net_weight_tons.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredMissions.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-green-700">
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700 text-right">
                    {totalWeight.toFixed(2)} T
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
