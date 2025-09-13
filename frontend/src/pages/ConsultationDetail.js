import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { consultationAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { MessageCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const ConsultationDetail = () => {
  const { id } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { socket, joinConsultation } = useSocket();
  const { user } = useAuth();


  useEffect(() => {
    loadConsultation();
    joinConsultation(id);
  }, [id]);

  const loadConsultation = async () => {
    try {
      const response = await consultationAPI.getById(id);
      setConsultation(response.data.consultation);
      setMessages(response.data.consultation.messages);
    } catch (error) {
      console.error('Load consultation error:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await consultationAPI.sendMessage(id, { message });
      setMessage('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  if (!consultation) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="card p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">{consultation.title}</h1>
          <p className="text-gray-600 mb-4">{consultation.description}</p>
          <div className="flex space-x-4">
            <span className="badge-primary">{consultation.status}</span>
            <span className="badge-secondary">{consultation.cropType}</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="h-96 overflow-y-auto mb-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${msg.sender._id === user?._id ? 'bg-green-100 ml-12' : 'bg-gray-100 mr-12'}`}>
                <p className="text-sm font-medium mb-1">{msg.sender.name}</p>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>
          
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="form-input flex-1"
            />
            <button type="submit" className="btn-primary">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export default ConsultationDetail;
