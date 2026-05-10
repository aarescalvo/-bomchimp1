import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { UiSettingsProvider } from './components/UiSettingsProvider';
import { AppLayout } from './components/AppLayout';
import { Flame, LogIn } from 'lucide-react';
import { Toaster } from 'sonner';
import Home from './views/Home';
import Incidents from './views/Incidents';
import Inventory from './views/Inventory';
import Guardia from './views/Guardia';
import Agenda from './views/Agenda';
import Rentals from './views/Rentals';
import Finances from './views/Finances';
import Fleet from './views/Fleet';
import Personnel from './views/Personnel';
import Settings from './views/Settings';
import Reports from './views/Reports';
import Subsidies from './views/Subsidies';
import Alerts from './views/Alerts';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-white p-1 rounded-full animate-pulse">
            <img 
              src="https://files.aistudio.google.com/ais-dev-efig3ahtdr3uqmljqvdvfs-637731406593.us-east1.run.app/api/artifacts/attached_image_318df857_3840_4639_8673_093952fdfd88" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
        </div>
        <p className="text-white font-black uppercase text-[10px] tracking-[.3em] animate-pulse">Sistema Chimpay Activo</p>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return <AppLayout>{children}</AppLayout>;
}

function Login() {
  const { login, user } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [mustChangePassword, setMustChangePassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState('');
  const [userId, setUserId] = React.useState('');
  
  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      const res: any = await login(username, password);
      if (res?.mustChangePassword) {
        setMustChangePassword(true);
        setUserId(res.userId);
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForcedChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/change-password-forced', {
        method: 'POST',
        body: JSON.stringify({ userId, newPassword })
      });
      alert('Contraseña actualizada. Inicie sesión nuevamente.');
      setMustChangePassword(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-[32px] shadow-2xl space-y-8">
          <div className="text-center">
             <h2 className="text-2xl font-black text-slate-900 uppercase">Cambio Obligatorio</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Debe actualizar su clave para continuar</p>
          </div>
          <form onSubmit={handleForcedChange} className="space-y-6">
             <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Clave</label>
                <input 
                   type="password" 
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold outline-none focus:border-red-600"
                   placeholder="Mínimo 6 caracteres"
                   required
                />
             </div>
             <button type="submit" className="w-full h-14 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px]">Actualizar y Reingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 font-sans">
      <div className="hidden lg:block relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=2070&auto=format&fit=crop" 
          alt="Firefighter"
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <div className="flex flex-col gap-6 mb-6">
            <div className="w-32 h-32 bg-white p-2 rounded-full shadow-2xl">
                <img 
                  src="https://files.aistudio.google.com/ais-dev-efig3ahtdr3uqmljqvdvfs-637731406593.us-east1.run.app/api/artifacts/attached_image_318df857_3840_4639_8673_093952fdfd88" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-tight italic">
              Cuartel Bomberos<br/>Voluntarios de Chimpay
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-lg leading-relaxed font-medium uppercase tracking-tight text-sm opacity-80 italic">
            Sistema de Comando Central y Gestión Operativa Integral v2.0
          </p>
        </div>
      </div>
      <div className="bg-slate-50 flex items-center justify-center p-8 border-l border-slate-800/20">
        <div className="w-full max-w-sm space-y-12">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
               <div className="w-24 h-24 bg-white p-2 rounded-full shadow-2xl border-4 border-red-600/10">
                <img 
                  src="https://files.aistudio.google.com/ais-dev-efig3ahtdr3uqmljqvdvfs-637731406593.us-east1.run.app/api/artifacts/attached_image_318df857_3840_4639_8673_093952fdfd88" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
               </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight italic">Acceso Operativo</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[.3em]">Ingrese sus credenciales de guardia</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest leading-relaxed">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificador de Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                placeholder="EJ: JSMITH"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Clave de Acceso</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all placeholder:text-slate-300"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 py-5 bg-red-700 text-white rounded-xl font-black uppercase tracking-[.3em] text-[10px] shadow-2xl shadow-red-700/20 hover:bg-red-600 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingIn ? 'Autenticando...' : 'Entrar al Comando'}
            </button>
          </form>

          <div className="pt-10 border-t border-slate-200 text-center">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[.4em]">
              SISTEMA BOOT v2.0 © 2026 — CHIMPAY RN
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <UiSettingsProvider>
      <AuthProvider>
        <Toaster position="bottom-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/incidents" element={<PrivateRoute><Incidents /></PrivateRoute>} />
            <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
            <Route path="/guardia" element={<PrivateRoute><Guardia /></PrivateRoute>} />
            <Route path="/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
            <Route path="/rentals" element={<PrivateRoute><Rentals /></PrivateRoute>} />
            <Route path="/finances" element={<PrivateRoute><Finances /></PrivateRoute>} />
            <Route path="/fleet" element={<PrivateRoute><Fleet /></PrivateRoute>} />
            <Route path="/personnel" element={<PrivateRoute><Personnel /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
            <Route path="/subsidies" element={<PrivateRoute><Subsidies /></PrivateRoute>} />
            <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </UiSettingsProvider>
  );
}

