import React, { useState } from 'react';
import { useUiSettings } from './UiSettingsProvider';
import { 
  Palette, 
  Type, 
  Box, 
  Check, 
  Maximize, 
  Minimize,
  Type as FontIcon,
  MousePointer2,
  Layout
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const COLORS = [
  { name: 'Fuego Central', value: '#ef4444' }, // Red
  { name: 'Atlántico Técnico', value: '#0ea5e9' }, // Blue
  { name: 'Bosque Operativo', value: '#10b981' }, // Green
  { name: 'Noche Táctica', value: '#334155' }, // Slate
  { name: 'Aviso Alerta', value: '#f59e0b' }, // Amber
  { name: 'Violeta Especial', value: '#8b5cf6' }, // Violet
];

const RADIUSES = [
  { name: 'Sharp', value: '4px' },
  { name: 'Modern', value: '16px' },
  { name: 'Cuartel (Default)', value: '32px' },
  { name: 'Extra Round', value: '64px' },
];

export function UiCustomizer() {
  const { theme, labels, updateTheme, updateLabels } = useUiSettings();
  const [activeSubTab, setActiveSubTab] = useState<'visual' | 'labels' | 'layout'>('visual');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Sub-navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
           <button 
             onClick={() => setActiveSubTab('visual')}
             className={cn(
               "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeSubTab === 'visual' ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-400 hover:bg-slate-50"
             )}
           >
             <Palette className="w-4 h-4" /> Estilo Visual
           </button>
           <button 
             onClick={() => setActiveSubTab('labels')}
             className={cn(
               "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeSubTab === 'labels' ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-400 hover:bg-slate-50"
             )}
           >
             <Type className="w-4 h-4" /> Etiquetas Menú
           </button>
           <button 
             onClick={() => setActiveSubTab('layout')}
             className={cn(
               "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeSubTab === 'layout' ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-400 hover:bg-slate-50"
             )}
           >
             <Layout className="w-4 h-4" /> Distribución
           </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-10">
          
          {activeSubTab === 'visual' && (
            <div className="space-y-10">
               <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-500" /> Color Primario del Sistema
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {COLORS.map((c) => (
                       <button
                         key={c.value}
                         onClick={() => updateTheme({ primaryColor: c.value })}
                         className={cn(
                           "flex items-center gap-3 p-4 rounded-2xl border transition-all relative overflow-hidden group",
                           theme.primaryColor === c.value ? "border-slate-900 ring-2 ring-slate-900" : "border-slate-100 hover:border-slate-300"
                         )}
                       >
                         <div className="w-6 h-6 rounded-lg shadow-inner" style={{ backgroundColor: c.value }} />
                         <span className="text-[10px] font-black uppercase text-slate-600">{c.name}</span>
                         {theme.primaryColor === c.value && (
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-1 rounded-full">
                              <Check className="w-2.5 h-2.5 stroke-[4]" />
                           </div>
                         )}
                       </button>
                     ))}
                  </div>
               </section>

               <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-500" /> Redondeo de Ventanas y Botones
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {RADIUSES.map((r) => (
                       <button
                         key={r.value}
                         onClick={() => updateTheme({ borderRadius: r.value })}
                         className={cn(
                           "p-4 rounded-xl border transition-all text-center group",
                           theme.borderRadius === r.value ? "bg-slate-900 border-slate-900 text-white shadow-xl" : "bg-slate-50 border-transparent text-slate-400 grayscale hover:grayscale-0"
                         )}
                       >
                         <div className="w-10 h-10 mx-auto mb-2 border-2 border-current opacity-20 transition-all group-hover:opacity-60" style={{ borderRadius: r.value }} />
                         <span className="text-[9px] font-black uppercase tracking-widest block">{r.name}</span>
                       </button>
                     ))}
                  </div>
               </section>

               <section className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <FontIcon className="w-4 h-4 text-amber-500" /> Escala de Interfaz
                  </h3>
                  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <button onClick={() => updateTheme({ fontScale: Math.max(0.8, theme.fontScale - 0.1) })} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-all"><Minimize className="w-4 h-4 text-slate-400" /></button>
                     <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center relative">
                        <div className="absolute inset-y-0 left-0 bg-slate-900 transition-all rounded-full" style={{ width: `${(theme.fontScale - 0.8) / (1.5 - 0.8) * 100}%` }} />
                        <span className="relative z-10 text-[10px] font-black text-slate-900 bg-white/80 px-2 rounded-full border border-slate-200 shadow-sm">
                          {Math.round(theme.fontScale * 100)}%
                        </span>
                     </div>
                     <button onClick={() => updateTheme({ fontScale: Math.min(1.5, theme.fontScale + 0.1) })} className="p-3 bg-white rounded-xl shadow-sm hover:scale-110 transition-all"><Maximize className="w-4 h-4 text-slate-400" /></button>
                  </div>
               </section>
            </div>
          )}

          {activeSubTab === 'labels' && (
            <div className="space-y-6">
               <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-amber-200 shrink-0">
                    <MousePointer2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Renombrado Táctico</p>
                    <p className="text-xs font-medium text-amber-800 leading-relaxed opacity-80">
                      Personaliza los nombres de los módulos que aparecen en el menú lateral para adaptarlos a la jerga de tu cuartel.
                    </p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
                  {Object.entries(labels).map(([key, value]) => (
                    <div key={key} className="space-y-1 group">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-[.2em] ml-1 group-focus-within:text-slate-900 transition-colors">
                         {key}
                       </label>
                       <input 
                         type="text"
                         value={value}
                         onChange={(e) => updateLabels({ [key]: e.target.value })}
                         className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:bg-white focus:border-slate-900 transition-all"
                       />
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeSubTab === 'layout' && (
             <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-dashed border-slate-300">
                   <MousePointer2 className="w-10 h-10 text-slate-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Drag & Drop Builder</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed mt-2">
                    Próximamente: Podrá arrastrar los widgets del dashboard para crear su propio centro de control personalizado.
                  </p>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
