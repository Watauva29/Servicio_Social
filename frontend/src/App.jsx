import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Periods from './pages/Periods';
import Activities from './pages/Activities';
import Attendance from './pages/Attendance';
import Schedule from './pages/Schedule';
import Login from './pages/Login';
import UsersList from './pages/UsersList';
import Messages from './pages/Messages';
import AdminSettings from './pages/AdminSettings';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null); // Inicia deslogueado
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriodId, setSelectedPeriodId] = useState(null);

  // Navegación rápida a actividades desde Periodos
  const handleSelectPeriod = (id) => {
    setSelectedPeriodId(id);
    setActiveTab('activities');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedPeriodId(null);
  };

  // Renderizar contenido basado en la sesión activa y pestañas de roles
  const renderContent = () => {
    if (!currentUser) {
      return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
      case 'periods':
        return <Periods onSelectPeriod={handleSelectPeriod} currentUser={currentUser} />;
      case 'activities':
        return (
          <Activities 
            periodId={selectedPeriodId || 1} 
            currentUser={currentUser}
            onBack={() => {
              setActiveTab('periods');
              setSelectedPeriodId(null);
            }} 
          />
        );
      case 'attendance':
        // Asistencia solo visible para admin, teacher, assistant
        if (currentUser.role === 'student') return <Dashboard currentUser={currentUser} />;
        return <Attendance currentUser={currentUser} />;
      case 'schedule':
        return <Schedule currentUser={currentUser} />;
      case 'users':
        if (currentUser.role !== 'admin') return <Dashboard currentUser={currentUser} />;
        return <UsersList />;
      case 'settings':
        if (currentUser.role !== 'admin') return <Dashboard currentUser={currentUser} />;
        return <AdminSettings />;
      case 'messages':
        return <Messages currentUser={currentUser} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  // Si no está logueado, renderizamos el flujo de login directamente sin el header del sistema
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans justify-center">
        <main className="flex-grow flex items-center justify-center">
          {renderContent()}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      {/* Barra de Navegación Premium */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-brand-600 text-white p-2 rounded-xl shadow-md shadow-brand-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">Competence<span className="text-brand-600">Port</span></span>
            </div>

            {/* Menu */}
            <nav className="flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveTab('periods');
                  setSelectedPeriodId(null);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'periods' || activeTab === 'activities'
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Competencias
              </button>
              {currentUser.role !== 'student' && (
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'attendance'
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Asistencia
                </button>
              )}
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Horario
              </button>
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'users'
                        ? 'bg-brand-50 text-brand-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Usuarios
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeTab === 'settings'
                        ? 'bg-brand-50 text-brand-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Ajustes
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'messages'
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Mensajes
              </button>
            </nav>

            {/* Perfil Usuario con Botón de Salida */}
            <div className="flex items-center gap-3">
              {currentUser?.photo_url && (
                <img src={`http://localhost:8000${currentUser.photo_url}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-slate-200" />
              )}
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-800">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {currentUser.role === 'admin' ? 'Administrador' :
                   currentUser.role === 'teacher' ? 'Docente' :
                   currentUser.role === 'assistant' ? 'Asistente' :
                   `Alumno (${currentUser.group_name})`}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="h-10 w-10 rounded-full border-2 flex items-center justify-center font-bold transition-all shadow-sm bg-slate-100 hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Área de Contenido Principal */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/50 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} CompetencePort. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
