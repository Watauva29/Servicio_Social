import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';

export default function Login({ onLoginSuccess }) {
  const { login, register, forgotPassword, resetPassword, loading, error } = useApi();
  const [view, setView] = useState('login'); // login, register, forgot, reset

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [groupName, setGroupName] = useState('');
  const [token, setToken] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Perfiles predefinidos de prueba (solo para login)
  const presets = [
    { label: 'Administrador (Admin)', email: 'admin@school.edu', pass: 'admin123', role: 'Administrador' },
    { label: 'Docente (Profesor)', email: 'alejandro@school.edu', pass: 'docente123', role: 'Docente' },
    { label: 'Alumno (Grupo A)', email: 'uriel@school.edu', pass: 'alumno123', role: 'Alumno' }
  ];

  const clearMessages = () => {
    setLocalError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email || !password) return setLocalError('Por favor complete todos los campos.');

    try {
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!name || !email || !password || !role) return setLocalError('Complete los campos requeridos.');

    try {
      const payload = { name, email, password, role, group_name: role === 'student' ? groupName : null };
      const user = await register(payload);
      setSuccessMsg('Registro exitoso. Iniciando sesión...');
      setTimeout(() => onLoginSuccess(user), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email) return setLocalError('Ingrese su correo.');

    try {
      await forgotPassword(email);
      setSuccessMsg('Revisa tu consola del backend para ver el token simulado.');
      setTimeout(() => setView('reset'), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!token || !password) return setLocalError('Ingrese el token y la nueva contraseña.');

    try {
      await resetPassword(token, password);
      setSuccessMsg('Contraseña actualizada correctamente.');
      setTimeout(() => setView('login'), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPreset = (preset) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    clearMessages();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in w-full">
      <div className="max-w-md w-full space-y-6 bg-white/70 backdrop-blur-xl border border-slate-200/50 p-8 rounded-3xl shadow-xl shadow-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-500 via-indigo-500 to-amber-500" />
        
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {view === 'login' && 'Iniciar Sesión'}
            {view === 'register' && 'Crear Cuenta'}
            {view === 'forgot' && 'Recuperar Contraseña'}
            {view === 'reset' && 'Nueva Contraseña'}
          </h2>
        </div>

        {(localError || error) && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold animate-pulse">
            <span>{localError || error}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {view === 'login' && (
          <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Correo</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg">
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mt-4">
              <button type="button" onClick={() => { setView('forgot'); clearMessages(); }} className="hover:text-brand-600">¿Olvidaste tu contraseña?</button>
              <button type="button" onClick={() => { setView('register'); clearMessages(); }} className="hover:text-brand-600">Crear cuenta nueva</button>
            </div>
            
            <div className="pt-6 border-t border-slate-200 mt-6 space-y-2">
               <span className="block text-xs font-bold text-slate-400 uppercase text-center">Prueba Rápida</span>
               <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                 {presets.map((preset, idx) => (
                   <button key={idx} type="button" onClick={() => handleApplyPreset(preset)} className="text-left p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-600">{preset.label}</button>
                 ))}
               </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {view === 'register' && (
          <form className="mt-6 space-y-4" onSubmit={handleRegisterSubmit}>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Nombre Completo</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Correo</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Rol</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400">
                <option value="student">Alumno</option>
                <option value="teacher">Docente</option>
                <option value="assistant">Asistente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {role === 'student' && (
              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Grupo (Ej. Grupo A)</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
              </div>
            )}
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm shadow-lg">
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
            <div className="text-center mt-4 text-xs font-semibold text-slate-500">
              <button type="button" onClick={() => setView('login')} className="hover:text-brand-600">Volver al login</button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {view === 'forgot' && (
          <form className="mt-6 space-y-4" onSubmit={handleForgotSubmit}>
            <p className="text-sm text-slate-500 font-medium">Ingresa tu correo para recibir un token de recuperación.</p>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Correo</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm shadow-lg">
              {loading ? 'Solicitando...' : 'Recuperar Contraseña'}
            </button>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mt-4">
              <button type="button" onClick={() => setView('reset')} className="hover:text-brand-600">Ya tengo un token</button>
              <button type="button" onClick={() => setView('login')} className="hover:text-brand-600">Volver al login</button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {view === 'reset' && (
          <form className="mt-6 space-y-4" onSubmit={handleResetSubmit}>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Token de Recuperación</label>
              <input type="text" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Ej. 123e4567-..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5">Nueva Contraseña</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-lg">
              {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>
            <div className="text-center mt-4 text-xs font-semibold text-slate-500">
              <button type="button" onClick={() => setView('login')} className="hover:text-brand-600">Volver al login</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
