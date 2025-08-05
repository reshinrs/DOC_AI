import React from 'react';
import styles from './DocumentListItemSkeleton.module.css';

const DocumentListItemSkeleton = () => {
  return (
    <div className={styles.skeleton}>
      <div className={styles.namePlaceholder}>
        <div className={`${styles.placeholder} ${styles.icon}`}></div>
        <div className={`${styles.placeholder} ${styles.text}`}></div>
      </div>
      <div className={`${styles.placeholder} ${styles.tag}`}></div>
      <div className={`${styles.placeholder} ${styles.tag}`}></div>
      <div className={`${styles.placeholder} ${styles.tag}`}></div>
      <div className={`${styles.placeholder} ${styles.date}`}></div>
      <div className={`${styles.placeholder} ${styles.icon}`} style={{width: '20px', height: '20px'}}></div>
    </div>
  );
};

export default DocumentListItemSkeleton;