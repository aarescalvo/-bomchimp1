import React, { useState, useEffect } from 'react';
import { AgendaTask } from '../types';
import { Plus, CheckCircle2, Circle, Clock, Tag, X, MoreHorizontal } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';
import { apiFetch } from '../lib/api';

export default function Agenda() {
  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: ''
  });

  const loadTasks = async () => {
    try {
      const data = await apiFetch('/api/agenda');
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/agenda', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString()
        })
      });
      setShowModal(false);
      setFormData({ title: '', description: '', dueDate: '', priority: 'medium', assignedTo: '' });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (task: AgendaTask) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await apiFetch(`/api/agenda/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda de Operaciones</h1>
          <p className="text-slate-500">Mantenimiento, inspecciones y tareas administrativas.</p>
        </div>
        {profile?.role !== 'firefighter' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarea
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Pending Tasks Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Tareas Próximas
          </h2>
          <div className="space-y-3">
            {tasks.filter(t => t.status !== 'completed').map(task => (
              <div key={task.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-all group">
                <button onClick={() => toggleStatus(task)} className="mt-1 transition-transform active:scale-110">
                  <Circle className="w-7 h-7 text-slate-200 group-hover:text-blue-200 transition-colors" />
                </button>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{task.title}</h3>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 cursor-pointer" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {task.dueDate ? formatDate(task.dueDate) : '...'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      <Tag className="w-4 h-4 text-slate-400" />
                      Asignado: <span className="text-slate-600">{task.assignedTo || 'General'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'completed').length === 0 && (
              <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No hay tareas pendientes en la agenda.</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Tasks Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Completadas Recientemente
          </h2>
          <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100">
            {tasks.filter(t => t.status === 'completed').slice(0, 5).map(task => (
              <div key={task.id} className="flex items-start gap-3 opacity-60">
                <button onClick={() => toggleStatus(task)} className="mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 line-through truncate">{task.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{task.assignedTo}</p>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status === 'completed').length === 0 && (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4 tracking-widest">Nada por aquí aún</p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Programar Tarea</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="text-slate-400 w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título de la Tarea</label>
                <input 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:ring-4 ring-blue-500/10 outline-none transition-all" 
                  placeholder="Ej: Inspección de Bombas"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                <textarea 
                  rows={3} 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-600 focus:ring-4 ring-blue-500/10 outline-none transition-all resize-none" 
                  placeholder="Detallar los pasos a seguir..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rango de Alerta</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-sm focus:ring-4 ring-blue-500/10 outline-none" 
                    value={formData.priority} 
                    onChange={e => setFormData({...formData, priority: e.target.value as any})}
                  >
                    <option value="low">Prioridad Baja</option>
                    <option value="medium">Prioridad Media</option>
                    <option value="high">Prioridad Alta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asignar a</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 font-bold text-sm focus:ring-4 ring-blue-500/10 outline-none" 
                    placeholder="Nombre o Rol"
                    value={formData.assignedTo} 
                    onChange={e => setFormData({...formData, assignedTo: e.target.value})} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora de Ejecución</label>
                <input 
                  type="datetime-local" 
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-900 focus:ring-4 ring-blue-500/10 outline-none transition-all" 
                  value={formData.dueDate} 
                  onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-4 rounded-[1.5rem] font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                PROXIMAR TAREA
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
