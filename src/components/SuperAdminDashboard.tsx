import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  MapPin,
  Truck,
  Package,
  FileText,
  BarChart3,
  LogOut,
  Settings,
  Calculator
} from 'lucide-react';
import { ClientsManager } from './admin/ClientsManager';
import { DriversManager } from './admin/DriversManager';
import { MaterialTypesManager } from './admin/MaterialTypesManager';
import { VehiclesManager } from './admin/VehiclesManager';
import { SitesManager } from './admin/SitesManager';
import { MissionsManager } from './admin/MissionsManager';
import { StatisticsDashboard } from './admin/StatisticsDashboard';
import { AccountSettings } from './admin/AccountSettings';
import { MissionRequestsManager } from './admin/MissionRequestsManager';
import { AccountingDashboard } from './admin/AccountingDashboard';

type TabType = 'clients' | 'drivers' | 'materials' | 'vehicles' | 'sites' | 'missions' | 'requests' | 'statistics' | 'accounting' | 'account';

export function SuperAdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [missionRequestToConvert, setMissionRequestToConvert] = useState<string | null>(null);
  const [showMissionForm, setShowMissionForm] = useState(false);

  const tabs = [
    { id: 'requests' as TabType, label: 'Demandes', icon: Truck, color: '#ea580c' },
    { id: 'missions' as TabType, label: 'Missions', icon: FileText, color: '#2563eb' },
    { id: 'clients' as TabType, label: 'Clients', icon: Users, color: '#16a34a' },
    { id: 'drivers' as TabType, label: 'Chauffeurs', icon: Users, color: '#0d9488' },
    { id: 'materials' as TabType, label: 'Matériaux', icon: Package, color: '#d97706' },
    { id: 'vehicles' as TabType, label: 'Véhicules', icon: Truck, color: '#0891b2' },
    { id: 'sites' as TabType, label: 'Sites', icon: MapPin, color: '#059669' },
    { id: 'statistics' as TabType, label: 'Stats', icon: BarChart3, color: '#db2777' },
    { id: 'accounting' as TabType, label: 'Compta', icon: Calculator, color: '#dc2626' },
    { id: 'account' as TabType, label: 'Compte', icon: Settings, color: '#4b5563' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-green-700">BOISCOMPOST</h1>
              <div className="h-8 w-px bg-gray-300"></div>
              <p className="text-sm text-gray-600">Administration</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-gray-600">{profile?.email}</p>
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex space-x-1.5 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  backgroundColor: isActive ? tab.color : 'white',
                  color: isActive ? 'white' : tab.color,
                  borderColor: tab.color,
                  borderWidth: '2px',
                  borderStyle: 'solid'
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all hover:shadow-md"
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = tab.color;
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = tab.color;
                  }
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'requests' && (
            <MissionRequestsManager
              onConvertToMission={(requestId) => {
                setMissionRequestToConvert(requestId);
                setActiveTab('missions');
              }}
            />
          )}
          {activeTab === 'clients' && <ClientsManager />}
          {activeTab === 'drivers' && <DriversManager />}
          {activeTab === 'materials' && <MaterialTypesManager />}
          {activeTab === 'vehicles' && <VehiclesManager />}
          {activeTab === 'sites' && <SitesManager />}
          {activeTab === 'missions' && (
            <MissionsManager
              missionRequestId={missionRequestToConvert}
              onRequestProcessed={() => setMissionRequestToConvert(null)}
            />
          )}
          {activeTab === 'statistics' && <StatisticsDashboard />}
          {activeTab === 'accounting' && <AccountingDashboard />}
          {activeTab === 'account' && <AccountSettings />}
        </div>
      </div>
    </div>
  );
}
