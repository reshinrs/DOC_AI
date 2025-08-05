import axios from 'axios';
import fileSaver from 'file-saver';

const API_URL = 'http://localhost:5000/api/documents';

/**
 * Fetches documents from the API with options for pagination, filtering, searching, and sorting.
 * @param {object} options - The options for fetching documents.
 * @param {number} [options.page=1] - The page number to fetch.
 * @param {string} [options.filter='all'] - The filter to apply (e.g., 'all', 'needsReview', 'Invoice').
 * @param {string} [options.search=''] - The search term to filter documents by name.
 * @param {string} [options.sortBy='createdAt'] - The field to sort by.
 * @param {string} [options.sortOrder='desc'] - The sort order ('asc' or 'desc').
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const getDocuments = (options = {}) => {
    const {
        page = 1,
        filter = 'all',
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const params = new URLSearchParams({ page, filter, search, sortBy, sortOrder });
    return axios.get(`${API_URL}?${params.toString()}`);
};

/**
 * Fetches a single document by its ID.
 * @param {string} id - The ID of the document.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const getDocumentById = (id) => {
    return axios.get(`${API_URL}/${id}`);
};

/**
 * Uploads a new document.
 * @param {FormData} formData - The form data containing the file.
 * @param {function} onUploadProgress - The callback function to track upload progress.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const uploadDocument = (formData, onUploadProgress) => {
    return axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
    });
};

/**
 * Deletes a document by its ID.
 * @param {string} id - The ID of the document to delete.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const deleteDocument = (id) => {
    return axios.delete(`${API_URL}/${id}`);
};

/**
 * Requests a summary for a document.
 * @param {string} id - The ID of the document to summarize.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const summarizeDocument = (id) => {
    return axios.post(`${API_URL}/${id}/summarize`);
};

/**
 * Asks a question about a specific document.
 * @param {string} id - The ID of the document.
 * @param {string} question - The question to ask.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const askQuestionOnDocument = (id, question) => {
    return axios.post(`${API_URL}/${id}/ask`, { question });
};

/**
 * Triggers the re-extraction process for a document.
 * @param {string} id - The ID of the document.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const reExtract = (id) => {
    return axios.post(`${API_URL}/${id}/re-extract`);
};

/**
 * Triggers the re-classification process for a document.
 * @param {string} id - The ID of the document.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const reClassify = (id) => {
    return axios.post(`${API_URL}/${id}/re-classify`);
};

/**
 * Compares a source document with a list of other documents.
 * @param {string} id - The ID of the source document.
 * @param {string[]} compareWithIds - An array of document IDs to compare against.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const compareDocuments = (id, compareWithIds) => {
    return axios.post(`${API_URL}/${id}/compare`, { compareWithIds });
};

/**
 * Clears the comparison results from a document.
 * @param {string} id - The ID of the document.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios promise.
 */
const clearComparisonResults = (id) => {
    return axios.delete(`${API_URL}/${id}/compare`);
};

/**
 * Converts a document's extracted text to a specified format and downloads it.
 * @param {string} id - The ID of the document.
 * @param {string} [format='txt'] - The target format ('txt' or 'docx').
 */
const convertAndDownload = async (id, format = 'txt') => {
    const response = await axios.get(`${API_URL}/${id}/convert?format=${format}`, {
        responseType: 'blob',
    });

    let blobType = 'text/plain;charset=utf-8';
    if (format === 'docx') {
        blobType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    const blob = new Blob([response.data], { type: blobType });

    // Extract filename from content-disposition header, or create a default one.
    const docName =
        response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') ||
        `document.${format}`;

    fileSaver.saveAs(blob, docName);
};

/**
 * Generates and downloads a PDF analysis report for a document.
 * @param {string} id - The ID of the document.
 * @param {string} originalName - The original name of the document for the report filename.
 */
const downloadReport = async (id, originalName) => {
    const response = await axios.get(`${API_URL}/${id}/report`, {
        responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const fileName = `Report-${originalName}.pdf`;
    fileSaver.saveAs(blob, fileName);
};

// Export all functions as a single service object.
const documentService = {
    getDocuments,
    getDocumentById,
    uploadDocument,
    deleteDocument,
    summarizeDocument,
    askQuestionOnDocument,
    reExtract,
    reClassify,
    compareDocuments,
    clearComparisonResults,
    convertAndDownload,
    downloadReport,
};

export default documentService;