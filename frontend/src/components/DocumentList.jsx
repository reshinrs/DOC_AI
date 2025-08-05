import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDocuments } from '../context/DocumentContext';
import DocumentListItem from './DocumentListItem';
import DocumentListItemSkeleton from './DocumentListItemSkeleton';
import EmptyState from './EmptyState';

const DocumentList = () => {
  const { documents, loading } = useDocuments();

  if (loading) {
    // Show 5 skeleton loaders while fetching documents
    return (
      <div>
        {[...Array(5)].map((_, index) => (
          <DocumentListItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    // Show an empty state message if no documents are found
    return (
      <EmptyState
        title="No Documents Yet"
        message="Upload your first document to begin processing. Drag and drop a file into the panel on the left."
      />
    );
  }

  // Render the list of documents with animation support
  return (
    <div>
      <AnimatePresence>
        {documents.map((doc) => (
          <DocumentListItem key={doc._id} document={doc} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default DocumentList;
