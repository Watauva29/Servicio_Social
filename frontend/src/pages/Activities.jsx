import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';

export default function Activities({ periodId, currentUser, onBack }) {
  const { submitTask, getActivities, getStudentActivities, loading, error } = useApi();

  // Estado para actividades cargadas del backend
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  // Estado para controlar el modal de subida de tareas
  const [activeUploadActivity, setActiveUploadActivity] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const isStudent = currentUser?.role === 'student';

  // Cargar actividades del backend
  useEffect(() => {
    let mounted = true;
    setLoadingActivities(true);

    const fetchPromise = isStudent && currentUser?.id
      ? getStudentActivities(currentUser.id, periodId)
      : getActivities(periodId);

    fetchPromise
      .then((data) => {
        if (mounted) setActivities(data || []);
      })
      .catch((err) => {
        console.error("Error cargando actividades:", err);
        if (mounted) setActivities([]);
      })
      .finally(() => {
        if (mounted) setLoadingActivities(false);
      });
    return () => { mounted = false; };
  }, [periodId, isStudent, currentUser?.id, getActivities, getStudentActivities]);

  const handleOpenUploadModal = (activity) => {
    setActiveUploadActivity(activity);
    setSelectedFile(null);
    setSuccessMsg('');
    setIsDragging(false);
  };

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else if (file) {
      alert('Solo se permiten archivos PDF.');
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleClickDropZone = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadTask = async (e) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!selectedFile) {
      alert('Selecciona un archivo PDF primero.');
      return;
    }

    const fileName = selectedFile.name;
    const payload = {
      student_id: currentUser.id,
      activity_id: activeUploadActivity.id,
      file_path: `uploads/${fileName}`
    };

    try {
      const data = await submitTask(payload);
      setSuccessMsg('¡Archivo de evidencia enviado con éxito al servidor!');
      
      setActivities(prev => prev.map(a => 
        a.id === activeUploadActivity.id 
          ? { ...a, status: 'submitted', submissions_count: (a.submissions_count || 0) + 1 }
          : a
      ));

      setTimeout(() => {
        setActiveUploadActivity(null);
        setSuccessMsg('');
        setSelectedFile(null);
      }, 2000);
    } catch (err) {
      console.error("Error al subir tarea:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Actividades del Periodo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Entregas académicas y evidencias requeridas</p>
        </div>
      </div>

      {/* Loading */}
      {loadingActivities ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-semibold">Cargando actividades...</span>
          </div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">No se encontraron actividades para este periodo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((activity) => {
            const submitted = activity.status === 'submitted' || activity.status === 'graded';
            return (
              <div key={activity.id} className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-base leading-snug pr-4">{activity.title}</h3>
                    <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[11px] font-bold rounded-md whitespace-nowrap">
                      {activity.max_score} pts
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{activity.description}</p>
                  
                  {activity.due_date && (
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      📅 Entrega: {new Date(activity.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}

                  <div className="flex items-center mt-4 pt-3 border-t border-slate-100 justify-between">
                    <span className="text-xs text-slate-400 font-semibold">
                      {activity.submissions_count} entrega{activity.submissions_count !== 1 ? 's' : ''}
                    </span>
                    {isStudent ? (
                      submitted ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Enviado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenUploadModal(activity)}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold rounded-lg text-xs transition-all"
                        >
                          Subir Evidencia
                        </button>
                      )
                    ) : (
                      <>
                        <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-lg text-xs transition-all">
                          Ver Entregas
                        </button>
                        <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-all">
                          Calificar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE SUBIDA DE TAREAS */}
      {activeUploadActivity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-950 text-lg">Subir Evidencia Académica</h3>
              <button 
                onClick={() => { setActiveUploadActivity(null); setSelectedFile(null); }}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUploadTask} className="p-6 space-y-4">
              {successMsg ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2 shadow-sm text-sm">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold">{successMsg}</span>
                </div>
              ) : (
                <>
                  {/* Actividad info */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <p className="text-xs uppercase text-slate-400 font-bold mb-0.5">Actividad</p>
                    <p className="text-sm font-semibold text-slate-800">{activeUploadActivity.title}</p>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleInputChange}
                    className="hidden"
                    id="file-upload-input"
                  />

                  {/* Drop zone / File preview */}
                  {!selectedFile ? (
                    <div
                      onClick={handleClickDropZone}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                        isDragging
                          ? 'border-brand-500 bg-brand-50/50 scale-[1.02]'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400'
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                        isDragging ? 'bg-brand-100 text-brand-600' : 'bg-brand-50 text-brand-600'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 text-sm">
                          {isDragging ? '¡Suelta tu archivo aquí!' : 'Arrastra tu archivo PDF aquí'}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold mt-1 block">
                          o <span className="text-brand-600 underline underline-offset-2">haz clic para seleccionar</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-300 font-medium">Formato aceptado: PDF</span>
                    </div>
                  ) : (
                    /* Selected file preview */
                    <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors flex-shrink-0"
                        title="Quitar archivo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                      <span>Error: {error}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setActiveUploadActivity(null); setSelectedFile(null); }}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !selectedFile}
                      className={`py-2.5 px-5 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 ${
                        selectedFile
                          ? 'bg-brand-600 hover:bg-brand-700 text-white active:scale-[0.98]'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enviando...
                        </>
                      ) : 'Enviar Entrega'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
