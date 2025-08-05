import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import documentService from '../services/documentService';
import toast from 'react-hot-toast';
import styles from './DocumentViewerPage.module.css';
import { FaDownload, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

// Q&A Chat Component
const DocumentQnA = ({ docId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await documentService.askQuestionOnDocument(docId, input);
            const aiMessage = { sender: 'ai', text: response.data.answer };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { sender: 'ai', text: 'Sorry, I could not get an answer.' };
            setMessages(prev => [...prev, errorMessage]);
            toast.error(error.response?.data?.message || "Failed to get answer.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.qnaContainer}>
            <div className={styles.qnaHeader}>Chat with this Document</div>
            <div className={styles.qnaMessages}>
                {messages.map((msg, index) => (
                    <div key={index} className={`${styles.qnaMessage} ${styles[msg.sender]}`}>
                        {msg.text}
                    </div>
                ))}
                {isLoading && <div className={`${styles.qnaMessage} ${styles.ai}`}>Thinking...</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className={styles.qnaForm}>
                <input
                    type="text"
                    className={styles.qnaInput}
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" className="btn" disabled={isLoading}><FaPaperPlane /></button>
            </form>
        </div>
    );
};


const DocumentViewerPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentService.getDocumentById(id)
      .then(response => setDocument(response.data))
      .catch(error => toast.error("Could not load the document."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = (format) => { /* ... existing download logic ... */ };

  if (loading) return <div className="container"><h2>Loading Document...</h2></div>;
  if (!document) return <div className="container"><h2>Document not found.</h2></div>;

  return (
    <div className={`container ${styles.viewerContainer}`}>
      <Link to="/" className="btn btn--secondary" style={{ marginBottom: '2rem' }}>
        <FaArrowLeft /> Back to Dashboard
      </Link>
      
      <div className={styles.viewerHeader}>
        <h1>{document.originalName}</h1>
        <p><strong>Classification:</strong> {document.classification} ({document.confidenceScore}%)</p>
      </div>

      <div className={styles.viewerGrid}>
        <div>
            <div className={styles.textContainer}>
                <h3>Extracted Text</h3>
                <textarea 
                    className={styles.extractedText}
                    value={document.extractedText}
                    readOnly
                />
            </div>
            <div className={`card ${styles.downloadSection}`}>
                {/* ... existing download section ... */}
            </div>
        </div>
        <div>
            <DocumentQnA docId={document._id} />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerPage;