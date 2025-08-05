import React from 'react';
import styles from './CompareModal.module.css';
import { formatBytes } from '../utils/formatBytes';
import { formatDate } from '../utils/formatDate'; // Import our new function

const InfoModal = ({ document, onClose }) => {
    const hasStructuredData = document.structuredData && Object.keys(document.structuredData).length > 0 && !document.structuredData.error;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={`${styles.modalContent} ${styles.infoModalContent}`} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Document Details</h3>
                    <button onClick={onClose} className={styles.closeButton}>&times;</button>
                </div>

                {/* Structured Data */}
                {hasStructuredData && (
                    <div className={styles.infoSection}>
                        <h4>Extracted Structured Data</h4>
                        <div className={styles.infoGrid}>
                            {Object.entries(document.structuredData).map(([key, value]) => (
                                <div className={styles.infoItem} key={key}>
                                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
                                    <span>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className={styles.infoSection}>
                    <h4>Metadata</h4>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <strong>Original Name</strong>
                            <span>{document.originalName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <strong>File Type</strong>
                            <span>{document.fileType}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <strong>File Size</strong>
                            <span>{formatBytes(document.fileSize)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <strong>Uploaded On</strong>
                            <span>{formatDate(document.createdAt)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <strong>Last Status Update</strong>
                            <span>{formatDate(document.updatedAt)}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <strong>Classification</strong>
                            <span>{document.classification} ({document.confidenceScore}%)</span>
                        </div>
                        <div className={styles.infoItem}>
                            <strong>Sentiment</strong>
                            <span>{document.sentiment}</span>
                        </div>
                    </div>
                </div>

                {/* Extracted Text */}
                <div className={styles.infoItemFull}>
                    <strong>Extracted Text (Snippet)</strong>
                    <p className={styles.snippet}>
                        {document.extractedText ? `${document.extractedText.substring(0, 300)}...` : 'No text extracted.'}
                    </p>
                </div>

                <div className={styles.modalActions}>
                    <button className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default InfoModal;