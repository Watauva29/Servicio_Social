import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function AdminSettings() {
  const { getSettings, updateSetting, loading } = useApi();
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      const settingsMap = {};
      data.forEach(s => settingsMap[s.key] = s.value);
      setSettings(settingsMap);
    } catch (err) {}
  };

  const handleToggle = async (key, currentValue) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    try {
      await updateSetting(key, newValue, 'Configuración del sistema');
      setSettings(prev => ({ ...prev, [key]: newValue }));
    } catch (err) {}
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuración Global</h1>
        <p className="text-slate-500 mt-1">Ajustes y permisos de la plataforma (solo Administrador).</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Permisos del Sistema</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Habilitar Chat / Mensajería</h4>
              <p className="text-xs text-slate-500 mt-1">Permite a los usuarios enviarse mensajes directos dentro de la plataforma.</p>
            </div>
            <button 
              onClick={() => handleToggle('chat_enabled', settings.chat_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.chat_enabled === 'true' ? 'bg-brand-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.chat_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="h-px bg-slate-100" />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Registro de Alumnos</h4>
              <p className="text-xs text-slate-500 mt-1">Si se desactiva, solo los administradores podrán crear cuentas nuevas.</p>
            </div>
            <button 
              onClick={() => handleToggle('student_registration', settings.student_registration)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.student_registration === 'true' ? 'bg-brand-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.student_registration === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="h-px bg-slate-100" />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Modo Mantenimiento</h4>
              <p className="text-xs text-slate-500 mt-1">Bloquea el acceso a todos los usuarios excepto administradores.</p>
            </div>
            <button 
              onClick={() => handleToggle('maintenance_mode', settings.maintenance_mode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode === 'true' ? 'bg-rose-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
