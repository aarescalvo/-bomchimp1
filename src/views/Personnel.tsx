import React, { useState, useEffect } from 'react';
import { Firefighter, TrainingRecord } from '../types';
import { apiFetch } from '../lib/api';
import { 
  UserCheck, 
  Plus, 
  Search, 
  GraduationCap, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  Droplets,
  Edit,
  Trash2,
  X,
  PlusCircle,
  Clock,
  History
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Personnel() {
  const [personnel, setPersonnel] = useState<Firefighter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFirefighter, setSelectedFirefighter] = useState<Firefighter | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    birthDate: '',
    rank: 'Bombero',
    bloodType: 'O+',
    phone: '',
    email: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active',
    licenseExpiration: '',
    eppStatus: 'good'
  });

  const loadPersonnel = async () => {
    try {
      const data = await apiFetch('/api/firefighters');
      setPersonnel(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && selectedFirefighter) {
        await apiFetch(`/api/firefighters/${selectedFirefighter.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/api/firefighters', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      resetForm();
      loadPersonnel();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dni: '',
      birthDate: '',
      rank: 'Bombero',
      bloodType: 'O+',
      phone: '',
      email: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      licenseExpiration: '',
      eppStatus: 'good'
    });
    setIsEditing(false);
    setSelectedFirefighter(null);
  };

  const handleEdit = (f: Firefighter) => {
    setFormData({
      firstName: f.firstName,
      lastName: f.lastName,
      dni: f.dni,
      birthDate: f.birthDate,
      rank: f.rank,
      bloodType: f.bloodType,
      phone: f.phone,
      email: f.email,
      joinDate: f.joinDate,
      status: f.status,
      licenseExpiration: f.licenseExpiration || '',
      eppStatus: f.eppStatus || 'good'
    });
    setSelectedFirefighter(f);
    setIsEditing(true);
    setShowModal(true);
  };

  const filtered = personnel.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dni.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-red-600" />
            Legajos de Personal
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Gestión integral del cuerpo activo de bomberos</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Alta Personal
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-red-600/10 placeholder:text-slate-400 text-sm outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre y Apellido</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango / DNI</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center font-black text-slate-900 text-xs uppercase">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Ingreso: {p.joinDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-0.5">{p.rank}</p>
                    <p className="text-xs font-bold text-slate-500 font-mono">{p.dni}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Phone className="w-3 h-3 text-emerald-500" /> {p.phone}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <Mail className="w-3 h-3" /> {p.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      p.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
                    )}>
                      {p.status === 'active' ? 'Activo' : 'Baja'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600 transition-all">
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-[.2em]">No se encontró personal</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Alta/Edicion */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {isEditing ? 'Editar Legajo' : 'Nuevo Alta de Personal'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Complete los datos obligatorios</p>
                  </div>
                  <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Apellido</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">DNI / Identificación</label>
                      <input 
                        type="text" 
                        required
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all font-mono"
                        value={formData.dni}
                        onChange={(e) => setFormData({...formData, dni: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rango / Jerarquía</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.rank}
                        onChange={(e) => setFormData({...formData, rank: e.target.value})}
                      >
                        <option value="Aspirante">Aspirante</option>
                        <option value="Bombero">Bombero</option>
                        <option value="Cabo">Cabo</option>
                        <option value="Cabo 1ro">Cabo 1ro</option>
                        <option value="Sargento">Sargento</option>
                        <option value="Sargento 1ro">Sargento 1ro</option>
                        <option value="Oficial Inspector">Oficial Inspector</option>
                        <option value="Comandante">Comandante</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Teléfono</label>
                      <input 
                        type="tel" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grupo Sanguíneo</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.bloodType}
                        onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div className="group space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                      <input 
                        type="date" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                      />
                    </div>
                    <div className="group space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vto. Licencia Conducir</label>
                      <input 
                        type="date" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all font-mono"
                        value={formData.licenseExpiration}
                        onChange={(e) => setFormData({...formData, licenseExpiration: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado de EPP (Nivel 1/2)</label>
                      <select 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.eppStatus}
                        onChange={(e) => setFormData({...formData, eppStatus: e.target.value as any})}
                      >
                        <option value="good">Estructural Nuevo/Bueno</option>
                        <option value="worn">Desgastado (Uso limitado)</option>
                        <option value="expired">Vencido / Fuera de Servicio</option>
                      </select>
                    </div>
                    <div className="group space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha de Alta</label>
                      <input 
                        type="date" 
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-red-600/5 focus:border-red-600 transition-all"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                  >
                    Descartar
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-700/20 hover:bg-red-600 transition-all active:scale-95"
                  >
                    Guardar Legajo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
