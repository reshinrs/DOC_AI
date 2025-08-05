import React, { useState, useRef, useEffect } from 'react';
import styles from './Chatbot.module.css';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import chatService from '../services/chatService';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! How can I help you with the MAS Document Processor today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(input);
      const aiMessage = { sender: 'ai', text: response.data.reply };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = { sender: 'ai', text: 'Sorry, I am having trouble connecting. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatWidget}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.chatHeader}>
            <h3>AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}><FaTimes /></button>
          </div>
          <div className={styles.messageContainer}>
            {messages.map((msg, index) => (
              <div key={index} className={`${styles.message} ${styles[msg.sender]}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className={`${styles.message} ${styles.ai}`}>Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className={styles.chatInputForm}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" className="btn" disabled={isLoading}>
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={styles.chatButton}>
        <FaComments />
      </button>
    </div>
  );
};

export default Chatbot;