import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function UsersList() {
  const { getUsers, updateUser, deleteUser, loading, error } = useApi();
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    }
  };

  const handleUpdateUser = async (id, role, groupName) => {
    try {
      await updateUser(id, role, groupName || null);
      fetchUsers();
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) {
        console.error("Error al eliminar usuario:", err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Administración de Usuarios</h1>
        <p className="text-slate-500 mt-1">Auditoría, control de roles y grupos asignados en la plataforma.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold text-sm">Error al cargar usuarios: {error}</span>
        </div>
      )}

      {/* Listado */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Usuarios Registrados</h2>
          <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-md font-semibold uppercase">
            {usersList.length} Cuentas Activas
          </span>
        </div>

        {loading && usersList.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3" />
            <p className="text-slate-500 text-sm">Obteniendo base de usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Correo Electrónico</th>
                  <th className="px-6 py-4">Grupo Asignado</th>
                  <th className="px-6 py-4">Rol de Usuario</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        usr.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                        usr.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        usr.role === 'assistant' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {usr.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      {usr.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{usr.email}</td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        defaultValue={usr.group_name || ''} 
                        onBlur={(e) => handleUpdateUser(usr.id, usr.role, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-2 py-1 w-24 focus:outline-none focus:border-brand-500"
                        placeholder="N/A"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        defaultValue={usr.role}
                        onChange={(e) => handleUpdateUser(usr.id, e.target.value, usr.group_name)}
                        className={`text-xs font-bold uppercase rounded-md px-2 py-1 border focus:outline-none ${
                          usr.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          usr.role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          usr.role === 'assistant' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <option value="admin">Administrador</option>
                        <option value="teacher">Docente</option>
                        <option value="assistant">Asistente</option>
                        <option value="student">Alumno</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteUser(usr.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="Eliminar Usuario">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
