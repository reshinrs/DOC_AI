import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import documentService from '../services/documentService';
import { useAuth } from './AuthContext';

// Create the context
const DocumentContext = createContext();

// Custom hook to use the document context
export const useDocuments = () => useContext(DocumentContext);

// The provider component
export const DocumentProvider = ({ children }) => {
    const { user } = useAuth();

    // State for the documents list
    const [documents, setDocuments] = useState([]);
    // State for loading status
    const [loading, setLoading] = useState(true);
    // State for pagination details
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    // A single state object to hold all query parameters for the API
    const [queryOptions, setQueryOptions] = useState({
        page: 1,
        filter: 'all',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    /**
     * Fetches documents from the server based on the provided options.
     * This function is wrapped in useCallback to prevent re-creation on every render.
     */
    const fetchDocuments = useCallback((options) => {
        if (!user) {
            setDocuments([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        documentService.getDocuments(options)
            .then((response) => {
                setDocuments(response.data.documents);
                setPagination({
                    page: response.data.page,
                    totalPages: response.data.totalPages,
                });
            })
            .catch((error) => {
                console.error('Failed to fetch documents', error);
                toast.error('Could not load your documents.');
                setDocuments([]); // Clear documents on error
            })
            .finally(() => setLoading(false));
    }, [user]); // This function depends only on the user's auth state

    /**
     * This effect handles the initial data fetch and re-fetches whenever queryOptions change.
     * It also sets up the Socket.IO connection for real-time updates.
     */
    useEffect(() => {
        if (!user) return; // Don't do anything if there is no user

        // Fetch documents whenever the user or query options change
        fetchDocuments(queryOptions);

        // Set up Socket.IO connection
        const socket = io('http://localhost:5000');

        // Handler for real-time updates to a document
        const handleDocumentUpdate = () => {
            // Refetch with the current options to keep the view consistent
            fetchDocuments(queryOptions);
        };

        // Handler for real-time document deletions
        const handleDocumentDelete = () => {
            toast.success('A document was deleted. Refreshing list...');
            fetchDocuments(queryOptions);
        };

        socket.on('document_updated', handleDocumentUpdate);
        socket.on('document_deleted', handleDocumentDelete);

        // Cleanup function to disconnect the socket when the component unmounts
        return () => {
            socket.off('document_updated', handleDocumentUpdate);
            socket.off('document_deleted', handleDocumentDelete);
            socket.disconnect();
        };
    }, [user, queryOptions, fetchDocuments]);

    /**
     * Updates the query options (filter, search, sort) and resets the page to 1
     * to ensure the user starts from the beginning of the new query results.
     * @param {object} newOptions - The new query options to apply.
     */
    const updateQueryOptions = (newOptions) => {
        setQueryOptions((prev) => ({
            ...prev,
            ...newOptions,
            page: 1, // Reset to page 1 on any filter/sort/search change
        }));
    };

    /**
     * Navigates to a specific page number.
     * @param {number} page - The page number to navigate to.
     */
    const goToPage = (page) => {
        if (page > 0 && page <= pagination.totalPages) {
            setQueryOptions((prev) => ({ ...prev, page }));
        }
    };
    
    /**
     * A function to manually trigger a refresh of the documents list.
     */
    const refreshDocuments = () => {
        fetchDocuments(queryOptions);
    };

    // The value provided to the context consumers
    const value = {
        documents,
        loading,
        pagination,
        queryOptions,
        updateQueryOptions,
        goToPage,
        refreshDocuments,
    };

    return (
        <DocumentContext.Provider value={value}>
            {children}
        </DocumentContext.Provider>
    );
};