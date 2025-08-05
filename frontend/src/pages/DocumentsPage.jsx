import React, { useState, useEffect } from 'react';
import { DocumentProvider, useDocuments } from '../context/DocumentContext';
import DocumentList from '../components/DocumentList';
import Chatbot from '../components/Chatbot';
import StatCard from '../components/StatCard';
import analyticsService from '../services/analyticsService';
import { FaFileAlt, FaExclamationTriangle, FaCalendarCheck, FaSearch, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import styles from './DocumentsPage.module.css';

/**
 * Pagination controls component.
 */
const Pagination = () => {
    const { pagination, goToPage, loading } = useDocuments();
    const { page, totalPages } = pagination;

    if (totalPages <= 1) return null;

    return (
        <div className={styles.paginationControls}>
            <button className="btn" onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading}>Previous</button>
            <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
            <button className="btn" onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading}>Next</button>
        </div>
    );
};

/**
 * Displays key statistics and acts as a high-level filter.
 */
const DashboardStats = () => {
    const [stats, setStats] = useState(null);
    const { queryOptions, updateQueryOptions } = useDocuments();

    useEffect(() => {
        analyticsService.getDashboardStats()
            .then(response => setStats(response.data))
            .catch(error => console.error("Could not load stats", error));
    }, []);

    if (!stats) return <div className={styles.statsGrid}>Loading stats...</div>;

    const statCards = [
        { title: "All Documents", value: stats.totalDocuments, filter: 'all', icon: <FaFileAlt />, color: "var(--primary-color)" },
        { title: "Needs Review", value: stats.needsReview, filter: 'needsReview', icon: <FaExclamationTriangle />, color: "var(--warning-color)" },
        { title: "Processed Today", value: stats.processedToday, filter: 'processedToday', icon: <FaCalendarCheck />, color: "var(--success-color)" }
    ];

    return (
        <div className={styles.statsGrid}>
            {statCards.map(card => (
                <StatCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={card.icon}
                    color={card.color}
                    onClick={() => updateQueryOptions({ filter: card.filter })}
                    isActive={queryOptions.filter === card.filter}
                />
            ))}
        </div>
    );
};

/**
 * Toolbar with search and sort controls.
 */
const Toolbar = () => {
    const { queryOptions, updateQueryOptions } = useDocuments();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        updateQueryOptions({ search: searchTerm });
    };
    
    const handleSort = (sortBy) => {
        const sortOrder = queryOptions.sortBy === sortBy && queryOptions.sortOrder === 'asc' ? 'desc' : 'asc';
        updateQueryOptions({ sortBy, sortOrder });
    };

    const sortFields = [
        { key: 'createdAt', name: 'Date' },
        { key: 'originalName', name: 'Name' },
        { key: 'fileSize', name: 'Size' },
    ];

    return (
        <div className={styles.toolbar}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <button type="submit" className={`btn ${styles.searchButton}`}><FaSearch /></button>
            </form>
            <div className={styles.sortControls}>
                <span>Sort by:</span>
                {sortFields.map(field => (
                    <button key={field.key} className="btn" onClick={() => handleSort(field.key)}>
                        {field.name}
                        {queryOptions.sortBy === field.key && (
                            queryOptions.sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * Main content area for the documents page.
 */
const DocumentsContent = () => {
    return (
        <div className="container">
            <h1 className="section__title">My Documents</h1>
            <DashboardStats />
            <div className={`card ${styles.listSection}`}>
                <div className={styles.listHeader}>
                    <h2 className={styles.sectionTitle}>Document Workflow</h2>
                    <Toolbar />
                </div>
                <DocumentList />
                <Pagination />
            </div>
            <Chatbot />
        </div>
    );
};

/**
 * The main page component, wrapping content with the DocumentProvider.
 */
const DocumentsPage = () => {
    return (
        <DocumentProvider>
            <DocumentsContent />
        </DocumentProvider>
    );
};

export default DocumentsPage;