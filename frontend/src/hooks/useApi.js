import { useState, useCallback } from 'react';
import api from '../utils/axios';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const request = useCallback(async (config) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api(config);
      setData(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error en la petición';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Portfolio (async background generation) ----

  const startPortfolioGeneration = useCallback((studentId, mock = false, periodId = null) => {
    let url = `/portfolio/generate/${studentId}?mock=${mock}`;
    if (periodId) {
      url += `&period_id=${periodId}`;
    }
    return request({ url, method: 'POST' });
  }, [request]);

  const checkPortfolioStatus = useCallback(async (taskId) => {
    const response = await api.get(`/portfolio/status/${taskId}`);
    return response.data; // { task_id, status: "pending"|"ready"|"error", error }
  }, []);

  const downloadPortfolio = useCallback(async (taskId, studentId) => {
    const response = await api.get(`/portfolio/download/${taskId}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Portafolio_Evidencias_Estudiante_${studentId}.pdf`);
    document.body.appendChild(link);
    link.click();

    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  }, []);

  // ---- Other endpoints ----

  const getStudents = useCallback(() => {
    return request({ url: '/attendance/students', method: 'GET' });
  }, [request]);

  const saveAttendance = useCallback((payload) => {
    return request({ url: '/attendance/session', method: 'POST', data: payload });
  }, [request]);

  const getAttendanceSessions = useCallback(() => {
    return request({ url: '/attendance/sessions', method: 'GET' });
  }, [request]);

  const getAttendanceDetail = useCallback((sessionId) => {
    return request({ url: `/attendance/session/${sessionId}`, method: 'GET' });
  }, [request]);

  const getSchedule = useCallback((currentUserId) => {
    const url = currentUserId ? `/schedule?current_user_id=${currentUserId}` : '/schedule';
    return request({ url, method: 'GET' });
  }, [request]);

  const saveScheduleItem = useCallback((payload) => {
    return request({ url: '/schedule', method: 'POST', data: payload });
  }, [request]);

  const deleteScheduleItem = useCallback((itemId) => {
    return request({ url: `/schedule/${itemId}`, method: 'DELETE' });
  }, [request]);

  const login = useCallback((email, password) => {
    return request({ url: '/auth/login', method: 'POST', data: { email, password } });
  }, [request]);

  const register = useCallback((payload) => {
    return request({ url: '/auth/register', method: 'POST', data: payload });
  }, [request]);

  const forgotPassword = useCallback((email) => {
    return request({ url: '/auth/forgot-password', method: 'POST', data: { email } });
  }, [request]);

  const resetPassword = useCallback((token, new_password) => {
    return request({ url: '/auth/reset-password', method: 'POST', data: { token, new_password } });
  }, [request]);

  const uploadPhoto = useCallback((userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request({
      url: `/users/${userId}/photo`,
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }, [request]);

  const getUsers = useCallback(() => {
    return request({ url: '/users', method: 'GET' });
  }, [request]);

  const submitTask = useCallback((payload) => {
    return request({ url: '/submissions', method: 'POST', data: payload });
  }, [request]);

  const getActivities = useCallback((periodId) => {
    const url = periodId ? `/activities?period_id=${periodId}` : '/activities';
    return request({ url, method: 'GET' });
  }, [request]);

  const getStudentActivities = useCallback((studentId, periodId) => {
    const url = periodId
      ? `/activities/student/${studentId}?period_id=${periodId}`
      : `/activities/student/${studentId}`;
    return request({ url, method: 'GET' });
  }, [request]);

  const getPeriods = useCallback((studentId) => {
    const url = studentId ? `/periods?student_id=${studentId}` : '/periods';
    return request({ url, method: 'GET' });
  }, [request]);

  const getRecentSubmissions = useCallback(() => {
    return request({ url: '/submissions/recent', method: 'GET' });
  }, [request]);

  // ---- Sprint 7 Missing Functions ----
  
  const updateUser = useCallback((id, payload) => {
    return request({ url: `/users/${id}`, method: 'PUT', data: payload });
  }, [request]);

  const deleteUser = useCallback((id) => {
    return request({ url: `/users/${id}`, method: 'DELETE' });
  }, [request]);

  const gradeSubmission = useCallback((id, score, feedback) => {
    return request({ url: `/submissions/${id}/grade`, method: 'PUT', data: { score, feedback } });
  }, [request]);

  const getTeacherStats = useCallback(() => {
    return request({ url: '/activities/teacher-stats', method: 'GET' });
  }, [request]);

  const getSettings = useCallback(() => {
    return request({ url: '/settings', method: 'GET' });
  }, [request]);

  const updateSetting = useCallback((key, value, description) => {
    return request({ url: '/settings', method: 'PUT', data: { key, value, description } });
  }, [request]);

  const getInbox = useCallback((userId) => {
    return request({ url: `/messages/inbox/${userId}`, method: 'GET' });
  }, [request]);

  const getConversation = useCallback((userId1, userId2) => {
    return request({ url: `/messages/conversation/${userId1}/${userId2}`, method: 'GET' });
  }, [request]);

  const sendMessage = useCallback((receiverId, content, senderId) => {
    return request({ url: '/messages', method: 'POST', data: { receiver_id: receiverId, content, sender_id: senderId } });
  }, [request]);

  return {
    loading,
    error,
    data,
    request,
    startPortfolioGeneration,
    checkPortfolioStatus,
    downloadPortfolio,
    getStudents,
    saveAttendance,
    getAttendanceSessions,
    getAttendanceDetail,
    getSchedule,
    saveScheduleItem,
    deleteScheduleItem,
    login,
    register,
    forgotPassword,
    resetPassword,
    uploadPhoto,
    getUsers,
    updateUser,
    deleteUser,
    submitTask,
    gradeSubmission,
    getRecentSubmissions,
    getActivities,
    getStudentActivities,
    getTeacherStats,
    getPeriods,
    getSettings,
    updateSetting,
    getInbox,
    getConversation,
    sendMessage
  };
}
