import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  Flame, 
  Calendar, 
  Trophy, 
  Wallet, 
  Menu, 
  X,
  LogOut,
  Bell,
  Truck,
  UserCheck,
  Settings as SettingsIcon,
  ShieldAlert,
  BarChart3,
  HandCoins,
  Droplets
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useUiSettings } from './UiSettingsProvider';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const { labels } = useUiSettings();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: labels.dashboard || 'Dashboard', icon: LayoutDashboard, path: '/', perm: 'dashboard' },
    { name: labels.incidents || 'Emergencias', icon: ShieldAlert, path: '/incidents', perm: 'incidents' },
    { name: labels.fleet || 'Flota de Vehículos', icon: Truck, path: '/fleet', perm: 'fleet' },
    { name: labels.personnel || 'Personal Bomberos', icon: UserCheck, path: '/personnel', perm: 'personnel' },
    { name: labels.inventory || 'Depósito/Stock', icon: Boxes, path: '/inventory', perm: 'inventory' },
    { name: labels.staff || 'Guardias/Staff', icon: Users, path: '/staff', perm: 'staff' },
    { name: labels.agenda || 'Agenda Operativa', icon: Calendar, path: '/agenda', perm: 'agenda' },
    { name: labels.rentals || 'Alquiler Cancha', icon: Trophy, path: '/rentals', perm: 'rentals' },
    { name: labels.finances || 'Finanzas', icon: Wallet, path: '/finances', perm: 'finances' },
    { name: labels.subsidies || 'Subsidios', icon: HandCoins, path: '/subsidies', perm: 'subsidies' },
    { name: labels.reports || 'Reportes', icon: BarChart3, path: '/reports', perm: 'reports' },
    { name: labels.settings || 'Configuración', icon: SettingsIcon, path: '/settings', perm: 'settings' },
  ];

  const filteredNav = navItems.filter(item => 
    !item.perm || (profile?.permissions?.includes(item.perm as any))
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-red-100 selection:text-red-900">
      {/* TOP EMERGENCY BAR */}
      <div className="bg-red-700 text-white px-6 py-2.5 flex justify-between items-center shadow-lg z-[60] border-b border-red-800">
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-3 h-3 bg-red-400 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-2.5 h-2.5 bg-red-400 rounded-full"></div>
          </div>
          <span className="font-bold tracking-widest text-[10px] uppercase">OPERATIVIDAD: 100% — CUARTEL CHIMPAY</span>
          <span className="hidden sm:inline-block bg-red-900/40 px-2 py-0.5 rounded text-[9px] font-black border border-red-500/50 uppercase tracking-tighter">ESTACIÓN CENTRAL</span>
        </div>
        <div className="hidden lg:flex items-center space-x-6 text-[10px] font-bold uppercase tracking-widest opacity-80">
          <span className="flex items-center gap-2"><Bell className="w-3 h-3" /> Sin Alertas Pendientes</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800 sticky top-0 h-[calc(100vh-44px)]">
          <div className="p-6">
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-20 h-20 bg-white p-1 rounded-full shadow-2xl mb-3 ring-4 ring-red-600/20">
                <img 
                  src="https://files.aistudio.google.com/ais-dev-efig3ahtdr3uqmljqvdvfs-637731406593.us-east1.run.app/api/artifacts/attached_image_318df857_3840_4639_8673_093952fdfd88" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-white font-black tracking-tighter text-[11px] leading-tight uppercase">
                Cuartel Bomberos<br/>Voluntarios de Chimpay
              </h1>
            </div>
            
            <nav className="space-y-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-bold group",
                    location.pathname === item.path 
                      ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/5" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", location.pathname === item.path ? "text-red-500" : "text-slate-500")} />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black border border-white/5 ring-4 ring-slate-900 shadow-xl">
                {profile?.displayName?.[0] || 'B'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">{profile?.displayName}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{profile?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="text-slate-600 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img 
              src="https://files.aistudio.google.com/ais-dev-efig3ahtdr3uqmljqvdvfs-637731406593.us-east1.run.app/api/artifacts/attached_image_318df857_3840_4639_8673_093952fdfd88" 
              alt="Logo" 
              className="w-8 h-8 rounded-full bg-white p-0.5"
              referrerPolicy="no-referrer"
            />
            <span className="font-black uppercase tracking-tighter text-xs">CHIMPAY BOMBEROS</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-[92px] left-0 right-0 bg-slate-900 text-white z-40 border-t border-slate-800 p-4 shadow-2xl"
            >
              <nav className="space-y-1">
                {filteredNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg font-bold text-sm",
                      location.pathname === item.path ? "bg-red-600 text-white" : "text-slate-400"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-3 text-red-500 font-bold text-sm border-t border-slate-800 mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-100">
          <div className="max-w-7xl mx-auto space-y-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
