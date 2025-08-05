import React from 'react';
import UploadPanel from '../components/UploadPanel';

const UploadPage = () => {
  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="section__title">Ingest New Document</h1>
      <div className="card">
        <UploadPanel />
      </div>
    </div>
  );
};

export default UploadPage;