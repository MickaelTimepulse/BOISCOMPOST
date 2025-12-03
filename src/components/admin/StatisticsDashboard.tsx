import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, TrendingUp, Package, Users, Truck } from 'lucide-react';

export function StatisticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMissions: 0,
    totalWeight: 0,
    byMaterial: [] as any[],
    byClient: [] as any[],
    byDriver: [] as any[],
    byMonth: [] as any[]
  });

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);

    const { data: missions } = await supabase
      .from('missions')
      .select(`
        *,
        client:clients(name),
        driver:profiles(full_name),
        material_type:material_types(name)
      `)
      .eq('status', 'validated');

    if (missions) {
      const totalWeight = missions.reduce((sum, m) => sum + Number(m.net_weight_tons), 0);

      const byMaterial = Object.entries(
        missions.reduce((acc: any, m) => {
          const material = m.material_type?.name || 'Non spécifié';
          acc[material] = (acc[material] || 0) + Number(m.net_weight_tons);
          return acc;
        }, {})
      ).map(([name, weight]) => ({ name, weight }));

      const byClient = Object.entries(
        missions.reduce((acc: any, m) => {
          const client = m.client?.name || 'Non spécifié';
          acc[client] = (acc[client] || 0) + Number(m.net_weight_tons);
          return acc;
        }, {})
      ).map(([name, weight]) => ({ name, weight }));

      const byDriver = Object.entries(
        missions.reduce((acc: any, m) => {
          const driver = m.driver?.full_name || 'Non spécifié';
          if (!acc[driver]) {
            acc[driver] = { weight: 0, count: 0 };
          }
          acc[driver].weight += Number(m.net_weight_tons);
          acc[driver].count += 1;
          return acc;
        }, {})
      ).map(([name, data]: [string, any]) => ({ name, weight: data.weight, count: data.count }));

      setStats({
        totalMissions: missions.length,
        totalWeight,
        byMaterial,
        byClient,
        byDriver,
        byMonth: []
      });
    }

    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-green-700" /></div>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Statistiques</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-700 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Missions validées</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats.totalMissions}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-700 p-2 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Poids total collecté</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{stats.totalWeight.toFixed(2)} T</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-700 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Moyenne par mission</h3>
          </div>
          <p className="text-3xl font-bold text-amber-700">
            {stats.totalMissions > 0 ? (stats.totalWeight / stats.totalMissions).toFixed(2) : '0.00'} T
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Par type de matériau</h3>
          <div className="space-y-3">
            {stats.byMaterial.map((item: any, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-gray-900">{Number(item.weight).toFixed(2)} T</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-700 h-2 rounded-full"
                    style={{ width: `${(Number(item.weight) / stats.totalWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Par client</h3>
          <div className="space-y-3">
            {stats.byClient.slice(0, 5).map((item: any, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-semibold text-gray-900">{Number(item.weight).toFixed(2)} T</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-700 h-2 rounded-full"
                    style={{ width: `${(Number(item.weight) / stats.totalWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Par chauffeur</h3>
          <div className="space-y-3">
            {stats.byDriver.map((item: any, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.name}</span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{Number(item.weight).toFixed(2)} T</span>
                    <span className="text-xs text-gray-500 ml-2">({item.count} mission{item.count > 1 ? 's' : ''})</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-700 h-2 rounded-full"
                    style={{ width: `${(Number(item.weight) / stats.totalWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
