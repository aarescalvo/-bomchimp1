import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  Calendar, 
  Trophy, 
  Wallet, 
  Menu, 
  X,
  Bell,
  ClipboardList,
  Truck,
  UserCheck,
  Settings as SettingsIcon,
  ShieldAlert,
  BarChart3,
  HandCoins,
  Flame,
  ChevronLeft,
  ChevronRight,
  ShieldHalf,
  Activity,
  Landmark,
  UserCog,
  Notebook,
  Package,
  Car
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useUiSettings } from './UiSettingsProvider';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './layout/Header';

interface NavItem {
  name: string;
  icon: any;
  path: string;
  perm?: string;
  badge?: 'alertas' | 'guardia' | 'mantenimiento';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { identity } = useUiSettings();
  const { counts } = useNotifications();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const navGroups: NavGroup[] = [
    {
      label: 'GRUPO OPERATIVO',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/', perm: 'dashboard' },
        { name: 'Guardia', icon: Notebook, path: '/guardia', perm: 'guardia', badge: 'guardia' },
        { name: 'Despacho / Salidas', icon: Truck, path: '/salidas', perm: 'salidas' },
        { name: 'Incidentes', icon: ShieldAlert, path: '/incidents', perm: 'incidents' },
      ]
    },
    {
      label: 'GRUPO RECURSOS',
      items: [
        { name: 'Personal', icon: UserCheck, path: '/personnel', perm: 'personnel' },
        { name: 'Presentismo', icon: Activity, path: '/attendance', perm: 'attendance' },
        { name: 'Vehículos', icon: Car, path: '/fleet', perm: 'fleet', badge: 'mantenimiento' },
        { name: 'Inventario', icon: Package, path: '/inventory', perm: 'inventory' },
        { name: 'Agenda / Turnos', icon: Calendar, path: '/agenda', perm: 'agenda' },
      ]
    },
    {
      label: 'GRUPO ADMINISTRATIVO',
      items: [
        { name: 'Finanzas', icon: Wallet, path: '/finances', perm: 'finances' },
        { name: 'Cancha', icon: ShieldHalf, path: '/rentals', perm: 'cancha' },
        { name: 'Subsidies', icon: Landmark, path: '/subsidies', perm: 'subsidies' },
        { name: 'Alertas', icon: Bell, path: '/alerts', perm: 'alerts', badge: 'alertas' },
        { name: 'Reportes', icon: BarChart3, path: '/reports', perm: 'reports' },
      ]
    },
    {
      label: 'CONFIGURACIÓN',
      items: [
        { name: 'Usuarios', icon: UserCog, path: '/users', perm: 'admin' },
        { name: 'Ajustes', icon: SettingsIcon, path: '/settings', perm: 'settings' },
      ]
    }
  ];

  const filterItems = (group: NavGroup) => {
    return {
      ...group,
      items: group.items.filter(item => 
        !item.perm || (profile?.permissions?.includes(item.perm as any) || profile?.role === 'admin')
      )
    };
  };

  const filteredGroups = navGroups.map(filterItems).filter(g => g.items.length > 0);

  const getBadgeValue = (type?: string) => {
    if (!type) return 0;
    return (counts as any)[type] || 0;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Sidebar Header */}
      <div className={cn(
        "p-6 flex flex-col items-center border-b border-slate-800 transition-all",
        isCollapsed ? "p-4" : "p-6"
      )}>
        <div className={cn(
          "bg-white rounded-lg shadow-xl ring-2 ring-red-600/20 overflow-hidden transition-all duration-300",
          isCollapsed ? "w-10 h-10 p-1" : "w-20 h-20 p-2 mb-3"
        )}>
          {identity.logo ? (
            <img 
              src={identity.logo} 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-600 text-white">
              <ShieldHalf className={cn(isCollapsed ? "w-6 h-6" : "w-12 h-12")} />
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="text-center">
            <h1 className="text-white font-black tracking-tighter text-[11px] leading-tight uppercase">
              {identity.nombre}
            </h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
              {identity.ciudad}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="mb-6 last:mb-0">
            {!isCollapsed && (
              <p className="px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-3">
                {group.label}
              </p>
            )}
            <nav className="space-y-0.5 px-3">
              {group.items.map((item) => {
                const badgeCount = getBadgeValue(item.badge);
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-bold group relative",
                      isActive 
                        ? "bg-[var(--color-brand)] text-white shadow-lg shadow-red-900/20" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-red-400"
                    )} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                    
                    {badgeCount > 0 && (
                      <span className={cn(
                        "flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1",
                        item.badge === 'guardia' ? "bg-amber-500 text-white" : "bg-red-600 text-white",
                        isCollapsed ? "absolute top-1 right-1 border-2 border-slate-900" : "ml-auto"
                      )}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            {!isCollapsed && <div className="mx-6 mt-4 border-t border-slate-800/40" />}
          </div>
        ))}
      </div>

      {/* Sidebar Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="h-12 border-t border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-gray-950 flex font-sans selection:bg-red-100 dark:selection:bg-red-900/30 selection:text-red-900 transition-colors">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 sticky top-0 h-screen",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] md:hidden"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-72 bg-slate-900 z-[101] md:hidden shadow-2xl"
              >
                <div className="absolute top-4 right-4 text-slate-400">
                  <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
                </div>
                <div className="h-full overflow-y-auto">
                  <SidebarContent />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-gray-950 transition-colors">
          <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
