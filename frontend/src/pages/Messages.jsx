import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

export default function Messages({ currentUser }) {
  const { getInbox, getConversation, sendMessage, loading } = useApi();
  const [inbox, setInbox] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (currentUser?.id) {
      loadInbox();
    }
  }, [currentUser]);

  const loadInbox = async () => {
    try {
      const data = await getInbox(currentUser.id);
      setInbox(data);
    } catch (err) {}
  };

  const loadConversation = async (contact) => {
    setActiveContact(contact);
    try {
      const data = await getConversation(currentUser.id, contact.contact_id);
      setConversation(data);
    } catch (err) {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeContact) return;

    try {
      await sendMessage(activeContact.contact_id, messageText, currentUser.id);
      setMessageText('');
      loadConversation(activeContact);
      loadInbox();
    } catch (err) {}
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
      
      {/* Sidebar */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-4 border-b border-slate-100 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inbox.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-400 text-sm">
              No tienes mensajes recientes.
            </div>
          )}
          {inbox.map((chat) => (
            <button
              key={chat.contact_id}
              onClick={() => loadConversation(chat)}
              className={`w-full text-left p-4 border-b border-slate-100 flex items-center gap-3 transition-colors ${
                activeContact?.contact_id === chat.contact_id ? 'bg-brand-50 border-brand-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 flex-shrink-0">
                {chat.contact_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{chat.contact_name}</h3>
                </div>
                <p className={`text-xs truncate ${chat.unread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                  {chat.last_message}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeContact ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
              <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-600">
                {activeContact.contact_name[0]}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{activeContact.contact_name}</h3>
                <span className="text-xs text-slate-500 capitalize">{activeContact.contact_role}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {conversation.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                      isMine 
                        ? 'bg-brand-500 text-white rounded-br-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                    }`}>
                      {msg.content}
                      <span className={`block text-[10px] mt-1 ${isMine ? 'text-brand-200 text-right' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || loading}
                className="bg-brand-500 hover:bg-brand-600 text-white p-2.5 rounded-xl disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Selecciona una conversación para empezar a chatear</p>
          </div>
        )}
      </div>
    </div>
  );
}
