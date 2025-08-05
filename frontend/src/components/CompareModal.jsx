import React, { useState } from 'react';
import toast from 'react-hot-toast';
import documentService from '../services/documentService';
import styles from './CompareModal.module.css';

const CompareModal = ({ sourceDoc, allDocs, onClose }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  const handleSelect = (docId) => {
    setSelectedIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleRunComparison = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one document to compare.");
      return;
    }
    const toastId = toast.loading("Running comparison...");
    documentService.compareDocuments(sourceDoc._id, selectedIds)
      .then(() => {
        toast.success("Comparison process started!", { id: toastId });
        onClose();
      })
      .catch(err => {
        toast.error(err.response?.data?.message || "Comparison failed.", { id: toastId });
      });
  };

  const targetDocs = allDocs.filter(doc => doc._id !== sourceDoc._id);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Compare with...</h3>
          <button onClick={onClose} className={styles.closeButton}>&times;</button>
        </div>
        <p>Select documents to compare with <strong>{sourceDoc.originalName}</strong></p>
        <div className={styles.docList}>
          {targetDocs.length > 0 ? (
            targetDocs.map(doc => (
              <label key={doc._id} className={styles.docItem}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(doc._id)}
                  onChange={() => handleSelect(doc._id)}
                />
                {doc.originalName}
              </label>
            ))
          ) : (
            <p>No other documents available to compare.</p>
          )}
        </div>
        <div className={styles.modalActions}>
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleRunComparison} disabled={selectedIds.length === 0}>
            Run Comparison
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;