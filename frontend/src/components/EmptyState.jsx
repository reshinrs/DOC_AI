import React from 'react';
import styles from './EmptyState.module.css';

// This is a simple SVG illustration component.
const EmptyIllustration = () => (
    <svg className={styles.illustration} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <path d="M25,35 L95,35" stroke="var(--text-color-light)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M25,50 L95,50" stroke="var(--text-color-light)" strokeWidth="2" strokeLinecap="round"/>
        <path d="M25,65 L75,65" stroke="var(--text-color-light)" strokeWidth="2" strokeLinecap="round"/>
        <rect x="15" y="20" width="90" height="80" rx="8" ry="8" fill="none" stroke="var(--text-color)" strokeWidth="3"/>
        <circle cx="85" cy="85" r="15" fill="var(--primary-color)"/>
        <path d="M80,85 L84,89 L90,81" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


const EmptyState = ({ title, message }) => {
  return (
    <div className={styles.emptyState}>
      <EmptyIllustration />
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default EmptyState;