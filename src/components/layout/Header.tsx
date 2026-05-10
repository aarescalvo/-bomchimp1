import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { useUiSettings } from '../UiSettingsProvider';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Key,
  ShieldHalf
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, logout } = useAuth();
  const { darkMode, setDarkMode } = useUiSettings();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    const map: Record<string, string> = {
      '/': 'Dashboard',
      '/guardia': 'Libreta de Guardia',
      '/incidents': 'Emergencias',
      '/fleet': 'Vehículos',
      '/personnel': 'Personal',
      '/inventory': 'Inventario',
      '/alerts': 'Alertas',
      '/rentals': 'Alquiler Cancha',
      '/finances': 'Tesorería',
      '/subsidies': 'Subsidios',
      '/reports': 'Reportes',
      '/settings': 'Ajustes',
      '/users': 'Usuarios'
    };
    return map[path] || 'Bomberos Chimpay';
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Global Search Placeholder */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 group focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-widest cursor-default">Buscar...</span>
        </div>

        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={darkMode ? "Modo Claro" : "Modo Oscuro"}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group"
          >
            <div className="hidden md:block text-right">
              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200 leading-none">{profile?.displayName}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{profile?.role}</p>
            </div>
            <div className={cn(
               "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md",
               profile?.role === 'admin' ? "bg-red-600" : "bg-blue-600"
            )}>
              {profile?.displayName?.[0] || 'B'}
            </div>
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-20 py-1 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 md:hidden text-center">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{profile?.displayName}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{profile?.role}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <User className="w-4 h-4" /> Mi Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Key className="w-4 h-4" /> Cambiar Contraseña
                    </button>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
