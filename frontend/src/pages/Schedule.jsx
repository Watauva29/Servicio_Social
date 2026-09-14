import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function Schedule({ currentUser }) {
  const { getSchedule, saveScheduleItem, deleteScheduleItem, loading, error } = useApi();
  
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Formulario de Clase Recurrente
  const [classTitle, setClassTitle] = useState('');
  const [classDay, setClassDay] = useState('Lunes');
  const [classStart, setClassStart] = useState('08:00');
  const [classEnd, setClassEnd] = useState('10:00');
  const [classLocation, setClassLocation] = useState('');

  // Formulario de Junta
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingStart, setMeetingStart] = useState('11:00');
  const [meetingEnd, setMeetingEnd] = useState('12:00');
  const [meetingLocation, setMeetingLocation] = useState('');

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const data = await getSchedule(currentUser.id);
      setScheduleItems(data);
    } catch (err) {
      console.error("Error al cargar horario:", err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    const payload = {
      title: classTitle,
      type: 'class',
      day_of_week: classDay,
      start_time: classStart,
      end_time: classEnd,
      location: classLocation || 'Aula por asignar'
    };

    try {
      await saveScheduleItem(payload);
      setSuccessMsg('¡Clase agregada con éxito!');
      setIsClassModalOpen(false);
      resetClassForm();
      fetchSchedule();
    } catch (err) {
      console.error("Error al crear clase:", err);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    const payload = {
      title: meetingTitle,
      type: 'meeting',
      date: meetingDate,
      start_time: meetingStart,
      end_time: meetingEnd,
      location: meetingLocation || 'Sala de Juntas'
    };

    try {
      await saveScheduleItem(payload);
      setSuccessMsg('¡Junta registrada con éxito!');
      setIsMeetingModalOpen(false);
      resetMeetingForm();
      fetchSchedule();
    } catch (err) {
      console.error("Error al crear junta:", err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento del horario?')) return;
    try {
      await deleteScheduleItem(itemId);
      setSuccessMsg('Elemento eliminado del horario.');
      fetchSchedule();
    } catch (err) {
      console.error("Error al eliminar elemento:", err);
    }
  };

  const resetClassForm = () => {
    setClassTitle('');
    setClassDay('Lunes');
    setClassStart('08:00');
    setClassEnd('10:00');
    setClassLocation('');
  };

  const resetMeetingForm = () => {
    setMeetingTitle('');
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setMeetingStart('11:00');
    setMeetingEnd('12:00');
    setMeetingLocation('');
  };

  const isTeacher = currentUser.role === 'teacher' || currentUser.role === 'assistant' || currentUser.role === 'admin';

  // Filtrar los elementos visibles:
  // Estudiantes solo ven las clases recurrentes, los profesores ven ambos (clases y juntas).
  const visibleItems = scheduleItems.filter(item => {
    if (!isTeacher && item.type === 'meeting') return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Horario y Actividades Semanales</h1>
          <p className="text-slate-500 mt-1">
            {isTeacher 
              ? 'Administra tus clases recurrentes y programa juntas o eventos extraordinarios.'
              : 'Consulta las materias y horarios correspondientes a tu ciclo académico.'}
          </p>
        </div>

        {isTeacher && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Registrar Clase
            </button>
            <button
              onClick={() => setIsMeetingModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar Junta
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Grilla Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {daysOfWeek.map((day) => {
          // Filtrar items correspondientes a este día de la semana (para clases)
          const dayClasses = visibleItems.filter(item => item.type === 'class' && item.day_of_week === day);
          
          // O si es docente, buscar juntas programadas que caigan en un día de la semana (por simplificación, mostramos las juntas en una sección separada abajo o si corresponden a días específicos, pero organizarlo por semana es fantástico).
          // Para que las juntas no se pierdan, las mostramos juntas abajo o agrupadas por fecha en una sección especial, lo cual queda super limpio.

          return (
            <div key={day} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col min-h-[250px] hover:shadow-md transition-shadow">
              <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                {day}
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                  {dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}
                </span>
              </h3>

              <div className="space-y-3 flex-grow">
                {dayClasses.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center py-8">
                    <p className="text-slate-300 text-xs italic">Sin clases</p>
                  </div>
                ) : (
                  dayClasses
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-brand-50/50 border border-brand-100 rounded-xl p-3.5 flex flex-col justify-between relative group/item hover:bg-brand-50 transition-colors"
                      >
                        {isTeacher && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            title="Eliminar de mi horario"
                            className="absolute top-2 right-2 p-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-md text-slate-400 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        <div>
                          <span className="block font-bold text-slate-800 text-sm leading-tight pr-4">{item.title}</span>
                          <span className="inline-block text-[10px] text-brand-700 bg-brand-50 font-bold px-1.5 py-0.5 rounded-md mt-1.5">
                            {item.start_time} - {item.end_time}
                          </span>
                        </div>
                        <span className="block text-[10px] text-slate-400 font-semibold mt-2.5 flex items-center gap-1">
                          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {item.location}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección Juntas (Solo visible para Docente) */}
      {isTeacher && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Próximas Juntas y Reuniones</h2>
              <p className="text-xs text-slate-400">Reuniones de academia, tutorías y compromisos de gestión educativa.</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
              {visibleItems.filter(item => item.type === 'meeting').length} Reuniones
            </span>
          </div>

          {visibleItems.filter(item => item.type === 'meeting').length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm italic">
              No tienes juntas registradas en tu calendario de trabajo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleItems
                .filter(item => item.type === 'meeting')
                .map((meeting) => (
                  <div 
                    key={meeting.id} 
                    className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex justify-between relative group/meeting"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full uppercase">
                          Junta
                        </span>
                        <span className="text-xs text-slate-400 font-bold">{meeting.date}</span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm leading-tight pr-6">{meeting.title}</h4>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold pt-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {meeting.start_time} - {meeting.end_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {meeting.location}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(meeting.id)}
                      title="Eliminar junta"
                      className="absolute top-4 right-4 p-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-md text-slate-400 opacity-0 group-hover/meeting:opacity-100 transition-opacity duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL REGISTRAR CLASE */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-950 text-lg">Registrar Clase Recurrente</h3>
              <button 
                onClick={() => setIsClassModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Nombre de la Clase</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Programación Web - Grupo A"
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Día de la Semana</label>
                <select
                  value={classDay}
                  onChange={(e) => setClassDay(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-semibold"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={classStart}
                    onChange={(e) => setClassStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={classEnd}
                    onChange={(e) => setClassEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Ubicación / Aula</label>
                <input
                  type="text"
                  placeholder="Ej. Aula 102, Virtual"
                  value={classLocation}
                  onChange={(e) => setClassLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Agregar Clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR JUNTA */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-slate-950 text-lg">Registrar Junta</h3>
              <button 
                onClick={() => setIsMeetingModalOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Título de la Junta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Reunión de Academia de Software"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Fecha</label>
                <input
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={meetingEnd}
                    onChange={(e) => setMeetingEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej. Sala de Profesores, Teams"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Registrar Junta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
