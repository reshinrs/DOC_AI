import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import documentService from '../services/documentService';
import styles from './UploadPanel.module.css';
import { FaUpload, FaEnvelope } from 'react-icons/fa';

const UploadPanel = () => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      return;
    }
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('document', file);

    const toastId = toast.loading(`Uploading ${file.name}...`);

    documentService.uploadDocument(formData)
      .then(response => {
        toast.success(`"${response.data.originalName}" uploaded successfully. Processing has begun.`, { id: toastId });
      })
      .catch(error => {
        toast.error(error.response?.data?.message || 'Upload failed.', { id: toastId });
      });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    }
  });

  return (
    <div className={`card ${styles.uploadPanel}`}>
      <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}>
        <input {...getInputProps()} />
        <FaUpload className={styles.dropzoneIcon} />
        {isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>Drag 'n' drop a file here, or click to select a file</p>
        )}
        <p style={{fontSize: 'var(--small-font-size)', color: 'var(--text-color-light)', marginTop: '0.5rem'}}>
          Supports: PDF, DOCX, PNG, JPG
        </p>
      </div>
      <button className={`btn ${styles.mailButton}`} onClick={() => toast.success('Mailbox connection coming soon!')}>
        <FaEnvelope /> Connect Mailbox
      </button>
    </div>
  );
};

export default UploadPanel;