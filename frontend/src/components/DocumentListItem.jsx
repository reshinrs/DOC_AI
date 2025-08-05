import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    FaFilePdf, FaFileWord, FaFileImage, FaFileAlt, FaChevronDown, FaTrash,
    FaSync, FaTags, FaBalanceScale, FaEye, FaAlignLeft,
    FaSmile, FaMeh, FaFrown, FaInfoCircle, FaFileDownload
} from 'react-icons/fa';

import documentService from '../services/documentService';
import WorkflowProgressBar from './WorkflowProgressBar';
import CompareModal from './CompareModal';
import InfoModal from './InfoModal';
import styles from './DocumentListItem.module.css';
import { useDocuments } from '../context/DocumentContext';
import { formatDate } from '../utils/formatDate'; // Import our new function

const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -50 }
};

const DocumentListItem = ({ document }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState('');
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const { documents } = useDocuments();

    const getFileIcon = (fileType) => {
        if (fileType.includes('pdf')) return <FaFilePdf color="#dc3545" />;
        if (fileType.includes('word')) return <FaFileWord color="#007bff" />;
        if (fileType.includes('image')) return <FaFileImage color="#28a745" />;
        return <FaFileAlt />;
    };

    const getStatusStyle = (status) => {
        if (status.includes('Pending') || status === 'Ingested') return { backgroundColor: '#e9ecef', color: '#495057' };
        if (status.includes('Extracted') || status.includes('Classified') || status.includes('Analyzed')) return { backgroundColor: '#d1ecf1', color: '#0c5460' };
        if (status === 'Routed') return { backgroundColor: '#d4edda', color: '#155724' };
        if (status === 'Failed') return { backgroundColor: '#f8d7da', color: '#721c24' };
        return {};
    };

    const getSentimentIcon = (sentiment) => {
        if (sentiment === 'Positive') {
            return <span className={styles.sentimentIndicator} style={{ color: 'var(--success-color)' }}><FaSmile /> Positive</span>;
        }
        if (sentiment === 'Negative') {
            return <span className={styles.sentimentIndicator} style={{ color: 'var(--danger-color)' }}><FaFrown /> Negative</span>;
        }
        if (sentiment === 'Neutral') {
            return <span className={styles.sentimentIndicator} style={{ color: 'var(--text-color-light)' }}><FaMeh /> Neutral</span>;
        }
        return <span className={styles.sentimentIndicator}>N/A</span>;
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${document.originalName}"?`)) {
            handleAction(documentService.deleteDocument, 'Deletion request sent.', 'Deletion failed.');
        }
    };

    const handleSummarize = (e) => {
        e.stopPropagation();
        setIsSummarizing(true);
        documentService.summarizeDocument(document._id)
            .then(response => setSummary(response.data.summary))
            .catch(err => toast.error(err.response?.data?.message || "Summarization failed."))
            .finally(() => setIsSummarizing(false));
    };

    const handleDownloadReport = (e) => {
        e.stopPropagation();
        toast.promise(
            documentService.downloadReport(document._id, document.originalName),
            {
                loading: 'Generating report...',
                success: 'Report download started!',
                error: 'Failed to generate report.',
            }
        );
    };

    const handleAction = (action, successMsg, errorMsg, ...args) => {
        const toastId = toast.loading('Sending request...');
        action(document._id, ...args)
            .then(() => toast.success(successMsg, { id: toastId }))
            .catch(err => toast.error(err.response?.data?.message || errorMsg, { id: toastId }));
    };

    const handleOpenCompareModal = (e) => {
        e.stopPropagation();
        setIsCompareModalOpen(true);
    };

    const handleClearComparison = (e) => {
        e.stopPropagation();
        handleAction(documentService.clearComparisonResults, "Comparison results cleared.", "Failed to clear results.");
    };

    const isProcessed = ['Classified', 'Analyzed', 'Routed'].includes(document.status);

    return (
        <>
            {isCompareModalOpen && (
                <CompareModal
                    sourceDoc={document}
                    allDocs={documents}
                    onClose={() => setIsCompareModalOpen(false)}
                />
            )}
            {isInfoModalOpen && (
                <InfoModal
                    document={document}
                    onClose={() => setIsInfoModalOpen(false)}
                />
            )}

            <motion.div
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={`${styles.docItem} ${isExpanded ? styles.expanded : ''}`}
            >
                <div className={styles.summary} onClick={() => setIsExpanded(!isExpanded)}>
                    <div className={styles.docName}>
                        {getFileIcon(document.fileType)} {document.originalName}
                    </div>
                    <div className={styles.sentiment}>{getSentimentIcon(document.sentiment)}</div>
                    <div className={styles.docType}>{document.classification}</div>
                    <div>
                        <span className={styles.docStatus} style={getStatusStyle(document.status)}>
                            {document.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                    <div className={styles.docDate}>
                        {formatDate(document.updatedAt)}
                    </div>
                    <div className={styles.expandIcon}><FaChevronDown /></div>
                </div>

                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={styles.details}
                    >
                        <WorkflowProgressBar document={document} />

                        {document.similarityResults?.length > 0 && (
                            <div className={styles.resultsSection}>
                                <div className={styles.resultsHeader}>
                                    <h4>Comparison Results</h4>
                                    <button onClick={handleClearComparison} className={styles.clearBtn}>Clear</button>
                                </div>
                                {document.similarityResults.map(result => (
                                    <div key={result.comparedDocId} className={styles.resultItem}>
                                        vs {result.comparedDocName}: <strong>{result.similarityScore}% similar</strong>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(isSummarizing || summary) && (
                            <div className={styles.summarySection}>
                                <h4>AI Summary</h4>
                                {isSummarizing
                                    ? <p>Generating summary...</p>
                                    : <p className={styles.summaryText}>{summary}</p>}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button
                                className={`btn ${styles.actionBtn}`}
                                onClick={handleSummarize}
                                disabled={isSummarizing}
                                style={{ backgroundColor: 'var(--success-color)' }}
                            >
                                <FaAlignLeft /> Summarize
                            </button>
                            <button
                                className={`btn btn--secondary ${styles.actionBtn}`}
                                onClick={handleOpenCompareModal}
                            >
                                <FaBalanceScale /> Compare
                            </button>
                            <Link
                                to={`/document/${document._id}`}
                                className={`btn ${styles.actionBtn}`}
                                style={{ backgroundColor: 'var(--info-color)' }}
                            >
                                <FaEye /> View Text
                            </Link>
                            <button
                                className={`btn btn--secondary ${styles.actionBtn}`}
                                onClick={(e) => { e.stopPropagation(); handleAction(documentService.reExtract, 'Re-extraction started!', 'Failed.') }}
                            >
                                <FaSync /> Re-Extract
                            </button>
                            <button
                                className={`btn btn--secondary ${styles.actionBtn}`}
                                onClick={(e) => { e.stopPropagation(); handleAction(documentService.reClassify, 'Re-classification started!', 'Failed.') }}
                            >
                                <FaTags /> Re-Classify
                            </button>
                            <button
                                className={`btn btn--danger ${styles.actionBtn}`}
                                onClick={handleDelete}
                            >
                                <FaTrash /> Delete
                            </button>
                            <button
                                className={`btn ${styles.actionBtn}`}
                                onClick={(e) => { e.stopPropagation(); setIsInfoModalOpen(true); }}
                                style={{ backgroundColor: '#6c757d' }}
                            >
                                <FaInfoCircle /> More Info
                            </button>
                            <button
                                className={`btn ${styles.actionBtn}`}
                                onClick={handleDownloadReport}
                                disabled={!isProcessed}
                                title={isProcessed ? "Download PDF Report" : "Document must be processed first"}
                                style={{ backgroundColor: '#20c997' }}
                            >
                                <FaFileDownload /> Report
                            </button>
                        </div>

                        <div className={styles.logContainer}>
                            {document.logs?.slice().reverse().map(log => (
                                <div key={log._id || log.timestamp} className={styles.logItem}>
                                    <span className={styles.logTimestamp}>
                                        [{new Date(log.timestamp).toLocaleTimeString()}]
                                    </span>{log.message}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </>
    );
};

export default DocumentListItem;