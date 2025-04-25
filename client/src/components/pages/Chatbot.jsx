// src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { SERVER_URL } from '../../Urls';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatbotRef = useRef(null);
  const token = localStorage.getItem("token");
  
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle click outside to close chat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && 
          chatbotRef.current && 
          !chatbotRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${SERVER_URL}/api/bot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Gemini');
      }

      const data = await response.json();
      
      // Add bot response to chat
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="chatbot-container" 
      ref={chatbotRef}
    >
      {/* Floating button */}
      <div 
        className="chatbot-toggle" 
        onClick={toggleChat}
      >
        {isOpen ? '✕' : '💬'}
      </div>

      {/* Chat window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>CMS Assistant</h3>
          </div>
          
          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="empty-chat">
                <p>How can I help with your CMS today?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="bot-message loading">
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        .chatbot-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          font-family: 'Arial', sans-serif;
        }
        
        .chatbot-toggle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #4285f4;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        
        .chatbot-toggle:hover {
          background-color: #3367d6;
          transform: scale(1.05);
        }
        
        .chatbot-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chatbot-header {
          padding: 15px;
          background-color: #4285f4;
          color: white;
        }
        
        .chatbot-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .chatbot-messages {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .empty-chat {
          display: flex;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: #757575;
          text-align: center;
        }
        
        .message {
          max-width: 80%;
          padding: 10px 15px;
          border-radius: 18px;
          line-height: 1.4;
          word-wrap: break-word;
        }
        
        .user-message {
          align-self: flex-end;
          background-color: #4285f4;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .bot-message {
          align-self: flex-start;
          background-color: #f1f3f4;
          color: #202124;
          border-bottom-left-radius: 4px;
        }
        
        .loading span {
          opacity: 0.5;
          animation: loadingDots 1.4s infinite;
        }
        
        .loading span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .loading span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes loadingDots {
          0%, 80%, 100% { opacity: 0.5; }
          40% { opacity: 1; }
        }
        
        .chatbot-input {
          display: flex;
          padding: 10px;
          background-color: #f1f3f4;
          border-top: 1px solid #e0e0e0;
        }
        
        .chatbot-input input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }
        
        .chatbot-input button {
          margin-left: 10px;
          padding: 0 15px;
          background-color: #4285f4;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .chatbot-input button:disabled {
          background-color: #9aa0a6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;