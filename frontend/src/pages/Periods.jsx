import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function Periods({ onSelectPeriod, currentUser }) {
  const { getPeriods, loading, error } = useApi();
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    let mounted = true;
    const studentId = currentUser?.role === 'student' ? currentUser.id : null;
    
    getPeriods(studentId)
      .then((data) => {
        if (mounted) setPeriods(data || []);
      })
      .catch((err) => {
        console.error("Error al cargar competencias:", err);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser, getPeriods]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    try {
      // Usar T00:00:00 para evitar desfases de zona horaria local
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Competencias Académicas</h1>
          <p className="text-slate-500 mt-1">Gestión y visualización de periodos académicos para la evaluación formativa.</p>
        </div>
        {currentUser?.role !== 'student' && (
          <button className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Competencia
          </button>
        )}
      </div>

      {/* Loading & Error States */}
      {loading && periods.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-semibold">Cargando competencias...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm font-medium">
          Error al cargar competencias: {error}
        </div>
      ) : periods.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/60 rounded-2xl">
          <p className="text-sm text-slate-400">No se encontraron competencias registradas en el sistema.</p>
        </div>
      ) : (
        /* Grid de Competencias */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {periods.map((period) => (
            <div key={period.id} className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative group">
              {/* Cabecera del Periodo */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    period.status === 'Completado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    period.status === 'En curso' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {period.status}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">ID: {period.id}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors mb-2">
                  {period.name}
                </h3>
                
                <p className="text-sm text-slate-500 line-clamp-3 mb-6">
                  {period.description}
                </p>
              </div>

              {/* Progreso y Fechas */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {/* Fechas */}
                <div className="flex justify-between text-xs text-slate-400">
                  <div>
                    <span className="block font-semibold uppercase text-[10px] text-slate-400/80">Inicio</span>
                    <span className="font-semibold text-slate-600">{formatDate(period.start_date)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-semibold uppercase text-[10px] text-slate-400/80">Cierre</span>
                    <span className="font-semibold text-slate-600">{formatDate(period.end_date)}</span>
                  </div>
                </div>

                {/* Barra de Progreso (solo mostrada o calculada para el alumno, pero visible para todos) */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 text-slate-600">
                    <span>Progreso de Actividades</span>
                    <span>{period.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        period.status === 'Completado' ? 'bg-emerald-500' :
                        period.status === 'En curso' ? 'bg-brand-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${period.progress}%` }}
                    />
                  </div>
                </div>

                {/* Acciones */}
                <button 
                  onClick={() => onSelectPeriod(period.id)}
                  className="w-full mt-2 py-2.5 px-4 border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 text-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  Ver {period.activities_count} Actividades
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
