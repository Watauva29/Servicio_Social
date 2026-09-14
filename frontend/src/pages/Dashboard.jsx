import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';

export default function Dashboard({ currentUser }) {
  const { startPortfolioGeneration, checkPortfolioStatus, downloadPortfolio, getStudentActivities, uploadPhoto, getPeriods, getTeacherStats, getRecentSubmissions, gradeSubmission } = useApi();
  const [selectedStudent, setSelectedStudent] = useState(
    currentUser?.role === 'student' ? currentUser.id.toString() : '4'
  );
  const [useMock, setUseMock] = useState(true);

  // Portfolio async state
  const [portfolioState, setPortfolioState] = useState('idle');
  const [portfolioTaskId, setPortfolioTaskId] = useState(null);
  const [portfolioError, setPortfolioError] = useState(null);
  const pollingRef = useRef(null);

  // Period state for portfolio
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Student activities state
  const [studentActivities, setStudentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const isStudent = currentUser?.role === 'student';

  // Load periods
  useEffect(() => {
    getPeriods()
      .then(data => setPeriods(data || []))
      .catch(() => setPeriods([]));
  }, [getPeriods]);

  // Load student activities when student view
  useEffect(() => {
    if (isStudent && currentUser?.id) {
      setLoadingActivities(true);
      getStudentActivities(currentUser.id)
        .then(data => setStudentActivities(data || []))
        .catch(() => setStudentActivities([]))
        .finally(() => setLoadingActivities(false));
    }
  }, [isStudent, currentUser?.id, getStudentActivities]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Reset portfolio state when student selection changes
  useEffect(() => {
    setPortfolioState('idle');
    setPortfolioTaskId(null);
    setPortfolioError(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [selectedStudent]);

  const handleStartGeneration = async () => {
    setPortfolioState('generating');
    setPortfolioError(null);
    try {
      const periodId = selectedPeriod !== 'all' ? selectedPeriod : null;
      const result = await startPortfolioGeneration(selectedStudent, useMock, periodId);
      const taskId = result.task_id;
      setPortfolioTaskId(taskId);
      pollingRef.current = setInterval(async () => {
        try {
          const status = await checkPortfolioStatus(taskId);
          if (status.status === 'ready') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setPortfolioState('ready');
          } else if (status.status === 'error') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setPortfolioState('error');
            setPortfolioError(status.error || 'Error desconocido en la generación.');
          }
        } catch {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setPortfolioState('error');
          setPortfolioError('Error de conexión al verificar el estado.');
        }
      }, 1500);
    } catch (err) {
      setPortfolioState('error');
      setPortfolioError(err.response?.data?.detail || 'No se pudo iniciar la generación.');
    }
  };

  const handleDownload = async () => {
    if (!portfolioTaskId) return;
    setPortfolioState('downloading');
    try {
      await downloadPortfolio(portfolioTaskId, selectedStudent);
      setPortfolioState('idle');
      setPortfolioTaskId(null);
    } catch {
      setPortfolioState('error');
      setPortfolioError('Error al descargar el archivo PDF.');
    }
  };

  // Load teacher stats
  const [teacherStatsData, setTeacherStatsData] = useState(null);
  useEffect(() => {
    if (!isStudent) {
      getTeacherStats()
        .then(data => setTeacherStatsData(data))
        .catch(() => {});
    }
  }, [isStudent, getTeacherStats]);

  // ---- Stats ----
  const pendingCount = studentActivities.filter(a => a.status === 'pending').length;
  const submittedCount = studentActivities.filter(a => a.status === 'submitted').length;
  const gradedCount = studentActivities.filter(a => a.status === 'graded').length;
  const avgScore = gradedCount > 0
    ? (studentActivities.filter(a => a.status === 'graded').reduce((s, a) => s + (a.score || 0), 0) / gradedCount).toFixed(1)
    : '-';

  const teacherStats = [
    { name: 'Competencias / Periodos', value: String(teacherStatsData?.periods_count || 0), change: 'Activos', changeType: 'info' },
    { name: 'Actividades Creadas', value: String(teacherStatsData?.activities_count || 0), change: 'En curso', changeType: 'info' },
    { name: 'Entregas en Plataforma', value: String(teacherStatsData?.submissions_count || 0), change: 'Total', changeType: 'warning' },
    { name: 'Promedio General', value: teacherStatsData ? `${teacherStatsData.avg_score}/10` : '-', change: 'Histórico', changeType: 'increase' },
  ];

  const studentStats = [
    { name: 'Pendientes', value: String(pendingCount), change: pendingCount > 0 ? '¡Por entregar!' : 'Al día', changeType: pendingCount > 0 ? 'warning' : 'increase' },
    { name: 'Enviadas', value: String(submittedCount), change: 'En revisión', changeType: 'info' },
    { name: 'Calificadas', value: String(gradedCount), change: `de ${studentActivities.length}`, changeType: 'increase' },
    { name: 'Promedio', value: avgScore === '-' ? '-' : `${avgScore}/10`, change: gradedCount > 0 ? `${gradedCount} evaluaciones` : 'Sin evaluar', changeType: 'increase' },
  ];

  const stats = isStudent ? studentStats : teacherStats;

  const [recentSubmissions, setRecentSubmissions] = useState([]);
  useEffect(() => {
    if (!isStudent) {
      getRecentSubmissions()
        .then(data => setRecentSubmissions(data))
        .catch(() => {});
    }
  }, [isStudent, getRecentSubmissions]);

  // ---- Helpers ----
  const getDaysLeft = (dueDateStr) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr + 'T23:59:59');
    const now = new Date();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyBadge = (daysLeft) => {
    if (daysLeft === null) return { text: 'Sin fecha', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (daysLeft < 0) return { text: `Venció hace ${Math.abs(daysLeft)}d`, cls: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
    if (daysLeft === 0) return { text: '¡Hoy!', cls: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
    if (daysLeft <= 2) return { text: `${daysLeft} día${daysLeft > 1 ? 's' : ''}`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (daysLeft <= 7) return { text: `${daysLeft} días`, cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    return { text: `${daysLeft} días`, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  };

  const getStatusIcon = (status) => {
    if (status === 'graded') return (
      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
    if (status === 'submitted') return (
      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4.5 h-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
    return (
      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-4.5 h-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      </div>
    );
  };

  // Portfolio button renderer (same as before)
  const renderPortfolioButton = () => {
    switch (portfolioState) {
      case 'generating':
        return (
          <button disabled className="w-full py-3 px-4 bg-brand-500/70 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2.5 cursor-not-allowed shadow-lg shadow-brand-500/20">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generando portafolio...
          </button>
        );
      case 'ready':
        return (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl">
              <div className="relative flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <span className="block text-sm font-bold text-emerald-300">¡Portafolio listo!</span>
                <span className="block text-[11px] text-emerald-400/80 font-medium">El PDF ha sido generado exitosamente.</span>
              </div>
            </div>
            <button onClick={handleDownload} className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Descargar Portafolio PDF
            </button>
          </div>
        );
      case 'downloading':
        return (
          <button disabled className="w-full py-3 px-4 bg-emerald-500/70 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2.5 cursor-not-allowed">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Descargando...
          </button>
        );
      default:
        return (
          <button onClick={handleStartGeneration} className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Generar Portafolio PDF
          </button>
        );
    }
  };

  // ---- Student Activities Panel ----
  const renderStudentActivitiesPanel = () => {
    if (loadingActivities) {
      return (
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl shadow-sm p-12 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="animate-spin h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-sm font-medium">Cargando actividades...</span>
          </div>
        </div>
      );
    }

    const pending = studentActivities.filter(a => a.status === 'pending');
    const completed = studentActivities.filter(a => a.status !== 'pending');

    return (
      <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Mis Actividades</h2>
            {pending.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                {pending.length} pendiente{pending.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-md font-medium">
            {studentActivities.length} total
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {/* Pending Activities (priority) */}
          {pending.length > 0 && (
            <>
              <div className="px-6 py-2.5 bg-amber-50/50 sticky top-0 z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700/70">Pendientes por entregar</span>
              </div>
              {pending.map(activity => {
                const daysLeft = getDaysLeft(activity.due_date);
                const urgency = getUrgencyBadge(daysLeft);
                return (
                  <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                    {getStatusIcon('pending')}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{activity.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-medium">{activity.period_name}</span>
                        <span>·</span>
                        <span>Nota máx: {activity.max_score}</span>
                        {activity.due_date && (
                          <>
                            <span>·</span>
                            <span>Entrega: {new Date(activity.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${urgency.cls} flex-shrink-0`}>
                      {urgency.text}
                    </span>
                  </div>
                );
              })}
            </>
          )}

          {/* Submitted / Graded Activities */}
          {completed.length > 0 && (
            <>
              <div className="px-6 py-2.5 bg-slate-50/50 sticky top-0 z-10">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enviadas y calificadas</span>
              </div>
              {completed.map(activity => (
                <div key={activity.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/30 transition-colors">
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-700 truncate">{activity.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-medium">{activity.period_name}</span>
                      {activity.score !== null && activity.score !== undefined && (
                        <>
                          <span>·</span>
                          <span className="font-bold text-emerald-600">{activity.score.toFixed(1)} / {activity.max_score}</span>
                        </>
                      )}
                      {activity.submitted_at && (
                        <>
                          <span>·</span>
                          <span>Enviado: {new Date(activity.submitted_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        </>
                      )}
                    </div>
                    {activity.feedback && (
                      <p className="text-xs text-slate-500 mt-1 italic truncate">"{activity.feedback}"</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${
                    activity.status === 'graded' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {activity.status === 'graded' ? 'Calificado' : 'En revisión'}
                  </span>
                </div>
              ))}
            </>
          )}

          {studentActivities.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-slate-400">No se encontraron actividades asignadas.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- Teacher Submissions Panel ----
  const handleGrade = async (id, newScore) => {
    try {
      await gradeSubmission(id, newScore, "Calificado desde Dashboard");
      // refresh
      getRecentSubmissions().then(setRecentSubmissions).catch(()=>{});
      getTeacherStats().then(setTeacherStatsData).catch(()=>{});
    } catch (err) {
      console.error(err);
    }
  };

  const renderTeacherSubmissionsPanel = () => (
    <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Entregas Recientes</h2>
        <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-md font-medium">Actualizado hace un momento</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th className="px-6 py-4">Estudiante</th>
              <th className="px-6 py-4">Actividad</th>
              <th className="px-6 py-4">Calificación</th>
              <th className="px-6 py-4 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {recentSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{sub.student_name}</td>
                <td className="px-6 py-4 text-slate-600">{sub.activity_title}</td>
                <td className="px-6 py-4 font-semibold text-slate-700">
                  {sub.status === 'Pendiente' ? (
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        min="0" max="10" step="0.1"
                        id={`score-${sub.id}`}
                        className="w-16 border border-slate-200 rounded px-2 py-1 text-xs"
                        placeholder="0-10"
                      />
                      <button 
                        onClick={() => {
                          const val = document.getElementById(`score-${sub.id}`).value;
                          if (val !== "") handleGrade(sub.id, parseFloat(val));
                        }}
                        className="bg-brand-500 text-white text-[10px] px-2 py-1 rounded hover:bg-brand-600"
                      >
                        Evaluar
                      </button>
                    </div>
                  ) : (
                    `${sub.score.toFixed(1)} / 10`
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    sub.status === 'Calificado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {sub.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const updatedUser = await uploadPhoto(currentUser.id, file);
      // Reload page or update user context (simplest MVP: reload to refresh context)
      window.location.reload();
    } catch (err) {
      alert('Error al subir la imagen');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer">
          {currentUser?.photo_url ? (
            <img src={`http://localhost:8000${currentUser.photo_url}`} alt="Avatar" className="w-20 h-20 rounded-full object-cover shadow-md border-4 border-white" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold shadow-md border-4 border-white">
              {currentUser?.name?.charAt(0)}
            </div>
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </label>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isStudent ? `Hola, ${currentUser?.name?.split(' ')[0]} 👋` : 'Panel de Control General'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isStudent
              ? 'Consulta tus actividades pendientes, entregas y calificaciones.'
              : 'Monitoreo de competencias académicas, calificaciones y evidencias documentales.'}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-6 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            <p className="text-sm font-medium text-slate-500">{stat.name}</p>
            <div className="flex items-baseline mt-4 justify-between">
              <span className="text-3xl font-semibold text-slate-900">{stat.value}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                stat.changeType === 'increase' ? 'bg-emerald-50 text-emerald-700' :
                stat.changeType === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left panel: Student Activities or Teacher Submissions */}
        {isStudent ? renderStudentActivitiesPanel() : renderTeacherSubmissionsPanel()}

        {/* Right panel: Portfolio */}
        <div className="bg-gradient-to-tr from-slate-900 to-brand-950 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between border border-slate-800">
          <div>
            <h2 className="text-xl font-bold">Portafolio de Evidencias</h2>
            <p className="text-slate-300 text-sm mt-2">
              Consolida automáticamente todas las entregas obligatorias en formato PDF de un alumno en un único archivo integrado.
            </p>

            <div className="mt-6 space-y-4">
              {isStudent ? (
                <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl mb-3">
                  <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">Mi Expediente</label>
                  <span className="text-sm font-bold text-white">{currentUser.name}</span>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="block text-xs uppercase text-slate-400 font-semibold mb-1 font-medium">Estudiante de Prueba</label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer font-semibold"
                  >
                    <option value="4">Uriel Hernández (ID: 4)</option>
                    <option value="5">María Domínguez (ID: 5)</option>
                    <option value="6">Alejandro Ruiz (ID: 6)</option>
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1 font-medium">Unidad Temática</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer font-semibold"
                >
                  <option value="all">Todas las Unidades (Portafolio Final)</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Mock simulation */}
              <div className="flex items-center justify-between bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">Simular PDFs (Mock)</span>
                  <span className="text-[10px] text-slate-400">Genera páginas en blanco si no existen archivos</span>
                </div>
                <input
                  type="checkbox"
                  checked={useMock}
                  onChange={(e) => setUseMock(e.target.checked)}
                  className="h-4 w-4 text-brand-500 focus:ring-brand-400 border-slate-700 rounded bg-slate-800 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {portfolioError && (
              <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span><strong>Error:</strong> {portfolioError}</span>
              </div>
            )}
            {renderPortfolioButton()}
          </div>
        </div>
      </div>
    </div>
  );
}
