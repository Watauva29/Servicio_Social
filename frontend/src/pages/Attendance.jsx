import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function Attendance({ currentUser }) {
  const { getStudents, saveAttendance, getAttendanceSessions, getAttendanceDetail, loading, error } = useApi();
  
  // Estados para pasar asistencia
  const [students, setStudents] = useState([]);
  const [groupName, setGroupName] = useState('Grupo A - Programación Web');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'presente' | 'falta' | ... }
  const [viewMode, setViewMode] = useState('take'); // 'take' o 'history'
  
  // Estados para historial
  const [sessions, setSessions] = useState([]);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const groups = [
    'Grupo A - Programación Web',
    'Grupo B - Algoritmos y Datos',
    'Grupo C - Sistemas Distribuidos'
  ];

  // Cargar estudiantes e historial al montar el componente
  useEffect(() => {
    fetchStudents();
    fetchHistory();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
      // Inicializar todos los alumnos como 'presente' por defecto
      const initialRecords = {};
      data.forEach(student => {
        initialRecords[student.id] = 'presente';
      });
      setAttendanceRecords(initialRecords);
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await getAttendanceSessions();
      setSessions(data);
    } catch (err) {
      console.error("Error al cargar el historial:", err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    
    // Preparar el payload
    const recordsPayload = Object.keys(attendanceRecords).map(studentId => ({
      student_id: parseInt(studentId),
      status: attendanceRecords[studentId]
    }));

    const payload = {
      group_name: groupName,
      date: selectedDate,
      records: recordsPayload
    };

    try {
      await saveAttendance(payload);
      setSuccessMsg('¡Asistencia registrada exitosamente!');
      fetchHistory(); // Actualizar historial
      // Regresar al inicio del formulario tras un retraso corto
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err) {
      console.error("Error al guardar asistencia:", err);
    }
  };

  const handleViewDetails = async (sessionId) => {
    try {
      const detail = await getAttendanceDetail(sessionId);
      setSelectedSessionDetail(detail);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error("Error al cargar detalles de la sesión:", err);
    }
  };

  // Contar estadísticas rápidas de una sesión para el historial
  const getRecordCounts = (records) => {
    const counts = { presente: 0, falta: 0, retardo: 0, justificado: 0 };
    records?.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pase de Asistencia</h1>
          <p className="text-slate-500 mt-1">Control diario y bitácora de asistencia de los estudiantes.</p>
        </div>
        
        {/* Toggle de vistas */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => { setViewMode('take'); setSuccessMsg(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'take'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tomar Asistencia
          </button>
          <button
            onClick={() => { setViewMode('history'); setSuccessMsg(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'history'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ver Historial
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2 shadow-sm animate-bounce">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold text-sm">Error: {error}</span>
        </div>
      )}

      {/* VISTA 1: TOMAR ASISTENCIA */}
      {viewMode === 'take' && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSaveAttendance} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selección del Grupo */}
              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">Grupo o Clase</label>
                <select
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all font-medium"
                >
                  {groups.map((group, idx) => (
                    <option key={idx} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              {/* Selección de la Fecha */}
              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-2">Fecha de Clase</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Listado de Alumnos */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Alumnos Inscritos</h3>
                <span className="text-xs text-slate-400 font-semibold uppercase">{students.length} Estudiantes</span>
              </div>

              {loading && students.length === 0 ? (
                <div className="text-center py-12">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3" />
                  <p className="text-slate-500 text-sm">Cargando lista de alumnos...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-400">No se encontraron estudiantes en la base de datos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden bg-slate-50/30">
                  {students.map((student) => (
                    <div 
                      key={student.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white hover:bg-slate-50/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center font-bold text-brand-700 text-sm">
                          {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-900 text-sm">{student.name}</span>
                          <span className="text-xs text-slate-400">{student.email}</span>
                        </div>
                      </div>

                      {/* Selector de Asistencia */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center border border-slate-200/40">
                        {['presente', 'falta', 'retardo', 'justificado'].map((status) => {
                          const label = status === 'presente' ? 'P' : status === 'falta' ? 'F' : status === 'retardo' ? 'R' : 'J';
                          const tooltip = status.charAt(0).toUpperCase() + status.slice(1);
                          const active = attendanceRecords[student.id] === status;
                          
                          let activeClass = '';
                          if (active) {
                            if (status === 'presente') activeClass = 'bg-emerald-500 text-white shadow-sm';
                            else if (status === 'falta') activeClass = 'bg-rose-500 text-white shadow-sm';
                            else if (status === 'retardo') activeClass = 'bg-amber-500 text-white shadow-sm';
                            else if (status === 'justificado') activeClass = 'bg-blue-500 text-white shadow-sm';
                          } else {
                            activeClass = 'text-slate-500 hover:bg-white hover:text-slate-800';
                          }

                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatusChange(student.id, status)}
                              title={tooltip}
                              className={`h-9 w-9 text-xs font-bold rounded-lg transition-all flex items-center justify-center`}
                            >
                              <span className={`w-full h-full flex items-center justify-center rounded-lg ${activeClass}`}>
                                {label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guardar */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || students.length === 0}
                className={`py-3 px-6 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-md shadow-brand-500/10 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Guardando...' : 'Registrar Asistencia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA 2: HISTORIAL DE ASISTENCIAS */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
              <p className="text-slate-500">No se han registrado sesiones de asistencia aún.</p>
              <button 
                onClick={() => setViewMode('take')} 
                className="mt-4 px-4 py-2 bg-brand-50 text-brand-700 font-semibold rounded-xl hover:bg-brand-100 transition-colors text-sm"
              >
                Tomar primera asistencia
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase">ID: {session.id}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {session.date}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-2">
                      {session.group_name}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold">
                      Profesor ID: {session.teacher_id}
                    </span>
                    <button
                      onClick={() => handleViewDetails(session.id)}
                      className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-xs transition-colors"
                    >
                      Ver Detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE DETALLE DE ASISTENCIA */}
      {isDetailModalOpen && selectedSessionDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
            {/* Cabecera */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Detalles de Asistencia</span>
                <h3 className="font-extrabold text-slate-900 text-lg">{selectedSessionDetail.group_name}</h3>
                <span className="text-xs text-brand-600 font-semibold">{selectedSessionDetail.date}</span>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Listado */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 px-6">
              {selectedSessionDetail.records?.map((record) => (
                <div key={record.id} className="flex justify-between items-center py-3.5">
                  <div>
                    <span className="font-semibold text-slate-800 text-sm block">{record.student_name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">ID de Alumno: {record.student_id}</span>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                    record.status === 'presente' ? 'bg-emerald-50 text-emerald-700' :
                    record.status === 'falta' ? 'bg-rose-50 text-rose-700' :
                    record.status === 'retardo' ? 'bg-amber-50 text-amber-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
