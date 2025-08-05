import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaLightbulb } from 'react-icons/fa';
import styles from './ATSCheckerPage.module.css';
import resumeService from '../services/resumeService';
import UploadPanel from '../components/UploadPanel'; // Re-using the uploader

const ATSCheckerPage = () => {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length === 0) return;
        
        const file = acceptedFiles[0];
        const formData = new FormData();
        formData.append('resume', file);

        setIsLoading(true);
        setAnalysis(null);
        const toastId = toast.loading(`Analyzing ${file.name}...`);

        resumeService.analyzeResume(formData)
            .then(response => {
                setAnalysis(response.data);
                toast.success("Analysis Complete!", { id: toastId });
            })
            .catch(error => {
                toast.error(error.response?.data?.message || 'Analysis failed.', { id: toastId });
            })
            .finally(() => setIsLoading(false));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        }
    });
    
    return (
        <div className={`container ${styles.atsContainer}`}>
            <h1 className="section__title">ATS Resume Checker</h1>
            
            {!analysis && (
                <div className={`card ${styles.uploadSection}`}>
                    <p style={{textAlign: 'center', marginBottom: '1rem'}}>Upload your resume (PDF or DOCX) to get an instant analysis of its compatibility with Applicant Tracking Systems.</p>
                    <UploadPanel onDrop={onDrop} customText="Drag & drop your resume here, or click to select" />
                </div>
            )}
            
            {isLoading && <p style={{textAlign: 'center'}}>Analyzing... This may take a moment.</p>}
            
            {analysis && (
                <div className={styles.resultsDashboard}>
                    <div className={`card ${styles.scoreCard}`}>
                        <h3>Overall ATS Compatibility</h3>
                        <div className={styles.scoreCircle} style={{background: `conic-gradient(var(--primary-color) ${analysis.overallScore * 3.6}deg, var(--border-color) 0deg)`}}>
                            <span>{analysis.overallScore}%</span>
                        </div>
                        <p className={styles.summaryText}>{analysis.summary}</p>
                    </div>

                    <div className={`card ${styles.analysisCard}`}>
                        <h3>Detailed Breakdown</h3>
                        <ul>
                            {analysis.analysis.map(item => (
                                <li key={item.criteria} className={styles.analysisItem}>
                                    {item.pass ? 
                                        <FaCheckCircle className={styles.analysisIcon} color="var(--success-color)" /> : 
                                        <FaTimesCircle className={styles.analysisIcon} color="var(--danger-color)" />
                                    }
                                    <div className={styles.analysisContent}>
                                        <h4>{item.criteria}</h4>
                                        <p>{item.feedback}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className={`card ${styles.suggestionsCard}`}>
                        <h3><FaLightbulb /> Suggestions for Improvement</h3>
                        <ul>
                            {analysis.suggestions.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ATSCheckerPage;